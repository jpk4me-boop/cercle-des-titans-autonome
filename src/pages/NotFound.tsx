import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <svg width="64" height="64" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gold">
            <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="2"/>
            <circle cx="18" cy="18" r="9" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="18" cy="7" r="3.5" fill="currentColor"/>
            <circle cx="26" cy="22" r="3.5" fill="currentColor"/>
            <circle cx="10" cy="22" r="3.5" fill="currentColor"/>
            <path d="M18 12L22 20H14L18 12Z" fill="currentColor"/>
          </svg>
        </div>
        
        <h1 className="font-display text-7xl font-bold text-gold mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Page introuvable</h2>
        <p className="text-muted-foreground mb-8">
          Oups ! La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default" size="lg">
            <Link to="/" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Retour à l'accueil
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="javascript:history.back()" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Page précédente
            </a>
          </Button>
        </div>
        
        <div className="mt-12 p-6 bg-card rounded-xl border border-border">
          <h3 className="font-semibold text-foreground mb-3 flex items-center justify-center gap-2">
            <Search className="w-4 h-4 text-gold" />
            Pages populaires
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-gold transition-colors">Accueil</Link>
            <span className="text-border">•</span>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-gold transition-colors">À propos</Link>
            <span className="text-border">•</span>
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-gold transition-colors">Connexion</Link>
            <span className="text-border">•</span>
            <Link to="/categories/comparatif" className="text-sm text-muted-foreground hover:text-gold transition-colors">Catégories</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
