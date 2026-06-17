import { useEffect, useMemo, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CalendarPlus,
  CalendarX,
  CheckCircle,
  Clock,
  Coins,
  Filter,
  Layers,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  adminValidatePayment,
  closeDailyContributions,
  fetchActiveCycle,
  fetchAllCategories,
  fetchAllContributions,
  fetchAllPayments,
  fetchAllPaymentMethods,
  generateWeeklyContributions,
} from "@/services/tontineService";
import type {
  ContributionPayment,
  PaymentMethod,
  TontineCategory,
  TontineContribution,
  TontineCycle,
} from "@/types/tontine";

interface ContributionsTabProps {
  readOnly?: boolean;
}

interface Filters {
  status: string;
  dateFrom: string;
  dateTo: string;
}

const todayStr = () => format(new Date(), "yyyy-MM-dd");

const formatDate = (value: string) =>
  format(new Date(`${value}T00:00:00`), "dd MMM yyyy", { locale: fr });

const contributionStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Payé</Badge>;
    case "partial":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Partiel</Badge>;
    case "pending":
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">En attente</Badge>;
    case "overdue":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">En retard</Badge>;
    case "cancelled":
      return <Badge variant="secondary">Annulé</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const paymentStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Validé</Badge>;
    case "rejected":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejeté</Badge>;
    case "partial":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Partiel</Badge>;
    case "pending":
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">En attente</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function ContributionsTab({ readOnly = false }: ContributionsTabProps) {
  const [contributions, setContributions] = useState<TontineContribution[]>([]);
  const [payments, setPayments] = useState<ContributionPayment[]>([]);
  const [categories, setCategories] = useState<TontineCategory[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [activeCycle, setActiveCycle] = useState<TontineCycle | null>(null);
  const [todayContributions, setTodayContributions] = useState<TontineContribution[]>([]);
  const [overdueContributions, setOverdueContributions] = useState<TontineContribution[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    status: "all",
    dateFrom: "",
    dateTo: "",
  });

  const [generateDate, setGenerateDate] = useState<string>(todayStr());
  const [closeDate, setCloseDate] = useState<string>(todayStr());
  const [generating, setGenerating] = useState(false);
  const [closing, setClosing] = useState(false);

  // Inline validation: id of the payment currently being processed (validate or reject).
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Reject dialog state — a note is mandatory when rejecting.
  const [rejectPayment, setRejectPayment] = useState<ContributionPayment | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejecting, setRejecting] = useState(false);

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

  const loadAll = async () => {
    setLoading(true);
    const today = todayStr();
    try {
      const [
        contribData,
        payData,
        catData,
        methodData,
        cycleData,
        todayData,
        overdueData,
      ] = await Promise.all([
        fetchAllContributions({
          status: filters.status,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        }),
        fetchAllPayments(),
        fetchAllCategories(),
        fetchAllPaymentMethods(),
        fetchActiveCycle(),
        // Filter-independent snapshots for the summary cards.
        fetchAllContributions({ dateFrom: today, dateTo: today }),
        fetchAllContributions({ status: "overdue" }),
      ]);
      setContributions(contribData);
      setPayments(payData);
      setCategories(catData);
      setMethods(methodData);
      setActiveCycle(cycleData);
      setTodayContributions(todayData);
      setOverdueContributions(overdueData);
    } catch (error) {
      console.error("Erreur chargement cotisations:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du chargement des cotisations"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // Re-run when filters change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.dateFrom, filters.dateTo]);

  const clearFilters = () => {
    setFilters({ status: "all", dateFrom: "", dateTo: "" });
  };

  const hasActiveFilters =
    filters.status !== "all" || Boolean(filters.dateFrom) || Boolean(filters.dateTo);

  const pendingPayments = useMemo(
    () => payments.filter((p) => p.status === "pending" || p.status === "partial"),
    [payments]
  );

  const rejectedPayments = useMemo(
    () => payments.filter((p) => p.status === "rejected"),
    [payments]
  );

  const handleGenerate = async () => {
    if (readOnly) {
      toast.error("Action non autorisée en lecture seule");
      return;
    }
    if (!generateDate) {
      toast.error("Veuillez choisir une date d'échéance");
      return;
    }
    setGenerating(true);
    try {
      const count = await generateWeeklyContributions(generateDate);
      toast.success(`${count} cotisation(s) hebdomadaire(s) générée(s) (échéance ${formatDate(generateDate)})`);
      loadAll();
    } catch (error) {
      console.error("Erreur génération cotisations:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la génération des cotisations"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = async () => {
    if (readOnly) {
      toast.error("Action non autorisée en lecture seule");
      return;
    }
    if (!closeDate) {
      toast.error("Veuillez choisir une date de clôture");
      return;
    }
    setClosing(true);
    try {
      const count = await closeDailyContributions(closeDate);
      toast.success(`${count} cotisation(s) clôturée(s) (échéance ≤ ${formatDate(closeDate)})`);
      loadAll();
    } catch (error) {
      console.error("Erreur clôture cotisations:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la clôture des cotisations"
      );
    } finally {
      setClosing(false);
    }
  };

  // One-click validation: marks the declared payment as paid.
  const handleValidate = async (payment: ContributionPayment) => {
    if (readOnly) {
      toast.error("Action non autorisée en lecture seule");
      return;
    }
    setProcessingId(payment.id);
    try {
      await adminValidatePayment(payment.id, "paid", payment.admin_note ?? "");
      toast.success("Paiement validé");
      loadAll();
    } catch (error) {
      console.error("Erreur validation paiement:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la validation du paiement"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const openReject = (payment: ContributionPayment) => {
    setRejectPayment(payment);
    setRejectNote("");
  };

  // Rejection requires a mandatory admin note (the reject reason).
  const submitReject = async () => {
    if (!rejectPayment) return;
    if (readOnly) {
      toast.error("Action non autorisée en lecture seule");
      return;
    }
    const note = rejectNote.trim();
    if (!note) {
      toast.error("Un motif de rejet est obligatoire");
      return;
    }
    setRejecting(true);
    setProcessingId(rejectPayment.id);
    try {
      await adminValidatePayment(rejectPayment.id, "rejected", note);
      toast.success("Paiement rejeté");
      setRejectPayment(null);
      loadAll();
    } catch (error) {
      console.error("Erreur rejet paiement:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du rejet du paiement"
      );
    } finally {
      setRejecting(false);
      setProcessingId(null);
    }
  };

  const todayPaidCount = useMemo(
    () => todayContributions.filter((c) => c.status === "paid").length,
    [todayContributions]
  );

  return (
    <div className="space-y-6">
      {/* Active cycle banner — premium dark/gold accent */}
      <Card className="overflow-hidden border-amber-400/20 bg-gradient-to-br from-black/60 via-card to-card shadow-[0_0_32px_rgba(245,158,11,0.08)]">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-400/30 bg-black/40 text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.18)]">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-amber-300/80">Cycle actif</p>
              {loading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : activeCycle ? (
                <p className="text-lg font-semibold text-foreground">{activeCycle.name}</p>
              ) : (
                <p className="text-lg font-semibold text-muted-foreground">Aucun cycle actif</p>
              )}
            </div>
          </div>
          {activeCycle && (
            <div className="text-sm text-muted-foreground sm:text-right">
              <p>
                Début&nbsp;: <span className="text-foreground">{formatDate(activeCycle.start_date)}</span>
              </p>
              {activeCycle.end_date && (
                <p>
                  Fin&nbsp;: <span className="text-foreground">{formatDate(activeCycle.end_date)}</span>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary cards: today's contributions / declared payments / overdue */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cotisations du jour
            </CardTitle>
            <Coins className="h-4 w-4 text-amber-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{todayContributions.length}</div>
            <p className="text-xs text-muted-foreground">{todayPaidCount} payée(s)</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paiements déclarés
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{pendingPayments.length}</div>
            <p className="text-xs text-muted-foreground">en attente de validation</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Retards</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{overdueContributions.length}</div>
            <p className="text-xs text-muted-foreground">cotisation(s) en retard</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin actions: generate / close */}
      {!readOnly && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarPlus className="h-5 w-5" />
                Générer les cotisations de la semaine
              </CardTitle>
              <CardDescription>
                Crée les cotisations hebdomadaires pour les membres actifs (cycle actif requis).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Date d'échéance (semaine)</label>
                <Input
                  type="date"
                  value={generateDate}
                  onChange={(e) => setGenerateDate(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? "Génération..." : "Générer"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarX className="h-5 w-5" />
                Clôturer les cotisations impayées
              </CardTitle>
              <CardDescription>
                Passe en « En retard » les cotisations en attente/partielles dont l'échéance est ≤ à la date.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Date cible</label>
                <Input
                  type="date"
                  value={closeDate}
                  onChange={(e) => setCloseDate(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <Button variant="secondary" onClick={handleClose} disabled={closing}>
                {closing ? "Clôture..." : "Clôturer"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending payments to validate */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Paiements à valider ({pendingPayments.length})
            </CardTitle>
            <CardDescription>Paiements déclarés par les membres en attente de validation.</CardDescription>
          </div>
          <Button variant="outline" onClick={loadAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : pendingPayments.length === 0 ? (
            <p className="text-muted-foreground">Aucun paiement en attente.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground">Catégorie</TableHead>
                    <TableHead className="text-muted-foreground">Méthode</TableHead>
                    <TableHead className="text-muted-foreground">Montant</TableHead>
                    <TableHead className="text-muted-foreground">Référence</TableHead>
                    <TableHead className="text-muted-foreground">Statut</TableHead>
                    <TableHead className="text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.map((p) => (
                    <TableRow key={p.id} className="border-border">
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(p.payment_date), "dd MMM yyyy HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {categoryNameById[p.category_id] ?? "—"}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {p.payment_method_id ? methodNameById[p.payment_method_id] ?? "—" : "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {formatAmount(p.amount)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-foreground">
                        {p.payment_reference || "—"}
                      </TableCell>
                      <TableCell>{paymentStatusBadge(p.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={readOnly || processingId === p.id}
                            onClick={() => handleValidate(p)}
                            className="border-green-500/40 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {processingId === p.id ? "..." : "Valider"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={readOnly || processingId === p.id}
                            onClick={() => openReject(p)}
                            className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeter
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejected payments — show the reject reason clearly */}
      {rejectedPayments.length > 0 && (
        <Card className="bg-card border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-400" />
              Paiements rejetés ({rejectedPayments.length})
            </CardTitle>
            <CardDescription>Paiements refusés avec le motif communiqué au membre.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground">Catégorie</TableHead>
                    <TableHead className="text-muted-foreground">Montant</TableHead>
                    <TableHead className="text-muted-foreground">Statut</TableHead>
                    <TableHead className="text-muted-foreground">Motif du rejet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejectedPayments.map((p) => (
                    <TableRow key={p.id} className="border-border">
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(p.payment_date), "dd MMM yyyy HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {categoryNameById[p.category_id] ?? "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {formatAmount(p.amount)}
                      </TableCell>
                      <TableCell>{paymentStatusBadge(p.status)}</TableCell>
                      <TableCell className="text-sm text-red-300">
                        {p.admin_note || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contributions filters + table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-lg">Cotisations</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Statut</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="partial">Partiel</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Échéance début</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Échéance fin</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                className="bg-background border-border"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : contributions.length === 0 ? (
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? "Aucune cotisation ne correspond aux filtres."
                : "Aucune cotisation enregistrée."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Échéance</TableHead>
                    <TableHead className="text-muted-foreground">Catégorie</TableHead>
                    <TableHead className="text-muted-foreground">Attendu</TableHead>
                    <TableHead className="text-muted-foreground">Payé</TableHead>
                    <TableHead className="text-muted-foreground">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions.map((c) => (
                    <TableRow key={c.id} className="border-border">
                      <TableCell className="text-foreground">{formatDate(c.due_date)}</TableCell>
                      <TableCell className="text-foreground">
                        {categoryNameById[c.category_id] ?? "—"}
                      </TableCell>
                      <TableCell className="text-foreground">{formatAmount(c.expected_amount)}</TableCell>
                      <TableCell className="text-foreground">{formatAmount(c.paid_amount)}</TableCell>
                      <TableCell>{contributionStatusBadge(c.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject dialog — admin note is mandatory */}
      <Dialog open={Boolean(rejectPayment)} onOpenChange={(open) => !open && setRejectPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le paiement</DialogTitle>
            <DialogDescription>
              {rejectPayment
                ? `${formatAmount(rejectPayment.amount)} — ${
                    categoryNameById[rejectPayment.category_id] ?? "Catégorie"
                  }`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Motif du rejet <span className="text-red-400">*</span>
              </label>
              <Textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Expliquez pourquoi ce paiement est rejeté (visible par le membre)"
                className="border-red-500/30 focus-visible:ring-red-500/40"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectPayment(null)}>
              Annuler
            </Button>
            <Button
              onClick={submitReject}
              disabled={rejecting || readOnly || !rejectNote.trim()}
              className="bg-red-500/90 text-white hover:bg-red-500"
            >
              <XCircle className="h-4 w-4 mr-1" />
              {rejecting ? "Rejet..." : "Confirmer le rejet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
