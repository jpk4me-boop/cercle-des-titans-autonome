import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TontineSection from "@/components/TontineSection";
import BenefitsSection from "@/components/BenefitsSection";
import MembershipCategoriesSection from "@/components/MembershipCategoriesSection";
import PaymentCategoryCards from "@/components/PaymentCategoryCards";
import HowItWorksSection from "@/components/HowItWorksSection";
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
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <TontineSection />
        <BenefitsSection />
        <MembershipCategoriesSection />
        <PaymentCategoryCards />

        {/* Currency Converter Section */}
        <section className="py-16 px-6 bg-background">
          <div className="max-w-md mx-auto">
            <CurrencyConverter />
          </div>
        </section>

        <HowItWorksSection />
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
