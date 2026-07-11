-- ============================================================================
-- Phase J4 — Consentement CGU / Politique de confidentialité à l'inscription
--
-- Le serveur est AUTORITAIRE sur le cutoff et le statut de consentement :
-- * public.legal_consent_config : versions courantes + enforced_from (heure
--   serveur exacte d'application de la migration) ; aucune lecture client ;
-- * public.user_legal_consents : preuve immuable des consentements ;
-- * get_current_legal_consent_status() : statut calculé côté serveur
--   ('legacy' | 'granted' | 'missing') à partir de auth.uid() uniquement ;
-- * record_legal_consent(versions) : enregistrement contrôlé depuis la garde
--   (source serveur 'account_gate') ;
-- * trigger dédié sur auth.users : inscription e-mail (source serveur
--   'email_signup'), transparent sans marqueur, bloquant si un consentement
--   est déclaré sans preuve enregistrable.
--
-- Le trigger existant public.handle_new_user (création du profil) n'est PAS
-- modifié. Une future version juridique = nouvelle migration (mise à jour de
-- legal_consent_config) + nouvelles lignes de consentement, jamais de mise à
-- jour d'une ancienne acceptation.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Configuration juridique serveur (ligne unique, invisible des clients)
-- ----------------------------------------------------------------------------
CREATE TABLE public.legal_consent_config (
  id smallint PRIMARY KEY CHECK (id = 1),
  terms_version text NOT NULL,
  privacy_policy_version text NOT NULL,
  enforced_from timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.legal_consent_config IS
  'Configuration serveur du consentement juridique (ligne unique). enforced_from = heure serveur d''application de la migration : les comptes créés avant sont "legacy", ceux créés après doivent posséder une preuve. Table inaccessible aux rôles clients ; lue uniquement par les fonctions SECURITY DEFINER.';

-- enforced_from est posé par now() côté serveur au moment exact de l'application.
INSERT INTO public.legal_consent_config (id, terms_version, privacy_policy_version)
VALUES (1, '2026-07-11', '2026-07-11');

-- Aucune lecture/écriture client : ni anon, ni authenticated, ni PUBLIC.
ALTER TABLE public.legal_consent_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.legal_consent_config FROM PUBLIC;
REVOKE ALL ON public.legal_consent_config FROM anon;
REVOKE ALL ON public.legal_consent_config FROM authenticated;

-- ----------------------------------------------------------------------------
-- 2. Preuves de consentement (historique immuable)
-- ----------------------------------------------------------------------------
CREATE TABLE public.user_legal_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ON DELETE RESTRICT : la preuve juridique ne disparaît jamais silencieusement
  -- avec le compte. Une future suppression de compte devra suivre une procédure
  -- contrôlée de conservation ou d'anonymisation des preuves juridiquement
  -- nécessaires (procédure volontairement non créée dans cette phase).
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  terms_version text NOT NULL,
  privacy_policy_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  acceptance_source text NOT NULL
    CHECK (acceptance_source IN ('email_signup', 'account_gate')),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Idempotence : une seule acceptation par utilisateur et par couple de versions.
  UNIQUE (user_id, terms_version, privacy_policy_version)
);

COMMENT ON TABLE public.user_legal_consents IS
  'Historique immuable des consentements CGU / politique de confidentialité. Aucune mise à jour ni suppression applicative : une nouvelle version juridique crée une nouvelle ligne.';
COMMENT ON COLUMN public.user_legal_consents.accepted_at IS
  'Date serveur (now()) de l''acceptation. Jamais fournie par le client.';
COMMENT ON COLUMN public.user_legal_consents.acceptance_source IS
  'Parcours d''acceptation, imposé côté serveur : email_signup (trigger auth.users) ou account_gate (acceptation explicite depuis la garde, après authentification).';

-- Lecture par utilisateur (RLS) et jointures admin.
CREATE INDEX idx_user_legal_consents_user_id
  ON public.user_legal_consents (user_id);

-- RLS : lecture seule (soi-même ou admin). Aucune policy INSERT/UPDATE/DELETE
-- → toute écriture directe est refusée ; seules les fonctions SECURITY
-- DEFINER ci-dessous insèrent. L'historique est immuable côté applicatif.
ALTER TABLE public.user_legal_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own legal consents"
  ON public.user_legal_consents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Réutilise la fonction de rôle sécurisée existante (SECURITY DEFINER).
CREATE POLICY "Admins can view all legal consents"
  ON public.user_legal_consents
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_super_admin());

-- Permissions minimales : lecture seule pour authenticated, rien pour anon.
REVOKE ALL ON public.user_legal_consents FROM PUBLIC;
REVOKE ALL ON public.user_legal_consents FROM anon;
REVOKE ALL ON public.user_legal_consents FROM authenticated;
GRANT SELECT ON public.user_legal_consents TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. RPC de statut : le serveur calcule 'legacy' | 'granted' | 'missing'
--    à partir de auth.uid() uniquement. Aucun user_id client, aucun cutoff
--    côté navigateur, aucune fuite inter-utilisateurs (la policy admin ne
--    peut pas interférer : la requête est filtrée sur auth.uid()).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_legal_consent_status()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _uid uuid := auth.uid();
  _created timestamptz;
  _cfg public.legal_consent_config%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT created_at INTO _created
  FROM auth.users
  WHERE id = _uid;

  IF NOT FOUND OR _created IS NULL THEN
    RAISE EXCEPTION 'User not found or invalid';
  END IF;

  SELECT * INTO _cfg
  FROM public.legal_consent_config
  WHERE id = 1;

  IF NOT FOUND
     OR _cfg.terms_version IS NULL
     OR _cfg.privacy_policy_version IS NULL
     OR _cfg.enforced_from IS NULL THEN
    RAISE EXCEPTION 'Legal consent configuration missing or invalid';
  END IF;

  -- Compte antérieur à l'application de la phase : jamais bloqué.
  IF _created < _cfg.enforced_from THEN
    RETURN 'legacy';
  END IF;

  -- Preuve strictement personnelle (user_id = auth.uid()) pour les versions
  -- courantes de la configuration serveur.
  IF EXISTS (
    SELECT 1
    FROM public.user_legal_consents
    WHERE user_id = _uid
      AND terms_version = _cfg.terms_version
      AND privacy_policy_version = _cfg.privacy_policy_version
  ) THEN
    RETURN 'granted';
  END IF;

  RETURN 'missing';
END;
$$;

COMMENT ON FUNCTION public.get_current_legal_consent_status() IS
  'Statut de consentement de l''utilisateur courant, calculé côté serveur : legacy (compte antérieur à enforced_from), granted (preuve présente pour les versions courantes) ou missing. Erreur si non authentifié, utilisateur introuvable ou configuration absente.';

REVOKE ALL ON FUNCTION public.get_current_legal_consent_status() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_current_legal_consent_status() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_current_legal_consent_status() TO authenticated;

-- ----------------------------------------------------------------------------
-- 4. RPC d'enregistrement : acceptation explicite depuis la garde
--    (source serveur 'account_gate'). Aucune source ni user_id du client ;
--    versions comparées à la configuration serveur.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_legal_consent(
  _terms_version text,
  _privacy_policy_version text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _uid uuid := auth.uid();
  _cfg public.legal_consent_config%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO _cfg
  FROM public.legal_consent_config
  WHERE id = 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Legal consent configuration missing';
  END IF;

  -- Le client confirme les versions qu'il a affichées ; toute divergence avec
  -- la configuration serveur est refusée.
  IF _terms_version IS DISTINCT FROM _cfg.terms_version
     OR _privacy_policy_version IS DISTINCT FROM _cfg.privacy_policy_version THEN
    RAISE EXCEPTION 'Unsupported legal document version';
  END IF;

  -- Insertion idempotente : date now() serveur (défaut de colonne), source
  -- serveur fixe. Une acceptation déjà enregistrée n'est jamais modifiée.
  INSERT INTO public.user_legal_consents
    (user_id, terms_version, privacy_policy_version, acceptance_source)
  VALUES
    (_uid, _cfg.terms_version, _cfg.privacy_policy_version, 'account_gate')
  ON CONFLICT (user_id, terms_version, privacy_policy_version) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION public.record_legal_consent(text, text) IS
  'Enregistre le consentement de l''utilisateur courant (auth.uid(), date serveur, source account_gate). Idempotente ; versions strictement comparées à la configuration serveur.';

REVOKE ALL ON FUNCTION public.record_legal_consent(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_legal_consent(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_legal_consent(text, text) TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. Trigger dédié sur auth.users : inscription e-mail (avec ou sans
--    confirmation d'adresse). Lit raw_user_meta_data posé par signUp() et
--    compare aux versions courantes de la configuration serveur.
--
--    * aucun marqueur legal_consent (OAuth, imports, métadonnées étrangères)
--      → transparent, RETURN NEW sans erreur ;
--    * legal_consent = true mais versions ≠ configuration serveur
--      → EXCEPTION : le compte prétend avoir accepté sans preuve valide,
--        la création échoue ;
--    * échec de l'insertion de la preuve → l'exception remonte (aucun bloc
--      EXCEPTION global) : un compte déclarant un consentement n'est PAS
--      créé si la preuve ne peut pas être enregistrée.
--
--    Source imposée côté serveur ('email_signup') : les métadonnées ne
--    fournissent jamais la source. Totalement indépendant de
--    public.handle_new_user (profil), qu'il ne remplace ni ne modifie.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_legal_consent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  _cfg public.legal_consent_config%ROWTYPE;
BEGIN
  -- Pas de consentement déclaré : ne rien faire, ne rien bloquer.
  IF (_meta ->> 'legal_consent') IS DISTINCT FROM 'true' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO _cfg
  FROM public.legal_consent_config
  WHERE id = 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Legal consent configuration missing';
  END IF;

  -- Consentement déclaré : les versions doivent correspondre exactement à la
  -- configuration serveur, sinon la création du compte échoue.
  IF (_meta ->> 'terms_version') IS DISTINCT FROM _cfg.terms_version
     OR (_meta ->> 'privacy_policy_version') IS DISTINCT FROM _cfg.privacy_policy_version THEN
    RAISE EXCEPTION
      'Legal consent declared with missing or unsupported document versions';
  END IF;

  -- Preuve enregistrée avec date serveur et source imposée. ON CONFLICT
  -- assure l'idempotence ; toute autre erreur remonte et annule la création.
  INSERT INTO public.user_legal_consents
    (user_id, terms_version, privacy_policy_version, acceptance_source)
  VALUES
    (NEW.id, _cfg.terms_version, _cfg.privacy_policy_version, 'email_signup')
  ON CONFLICT (user_id, terms_version, privacy_policy_version) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user_legal_consent() IS
  'Enregistre le consentement CGU/confidentialité à la création du compte (inscription e-mail), comparé à la configuration serveur. Transparent sans marqueur legal_consent ; bloque la création si un consentement est déclaré mais que la preuve ne peut pas être enregistrée. Source imposée : email_signup.';

-- Fonction trigger : jamais appelable directement (ni RPC, ni SELECT client).
-- Aucun GRANT EXECUTE : seul le trigger sur auth.users l'exécute. Le privilège
-- EXECUTE est vérifié à la CRÉATION du trigger (par le rôle migrateur,
-- propriétaire de la fonction), pas au déclenchement : ces REVOKE ne bloquent
-- donc pas les insertions dans auth.users.
REVOKE ALL ON FUNCTION public.handle_new_user_legal_consent() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user_legal_consent() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user_legal_consent() FROM authenticated;

CREATE TRIGGER on_auth_user_created_legal_consent
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_legal_consent();
