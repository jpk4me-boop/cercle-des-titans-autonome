import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message
        });
      } else {
        setIsEmailSent(true);
        toast({
          title: "Email envoyé",
          description: "Vérifiez votre boîte de réception pour réinitialiser votre mot de passe."
        });
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

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Mot de passe oublié | Cercle des Titans</title>
      </Helmet>
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-primary mb-2">
              Mot de passe oublié
            </h1>
          <p className="text-muted-foreground">
            {isEmailSent 
              ? "Vérifiez votre boîte de réception" 
              : "Entrez votre email pour réinitialiser votre mot de passe"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {isEmailSent ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Email envoyé !</h2>
                <p className="text-muted-foreground text-sm">
                  Si un compte existe avec l'adresse <span className="font-medium text-foreground">{email}</span>, 
                  vous recevrez un lien de réinitialisation.
                </p>
              </div>
              <div className="pt-4 space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setIsEmailSent(false);
                    setEmail('');
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Renvoyer l'email
                </Button>
                <Link to="/auth">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour à la connexion
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Envoyer le lien
                  </>
                )}
              </Button>

              <div className="text-center">
                <Link 
                  to="/auth" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Retour à la connexion
                </Link>
              </div>
            </form>
          )}
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

export default ForgotPassword;
