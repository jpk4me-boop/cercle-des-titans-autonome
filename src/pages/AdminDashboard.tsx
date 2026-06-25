import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatAmount, TONTINE_CATEGORIES } from "@/lib/paymentService";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ArrowLeft, RefreshCw, Download, Users, CreditCard, TrendingUp, Clock, Filter, X, FileText, Coins, BarChart3, Megaphone } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import SuperAdminBadge from "@/components/SuperAdminBadge";
import FinancingRequestsTab from "@/components/admin/FinancingRequestsTab";
import CyclesTab from "@/components/admin/CyclesTab";
import ContributionsTab from "@/components/admin/ContributionsTab";
import WeeklyContributionsOverview from "@/components/admin/WeeklyContributionsOverview";
import AnalyticsTab from "@/components/admin/AnalyticsTab";
import MarketingTab from "@/components/admin/MarketingTab";

interface Transaction {
  id: string;
  reference: string;
  full_name: string;
  phone: string;
  email: string | null;
  category: string;
  amount: number;
  payment_method: string;
  status: string;
  transaction_id: string | null;
  receipt_url: string | null;
  created_at: string;
}

interface Filters {
  status: string;
  category: string;
  dateFrom: string;
  dateTo: string;
}

type UserRole = 'admin' | 'investor';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("transactions");
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    category: "all",
    dateFrom: "",
    dateTo: "",
  });

  const isReadOnly = userRole === 'investor';

  useEffect(() => {
    checkDashboardAccess();
  }, []);

  const checkDashboardAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Veuillez vous connecter");
        navigate("/auth");
        return;
      }

      // Check for admin or investor role
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "super_admin", "investor"]);

      if (error) {
        console.error("Error checking role:", error);
        toast.error("Erreur de vérification des droits");
        navigate("/");
        return;
      }

      if (!roles || roles.length === 0) {
        toast.error("Accès non autorisé");
        navigate("/");
        return;
      }

      // Prioritize admin role if user has both
      const hasAdmin = roles.some(r => r.role === 'admin' || r.role === 'super_admin');
      const hasInvestor = roles.some(r => r.role === 'investor');

      setIsSuperAdmin(roles.some(r => r.role === 'super_admin'));

      if (hasAdmin) {
        setUserRole('admin');
      } else if (hasInvestor) {
        setUserRole('investor');
      }

      setCheckingAuth(false);
      fetchTransactions();
    } catch (error) {
      console.error("Error:", error);
      navigate("/");
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Erreur lors du chargement des transactions");
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filters.status !== "all" && t.status !== filters.status) {
        return false;
      }
      if (filters.category !== "all" && t.category.toLowerCase() !== filters.category.toLowerCase()) {
        return false;
      }
      if (filters.dateFrom) {
        const transactionDate = new Date(t.created_at);
        const fromDate = new Date(filters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (transactionDate < fromDate) {
          return false;
        }
      }
      if (filters.dateTo) {
        const transactionDate = new Date(t.created_at);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (transactionDate > toDate) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, filters]);

  const clearFilters = () => {
    setFilters({
      status: "all",
      category: "all",
      dateFrom: "",
      dateTo: "",
    });
  };

  const hasActiveFilters = filters.status !== "all" || filters.category !== "all" || filters.dateFrom || filters.dateTo;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Confirmé</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">En attente</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Échoué</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    return method === "mtn_momo" ? "MTN MoMo" : "Orange Money";
  };

  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === "completed").length,
    pending: transactions.filter(t => t.status === "pending").length,
    totalAmount: transactions
      .filter(t => t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0),
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userRole) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">
                  {isReadOnly ? "Tableau de bord Investisseur" : "Tableau de bord Admin"}
                </h1>
                <SuperAdminBadge show={isSuperAdmin} />
              </div>
              <p className="text-muted-foreground">
                {isReadOnly ? "Vue en lecture seule des transactions et demandes" : "Gestion des transactions et demandes"}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Liste d'onglets : scroll horizontal sur mobile (évite le débordement
              hors écran / l'onglet Marketing masqué) ; alignée à gauche en desktop
              sans scroll si la place suffit. */}
          <TabsList className="flex h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto bg-muted/50 p-1">
            <TabsTrigger value="transactions" className="flex shrink-0 items-center gap-2 whitespace-nowrap">
              <CreditCard className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="financing" className="flex shrink-0 items-center gap-2 whitespace-nowrap">
              <FileText className="h-4 w-4" />
              Demandes de financement
            </TabsTrigger>
            <TabsTrigger value="cycles" className="flex shrink-0 items-center gap-2 whitespace-nowrap">
              <Clock className="h-4 w-4" />
              Cycles des tontines
            </TabsTrigger>
            <TabsTrigger value="contributions" className="flex shrink-0 items-center gap-2 whitespace-nowrap">
              <Coins className="h-4 w-4" />
              Cotisations
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex shrink-0 items-center gap-2 whitespace-nowrap">
              <Users className="h-4 w-4" />
              État hebdomadaire
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex shrink-0 items-center gap-2 whitespace-nowrap">
              <BarChart3 className="h-4 w-4" />
              Statistiques
            </TabsTrigger>
            <TabsTrigger value="marketing" className="flex shrink-0 items-center gap-2 whitespace-nowrap">
              <Megaphone className="h-4 w-4" />
              Marketing
            </TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Transactions
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                  {hasActiveFilters && (
                    <p className="text-xs text-muted-foreground">({filteredTransactions.length} filtrées)</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Confirmées
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    En attente
                  </CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Montant Total
                  </CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{formatAmount(stats.totalAmount)}</div>
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
                    <Button onClick={fetchTransactions} disabled={loading} size="sm">
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
                        <SelectItem value="completed">Confirmé</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="failed">Échoué</SelectItem>
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
                        {TONTINE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.name} value={cat.name.toLowerCase()}>
                            {cat.name} ({formatAmount(cat.amount)})
                          </SelectItem>
                        ))}
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

            {/* Transactions Table */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Transactions {hasActiveFilters ? `(${filteredTransactions.length} résultats)` : ""}</CardTitle>
                <CardDescription>Liste complète des paiements effectués</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {hasActiveFilters ? "Aucune transaction ne correspond aux filtres" : "Aucune transaction trouvée"}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="text-muted-foreground">Référence</TableHead>
                          <TableHead className="text-muted-foreground">Membre</TableHead>
                          <TableHead className="text-muted-foreground">Téléphone</TableHead>
                          <TableHead className="text-muted-foreground">Catégorie</TableHead>
                          <TableHead className="text-muted-foreground">Montant</TableHead>
                          <TableHead className="text-muted-foreground">Méthode</TableHead>
                          <TableHead className="text-muted-foreground">Statut</TableHead>
                          <TableHead className="text-muted-foreground">Date</TableHead>
                          <TableHead className="text-muted-foreground">Reçu</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((transaction) => (
                          <TableRow key={transaction.id} className="border-border">
                            <TableCell className="font-mono text-xs text-foreground">
                              {transaction.reference}
                            </TableCell>
                            <TableCell>
                              <div className="text-foreground">{transaction.full_name}</div>
                              {transaction.email && (
                                <div className="text-xs text-muted-foreground">{transaction.email}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-foreground">{transaction.phone}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {transaction.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-foreground">
                              {formatAmount(transaction.amount)}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {getPaymentMethodLabel(transaction.payment_method)}
                            </TableCell>
                            <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(transaction.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                            </TableCell>
                            <TableCell>
                              {transaction.receipt_url ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(transaction.receipt_url!, "_blank")}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financing Requests Tab */}
          <TabsContent value="financing">
            <FinancingRequestsTab readOnly={isReadOnly} />
          </TabsContent>

          {/* Cycles Tab */}
          <TabsContent value="cycles">
            <CyclesTab readOnly={isReadOnly} />
          </TabsContent>

          {/* Contributions Tab */}
          <TabsContent value="contributions">
            <ContributionsTab readOnly={isReadOnly} />
          </TabsContent>

          {/* Weekly contributions overview Tab */}
          <TabsContent value="weekly">
            <WeeklyContributionsOverview readOnly={isReadOnly} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsTab readOnly={isReadOnly} />
          </TabsContent>

          {/* Marketing Tab */}
          <TabsContent value="marketing">
            <MarketingTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
