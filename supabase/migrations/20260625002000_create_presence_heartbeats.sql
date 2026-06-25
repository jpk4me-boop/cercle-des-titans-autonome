-- =============================================================================
-- Phase 4B — Présence en ligne (membres + visiteurs), approche heartbeat.
--
-- Objectif : compter les membres et visiteurs « en ligne » sans tracking
-- intrusif, sans Realtime, sans donnée personnelle.
--
-- Principe :
--   * chaque navigateur génère un session_id ALÉATOIRE (UUID, stocké en
--     localStorage côté front) — aucune IP, aucun user-agent, aucun pays,
--     aucun fingerprint, aucune PII ;
--   * le front appelle record_presence(_session_id) toutes les ~60 s ;
--   * « en ligne » = un heartbeat reçu dans la fenêtre récente (5 min) ;
--   * un visiteur a user_id = NULL ; après connexion, le MÊME session_id voit
--     son user_id renseigné via auth.uid() → un membre n'est jamais compté
--     comme visiteur (pas de double comptage).
--
-- Sécurité / RLS :
--   * RLS ACTIVÉE sur la table, AUCUNE policy directe (table verrouillée) ;
--   * écriture uniquement via record_presence (SECURITY DEFINER) ;
--   * lecture uniquement via get_presence_counts (SECURITY DEFINER, admin) ;
--   * AUCUNE policy RLS existante n'est modifiée.
--
-- ⚠️ NE PAS APPLIQUER en production sans validation manuelle (SQL Editor).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table de heartbeats.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.presence_heartbeats (
  session_id   uuid PRIMARY KEY,
  user_id      uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presence_heartbeats_last_seen
  ON public.presence_heartbeats (last_seen_at);

CREATE INDEX IF NOT EXISTS idx_presence_heartbeats_user
  ON public.presence_heartbeats (user_id);

-- RLS activée mais AUCUNE policy : la table est totalement verrouillée pour
-- l'accès direct (anon/authenticated). Tout passe par les RPC SECURITY DEFINER
-- ci-dessous, dont le corps n'est pas soumis à la RLS.
ALTER TABLE public.presence_heartbeats ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2. RPC d'enregistrement de présence (membre OU visiteur anonyme).
--    Appelable par anon ET authenticated. user_id = auth.uid() (NULL si anon).
--    Prune opportuniste des heartbeats de plus de 1 jour (table reste petite).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_presence(_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _session_id IS NULL THEN
    RAISE EXCEPTION 'Session id is required';
  END IF;

  -- Upsert : on ne peut estampiller QUE sa propre ligne (clé = session_id
  -- fourni par l'appelant). user_id suit auth.uid() : NULL pour un visiteur,
  -- l'utilisateur pour un membre connecté → bascule visiteur→membre au login.
  INSERT INTO public.presence_heartbeats (session_id, user_id, last_seen_at)
  VALUES (_session_id, auth.uid(), now())
  ON CONFLICT (session_id) DO UPDATE
    SET user_id      = auth.uid(),
        last_seen_at = now();

  -- Nettoyage : supprime les heartbeats inactifs depuis plus de 1 jour.
  DELETE FROM public.presence_heartbeats
  WHERE last_seen_at < now() - interval '1 day';
END;
$$;

REVOKE ALL ON FUNCTION public.record_presence(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_presence(uuid) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. RPC de lecture des compteurs « en ligne » (admin/super_admin uniquement).
--    Renvoie une seule ligne : online_members, online_visitors.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_presence_counts(_window_minutes integer DEFAULT 5)
RETURNS TABLE (online_members integer, online_visitors integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_threshold timestamptz;
BEGIN
  IF NOT public.is_admin_or_super_admin() THEN
    RAISE EXCEPTION 'Only admins can read presence counts';
  END IF;

  -- Borne basse : fenêtre bornée à [1, 60] minutes pour éviter les abus.
  v_threshold := now() - make_interval(mins => LEAST(GREATEST(COALESCE(_window_minutes, 5), 1), 60));

  RETURN QUERY
  SELECT
    COUNT(DISTINCT ph.user_id) FILTER (WHERE ph.user_id IS NOT NULL)::integer AS online_members,
    COUNT(*) FILTER (WHERE ph.user_id IS NULL)::integer AS online_visitors
  FROM public.presence_heartbeats ph
  WHERE ph.last_seen_at >= v_threshold;
END;
$$;

REVOKE ALL ON FUNCTION public.get_presence_counts(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_presence_counts(integer) TO authenticated;
