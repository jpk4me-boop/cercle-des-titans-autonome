import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CalendarDays, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";

interface Cycle {
  id: string;
  group_id: string | null;
  name: string;
  start_date: string;
  end_date: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
}

interface CyclesTabProps {
  readOnly?: boolean;
}

export default function CyclesTab({ readOnly = false }: CyclesTabProps) {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [newCycle, setNewCycle] = useState({
    name: "",
    start_date: "",
    end_date: "",
    status: "planned",
  });

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    setLoading(true);

    try {
      const { data, error } = await (supabase as any)
        .from("cycles")
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
    if (!newCycle.name || !newCycle.start_date) {
      toast.error("Nom du cycle et date de début obligatoires");
      return;
    }

    setCreating(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await (supabase as any).from("cycles").insert({
        name: newCycle.name,
        start_date: newCycle.start_date,
        end_date: newCycle.end_date || null,
        status: newCycle.status,
        created_by: user?.id || null,
      });

      if (error) throw error;

      toast.success("Cycle créé avec succès");
      setNewCycle({
        name: "",
        start_date: "",
        end_date: "",
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
    try {
      const { error } = await (supabase as any)
        .from("cycles")
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

  const getStatusBadge = (status: string) => {
    if (status === "active") return <Badge className="bg-green-600">Actif</Badge>;
    if (status === "closed") return <Badge variant="secondary">Clôturé</Badge>;
    if (status === "planned") return <Badge variant="outline">Planifié</Badge>;
    return <Badge variant="outline">{status}</Badge>;
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

          <CardContent className="grid gap-4 md:grid-cols-4">
            <Input
              placeholder="Nom du cycle"
              value={newCycle.name}
              onChange={(e) => setNewCycle((prev) => ({ ...prev, name: e.target.value }))}
            />

            <Input
              type="date"
              value={newCycle.start_date}
              onChange={(e) => setNewCycle((prev) => ({ ...prev, start_date: e.target.value }))}
            />

            <Input
              type="date"
              value={newCycle.end_date}
              onChange={(e) => setNewCycle((prev) => ({ ...prev, end_date: e.target.value }))}
            />

            <Button onClick={createCycle} disabled={creating}>
              {creating ? "Création..." : "Créer le cycle"}
            </Button>
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
                  </div>

                  {!readOnly && (
                    <div className="flex gap-2">
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
