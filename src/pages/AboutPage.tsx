import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Shield, 
  Target, 
  Users, 
  Heart, 
  Eye, 
  Award,
  ArrowRight,
  Sparkles,
  Calendar,
  TrendingUp,
  Globe
} from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const AboutPage = () => {
  const { t } = useLanguage();
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation<HTMLElement>();
  const { ref: missionRef, isVisible: missionVisible } = useScrollAnimation<HTMLElement>();
  const { ref: historyRef, isVisible: historyVisible } = useScrollAnimation<HTMLElement>();
  const { ref: valuesRef, isVisible: valuesVisible } = useScrollAnimation<HTMLElement>();

  const values = [
    { icon: Shield, titleKey: 'trust', color: 'from-gold to-gold-light' },
    { icon: Target, titleKey: 'discipline', color: 'from-terracotta to-terracotta-light' },
    { icon: TrendingUp, titleKey: 'empowerment', color: 'from-forest to-forest-light' },
    { icon: Heart, titleKey: 'solidarity', color: 'from-gold-dark to-gold' },
    { icon: Eye, titleKey: 'transparency', color: 'from-cyan-500 to-cyan-400' },
    { icon: Award, titleKey: 'excellence', color: 'from-violet-500 to-violet-400' },
  ];

  const milestones = [
    { yearKey: 'milestone1', icon: Sparkles },
    { yearKey: 'milestone2', icon: Globe },
    { yearKey: 'milestone3', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className={`pt-32 pb-20 px-6 bg-gradient-to-b from-earth to-background relative overflow-hidden transition-all duration-700 ${
          heroVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute inset-0 pattern-kente opacity-20" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-gold uppercase tracking-wider">
              {t('aboutPage.hero.badge')}
            </span>
          </div>
          
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
            {t('aboutPage.hero.title')}
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('aboutPage.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section 
        ref={missionRef}
        className={`py-24 px-6 bg-card/50 transition-all duration-700 ${
          missionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold font-medium text-sm uppercase tracking-wider mb-4">
                {t('aboutPage.mission.badge')}
              </div>
              <h2 className="font-display text-4xl md:text-5xl text-foreground mb-6">
                {t('aboutPage.mission.title')}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {t('aboutPage.mission.text1')}
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t('aboutPage.mission.text2')}
              </p>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-earth to-earth-light rounded-3xl p-10 border border-gold/20">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { number: '500+', label: 'Members' },
                    { number: '6', label: 'Categories' },
                    { number: '100%', label: 'Transparent' },
                    { number: '0%', label: 'Interest' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-4 rounded-2xl bg-background/50 border border-border">
                      <div className="text-3xl font-display font-bold text-gold mb-1">{stat.number}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-gold/15 rounded-full blur-3xl" />
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-terracotta/15 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section 
        ref={historyRef}
        className={`py-24 px-6 bg-background pattern-adinkra transition-all duration-700 ${
          historyVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6">
              <Calendar className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-gold uppercase tracking-wider">
                {t('aboutPage.history.badge')}
              </span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-6">
              {t('aboutPage.history.title')}
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {t('aboutPage.history.text1')}
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t('aboutPage.history.text2')}
              </p>
            </div>
            
            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-4 p-6 rounded-2xl bg-card border border-border hover:border-gold/30 transition-colors"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center flex-shrink-0">
                    <milestone.icon className="w-7 h-7 text-background" />
                  </div>
                  <div>
                    <div className="text-gold font-bold text-sm mb-1">
                      {t(`aboutPage.history.${milestone.yearKey}.year`)}
                    </div>
                    <h4 className="font-display text-xl text-foreground mb-1">
                      {t(`aboutPage.history.${milestone.yearKey}.title`)}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {t(`aboutPage.history.${milestone.yearKey}.desc`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section 
        ref={valuesRef}
        className={`py-24 px-6 bg-gradient-to-b from-earth to-earth-light transition-all duration-700 ${
          valuesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6">
              <Heart className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-gold uppercase tracking-wider">
                {t('aboutPage.values.badge')}
              </span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              {t('aboutPage.values.title')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="group bg-card rounded-2xl p-8 border border-border hover:border-gold/40 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <value.icon className="w-8 h-8 text-background" />
                </div>
                <h3 className="font-display text-2xl text-foreground mb-3">
                  {t(`aboutPage.values.${value.titleKey}.title`)}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t(`aboutPage.values.${value.titleKey}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-gold/10 via-card to-terracotta/10 rounded-3xl p-12 border border-gold/20">
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              {t('aboutPage.cta.title')}
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              {t('aboutPage.cta.subtitle')}
            </p>
            <Button size="lg" className="group text-base font-semibold" asChild>
              <Link to="/auth">
                {t('aboutPage.cta.button')}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
