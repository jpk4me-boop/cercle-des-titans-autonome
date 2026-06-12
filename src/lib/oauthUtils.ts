import { supabase } from '@/integrations/supabase/client';

// OAuth error types for better type safety
export type OAuthErrorCode = 
  | 'redirect_uri_mismatch'
  | 'invalid_client'
  | 'access_denied'
  | 'popup_closed_by_user'
  | 'state_mismatch'
  | 'server_error'
  | 'temporarily_unavailable'
  | 'provider_not_enabled'
  | 'network_error'
  | 'unknown_error';

export interface OAuthError {
  code: OAuthErrorCode;
  message: string;
  userMessage: string;
}

// User-friendly error messages in French
const ERROR_MESSAGES: Record<OAuthErrorCode, string> = {
  redirect_uri_mismatch: "L'URL de redirection n'est pas autorisée. Contactez l'administrateur.",
  invalid_client: "L'identifiant client Google n'est pas configuré correctement.",
  access_denied: "Vous avez refusé l'accès à votre compte.",
  popup_closed_by_user: "La fenêtre de connexion a été fermée.",
  state_mismatch: "Erreur de sécurité OAuth. Veuillez réessayer.",
  server_error: "Erreur du serveur d'authentification. Veuillez réessayer.",
  temporarily_unavailable: "Service temporairement indisponible. Réessayez dans quelques instants.",
  provider_not_enabled: "Ce fournisseur d'authentification n'est pas activé.",
  network_error: "Erreur réseau. Vérifiez votre connexion internet.",
  unknown_error: "Une erreur inattendue s'est produite. Veuillez réessayer."
};

/**
 * Parse OAuth error from Supabase error message
 */
export function parseOAuthError(error: Error | string): OAuthError {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerMessage = errorMessage.toLowerCase();
  
  let code: OAuthErrorCode = 'unknown_error';
  
  if (lowerMessage.includes('redirect_uri_mismatch') || lowerMessage.includes('redirect uri')) {
    code = 'redirect_uri_mismatch';
  } else if (lowerMessage.includes('invalid_client') || lowerMessage.includes('client id')) {
    code = 'invalid_client';
  } else if (lowerMessage.includes('access_denied') || lowerMessage.includes('denied')) {
    code = 'access_denied';
  } else if (lowerMessage.includes('popup') || lowerMessage.includes('closed')) {
    code = 'popup_closed_by_user';
  } else if (lowerMessage.includes('state') || lowerMessage.includes('mismatch')) {
    code = 'state_mismatch';
  } else if (lowerMessage.includes('server_error')) {
    code = 'server_error';
  } else if (lowerMessage.includes('unavailable')) {
    code = 'temporarily_unavailable';
  } else if (lowerMessage.includes('provider') && (lowerMessage.includes('not enabled') || lowerMessage.includes('disabled'))) {
    code = 'provider_not_enabled';
  } else if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    code = 'network_error';
  }
  
  return {
    code,
    message: errorMessage,
    userMessage: ERROR_MESSAGES[code]
  };
}

/**
 * Get the correct redirect URL for OAuth
 * Supports both Lovable preview and production domains
 */
export function getOAuthRedirectUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

/**
 * Initiate Google OAuth sign-in with proper error handling
 */
export async function signInWithGoogle(): Promise<{ success: boolean; error?: OAuthError }> {
  try {
    const redirectTo = getOAuthRedirectUrl();
    
    if (import.meta.env.DEV) {
      console.log('[OAuth] Starting Google sign-in, redirect to:', redirectTo);
    }
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    
    if (error) {
      const parsedError = parseOAuthError(error);
      
      if (import.meta.env.DEV) {
        console.error('[OAuth] Google sign-in error:', parsedError);
      }
      
      return { success: false, error: parsedError };
    }
    
    return { success: true };
  } catch (err) {
    const parsedError = parseOAuthError(err instanceof Error ? err : 'Unknown error');
    
    if (import.meta.env.DEV) {
      console.error('[OAuth] Unexpected error:', err);
    }
    
    return { success: false, error: parsedError };
  }
}

/**
 * Initiate GitHub OAuth sign-in with proper error handling
 */
export async function signInWithGitHub(): Promise<{ success: boolean; error?: OAuthError }> {
  try {
    const redirectTo = getOAuthRedirectUrl();
    
    if (import.meta.env.DEV) {
      console.log('[OAuth] Starting GitHub sign-in, redirect to:', redirectTo);
    }
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo
      }
    });
    
    if (error) {
      const parsedError = parseOAuthError(error);
      
      if (import.meta.env.DEV) {
        console.error('[OAuth] GitHub sign-in error:', parsedError);
      }
      
      return { success: false, error: parsedError };
    }
    
    return { success: true };
  } catch (err) {
    const parsedError = parseOAuthError(err instanceof Error ? err : 'Unknown error');
    
    if (import.meta.env.DEV) {
      console.error('[OAuth] Unexpected error:', err);
    }
    
    return { success: false, error: parsedError };
  }
}

/**
 * Sign out the current user
 */
export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to sign out' 
    };
  }
}
