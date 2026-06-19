import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CalendarDays, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TontineCycle {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  status: string;
  contribution_amount: number;
  description: string | null;
  created_at: string;
}

interface CyclesTabProps {
  readOnly?: boolean;
}

export default function CyclesTab({ readOnly = false }: CyclesTabProps) {
  const [cycles, setCycles] = useState<TontineCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [cycleToDelete, setCycleToDelete] = useState<TontineCycle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [newCycle, setNewCycle] = useState({
    name: "",
    start_date: "",
    end_date: "",
    contribution_amount: "",
    description: "",
    status: "planned",
  });

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    setLoading(true);

    try {
      const { data, error } = await (supabase as any)
        .from("tontine_cycles")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;

      setCycles(data || []);
    } catch (error) {
      console.error("Erreur chargement cycles:", error);
      toast.error("Erreur lors du chargement des cycles");
    } finally {
      setLoading(false);
    }
  };

  const createCycle = async () => {
    if (readOnly) {
      toast.error("Action non autorisée en lecture seule");
      return;
    }

    if (!newCycle.name || !newCycle.start_date) {
      toast.error("Nom du cycle et date de début obligatoires");
      return;
    }

    if (newCycle.end_date && newCycle.end_date < newCycle.start_date) {
      toast.error("La date de fin ne peut pas être antérieure à la date de début");
      return;
    }

    const contributionAmount = Number(newCycle.contribution_amount || 0);

    if (!Number.isFinite(contributionAmount) || contributionAmount < 0) {
      toast.error("Le montant de contribution est invalide");
      return;
    }

    setCreating(true);

    try {
      const { error } = await (supabase as any)
        .from("tontine_cycles")
        .insert({
          name: newCycle.name,
          start_date: newCycle.start_date,
          end_date: newCycle.end_date || null,
          status: newCycle.status,
          contribution_amount: contributionAmount,
          description: newCycle.description || null,
        });

      if (error) throw error;

      toast.success("Cycle créé avec succès");

      setNewCycle({
        name: "",
        start_date: "",
        end_date: "",
        contribution_amount: "",
        description: "",
        status: "planned",
      });

      fetchCycles();
    } catch (error) {
      console.error("Erreur création cycle:", error);
      toast.error("Erreur lors de la création du cycle");
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    if (readOnly) {
      toast.error("Action non autorisée en lecture seule");
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from("tontine_cycles")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast.success("Statut du cycle mis à jour");
      fetchCycles();
    } catch (error) {
      console.error("Erreur mise à jour cycle:", error);
      toast.error("Erreur lors de la mise à jour du cycle");
    }
  };

  // Permanent deletion, allowed ONLY when the cycle has zero linked data.
  // The cycle_id foreign keys on tontine_contributions / contribution_payments
  // cascade on delete, so removing a cycle that holds rows would silently wipe
  // financial history. We therefore re-check counts server-side right before the
  // delete and block when any linked row exists.
  const confirmDelete = async () => {
    if (!cycleToDelete) return;
    if (readOnly) {
      toast.error("Action non autorisée en lecture seule");
      setCycleToDelete(null);
      return;
    }

    setDeleting(true);
    try {
      const [contribRes, payRes] = await Promise.all([
        (supabase as any)
          .from("tontine_contributions")
          .select("id", { count: "exact", head: true })
          .eq("cycle_id", cycleToDelete.id),
        (supabase as any)
          .from("contribution_payments")
          .select("id", { count: "exact", head: true })
          .eq("cycle_id", cycleToDelete.id),
      ]);

      if (contribRes.error) throw contribRes.error;
      if (payRes.error) throw payRes.error;

      if ((contribRes.count ?? 0) > 0 || (payRes.count ?? 0) > 0) {
        toast.error("Ce cycle contient déjà des données. Utilisez plutôt Clôturer.");
        setCycleToDelete(null);
        return;
      }

      const { error } = await (supabase as any)
        .from("tontine_cycles")
        .delete()
        .eq("id", cycleToDelete.id);

      if (error) throw error;

      toast.success("Cycle supprimé définitivement");
      setCycleToDelete(null);
      fetchCycles();
    } catch (error) {
      console.error("Erreur suppression cycle:", error);
      toast.error("Erreur lors de la suppression du cycle");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") return <Badge className="bg-green-600">Actif</Badge>;
    if (status === "closed") return <Badge variant="secondary">Clôturé</Badge>;
    if (status === "planned") return <Badge variant="outline">Planifié</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount || 0);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total cycles</CardTitle>
            <CardDescription>Nombre de cycles enregistrés</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{cycles.length}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cycles actifs</CardTitle>
            <CardDescription>Cycles actuellement ouverts</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {cycles.filter((cycle) => cycle.status === "active").length}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cycles clôturés</CardTitle>
            <CardDescription>Cycles terminés</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {cycles.filter((cycle) => cycle.status === "closed").length}
          </CardContent>
        </Card>
      </div>

      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nouveau cycle de tontine
            </CardTitle>
            <CardDescription>
              Créer un cycle mensuel ou périodique pour organiser les cotisations.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-5">
            <Input
              placeholder="Nom du cycle"
              value={newCycle.name}
              onChange={(e) => setNewCycle((prev) => ({ ...prev, name: e.target.value }))}
            />

            <Input
              type="number"
              min="0"
              placeholder="Montant contribution"
              value={newCycle.contribution_amount}
              onChange={(e) =>
                setNewCycle((prev) => ({ ...prev, contribution_amount: e.target.value }))
              }
            />

            <Input
              type="date"
              value={newCycle.start_date}
              onChange={(e) =>
                setNewCycle((prev) => ({ ...prev, start_date: e.target.value }))
              }
            />

            <Input
              type="date"
              value={newCycle.end_date}
              onChange={(e) =>
                setNewCycle((prev) => ({ ...prev, end_date: e.target.value }))
              }
            />

            <Button onClick={createCycle} disabled={creating}>
              {creating ? "Création..." : "Créer le cycle"}
            </Button>

            <Input
              className="md:col-span-5"
              placeholder="Description facultative"
              value={newCycle.description}
              onChange={(e) =>
                setNewCycle((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Cycles des tontines
            </CardTitle>
            <CardDescription>
              Gestion des périodes de cotisation et cycles de tontine.
            </CardDescription>
          </div>

          <Button variant="outline" onClick={fetchCycles}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Chargement des cycles...</p>
          ) : cycles.length === 0 ? (
            <p className="text-muted-foreground">Aucun cycle enregistré.</p>
          ) : (
            <div className="space-y-3">
              {cycles.map((cycle) => (
                <div
                  key={cycle.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{cycle.name}</h3>
                      {getStatusBadge(cycle.status)}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Du {cycle.start_date} au {cycle.end_date || ""}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Contribution : {formatAmount(cycle.contribution_amount)} FCFA
                    </p>

                    {cycle.description && (
                      <p className="text-sm text-muted-foreground">
                        {cycle.description}
                      </p>
                    )}
                  </div>

                  {!readOnly && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(cycle.id, "active")}
                        disabled={cycle.status === "active"}
                      >
                        Activer
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateStatus(cycle.id, "closed")}
                        disabled={cycle.status === "closed"}
                      >
                        Clôturer
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCycleToDelete(cycle)}
                        className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(cycleToDelete)}
        onOpenChange={(open) => !open && !deleting && setCycleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement ce cycle ? Cette action est irréversible.</AlertDialogTitle>
            <AlertDialogDescription>
              {cycleToDelete ? `Cycle : « ${cycleToDelete.name} ». ` : ""}
              La suppression n'est possible que si le cycle ne contient aucune cotisation ni paiement lié.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-red-500/90 text-white hover:bg-red-500"
            >
              {deleting ? "Suppression..." : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}