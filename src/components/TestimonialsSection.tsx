import { Star, Quote, Loader2, BadgeCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnimatedSection, FloatingElement } from "@/components/AnimatedElements";
import { useWPTestimonials, stripHtml } from "@/hooks/useWordPress";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
}

// Fallback testimonials when WordPress is not available.
// Avatars are illustrative (gradient initials), names partially anonymized — see disclaimer.
const fallbackTestimonials: Testimonial[] = [
  {
    name: "Aminata Diallo",
    role: "Entrepreneure · Dakar",
    content:
      "Grâce à l'appui collectif, j'ai pu concrétiser l'ouverture de ma boutique. Chaque cotisation est tracée et je vois clairement où va mon argent.",
    rating: 5,
    avatar: "AD",
  },
  {
    name: "Kofi Mensah",
    role: "Commerçant · Abidjan",
    content:
      "Membre depuis deux ans, j'ai réussi à épargner régulièrement et à réinvestir dans mon commerce. Le suivi des paiements est transparent et fiable.",
    rating: 5,
    avatar: "KM",
  },
  {
    name: "Fatou Ndiaye",
    role: "Consultante RH · Dakar",
    content:
      "Ce qui m'a convaincue, c'est la discipline d'épargne et l'entraide réelle entre membres. On avance ensemble, sans promesses irréalistes.",
    rating: 5,
    avatar: "FN",
  },
  {
    name: "Marie Kouadio",
    role: "Infirmière · Abidjan",
    content:
      "J'ai pu mettre de côté pour un projet familial important. Les règles sont claires dès le départ et l'équipe répond rapidement à mes questions.",
    rating: 5,
    avatar: "MK",
  },
  {
    name: "Ibrahima Touré",
    role: "Artisan menuisier · Bamako",
    content:
      "L'appui communautaire m'a permis d'acheter du matériel pour mon atelier. J'ai apprécié de pouvoir étaler mes échéances selon mes revenus.",
    rating: 5,
    avatar: "IT",
  },
  {
    name: "Aïcha Bensalah",
    role: "Gérante de salon · Casablanca",
    content:
      "Le cercle m'aide à gérer ma trésorerie pendant les périodes creuses. Tout est documenté, ce qui me donne confiance sur le long terme.",
    rating: 4,
    avatar: "AB",
  },
  {
    name: "Samuel Nkemba",
    role: "Développeur web · Douala",
    content:
      "J'avais du mal à épargner seul. La cotisation régulière m'a aidé à tenir mes objectifs, et le tableau de bord rend chaque opération vérifiable.",
    rating: 5,
    avatar: "SN",
  },
  {
    name: "Rokhaya Sow",
    role: "Couturière · Thiès",
    content:
      "J'ai pu acheter une nouvelle machine à coudre grâce à cette solution d'entraide encadrée. Pas de frais cachés, juste un accompagnement humain et organisé.",
    rating: 5,
    avatar: "RS",
  },
  {
    name: "Jean-Baptiste Koffi",
    role: "Enseignant · Lomé",
    content:
      "Chaque année, je prépare sereinement la rentrée scolaire de mes enfants. L'épargne collective apporte de la régularité à mon budget.",
    rating: 4,
    avatar: "JK",
  },
  {
    name: "Nadia El Amrani",
    role: "Pharmacienne · Rabat",
    content:
      "Je me suis constitué un fonds d'urgence en quelques mois. La transparence des comptes et le sérieux de la gestion font toute la différence.",
    rating: 5,
    avatar: "NE",
  },
  {
    name: "Mamadou Baldé",
    role: "Chauffeur VTC · Conakry",
    content:
      "L'épargne organisée m'a permis d'anticiper l'entretien de mon véhicule en toute sérénité. Un système simple, honnête et bien suivi.",
    rating: 5,
    avatar: "MB",
  },
  {
    name: "Grace Achieng",
    role: "Restauratrice · Nairobi",
    content:
      "Avec l'aide de la communauté, j'ai pu agrandir mon restaurant. J'aime savoir exactement combien j'ai cotisé et à quelle échéance.",
    rating: 5,
    avatar: "GA",
  },
];

// Subtle gradient variants to give each illustrative avatar its own identity.
const avatarGradients = [
  "from-gold to-terracotta",
  "from-gold-light to-gold-dark",
  "from-terracotta to-gold",
  "from-gold-dark to-terracotta-light",
];

// Helper to get initials from name
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const TestimonialsSection = () => {
  const { t } = useLanguage();
  const { data: wpTestimonials, isLoading } = useWPTestimonials();

  // Use WordPress testimonials if available, otherwise fallback
  const testimonials: Testimonial[] =
    wpTestimonials && wpTestimonials.length > 0
      ? wpTestimonials.map((wp) => ({
          name: wp.acf?.author_name || wp.title.rendered,
          role: wp.acf?.author_role || "",
          content: stripHtml(wp.content.rendered),
          rating: wp.acf?.rating || 5,
          avatar: getInitials(wp.acf?.author_name || wp.title.rendered),
        }))
      : fallbackTestimonials;

  return (
    <section
      id="temoignages"
      className="relative py-24 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden"
    >
      {/* Floating decorative elements */}
      <FloatingElement intensity="subtle" className="absolute top-20 right-10 pointer-events-none">
        <div className="w-48 h-48 bg-gold/5 rounded-full blur-3xl" />
      </FloatingElement>
      <FloatingElement intensity="medium" className="absolute bottom-20 left-10 pointer-events-none">
        <div className="w-64 h-64 bg-terracotta/5 rounded-full blur-3xl" />
      </FloatingElement>

      <div className="max-w-7xl mx-auto relative z-10">
        <AnimatedSection animation="fade-up" className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full border border-gold/30 bg-gold/5 text-gold text-xs font-medium tracking-wide uppercase">
            <Star className="w-3.5 h-3.5 fill-gold text-gold" />
            {t("testimonials.badge")}
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
            {t("testimonials.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("testimonials.subtitle")}
          </p>
        </AnimatedSection>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <AnimatedSection
                key={`${testimonial.name}-${index}`}
                animation="fade-up"
                delay={(index % 3) * 120}
              >
                <article className="relative h-full overflow-hidden rounded-2xl p-7 border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-lg shadow-black/20 transition-all duration-500 group cursor-default hover:-translate-y-2 hover:border-gold/40 hover:shadow-2xl hover:shadow-gold/10">
                  {/* Top gold hairline that reveals on hover */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Quote icon */}
                  <Quote className="absolute top-6 right-6 w-9 h-9 text-gold/15 group-hover:text-gold/35 group-hover:scale-110 transition-all duration-500" />

                  {/* Stars */}
                  <div className="flex gap-1 mb-5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={
                          i < testimonial.rating
                            ? "w-4 h-4 fill-gold text-gold"
                            : "w-4 h-4 text-muted-foreground/30"
                        }
                      />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="relative text-foreground/85 text-[0.95rem] leading-relaxed mb-7 min-h-[120px]">
                    <span className="text-gold/60 font-display text-2xl leading-none align-top mr-0.5">
                      “
                    </span>
                    {testimonial.content}
                    <span className="text-gold/60 font-display text-2xl leading-none align-bottom ml-0.5">
                      ”
                    </span>
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-5 border-t border-white/5">
                    <div
                      className={`relative w-12 h-12 shrink-0 rounded-full bg-gradient-to-br ${
                        avatarGradients[index % avatarGradients.length]
                      } flex items-center justify-center text-background font-display font-bold ring-2 ring-white/10 group-hover:ring-gold/30 group-hover:scale-105 transition-all duration-300`}
                    >
                      {testimonial.avatar}
                    </div>
                    <div className="min-w-0">
                      <h4 className="flex items-center gap-1.5 font-display text-base text-foreground group-hover:text-gold transition-colors duration-300 truncate">
                        {testimonial.name}
                        <BadgeCheck className="w-4 h-4 text-gold/70 shrink-0" />
                      </h4>
                      {testimonial.role && (
                        <p className="text-muted-foreground text-sm truncate">
                          {testimonial.role}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Hover glow */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-gold/0 to-gold/0 group-hover:from-gold/[0.06] group-hover:to-transparent transition-all duration-500" />
                </article>
              </AnimatedSection>
            ))}
          </div>
        )}

        {/* Transparency disclaimer */}
        <AnimatedSection animation="fade-up" className="mt-12">
          <p className="text-center text-xs text-muted-foreground/70 max-w-3xl mx-auto leading-relaxed">
            {t("testimonials.disclaimer")}
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default TestimonialsSection;
