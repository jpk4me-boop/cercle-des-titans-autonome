import { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageSquare, Plus, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Conversation } from '@/hooks/useMessaging';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  loading: boolean;
  onSelect: (conversation: Conversation) => void;
  onRefresh: () => void;
  // Création réservée à l'administration. Les membres ne créent jamais de
  // conversation : ils ne peuvent que répondre à une conversation officielle.
  canCreateConversation?: boolean;
  onNewConversation?: () => void;
  // Adapte les libellés/empty state au rôle (admin vs membre).
  isAdmin?: boolean;
}

const ConversationList = ({
  conversations,
  currentConversation,
  loading,
  onSelect,
  onRefresh,
  canCreateConversation = false,
  onNewConversation,
  isAdmin = false
}: ConversationListProps) => {
  const { user } = useAuth();

  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) return conversation.title;
    
    // Get other participants' names
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

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.last_message) return "Aucun message";
    const content = conversation.last_message.content;
    return content.length > 40 ? content.substring(0, 40) + '...' : content;
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {canCreateConversation && onNewConversation && (
        <div className="p-4 border-b border-border">
          <Button
            onClick={onNewConversation}
            className="w-full gap-2"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            Nouveau message officiel
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              {isAdmin
                ? 'Envoyez un message officiel à un membre'
                : 'Aucun message officiel pour le moment'}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              {isAdmin
                ? 'Utilisez « Nouveau message officiel » pour démarrer.'
                : "L'administration vous contactera ici."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelect(conversation)}
                className={`w-full p-4 text-left transition-colors hover:bg-muted/50 ${
                  currentConversation?.id === conversation.id ? 'bg-muted' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-sm text-foreground truncate">
                        {getConversationTitle(conversation)}
                      </h4>
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {getLastMessagePreview(conversation)}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatTime(conversation.last_message_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
