import { Star, Quote, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnimatedSection, FloatingElement } from "@/components/AnimatedElements";
import { useWPTestimonials, stripHtml } from "@/hooks/useWordPress";

// Fallback testimonials when WordPress is not available
const fallbackTestimonials = [
  {
    name: "Aminata Diallo",
    role: "Entrepreneure",
    content: "Grâce au Cercle des Titans, j'ai pu financer l'ouverture de ma boutique. La solidarité du groupe m'a permis de réaliser mon rêve.",
    rating: 5,
    avatar: "AD",
  },
  {
    name: "Kofi Mensah",
    role: "Commerçant",
    content: "Membre depuis 2 ans, j'ai pu épargner et investir dans mon commerce. Le système est transparent et fiable.",
    rating: 5,
    avatar: "KM",
  },
  {
    name: "Fatou Ndiaye",
    role: "Consultante",
    content: "Une communauté exceptionnelle qui redonne vie à nos traditions d'entraide africaines.",
    rating: 5,
    avatar: "FN",
  },
  {
    name: "Marie Kouadio",
    role: "Infirmière",
    content: "Le Cercle m'a permis d'économiser pour le mariage de ma fille. Un système fiable et une communauté bienveillante.",
    rating: 5,
    avatar: "MK",
  },
];

// Helper to get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const TestimonialsSection = () => {
  const { t } = useLanguage();
  const { data: wpTestimonials, isLoading, isError } = useWPTestimonials();

  // Use WordPress testimonials if available, otherwise fallback
  const testimonials = wpTestimonials && wpTestimonials.length > 0
    ? wpTestimonials.map(wp => ({
        name: wp.acf?.author_name || wp.title.rendered,
        role: wp.acf?.author_role || '',
        content: stripHtml(wp.content.rendered),
        rating: wp.acf?.rating || 5,
        avatar: getInitials(wp.acf?.author_name || wp.title.rendered),
      }))
    : fallbackTestimonials;

  return (
    <section id="temoignages" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden">
      {/* Floating decorative elements */}
      <FloatingElement intensity="subtle" className="absolute top-20 right-10 pointer-events-none">
        <div className="w-48 h-48 bg-gold/5 rounded-full blur-3xl" />
      </FloatingElement>
      <FloatingElement intensity="medium" className="absolute bottom-20 left-10 pointer-events-none">
        <div className="w-64 h-64 bg-terracotta/5 rounded-full blur-3xl" />
      </FloatingElement>

      <div className="max-w-6xl mx-auto relative z-10">
        <AnimatedSection animation="fade-up" className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">{t('testimonials.title')}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t('testimonials.subtitle')}</p>
        </AnimatedSection>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <AnimatedSection
                key={index}
                animation="fade-up"
                delay={index * 100}
              >
                <div className="h-full bg-card rounded-2xl p-6 border border-border hover:border-gold/30 hover:shadow-xl hover:shadow-gold/5 transition-all duration-500 relative group cursor-default hover:-translate-y-2">
                  {/* Animated quote icon */}
                  <Quote className="absolute top-4 right-4 w-8 h-8 text-gold/20 group-hover:text-gold/40 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                  
                  {/* Avatar with hover effect */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gold to-terracotta rounded-full flex items-center justify-center text-background font-display font-bold group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-gold/30 transition-all duration-300">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-display text-base text-foreground group-hover:text-gold transition-colors duration-300">{testimonial.name}</h4>
                      <p className="text-muted-foreground text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                  
                  {/* Animated stars */}
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star 
                        key={i} 
                        className="w-4 h-4 fill-gold text-gold group-hover:animate-pulse transition-all duration-300"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed">"{testimonial.content}"</p>

                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold/0 to-gold/0 group-hover:from-gold/5 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
                </div>
              </AnimatedSection>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialsSection;
