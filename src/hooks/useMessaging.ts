import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_read: boolean;
  sender_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

export interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  participants: {
    user_id: string;
    profile?: {
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    };
  }[];
  last_message?: Message;
  unread_count?: number;
}

export const useMessaging = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch all conversations for the current user
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get conversations where user is a participant
      const { data: participations, error: participationsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (participationsError) throw participationsError;
      
      if (!participations || participations.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = participations.map(p => p.conversation_id);

      // Get conversations
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;

      // Get all participants for these conversations
      const { data: allParticipants, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('conversation_id', conversationIds);

      if (partError) throw partError;

      // Get profiles for all participants
      const participantIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', participantIds);

      if (profilesError) throw profilesError;

      // Get last message for each conversation
      const conversationsWithDetails: Conversation[] = await Promise.all(
        (convData || []).map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          const convParticipants = allParticipants?.filter(p => p.conversation_id === conv.id) || [];
          
          return {
            ...conv,
            participants: convParticipants.map(p => ({
              user_id: p.user_id,
              profile: profiles?.find(pr => pr.user_id === p.user_id)
            })),
            last_message: lastMsg || undefined,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les conversations"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', senderIds);

      const messagesWithProfiles = (data || []).map(msg => ({
        ...msg,
        sender_profile: profiles?.find(p => p.user_id === msg.sender_id)
      }));

      setMessages(messagesWithProfiles);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les messages"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Send a message
  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!user || !content.trim()) return false;
    
    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim()
        });

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Erreur d'envoi",
        description: "Impossible d'envoyer le message"
      });
      return false;
    } finally {
      setSendingMessage(false);
    }
  }, [user, toast]);

  // Create a new conversation
  const createConversation = useCallback(async (participantIds: string[], title?: string) => {
    if (!user) return null;
    
    try {
      // Create the conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({ title })
        .select()
        .single();

      if (convError) throw convError;

      // Add current user as participant
      const { error: selfError } = await supabase
        .from('conversation_participants')
        .insert({ 
          conversation_id: conversation.id, 
          user_id: user.id 
        });

      if (selfError) throw selfError;

      toast({
        title: "Conversation créée",
        description: "Vous pouvez maintenant envoyer des messages"
      });

      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer la conversation"
      });
      return null;
    }
  }, [user, toast]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !currentConversation) return;

    const channel = supabase
      .channel(`messages-${currentConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversation.id}`
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Get sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name, email')
            .eq('user_id', newMessage.sender_id)
            .maybeSingle();

          setMessages(prev => [...prev, { 
            ...newMessage, 
            sender_profile: profile || undefined 
          }]);

          // Mark as read if not from current user
          if (newMessage.sender_id !== user.id) {
            await supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentConversation]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation.id);
    } else {
      setMessages([]);
    }
  }, [currentConversation, fetchMessages]);

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    sendingMessage,
    setCurrentConversation,
    fetchConversations,
    fetchMessages,
    sendMessage,
    createConversation
  };
};
