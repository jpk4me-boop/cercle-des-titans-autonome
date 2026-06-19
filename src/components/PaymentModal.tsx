import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Phone, User, Mail, CreditCard, Smartphone } from "lucide-react";
import { toast } from "sonner";
import {
  TontineCategory,
  PaymentMethod,
  PAYMENT_METHODS,
  initiatePayment,
  generateReceipt,
  formatAmount,
  getSiteMaintenanceFee
} from "@/lib/paymentService";
import PaymentResult from "./PaymentResult";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: TontineCategory;
}

type Step = "form" | "processing" | "result";

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  paymentMethod: PaymentMethod;
}

export default function PaymentModal({ isOpen, onClose, category }: PaymentModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    phone: "",
    email: "",
    paymentMethod: "MTN MoMo",
  });
  const [result, setResult] = useState<{
    reference: string;
    status: "confirmed" | "pending";
    receiptUrl?: string;
    transactionId?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      toast.error("Veuillez entrer votre nom complet");
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length < 9) {
      toast.error("Veuillez entrer un numéro de téléphone valide");
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Veuillez entrer une adresse email valide");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setStep("processing");

    try {
      // Initiate payment
      const transactionResult = await initiatePayment({
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email || undefined,
        category: category.name,
        amount: category.amount,
        paymentMethod: formData.paymentMethod,
      });

      // Generate receipt
      const receiptResult = await generateReceipt(transactionResult.id);

      setResult({
        reference: transactionResult.reference,
        status: transactionResult.status,
        receiptUrl: receiptResult.receiptUrl,
        transactionId: transactionResult.transactionId,
      });

      setStep("result");
      toast.success("Paiement traité avec succès!");
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Une erreur est survenue");
      setStep("form");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("form");
    setFormData({
      fullName: "",
      phone: "",
      email: "",
      paymentMethod: "MTN MoMo",
    });
    setResult(null);
    onClose();
  };

  const selectedPaymentInfo = PAYMENT_METHODS[formData.paymentMethod];
  const maintenanceFee = getSiteMaintenanceFee(category.name);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <span className="text-2xl">{category.icon}</span>
                Cotisation {category.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Amount breakdown — the cotisation is what this payment records;
                  the site maintenance fee is shown for transparency only and is
                  settled separately (it is NOT added to the recorded amount). */}
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cotisation tontine</span>
                  <span className="font-semibold text-primary">{formatAmount(category.amount)}</span>
                </div>
                {maintenanceFee !== null && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Frais d'entretien du site</span>
                      <span className="font-medium text-foreground">{formatAmount(maintenanceFee)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-primary/20 pt-2 text-base">
                      <span className="font-semibold text-foreground">Total à prévoir</span>
                      <span className="font-bold text-primary">{formatAmount(category.amount + maintenanceFee)}</span>
                    </div>
                    <p className="pt-1 text-[11px] leading-snug text-muted-foreground">
                      Seule la cotisation tontine est enregistrée dans ce paiement. Les frais d'entretien du site se règlent séparément.
                    </p>
                  </>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nom complet *
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Entrez votre nom complet"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Numéro de téléphone *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+237 6XX XXX XXX"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email (optionnel)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Mode de paiement *
                </Label>
                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(value) => handleInputChange("paymentMethod", value as PaymentMethod)}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="relative">
                    <RadioGroupItem value="MTN MoMo" id="mtn" className="peer sr-only" />
                    <Label
                      htmlFor="mtn"
                      className="flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all peer-data-[state=checked]:border-yellow-500 peer-data-[state=checked]:bg-yellow-500/10 hover:border-yellow-500/50"
                    >
                      <Smartphone className="w-6 h-6 text-yellow-500" />
                      <span className="font-medium">MTN MoMo</span>
                    </Label>
                  </div>
                  <div className="relative">
                    <RadioGroupItem value="Orange Money" id="orange" className="peer sr-only" />
                    <Label
                      htmlFor="orange"
                      className="flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-500/10 hover:border-orange-500/50"
                    >
                      <Smartphone className="w-6 h-6 text-orange-500" />
                      <span className="font-medium">Orange Money</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Beneficiary Info */}
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Bénéficiaire:</span>{" "}
                  {selectedPaymentInfo.beneficiaryName}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Numéro:</span>{" "}
                  {selectedPaymentInfo.beneficiaryNumber}
                </p>
              </div>

              {/* Sandbox Notice */}
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-600 dark:text-yellow-400">
                <p className="font-medium">🧪 Mode Simulation</p>
                <p className="text-xs mt-1">
                  En mode sandbox, les paiements sont simulés. En production, connectez les APIs MTN/Orange.
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={isLoading}
              >
                Confirmer le paiement
              </Button>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Traitement en cours...</p>
            <p className="text-sm text-muted-foreground text-center">
              Veuillez patienter pendant que nous traitons votre paiement
            </p>
          </div>
        )}

        {step === "result" && result && (
          <PaymentResult
            reference={result.reference}
            status={result.status}
            amount={category.amount}
            category={category.name}
            paymentMethod={formData.paymentMethod}
            receiptUrl={result.receiptUrl}
            transactionId={result.transactionId}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
