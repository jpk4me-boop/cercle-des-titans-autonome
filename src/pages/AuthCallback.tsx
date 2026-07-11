import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearPendingOAuthConsent } from '@/lib/legalDocuments';

// OAuth error code mappings for user-friendly messages
const OAUTH_ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  redirect_uri_mismatch: {
    title: "Configuration OAuth incorrecte",
    description: "L'URL de redirection n'est pas autorisée. Contactez l'administrateur."
  },
  invalid_client: {
    title: "Client OAuth invalide",
    description: "L'identifiant client Google n'est pas configuré correctement."
  },
  access_denied: {
    title: "Accès refusé",
    description: "Vous avez refusé l'accès à votre compte Google."
  },
  popup_closed_by_user: {
    title: "Connexion annulée",
    description: "La fenêtre de connexion a été fermée avant la fin."
  },
  state_mismatch: {
    title: "Erreur de sécurité",
    description: "Le paramètre de sécurité OAuth ne correspond pas. Veuillez réessayer."
  },
  server_error: {
    title: "Erreur serveur",
    description: "Une erreur s'est produite côté Google. Veuillez réessayer."
  },
  temporarily_unavailable: {
    title: "Service temporairement indisponible",
    description: "Le service d'authentification est momentanément indisponible."
  },
  provider_not_enabled: {
    title: "Fournisseur non activé",
    description: "Google OAuth n'est pas activé. Contactez l'administrateur."
  },
  "OAuth state parameter missing": {
    title: "Paramètre OAuth manquant",
    description: "La session OAuth a expiré. Veuillez réessayer la connexion."
  }
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<{ title: string; description: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error parameters in URL
        const errorCode = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (errorCode) {
          // Phase J4 : annulation/échec confirmé du flux OAuth. Le marqueur
          // temporaire de consentement ne doit pas survivre pour être
          // rapproché d'une autre session.
          clearPendingOAuthConsent();

          const errorInfo = OAUTH_ERROR_MESSAGES[errorCode] || {
            title: "Erreur d'authentification",
            description: errorDescription || `Erreur: ${errorCode}`
          };
          
          if (import.meta.env.DEV) {
            console.error('[OAuth Error]', { errorCode, errorDescription });
          }
          
          setError(errorInfo);
          setIsProcessing(false);
          return;
        }

        // Get the session from URL hash (Supabase OAuth flow)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          const errorKey = sessionError.message;
          const errorInfo = OAUTH_ERROR_MESSAGES[errorKey] || {
            title: "Erreur de session",
            description: sessionError.message
          };
          
          if (import.meta.env.DEV) {
            console.error('[Session Error]', sessionError);
          }
          
          setError(errorInfo);
          setIsProcessing(false);
          return;
        }

        if (session) {
          // Phase J4 : le consentement n'est PAS résolu ici. La navigation
          // aboutit sur les routes privées protégées par LegalConsentGuard,
          // qui vérifie la preuve en base et affiche, si nécessaire, l'étape
          // d'acceptation obligatoire liée au compte connecté.
          navigate('/dashboard', { replace: true });
        } else {
          // No session and no error - try to exchange the code
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          
          if (accessToken) {
            // Token found in hash, session should be set by Supabase client
            const { data: { session: newSession } } = await supabase.auth.getSession();
            if (newSession) {
              navigate('/dashboard', { replace: true });
              return;
            }
          }
          
          // No session found at all
          setError({
            title: "Session non trouvée",
            description: "Impossible de récupérer votre session. Veuillez vous reconnecter."
          });
          setIsProcessing(false);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[Auth Callback Error]', err);
        }
        
        setError({
          title: "Erreur inattendue",
          description: err instanceof Error ? err.message : "Une erreur s'est produite lors de la connexion."
        });
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  const handleRetry = () => {
    navigate('/auth', { replace: true });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-card border border-destructive/30 rounded-2xl p-8 shadow-lg">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            
            <h1 className="text-xl font-bold text-foreground mb-2">
              {error.title}
            </h1>
            
            <p className="text-muted-foreground mb-6">
              {error.description}
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={handleRetry}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer la connexion
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/', { replace: true })}
                className="w-full"
              >
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-6" />
          
          <h1 className="text-xl font-bold text-foreground mb-2">
            Connexion en cours...
          </h1>
          
          <p className="text-muted-foreground">
            Veuillez patienter pendant que nous vérifions votre identité.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
