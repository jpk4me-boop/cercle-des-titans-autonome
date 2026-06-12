import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors"
      aria-label={language === 'fr' ? 'Switch to English' : 'Passer en français'}
    >
      <Globe className="w-4 h-4" />
      <span className="font-medium uppercase text-xs tracking-wider">
        {language === 'fr' ? 'EN' : 'FR'}
      </span>
    </Button>
  );
};

export default LanguageToggle;
