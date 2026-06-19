import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Loader2, Save, User, Settings, Globe, Bell } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Profile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  birth_date: string | null;
  profession: string | null;
  email_notifications: boolean;
  reminder_notifications: boolean;
  marketing_notifications: boolean;
}

const ProfileEdit = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [errors, setErrors] = useState<Partial<Record<keyof Profile, string>>>({});
  const [profile, setProfile] = useState<Profile>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    birth_date: '',
    profession: '',
    email_notifications: true,
    reminder_notifications: true,
    marketing_notifications: false
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setProfile({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            address: data.address || '',
            city: data.city || '',
            birth_date: data.birth_date || '',
            profession: data.profession || '',
            email_notifications: data.email_notifications ?? true,
            reminder_notifications: data.reminder_notifications ?? true,
            marketing_notifications: data.marketing_notifications ?? false
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleChange = (field: keyof Profile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    // Clear the field error as soon as the user edits it.
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // All visible profile fields are mandatory. Returns true when the profile is
  // valid; otherwise populates `errors` with a clear message per empty field.
  const validateProfile = (): boolean => {
    const requiredFields: [keyof Profile, string][] = [
      ['first_name', 'Le prénom est obligatoire.'],
      ['last_name', 'Le nom est obligatoire.'],
      ['email', "L'email est obligatoire."],
      ['phone', 'Le téléphone est obligatoire.'],
      ['birth_date', 'La date de naissance est obligatoire.'],
      ['profession', 'La profession est obligatoire.'],
      ['address', "L'adresse est obligatoire."],
      ['city', 'La ville est obligatoire.'],
    ];

    const next: Partial<Record<keyof Profile, string>> = {};
    for (const [field, message] of requiredFields) {
      if (!String(profile[field] ?? '').trim()) {
        next[field] = message;
      }
    }

    const email = String(profile.email ?? '').trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = 'Adresse email invalide.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateProfile()) {
      setActiveTab('profile');
      toast({
        variant: "destructive",
        title: "Champs obligatoires manquants",
        description: "Veuillez remplir tous les champs du profil avant d'enregistrer."
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name || null,
          last_name: profile.last_name || null,
          email: profile.email || null,
          phone: profile.phone || null,
          address: profile.address || null,
          city: profile.city || null,
          birth_date: profile.birth_date || null,
          profession: profile.profession || null,
          email_notifications: profile.email_notifications,
          reminder_notifications: profile.reminder_notifications,
          marketing_notifications: profile.marketing_notifications
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès."
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le profil."
      });
    } finally {
      setSaving(false);
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
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
          <h1 className="font-display text-xl font-bold text-primary">Profil & Paramètres</h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="bg-card border border-border rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Informations personnelles</h2>
                  <p className="text-sm text-muted-foreground">Complétez votre profil membre</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Prénom <span className="text-destructive">*</span></Label>
                    <Input
                      id="first_name"
                      value={profile.first_name || ''}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      placeholder="Jean"
                      required
                      aria-required
                      aria-invalid={Boolean(errors.first_name)}
                    />
                    {errors.first_name && <p className="text-sm text-destructive">{errors.first_name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nom <span className="text-destructive">*</span></Label>
                    <Input
                      id="last_name"
                      value={profile.last_name || ''}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      placeholder="Dupont"
                      required
                      aria-required
                      aria-invalid={Boolean(errors.last_name)}
                    />
                    {errors.last_name && <p className="text-sm text-destructive">{errors.last_name}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="votre@email.com"
                    required
                    aria-required
                    aria-invalid={Boolean(errors.email)}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone <span className="text-destructive">*</span></Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    required
                    aria-required
                    aria-invalid={Boolean(errors.phone)}
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">Date de naissance <span className="text-destructive">*</span></Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={profile.birth_date || ''}
                    onChange={(e) => handleChange('birth_date', e.target.value)}
                    required
                    aria-required
                    aria-invalid={Boolean(errors.birth_date)}
                  />
                  {errors.birth_date && <p className="text-sm text-destructive">{errors.birth_date}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profession">Profession <span className="text-destructive">*</span></Label>
                  <Input
                    id="profession"
                    value={profile.profession || ''}
                    onChange={(e) => handleChange('profession', e.target.value)}
                    placeholder="Ingénieur, Médecin, Entrepreneur..."
                    required
                    aria-required
                    aria-invalid={Boolean(errors.profession)}
                  />
                  {errors.profession && <p className="text-sm text-destructive">{errors.profession}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse <span className="text-destructive">*</span></Label>
                  <Input
                    id="address"
                    value={profile.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="123 Rue de la Paix"
                    required
                    aria-required
                    aria-invalid={Boolean(errors.address)}
                  />
                  {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ville <span className="text-destructive">*</span></Label>
                  <Input
                    id="city"
                    value={profile.city || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Paris"
                    required
                    aria-required
                    aria-invalid={Boolean(errors.city)}
                  />
                  {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Enregistrer
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Language Preferences */}
            <div className="bg-card border border-border rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Langue</h2>
                  <p className="text-sm text-muted-foreground">Choisissez la langue de l'interface</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇫🇷</span>
                    <div>
                      <p className="font-medium text-foreground">Français</p>
                      <p className="text-sm text-muted-foreground">French</p>
                    </div>
                  </div>
                  <Button
                    variant={language === 'fr' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage('fr')}
                  >
                    {language === 'fr' ? 'Actif' : 'Sélectionner'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇬🇧</span>
                    <div>
                      <p className="font-medium text-foreground">English</p>
                      <p className="text-sm text-muted-foreground">Anglais</p>
                    </div>
                  </div>
                  <Button
                    variant={language === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage('en')}
                  >
                    {language === 'en' ? 'Active' : 'Select'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-card border border-border rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Notifications</h2>
                  <p className="text-sm text-muted-foreground">Gérez vos préférences de notification</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Notifications par email</p>
                    <p className="text-sm text-muted-foreground">Recevez des mises à jour importantes par email</p>
                  </div>
                  <Switch
                    checked={profile.email_notifications}
                    onCheckedChange={(checked) => setProfile(prev => ({ ...prev, email_notifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Rappels de cotisation</p>
                    <p className="text-sm text-muted-foreground">Recevez des rappels avant les échéances</p>
                  </div>
                  <Switch
                    checked={profile.reminder_notifications}
                    onCheckedChange={(checked) => setProfile(prev => ({ ...prev, reminder_notifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Communications marketing</p>
                    <p className="text-sm text-muted-foreground">Recevez des offres et actualités du Cercle</p>
                  </div>
                  <Switch
                    checked={profile.marketing_notifications}
                    onCheckedChange={(checked) => setProfile(prev => ({ ...prev, marketing_notifications: checked }))}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button onClick={handleSubmit} disabled={saving} className="flex-1">
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProfileEdit;
