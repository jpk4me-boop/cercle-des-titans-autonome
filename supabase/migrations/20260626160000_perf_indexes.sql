-- =============================================================================
-- Performance & Protection — Phase A1 : INDEX ADDITIFS uniquement.
--
-- Périmètre strict :
--   * uniquement CREATE INDEX IF NOT EXISTS ;
--   * AUCUN DROP INDEX ;
--   * AUCUNE modification de table, de policy RLS, de fonction ou de flux ;
--   * idempotent (réexécutable sans erreur).
--
-- Choix CREATE INDEX simple (et non CONCURRENTLY) : volumétrie actuelle faible,
-- verrou très bref, et CONCURRENTLY ne peut pas tourner dans la transaction du
-- runner de migration. Si les tables grossissent, recréer en CONCURRENTLY hors
-- transaction (manuellement).
--
-- ⚠️ NE PAS APPLIQUER en production sans validation manuelle (SQL Editor).
-- =============================================================================

-- 1. contribution_payments (status, created_at)
--    Accélère les agrégats analytics : paiements par statut ('paid'),
--    conversions, et fenêtre « paiements récents » (created_at >= N jours).
CREATE INDEX IF NOT EXISTS idx_contribution_payments_status_created
  ON public.contribution_payments (status, created_at);

-- 2. messages (conversation_id, created_at DESC)
--    Chargement rapide d'un fil : filtre par conversation puis tri chronologique.
--    Index composite couvrant, là où il n'existait que deux index séparés.
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages (conversation_id, created_at DESC);

-- 3. conversations (last_message_at DESC)
--    Tri rapide de la liste des conversations par dernière activité.
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
  ON public.conversations (last_message_at DESC);

-- 4. analytics_events (event_type, label, created_at)
--    Compteurs ciblés par label sur une fenêtre : clics WhatsApp admin
--    ('whatsapp%admin') et publics ('whatsapp_public%'), et events filtrés
--    par type + label + période.
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_label_created
  ON public.analytics_events (event_type, label, created_at);

-- 5. member_tontine_categories — index PARTIEL sur user_id WHERE is_active
--    Optimise le comptage des membres distincts ayant une adhésion active
--    (get_active_tontine_members_count) en ne couvrant que les lignes utiles.
CREATE INDEX IF NOT EXISTS idx_member_tontine_categories_active_user
  ON public.member_tontine_categories (user_id)
  WHERE is_active = true;
