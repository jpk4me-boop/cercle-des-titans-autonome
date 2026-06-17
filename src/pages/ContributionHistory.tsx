import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Filter,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import { fetchMemberContributions } from '@/services/tontineService';
import type { TontineContribution } from '@/types/tontine';

interface Filters {
  status: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

type SortField = 'due_date' | 'expected_amount' | 'paid_amount' | 'status';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

// FCFA amount formatting (the tontine module is FCFA, integer amounts).
const fmtAmount = (value: number) => `${Number(value).toLocaleString('fr-FR')} FCFA`;

const remainingAmount = (c: TontineContribution) =>
  Math.max(Number(c.expected_amount) - Number(c.paid_amount), 0);

const statusLabel = (status: string) => {
  switch (status) {
    case 'paid':
      return 'Payé';
    case 'partial':
      return 'Partiel';
    case 'pending':
      return 'En attente';
    case 'overdue':
      return 'En retard';
    case 'cancelled':
      return 'Annulé';
    default:
      return status;
  }
};

const ContributionHistory = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [contributions, setContributions] = useState<TontineContribution[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
  });
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchContributions = async () => {
      if (!user) return;

      try {
        // Source of truth: tontine_contributions (via tontineService), not the legacy table.
        const data = await fetchMemberContributions(user.id, 500);
        setContributions(data);
      } catch (error) {
        console.error('Error fetching contributions:', error);
        toast.error('Erreur lors du chargement des cotisations');
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchContributions();
    }
  }, [user]);

  // Filter and sort contributions
  const filteredContributions = useMemo(() => {
    let result = [...contributions];

    // Apply filters
    if (filters.status !== 'all') {
      result = result.filter(c => c.status === filters.status);
    }
    if (filters.dateFrom) {
      result = result.filter(c => c.due_date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter(c => c.due_date <= filters.dateTo);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(c =>
        c.expected_amount.toString().includes(search) ||
        c.paid_amount.toString().includes(search)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'due_date':
          comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case 'expected_amount':
          comparison = Number(a.expected_amount) - Number(b.expected_amount);
          break;
        case 'paid_amount':
          comparison = Number(a.paid_amount) - Number(b.paid_amount);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [contributions, filters, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredContributions.length / ITEMS_PER_PAGE);
  const paginatedContributions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredContributions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredContributions, currentPage]);

  // Stats
  const stats = useMemo(() => {
    const total = contributions.length;
    const paid = contributions.filter(c => c.status === 'paid').length;
    const pending = contributions.filter(c => c.status === 'pending').length;
    const overdue = contributions.filter(c => c.status === 'overdue').length;
    const totalPaid = contributions.reduce((sum, c) => sum + Number(c.paid_amount), 0);
    return { total, paid, pending, overdue, totalPaid };
  }, [contributions]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      dateFrom: '',
      dateTo: '',
      search: '',
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = filters.status !== 'all' ||
    filters.dateFrom || filters.dateTo || filters.search;

  // Export functions
  const exportToCSV = () => {
    const headers = ['Date d\'échéance', 'Attendu (FCFA)', 'Payé (FCFA)', 'Reste (FCFA)', 'Statut'];
    const rows = filteredContributions.map(c => [
      format(new Date(c.due_date), 'dd/MM/yyyy'),
      Number(c.expected_amount).toLocaleString('fr-FR'),
      Number(c.paid_amount).toLocaleString('fr-FR'),
      remainingAmount(c).toLocaleString('fr-FR'),
      statusLabel(c.status),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cotisations_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV téléchargé');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Historique des Cotisations', 14, 22);
    doc.setFontSize(10);
    doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 14, 30);

    // Stats
    doc.setFontSize(12);
    doc.text(`Total payé: ${stats.totalPaid.toLocaleString('fr-FR')} FCFA`, 14, 42);
    doc.text(`Payées: ${stats.paid} | En attente: ${stats.pending} | En retard: ${stats.overdue}`, 14, 50);

    // Table
    let yPos = 65;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Échéance', 14, yPos);
    doc.text('Attendu', 55, yPos);
    doc.text('Payé', 90, yPos);
    doc.text('Reste', 125, yPos);
    doc.text('Statut', 160, yPos);

    doc.setFont('helvetica', 'normal');
    yPos += 8;

    filteredContributions.slice(0, 30).forEach((c) => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(format(new Date(c.due_date), 'dd/MM/yyyy'), 14, yPos);
      doc.text(Number(c.expected_amount).toLocaleString('fr-FR'), 55, yPos);
      doc.text(Number(c.paid_amount).toLocaleString('fr-FR'), 90, yPos);
      doc.text(remainingAmount(c).toLocaleString('fr-FR'), 125, yPos);
      doc.text(statusLabel(c.status), 160, yPos);
      yPos += 7;
    });

    doc.save(`cotisations_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('Export PDF téléchargé');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Payé</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"><Clock className="w-3 h-3 mr-1" /> Partiel</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
      case 'overdue':
        return <Badge variant="secondary" className="bg-red-500/10 text-red-600 hover:bg-red-500/20"><AlertCircle className="w-3 h-3 mr-1" /> En retard</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-muted-foreground"><X className="w-3 h-3 mr-1" /> Annulé</Badge>;
      default:
        return null;
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="font-display text-xl font-bold text-foreground">Historique des Cotisations</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Total payé</p>
            <p className="text-xl font-bold text-foreground">{stats.totalPaid.toLocaleString('fr-FR')} FCFA</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Payées</p>
            <p className="text-xl font-bold text-green-600">{stats.paid}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">En attente</p>
            <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">En retard</p>
            <p className="text-xl font-bold text-red-600">{stats.overdue}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
              {hasActiveFilters && <Badge className="ml-2 bg-primary text-primary-foreground">Actif</Badge>}
            </Button>

            <div className="flex-1">
              <Input
                placeholder="Rechercher un montant..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="max-w-xs"
              />
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Effacer les filtres
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Statut</label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="paid">Payé</SelectItem>
                    <SelectItem value="partial">Partiel</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="overdue">En retard</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Date début</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {filters.dateFrom ? format(new Date(filters.dateFrom), 'dd/MM/yyyy') : 'Sélectionner'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                      onSelect={(date) => setFilters({ ...filters, dateFrom: date ? format(date, 'yyyy-MM-dd') : '' })}
                      className={cn("p-3 pointer-events-auto")}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Date fin</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {filters.dateTo ? format(new Date(filters.dateTo), 'dd/MM/yyyy') : 'Sélectionner'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                      onSelect={(date) => setFilters({ ...filters, dateTo: date ? format(date, 'yyyy-MM-dd') : '' })}
                      className={cn("p-3 pointer-events-auto")}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {filteredContributions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune cotisation trouvée</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('due_date')}
                      >
                        <div className="flex items-center gap-1">
                          Échéance
                          <SortIcon field="due_date" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('expected_amount')}
                      >
                        <div className="flex items-center gap-1">
                          Attendu
                          <SortIcon field="expected_amount" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('paid_amount')}
                      >
                        <div className="flex items-center gap-1">
                          Payé
                          <SortIcon field="paid_amount" />
                        </div>
                      </TableHead>
                      <TableHead>Reste</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-1">
                          Statut
                          <SortIcon field="status" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedContributions.map((contribution) => (
                      <TableRow key={contribution.id}>
                        <TableCell>
                          {format(new Date(contribution.due_date), 'dd MMMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {fmtAmount(contribution.expected_amount)}
                        </TableCell>
                        <TableCell>
                          {fmtAmount(contribution.paid_amount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {fmtAmount(remainingAmount(contribution))}
                        </TableCell>
                        <TableCell>{getStatusBadge(contribution.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {filteredContributions.length} cotisation(s) • Page {currentPage} sur {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ContributionHistory;
