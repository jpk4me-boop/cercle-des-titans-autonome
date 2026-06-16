import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Crown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { signInWithGoogle, signInWithGitHub } from '@/lib/oauthUtils';

// Stores ONLY the email address (never the password). The password is left to
// the browser's native password manager via standard autocomplete attributes.
const REMEMBERED_EMAIL_KEY = 'cercle_des_titans_remembered_email';

const emailSchema = z.string().trim().email({ message: "Adresse email invalide" }).max(255, { message: "Email trop long (max 255 caractères)" });

const passwordSchema = z.string()
  .min(6, { message: "Minimum 6 caractères" })
  .max(72, { message: "Maximum 72 caractères" })
  .regex(/[a-z]/, { message: "Au moins une minuscule" })
  .regex(/[A-Z]/, { message: "Au moins une majuscule" })
  .regex(/[0-9]/, { message: "Au moins un chiffre" });

const Auth = () => {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const modeFromUrl = searchParams.get('mode');
  
  const [isLogin, setIsLogin] = useState(modeFromUrl !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Real-time validation
  const emailValidation = useMemo(() => {
    if (!emailTouched && !email) return { valid: true, error: null };
    const result = emailSchema.safeParse(email);
    return { valid: result.success, error: result.success ? null : result.error.errors[0].message };
  }, [email, emailTouched]);

  const passwordValidation = useMemo(() => {
    if (!passwordTouched && !password) return { valid: true, errors: [], strength: 0 };
    const errors: string[] = [];
    let strength = 0;
    
    if (password.length >= 6) strength += 1;
    else errors.push("Minimum 6 caractères");
    
    if (password.length <= 72) strength += 0.5;
    else errors.push("Maximum 72 caractères");
    
    if (/[a-z]/.test(password)) strength += 1;
    else if (!isLogin) errors.push("Au moins une minuscule");
    
    if (/[A-Z]/.test(password)) strength += 1;
    else if (!isLogin) errors.push("Au moins une majuscule");
    
    if (/[0-9]/.test(password)) strength += 1;
    else if (!isLogin) errors.push("Au moins un chiffre");
    
    if (/[^a-zA-Z0-9]/.test(password)) strength += 0.5;
    
    return { valid: errors.length === 0, errors, strength: Math.min(strength / 5, 1) };
  }, [password, passwordTouched, isLogin]);

  const isFormValid = useMemo(() => {
    if (isLogin) {
      return email.length > 0 && password.length >= 6;
    }
    return emailValidation.valid && passwordValidation.valid && firstName.trim() && lastName.trim();
  }, [email, password, emailValidation.valid, passwordValidation.valid, firstName, lastName, isLogin]);

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // On mount: prefill the email field from the browser-side remembered email.
  // Only the email is restored here; the password remains under the browser's
  // native password manager.
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      
      if (!result.success && result.error) {
        toast({
          variant: "destructive",
          title: "Erreur Google OAuth",
          description: result.error.userMessage
        });
      }
      // If successful, the page will redirect to Google
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de se connecter avec Google. Vérifiez votre connexion."
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setIsGitHubLoading(true);
    try {
      const result = await signInWithGitHub();
      
      if (!result.success && result.error) {
        toast({
          variant: "destructive",
          title: "Erreur GitHub OAuth",
          description: result.error.userMessage
        });
      }
      // If successful, the page will redirect to GitHub
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de se connecter avec GitHub. Vérifiez votre connexion."
      });
    } finally {
      setIsGitHubLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Erreur de connexion",
            description: error.message === "Invalid login credentials" 
              ? "Email ou mot de passe incorrect" 
              : error.message
          });
        } else {
          // Remember ONLY the email (never the password). The browser's password
          // manager handles credential storage via autocomplete attributes.
          if (rememberMe) {
            localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
          } else {
            localStorage.removeItem(REMEMBERED_EMAIL_KEY);
          }
          toast({
            title: "Connexion réussie",
            description: "Bienvenue dans le Cercle des Titans !"
          });
          navigate('/dashboard');
        }
      } else {
        const { error } = await signUp(email, password, { first_name: firstName, last_name: lastName });
        if (error) {
          toast({
            variant: "destructive",
            title: "Erreur d'inscription",
            description: error.message.includes("already registered")
              ? "Cet email est déjà utilisé"
              : error.message
          });
        } else {
          toast({
            title: "Inscription réussie",
            description: "Bienvenue dans le Cercle des Titans !"
          });
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue s'est produite"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>{isLogin ? "Connexion" : "Inscription"} | Cercle des Titans</title>
      </Helmet>
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-primary mb-2">
            Cercle des Titans
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? "Connectez-vous à votre espace membre" : "Rejoignez la communauté"}
          </p>
          {categoryFromUrl && !isLogin && (
            <div className="mt-4 flex items-center justify-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-4 py-3">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-foreground font-medium">
                Catégorie sélectionnée : <span className="text-primary">{categoryFromUrl}</span>
              </span>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* Social Sign In Buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>{isGoogleLoading ? "Connexion..." : "Continuer avec Google"}</span>
            </button>

            <button
              type="button"
              onClick={handleGitHubSignIn}
              disabled={isGitHubLoading}
              className="w-full flex items-center justify-center gap-3 bg-[#24292F] hover:bg-[#1b1f23] text-white font-medium py-3 px-4 rounded-xl border border-[#24292F] shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGitHubLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              )}
              <span>{isGitHubLoading ? "Connexion..." : "Continuer avec GitHub"}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jean"
                    required={!isLogin}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dupont"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="votre@email.com"
                  required
                  className={emailTouched && !emailValidation.valid ? "border-destructive focus-visible:ring-destructive" : emailTouched && emailValidation.valid && email ? "border-green-500 focus-visible:ring-green-500" : ""}
                />
                {emailTouched && email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {emailValidation.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                )}
              </div>
              {emailTouched && emailValidation.error && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {emailValidation.error}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  placeholder="••••••••"
                  required
                  className={passwordTouched && !passwordValidation.valid && !isLogin ? "border-destructive focus-visible:ring-destructive pr-16" : passwordTouched && passwordValidation.valid && password ? "border-green-500 focus-visible:ring-green-500 pr-16" : "pr-10"}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {passwordTouched && password && !isLogin && (
                    passwordValidation.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {/* Password strength indicator for signup */}
              {!isLogin && passwordTouched && password && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          passwordValidation.strength > i * 0.25
                            ? passwordValidation.strength >= 0.75
                              ? "bg-green-500"
                              : passwordValidation.strength >= 0.5
                              ? "bg-yellow-500"
                              : "bg-destructive"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Force : {passwordValidation.strength >= 0.75 ? "Fort" : passwordValidation.strength >= 0.5 ? "Moyen" : "Faible"}
                  </p>
                </div>
              )}
              
              {/* Password requirements for signup */}
              {!isLogin && passwordTouched && passwordValidation.errors.length > 0 && (
                <div className="space-y-1">
                  {passwordValidation.errors.map((error, i) => (
                    <p key={i} className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {isLogin && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                  Se souvenir de moi
                </Label>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || (!isLogin && !isFormValid)}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isLogin ? "Se connecter" : "S'inscrire"}
            </Button>

            {isLogin && (
              <div className="text-center mt-3">
                <Link
                  to="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            {isLogin ? (
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Pas encore membre ? S'inscrire
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Déjà membre ? Se connecter
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default Auth;
