import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Home as HomeIcon,
  Shield,
  User,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { fetchMemberContributions } from '@/services/tontineService';
import type { TontineContribution } from '@/types/tontine';

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
  profession: string | null;
  address: string | null;
  birth_date: string | null;
  created_at: string;
}

interface UserRole {
  role: 'super_admin' | 'admin' | 'moderator' | 'user' | 'investor';
}

const MemberProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [contributions, setContributions] = useState<TontineContribution[]>([]);
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) return;

      try {
        // Check if current user is admin
        const { data: adminData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['admin', 'super_admin'])
          .maybeSingle();

        const userIsAdmin = !!adminData;
        setIsAdmin(userIsAdmin);

        // Fetch profile by user_id (the route param is the member's user_id,
        // matching how MemberDirectory builds the /members/:id link)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        const isOwn = profileData.user_id === user.id;
        setIsOwnProfile(isOwn);

        // Fetch member's role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profileData.user_id)
          .maybeSingle();

        setMemberRole(roleData?.role || null);

        // Fetch contributions only if admin or own profile.
        // Source of truth: tontine_contributions (via tontineService), not the legacy table.
        if (userIsAdmin || isOwn) {
          try {
            const contributionsData = await fetchMemberContributions(profileData.user_id);
            setContributions(contributionsData);
          } catch (contribError) {
            console.error('Error fetching contributions:', contribError);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Membre introuvable');
        navigate('/members');
      } finally {
        setLoadingData(false);
      }
    };

    if (user && id) {
      fetchData();
    }
  }, [user, id, navigate]);

  const getInitials = (profile: Profile) => {
    const first = profile.first_name?.[0] || '';
    const last = profile.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'M';
  };

  const getRoleBadge = (role: string | null) => {
    if (!role) return null;

    const roleConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      admin: { label: 'Administrateur', variant: 'destructive' },
      moderator: { label: 'Modérateur', variant: 'default' },
      investor: { label: 'Investisseur', variant: 'secondary' },
      user: { label: 'Membre', variant: 'outline' },
    };

    const config = roleConfig[role] || roleConfig.user;

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'partial':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'partial':
        return 'Partielle';
      case 'pending':
        return 'En attente';
      case 'overdue':
        return 'En retard';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const getStatusVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'partial':
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const totalPaid = contributions.reduce((sum, c) => sum + Number(c.paid_amount), 0);

  const totalPending = contributions
    .filter(c => ['pending', 'partial', 'overdue'].includes(c.status))
    .reduce((sum, c) => sum + Math.max(Number(c.expected_amount) - Number(c.paid_amount), 0), 0);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/members')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <HomeIcon className="w-4 h-4 mr-2" />
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="w-24 h-24 md:w-32 md:h-32">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl md:text-3xl font-bold">
                  {getInitials(profile)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                    {profile.first_name || ''} {profile.last_name || 'Membre'}
                  </h1>
                  {getRoleBadge(memberRole)}
                </div>

                <div className="space-y-2 text-muted-foreground">
                  {profile.profession && (
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span>{profile.profession}</span>
                    </div>
                  )}
                  {profile.city && (
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.city}</span>
                    </div>
                  )}
                  {profile.created_at && (
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Membre depuis {format(new Date(profile.created_at), 'MMMM yyyy', { locale: fr })}</span>
                    </div>
                  )}
                </div>

                {isOwnProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => navigate('/profile/edit')}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Modifier mon profil
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Contact Information - Admin or Own Profile Only */}
          {(isAdmin || isOwnProfile) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations de contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.email && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{profile.email}</p>
                    </div>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Téléphone</p>
                      <p className="text-sm font-medium">{profile.phone}</p>
                    </div>
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <HomeIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Adresse</p>
                      <p className="text-sm font-medium">{profile.address}</p>
                    </div>
                  </div>
                )}
                {profile.birth_date && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date de naissance</p>
                      <p className="text-sm font-medium">
                        {format(new Date(profile.birth_date), 'd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                )}
                {!profile.email && !profile.phone && !profile.address && !profile.birth_date && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune information de contact renseignée
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contribution Summary - Admin or Own Profile Only */}
          {(isAdmin || isOwnProfile) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Résumé des cotisations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-500/10 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {totalPaid.toLocaleString('fr-FR')} FCFA
                    </p>
                    <p className="text-sm text-muted-foreground">Total payé</p>
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {totalPending.toLocaleString('fr-FR')} FCFA
                    </p>
                    <p className="text-sm text-muted-foreground">En attente</p>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {contributions.filter(c => c.status === 'paid').length} cotisation(s) payée(s) sur {contributions.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contributions History - Admin or Own Profile Only */}
        {(isAdmin || isOwnProfile) && contributions.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Historique des cotisations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contributions.map((contribution) => (
                  <div
                    key={contribution.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(contribution.status)}
                      <div>
                        <p className="font-medium">
                          {Number(contribution.expected_amount).toLocaleString('fr-FR')} FCFA
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Échéance: {format(new Date(contribution.due_date), 'd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusVariant(contribution.status)}>
                        {getStatusLabel(contribution.status)}
                      </Badge>
                      {Number(contribution.paid_amount) > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Payé: {Number(contribution.paid_amount).toLocaleString('fr-FR')} FCFA
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Message for non-admin viewing other profiles */}
        {!isAdmin && !isOwnProfile && (
          <Card className="mt-6">
            <CardContent className="py-8 text-center text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Les informations détaillées ne sont visibles que par les administrateurs.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default MemberProfile;
