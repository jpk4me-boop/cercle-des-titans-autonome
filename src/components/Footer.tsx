import { Facebook, Instagram, Linkedin, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Logo = () => (
  <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" className="text-gold" />
    <circle cx="20" cy="20" r="10" fill="currentColor" className="text-gold" />
    <circle cx="20" cy="20" r="4" fill="currentColor" className="text-background" />
  </svg>
);

export default function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { label: t('nav.home'), to: "/#accueil" },
    { label: t('nav.tontine'), to: "/#tontine" },
    { label: t('nav.howItWorks'), to: "/#comment-ca-marche" },
    { label: t('nav.testimonials'), to: "/#temoignages" },
    { label: "FAQ", to: "/#faq" },
    { label: t('footer.contact'), to: "/#contact" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com/cercledestitans", label: "Facebook" },
    { icon: Instagram, href: "https://instagram.com/cercledestitans", label: "Instagram" },
    { icon: Linkedin, href: "https://linkedin.com/company/cercledestitans", label: "LinkedIn" },
    { icon: Twitter, href: "https://twitter.com/cercledestitans", label: "Twitter" },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Logo />
              <span className="font-display text-xl font-bold text-gold">Cercle des Titans</span>
            </div>
            <p className="text-muted-foreground text-sm">{t('footer.description')}</p>
          </div>
          <div>
            <h4 className="font-display text-lg font-semibold text-gold mb-4">{t('footer.navigation')}</h4>
            <ul className="space-y-2">
              {navLinks.map(link => (
                <li key={link.label}><Link to={link.to} className="text-muted-foreground hover:text-gold transition-colors text-sm">{link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-lg font-semibold text-gold mb-4">{t('footer.contact')}</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground text-sm"><MapPin className="h-4 w-4 text-gold" /><span>Douala, Cameroun</span></li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm"><Phone className="h-4 w-4 text-gold" /><a href="tel:+237672482763" className="hover:text-gold">+237 672 482 763</a></li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm"><Mail className="h-4 w-4 text-gold" /><a href="mailto:contact@cercledestitans.com" className="hover:text-gold">contact@cercledestitans.com</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-lg font-semibold text-gold mb-4">{t('footer.followUs')}</h4>
            <div className="flex gap-3 mb-6">
              {socialLinks.map(social => (
                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center hover:bg-gold hover:text-background transition-colors">
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
            <div className="space-y-2">
              <Link to="/about" className="block text-muted-foreground hover:text-gold text-sm">{t('footer.legalMentions')}</Link>
              <Link to="/privacy-policy" className="block text-muted-foreground hover:text-gold text-sm">{t('footer.privacyPolicy')}</Link>
              <Link to="/terms-of-use" className="block text-muted-foreground hover:text-gold text-sm">{t('footer.terms')}</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-border mt-10 pt-6 text-center">
          <p className="text-muted-foreground text-sm">© {currentYear} Cercle des Titans. {t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
