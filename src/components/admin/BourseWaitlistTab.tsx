import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  computeStats,
  fetchWaitlist,
  planLabel,
  statusLabel,
  updateWaitlistStatus,
  WAITLIST_PLANS,
  WAITLIST_STATUSES,
  type WaitlistEntry,
  type WaitlistPlan,
  type WaitlistStats,
  type WaitlistStatus,
} from "@/services/bourseWaitlistService";

interface BourseWaitlistTabProps {
  readOnly?: boolean;
}

/** Message pré-rempli pour la prise de contact WhatsApp. */
const WHATSAPP_MESSAGE =
  "Bonjour, nous vous contactons concernant votre inscription à la liste d'attente Bourse Rentrée Titans 2026 — Cercle des Titans.";

/** Teinte du badge de statut (cohérent avec le thème sombre/or). */
const statusBadgeClass = (status: string): string => {
  switch (status) {
    case "new":
      return "border-gold/30 bg-gold/10 text-gold";
    case "contacted":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "converted":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "declined":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "archived":
      return "border-muted-foreground/30 bg-muted text-muted-foreground";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
};

/** Teinte du badge de formule. */
const planBadgeClass = (plan: string): string => {
  switch (plan) {
    case "serenite":
      return "border-sky-500/30 bg-sky-500/10 text-sky-300";
    case "excellence":
      return "border-gold/30 bg-gold/10 text-gold";
    case "prestige_scolaire":
      return "border-purple-500/30 bg-purple-500/10 text-purple-300";
    case "undecided":
      return "border-muted-foreground/30 bg-muted text-muted-foreground";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
};

const formatDate = (iso: string): string => {
  try {
    return format(new Date(iso), "dd MMM yyyy · HH:mm", { locale: fr });
  } catch {
    return iso;
  }
};

/** Construit le lien wa.me en ne gardant que les chiffres du numéro. */
const buildWhatsAppUrl = (phone: string): string | null => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
};

// --- Export CSV -------------------------------------------------------------
const CSV_HEADERS = [
  "Date",
  "Nom",
  "Téléphone",
  "Email",
  "Ville",
  "Formule",
  "Statut",
  "Message",
];

/** Échappe un champ CSV (guillemets, virgules, points-virgules, retours ligne). */
const csvEscape = (value: string): string => {
  if (/[",;\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const buildCsv = (rows: WaitlistEntry[]): string => {
  const lines = [CSV_HEADERS.join(",")];
  for (const r of rows) {
    lines.push(
      [
        formatDate(r.created_at),
        r.full_name,
        r.phone,
        r.email ?? "",
        r.city ?? "",
        planLabel(r.plan_interest),
        statusLabel(r.status),
        r.message ?? "",
      ]
        .map((c) => csvEscape(String(c)))
        .join(","),
    );
  }
  return lines.join("\r\n");
};

/** Déclenche le téléchargement du CSV (BOM UTF-8 pour Excel). */
const downloadCsv = (rows: WaitlistEntry[]): void => {
  const blob = new Blob(["\uFEFF" + buildCsv(rows)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bourse-rentree-titans-2026-waitlist.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function BourseWaitlistTab({
  readOnly = false,
}: BourseWaitlistTabProps) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [stats, setStats] = useState<WaitlistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Recherche + filtres (côté client, sur les lignes déjà chargées).
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<WaitlistStatus | "all">("all");
  const [planFilter, setPlanFilter] = useState<WaitlistPlan | "all">("all");

  const load = async () => {
    setLoading(true);
    try {
      const rows = await fetchWaitlist(200);
      setEntries(rows);
      setStats(computeStats(rows));
    } catch (error) {
      console.error("Erreur chargement liste d'attente:", error);
      toast.error("Erreur lors du chargement de la liste d'attente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (id: string, status: WaitlistStatus) => {
    setSavingId(id);
    // Mise à jour optimiste, restaurée en cas d'échec.
    const previous = entries;
    setEntries((rows) =>
      rows.map((r) => (r.id === id ? { ...r, status } : r)),
    );
    try {
      await updateWaitlistStatus(id, status);
      setStats(
        computeStats(
          previous.map((r) => (r.id === id ? { ...r, status } : r)),
        ),
      );
      toast.success(`Statut mis à jour : ${statusLabel(status)}`);
    } catch (error) {
      console.error("Erreur mise à jour statut:", error);
      setEntries(previous);
      toast.error("Impossible de mettre à jour le statut");
    } finally {
      setSavingId(null);
    }
  };

  // Liste filtrée mémoïsée.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (planFilter !== "all" && e.plan_interest !== planFilter) return false;
      if (q) {
        const haystack = [e.full_name, e.phone, e.email ?? "", e.city ?? ""]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [entries, search, statusFilter, planFilter]);

  const hasActiveFilters =
    search.trim() !== "" || statusFilter !== "all" || planFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPlanFilter("all");
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.info("Aucune ligne à exporter pour ces filtres.");
      return;
    }
    downloadCsv(filtered);
    toast.success(`${filtered.length} ligne(s) exportée(s)`);
  };

  const StatusControl = ({ entry }: { entry: WaitlistEntry }) =>
    readOnly ? (
      <Badge variant="outline" className={statusBadgeClass(entry.status)}>
        {statusLabel(entry.status)}
      </Badge>
    ) : (
      <Select
        value={entry.status}
        onValueChange={(v) => handleStatusChange(entry.id, v as WaitlistStatus)}
        disabled={savingId === entry.id}
      >
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WAITLIST_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value} className="text-xs">
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );

  const WhatsAppButton = ({
    phone,
    fullWidth = false,
  }: {
    phone: string;
    fullWidth?: boolean;
  }) => {
    const url = buildWhatsAppUrl(phone);

    // Pas de numéro exploitable : on affiche un repère visible plutôt que rien.
    if (!url) {
      return (
        <span
          title="Numéro de téléphone absent ou invalide"
          className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-500/50 bg-slate-800/70 px-3 text-xs font-medium text-slate-300 ${
            fullWidth ? "w-full" : ""
          }`}
        >
          <Phone className="h-3.5 w-3.5" />
          Téléphone absent
        </span>
      );
    }

    return (
      <Button
        size="sm"
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        title="Contacter sur WhatsApp"
        className={`h-8 border border-emerald-300 bg-emerald-500 font-semibold text-white hover:bg-emerald-400 ${
          fullWidth ? "w-full" : ""
        }`}
      >
        <MessageCircle className="mr-1.5 h-4 w-4" />
        WhatsApp
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <GraduationCap className="h-5 w-5 text-gold" />
            Bourse Rentrée — Liste d'attente
          </h2>
          <p className="text-sm text-muted-foreground">
            Visiteurs intéressés par le programme « Bourse Rentrée Titans 2026 ».
            {readOnly && " (lecture seule)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExport}
            disabled={filtered.length === 0}
            size="sm"
            className="border border-yellow-300 bg-yellow-500 font-semibold text-black hover:bg-yellow-400 disabled:opacity-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
          <Button onClick={load} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="relative overflow-hidden border-border bg-card">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total inscrits
            </CardTitle>
            <Users className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>

        {WAITLIST_PLANS.map((p) => (
          <Card key={p.value} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {p.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats?.byPlan[p.value] ?? 0}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recherche + filtres */}
      <Card className="border border-yellow-500/20 bg-black/40">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-yellow-400">
              Recherche
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-yellow-400/70" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom, téléphone, email, ville…"
                className="border-yellow-500/30 bg-black/60 pl-9 text-white placeholder:text-slate-500 focus-visible:ring-yellow-500/40"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-yellow-400">
                Statut
              </label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as WaitlistStatus | "all")}
              >
                <SelectTrigger className="h-10 w-[150px] border-yellow-500/30 bg-black/60 text-sm text-white">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {WAITLIST_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-yellow-400">
                Formule
              </label>
              <Select
                value={planFilter}
                onValueChange={(v) => setPlanFilter(v as WaitlistPlan | "all")}
              >
                <SelectTrigger className="h-10 w-[170px] border-yellow-500/30 bg-black/60 text-sm text-white">
                  <SelectValue placeholder="Formule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les formules</SelectItem>
                  {WAITLIST_PLANS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              size="sm"
              variant="outline"
              className="h-10 border-yellow-500/30 bg-black/60 text-slate-200 hover:bg-yellow-500/10 hover:text-white disabled:opacity-40"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste */}
      <Card className="border border-yellow-500/20 bg-black/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base text-white">Demandes récentes</CardTitle>
          <span className="rounded-full border border-yellow-500/30 bg-black/60 px-2.5 py-1 text-xs font-medium text-yellow-400">
            {filtered.length} / {entries.length} résultat
            {entries.length > 1 ? "s" : ""}
          </span>
        </CardHeader>
        <CardContent>
          {loading && entries.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-gold" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-slate-300">
              Aucune demande pour le moment.
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-300">
              Aucun résultat pour ces critères.
              <div className="mt-3">
                <Button onClick={resetFilters} size="sm" variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Réinitialiser les filtres
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop : tableau */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-yellow-500/25 text-left text-yellow-300">
                      <th className="py-2 pr-4 font-semibold">Nom</th>
                      <th className="py-2 pr-4 font-semibold">Contact</th>
                      <th className="py-2 pr-4 font-semibold">Ville</th>
                      <th className="py-2 pr-4 font-semibold">Formule</th>
                      <th className="py-2 pr-4 font-semibold">Date</th>
                      <th className="py-2 pr-4 font-semibold">Statut</th>
                      <th className="py-2 pr-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-yellow-500/15 align-top text-slate-300 transition-colors hover:bg-yellow-500/10"
                      >
                        <td className="py-3 pr-4">
                          <div className="font-semibold text-white">
                            {entry.full_name}
                          </div>
                          {entry.message && (
                            <div className="mt-1 max-w-xs truncate text-xs text-slate-400">
                              {entry.message}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="text-white">{entry.phone}</div>
                          {entry.email && (
                            <div className="text-xs text-slate-400">
                              {entry.email}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-slate-300">
                          {entry.city ?? "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant="outline"
                            className={planBadgeClass(entry.plan_interest)}
                          >
                            {planLabel(entry.plan_interest)}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-300">
                          {formatDate(entry.created_at)}
                        </td>
                        <td className="py-3 pr-4">
                          <StatusControl entry={entry} />
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <WhatsAppButton phone={entry.phone} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile / tablette : cartes */}
              <div className="space-y-3 lg:hidden">
                {filtered.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-yellow-500/25 bg-black/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-white">
                          {entry.full_name}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {formatDate(entry.created_at)}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 ${planBadgeClass(entry.plan_interest)}`}
                      >
                        {planLabel(entry.plan_interest)}
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-1.5 text-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="h-3.5 w-3.5 text-gold" />
                        <span className="text-white">{entry.phone}</span>
                      </div>
                      {entry.email && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <Mail className="h-3.5 w-3.5 text-gold" />
                          <span className="break-all">{entry.email}</span>
                        </div>
                      )}
                      {entry.city && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <MapPin className="h-3.5 w-3.5 text-gold" />
                          <span>{entry.city}</span>
                        </div>
                      )}
                      {entry.message && (
                        <div className="flex items-start gap-2 text-slate-300">
                          <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                          <span>{entry.message}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-300">Statut</span>
                      <StatusControl entry={entry} />
                    </div>

                    <div className="mt-3">
                      <WhatsAppButton phone={entry.phone} fullWidth />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
