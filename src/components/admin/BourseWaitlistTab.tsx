import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
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
  type WaitlistStats,
  type WaitlistStatus,
} from "@/services/bourseWaitlistService";

interface BourseWaitlistTabProps {
  readOnly?: boolean;
}

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

const formatDate = (iso: string): string => {
  try {
    return format(new Date(iso), "dd MMM yyyy · HH:mm", { locale: fr });
  } catch {
    return iso;
  }
};

export default function BourseWaitlistTab({
  readOnly = false,
}: BourseWaitlistTabProps) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [stats, setStats] = useState<WaitlistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

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
        <Button onClick={load} disabled={loading} size="sm" variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
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

      {/* Liste */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Demandes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && entries.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-gold" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Aucune demande pour le moment.
            </div>
          ) : (
            <>
              {/* Desktop : tableau */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Nom</th>
                      <th className="py-2 pr-4 font-medium">Contact</th>
                      <th className="py-2 pr-4 font-medium">Ville</th>
                      <th className="py-2 pr-4 font-medium">Formule</th>
                      <th className="py-2 pr-4 font-medium">Date</th>
                      <th className="py-2 pr-4 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-border/50 align-top"
                      >
                        <td className="py-3 pr-4">
                          <div className="font-medium text-foreground">
                            {entry.full_name}
                          </div>
                          {entry.message && (
                            <div className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                              {entry.message}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="text-foreground">{entry.phone}</div>
                          {entry.email && (
                            <div className="text-xs text-muted-foreground">
                              {entry.email}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {entry.city ?? "—"}
                        </td>
                        <td className="py-3 pr-4 text-foreground">
                          {planLabel(entry.plan_interest)}
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground">
                          {formatDate(entry.created_at)}
                        </td>
                        <td className="py-3 pr-4">
                          <StatusControl entry={entry} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile / tablette : cartes */}
              <div className="space-y-3 lg:hidden">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-border bg-background/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">
                          {entry.full_name}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(entry.created_at)}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 ${statusBadgeClass(entry.status)}`}
                      >
                        {planLabel(entry.plan_interest)}
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-1.5 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 text-gold" />
                        <span className="text-foreground">{entry.phone}</span>
                      </div>
                      {entry.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 text-gold" />
                          <span className="break-all">{entry.email}</span>
                        </div>
                      )}
                      {entry.city && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-gold" />
                          <span>{entry.city}</span>
                        </div>
                      )}
                      {entry.message && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                          <span>{entry.message}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">Statut</span>
                      <StatusControl entry={entry} />
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
