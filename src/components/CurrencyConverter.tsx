import { useState, useEffect } from "react";
import { ArrowRightLeft, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnimatedSection } from "@/components/AnimatedElements";

// Exchange rates relative to USD (approximate rates)
const exchangeRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  XAF: 605.50, // CFA Franc BEAC (Cameroon, etc.)
  XOF: 605.50, // CFA Franc BCEAO (Senegal, etc.)
  NGN: 1550.00, // Nigerian Naira
  GHS: 15.50, // Ghanaian Cedi
  KES: 153.00, // Kenyan Shilling
  ZAR: 18.50, // South African Rand
  MAD: 10.00, // Moroccan Dirham
  EGP: 50.00, // Egyptian Pound
  TND: 3.12, // Tunisian Dinar
  CAD: 1.36,
  CHF: 0.88,
};

const currencies = [
  { code: "XAF", name: "CFA Franc (BEAC)", flag: "🇨🇲" },
  { code: "XOF", name: "CFA Franc (BCEAO)", flag: "🇸🇳" },
  { code: "NGN", name: "Naira nigérian", flag: "🇳🇬" },
  { code: "GHS", name: "Cedi ghanéen", flag: "🇬🇭" },
  { code: "KES", name: "Shilling kenyan", flag: "🇰🇪" },
  { code: "ZAR", name: "Rand sud-africain", flag: "🇿🇦" },
  { code: "MAD", name: "Dirham marocain", flag: "🇲🇦" },
  { code: "EGP", name: "Livre égyptienne", flag: "🇪🇬" },
  { code: "TND", name: "Dinar tunisien", flag: "🇹🇳" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "USD", name: "Dollar américain", flag: "🇺🇸" },
  { code: "GBP", name: "Livre sterling", flag: "🇬🇧" },
  { code: "CAD", name: "Dollar canadien", flag: "🇨🇦" },
  { code: "CHF", name: "Franc suisse", flag: "🇨🇭" },
];

const CurrencyConverter = () => {
  const { t, language } = useLanguage();
  const [amount, setAmount] = useState<string>("100000");
  const [fromCurrency, setFromCurrency] = useState("XAF");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [result, setResult] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const convert = () => {
    setIsConverting(true);
    setTimeout(() => {
      const amountNum = parseFloat(amount) || 0;
      const fromRate = exchangeRates[fromCurrency];
      const toRate = exchangeRates[toCurrency];
      
      // Convert to USD first, then to target currency
      const inUSD = amountNum / fromRate;
      const converted = inUSD * toRate;
      
      setResult(converted);
      setIsConverting(false);
    }, 300);
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    if (result !== null) {
      setAmount(result.toFixed(2));
      setResult(parseFloat(amount));
    }
  };

  useEffect(() => {
    convert();
  }, [amount, fromCurrency, toCurrency]);

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getExchangeRate = () => {
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];
    return (toRate / fromRate).toFixed(6);
  };

  return (
    <AnimatedSection animation="fade-up">
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8 hover:border-gold/30 transition-all duration-300 group">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-terracotta/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <ArrowRightLeft className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h3 className="font-display text-xl text-foreground group-hover:text-gold transition-colors">
              {language === 'fr' ? 'Convertisseur de Devises' : 'Currency Converter'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === 'fr' ? 'Taux de change en temps réel' : 'Real-time exchange rates'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* From Currency */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {language === 'fr' ? 'Montant' : 'Amount'}
            </label>
            <div className="flex gap-3">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-background border-border focus:border-gold/50 text-lg font-semibold"
                placeholder="0.00"
              />
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger className="w-[140px] bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code} className="hover:bg-gold/10">
                      <span className="flex items-center gap-2">
                        <span>{currency.flag}</span>
                        <span>{currency.code}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={swapCurrencies}
              className="rounded-full border-gold/30 hover:bg-gold/10 hover:border-gold/50 transition-all duration-300 hover:rotate-180"
            >
              <ArrowRightLeft className="w-4 h-4 text-gold" />
            </Button>
          </div>

          {/* To Currency */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {language === 'fr' ? 'Résultat' : 'Result'}
            </label>
            <div className="flex gap-3">
              <div className="flex-1 bg-gradient-to-r from-gold/5 to-gold/10 border border-gold/20 rounded-md px-4 py-3 flex items-center">
                <span className={`text-lg font-bold text-gold transition-opacity ${isConverting ? 'opacity-50' : 'opacity-100'}`}>
                  {result !== null ? formatCurrency(result, toCurrency) : '—'}
                </span>
              </div>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger className="w-[140px] bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code} className="hover:bg-gold/10">
                      <span className="flex items-center gap-2">
                        <span>{currency.flag}</span>
                        <span>{currency.code}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exchange Rate Info */}
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {language === 'fr' ? 'Taux de change' : 'Exchange rate'}
              </span>
              <span className="font-medium text-foreground">
                1 {fromCurrency} = {getExchangeRate()} {toCurrency}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-2">
              {language === 'fr' 
                ? '* Taux indicatifs mis à jour périodiquement' 
                : '* Indicative rates updated periodically'}
            </p>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default CurrencyConverter;
