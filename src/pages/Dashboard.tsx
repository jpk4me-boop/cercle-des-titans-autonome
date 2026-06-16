import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  User, 
  LogOut, 
  Calendar, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Home,
  Pencil,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import MemberTontinePanel from '@/components/member/MemberTontinePanel';

interface Profile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  profession: string | null;
  recommended_category: string | null;
}

const categoryInfo: Record<string, { name: string; color: string; amount: string }> = {
  bronze: { name: 'Bronze', color: 'text-amber-700', amount: '5 000 FCFA/sem.' },
  silver: { name: 'Silver', color: 'text-slate-400', amount: '10 000 FCFA/sem.' },
  gold: { name: 'Gold', color: 'text-yellow-500', amount: '25 000 FCFA/sem.' },
  platinum: { name: 'Platinum', color: 'text-cyan-400', amount: '50 000 FCFA/sem.' },
  diamond: { name: 'Diamond', color: 'text-blue-400', amount: '100 000 FCFA/sem.' },
  prestige: { name: 'Prestige', color: 'text-purple-500', amount: '200 000 FCFA/sem.' },
};

interface Contribution {
  id: string;
  amount: number;
  status: string;
  due_date: string;
  paid_date: string | null;
  payment_method: string | null;
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData);
        }

        // Fetch contributions
        const { data: contributionsData } = await supabase
          .from('contributions')
          .select('*')
          .eq('user_id', user.id)
          .order('due_date', { ascending: false });

        if (contributionsData) {
          setContributions(contributionsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSaveCategory = async () => {
    if (!user || !selectedCategory) return;

    setIsSavingCategory(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ recommended_category: selectedCategory })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, recommended_category: selectedCategory } : null);
      setIsEditingCategory(false);
      toast.success('Catégorie mise à jour !');
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const openCategoryEditor = () => {
    setSelectedCategory(profile?.recommended_category || null);
    setIsEditingCategory(true);
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const upcomingContributions = contributions.filter(c => c.status === 'pending');
  const paidContributions = contributions.filter(c => c.status === 'paid');
  const totalPaid = paidContributions.reduce((sum, c) => sum + Number(c.amount), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-600">
            <CheckCircle2 className="w-3 h-3" /> Payé
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-600">
            <Clock className="w-3 h-3" /> En attente
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-600">
            <AlertCircle className="w-3 h-3" /> En retard
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-xl font-bold text-primary">Cercle des Titans</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/members')}>
              <Users className="w-4 h-4 mr-2" />
              Membres
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/messages')}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2" />
              Accueil
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">
            Bienvenue, {profile?.first_name || 'Membre'} 👋
          </h2>
          <p className="text-muted-foreground">
            Voici un aperçu de votre activité dans la tontine
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total cotisé</p>
                <p className="text-2xl font-bold text-foreground">{totalPaid.toLocaleString('fr-FR')} €</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cotisations payées</p>
                <p className="text-2xl font-bold text-foreground">{paidContributions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Échéances à venir</p>
                <p className="text-2xl font-bold text-foreground">{upcomingContributions.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Mon Profil</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/profile/edit')}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Nom complet</p>
                  <p className="text-foreground">{profile?.first_name} {profile?.last_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                  <p className="text-foreground">{profile?.email || user?.email}</p>
                </div>
                {profile?.phone && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Téléphone</p>
                    <p className="text-foreground">{profile.phone}</p>
                  </div>
                )}
                {profile?.profession && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Profession</p>
                    <p className="text-foreground">{profile.profession}</p>
                  </div>
                )}
                {profile?.city && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Ville</p>
                    <p className="text-foreground">{profile.city}</p>
                  </div>
                )}
              </div>

              {/* Recommended Category */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Catégorie recommandée</p>
                  </div>
                  <Dialog open={isEditingCategory} onOpenChange={setIsEditingCategory}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={openCategoryEditor}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Modifier ma catégorie</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <RadioGroup
                          value={selectedCategory || ''}
                          onValueChange={setSelectedCategory}
                          className="space-y-3"
                        >
                          {Object.entries(categoryInfo).map(([key, info]) => (
                            <div
                              key={key}
                              className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all hover:border-primary/50 ${
                                selectedCategory === key ? 'border-primary bg-primary/5' : 'border-border'
                              }`}
                              onClick={() => setSelectedCategory(key)}
                            >
                              <RadioGroupItem value={key} id={key} />
                              <Label htmlFor={key} className="flex-1 cursor-pointer">
                                <span className={`font-semibold ${info.color}`}>{info.name}</span>
                                <span className="text-sm text-muted-foreground ml-2">({info.amount})</span>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                        <div className="flex gap-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingCategory(false)}
                            className="flex-1"
                          >
                            Annuler
                          </Button>
                          <Button
                            onClick={handleSaveCategory}
                            disabled={!selectedCategory || isSavingCategory}
                            className="flex-1"
                          >
                            {isSavingCategory ? 'Sauvegarde...' : 'Sauvegarder'}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Ou{' '}
                          <button
                            onClick={() => {
                              setIsEditingCategory(false);
                              navigate('/categories/comparatif');
                            }}
                            className="text-primary hover:underline"
                          >
                            refaire le questionnaire de recommandation
                          </button>
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {profile?.recommended_category && categoryInfo[profile.recommended_category] ? (
                  <div className="bg-primary/5 rounded-lg p-4">
                    <p className={`text-xl font-bold ${categoryInfo[profile.recommended_category].color}`}>
                      {categoryInfo[profile.recommended_category].name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {categoryInfo[profile.recommended_category].amount}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto mt-2 text-primary"
                      onClick={() => navigate(`/categorie/${profile.recommended_category}`)}
                    >
                      Voir les détails
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Aucune catégorie sélectionnée</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/categories/comparatif')}
                    >
                      Découvrir ma catégorie idéale
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contributions Section */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Historique des cotisations</h3>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/historique-cotisations')}>
                  Voir tout
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {contributions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune cotisation enregistrée</p>
                  <p className="text-sm">Vos cotisations apparaîtront ici</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</th>
                        <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Montant</th>
                        <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Statut</th>
                        <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Méthode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contributions.map((contribution) => (
                        <tr key={contribution.id} className="border-b border-border/50 last:border-0">
                          <td className="py-3 px-2 text-sm">
                            {format(new Date(contribution.due_date), 'dd MMM yyyy', { locale: fr })}
                          </td>
                          <td className="py-3 px-2 text-sm font-medium">
                            {Number(contribution.amount).toLocaleString('fr-FR')} €
                          </td>
                          <td className="py-3 px-2">
                            {getStatusBadge(contribution.status)}
                          </td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">
                            {contribution.payment_method || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tontine module: categories, contributions and payment declaration */}
        <div className="mt-8">
          <div className="mb-4">
            <h3 className="text-xl font-display font-bold text-foreground">Tontine</h3>
            <p className="text-sm text-muted-foreground">
              Vos catégories, cotisations journalières et déclarations de paiement
            </p>
          </div>
          <MemberTontinePanel />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
