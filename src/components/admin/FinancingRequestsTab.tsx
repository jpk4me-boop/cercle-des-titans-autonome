import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RefreshCw, Eye, FileText, CheckCircle, XCircle, Clock, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface FinancingRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  category: string;
  project_type: string;
  project_description: string;
  amount_requested: number;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Filters {
  status: string;
  category: string;
  dateFrom: string;
  dateTo: string;
}

const projectTypeLabels: Record<string, string> = {
  commerce: "Commerce / Vente",
  agriculture: "Agriculture / Élevage",
  artisanat: "Artisanat",
  services: "Services / Prestations",
  immobilier: "Immobilier",
  technologie: "Technologie / Digital",
  education: "Éducation / Formation",
  sante: "Santé",
  autre: "Autre",
};

const categoryLabels: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  diamond: "Diamond",
  platinium: "Platinium",
};

interface FinancingRequestsTabProps {
  readOnly?: boolean;
}

export default function FinancingRequestsTab({ readOnly = false }: FinancingRequestsTabProps) {
  const [requests, setRequests] = useState<FinancingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<FinancingRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    category: "all",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("financing_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching financing requests:", error);
      toast.error("Erreur lors du chargement des demandes");
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (filters.status !== "all" && r.status !== filters.status) return false;
      if (filters.category !== "all" && r.category !== filters.category) return false;
      if (filters.dateFrom) {
        const requestDate = new Date(r.created_at);
        const fromDate = new Date(filters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (requestDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const requestDate = new Date(r.created_at);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (requestDate > toDate) return false;
      }
      return true;
    });
  }, [requests, filters]);

  const clearFilters = () => {
    setFilters({
      status: "all",
      category: "all",
      dateFrom: "",
      dateTo: "",
    });
  };

  const hasActiveFilters = filters.status !== "all" || filters.category !== "all" || filters.dateFrom || filters.dateTo;

  const openDetail = (request: FinancingRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || "");
    setIsDetailOpen(true);
  };

  const updateStatus = async (newStatus: string) => {
    if (!selectedRequest) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("financing_requests")
        .update({ 
          status: newStatus,
          admin_notes: adminNotes 
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast.success(`Demande ${newStatus === "approved" ? "approuvée" : newStatus === "rejected" ? "refusée" : "mise à jour"}`);
      setIsDetailOpen(false);
      fetchRequests();
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approuvée</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Refusée</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">En attente</Badge>;
      case "in_review":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">En cours d'examen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total demandes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approuvées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Refusées</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-lg">Filtres</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
              )}
              <Button onClick={fetchRequests} disabled={loading} size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Statut</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_review">En cours d'examen</SelectItem>
                  <SelectItem value="approved">Approuvée</SelectItem>
                  <SelectItem value="rejected">Refusée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Catégorie</label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="diamond">Diamond</SelectItem>
                  <SelectItem value="platinium">Platinium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Date début</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Date fin</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="bg-background border-border"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Demandes de financement {hasActiveFilters ? `(${filteredRequests.length} résultats)` : ""}</CardTitle>
          <CardDescription>Liste des demandes de financement soumises</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {hasActiveFilters ? "Aucune demande ne correspond aux filtres" : "Aucune demande de financement"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Demandeur</TableHead>
                    <TableHead className="text-muted-foreground">Catégorie</TableHead>
                    <TableHead className="text-muted-foreground">Type de projet</TableHead>
                    <TableHead className="text-muted-foreground">Montant</TableHead>
                    <TableHead className="text-muted-foreground">Statut</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} className="border-border">
                      <TableCell>
                        <div className="text-foreground font-medium">{request.full_name}</div>
                        <div className="text-xs text-muted-foreground">{request.email}</div>
                        <div className="text-xs text-muted-foreground">{request.phone}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {categoryLabels[request.category] || request.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {projectTypeLabels[request.project_type] || request.project_type}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {formatAmount(request.amount_requested)}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(request.created_at), "dd MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openDetail(request)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Demande de financement</DialogTitle>
                <DialogDescription>
                  Soumise le {format(new Date(selectedRequest.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Statut actuel</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>

                {/* Demandeur Info */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-foreground">Informations du demandeur</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nom complet</span>
                      <p className="text-foreground font-medium">{selectedRequest.full_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Téléphone</span>
                      <p className="text-foreground font-medium">{selectedRequest.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Email</span>
                      <p className="text-foreground font-medium">{selectedRequest.email}</p>
                    </div>
                  </div>
                </div>

                {/* Project Info */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-foreground">Détails du projet</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Catégorie</span>
                      <p className="text-foreground font-medium capitalize">
                        {categoryLabels[selectedRequest.category] || selectedRequest.category}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type de projet</span>
                      <p className="text-foreground font-medium">
                        {projectTypeLabels[selectedRequest.project_type] || selectedRequest.project_type}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Montant demandé</span>
                      <p className="text-foreground font-semibold text-lg">
                        {formatAmount(selectedRequest.amount_requested)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Description du projet</span>
                    <p className="text-foreground mt-1 whitespace-pre-wrap">
                      {selectedRequest.project_description}
                    </p>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Notes administrateur</label>
                  {readOnly ? (
                    <div className="p-3 bg-muted/30 rounded-md min-h-[100px] text-sm text-foreground">
                      {adminNotes || <span className="text-muted-foreground italic">Aucune note</span>}
                    </div>
                  ) : (
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Ajoutez vos notes ici..."
                      className="min-h-[100px]"
                    />
                  )}
                </div>

                {/* Action Buttons - Only show for admins */}
                {!readOnly && (
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    {selectedRequest.status === "pending" && (
                      <Button
                        variant="outline"
                        onClick={() => updateStatus("in_review")}
                        disabled={updating}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Marquer en examen
                      </Button>
                    )}
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updateStatus("approved")}
                      disabled={updating || selectedRequest.status === "approved"}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => updateStatus("rejected")}
                      disabled={updating || selectedRequest.status === "rejected"}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Refuser
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}