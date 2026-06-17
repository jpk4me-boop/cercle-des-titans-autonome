import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useLanguage } from "@/contexts/LanguageContext";
import { HelpCircle, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWPFAQs, stripHtml } from "@/hooks/useWordPress";

const FAQSection = () => {
  const { ref, isVisible } = useScrollAnimation<HTMLElement>();
  const { t } = useLanguage();
  const { data: wpFaqs, isLoading } = useWPFAQs();

  // Fallback FAQs when WordPress is not available
  const fallbackFaqs = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
    { question: t('faq.q4'), answer: t('faq.a4') },
    { question: t('faq.q5'), answer: t('faq.a5') },
  ];

  // Use WordPress FAQs if available, otherwise use fallback
  const faqs = wpFaqs && wpFaqs.length > 0
    ? wpFaqs.map(faq => ({
        question: stripHtml(faq.title.rendered),
        answer: stripHtml(faq.content.rendered),
      }))
    : fallbackFaqs;

  return (
    <section
      id="faq"
      ref={ref}
      className={`py-24 px-4 sm:px-6 lg:px-8 bg-card/50 pattern-adinkra overflow-hidden transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6">
            <HelpCircle className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-gold uppercase tracking-wider">FAQ</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
            {t('faq.title')}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('faq.subtitle')}
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className={`bg-card rounded-2xl border border-border overflow-hidden data-[state=open]:border-gold/40 data-[state=open]:shadow-xl transition-all duration-300 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <AccordionTrigger className="text-left font-display text-lg text-foreground hover:text-gold hover:no-underline px-6 py-5 [&[data-state=open]>svg]:text-gold">
                <span className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold text-sm font-bold">
                    {index + 1}
                  </span>
                  <span>{faq.question}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed px-6 pb-6 pl-[4.5rem]">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 px-8 py-6 rounded-2xl bg-gradient-to-r from-earth to-earth-light border border-gold/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-gold" />
              </div>
              <p className="text-foreground font-medium text-left">
                {t('faq.subtitle')}
              </p>
            </div>
            <Button variant="default" size="sm" asChild>
              <Link to="/#contact">{t('nav.join')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
