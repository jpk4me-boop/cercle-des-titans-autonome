import { Check, ArrowRight, Sparkles, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImageWebp from "@/assets/hero-team-titans.webp";
import { FloatingElement, MagneticButton, ParallaxLayer } from "@/components/AnimatedElements";
import { useMouseParallax } from "@/hooks/useParallax";
import { trackEvent } from "@/lib/analyticsTracker";
import { buildPublicWhatsAppUrl } from "@/lib/whatsapp";

const HeroSection = () => {
  const { t } = useLanguage();
  const mousePosition = useMouseParallax(0.02);

  const features = [
    t('hero.feature1'),
    t('hero.feature2'),
    t('hero.feature3'),
    t('hero.feature4'),
  ];

  return (
    <section id="accueil" className="relative min-h-[100svh] flex items-center overflow-hidden">
      {/* Background with African pattern overlay */}
      <div className="absolute inset-0 z-0 bg-black overflow-hidden">
        {/* Static image layer: no scale and no transform, so the box can never
            exceed the viewport (object-cover keeps it full-bleed and elegant). */}
        <div className="absolute inset-0">
          <picture className="block w-full h-full">
            <source srcSet={heroImageWebp} type="image/webp" />
            <img
              src={heroImageWebp}
              alt="Équipe professionnelle du Cercle des Titans dans un bureau premium"
              className="w-full h-full max-w-full object-cover object-center sm:object-[58%_center] lg:object-[60%_center] brightness-115 contrast-105 saturate-110"
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />
          </picture>
        </div>
        {/* Layer 1: global tint — a bit darker on mobile for readability, very light on desktop */}
        <div className="absolute inset-0 bg-black/45 sm:bg-black/15 md:bg-black/10" />
        {/* Layer 2: fade behind the text. Full-width & strong on mobile, limited width on desktop. */}
        <div className="absolute inset-y-0 left-0 w-full sm:w-[72%] md:w-[55%] lg:w-[48%] bg-gradient-to-r from-black/85 via-black/55 to-transparent sm:from-black/80 sm:via-black/45 md:from-black/75 md:via-black/40" />
        {/* Layer 3: top band so the Navbar stays legible without darkening the whole image */}
        <div className="absolute inset-x-0 top-0 h-28 sm:h-32 md:h-40 bg-gradient-to-b from-black/70 via-black/25 to-transparent" />
        {/* Layer 4: very subtle warm gold halo */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-gold/10" />
        <div className="absolute inset-0 pattern-adinkra opacity-20" />
      </div>

      {/* Decorative floating elements with parallax */}
      <FloatingElement intensity="subtle" className="hidden xl:block absolute top-1/4 right-1/4 pointer-events-none">
        <ParallaxLayer speed={0.3} direction="up">
          <div className="w-72 h-72 bg-gold/10 rounded-full blur-3xl animate-pulse-glow" />
        </ParallaxLayer>
      </FloatingElement>

      <FloatingElement intensity="medium" className="hidden xl:block absolute bottom-1/4 right-1/3 pointer-events-none">
        <ParallaxLayer speed={0.5} direction="down">
          <div className="w-96 h-96 bg-terracotta/10 rounded-full blur-3xl" />
        </ParallaxLayer>
      </FloatingElement>

      {/* Additional floating orbs */}
      <div
        className="hidden xl:block absolute top-1/3 right-1/6 w-32 h-32 bg-gold/20 rounded-full blur-2xl animate-float pointer-events-none"
        style={{
          transform: `translate3d(${mousePosition.x * 2}px, ${mousePosition.y * 2}px, 0)`,
        }}
      />
      <div
        className="hidden xl:block absolute bottom-1/3 right-1/4 w-24 h-24 bg-forest/10 rounded-full blur-xl animate-float-slow pointer-events-none"
        style={{
          animationDelay: '1s',
          transform: `translate3d(${mousePosition.x * -1.5}px, ${mousePosition.y * -1.5}px, 0)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-5 sm:px-6 pt-20 sm:pt-28 pb-[calc(env(safe-area-inset-bottom)+4.5rem)] sm:pb-16">
        <div className="max-w-xl md:max-w-2xl [text-shadow:0_2px_14px_rgba(0,0,0,0.55)]">
          {/* Badge with bounce animation */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gold/10 border border-gold/20 mb-4 sm:mb-8 opacity-0 animate-fade-in-up hover:bg-gold/15 hover:scale-105 transition-all duration-300 cursor-default">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-gold">Circle of Titans</span>
          </div>

          <h1 className="font-display text-[1.85rem] leading-[1.15] sm:text-5xl md:text-6xl lg:text-7xl font-bold sm:leading-[1.1] mb-4 sm:mb-8 [text-shadow:0_3px_20px_rgba(0,0,0,0.65)]">
            <span 
              className="text-foreground inline-block opacity-0 animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              {t('hero.title1')}
            </span>
            <br />
            <span 
              className="gradient-text inline-block opacity-0 animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              {t('hero.title2')}
            </span>
            <br />
            <span 
              className="text-foreground inline-block opacity-0 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              {t('hero.title3')}
            </span>
          </h1>

          <p
            className="text-[0.9375rem] sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-10 leading-relaxed max-w-xl opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            {t('hero.subtitle')}
          </p>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 mb-7 sm:mb-12 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.5s" }}
          >
            {features.map((feature, index) => (
              <div 
                key={feature} 
                className="flex items-center gap-3 group cursor-default"
                style={{ animationDelay: `${0.5 + index * 0.1}s` }}
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gold/20 flex items-center justify-center shrink-0 group-hover:bg-gold/40 group-hover:scale-110 transition-all duration-300">
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold" />
                </div>
                <span className="text-[0.8125rem] sm:text-base font-medium text-foreground/90 group-hover:text-gold transition-colors duration-300">{feature}</span>
              </div>
            ))}
          </div>

          <div 
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.7s" }}
          >
            <MagneticButton strength={0.2} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base font-semibold group relative overflow-hidden shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-shadow" asChild>
                <Link to="/auth?mode=signup" onClick={() => void trackEvent("click", { label: "hero_primary_cta" })}>
                  <span className="relative z-10 flex items-center">
                    {t('hero.cta')}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-gold-light to-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              </Button>
            </MagneticButton>
            <MagneticButton strength={0.2} className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base font-medium group hover:border-gold/50 hover:bg-gold/5 transition-all duration-300" asChild>
                <Link to="/#comment-ca-marche" onClick={() => void trackEvent("click", { label: "hero_secondary_cta" })}>
                  <span className="group-hover:text-gold transition-colors">{t('hero.ctaSecondary')}</span>
                </Link>
              </Button>
            </MagneticButton>
            <MagneticButton strength={0.2} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto border border-emerald-300 bg-emerald-500 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400" asChild>
                <a
                  href={buildPublicWhatsAppUrl("Bonjour, je souhaite avoir des informations sur le Cercle des Titans.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => void trackEvent("click", { label: "whatsapp_public_home" })}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Écrire sur WhatsApp
                </a>
              </Button>
            </MagneticButton>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      
      {/* Scroll indicator */}
      <div className="hidden sm:block absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in" style={{ animationDelay: "1.2s" }}>
        <div className="flex flex-col items-center gap-2 animate-bounce-subtle">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Scroll</span>
          <div className="w-5 h-8 border-2 border-gold/30 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-gold rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
