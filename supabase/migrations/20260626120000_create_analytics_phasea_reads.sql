-- =============================================================================
-- Phase Analytics Admin — Phase A : 2 RPC de LECTURE SEULE (admin only).
--
-- Objectif : exposer deux compteurs supplémentaires à l'onglet « Statistiques »
-- sans toucher aux données :
--   * get_analytics_whatsapp_clicks  → clics WhatsApp « contact interne admin »
--     (événements click dont le label commence par 'whatsapp' et finit par
--     'admin'), sur une fenêtre de jours ;
--   * get_active_tontine_members_count → nombre de MEMBRES DISTINCTS ayant au
--     moins une adhésion active dans member_tontine_categories.
--
-- Sécurité :
--   * SECURITY DEFINER + garde public.is_admin_or_super_admin() (admin/super) ;
--   * lecture seule (aucun INSERT/UPDATE/DELETE) ;
--   * AUCUNE table modifiée, AUCUNE policy RLS modifiée, AUCUN changement
--     destructif ;
--   * même motif que get_analytics_overview / get_analytics_top_pages.
--
-- ⚠️ NE PAS APPLIQUER en production sans validation manuelle (SQL Editor).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Clics WhatsApp « contact interne admin » sur une fenêtre de [1, 365] jours.
--    On ne compte QUE les événements de contact internes (label suffixé _admin)
--    afin de ne jamais mélanger avec de futurs clics WhatsApp publics
--    (conversions marketing), qui auront leurs propres labels.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_analytics_whatsapp_clicks(_days integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_threshold timestamptz;
  v_count     integer;
BEGIN
  IF NOT public.is_admin_or_super_admin() THEN
    RAISE EXCEPTION 'Only admins can read analytics';
  END IF;

  v_threshold := now() - make_interval(days => LEAST(GREATEST(COALESCE(_days, 30), 1), 365));

  SELECT COUNT(*)::integer
    INTO v_count
  FROM public.analytics_events ae
  WHERE ae.event_type = 'click'
    AND ae.label LIKE 'whatsapp%admin'
    AND ae.created_at >= v_threshold;

  RETURN COALESCE(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.get_analytics_whatsapp_clicks(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_analytics_whatsapp_clicks(integer) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. Membres actifs tontine = nombre de user_id DISTINCTS ayant au moins une
--    adhésion active (is_active = true) dans member_tontine_categories.
--    Un même membre présent dans plusieurs catégories n'est compté qu'une fois.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_active_tontine_members_count()
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT public.is_admin_or_super_admin() THEN
    RAISE EXCEPTION 'Only admins can read analytics';
  END IF;

  SELECT COUNT(DISTINCT mtc.user_id)::integer
    INTO v_count
  FROM public.member_tontine_categories mtc
  WHERE mtc.is_active = true;

  RETURN COALESCE(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.get_active_tontine_members_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_tontine_members_count() TO authenticated;
