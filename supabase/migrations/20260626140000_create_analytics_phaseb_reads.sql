-- =============================================================================
-- Phase Analytics Admin — Phase B1 : 2 RPC de LECTURE SEULE (admin only).
--
-- Objectif marketing avancé, SANS exposer de donnée personnelle :
--   * get_analytics_public_whatsapp_clicks → clics WhatsApp PUBLICS (intentions
--     visiteurs : partage / contact marketing), événements click dont le label
--     commence par 'whatsapp_public' — strictement disjoints des labels admin
--     internes ('whatsapp_..._admin') ;
--   * get_bourse_conversion_stats → recoupement AGRÉGÉ « prospect Bourse Rentrée
--     = membre inscrit ». Ne renvoie QUE deux entiers (total prospects,
--     prospects convertis) ; aucun nom / email / téléphone ne sort de la base.
--
-- Méthode de recoupement (par prospect, dédupliqué) — un prospect est compté
-- converti s'il existe un profil lié par AU MOINS un de ces critères :
--   1. user_id (lien direct certain, le prospect a soumis en étant connecté) ;
--   2. email normalisé : lower(btrim(email)) ;
--   3. téléphone normalisé : chiffres uniquement, match COMPLET.
-- → résultat marqué « Estimation » côté UI (email/téléphone = heuristique).
--
-- Sécurité :
--   * SECURITY DEFINER + garde public.is_admin_or_super_admin() ;
--   * lecture seule (aucun INSERT/UPDATE/DELETE) ;
--   * AUCUNE table modifiée, AUCUNE policy RLS modifiée, AUCUN changement
--     destructif ; même motif que les RPC analytics existantes.
--
-- ⚠️ NE PAS APPLIQUER en production sans validation manuelle (SQL Editor).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Clics WhatsApp PUBLICS (intentions visiteurs) sur [1, 365] jours.
--    Disjoint des contacts internes admin (label '...admin').
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_analytics_public_whatsapp_clicks(_days integer DEFAULT 30)
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
    AND ae.label LIKE 'whatsapp_public%'
    AND ae.created_at >= v_threshold;

  RETURN COALESCE(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.get_analytics_public_whatsapp_clicks(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_analytics_public_whatsapp_clicks(integer) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. Conversion AGRÉGÉE prospect Bourse Rentrée → membre inscrit.
--    Renvoie uniquement (prospects, converted) — jamais de donnée personnelle.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_bourse_conversion_stats()
RETURNS TABLE (prospects integer, converted integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_super_admin() THEN
    RAISE EXCEPTION 'Only admins can read analytics';
  END IF;

  RETURN QUERY
  WITH w AS (
    SELECT
      bw.id,
      bw.user_id,
      nullif(lower(btrim(bw.email)), '')                          AS email_norm,
      nullif(regexp_replace(coalesce(bw.phone, ''), '\D', '', 'g'), '') AS phone_digits
    FROM public.bourse_rentree_waitlist bw
  ),
  p AS (
    SELECT
      pr.user_id,
      nullif(lower(btrim(pr.email)), '')                          AS email_norm,
      nullif(regexp_replace(coalesce(pr.phone, ''), '\D', '', 'g'), '') AS phone_digits
    FROM public.profiles pr
  )
  SELECT
    (SELECT COUNT(*)::integer FROM w) AS prospects,
    (SELECT COUNT(DISTINCT w.id)::integer
       FROM w
      WHERE EXISTS (
        SELECT 1 FROM p
         WHERE (w.user_id     IS NOT NULL AND p.user_id     = w.user_id)
            OR (w.email_norm   IS NOT NULL AND p.email_norm   = w.email_norm)
            OR (w.phone_digits IS NOT NULL AND p.phone_digits = w.phone_digits)
      )) AS converted;
END;
$$;

REVOKE ALL ON FUNCTION public.get_bourse_conversion_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_bourse_conversion_stats() TO authenticated;
