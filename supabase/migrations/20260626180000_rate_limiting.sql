-- =============================================================================
-- Performance & Protection — Phase A2 (A2.1 + A2.2) : Rate limiting prudent.
--
-- Périmètre :
--   * A2.1 : record_analytics_event → 60 événements / 60 s / session_id,
--            dépassement SILENCIEUX (aucune exception, aucun impact UX) ;
--   * A2.2 : bourse_rentree_waitlist → 5 soumissions / heure / téléphone
--            normalisé, dépassement = exception propre (mappée côté front).
--
-- Mécanique : table compteur « fenêtre fixe » + helper SECURITY DEFINER, appelés
-- UNIQUEMENT depuis des fonctions/triggers SECURITY DEFINER (jamais exposés à
-- anon/authenticated). AUCUNE IP collectée — clés = session_id / téléphone.
--
-- Contraintes respectées :
--   * AUCUNE policy RLS existante modifiée ;
--   * AUCUN flux tontine/paiement/membre modifié ;
--   * generate-receipt NON touché (A2.3 différé).
--
-- ⚠️ NE PAS APPLIQUER en production sans validation manuelle (SQL Editor).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table compteur de rate limiting (verrouillée).
--    RLS activée, AUCUNE policy directe → accès uniquement via rl_check
--    (SECURITY DEFINER). Aucun grant à anon/authenticated.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket       text        NOT NULL,
  window_start timestamptz NOT NULL,
  count        integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM PUBLIC;

-- -----------------------------------------------------------------------------
-- 2. Helper rate limiting (fenêtre fixe). Renvoie true si la requête est
--    AUTORISÉE (compteur <= _max), false si la limite est dépassée.
--    Fail-open sur paramètres invalides. Nettoyage opportuniste borné.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rl_check(
  _bucket text,
  _max integer,
  _window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window integer := GREATEST(COALESCE(_window_seconds, 60), 1);
  v_start  timestamptz;
  v_count  integer;
BEGIN
  IF _bucket IS NULL OR _max IS NULL OR _max < 1 THEN
    RETURN true; -- paramètres invalides : on n'impose pas de limite.
  END IF;

  -- Début de la fenêtre fixe courante (alignée sur _window_seconds).
  v_start := to_timestamp(floor(extract(epoch FROM now()) / v_window) * v_window);

  INSERT INTO public.rate_limits (bucket, window_start, count)
  VALUES (_bucket, v_start, 1)
  ON CONFLICT (bucket, window_start)
  DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO v_count;

  -- Purge opportuniste des fenêtres anciennes (table maintenue petite).
  DELETE FROM public.rate_limits
  WHERE window_start < now() - make_interval(secs => v_window * 5);

  RETURN v_count <= _max;
END;
$$;

-- rl_check ne doit JAMAIS être appelable directement par les clients (sinon on
-- pourrait gonfler le compteur d'autrui). On révoque PUBLIC *et* explicitement
-- anon/authenticated, car Supabase accorde EXECUTE par défaut à ces rôles sur
-- toute nouvelle fonction du schéma public. Les appels internes (RPC analytics,
-- trigger) restent valides via SECURITY DEFINER, indépendants de ces grants.
REVOKE ALL ON FUNCTION public.rl_check(text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rl_check(text, integer, integer) FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. A2.1 — record_analytics_event : ajout du garde rate limit.
--    Reproduction à l'identique de la fonction existante + garde SILENCIEUX.
--    Grants inchangés (anon + authenticated).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_analytics_event(
  _session_id uuid,
  _event_type text,
  _path text DEFAULT NULL,
  _label text DEFAULT NULL,
  _source text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _session_id IS NULL THEN
    RAISE EXCEPTION 'Session id is required';
  END IF;

  IF _event_type IS NULL OR _event_type NOT IN ('page_view', 'click', 'conversion') THEN
    RAISE EXCEPTION 'Invalid event type';
  END IF;

  -- Rate limiting (A2.1) : 60 événements / 60 s par session.
  -- Dépassement = abandon SILENCIEUX (aucune exception, aucun impact UX).
  IF NOT public.rl_check('analytics:' || _session_id::text, 60, 60) THEN
    RETURN;
  END IF;

  INSERT INTO public.analytics_events (session_id, user_id, event_type, path, label, source)
  VALUES (
    _session_id,
    auth.uid(),
    _event_type,
    left(_path, 512),
    left(_label, 128),
    left(_source, 64)
  );

  -- Nettoyage : supprime les événements de plus de 90 jours (comportement
  -- existant conservé).
  DELETE FROM public.analytics_events
  WHERE created_at < now() - interval '90 days';
END;
$$;

REVOKE ALL ON FUNCTION public.record_analytics_event(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_analytics_event(uuid, text, text, text, text) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. A2.2 — Anti-spam Bourse Rentrée : trigger BEFORE INSERT.
--    5 soumissions / heure / téléphone normalisé. Dépassement = exception
--    'rate_limited' (ERRCODE P0001) mappée côté front en message propre.
--    Sans téléphone exploitable, aucune limite (les CHECK / anti-doublon
--    existants restent en place).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_bourse_waitlist_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone_digits text;
BEGIN
  v_phone_digits := nullif(regexp_replace(coalesce(NEW.phone, ''), '\D', '', 'g'), '');

  IF v_phone_digits IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT public.rl_check('waitlist:' || v_phone_digits, 5, 3600) THEN
    RAISE EXCEPTION 'rate_limited: too many waitlist submissions'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bourse_waitlist_rate_limit ON public.bourse_rentree_waitlist;
CREATE TRIGGER trg_bourse_waitlist_rate_limit
  BEFORE INSERT ON public.bourse_rentree_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_bourse_waitlist_rate_limit();
