import { ShieldCheck, Eye, ListChecks, ScrollText, BadgeCheck, HeartHandshake, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnimatedSection, FloatingElement, MagneticButton } from "@/components/AnimatedElements";

const TrustSection = () => {
  const { t } = useLanguage();

  const pillars = [
    { icon: Eye, title: t("trust.transparency.title"), description: t("trust.transparency.desc") },
    { icon: ListChecks, title: t("trust.tracking.title"), description: t("trust.tracking.desc") },
    { icon: ScrollText, title: t("trust.rules.title"), description: t("trust.rules.desc") },
    { icon: BadgeCheck, title: t("trust.payments.title"), description: t("trust.payments.desc") },
    { icon: HeartHandshake, title: t("trust.support.title"), description: t("trust.support.desc") },
  ];

  return (
    <section
      id="confiance"
      className="relative py-24 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden"
    >
      {/* Floating decorative elements (subtle gold/terracotta halos) */}
      <FloatingElement intensity="subtle" className="hidden xl:block absolute top-16 left-10 pointer-events-none">
        <div className="w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
      </FloatingElement>
      <FloatingElement intensity="medium" className="hidden xl:block absolute bottom-16 right-10 pointer-events-none">
        <div className="w-80 h-80 bg-terracotta/5 rounded-full blur-3xl" />
      </FloatingElement>

      <div className="max-w-6xl mx-auto relative z-10">
        <AnimatedSection animation="fade-up" className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full border border-gold/30 bg-gold/5 text-gold text-xs font-medium tracking-wide uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
            {t("trust.badge")}
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
            {t("trust.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("trust.subtitle")}
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((pillar, index) => (
            <AnimatedSection
              key={pillar.title}
              animation="fade-up"
              delay={(index % 3) * 120}
            >
              <article className="relative h-full overflow-hidden rounded-2xl p-7 border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-lg shadow-black/20 transition-all duration-500 group cursor-default hover:-translate-y-2 hover:border-gold/40 hover:shadow-2xl hover:shadow-gold/10">
                {/* Top gold hairline that reveals on hover */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-terracotta/10 flex items-center justify-center mb-5 ring-1 ring-white/10 group-hover:ring-gold/30 group-hover:scale-105 transition-all duration-300">
                  <pillar.icon className="w-6 h-6 text-gold" />
                </div>

                <h3 className="font-display text-lg text-foreground mb-2 group-hover:text-gold transition-colors duration-300">
                  {pillar.title}
                </h3>
                <p className="text-foreground/75 text-sm leading-relaxed">
                  {pillar.description}
                </p>

                {/* Hover glow */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-gold/0 to-gold/0 group-hover:from-gold/[0.06] group-hover:to-transparent transition-all duration-500" />
              </article>
            </AnimatedSection>
          ))}

          {/* Onboarding CTA card — completes the row of 5 + invites sign-up clearly */}
          <AnimatedSection animation="fade-up" delay={240}>
            <article className="relative h-full overflow-hidden rounded-2xl p-7 border border-gold/25 bg-gradient-to-br from-gold/[0.08] to-terracotta/[0.04] backdrop-blur-xl shadow-lg shadow-black/20 flex flex-col justify-center">
              <p className="text-foreground/80 text-sm leading-relaxed mb-5">
                {t("trust.ctaNote")}
              </p>
              <MagneticButton strength={0.2} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base font-semibold group" asChild>
                  <Link to="/#contact">
                    <span className="flex items-center justify-center">
                      {t("trust.cta")}
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </Button>
              </MagneticButton>
            </article>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
