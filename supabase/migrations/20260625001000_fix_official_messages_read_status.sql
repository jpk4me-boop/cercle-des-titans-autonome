-- =============================================================================
-- RPC : marquage « lu » des messages d'une conversation (messagerie officielle).
--
-- Contexte : le front faisait un UPDATE direct sur messages.is_read
-- (FROM messages SET is_read = true WHERE conversation_id = ... AND sender_id
--  <> auth.uid()). Cet UPDATE dépend entièrement de la policy RLS UPDATE de
-- messages, qui autorise « son propre message OU admin ». Un membre ne peut donc
-- PAS marquer comme lus les messages reçus de l'administration (il n'en est pas
-- l'auteur) → le compteur « non lus » ne se vide jamais côté membre.
--
-- Solution : une RPC SECURITY DEFINER, point d'entrée unique et contrôlé, qui
--   * exige une session authentifiée ;
--   * vérifie que l'appelant est participant de la conversation OU admin
--     (boîte commune) — réutilise les helpers existants, ne crée pas de droit
--     nouveau ;
--   * ne marque QUE les messages REÇUS (sender_id <> auth.uid()) et encore non
--     lus ; ne touche jamais aux messages envoyés par l'appelant ;
--   * ne lit/écrit que la table messages, restreinte à la seule conversation
--     ciblée.
--
-- Cette migration N'AJOUTE et NE MODIFIE aucune policy RLS : la RLS reste
-- inchangée. Le marquage « lu » passe désormais par cette RPC, sans relâcher
-- la policy UPDATE de messages.
--
-- Dépendances (toutes définies par des migrations antérieures) :
--   * public.is_current_user_conversation_participant(uuid)
--   * public.is_admin_or_super_admin()
--
-- ⚠️ NE PAS APPLIQUER en production sans validation manuelle (tests messagerie).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.mark_conversation_messages_read(
  _conversation_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_updated integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _conversation_id IS NULL THEN
    RAISE EXCEPTION 'Conversation id is required';
  END IF;

  -- Participant de la conversation OU admin/super_admin (boîte commune).
  -- Un utilisateur tiers ne peut pas marquer les messages d'une conversation
  -- à laquelle il n'appartient pas.
  IF NOT (
    public.is_current_user_conversation_participant(_conversation_id)
    OR public.is_admin_or_super_admin()
  ) THEN
    RAISE EXCEPTION 'Not allowed to access this conversation';
  END IF;

  -- Seuls les messages REÇUS et non lus sont marqués. Les messages envoyés par
  -- l'appelant (sender_id = auth.uid()) ne sont jamais touchés.
  UPDATE public.messages
  SET is_read = true
  WHERE conversation_id = _conversation_id
    AND sender_id <> v_uid
    AND is_read = false;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_conversation_messages_read(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_conversation_messages_read(uuid) TO authenticated;
