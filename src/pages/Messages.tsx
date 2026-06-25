import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useMessaging, Conversation } from '@/hooks/useMessaging';
import ConversationList from '@/components/messaging/ConversationList';
import MessageThread from '@/components/messaging/MessageThread';
import Navbar from '@/components/Navbar';

const Messages = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    conversations,
    currentConversation,
    messages,
    loading,
    sendingMessage,
    setCurrentConversation,
    fetchConversations,
    sendMessage
  } = useMessaging();
  
  const [showMobileThread, setShowMobileThread] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSelectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setShowMobileThread(true);
  };

  const handleBack = () => {
    setCurrentConversation(null);
    setShowMobileThread(false);
  };

  const handleSendMessage = async (content: string) => {
    if (!currentConversation) return false;
    return await sendMessage(currentConversation.id, content);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Messages | Cercle des Titans</title>
        <meta name="description" content="Gérez vos conversations et messages privés sur le Cercle des Titans." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="pt-20 pb-4 px-4 md:px-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold text-foreground">
                  Messages
                </h1>
                <p className="text-sm text-muted-foreground">
                  Vos conversations privées
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg h-[calc(100vh-180px)]">
            <div className="flex h-full">
              {/* Conversation List - Hidden on mobile when viewing thread */}
              <div className={`w-full md:w-80 lg:w-96 border-r border-border ${showMobileThread ? 'hidden md:block' : 'block'}`}>
                <ConversationList
                  conversations={conversations}
                  currentConversation={currentConversation}
                  loading={loading}
                  onSelect={handleSelectConversation}
                  onRefresh={fetchConversations}
                />
              </div>

              {/* Message Thread - Hidden on mobile when viewing list */}
              <div className={`flex-1 ${!showMobileThread ? 'hidden md:flex' : 'flex'} flex-col`}>
                {currentConversation ? (
                  <MessageThread
                    conversation={currentConversation}
                    messages={messages}
                    loading={loading}
                    sendingMessage={sendingMessage}
                    onSendMessage={handleSendMessage}
                    onBack={handleBack}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                      <MessageSquare className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Sélectionnez une conversation
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-xs">
                      Choisissez une conversation existante ou créez-en une nouvelle pour commencer à échanger.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Messages;
