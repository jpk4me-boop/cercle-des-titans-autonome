import { Shield, Users, TrendingUp, Heart, Sparkles, HandCoins } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnimatedSection, ParallaxLayer, FloatingElement } from "@/components/AnimatedElements";

const TontineSection = () => {
  const { t } = useLanguage();

  const advantages = [
    {
      icon: Shield,
      title: t('advantage.noInterest.title'),
      description: t('advantage.noInterest.desc'),
    },
    {
      icon: Users,
      title: t('advantage.solidarity.title'),
      description: t('advantage.solidarity.desc'),
    },
    {
      icon: TrendingUp,
      title: t('advantage.discipline.title'),
      description: t('advantage.discipline.desc'),
    },
    {
      icon: Heart,
      title: t('advantage.social.title'),
      description: t('advantage.social.desc'),
    },
    {
      icon: Sparkles,
      title: t('advantage.access.title'),
      description: t('advantage.access.desc'),
    },
    {
      icon: HandCoins,
      title: t('advantage.flexibility.title'),
      description: t('advantage.flexibility.desc'),
    },
  ];

  return (
    <section id="tontine" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-card/50 pattern-kente overflow-hidden">
      {/* Parallax background elements */}
      <FloatingElement intensity="subtle" className="absolute top-20 left-10 pointer-events-none">
        <div className="w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
      </FloatingElement>
      <FloatingElement intensity="medium" className="absolute bottom-20 right-10 pointer-events-none">
        <div className="w-80 h-80 bg-terracotta/5 rounded-full blur-3xl" />
      </FloatingElement>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <AnimatedSection animation="fade-left" delay={0}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold font-medium text-sm uppercase tracking-wider mb-4 hover:bg-gold/20 transition-colors cursor-default">
              {t('about.heritage')}
            </span>
            <h2 className="font-display text-4xl md:text-5xl mt-2 mb-6 text-foreground">
              {t('about.title')}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              {t('about.description1')}
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {t('about.description2')}
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fade-right" delay={200}>
            <ParallaxLayer speed={0.2} direction="up">
              <div className="relative group">
                <div className="bg-gradient-to-br from-earth to-earth-light rounded-3xl p-8 text-foreground border border-gold/20 shadow-2xl transition-all duration-500 group-hover:shadow-gold/10 group-hover:border-gold/40 group-hover:-translate-y-2">
                  <h3 className="font-display text-2xl text-gold mb-6">
                    {t('about.exampleTitle')}
                  </h3>
                  <div className="space-y-4 text-foreground/90">
                    <p className="text-lg">{t('about.exampleText1')}</p>
                    <p className="text-lg">{t('about.exampleText2')}</p>
                    <div className="text-3xl font-display font-bold text-gold mt-4 animate-pulse-glow inline-block px-4 py-2 rounded-lg bg-gold/5">
                      {t('about.exampleAmount')}
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-gold/20">
                    <p className="text-sm text-muted-foreground">{t('about.exampleFooter')}</p>
                  </div>
                </div>
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-gold/15 rounded-full blur-3xl group-hover:bg-gold/25 transition-colors duration-500" />
                <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-terracotta/15 rounded-full blur-3xl group-hover:bg-terracotta/25 transition-colors duration-500" />
              </div>
            </ParallaxLayer>
          </AnimatedSection>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {advantages.map((advantage, index) => (
            <AnimatedSection
              key={index}
              animation="fade-up"
              delay={index * 100}
            >
              <div className="h-full bg-card rounded-2xl p-6 border border-border hover:border-gold/30 hover:shadow-xl hover:shadow-gold/5 transition-all duration-500 group cursor-default hover:-translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-br from-gold/20 to-terracotta/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <advantage.icon className="w-7 h-7 text-gold group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="font-display text-xl text-foreground mb-3 group-hover:text-gold transition-colors duration-300">
                  {advantage.title}
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {advantage.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TontineSection;
