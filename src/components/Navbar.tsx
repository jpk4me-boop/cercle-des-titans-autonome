import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, ChevronDown, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analyticsTracker";
import LanguageToggle from "@/components/LanguageToggle";
import InstallAppButton from "@/components/InstallAppButton";
import SuperAdminBadge from "@/components/SuperAdminBadge";
import phoenixLogo from "@/assets/logo-phoenix.jpg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Logo = () => (
  <img
    src={phoenixLogo}
    alt="Logo Cercle des Titans"
    className="h-10 w-10 rounded-full object-contain border border-gold/30 bg-black/80 shadow-sm"
  />
);

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTontineOpen, setIsTontineOpen] = useState(false);
  const [isFinancementOpen, setIsFinancementOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "super_admin"]);

      const roles = data ?? [];
      setIsAdmin(roles.length > 0);
      setIsSuperAdmin(roles.some((r) => r.role === "super_admin"));
    };

    checkAdminRole();
  }, [user]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);
  const toggleTontine = () => setIsTontineOpen(!isTontineOpen);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-background/95 backdrop-blur-md border-b border-border/50 shadow-lg' : 'bg-transparent'
    }`}>
      <nav className="container mx-auto flex items-center justify-between py-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3 group">
          <Logo />
          <span className="font-display text-lg sm:text-xl font-bold text-gold group-hover:text-gold-light transition-colors whitespace-nowrap">
            Cercle des Titans
          </span>
        </Link>

        <ul className="hidden lg:flex items-center gap-8">
          <li>
            <Link
              to="/#accueil"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-gold"
            >
              {t('nav.home')}
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-gold"
            >
              {t('nav.about')}
            </Link>
          </li>
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-gold focus:outline-none">
                {t('nav.tontine')}
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border border-border">
                <DropdownMenuItem asChild>
                  <Link to="/#tontine" className="cursor-pointer">
                    {t('nav.presentation')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/#categories" className="cursor-pointer">
                    {t('nav.categories')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/categories/comparatif" className="cursor-pointer">
                    {t('nav.comparison')}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-gold focus:outline-none">
                {t('nav.financing')}
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border border-border">
                <DropdownMenuItem asChild>
                  <Link to="/#financement" className="cursor-pointer">
                    {t('nav.presentation')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/financement/fonds-de-financement" className="cursor-pointer">
                    {t('nav.financingFund')}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
          <li>
            <Link
              to="/#comment-ca-marche"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-gold"
            >
              {t('nav.howItWorks')}
            </Link>
          </li>
          <li>
            <Link
              to="/#temoignages"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-gold"
            >
              {t('nav.testimonials')}
            </Link>
          </li>
          <li>
            <Link
              to="/blog"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-gold"
            >
              Blog
            </Link>
          </li>
          <li>
            <Link
              to="/bourse-rentree"
              className="text-sm font-medium text-gold/90 transition-colors hover:text-gold"
            >
              Bourse Rentrée
            </Link>
          </li>
        </ul>

        <div className="hidden sm:flex items-center gap-3">
          <LanguageToggle />
          <InstallAppButton className="hidden md:inline-flex" />
          <SuperAdminBadge show={isSuperAdmin} className="hidden md:inline-flex" />
          {isAdmin && (
            <Link to="/admin">
              <Button variant="outline" size="sm" className="border-gold/50 text-gold hover:bg-gold/10">
                <Shield className="w-4 h-4 mr-2" />
                {t('nav.admin')}
              </Button>
            </Link>
          )}
          {!loading && (
            <Link
              to={user ? "/dashboard" : "/auth"}
              onClick={() => void trackEvent("click", { label: user ? "navbar_member_area" : "navbar_login" })}
            >
              <Button variant="default" size="sm">
                {user ? (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    {t('nav.memberArea')}
                  </>
                ) : (
                  t('nav.join')
                )}
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageToggle />
          <button
            onClick={toggleMenu}
            className="p-2 text-foreground hover:text-gold transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Mobile menu panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-card z-50 transform transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <span className="font-display text-xl font-bold text-gold">{t('nav.menu')}</span>
          <button
            onClick={closeMenu}
            className="p-2 text-foreground hover:text-gold transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <ul className="flex flex-col p-6 gap-4">
          <li>
            <Link
              to="/#accueil"
              onClick={closeMenu}
              className="block py-2 text-lg font-medium text-foreground transition-colors hover:text-gold"
            >
              {t('nav.home')}
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              onClick={closeMenu}
              className="block py-2 text-lg font-medium text-foreground transition-colors hover:text-gold"
            >
              {t('nav.about')}
            </Link>
          </li>
          <li>
            <button
              onClick={toggleTontine}
              className="flex items-center justify-between w-full py-2 text-lg font-medium text-foreground transition-colors hover:text-gold"
            >
              {t('nav.tontine')}
              <ChevronDown className={`h-5 w-5 transition-transform ${isTontineOpen ? "rotate-180" : ""}`} />
            </button>
            {isTontineOpen && (
              <ul className="pl-4 mt-2 space-y-2 border-l border-border">
                <li>
                  <Link
                    to="/#tontine"
                    onClick={closeMenu}
                    className="block py-2 text-base text-muted-foreground transition-colors hover:text-gold"
                  >
                    {t('nav.presentation')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/#categories"
                    onClick={closeMenu}
                    className="block py-2 text-base text-muted-foreground transition-colors hover:text-gold"
                  >
                    {t('nav.categories')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/categories/comparatif"
                    onClick={closeMenu}
                    className="block py-2 text-base text-muted-foreground transition-colors hover:text-gold"
                  >
                    {t('nav.comparison')}
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li>
            <button
              onClick={() => setIsFinancementOpen(!isFinancementOpen)}
              className="flex items-center justify-between w-full py-2 text-lg font-medium text-foreground transition-colors hover:text-gold"
            >
              {t('nav.financing')}
              <ChevronDown className={`h-5 w-5 transition-transform ${isFinancementOpen ? "rotate-180" : ""}`} />
            </button>
            {isFinancementOpen && (
              <ul className="pl-4 mt-2 space-y-2 border-l border-border">
                <li>
                  <Link
                    to="/#financement"
                    onClick={closeMenu}
                    className="block py-2 text-base text-muted-foreground transition-colors hover:text-gold"
                  >
                    {t('nav.presentation')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/financement/fonds-de-financement"
                    onClick={closeMenu}
                    className="block py-2 text-base text-muted-foreground transition-colors hover:text-gold"
                  >
                    {t('nav.financingFund')}
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li>
            <Link
              to="/#comment-ca-marche"
              onClick={closeMenu}
              className="block py-2 text-lg font-medium text-foreground transition-colors hover:text-gold"
            >
              {t('nav.howItWorks')}
            </Link>
          </li>
          <li>
            <Link
              to="/#temoignages"
              onClick={closeMenu}
              className="block py-2 text-lg font-medium text-foreground transition-colors hover:text-gold"
            >
              {t('nav.testimonials')}
            </Link>
          </li>
          <li>
            <Link
              to="/blog"
              onClick={closeMenu}
              className="block py-2 text-lg font-medium text-foreground transition-colors hover:text-gold"
            >
              Blog
            </Link>
          </li>
          <li>
            <Link
              to="/bourse-rentree"
              onClick={closeMenu}
              className="block py-2 text-lg font-medium text-gold transition-colors hover:text-gold-light"
            >
              Bourse Rentrée
            </Link>
          </li>
        </ul>

        <div className="p-6 pt-0 space-y-3">
          <InstallAppButton fullWidth />
          {isSuperAdmin && (
            <SuperAdminBadge show={isSuperAdmin} className="w-full justify-center" />
          )}
          {isAdmin && (
            <Link to="/admin" onClick={closeMenu}>
              <Button variant="outline" className="w-full border-gold/50 text-gold hover:bg-gold/10">
                <Shield className="w-4 h-4 mr-2" />
                {t('nav.admin')}
              </Button>
            </Link>
          )}
          <Link
            to={user ? "/dashboard" : "/auth"}
            onClick={() => {
              closeMenu();
              void trackEvent("click", { label: user ? "navbar_member_area" : "navbar_login" });
            }}
          >
            <Button variant="default" className="w-full">
              {user ? (
                <>
                  <User className="w-4 h-4 mr-2" />
                  {t('nav.memberArea')}
                </>
              ) : (
                t('nav.join')
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
