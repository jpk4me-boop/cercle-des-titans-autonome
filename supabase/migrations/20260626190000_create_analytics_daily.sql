-- =============================================================================
-- Phase Analytics C1 — Série temporelle quotidienne (graphiques 7 / 30 jours).
--
-- Objectif : alimenter les courbes admin (évolution visiteurs, clics WhatsApp
-- publics, inscriptions Bourse Rentrée) avec UNE valeur par jour, en AGRÉGAT
-- uniquement — aucune donnée personnelle ne sort de la base.
--
-- 1 RPC lecture seule :
--   get_analytics_daily(_days) → une ligne par jour sur la fenêtre [1, 365] :
--     * unique_visitors         (sessions distinctes / jour)
--     * page_views              (vues / jour)
--     * whatsapp_public_clicks  (clics 'whatsapp_public%' / jour)
--     * bourse_signups          (inscriptions liste d'attente / jour)
--
-- Sécurité :
--   * SECURITY DEFINER + garde public.is_admin_or_super_admin() ;
--   * lecture seule (aucune écriture) ;
--   * exposée à `authenticated` uniquement (REVOKE PUBLIC + anon) — le garde
--     interne reste la vraie barrière ;
--   * AUCUNE table modifiée, AUCUNE policy RLS modifiée, AUCUNE RPC existante
--     modifiée ; même motif que get_analytics_overview.
--
-- Note fuseau : les jours sont calculés sur created_at::date (UTC), cohérent
-- avec les autres RPC analytics. Suffisant pour une tendance.
--
-- ⚠️ NE PAS APPLIQUER en production sans validation manuelle (SQL Editor).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_analytics_daily(_days integer DEFAULT 30)
RETURNS TABLE (
  day                    date,
  unique_visitors        integer,
  page_views             integer,
  whatsapp_public_clicks integer,
  bourse_signups         integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days  integer := LEAST(GREATEST(COALESCE(_days, 30), 1), 365);
  v_start date    := (now()::date) - (v_days - 1);
BEGIN
  IF NOT public.is_admin_or_super_admin() THEN
    RAISE EXCEPTION 'Only admins can read analytics';
  END IF;

  RETURN QUERY
  WITH days AS (
    SELECT generate_series(v_start, now()::date, interval '1 day')::date AS day
  ),
  ev AS (
    SELECT
      ae.created_at::date AS day,
      COUNT(*) FILTER (WHERE ae.event_type = 'page_view')::integer            AS page_views,
      COUNT(DISTINCT ae.session_id) FILTER (
        WHERE ae.event_type = 'page_view' AND ae.session_id IS NOT NULL
      )::integer                                                              AS unique_visitors,
      COUNT(*) FILTER (
        WHERE ae.event_type = 'click' AND ae.label LIKE 'whatsapp_public%'
      )::integer                                                              AS whatsapp_public_clicks
    FROM public.analytics_events ae
    WHERE ae.created_at >= v_start
    GROUP BY ae.created_at::date
  ),
  bw AS (
    SELECT
      b.created_at::date AS day,
      COUNT(*)::integer  AS bourse_signups
    FROM public.bourse_rentree_waitlist b
    WHERE b.created_at >= v_start
    GROUP BY b.created_at::date
  )
  SELECT
    d.day,
    COALESCE(ev.unique_visitors, 0),
    COALESCE(ev.page_views, 0),
    COALESCE(ev.whatsapp_public_clicks, 0),
    COALESCE(bw.bourse_signups, 0)
  FROM days d
  LEFT JOIN ev ON ev.day = d.day
  LEFT JOIN bw ON bw.day = d.day
  ORDER BY d.day;
END;
$$;

REVOKE ALL ON FUNCTION public.get_analytics_daily(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_analytics_daily(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_daily(integer) TO authenticated;
