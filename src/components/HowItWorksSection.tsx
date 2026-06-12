import { Users, Calendar, Banknote, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnimatedSection, ParallaxLayer, FloatingElement } from "@/components/AnimatedElements";

const HowItWorksSection = () => {
  const { t } = useLanguage();

  const steps = [
    {
      icon: Users,
      number: "01",
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.desc'),
    },
    {
      icon: Calendar,
      number: "02",
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.desc'),
    },
    {
      icon: Banknote,
      number: "03",
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.desc'),
    },
  ];

  return (
    <section id="comment-ca-marche" className="relative py-24 px-6 bg-gradient-to-b from-earth to-earth-light pattern-adinkra overflow-hidden">
      {/* Parallax decorative elements */}
      <FloatingElement intensity="subtle" className="absolute top-1/4 -left-20 pointer-events-none">
        <div className="w-80 h-80 bg-gold/10 rounded-full blur-3xl" />
      </FloatingElement>
      <FloatingElement intensity="medium" className="absolute bottom-1/4 -right-20 pointer-events-none">
        <div className="w-96 h-96 bg-terracotta/10 rounded-full blur-3xl" />
      </FloatingElement>

      <div className="max-w-6xl mx-auto relative z-10">
        <AnimatedSection animation="fade-up" className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl text-gold mb-4">
            {t('howItWorks.title')}
          </h2>
          <p className="text-foreground/80 text-lg max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Animated connection lines */}
          <div className="hidden md:block absolute top-24 left-1/3 w-1/3 h-0.5 bg-gradient-to-r from-gold/50 to-gold/50 origin-left animate-[scale-in_1s_ease-out_0.5s_forwards] opacity-0" style={{ animationFillMode: 'forwards' }} />
          <div className="hidden md:block absolute top-24 right-1/3 w-1/3 h-0.5 bg-gradient-to-r from-gold/50 to-gold/50 origin-left animate-[scale-in_1s_ease-out_0.8s_forwards] opacity-0" style={{ animationFillMode: 'forwards' }} />

          {steps.map((step, index) => (
            <AnimatedSection
              key={index}
              animation="fade-up"
              delay={index * 200}
            >
              <ParallaxLayer speed={0.1 * (index + 1)} direction="up">
                <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl p-8 border border-gold/20 hover:border-gold/40 hover:shadow-2xl hover:shadow-gold/10 transition-all duration-500 group cursor-default hover:-translate-y-3">
                  {/* Animated number badge */}
                  <div className="absolute -top-5 left-8 bg-gradient-to-r from-gold to-gold-light text-background font-display text-xl font-bold px-5 py-2 rounded-full shadow-lg group-hover:scale-110 group-hover:shadow-gold/30 transition-all duration-300">
                    {step.number}
                  </div>

                  <div className="mt-6 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-gold/15 to-terracotta/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <step.icon className="w-10 h-10 text-gold group-hover:animate-bounce-subtle" />
                    </div>
                  </div>

                  <h3 className="font-display text-2xl text-foreground mb-4 group-hover:text-gold transition-colors duration-300">
                    {step.title}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>

                  {index < steps.length - 1 && (
                    <div className="hidden md:flex absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gold/20 rounded-full items-center justify-center z-10 group-hover:bg-gold/40 group-hover:scale-125 transition-all duration-300">
                      <ArrowRight className="w-4 h-4 text-gold" />
                    </div>
                  )}

                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gold/0 to-gold/0 group-hover:from-gold/5 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
                </div>
              </ParallaxLayer>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
