-- =============================================================================
-- Phase D1 — Durcissement léger : get_presence_counts strictement admin-only.
--
-- Contexte : Supabase accorde EXECUTE par défaut à `anon`/`authenticated` sur
-- toute fonction du schéma public ; la migration d'origine n'avait révoqué que
-- PUBLIC. La garde interne is_admin_or_super_admin() protège déjà la donnée
-- (anon → exception), mais par défense en profondeur on révoque explicitement
-- l'accès `anon` (même approche que rl_check en A2).
--
-- Strictement non destructif :
--   * REVOKE EXECUTE ... FROM anon (durcissement) ;
--   * GRANT EXECUTE ... TO authenticated réaffirmé (l'admin garde son accès) ;
--   * AUCUNE modification de la logique de présence, de la fenêtre 5 min,
--     de record_presence, de la table presence_heartbeats, ni du front ;
--   * AUCUNE nouvelle table, AUCUN Realtime.
--
-- ⚠️ NE PAS APPLIQUER en production sans validation manuelle (SQL Editor).
-- =============================================================================

REVOKE ALL    ON FUNCTION public.get_presence_counts(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_presence_counts(integer) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_presence_counts(integer) TO authenticated;
