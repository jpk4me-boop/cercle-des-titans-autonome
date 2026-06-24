import { useState } from "react";
import { Star, Quote, Loader2, BadgeCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnimatedSection, FloatingElement } from "@/components/AnimatedElements";
import { useWPTestimonials, stripHtml } from "@/hooks/useWordPress";
import { testimonials as fallbackTestimonials, type Testimonial } from "@/data/testimonials";

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

// Convert a display name to a URL-safe slug: strip accents, lowercase,
// collapse any non-alphanumeric run into a single hyphen.
// e.g. "Aïcha Bensalah" -> "aicha-bensalah", "Jean-Baptiste Koffi" -> "jean-baptiste-koffi".
const slugify = (name: string): string =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// AI portrait path for a testimonial, by naming convention.
// Images live in public/testimonials/ and are served from /testimonials/{slug}.webp.
const getTestimonialAvatar = (name: string): string =>
  `/testimonials/${slugify(name)}.webp`;

// Premium avatar: shows the AI portrait when present, otherwise gracefully
// falls back to the gradient initials badge (same look as before).
const TestimonialAvatar = ({
  name,
  initials,
  gradientClass,
}: {
  name: string;
  initials: string;
  gradientClass: string;
}) => {
  const [showImage, setShowImage] = useState(true);

  return (
    <div
      className={`relative w-28 h-28 md:w-32 md:h-32 shrink-0 overflow-hidden rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-background font-display font-bold text-2xl md:text-3xl ring-2 ring-gold/40 ring-offset-2 ring-offset-background shadow-lg shadow-gold/20 group-hover:ring-gold/60 group-hover:scale-105 transition-all duration-300`}
    >
      {/* Initials sit underneath; the portrait covers them when it loads. */}
      {initials}
      {showImage && (
        <img
          src={getTestimonialAvatar(name)}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={() => setShowImage(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
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
                  <div className="flex items-center gap-4 pt-5 border-t border-white/5">
                    <TestimonialAvatar
                      name={testimonial.name}
                      initials={testimonial.avatar}
                      gradientClass={avatarGradients[index % avatarGradients.length]}
                    />
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
