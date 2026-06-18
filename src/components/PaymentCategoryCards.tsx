import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TONTINE_CATEGORIES, TontineCategory, formatAmount, getSiteMaintenanceFee } from "@/lib/paymentService";
import PaymentModal from "./PaymentModal";
import { CreditCard, Sparkles, Wrench } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PaymentCategoryCards() {
  const [selectedCategory, setSelectedCategory] = useState<TontineCategory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { ref, isVisible } = useScrollAnimation<HTMLElement>();
  const { t } = useLanguage();

  const handlePayClick = (category: TontineCategory) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  return (
    <section ref={ref} className="py-24 bg-gradient-to-b from-card/50 to-background pattern-kente overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6">
            <CreditCard className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-gold uppercase tracking-wider">
              {t('payment.title')}
            </span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            {t('payment.title')} <span className="gradient-text">{t('payment.titleHighlight')}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t('payment.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {TONTINE_CATEGORIES.map((category, index) => (
            <div
              key={category.name}
              className={`relative overflow-hidden group bg-card rounded-2xl border border-border hover:border-gold/40 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Gradient Accent */}
              <div
                className="absolute inset-x-0 top-0 h-1.5 rounded-t-2xl"
                style={{
                  background: `linear-gradient(90deg, ${category.color}, ${category.color}80)`,
                }}
              />

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{category.icon}</span>
                  <span
                    className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${category.color}20`,
                      color: category.color,
                    }}
                  >
                    {category.name}
                  </span>
                </div>

                <h3 className="font-display text-2xl text-foreground mb-4">{category.name}</h3>

                <div className="text-center py-6 mb-3 rounded-xl bg-background/50 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">{t('payment.monthlyAmount')}</p>
                  <p className="text-3xl font-bold font-display" style={{ color: category.color }}>
                    {formatAmount(category.amount)}
                  </p>
                </div>

                {/* Site maintenance fee — discreet mention, clearly a fee (not a gain) */}
                {getSiteMaintenanceFee(category.name) !== null && (
                  <div className="flex items-center justify-center gap-1.5 mb-4 text-xs text-muted-foreground">
                    <Wrench className="w-3 h-3 text-gold/70 shrink-0" />
                    <span className="font-semibold text-foreground/90">+{formatAmount(getSiteMaintenanceFee(category.name)!)}</span>
                    <span>{t('category.siteMaintenanceFee')}</span>
                  </div>
                )}

                <Button
                  onClick={() => handlePayClick(category)}
                  className="w-full group-hover:scale-105 transition-transform font-semibold py-6"
                  style={{
                    backgroundColor: category.color,
                    color: category.name === "Silver" || category.name === "Platinum" ? "#1a1a2e" : "#fff",
                  }}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t('payment.payNow')}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Methods Info */}
        <div className={`mt-16 text-center transition-all duration-700 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-sm text-muted-foreground mb-6">{t('payment.methodsTitle')}</p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-3 px-6 py-3 bg-yellow-500/10 rounded-full border border-yellow-500/20">
              <span className="w-4 h-4 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/30" />
              <span className="font-semibold text-yellow-500">MTN MoMo</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-orange-500/10 rounded-full border border-orange-500/20">
              <span className="w-4 h-4 rounded-full bg-orange-500 shadow-lg shadow-orange-500/30" />
              <span className="font-semibold text-orange-500">Orange Money</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedCategory && (
        <PaymentModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          category={selectedCategory}
        />
      )}
    </section>
  );
}
