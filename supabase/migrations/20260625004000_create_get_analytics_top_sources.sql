-- =============================================================================
-- Phase 4C-C — RPC « sources / réseaux sociaux » des visiteurs.
--
-- Ajoute UNIQUEMENT une fonction de lecture admin agrégeant analytics_events
-- par source normalisée (la normalisation est faite côté front : seules les
-- valeurs de la whitelist sont stockées — jamais d'URL referrer, de hostname
-- brut ni de query string).
--
-- Sécurité / RLS :
--   * SECURITY DEFINER + contrôle interne is_admin_or_super_admin() ;
--   * GRANT EXECUTE à authenticated uniquement ;
--   * AUCUNE table modifiée, AUCUNE policy RLS modifiée.
--
-- ⚠️ NE PAS APPLIQUER en production sans validation manuelle (SQL Editor).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_analytics_top_sources(
  _days integer DEFAULT 30,
  _limit integer DEFAULT 10
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

  -- Fenêtre bornée à [1, 365] jours.
  v_threshold := now() - make_interval(days => LEAST(GREATEST(COALESCE(_days, 30), 1), 365));

  -- Sessions distinctes par source (un visiteur = une session ne compte qu'une
  -- fois par source, même avec plusieurs événements). source NULL → 'unknown'.
  RETURN QUERY
  SELECT
    COALESCE(ae.source, 'unknown')        AS label,
    COUNT(DISTINCT ae.session_id)::integer AS value
  FROM public.analytics_events ae
  WHERE ae.created_at >= v_threshold
  GROUP BY COALESCE(ae.source, 'unknown')
  ORDER BY COUNT(DISTINCT ae.session_id) DESC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 10), 1), 50);
END;
$$;

REVOKE ALL ON FUNCTION public.get_analytics_top_sources(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_analytics_top_sources(integer, integer) TO authenticated;
