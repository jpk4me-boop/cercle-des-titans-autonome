import { type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Printer } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatAmount } from "@/lib/paymentService";
import type { ContributionPayment } from "@/types/tontine";

interface TontinePaymentReceiptProps {
  payment: ContributionPayment | null;
  memberName: string;
  categoryName: string;
  methodName?: string | null;
  onClose: () => void;
}

const formatDateTime = (value: string) =>
  format(new Date(value), "dd MMM yyyy 'à' HH:mm", { locale: fr });

function ReceiptRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

// Client-side receipt for a VALIDATED tontine contribution payment.
// No backend call: rendered entirely from data the member already loaded.
// Intentionally excludes phone / proof_url / admin_note (no sensitive data).
export default function TontinePaymentReceipt({
  payment,
  memberName,
  categoryName,
  methodName,
  onClose,
}: TontinePaymentReceiptProps) {
  const handlePrint = () => window.print();

  return (
    <Dialog open={Boolean(payment)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-amber-400/20 bg-gradient-to-br from-black/80 via-card to-card">
        <DialogHeader>
          <DialogTitle className="text-amber-200">Reçu de cotisation tontine</DialogTitle>
          <DialogDescription>Reçu de votre cotisation tontine validée.</DialogDescription>
        </DialogHeader>

        {payment && (
          <>
            {/* Print only the receipt block, hide the rest of the page. */}
            <style>{`@media print {
              body * { visibility: hidden !important; }
              #tontine-receipt, #tontine-receipt * { visibility: visible !important; }
              #tontine-receipt { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
            }`}</style>

            <div
              id="tontine-receipt"
              className="rounded-lg border border-amber-400/20 bg-black/30 p-5 space-y-4"
            >
              <div className="border-b border-amber-400/20 pb-3 text-center">
                <p className="text-lg font-bold text-amber-300">🏛️ Cercle des Titans</p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Reçu de cotisation tontine
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <ReceiptRow label="Membre" value={memberName} />
                <ReceiptRow label="Catégorie" value={categoryName} />
                <ReceiptRow
                  label="Montant"
                  value={<span className="font-bold text-amber-200">{formatAmount(payment.amount)}</span>}
                />
                {methodName && <ReceiptRow label="Moyen de paiement" value={methodName} />}
                {payment.payment_reference && (
                  <ReceiptRow
                    label="Référence"
                    value={<span className="font-mono">{payment.payment_reference}</span>}
                  />
                )}
                <ReceiptRow label="Date du paiement" value={formatDateTime(payment.payment_date)} />
                {payment.validated_at && (
                  <ReceiptRow label="Date de validation" value={formatDateTime(payment.validated_at)} />
                )}
                <ReceiptRow
                  label="Statut"
                  value={
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Validé
                    </Badge>
                  }
                />
              </div>

              <p className="border-t border-amber-400/20 pt-3 text-center text-[10px] text-muted-foreground">
                Ce reçu atteste une cotisation validée à la tontine Cercle des Titans.
                Conservez-le précieusement.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Imprimer / Télécharger
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
