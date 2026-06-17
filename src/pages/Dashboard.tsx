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
  CreditCard,
  Clock,
  CheckCircle2,
  Loader2,
  Home,
  Pencil,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Users
} from 'lucide-react';
import MemberTontinePanel from '@/components/member/MemberTontinePanel';
import { fetchMemberContributions } from '@/services/tontineService';
import type { TontineContribution } from '@/types/tontine';

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
  diamond: { name: 'Diamond', color: 'text-blue-400', amount: '50 000 FCFA/sem.' },
  platinum: { name: 'Platinium', color: 'text-cyan-400', amount: '100 000 FCFA/sem.' },
  prestige: { name: 'Prestige', color: 'text-purple-500', amount: '200 000 FCFA/sem.' },
};

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contributions, setContributions] = useState<TontineContribution[]>([]);
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

        // Fetch contributions from the tontine module
        // (source of truth: tontine_contributions, not the legacy table)
        const contributionsData = await fetchMemberContributions(user.id);
        setContributions(contributionsData);
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

  const paidContributions = contributions.filter(c => c.status === 'paid');
  const upcomingContributions = contributions.filter(c =>
    ['pending', 'partial', 'overdue'].includes(c.status)
  );
  const totalPaid = contributions.reduce((sum, c) => sum + Number(c.paid_amount), 0);

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
                <p className="text-2xl font-bold text-foreground">{totalPaid.toLocaleString('fr-FR')} FCFA</p>
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

        <div className="grid grid-cols-1 gap-8">
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
                      onClick={() =>
                        document.getElementById('tontine')?.scrollIntoView({ behavior: 'smooth' })
                      }
                    >
                      Accéder à mon cycle
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

        </div>

        {/* Tontine module: categories, contributions and payment declaration */}
        <div id="tontine" className="mt-8 scroll-mt-24">
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
