-- Fix RLS policies with correct column references

-- Drop and recreate conversations policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations;

CREATE POLICY "Users can view conversations they participate in" 
ON public.conversations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update conversations they participate in" 
ON public.conversations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
  )
);

-- Drop and recreate messages policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;

CREATE POLICY "Users can view messages in their conversations" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their conversations" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
  )
);

-- Fix conversation_participants SELECT policy
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;

CREATE POLICY "Users can view participants of their conversations" 
ON public.conversation_participants 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp2 
    WHERE cp2.conversation_id = conversation_participants.conversation_id AND cp2.user_id = auth.uid()
  )
);