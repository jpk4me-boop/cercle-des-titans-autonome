import { TrendingUp, Users, Building2, ShieldCheck, Sparkles, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnimatedSection, FloatingElement, ParallaxLayer } from "@/components/AnimatedElements";

const BenefitsSection = () => {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: TrendingUp,
      title: t('benefits.growth.title'),
      description: t('benefits.growth.desc'),
      color: "from-gold to-gold-light",
    },
    {
      icon: Users,
      title: t('benefits.community.title'),
      description: t('benefits.community.desc'),
      color: "from-terracotta to-terracotta-light",
    },
    {
      icon: Building2,
      title: t('benefits.noBank.title'),
      description: t('benefits.noBank.desc'),
      color: "from-forest to-forest-light",
    },
    {
      icon: ShieldCheck,
      title: t('benefits.trust.title'),
      description: t('benefits.trust.desc'),
      color: "from-gold-dark to-gold",
    },
  ];

  return (
    <section id="benefits" className="py-24 px-6 bg-background relative overflow-hidden">
      {/* Decorative floating background elements */}
      <FloatingElement intensity="subtle" className="absolute top-0 left-0 pointer-events-none">
        <div className="w-96 h-96 bg-gold/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </FloatingElement>
      <FloatingElement intensity="medium" className="absolute bottom-0 right-0 pointer-events-none">
        <div className="w-80 h-80 bg-terracotta/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </FloatingElement>

      <div className="max-w-6xl mx-auto relative z-10">
        <AnimatedSection animation="fade-up" className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6 hover:bg-gold/15 hover:scale-105 transition-all duration-300 cursor-default">
            <Sparkles className="w-4 h-4 text-gold animate-pulse" />
            <span className="text-sm font-medium text-gold uppercase tracking-wider">
              {t('benefits.title')}
            </span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
            {t('benefits.title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('benefits.subtitle')}
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <AnimatedSection
              key={index}
              animation="fade-up"
              delay={index * 100}
            >
              <ParallaxLayer speed={0.05 * (index + 1)} direction="up">
                <div className="group relative h-full bg-card rounded-2xl p-8 border border-border hover:border-gold/40 transition-all duration-500 hover:shadow-2xl hover:shadow-gold/5 hover:-translate-y-3 cursor-default">
                  {/* Gradient accent line with animation */}
                  <div className={`absolute top-0 left-6 right-6 h-1 rounded-b-full bg-gradient-to-r ${benefit.color} opacity-0 group-hover:opacity-100 transition-all duration-500 scale-x-0 group-hover:scale-x-100`} />
                  
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg group-hover:shadow-xl`}>
                    <benefit.icon className="w-8 h-8 text-background" />
                  </div>

                  <h3 className="font-display text-xl text-foreground mb-3 group-hover:text-gold transition-colors duration-300">
                    {benefit.title}
                  </h3>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {benefit.description}
                  </p>

                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold/0 to-gold/0 group-hover:from-gold/5 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
                </div>
              </ParallaxLayer>
            </AnimatedSection>
          ))}
        </div>

        {/* Animated bottom highlight */}
        <AnimatedSection animation="scale" delay={500} className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-gold/10 via-terracotta/10 to-gold/10 border border-gold/20 hover:border-gold/40 hover:scale-105 transition-all duration-300 cursor-default group">
            <Heart className="w-5 h-5 text-gold group-hover:scale-125 group-hover:animate-pulse transition-transform duration-300" />
            <p className="text-foreground font-medium">
              {t('benefits.community.desc')}
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default BenefitsSection;
