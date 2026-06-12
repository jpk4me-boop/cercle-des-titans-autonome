import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Lock, Eye, FileText, Users, Globe } from "lucide-react";

export default function PrivacyPolicy() {
  const { t } = useLanguage();

  const sections = [
    {
      icon: FileText,
      title: t('privacy.section1.title'),
      content: t('privacy.section1.content'),
    },
    {
      icon: Users,
      title: t('privacy.section2.title'),
      content: t('privacy.section2.content'),
    },
    {
      icon: Lock,
      title: t('privacy.section3.title'),
      content: t('privacy.section3.content'),
    },
    {
      icon: Eye,
      title: t('privacy.section4.title'),
      content: t('privacy.section4.content'),
    },
    {
      icon: Globe,
      title: t('privacy.section5.title'),
      content: t('privacy.section5.content'),
    },
    {
      icon: Shield,
      title: t('privacy.section6.title'),
      content: t('privacy.section6.content'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        {/* African Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30L30 0z' fill='%23D4AF37' fill-opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 mb-6">
              <Shield className="w-10 h-10 text-gold" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                {t('privacy.title')}
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              {t('privacy.subtitle')}
            </p>
            <p className="text-muted-foreground/60 text-sm mt-4">
              {t('privacy.lastUpdated')}: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {sections.map((section, index) => (
              <div 
                key={index}
                className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 hover:border-gold/30 transition-all duration-300"
              >
                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                  <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-gold/20 group-hover:border-gold/40 transition-colors" />
                </div>
                
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <section.icon className="w-7 h-7 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-xl font-bold text-foreground mb-4 group-hover:text-gold transition-colors">
                      {index + 1}. {section.title}
                    </h2>
                    <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-2xl font-bold text-gold mb-4">
              {t('privacy.contact.title')}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t('privacy.contact.content')}
            </p>
            <a 
              href="mailto:privacy@cercledstitans.com" 
              className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
            >
              privacy@cercledstitans.com
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
