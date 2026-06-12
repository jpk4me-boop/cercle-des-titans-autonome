-- Add DELETE policies for messaging tables

-- 1. Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (sender_id = auth.uid());

-- 2. Users can leave conversations (delete their participation)
CREATE POLICY "Users can leave conversations"
ON public.conversation_participants
FOR DELETE
USING (user_id = auth.uid());

-- 3. Users can delete empty conversations they participate in
CREATE POLICY "Users can delete empty conversations they participate in"
ON public.conversations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversations.id
    AND cp.user_id = auth.uid()
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.conversation_id = conversations.id
  )
);