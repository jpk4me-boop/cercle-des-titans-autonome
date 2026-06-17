import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Check, Crown, Star, Diamond, Award, Medal, Shield, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useLanguage } from "@/contexts/LanguageContext";

interface Category {
  nameKey: string;
  amount: string;
  taglineKey: string;
  benefitKeys: string[];
  icon: React.ReactNode;
  isPrestige?: boolean;
  gradient: string;
}

const categories: Category[] = [
  {
    nameKey: "bronze",
    amount: "5 000 FCFA",
    taglineKey: "bronze",
    benefitKeys: ["structuredTontine", "financialDiscipline", "communityIntegration", "basicOpportunities", "microFinancing"],
    icon: <Shield className="w-7 h-7" />,
    gradient: "from-amber-700 to-amber-600",
  },
  {
    nameKey: "silver",
    amount: "10 000 FCFA",
    taglineKey: "silver",
    benefitKeys: ["enhancedTontine", "improvedBonus", "priorityAccess", "activeNetwork", "projectFinancing"],
    icon: <Medal className="w-7 h-7" />,
    gradient: "from-slate-400 to-slate-300",
  },
  {
    nameKey: "gold",
    amount: "25 000 FCFA",
    taglineKey: "gold",
    benefitKeys: ["higherGains", "reinforcedBonus", "fundingEligibility", "communityRecognition"],
    icon: <Award className="w-7 h-7" />,
    gradient: "from-gold to-gold-light",
  },
  {
    nameKey: "diamond",
    amount: "50 000 FCFA",
    taglineKey: "diamond",
    benefitKeys: ["highImpact", "highBonus", "fundingPriority", "strategicPosition"],
    icon: <Diamond className="w-7 h-7" />,
    gradient: "from-cyan-400 to-cyan-300",
  },
  {
    nameKey: "platinum",
    amount: "100 000 FCFA",
    taglineKey: "platinum",
    benefitKeys: ["privilegedAccess", "premiumBonus", "strategicSupport", "enhancedVisibility"],
    icon: <Star className="w-7 h-7" />,
    gradient: "from-violet-400 to-violet-300",
  },
  {
    nameKey: "prestige",
    amount: "200 000 FCFA",
    taglineKey: "prestige",
    benefitKeys: ["maxFundAccess", "exclusiveBonus", "eliteNetwork", "priorityTreatment"],
    icon: <Crown className="w-7 h-7" />,
    gradient: "from-gold-dark to-gold",
    isPrestige: true,
  },
];

const CategoryCard = ({ category, index }: { category: Category; index: number }) => {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const categoryName = t(`category.${category.nameKey}.name`);

  return (
    <div
      ref={ref}
      className={`
        relative flex flex-col rounded-2xl overflow-hidden transition-all duration-500
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
        ${category.isPrestige 
          ? "bg-gradient-to-br from-gold/20 via-card to-gold/10 border-2 border-gold shadow-2xl shadow-gold/20 scale-105 lg:scale-105 z-10" 
          : "bg-card border border-border hover:border-gold/40 hover:shadow-xl"
        }
      `}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {category.isPrestige && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-gold to-gold-light text-background text-center py-2 text-sm font-bold tracking-wide">
          {t('membership.recommended')}
        </div>
      )}

      <div className={`p-6 ${category.isPrestige ? 'pt-12' : ''}`}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${category.gradient} text-background shadow-lg`}>
            {category.icon}
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-foreground">
              {categoryName}
            </h3>
            <p className="text-muted-foreground text-sm">{t(`category.${category.taglineKey}.tagline`)}</p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-6 pb-6 border-b border-border">
          <span className={`text-3xl font-bold font-display ${category.isPrestige ? "gradient-text" : "text-foreground"}`}>
            {category.amount}
          </span>
          <span className="text-muted-foreground text-sm ml-2">{t('membership.perWeek')}</span>
        </div>

        {/* Benefits */}
        <ul className="space-y-3 mb-6 flex-1">
          {category.benefitKeys.map((key, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className={`mt-0.5 p-1 rounded-full flex-shrink-0 ${category.isPrestige ? "bg-gold text-background" : "bg-gold/20 text-gold"}`}>
                <Check className="w-3 h-3" />
              </div>
              <span className="text-foreground/90 text-sm">{t(`benefit.${key}`)}</span>
            </li>
          ))}
        </ul>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 mt-auto">
          <Button
            onClick={() => navigate(`/auth?category=${encodeURIComponent(categoryName)}&mode=signup`)}
            className={`w-full font-semibold py-6 transition-all duration-300 ${
              category.isPrestige 
                ? "bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-background shadow-lg shadow-gold/30" 
                : "bg-secondary hover:bg-gold hover:text-background border border-border"
            }`}
          >
            {t('membership.join')}
          </Button>
          <Link
            to={`/categorie/${category.nameKey}`}
            className="text-sm text-center text-muted-foreground hover:text-gold transition-colors flex items-center justify-center gap-1"
          >
            {t('membership.learnMore')}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const MembershipCategoriesSection = () => {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation<HTMLDivElement>();
  const { t } = useLanguage();

  return (
    <section id="categories" className="py-24 bg-background relative overflow-hidden pattern-adinkra">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-terracotta/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-700 ${titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-gold uppercase tracking-wider">
              {t('membership.badge')}
            </span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t('membership.title')} <span className="gradient-text">{t('membership.titleHighlight')}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t('membership.subtitle')}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {categories.map((category, index) => (
            <CategoryCard key={category.nameKey} category={category} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className={`text-center mt-16 transition-all duration-700 delay-500 ${titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 px-8 py-6 rounded-2xl bg-card border border-border">
            <p className="text-muted-foreground">{t('membership.helpText')}</p>
            <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-background" asChild>
              <Link to="/#contact">{t('membership.contactUs')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MembershipCategoriesSection;
