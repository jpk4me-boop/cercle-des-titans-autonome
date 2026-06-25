-- =============================================================================
-- Phase 4C-A — Analytics visiteurs (infra + pages vues anonymes).
--
-- Objectif : enregistrer des événements analytics ANONYMES (pages vues pour
-- cette sous-phase) sans tracking intrusif, sans Realtime, sans donnée
-- personnelle, sans service externe.
--
-- Principe (identique à la Phase 4B présence) :
--   * le front réutilise le session_id ALÉATOIRE déjà présent en localStorage
--     (clé presence_session_id, UUID v4) — aucune IP, aucun user-agent, aucun
--     referrer brut, aucune query string, aucune PII ;
--   * le front appelle record_analytics_event(...) à chaque page vue ;
--   * user_id est déduit côté serveur via auth.uid() (NULL pour un visiteur).
--
-- Sécurité / RLS :
--   * RLS ACTIVÉE sur la table, AUCUNE policy directe (table verrouillée) ;
--   * écriture uniquement via record_analytics_event (SECURITY DEFINER) ;
--   * lecture uniquement via get_analytics_* (SECURITY DEFINER, admin) ;
--   * AUCUNE policy RLS existante n'est modifiée.
--
-- Données stockées : event_type (whitelist), path (pathname seul, sans query),
-- label (constante de code — non utilisée en 4C-A), source (non utilisée en
-- 4C-A), session_id anonyme, user_id éventuel, created_at.
--
-- ⚠️ NE PAS APPLIQUER en production sans validation manuelle (SQL Editor).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table d'événements analytics (unique, typée).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  user_id    uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  event_type text NOT NULL,
  path       text,
  label      text,
  source     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created
  ON public.analytics_events (created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created
  ON public.analytics_events (event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session
  ON public.analytics_events (session_id);

-- RLS activée mais AUCUNE policy : table totalement verrouillée pour l'accès
-- direct (anon/authenticated). Tout passe par les RPC SECURITY DEFINER.
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2. RPC d'enregistrement d'un événement (page vue en 4C-A ; click/conversion
--    déjà acceptés par la whitelist pour éviter une future migration).
--    Appelable par anon ET authenticated. user_id = auth.uid() (NULL si anon).
--    Prune opportuniste des événements de plus de 90 jours.
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

  -- Troncatures défensives (anti-abus) : on borne les longueurs côté serveur.
  INSERT INTO public.analytics_events (session_id, user_id, event_type, path, label, source)
  VALUES (
    _session_id,
    auth.uid(),
    _event_type,
    left(_path, 512),
    left(_label, 128),
    left(_source, 64)
  );

  -- Nettoyage : supprime les événements de plus de 90 jours.
  DELETE FROM public.analytics_events
  WHERE created_at < now() - interval '90 days';
END;
$$;

REVOKE ALL ON FUNCTION public.record_analytics_event(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_analytics_event(uuid, text, text, text, text) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. RPC de synthèse (admin/super_admin uniquement). Une seule ligne.
--    clicks / conversions = 0 tant que les sous-phases 4C-B / 4C-C ne sont pas
--    livrées (aucun événement de ce type) — c'est une valeur réelle, pas pending.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_analytics_overview(_days integer DEFAULT 30)
RETURNS TABLE (
  page_views      integer,
  unique_visitors integer,
  clicks          integer,
  conversions     integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_threshold timestamptz;
BEGIN
  IF NOT public.is_admin_or_super_admin() THEN
    RAISE EXCEPTION 'Only admins can read analytics';
  END IF;

  -- Fenêtre bornée à [1, 365] jours.
  v_threshold := now() - make_interval(days => LEAST(GREATEST(COALESCE(_days, 30), 1), 365));

  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE ae.event_type = 'page_view')::integer  AS page_views,
    COUNT(DISTINCT ae.session_id)::integer                        AS unique_visitors,
    COUNT(*) FILTER (WHERE ae.event_type = 'click')::integer      AS clicks,
    COUNT(*) FILTER (WHERE ae.event_type = 'conversion')::integer AS conversions
  FROM public.analytics_events ae
  WHERE ae.created_at >= v_threshold;
END;
$$;

REVOKE ALL ON FUNCTION public.get_analytics_overview(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_analytics_overview(integer) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. RPC « pages les plus vues » (admin/super_admin uniquement).
--    Renvoie label (= path) + value (nombre de vues), trié décroissant.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_analytics_top_pages(
  _days integer DEFAULT 30,
  _limit integer DEFAULT 5
)
RETURNS TABLE (label text, value integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_threshold timestamptz;
BEGIN
  IF NOT public.is_admin_or_super_admin() THEN
    RAISE EXCEPTION 'Only admins can read analytics';
  END IF;

  v_threshold := now() - make_interval(days => LEAST(GREATEST(COALESCE(_days, 30), 1), 365));

  RETURN QUERY
  SELECT
    COALESCE(ae.path, '(inconnu)') AS label,
    COUNT(*)::integer              AS value
  FROM public.analytics_events ae
  WHERE ae.event_type = 'page_view'
    AND ae.created_at >= v_threshold
  GROUP BY COALESCE(ae.path, '(inconnu)')
  ORDER BY COUNT(*) DESC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 5), 1), 50);
END;
$$;

REVOKE ALL ON FUNCTION public.get_analytics_top_pages(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_analytics_top_pages(integer, integer) TO authenticated;
