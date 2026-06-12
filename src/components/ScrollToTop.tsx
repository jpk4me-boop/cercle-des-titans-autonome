import { useState, useEffect, forwardRef } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const ScrollToTop = forwardRef<HTMLButtonElement>((_, ref) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Button
      ref={ref}
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-50 rounded-full p-3 shadow-lg transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      size="icon"
      aria-label="Remonter en haut"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
});

ScrollToTop.displayName = "ScrollToTop";

export default ScrollToTop;
