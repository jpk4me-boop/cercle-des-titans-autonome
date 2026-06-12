import { ReactNode } from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FeatureGuardProps {
  children: ReactNode;
  isAvailable: boolean;
  featureName: string;
  requiresAuth?: boolean;
  isAuthenticated?: boolean;
  fallbackMessage?: string;
}

/**
 * FeatureGuard component to gracefully handle unavailable features
 * - Shows disabled state when feature is not available
 * - Redirects to auth when authentication is required
 * - Never shows a blank page
 */
const FeatureGuard = ({
  children,
  isAvailable,
  featureName,
  requiresAuth = false,
  isAuthenticated = true,
  fallbackMessage
}: FeatureGuardProps) => {
  const navigate = useNavigate();

  // Feature requires auth but user is not authenticated
  if (requiresAuth && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Connexion requise
        </h3>
        <p className="text-muted-foreground text-sm mb-4 max-w-xs">
          Veuillez vous connecter pour accéder à {featureName}.
        </p>
        <Button onClick={() => navigate('/auth')}>
          Se connecter
        </Button>
      </div>
    );
  }

  // Feature is not available
  if (!isAvailable) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          {featureName} indisponible
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          {fallbackMessage || `Cette fonctionnalité n'est pas disponible pour le moment. Veuillez réessayer plus tard.`}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default FeatureGuard;
