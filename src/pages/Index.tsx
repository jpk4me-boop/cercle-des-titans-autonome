import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TontineSection from "@/components/TontineSection";
import BenefitsSection from "@/components/BenefitsSection";
import MembershipCategoriesSection from "@/components/MembershipCategoriesSection";
import PaymentCategoryCards from "@/components/PaymentCategoryCards";
import HowItWorksSection from "@/components/HowItWorksSection";
import TrustSection from "@/components/TrustSection";
import FinancementSection from "@/components/FinancementSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import CurrencyConverter from "@/components/CurrencyConverter";
import { useHashNavigation } from "@/hooks/useHashNavigation";

const Index = () => {
  useHashNavigation();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Cercle des Titans — Communauté privée d'épargne collective</title>
        <meta
          name="description"
          content="Communauté privée d'épargne collective fondée sur des tontines organisées, l'appui communautaire et une gouvernance transparente. Réseau privé, entraide encadrée, progression financière responsable."
        />
      </Helmet>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <TontineSection />
        <BenefitsSection />
        <MembershipCategoriesSection />
        <PaymentCategoryCards />

        {/* Currency Converter Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
          <div className="max-w-md mx-auto">
            <CurrencyConverter />
          </div>
        </section>

        <HowItWorksSection />
        <TrustSection />
        <FinancementSection />
        <TestimonialsSection />
        <FAQSection />
        <ContactSection />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;
