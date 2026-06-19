import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Ban, Filter, Loader2, MoreHorizontal, Pause, Play, RefreshCw, Search, ShieldOff, Users, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { fetchAllCategories, fetchAllContributions } from "@/services/tontineService";
import {
  adminSetMemberStatus,
  fetchAllMemberStatuses,
  type MemberStatusValue,
} from "@/services/memberStatusService";
import type { TontineCategory, TontineContribution } from "@/types/tontine";

interface WeeklyContributionsOverviewProps {
  readOnly?: boolean;
}

// Member identity, fetched from public.profiles (admin RLS allows reading all).
interface MemberIdentity {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
}

interface CycleLite {
  id: string;
  name: string | null;
}

// Visual buckets. The DB contribution statuses are pending/partial/paid/overdue/
// cancelled, but we map defensively so any unexpected value still renders safely.
type StatusBucket = "cotise" | "attente" | "echoue" | "verifier";

const statusBucket = (status: string): StatusBucket => {
  const s = (status || "").toLowerCase();
  if (["paid", "completed", "full_paid", "fullpaid"].includes(s)) return "cotise";
  if (["pending", "partial", "awaiting_validation"].includes(s)) return "attente";
  if (["failed", "overdue", "unpaid", "missing", "rejected"].includes(s)) return "echoue";
  return "verifier";
};

const statusBadge = (status: string) => {
  switch (statusBucket(status)) {
    case "cotise":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Cotisé</Badge>;
    case "attente":
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">En attente</Badge>;
    case "echoue":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Échoué</Badge>;
    default:
      return <Badge variant="outline">À vérifier</Badge>;
  }
};

const formatWeek = (value: string) =>
  format(new Date(`${value}T00:00:00`), "dd MMM yyyy", { locale: fr });

// Member account status badges (active is the default when no row exists).
const MEMBER_STATUS_META: Record<MemberStatusValue, { label: string; className: string }> = {
  active: { label: "Actif", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  paused: { label: "En pause", className: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  suspended: { label: "Suspendu", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  banned: { label: "Banni", className: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const memberStatusBadge = (status: MemberStatusValue) => {
  const meta = MEMBER_STATUS_META[status] ?? MEMBER_STATUS_META.active;
  return <Badge className={meta.className}>{meta.label}</Badge>;
};

export default function WeeklyContributionsOverview({
  readOnly = false,
}: WeeklyContributionsOverviewProps) {
  const [contributions, setContributions] = useState<TontineContribution[]>([]);
  const [categories, setCategories] = useState<TontineCategory[]>([]);
  const [members, setMembers] = useState<MemberIdentity[]>([]);
  const [cycles, setCycles] = useState<CycleLite[]>([]);
  const [memberStatuses, setMemberStatuses] = useState<Record<string, MemberStatusValue>>({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");

  // Status change dialog state.
  const [statusAction, setStatusAction] = useState<
    { userId: string; memberName: string; status: MemberStatusValue; label: string } | null
  >(null);
  const [statusReason, setStatusReason] = useState("");
  const [applyingStatus, setApplyingStatus] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [contribData, catData, profilesRes, cyclesRes, statusesData] = await Promise.all([
        fetchAllContributions(),
        fetchAllCategories(),
        supabase.from("profiles").select("user_id, first_name, last_name, email, phone"),
        (supabase as any).from("tontine_cycles").select("id, name"),
        fetchAllMemberStatuses(),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (cyclesRes.error) throw cyclesRes.error;

      const statusMap: Record<string, MemberStatusValue> = {};
      (statusesData || []).forEach((s) => {
        statusMap[s.user_id] = s.status;
      });

      setContributions(contribData);
      setCategories(catData);
      setMembers((profilesRes.data as MemberIdentity[]) || []);
      setCycles((cyclesRes.data as CycleLite[]) || []);
      setMemberStatuses(statusMap);
    } catch (error) {
      console.error("Erreur chargement état hebdomadaire:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du chargement de l'état hebdomadaire"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const categoryNameById = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const cycleNameById = useMemo(() => {
    const map: Record<string, string> = {};
    cycles.forEach((c) => {
      if (c.name) map[c.id] = c.name;
    });
    return map;
  }, [cycles]);

  const memberById = useMemo(() => {
    const map: Record<string, MemberIdentity> = {};
    members.forEach((m) => {
      map[m.user_id] = m;
    });
    return map;
  }, [members]);

  const memberName = (userId: string) => {
    const m = memberById[userId];
    if (!m) return "Membre inconnu";
    const name = `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim();
    return name || m.email || "Membre sans nom";
  };

  const memberContact = (userId: string) => {
    const m = memberById[userId];
    if (!m) return "—";
    return m.phone || m.email || "—";
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contributions.filter((c) => {
      if (categoryFilter !== "all" && c.category_id !== categoryFilter) return false;
      if (cycleFilter !== "all" && c.cycle_id !== cycleFilter) return false;
      if (statusFilter !== "all" && statusBucket(c.status) !== statusFilter) return false;
      if (q) {
        const m = memberById[c.user_id];
        const haystack = [
          m?.first_name,
          m?.last_name,
          m?.email,
          m?.phone,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [contributions, categoryFilter, cycleFilter, statusFilter, search, memberById]);

  const hasActiveFilters =
    Boolean(search) || categoryFilter !== "all" || statusFilter !== "all" || cycleFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setCycleFilter("all");
  };

  const memberStatus = (userId: string): MemberStatusValue => memberStatuses[userId] ?? "active";

  const openStatusAction = (
    userId: string,
    name: string,
    status: MemberStatusValue,
    label: string
  ) => {
    setStatusReason("");
    setStatusAction({ userId, memberName: name, status, label });
  };

  const applyStatusChange = async () => {
    if (!statusAction) return;
    setApplyingStatus(true);
    try {
      await adminSetMemberStatus(
        statusAction.userId,
        statusAction.status,
        statusReason.trim() || null
      );
      toast.success(`Statut mis à jour : ${statusAction.label}`);
      setStatusAction(null);
      await loadAll();
    } catch (error) {
      console.error("Erreur mise à jour statut membre:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la mise à jour du statut"
      );
    } finally {
      setApplyingStatus(false);
    }
  };

  // Admin actions: change the member account status via admin_set_member_status.
  const renderActions = (userId: string, name: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={readOnly}
          className="border-amber-400/30 text-amber-200"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Statut du membre
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => openStatusAction(userId, name, "paused", "En pause")}>
          <Pause className="h-4 w-4 mr-2" /> Pause
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openStatusAction(userId, name, "suspended", "Suspendu")}>
          <ShieldOff className="h-4 w-4 mr-2" /> Suspendre
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openStatusAction(userId, name, "banned", "Banni")}>
          <Ban className="h-4 w-4 mr-2" /> Bannir
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => openStatusAction(userId, name, "active", "Actif")}>
          <Play className="h-4 w-4 mr-2" /> Activer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-amber-400/20 bg-gradient-to-br from-black/60 via-card to-card shadow-[0_0_32px_rgba(245,158,11,0.08)]">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-300" />
              État hebdomadaire des cotisations
            </CardTitle>
            <CardDescription>
              Suivi membre par membre des cotisations de tontine ({filtered.length} ligne(s)).
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={loadAll}
            disabled={loading}
            className="shrink-0 border-amber-400/30 text-amber-200 hover:bg-amber-400/10 hover:text-amber-100"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un membre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-background border-border pl-9"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="cotise">Cotisé</SelectItem>
                <SelectItem value="attente">En attente</SelectItem>
                <SelectItem value="echoue">Échoué</SelectItem>
                <SelectItem value="verifier">À vérifier</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cycleFilter} onValueChange={setCycleFilter}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les cycles</SelectItem>
                {cycles
                  .filter((c) => c.name)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filtres actifs</span>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-amber-300" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {hasActiveFilters
                ? "Aucune cotisation ne correspond aux filtres."
                : "Aucune cotisation enregistrée."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Membre</TableHead>
                    <TableHead className="text-muted-foreground">Téléphone / Email</TableHead>
                    <TableHead className="text-muted-foreground">Catégorie</TableHead>
                    <TableHead className="text-muted-foreground">Cycle / Semaine</TableHead>
                    <TableHead className="text-muted-foreground">Attendu</TableHead>
                    <TableHead className="text-muted-foreground">Cotisé</TableHead>
                    <TableHead className="text-muted-foreground">Statut</TableHead>
                    <TableHead className="text-muted-foreground">Statut membre</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="border-border">
                      <TableCell className="font-medium text-foreground">
                        {memberName(c.user_id)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {memberContact(c.user_id)}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {categoryNameById[c.category_id] ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="text-foreground">
                          {c.cycle_id ? cycleNameById[c.cycle_id] ?? "Cycle" : "—"}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {formatWeek(c.due_date)}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground">{formatAmount(c.expected_amount)}</TableCell>
                      <TableCell className="text-foreground">{formatAmount(c.paid_amount)}</TableCell>
                      <TableCell>{statusBadge(c.status)}</TableCell>
                      <TableCell>{memberStatusBadge(memberStatus(c.user_id))}</TableCell>
                      <TableCell className="text-right">
                        {renderActions(c.user_id, memberName(c.user_id))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member status change — confirmation + optional reason */}
      <Dialog
        open={Boolean(statusAction)}
        onOpenChange={(open) => !open && !applyingStatus && setStatusAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le statut du membre</DialogTitle>
            <DialogDescription>
              {statusAction ? `${statusAction.memberName} → ${statusAction.label}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium text-muted-foreground">Raison (facultatif)</label>
            <Textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Motif interne (facultatif)"
              className="bg-background border-border"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusAction(null)} disabled={applyingStatus}>
              Annuler
            </Button>
            <Button
              onClick={applyStatusChange}
              disabled={applyingStatus}
              className="bg-amber-500/90 text-black hover:bg-amber-500"
            >
              {applyingStatus ? "Application..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
