import { useState, useRef, useEffect, forwardRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Loader2, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

type Message = { role: "user" | "assistant"; content: string };

// Calls the secure server-side Assistant Titan Edge Function. The AI provider
// key lives only on the server; it is never sent to or exposed in the browser.
const ASSISTANT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/titan-assistant`;

// Keep the history payload small (server also caps it).
const MAX_HISTORY = 10;

const ChatAgent = forwardRef<HTMLDivElement>((_, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, session } = useAuth();
  const location = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !session) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const history = [...messages].slice(-MAX_HISTORY);
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const resp = await fetch(ASSISTANT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: trimmed,
          history,
          context: { page: location.pathname },
        }),
      });

      const data = await resp.json().catch(() => null);

      if (!resp.ok || !data) {
        throw new Error(data?.error || "Erreur de connexion");
      }

      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      // Do not log tokens or response bodies that could contain sensitive data.
      console.error("Assistant Titan: request failed");
      setError("Assistant Titan est momentanément indisponible. Veuillez réessayer dans un instant.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div ref={ref}>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-dark text-primary-foreground shadow-lg hover:shadow-gold/30 hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group ${isOpen ? 'hidden' : 'animate-chat-button-pulse'}`}
        aria-label="Ouvrir le chat"
      >
        <MessageCircle className="w-6 h-6 group-hover:animate-bounce-subtle" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 z-50 w-[380px] h-[520px] bg-card border border-border rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden ${isClosing ? 'animate-chat-close' : 'animate-chat-open'}`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-gold-dark via-gold to-gold-light p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/30">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm text-primary-foreground">Assistant Titan</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-xs text-primary-foreground/80">En ligne</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="hover:bg-primary-foreground/20 p-2 rounded-full transition-all duration-200 hover:rotate-90"
              aria-label="Fermer le chat"
            >
              <X className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-card">
            {!user ? (
              <div className="text-center text-muted-foreground text-sm py-8 px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-2">Connexion requise</p>
                <p className="text-xs mb-4">Veuillez vous connecter pour discuter avec l'assistant.</p>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-primary-foreground rounded-full text-xs font-medium hover:bg-gold-light transition-colors"
                >
                  Se connecter
                </Link>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center border border-gold/30">
                  <Sparkles className="w-8 h-8 text-gold" />
                </div>
                <p className="font-display text-lg text-foreground mb-2">
                  Bonjour {user.email?.split('@')[0]} !
                </p>
                <p className="text-sm text-muted-foreground">Comment puis-je vous aider aujourd'hui ?</p>
              </div>
            ) : null}

            {user && messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-gold to-gold-dark text-primary-foreground rounded-2xl rounded-br-md shadow-md'
                      : 'bg-secondary/80 text-foreground rounded-2xl rounded-bl-md border border-border/50'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading indicator (separate bubble, never blocks the UI) */}
            {user && isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[85%] px-4 py-3 text-sm bg-secondary/80 text-foreground rounded-2xl rounded-bl-md border border-border/50">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs opacity-70">Réflexion...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error state */}
            {user && error && (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[85%] px-4 py-3 text-sm bg-destructive/10 text-destructive rounded-2xl rounded-bl-md border border-destructive/30">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-card/95 backdrop-blur-sm">
            <div className="flex gap-3 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={user ? "Écrivez votre message..." : "Connectez-vous pour écrire"}
                className="flex-1 resize-none max-h-28 px-4 py-3 text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 disabled:opacity-50 transition-all duration-200"
                disabled={isLoading || !user}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading || !user}
                size="icon"
                className="rounded-xl w-12 h-12 shrink-0 bg-gradient-to-br from-gold to-gold-dark hover:from-gold-light hover:to-gold text-primary-foreground shadow-md hover:shadow-lg hover:shadow-gold/20 transition-all duration-200"
                aria-label="Envoyer"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ChatAgent.displayName = "ChatAgent";

export default ChatAgent;
