import React, { useEffect, useMemo, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Users,
  Search,
  MapPin,
  Briefcase,
  Loader2,
  Home,
  Shield,
  Pencil,
  Trash2,
  UserCog,
  Mail,
  Filter,
  X,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  fetchAdminMembersEnriched,
  type AdminMemberEnriched,
} from '@/services/memberService';

type Member = AdminMemberEnriched;

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  moderator: 'Modérateur',
  investor: 'Investisseur',
  user: 'Membre',
};

const roleStyles: Record<string, string> = {
  admin: 'bg-red-500/10 text-red-600',
  moderator: 'bg-blue-500/10 text-blue-600',
  investor: 'bg-purple-500/10 text-purple-600',
  user: 'bg-muted text-muted-foreground',
};

const financingStatusLabels: Record<string, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
};

interface ToggleFilters {
  activeTontine: boolean;
  hasContributions: boolean;
  hasDeclaredPayments: boolean;
  hasValidatedPayments: boolean;
  overdue: boolean;
  hasFinancing: boolean;
}

const initialToggles: ToggleFilters = {
  activeTontine: false,
  hasContributions: false,
  hasDeclaredPayments: false,
  hasValidatedPayments: false,
  overdue: false,
  hasFinancing: false,
};

const MemberDirectory = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [members, setMembers] = useState<Member[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [tontineCategoryFilter, setTontineCategoryFilter] = useState('all');
  const [financingStatusFilter, setFinancingStatusFilter] = useState('all');
  const [toggles, setToggles] = useState<ToggleFilters>(initialToggles);

  // Edit dialog state
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    profession: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Role dialog state
  const [assigningRole, setAssigningRole] = useState<Member | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('user');
  const [isAssigningRole, setIsAssigningRole] = useState(false);

  // Delete dialog state
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Confirm the viewer is admin/super_admin (route is already guarded).
        const { data: adminData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['admin', 'super_admin'])
          .limit(1);

        setIsAdmin(!!adminData && adminData.length > 0);

        // Admin-only enriched directory (RPC enforces authorization server-side
        // and excludes super_admins). Sensitive tontine/financing data lives
        // only here, never in member_directory_public.
        const enriched = await fetchAdminMembersEnriched();
        setMembers(enriched);
      } catch (error) {
        console.error('Error fetching members:', error);
        toast.error('Erreur lors du chargement des membres');
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const reloadMembers = async () => {
    if (!user) return;
    try {
      const enriched = await fetchAdminMembersEnriched();
      setMembers(enriched);
    } catch (error) {
      console.error('Error reloading members:', error);
      toast.error('Erreur lors du rechargement des membres');
    }
  };

  const getMemberRole = (userId: string | null): string | null => {
    if (!userId) return null;
    return members.find((m) => m.user_id === userId)?.role ?? null;
  };

  const getRoleBadge = (role: string | null) => {
    if (!role) return null;
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          roleStyles[role] || roleStyles.user
        }`}
      >
        {roleLabels[role] || role}
      </span>
    );
  };

  // Distinct option lists derived from loaded data.
  const tontineCategoryOptions = useMemo(
    () =>
      Array.from(new Set(members.flatMap((m) => m.tontine_category_names))).sort(),
    [members]
  );
  const financingStatusOptions = useMemo(
    () => Array.from(new Set(members.flatMap((m) => m.financing_statuses))).sort(),
    [members]
  );
  const roleOptions = useMemo(
    () =>
      Array.from(new Set(members.map((m) => m.role).filter(Boolean))) as string[],
    [members]
  );

  const filteredMembers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return members.filter((member) => {
      const fullName = `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase();
      const city = (member.city || '').toLowerCase();
      const profession = (member.profession || '').toLowerCase();
      const email = (member.email || '').toLowerCase();

      if (
        query &&
        !(
          fullName.includes(query) ||
          city.includes(query) ||
          profession.includes(query) ||
          email.includes(query)
        )
      ) {
        return false;
      }

      if (roleFilter !== 'all' && member.role !== roleFilter) return false;
      if (
        tontineCategoryFilter !== 'all' &&
        !member.tontine_category_names.includes(tontineCategoryFilter)
      ) {
        return false;
      }
      if (
        financingStatusFilter !== 'all' &&
        !member.financing_statuses.includes(financingStatusFilter)
      ) {
        return false;
      }

      if (toggles.activeTontine && !member.has_active_tontine) return false;
      if (toggles.hasContributions && !member.has_contributions) return false;
      if (toggles.hasDeclaredPayments && !member.has_declared_payment) return false;
      if (toggles.hasValidatedPayments && !member.has_validated_payment) return false;
      if (toggles.overdue && !member.has_overdue_contribution) return false;
      if (toggles.hasFinancing && !member.has_financing_request) return false;

      return true;
    });
  }, [
    members,
    searchQuery,
    roleFilter,
    tontineCategoryFilter,
    financingStatusFilter,
    toggles,
  ]);

  const hasActiveFilters =
    Boolean(searchQuery) ||
    roleFilter !== 'all' ||
    tontineCategoryFilter !== 'all' ||
    financingStatusFilter !== 'all' ||
    Object.values(toggles).some(Boolean);

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setTontineCategoryFilter('all');
    setFinancingStatusFilter('all');
    setToggles(initialToggles);
  };

  const getInitials = (member: Member) => {
    const first = member.first_name?.[0] || '';
    const last = member.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'M';
  };

  // Edit handlers
  const openEditDialog = (member: Member) => {
    setEditingMember(member);
    setEditForm({
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      email: member.email || '',
      phone: '',
      city: member.city || '',
      profession: member.profession || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingMember || !editingMember.user_id) {
      console.error('Member action failed: missing user_id', { member: editingMember });
      toast.error('Identifiant utilisateur manquant');
      return;
    }

    setIsSaving(true);
    try {
      const supabaseRpc = supabase as any;
      const { error } = await supabaseRpc.rpc('admin_update_member_profile', {
        target_user_id: editingMember.user_id,
        p_first_name: editForm.first_name || null,
        p_last_name: editForm.last_name || null,
        p_city: editForm.city || null,
        p_profession: editForm.profession || null,
        p_phone: editForm.phone || null,
        p_email: editForm.email || null,
        p_avatar_url: editingMember.avatar_url || null,
      });

      if (error) throw error;

      await reloadMembers();
      setEditingMember(null);
      toast.success('Profil mis à jour');
    } catch (error) {
      console.error('Member action failed', { member: editingMember, error });
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  // Navigation carte membre + protection clics boutons admin
  const handleMemberCardClick = (
    e: ReactMouseEvent<HTMLDivElement>,
    member: Member
  ) => {
    const target = e.target as HTMLElement | null;

    if (target?.closest('[data-member-action="true"]')) {
      return;
    }

    if (!member.user_id) {
      toast.error('Identifiant utilisateur manquant');
      return;
    }

    navigate(`/members/${member.user_id}`);
  };

  const stopMemberActionPropagation = (e: ReactMouseEvent<HTMLElement>) => {
    e.stopPropagation();
  };

  // Role assignment handlers
  const openRoleDialog = (member: Member) => {
    if (!member.user_id) {
      toast.error('Identifiant utilisateur manquant');
      return;
    }

    setAssigningRole(member);
    setSelectedRole(getMemberRole(member.user_id) || 'user');
  };

  const handleAssignRole = async () => {
    if (!assigningRole || !assigningRole.user_id) {
      console.error('Member action failed: missing user_id', { member: assigningRole });
      toast.error('Identifiant utilisateur manquant');
      return;
    }

    // Prevent assigning super_admin role
    if (selectedRole === 'super_admin') {
      toast.error("Impossible d'attribuer le rôle super_admin");
      return;
    }

    // Safety: cannot modify a super_admin (also excluded server-side)
    const currentRole = getMemberRole(assigningRole.user_id);
    if (currentRole === 'super_admin') {
      toast.error("Impossible de modifier le rôle d'un super_admin");
      return;
    }

    setIsAssigningRole(true);
    try {
      const supabaseRpc = supabase as any;
      const { error } = await supabaseRpc.rpc('admin_assign_user_role', {
        target_user_id: assigningRole.user_id,
        p_role: selectedRole,
        p_email: assigningRole.email ?? null,
      });

      if (error) throw error;

      await reloadMembers();
      setAssigningRole(null);
      toast.success('Rôle attribué avec succès');
    } catch (error) {
      console.error('Member action failed', { member: assigningRole, error });
      toast.error("Erreur lors de l'attribution du rôle");
    } finally {
      setIsAssigningRole(false);
    }
  };

  // Delete handlers
  const handleDeleteMember = async () => {
    if (!deletingMember || !deletingMember.user_id) {
      console.error('Member action failed: missing user_id', { member: deletingMember });
      toast.error('Identifiant utilisateur manquant');
      return;
    }

    setIsDeleting(true);
    try {
      const supabaseRpc = supabase as any;
      const { error } = await supabaseRpc.rpc('admin_delete_member_profile', {
        target_user_id: deletingMember.user_id,
      });

      if (error) throw error;

      await reloadMembers();
      setDeletingMember(null);
      toast.success('Membre supprimé');
    } catch (error) {
      console.error('Member action failed', { member: deletingMember, error });
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
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
            <h1 className="font-display text-xl font-bold text-primary">Cercle des Titans</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-display font-bold text-foreground">
              Annuaire des Membres
            </h2>
          </div>
          <p className="text-muted-foreground">
            {filteredMembers.length} / {members.length} membre
            {members.length > 1 ? 's' : ''} affiché{filteredMembers.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par nom, ville, profession ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">Filtres</span>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Rôle</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  {roleOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabels[r] || r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Catégorie de tontine
              </label>
              <Select value={tontineCategoryFilter} onValueChange={setTontineCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {tontineCategoryOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Statut financement
              </label>
              <Select value={financingStatusFilter} onValueChange={setFinancingStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {financingStatusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {financingStatusLabels[s] || s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {([
              ['activeTontine', 'Tontine active'],
              ['hasContributions', 'A des cotisations'],
              ['hasDeclaredPayments', 'A déclaré un paiement'],
              ['hasValidatedPayments', 'Paiement validé'],
              ['overdue', 'En retard'],
              ['hasFinancing', 'Demande financement'],
            ] as [keyof ToggleFilters, string][]).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 text-sm text-foreground cursor-pointer"
              >
                <Checkbox
                  checked={toggles[key]}
                  onCheckedChange={(checked) =>
                    setToggles((prev) => ({ ...prev, [key]: checked === true }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Members Grid */}
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun membre trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <div
                key={member.id || member.user_id}
                onClick={(e) => handleMemberCardClick(e, member)}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(member)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground truncate">
                        {member.first_name || ''} {member.last_name || 'Membre'}
                      </h3>
                      {isAdmin && getRoleBadge(member.role)}
                    </div>

                    {member.profession && (
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span className="truncate">{member.profession}</span>
                      </div>
                    )}

                    {member.city && (
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{member.city}</span>
                      </div>
                    )}

                    {/* Admin-only: contact info */}
                    {isAdmin && member.email && (
                      <div className="mt-2 pt-2 border-t border-border space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      </div>
                    )}

                    {/* Status chips */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {member.tontine_category_names.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary"
                        >
                          {c}
                        </span>
                      ))}
                      {member.has_overdue_contribution && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-600">
                          En retard
                        </span>
                      )}
                      {member.has_validated_payment && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-600">
                          Paiement validé
                        </span>
                      )}
                      {member.financing_statuses.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-600"
                        >
                          Financement: {financingStatusLabels[s] || s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                {isAdmin && member.user_id !== user?.id && member.user_id && (
                  <div
                    data-member-action="true"
                    onClick={stopMemberActionPropagation}
                    className="mt-4 pt-3 border-t border-border flex gap-2"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(member)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => openRoleDialog(member)}
                    >
                      <UserCog className="w-3.5 h-3.5 mr-1.5" />
                      Rôle
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeletingMember(member)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le profil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Prénom</Label>
                <Input
                  id="first_name"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={editForm.city}
                onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="profession">Profession</Label>
              <Input
                id="profession"
                value={editForm.profession}
                onChange={(e) => setEditForm((prev) => ({ ...prev, profession: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog
        open={!!assigningRole}
        onOpenChange={(open) => {
          if (!open) {
            setAssigningRole(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attribuer un rôle</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Attribuer un rôle à {assigningRole?.first_name} {assigningRole?.last_name}
            </p>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Membre</SelectItem>
                <SelectItem value="moderator">Modérateur</SelectItem>
                <SelectItem value="investor">Investisseur</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigningRole(null)}>
              Annuler
            </Button>
            <Button onClick={handleAssignRole} disabled={isAssigningRole}>
              {isAssigningRole ? 'Attribution...' : 'Attribuer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMember} onOpenChange={() => setDeletingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le profil de {deletingMember?.first_name}{' '}
              {deletingMember?.last_name} sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MemberDirectory;
