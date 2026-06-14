import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Phone,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Member {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
  profession: string | null;
}

interface UserRole {
  user_id: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'user' | 'investor';
}

type AssignableRole = UserRole['role'];

const MemberDirectory = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
  const [selectedRole, setSelectedRole] = useState<AssignableRole>('user');
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
        setLoadingData(true);

        // Check if user is admin or super admin
        const { data: adminData, error: adminError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['admin', 'super_admin'])
          .maybeSingle();

        if (adminError) throw adminError;

        const userIsAdmin = !!adminData;
        const userIsSuperAdmin = adminData?.role === 'super_admin';

        setIsAdmin(userIsAdmin);
        setIsSuperAdmin(userIsSuperAdmin);

        // Fetch members based on role - admins can see full profiles, others use the view
        let membersData: Member[] = [];

        if (userIsAdmin) {
          // Admins can see full profiles including email and phone
          const { data, error } = await supabase
            .from('profiles')
            .select('id, user_id, first_name, last_name, email, phone, avatar_url, city, profession')
            .order('first_name', { ascending: true });

          if (error) throw error;
          membersData = data || [];
        } else {
          // Non-admins use the secure member_directory view (no email/phone)
          const { data, error } = await supabase
            .from('member_directory')
            .select('id, user_id, first_name, last_name, avatar_url, city, profession')
            .order('first_name', { ascending: true });

          if (error) throw error;
          // Map view data to Member interface (email/phone will be null for non-admins)
          membersData = (data || []).map(m => ({ ...m, email: null, phone: null }));
        }
        setMembers(membersData);

        // If admin, fetch all roles
        if (userIsAdmin) {
          const { data: rolesData, error: rolesError } = await supabase
            .from('user_roles')
            .select('user_id, role');

          if (rolesError) throw rolesError;
          setRoles(rolesData || []);
        } else {
          setRoles([]);
        }
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

  const getMemberRole = (userId: string): string | null => {
    const role = roles.find(r => r.user_id === userId);
    return role?.role || null;
  };

  const getRoleBadge = (role: string | null) => {
    if (!role) return null;

    const roleStyles: Record<string, string> = {
      super_admin: 'bg-amber-500/10 text-amber-700',
      admin: 'bg-red-500/10 text-red-600',
      moderator: 'bg-blue-500/10 text-blue-600',
      investor: 'bg-purple-500/10 text-purple-600',
      user: 'bg-muted text-muted-foreground',
    };

    const roleLabels: Record<string, string> = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      moderator: 'Modérateur',
      investor: 'Investisseur',
      user: 'Membre',
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleStyles[role] || roleStyles.user}`}>
        {roleLabels[role] || role}
      </span>
    );
  };

  const filteredMembers = members.filter(member => {
    const fullName = `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase();
    const city = (member.city || '').toLowerCase();
    const profession = (member.profession || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    return fullName.includes(query) || city.includes(query) || profession.includes(query);
  });

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
      phone: member.phone || '',
      city: member.city || '',
      profession: member.profession || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;

    if (!isAdmin) {
      toast.error('Action réservée aux administrateurs.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name || null,
          last_name: editForm.last_name || null,
          email: editForm.email || null,
          phone: editForm.phone || null,
          city: editForm.city || null,
          profession: editForm.profession || null,
        })
        .eq('id', editingMember.id);

      if (error) throw error;

      setMembers(prev => prev.map(m =>
        m.id === editingMember.id
          ? { ...m, ...editForm }
          : m
      ));

      setEditingMember(null);
      toast.success('Profil mis à jour');
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  // Role assignment handlers
  const openRoleDialog = (member: Member) => {
    if (!isSuperAdmin) {
      toast.error('Seul le Super Administrateur peut attribuer les rôles.');
      return;
    }

    if (member.user_id === user?.id) {
      toast.error('Vous ne pouvez pas modifier votre propre rôle depuis cette page.');
      return;
    }

    setAssigningRole(member);
    setSelectedRole((getMemberRole(member.user_id) as AssignableRole) || 'user');
  };

  const handleAssignRole = async () => {
    if (!assigningRole) return;

    if (!isSuperAdmin) {
      toast.error('Action réservée au Super Administrateur.');
      return;
    }

    if (assigningRole.user_id === user?.id) {
      toast.error('Vous ne pouvez pas modifier votre propre rôle depuis cette page.');
      return;
    }

    setIsAssigningRole(true);
    try {
      // First, delete existing role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', assigningRole.user_id);

      if (deleteError) throw deleteError;

      // Then insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: assigningRole.user_id,
          role: selectedRole,
        });

      if (error) throw error;

      setRoles(prev => [
        ...prev.filter(r => r.user_id !== assigningRole.user_id),
        { user_id: assigningRole.user_id, role: selectedRole }
      ]);

      setAssigningRole(null);
      toast.success('Rôle attribué avec succès');
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error("Erreur lors de l'attribution du rôle");
    } finally {
      setIsAssigningRole(false);
    }
  };

  // Delete handlers
  const handleDeleteMember = async () => {
    if (!deletingMember) return;

    if (!isAdmin) {
      toast.error('Action réservée aux administrateurs.');
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deletingMember.id);

      if (error) throw error;

      setMembers(prev => prev.filter(m => m.id !== deletingMember.id));
      setDeletingMember(null);
      toast.success('Membre supprimé');
    } catch (error) {
      console.error('Error deleting member:', error);
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
            {members.length} membre{members.length > 1 ? 's' : ''} dans le cercle
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par nom, ville ou profession..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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
                key={member.id}
                onClick={() => navigate(`/members/${member.id}`)}
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
                      {isAdmin && getRoleBadge(getMemberRole(member.user_id))}
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

                    {/* Admin-only: show contact info */}
                    {isAdmin && (
                      <div className="mt-2 pt-2 border-t border-border space-y-1">
                        {member.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Actions */}
                {isAdmin && member.user_id !== user?.id && (
                  <div className="mt-4 pt-3 border-t border-border flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(member);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Modifier
                    </Button>

                    {isSuperAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRoleDialog(member);
                        }}
                      >
                        <UserCog className="w-3.5 h-3.5 mr-1.5" />
                        Rôle
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingMember(member);
                      }}
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
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
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
                  onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={editForm.city}
                onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="profession">Profession</Label>
              <Input
                id="profession"
                value={editForm.profession}
                onChange={(e) => setEditForm(prev => ({ ...prev, profession: e.target.value }))}
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

      {/* Assign Role Dialog - Super Admin only */}
      <Dialog open={isSuperAdmin && !!assigningRole} onOpenChange={(open) => !open && setAssigningRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attribuer un rôle</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Attribuer un rôle à {assigningRole?.first_name} {assigningRole?.last_name}
            </p>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AssignableRole)}>
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
      <AlertDialog open={!!deletingMember} onOpenChange={(open) => !open && setDeletingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le profil de {deletingMember?.first_name} {deletingMember?.last_name} sera définitivement supprimé.
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
