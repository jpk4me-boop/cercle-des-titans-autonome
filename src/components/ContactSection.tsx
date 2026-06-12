import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, MapPin, Phone, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnimatedSection, FloatingElement, MagneticButton, ParallaxLayer } from "@/components/AnimatedElements";

const ContactSection = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: t('contact.success.title'), description: t('contact.success.desc') });
    setFormData({ name: "", email: "", phone: "", message: "" });
    setIsSubmitting(false);
  };

  const contactInfo = [
    { icon: MapPin, label: t('contact.address'), value: "Douala, Cameroun" },
    { icon: Phone, label: t('contact.phone'), value: "+237 672 482 763", href: "tel:+237672482763" },
    { icon: Mail, label: t('contact.email'), value: "contact@cercledstitans.com", href: "mailto:contact@cercledstitans.com" }
  ];

  return (
    <section id="contact" className="relative py-24 px-6 bg-gradient-to-b from-earth to-earth-light overflow-hidden">
      {/* Floating decorative elements */}
      <FloatingElement intensity="subtle" className="absolute top-1/4 -left-20 pointer-events-none">
        <div className="w-80 h-80 bg-gold/10 rounded-full blur-3xl" />
      </FloatingElement>
      <FloatingElement intensity="medium" className="absolute bottom-1/4 -right-20 pointer-events-none">
        <div className="w-96 h-96 bg-terracotta/10 rounded-full blur-3xl" />
      </FloatingElement>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12">
          <AnimatedSection animation="fade-left">
            <div className="text-foreground">
              <span className="inline-block text-gold font-medium text-sm uppercase tracking-wider mb-2 hover:tracking-widest transition-all duration-300 cursor-default">
                {t('contact.label')}
              </span>
              <h2 className="font-display text-4xl md:text-5xl text-foreground mt-2 mb-6">
                {t('contact.title')} <span className="text-gold">{t('contact.titleHighlight')}</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-10">{t('contact.subtitle')}</p>
              
              <div className="space-y-6">
                {contactInfo.map((item, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-4 group cursor-default"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center group-hover:bg-gold/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <item.icon className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <h4 className="font-display text-lg text-foreground mb-1 group-hover:text-gold transition-colors duration-300">{item.label}</h4>
                      {item.href ? (
                        <a href={item.href} className="text-muted-foreground group-hover:text-foreground transition-colors duration-300 hover:text-gold">{item.value}</a>
                      ) : (
                        <p className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fade-right" delay={200}>
            <ParallaxLayer speed={0.1} direction="up">
              <div className="bg-card rounded-2xl p-8 border border-border shadow-xl hover:shadow-2xl hover:shadow-gold/5 hover:border-gold/20 transition-all duration-500 group">
                <h3 className="font-display text-2xl text-foreground mb-6 group-hover:text-gold transition-colors duration-300">{t('contact.formTitle')}</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="group/input">
                    <Input 
                      name="name" 
                      placeholder={t('contact.namePlaceholder')} 
                      value={formData.name} 
                      onChange={handleChange} 
                      required 
                      maxLength={100} 
                      className="bg-background border-border focus:border-gold/50 focus:ring-gold/20 transition-all duration-300" 
                    />
                  </div>
                  <Input 
                    name="email" 
                    type="email" 
                    placeholder={t('contact.emailPlaceholder')} 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                    maxLength={255} 
                    className="bg-background border-border focus:border-gold/50 focus:ring-gold/20 transition-all duration-300" 
                  />
                  <Input 
                    name="phone" 
                    type="tel" 
                    placeholder={t('contact.phonePlaceholder')} 
                    value={formData.phone} 
                    onChange={handleChange} 
                    maxLength={20} 
                    className="bg-background border-border focus:border-gold/50 focus:ring-gold/20 transition-all duration-300" 
                  />
                  <Textarea 
                    name="message" 
                    placeholder={t('contact.messagePlaceholder')} 
                    value={formData.message} 
                    onChange={handleChange} 
                    rows={4} 
                    maxLength={1000} 
                    className="bg-background border-border resize-none focus:border-gold/50 focus:ring-gold/20 transition-all duration-300" 
                  />
                  <MagneticButton strength={0.15} className="w-full">
                    <Button 
                      type="submit" 
                      className="w-full group/btn relative overflow-hidden" 
                      size="lg" 
                      disabled={isSubmitting}
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        {isSubmitting ? (
                          <span className="animate-pulse">{t('contact.submitting')}</span>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform duration-300" />
                            {t('contact.submit')}
                          </>
                        )}
                      </span>
                    </Button>
                  </MagneticButton>
                </form>
              </div>
            </ParallaxLayer>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
