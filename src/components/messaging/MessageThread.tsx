import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Send, Loader2, ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Message, Conversation } from '@/hooks/useMessaging';

interface MessageThreadProps {
  conversation: Conversation;
  messages: Message[];
  loading: boolean;
  sendingMessage: boolean;
  onSendMessage: (content: string) => Promise<boolean>;
  onBack: () => void;
}

const MessageThread = ({
  conversation,
  messages,
  loading,
  sendingMessage,
  onSendMessage,
  onBack
}: MessageThreadProps) => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendingMessage) return;
    
    const success = await onSendMessage(input);
    if (success) {
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getConversationTitle = () => {
    if (conversation.title) return conversation.title;
    
    const otherParticipants = conversation.participants.filter(
      p => p.user_id !== user?.id
    );
    
    if (otherParticipants.length === 0) return "Moi-même";
    
    return otherParticipants
      .map(p => {
        if (p.profile?.first_name || p.profile?.last_name) {
          return `${p.profile.first_name || ''} ${p.profile.last_name || ''}`.trim();
        }
        return p.profile?.email?.split('@')[0] || 'Utilisateur';
      })
      .join(', ');
  };

  const getSenderName = (message: Message) => {
    if (message.sender_id === user?.id) return 'Vous';
    if (message.sender_profile?.first_name || message.sender_profile?.last_name) {
      return `${message.sender_profile.first_name || ''} ${message.sender_profile.last_name || ''}`.trim();
    }
    return message.sender_profile?.email?.split('@')[0] || 'Utilisateur';
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3 bg-card">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Retour"
          onClick={onBack}
          className="md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">
            {getConversationTitle()}
          </h3>
          <p className="text-xs text-muted-foreground">
            {conversation.participants.length} participant{conversation.participants.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              Aucun message dans cette conversation
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Envoyez le premier message !
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${isOwnMessage ? 'order-2' : ''}`}>
                  {!isOwnMessage && (
                    <p className="text-xs text-muted-foreground mb-1 px-1">
                      {getSenderName(message)}
                    </p>
                  )}
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                  <p className={`text-xs text-muted-foreground mt-1 px-1 ${isOwnMessage ? 'text-right' : ''}`}>
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Écrivez votre message..."
            className="flex-1 px-4 py-3 text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            disabled={sendingMessage}
          />
          <Button
            type="submit"
            disabled={!input.trim() || sendingMessage}
            size="icon"
            aria-label="Envoyer le message"
            className="rounded-xl w-12 h-12"
          >
            {sendingMessage ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MessageThread;
