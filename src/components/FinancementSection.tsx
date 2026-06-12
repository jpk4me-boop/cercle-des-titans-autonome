import { Wallet, TrendingUp, Shield, Clock, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const FinancementSection = () => {
  const { ref, isVisible } = useScrollAnimation<HTMLElement>();
  const { t } = useLanguage();

  const financementOptions = [
    {
      icon: Wallet,
      title: t('financing.projects.title'),
      description: t('financing.projects.desc'),
      amount: t('financing.projects.amount'),
      gradient: "from-gold to-gold-light",
    },
    {
      icon: TrendingUp,
      title: t('financing.investment.title'),
      description: t('financing.investment.desc'),
      amount: t('financing.investment.amount'),
      gradient: "from-terracotta to-terracotta-light",
    },
    {
      icon: Shield,
      title: t('financing.emergency.title'),
      description: t('financing.emergency.desc'),
      amount: t('financing.emergency.amount'),
      gradient: "from-forest to-forest-light",
    },
    {
      icon: Clock,
      title: t('financing.loan.title'),
      description: t('financing.loan.desc'),
      amount: t('financing.loan.amount'),
      gradient: "from-gold-dark to-gold",
    },
  ];

  return (
    <section
      id="financement"
      ref={ref}
      className={`py-24 px-6 bg-card/50 pattern-kente transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6">
            <Wallet className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-gold uppercase tracking-wider">
              {t('financing.title')}
            </span>
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
            {t('financing.title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('financing.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {financementOptions.map((option, index) => (
            <div
              key={index}
              className={`group relative bg-card rounded-2xl p-6 border border-border hover:border-gold/40 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
              
              <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${option.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                <option.icon className="w-7 h-7 text-background" />
              </div>
              
              <h3 className="relative font-display text-xl text-foreground mb-3">
                {option.title}
              </h3>
              
              <p className="relative text-muted-foreground text-sm mb-5 leading-relaxed">
                {option.description}
              </p>
              
              <span className={`relative inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${option.gradient} text-background text-sm font-semibold shadow-md`}>
                {option.amount}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" className="group text-base font-semibold" asChild>
            <Link to="/financement/fonds-de-financement">
              {t('financing.cta')}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FinancementSection;
