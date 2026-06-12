import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Clock, ArrowLeft, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTransactionByReference, formatAmount } from "@/lib/paymentService";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Transaction {
  reference: string;
  full_name: string;
  category: string;
  amount: number;
  payment_method: string;
  status: string;
  transaction_id: string | null;
  receipt_url: string | null;
  created_at: string;
}

export default function VerifyReceipt() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("ref");
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!reference) {
        setError("Aucune référence fournie");
        setLoading(false);
        return;
      }

      try {
        const data = await getTransactionByReference(reference);
        if (data) {
          setTransaction(data as Transaction);
        } else {
          setError("Transaction introuvable");
        }
      } catch (err) {
        console.error("Error fetching transaction:", err);
        setError("Erreur lors de la vérification");
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [reference]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          icon: <CheckCircle2 className="w-16 h-16 text-green-500" />,
          title: "Transaction Vérifiée",
          description: "Ce reçu est authentique et le paiement a été confirmé.",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30",
        };
      case "pending":
        return {
          icon: <Clock className="w-16 h-16 text-yellow-500" />,
          title: "En Attente de Confirmation",
          description: "Cette transaction est en cours de traitement.",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/30",
        };
      default:
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: "Statut Inconnu",
          description: "Impossible de vérifier le statut de cette transaction.",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/30",
        };
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Vérification en cours...</p>
            </div>
          )}

          {error && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="flex flex-col items-center py-12">
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Vérification Échouée</h2>
                <p className="text-muted-foreground text-center mb-6">{error}</p>
                <Link to="/">
                  <Button>Retourner à l'accueil</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {transaction && (
            <>
              {/* Status Card */}
              <Card className={`mb-6 ${getStatusInfo(transaction.status).borderColor} ${getStatusInfo(transaction.status).bgColor}`}>
                <CardContent className="flex flex-col items-center py-8">
                  {getStatusInfo(transaction.status).icon}
                  <h2 className="text-2xl font-bold mt-4 mb-2">
                    {getStatusInfo(transaction.status).title}
                  </h2>
                  <p className="text-muted-foreground text-center">
                    {getStatusInfo(transaction.status).description}
                  </p>
                </CardContent>
              </Card>

              {/* Transaction Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🏛️</span>
                    Détails de la Transaction
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 p-4 bg-primary/10 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Référence</p>
                      <p className="font-mono font-bold text-lg">{transaction.reference}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Nom complet</p>
                      <p className="font-medium">{transaction.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Catégorie</p>
                      <p className="font-medium">{transaction.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Montant</p>
                      <p className="font-bold text-primary">{formatAmount(transaction.amount)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Mode de paiement</p>
                      <p className="font-medium">{transaction.payment_method}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{formatDate(transaction.created_at)}</p>
                    </div>

                    {transaction.transaction_id && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">ID Transaction</p>
                        <p className="font-mono text-sm">{transaction.transaction_id}</p>
                      </div>
                    )}

                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Statut</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                          transaction.status === "confirmed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {transaction.status === "confirmed" ? "Confirmé" : "En attente"}
                      </span>
                    </div>
                  </div>

                  {/* Download Receipt */}
                  {transaction.receipt_url && (
                    <Button
                      onClick={() => window.open(transaction.receipt_url!, "_blank")}
                      className="w-full mt-4"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger le reçu
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Legal Notice */}
              <p className="text-xs text-muted-foreground text-center mt-6">
                Ce reçu atteste une cotisation à la tontine Cercle des Titans. 
                Pour toute question, contactez-nous.
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
