-- =============================================================================
-- Fix : "infinite recursion detected in policy for relation
--        conversation_participants"
--
-- Cause : la policy SELECT de conversation_participants faisait un EXISTS sur
-- conversation_participants elle-même. La sous-requête étant elle aussi soumise
-- à RLS, PostgreSQL ré-appliquait la même policy en boucle (erreur 42P17).
-- Cette récursion se propageait aux policies de conversations et messages qui
-- testent l'appartenance via un EXISTS sur conversation_participants.
--
-- Correction : une fonction SECURITY DEFINER (corps non soumis à la RLS de la
-- table) teste l'appartenance de l'utilisateur courant sans récursion. Les
-- policies l'appellent au lieu d'une sous-requête directe.
--
-- Sécurité : la fonction n'accepte PAS d'identifiant d'utilisateur ; elle
-- utilise auth.uid() en interne. Un membre ne peut donc tester que sa propre
-- appartenance, jamais celle d'un autre utilisateur.
--
-- ⚠️ NE PAS APPLIQUER sans validation manuelle (tests messagerie).
-- =============================================================================

-- 1. Fonction helper SECURITY DEFINER (durcie : aucun paramètre user_id).
CREATE OR REPLACE FUNCTION public.is_current_user_conversation_participant(
  _conversation_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = _conversation_id
      AND user_id = auth.uid()
  );
$$;

-- Restreint l'exécution : retirée à PUBLIC, accordée aux utilisateurs authentifiés.
REVOKE ALL ON FUNCTION public.is_current_user_conversation_participant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_conversation_participant(uuid) TO authenticated;

-- 2. conversation_participants : policy SELECT non récursive.
--    Règle métier conservée : un membre voit sa propre ligne ainsi que les
--    autres participants des conversations auxquelles il appartient.
DROP POLICY IF EXISTS "Users can view participants of their conversations"
  ON public.conversation_participants;

CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_current_user_conversation_participant(conversation_id)
);

-- 3. conversations : SELECT / UPDATE via la fonction (plus d'EXISTS soumis à RLS).
--    Règle métier conservée : un membre ne voit/maj que ses conversations.
DROP POLICY IF EXISTS "Users can view conversations they participate in"
  ON public.conversations;

CREATE POLICY "Users can view conversations they participate in"
ON public.conversations
FOR SELECT
USING ( public.is_current_user_conversation_participant(id) );

DROP POLICY IF EXISTS "Users can update conversations they participate in"
  ON public.conversations;

CREATE POLICY "Users can update conversations they participate in"
ON public.conversations
FOR UPDATE
USING ( public.is_current_user_conversation_participant(id) );

-- 4. messages : SELECT / INSERT via la fonction.
--    Règles métier conservées : un membre ne lit que les messages de ses
--    conversations, et ne peut envoyer que dans ses conversations avec
--    sender_id = auth.uid().
DROP POLICY IF EXISTS "Users can view messages in their conversations"
  ON public.messages;

CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING ( public.is_current_user_conversation_participant(conversation_id) );

DROP POLICY IF EXISTS "Users can send messages to their conversations"
  ON public.messages;

CREATE POLICY "Users can send messages to their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_current_user_conversation_participant(conversation_id)
);
