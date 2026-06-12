import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * AuthGuard component to protect routes and handle authentication states
 * - Prevents blank pages by showing loading/error states
 * - Redirects unauthenticated users to login
 * - Shows clear error messages if auth is misconfigured
 */
const AuthGuard = ({ 
  children, 
  requireAuth = true,
  redirectTo = '/auth' 
}: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check for Supabase configuration
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setAuthError('Configuration Supabase manquante. Veuillez vérifier les variables d\'environnement.');
      return;
    }

    // Handle auth redirect after checking config
    if (!loading && requireAuth && !user) {
      navigate(redirectTo, { 
        state: { from: location.pathname },
        replace: true 
      });
    }
  }, [user, loading, requireAuth, navigate, redirectTo, location]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Chargement...</p>
      </div>
    );
  }

  // Show configuration error
  if (authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 p-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Erreur de configuration
          </h1>
          <p className="text-muted-foreground text-sm mb-4">
            {authError}
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  // User not authenticated and auth required - will redirect
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Redirection...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
