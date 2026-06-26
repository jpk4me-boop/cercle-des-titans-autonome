import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Download, Share2, Mail, ExternalLink } from "lucide-react";
import { formatAmount } from "@/lib/paymentService";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analyticsTracker";

interface PaymentResultProps {
  reference: string;
  status: "confirmed" | "pending";
  amount: number;
  category: string;
  paymentMethod: string;
  receiptUrl?: string;
  transactionId?: string;
  onClose: () => void;
}

export default function PaymentResult({
  reference,
  status,
  amount,
  category,
  paymentMethod,
  receiptUrl,
  transactionId,
  onClose,
}: PaymentResultProps) {
  const isConfirmed = status === "confirmed";

  const handleDownload = () => {
    if (receiptUrl) {
      window.open(receiptUrl, "_blank");
      toast.success("Reçu ouvert dans un nouvel onglet");
    }
  };

  const handleShareWhatsApp = () => {
    const verifyUrl = `${window.location.origin}/verify-receipt?ref=${reference}`;
    const message = encodeURIComponent(
      `✅ Cotisation Tontine - Cercle des Titans\n\n` +
      `📋 Référence: ${reference}\n` +
      `💰 Montant: ${formatAmount(amount)}\n` +
      `🏷️ Catégorie: ${category}\n` +
      `📱 Paiement: ${paymentMethod}\n\n` +
      `🔗 Vérifier le reçu: ${verifyUrl}`
    );
    void trackEvent("click", { label: "whatsapp_public_share" });
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleEmailReceipt = () => {
    const verifyUrl = `${window.location.origin}/verify-receipt?ref=${reference}`;
    const subject = encodeURIComponent(`Reçu de cotisation - ${reference}`);
    const body = encodeURIComponent(
      `Bonjour,\n\n` +
      `Voici les détails de votre cotisation:\n\n` +
      `Référence: ${reference}\n` +
      `Montant: ${formatAmount(amount)}\n` +
      `Catégorie: ${category}\n` +
      `Mode de paiement: ${paymentMethod}\n\n` +
      `Vérifier le reçu: ${verifyUrl}\n\n` +
      `Cordialement,\nCercle des Titans`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <div className="space-y-6 py-4">
      {/* Status Icon */}
      <div className="flex flex-col items-center text-center">
        {isConfirmed ? (
          <CheckCircle2 className="w-16 h-16 text-green-500 mb-3" />
        ) : (
          <Clock className="w-16 h-16 text-yellow-500 mb-3" />
        )}
        <h3 className="text-xl font-bold">
          {isConfirmed ? "Paiement Confirmé!" : "Paiement En Attente"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isConfirmed
            ? "Votre cotisation a été enregistrée avec succès"
            : "Votre paiement est en cours de traitement"}
        </p>
      </div>

      {/* Transaction Details */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Référence</span>
          <span className="font-mono font-medium text-sm">{reference}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Montant</span>
          <span className="font-bold text-primary">{formatAmount(amount)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Catégorie</span>
          <span className="font-medium">{category}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Mode de paiement</span>
          <span className="font-medium">{paymentMethod}</span>
        </div>
        {transactionId && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">ID Transaction</span>
            <span className="font-mono text-xs">{transactionId}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Statut</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isConfirmed
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            }`}
          >
            {isConfirmed ? "Confirmé" : "En attente"}
          </span>
        </div>
      </div>

      {/* Provisional Notice */}
      {!isConfirmed && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-600 dark:text-yellow-400">
          <p className="font-medium">⚠️ Reçu Provisoire</p>
          <p className="text-xs mt-1">
            Ce reçu sera confirmé une fois le paiement validé par l'opérateur.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 gap-2">
        {receiptUrl && (
          <Button onClick={handleDownload} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Télécharger le reçu
          </Button>
        )}
        
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleEmailReceipt}>
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
          <Button variant="outline" onClick={handleShareWhatsApp}>
            <Share2 className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
        </div>

        <Button variant="ghost" onClick={onClose} className="mt-2">
          Fermer
        </Button>
      </div>

      {/* Verification Link */}
      <div className="text-center text-xs text-muted-foreground">
        <a
          href={`/verify-receipt?ref=${reference}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-primary transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Vérifier ce reçu en ligne
        </a>
      </div>
    </div>
  );
}
