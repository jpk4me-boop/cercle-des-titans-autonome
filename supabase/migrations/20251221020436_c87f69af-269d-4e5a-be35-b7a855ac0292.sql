-- Create conversations table for messaging
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  title TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create conversation participants table
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes for performance
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);

-- Enable RLS on all tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations they participate in" 
ON public.conversations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update conversations they participate in" 
ON public.conversations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
  )
);

-- RLS Policies for conversation_participants
CREATE POLICY "Users can view participants of their conversations" 
ON public.conversation_participants 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp2 
    WHERE cp2.conversation_id = conversation_id AND cp2.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add themselves as participants" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" 
ON public.conversation_participants 
FOR UPDATE 
USING (user_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their conversations" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages" 
ON public.messages 
FOR UPDATE 
USING (sender_id = auth.uid());

-- Trigger to update conversation's last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET last_message_at = NEW.created_at, updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

-- Trigger to update updated_at on messages
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;