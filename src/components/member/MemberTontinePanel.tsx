import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { formatAmount } from "@/lib/paymentService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle2, Clock, Coins, CreditCard, Layers, Loader2, ReceiptText, RefreshCw, XCircle } from "lucide-react";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  declareContributionPayment,
  fetchActiveCategories,
  fetchActiveOrPlannedCycle,
  fetchMemberCategories,
  fetchMemberContributions,
  fetchMemberPayments,
  fetchPaymentMethods,
  memberSelectCategory,
  memberUnselectCategory,
} from "@/services/tontineService";
import type {
  ContributionPayment,
  PaymentMethod,
  TontineCategory,
  TontineContribution,
  TontineCycle,
} from "@/types/tontine";

const DECLARABLE_STATUSES = new Set(["pending", "partial", "overdue"]);

// Current week range (Monday–Sunday) as yyyy-MM-dd strings, for week-based filtering.
const currentWeekRange = () => {
  const now = new Date();
  return {
    start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
  };
};

const formatDate = (value: string) =>
  format(new Date(`${value}T00:00:00`), "dd MMM yyyy", { locale: fr });

const contributionStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Payé</Badge>;
    case "partial":
      return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Partiel</Badge>;
    case "pending":
      return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">En attente</Badge>;
    case "overdue":
      return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">En retard</Badge>;
    case "cancelled":
      return <Badge variant="secondary">Annulé</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Status of a payment the member declared, as seen from their side.
const paymentStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return (
        <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Validé
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-500/20 text-red-600 border-red-500/30">
          <XCircle className="h-3 w-3 mr-1" />
          Rejeté
        </Badge>
      );
    case "partial":
      return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Partiel</Badge>;
    case "pending":
    default:
      return (
        <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
          <Clock className="h-3 w-3 mr-1" />
          En attente
        </Badge>
      );
  }
};

// Status of the tontine cycle as shown to the member.
const cycleStatusBadge = (cycle: TontineCycle | null) => {
  if (!cycle) {
    return <Badge variant="secondary">Aucun cycle</Badge>;
  }
  if (cycle.status === "active") {
    return (
      <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        En cours
      </Badge>
    );
  }
  if (cycle.status === "planned" || cycle.status === "draft") {
    return (
      <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30">
        <Clock className="h-3 w-3 mr-1" />
        Programmé
      </Badge>
    );
  }
  return <Badge variant="outline">{cycle.status}</Badge>;
};

export default function MemberTontinePanel() {
  const { user } = useAuth();

  const [categories, setCategories] = useState<TontineCategory[]>([]);
  const [memberCategoryIds, setMemberCategoryIds] = useState<Set<string>>(new Set());
  const [contributions, setContributions] = useState<TontineContribution[]>([]);
  const [payments, setPayments] = useState<ContributionPayment[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [cycle, setCycle] = useState<TontineCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingPayments, setRefreshingPayments] = useState(false);
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);

  const categoriesRef = useRef<HTMLDivElement>(null);
  const contributionsRef = useRef<HTMLDivElement>(null);

  // Declare-payment dialog state
  const [payContribution, setPayContribution] = useState<TontineContribution | null>(null);
  const [payMethodId, setPayMethodId] = useState<string>("");
  const [payAmount, setPayAmount] = useState<string>("");
  const [payReference, setPayReference] = useState<string>("");
  const [payProofUrl, setPayProofUrl] = useState<string>("");
  const [declaring, setDeclaring] = useState(false);

  const categoryNameById = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const methodNameById = useMemo(() => {
    const map: Record<string, string> = {};
    methods.forEach((m) => {
      map[m.id] = m.name;
    });
    return map;
  }, [methods]);

  // Contributions due within the current week (the cotisation cadence is now weekly).
  const weekRange = useMemo(() => currentWeekRange(), []);
  const weekContributions = useMemo(() => {
    return contributions.filter(
      (c) => c.due_date >= weekRange.start && c.due_date <= weekRange.end
    );
  }, [contributions, weekRange]);

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [catData, memberCats, contribData, methodData, paymentData, cycleData] =
        await Promise.all([
          fetchActiveCategories(),
          fetchMemberCategories(user.id),
          fetchMemberContributions(user.id),
          fetchPaymentMethods(),
          fetchMemberPayments(user.id),
          fetchActiveOrPlannedCycle(),
        ]);
      setCategories(catData);
      setMemberCategoryIds(new Set(memberCats.map((m) => m.category_id)));
      setContributions(contribData);
      setMethods(methodData);
      setPayments(paymentData);
      setCycle(cycleData);
    } catch (error) {
      console.error("Erreur chargement tontine:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du chargement de vos tontines"
      );
    } finally {
      setLoading(false);
    }
  };

  // Refresh only the declared payments, without re-triggering the full page loader.
  const refreshPayments = async () => {
    if (!user) return;
    setRefreshingPayments(true);
    try {
      const paymentData = await fetchMemberPayments(user.id);
      setPayments(paymentData);
    } catch (error) {
      console.error("Erreur rafraîchissement paiements:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du rafraîchissement de vos paiements"
      );
    } finally {
      setRefreshingPayments(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleCategory = async (category: TontineCategory, isMember: boolean) => {
    setSavingCategoryId(category.id);
    try {
      if (isMember) {
        await memberUnselectCategory(category.id);
        toast.success(`Vous avez quitté la catégorie ${category.name}`);
      } else {
        await memberSelectCategory(category.id);
        toast.success(`Vous avez rejoint la catégorie ${category.name}`);
      }
      await loadAll();
    } catch (error) {
      console.error("Erreur sélection catégorie:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la mise à jour de la catégorie"
      );
    } finally {
      setSavingCategoryId(null);
    }
  };

  const openDeclare = (contribution: TontineContribution) => {
    setPayContribution(contribution);
    setPayMethodId("");
    const remaining = Math.max(contribution.expected_amount - contribution.paid_amount, 0);
    setPayAmount(remaining > 0 ? String(remaining) : "");
    setPayReference("");
    setPayProofUrl("");
  };

  // Has the member joined at least one category (i.e. entered the cycle)?
  const hasJoined = memberCategoryIds.size > 0;

  const scrollToRef = (ref: { current: HTMLDivElement | null }) =>
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Primary "declare a payment" CTA from the cycle card: open the dialog on a
  // declarable contribution due this week, otherwise guide to the contributions list.
  const handleDeclareCta = () => {
    const target = weekContributions.find((c) => DECLARABLE_STATUSES.has(c.status));
    if (target) {
      openDeclare(target);
    } else {
      scrollToRef(contributionsRef);
    }
  };

  const submitDeclaration = async () => {
    if (!payContribution) return;

    const amountValue = Number(payAmount);
    if (!payMethodId) {
      toast.error("Veuillez choisir un moyen de paiement");
      return;
    }
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error("Le montant doit être strictement positif");
      return;
    }

    setDeclaring(true);
    try {
      // Only contributionId/paymentMethodId/amount/reference/proof are sent.
      // user_id/category_id/cycle_id are derived server-side by the RPC.
      await declareContributionPayment({
        contributionId: payContribution.id,
        paymentMethodId: payMethodId,
        amount: amountValue,
        paymentReference: payReference || undefined,
        proofUrl: payProofUrl || undefined,
      });
      toast.success("Paiement déclaré. En attente de validation par un administrateur.");
      setPayContribution(null);
      await loadAll();
    } catch (error) {
      console.error("Erreur déclaration paiement:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la déclaration du paiement"
      );
    } finally {
      setDeclaring(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Available cycle — entry point to the tontine flow (premium dark/gold) */}
      <Card className="overflow-hidden border-amber-400/20 bg-gradient-to-br from-black/60 via-card to-card shadow-[0_0_32px_rgba(245,158,11,0.08)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-300" />
            Cycle disponible
          </CardTitle>
          <CardDescription>Le cycle de tontine en cours ou programmé.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-amber-300" />
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold text-foreground">
                    {cycle ? cycle.name : "Aucun cycle disponible"}
                  </span>
                  {cycleStatusBadge(cycle)}
                </div>
                {cycle && (cycle.start_date || cycle.end_date) && (
                  <p className="text-sm text-muted-foreground">
                    {cycle.start_date && (
                      <>Début&nbsp;: <span className="text-foreground">{formatDate(cycle.start_date)}</span></>
                    )}
                    {cycle.end_date && (
                      <> · Fin&nbsp;: <span className="text-foreground">{formatDate(cycle.end_date)}</span></>
                    )}
                  </p>
                )}
                {!cycle ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun cycle n'est actuellement ouvert. Revenez bientôt.
                  </p>
                ) : hasJoined ? (
                  <p className="flex items-center gap-1.5 text-sm text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    Vous participez à ce cycle.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Rejoignez une catégorie pour participer à ce cycle et générer vos cotisations.
                  </p>
                )}
              </div>

              {cycle && (
                <div className="flex flex-col gap-2 sm:items-end">
                  {hasJoined ? (
                    <Button onClick={handleDeclareCta} className="gap-2">
                      <CreditCard className="h-4 w-4" />
                      Déclarer un paiement
                    </Button>
                  ) : (
                    <Button onClick={() => scrollToRef(categoriesRef)} className="gap-2">
                      Rejoindre le cycle
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* This week's contribution highlight — premium dark/gold accent */}
      <Card className="overflow-hidden border-amber-400/20 bg-gradient-to-br from-black/60 via-card to-card shadow-[0_0_32px_rgba(245,158,11,0.08)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-300" />
            Cotisation de la semaine
          </CardTitle>
          <CardDescription>
            Semaine du {formatDate(weekRange.start)} au {formatDate(weekRange.end)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-amber-300" />
            </div>
          ) : weekContributions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune cotisation due cette semaine. Sélectionnez une catégorie pour en générer.
            </p>
          ) : (
            <div className="space-y-3">
              {weekContributions.map((c) => {
                const canDeclare = DECLARABLE_STATUSES.has(c.status);
                return (
                  <div
                    key={c.id}
                    className="flex flex-col gap-3 rounded-lg border border-amber-400/15 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {categoryNameById[c.category_id] ?? "Catégorie"}
                        </span>
                        {contributionStatusBadge(c.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Attendu&nbsp;: <span className="text-amber-200">{formatAmount(c.expected_amount)}</span>
                        {c.paid_amount > 0 && (
                          <> · Payé&nbsp;: <span className="text-foreground">{formatAmount(c.paid_amount)}</span></>
                        )}
                      </p>
                    </div>
                    {canDeclare ? (
                      <Button size="sm" onClick={() => openDeclare(c)}>
                        Déclarer le paiement
                      </Button>
                    ) : (
                      <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        À jour
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <Card ref={categoriesRef} className="scroll-mt-24 bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Catégories de tontine
          </CardTitle>
          <CardDescription>
            Choisissez une ou plusieurs catégories pour générer vos cotisations journalières.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-muted-foreground">Aucune catégorie active disponible.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.map((category) => {
                const isMember = memberCategoryIds.has(category.id);
                return (
                  <div
                    key={category.id}
                    className={`flex items-center justify-between rounded-lg border p-4 ${
                      isMember ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{category.name}</span>
                        {isMember && (
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Sélectionnée
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {category.weekly_amount != null
                          ? `${formatAmount(category.weekly_amount)} / semaine`
                          : `${formatAmount(category.daily_amount)} / jour`}
                      </p>
                      {category.description && (
                        <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={isMember ? "secondary" : "outline"}
                      disabled={savingCategoryId === category.id}
                      onClick={() => toggleCategory(category, isMember)}
                    >
                      {savingCategoryId === category.id
                        ? "..."
                        : isMember
                        ? "Quitter"
                        : "Rejoindre"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member contributions */}
      <Card ref={contributionsRef} className="scroll-mt-24 bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Mes cotisations de tontine
          </CardTitle>
          <CardDescription>
            Déclarez un paiement pour vos cotisations en attente, partielles ou en retard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : contributions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Aucune cotisation de tontine pour le moment.</p>
              <p className="text-sm">Sélectionnez une catégorie pour commencer.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Échéance</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Catégorie</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Attendu</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Payé</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Statut</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((c) => {
                    const canDeclare = DECLARABLE_STATUSES.has(c.status);
                    return (
                      <tr key={c.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3 px-2 text-sm">{formatDate(c.due_date)}</td>
                        <td className="py-3 px-2 text-sm">{categoryNameById[c.category_id] ?? "—"}</td>
                        <td className="py-3 px-2 text-sm font-medium">{formatAmount(c.expected_amount)}</td>
                        <td className="py-3 px-2 text-sm">{formatAmount(c.paid_amount)}</td>
                        <td className="py-3 px-2">{contributionStatusBadge(c.status)}</td>
                        <td className="py-3 px-2">
                          {canDeclare ? (
                            <Button size="sm" variant="outline" onClick={() => openDeclare(c)}>
                              Déclarer
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Declared payments — member sees validation status (En attente / Validé / Rejeté) */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-primary" />
              Mes paiements déclarés
            </CardTitle>
            <CardDescription>
              Suivez l'état de validation de chaque paiement déclaré par un administrateur.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={refreshPayments}
            disabled={loading || refreshingPayments}
            className="shrink-0 border-amber-400/30 text-amber-200 hover:bg-amber-400/10 hover:text-amber-100"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshingPayments ? "animate-spin" : ""}`} />
            {refreshingPayments ? "Actualisation..." : "Actualiser"}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ReceiptText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Aucun paiement déclaré pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-amber-200">{formatAmount(p.amount)}</span>
                      {paymentStatusBadge(p.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {categoryNameById[p.category_id] ?? "Catégorie"}
                      {p.payment_method_id && (
                        <> · {methodNameById[p.payment_method_id] ?? "Moyen de paiement"}</>
                      )}
                      {" · "}
                      {format(new Date(p.payment_date), "dd MMM yyyy HH:mm", { locale: fr })}
                    </p>
                    {p.status === "rejected" && p.admin_note && (
                      <p className="text-xs text-red-400">Motif&nbsp;: {p.admin_note}</p>
                    )}
                  </div>
                  {p.payment_reference && (
                    <span className="font-mono text-xs text-muted-foreground">
                      Réf&nbsp;: {p.payment_reference}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Declare payment dialog */}
      <Dialog open={Boolean(payContribution)} onOpenChange={(open) => !open && setPayContribution(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déclarer un paiement</DialogTitle>
            <DialogDescription>
              {payContribution
                ? `Échéance du ${formatDate(payContribution.due_date)} — attendu ${formatAmount(
                    payContribution.expected_amount
                  )}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Moyen de paiement</label>
              <Select value={payMethodId} onValueChange={setPayMethodId}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Choisir un moyen de paiement" />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Montant (FCFA)</label>
              <Input
                type="number"
                min="1"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Référence (facultatif)</label>
              <Input
                value={payReference}
                onChange={(e) => setPayReference(e.target.value)}
                placeholder="N° de transaction"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Lien du justificatif (facultatif)</label>
              <Input
                value={payProofUrl}
                onChange={(e) => setPayProofUrl(e.target.value)}
                placeholder="https://..."
                className="bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayContribution(null)}>
              Annuler
            </Button>
            <Button onClick={submitDeclaration} disabled={declaring}>
              {declaring ? "Envoi..." : "Déclarer le paiement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
