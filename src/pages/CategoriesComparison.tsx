import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X, Crown, Star, Diamond, Award, Medal, Shield, ArrowLeft, ArrowRight, Filter, RotateCcw, Sparkles, TrendingUp } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryRecommender from "@/components/CategoryRecommender";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Calculate value score based on features-to-price ratio
const calculateValueScore = (cat: CategoryInfo): number => {
  const featureCount = Object.values(cat.features).filter(Boolean).length;
  // Normalize: features per 10k FCFA invested
  return (featureCount / (cat.amount / 10000)) + (cat.totalGain / cat.amount);
};

interface CategoryInfo {
  name: string;
  slug: string;
  amount: number;
  amountDisplay: string;
  cycleDuration: number;
  groupSize: number;
  totalGain: number;
  totalGainDisplay: string;
  icon: React.ReactNode;
  color: string;
  features: {
    microFinancement: boolean;
    bonusFidelite: boolean;
    accesFinancement: boolean;
    reseauVIP: boolean;
    mentorat: boolean;
    conseilConsultatif: boolean;
  };
}

const categories: CategoryInfo[] = [
  {
    name: "Bronze",
    slug: "bronze",
    amount: 5000,
    amountDisplay: "5 000 FCFA",
    cycleDuration: 12,
    groupSize: 12,
    totalGain: 60000,
    totalGainDisplay: "60 000 FCFA",
    icon: <Shield className="w-5 h-5" />,
    color: "bg-amber-600",
    features: {
      microFinancement: true,
      bonusFidelite: false,
      accesFinancement: false,
      reseauVIP: false,
      mentorat: false,
      conseilConsultatif: false,
    },
  },
  {
    name: "Silver",
    slug: "silver",
    amount: 10000,
    amountDisplay: "10 000 FCFA",
    cycleDuration: 12,
    groupSize: 12,
    totalGain: 120000,
    totalGainDisplay: "120 000 FCFA",
    icon: <Medal className="w-5 h-5" />,
    color: "bg-slate-500",
    features: {
      microFinancement: true,
      bonusFidelite: true,
      accesFinancement: false,
      reseauVIP: false,
      mentorat: true,
      conseilConsultatif: false,
    },
  },
  {
    name: "Gold",
    slug: "gold",
    amount: 25000,
    amountDisplay: "25 000 FCFA",
    cycleDuration: 12,
    groupSize: 12,
    totalGain: 300000,
    totalGainDisplay: "300 000 FCFA",
    icon: <Award className="w-5 h-5" />,
    color: "bg-yellow-500",
    features: {
      microFinancement: true,
      bonusFidelite: true,
      accesFinancement: true,
      reseauVIP: false,
      mentorat: true,
      conseilConsultatif: false,
    },
  },
  {
    name: "Diamond",
    slug: "diamond",
    amount: 50000,
    amountDisplay: "50 000 FCFA",
    cycleDuration: 12,
    groupSize: 12,
    totalGain: 600000,
    totalGainDisplay: "600 000 FCFA",
    icon: <Diamond className="w-5 h-5" />,
    color: "bg-cyan-500",
    features: {
      microFinancement: true,
      bonusFidelite: true,
      accesFinancement: true,
      reseauVIP: true,
      mentorat: true,
      conseilConsultatif: false,
    },
  },
  {
    name: "Platinium",
    slug: "platinium",
    amount: 100000,
    amountDisplay: "100 000 FCFA",
    cycleDuration: 12,
    groupSize: 12,
    totalGain: 1200000,
    totalGainDisplay: "1 200 000 FCFA",
    icon: <Star className="w-5 h-5" />,
    color: "bg-slate-400",
    features: {
      microFinancement: true,
      bonusFidelite: true,
      accesFinancement: true,
      reseauVIP: true,
      mentorat: true,
      conseilConsultatif: true,
    },
  },
  {
    name: "Prestige",
    slug: "prestige",
    amount: 200000,
    amountDisplay: "200 000 FCFA",
    cycleDuration: 12,
    groupSize: 12,
    totalGain: 2400000,
    totalGainDisplay: "2 400 000 FCFA",
    icon: <Crown className="w-5 h-5" />,
    color: "bg-primary",
    features: {
      microFinancement: true,
      bonusFidelite: true,
      accesFinancement: true,
      reseauVIP: true,
      mentorat: true,
      conseilConsultatif: true,
    },
  },
];

const featureLabels = [
  { key: "microFinancement", label: "Micro-financement" },
  { key: "bonusFidelite", label: "Bonus fidélité" },
  { key: "accesFinancement", label: "Accès financement" },
  { key: "reseauVIP", label: "Réseau VIP" },
  { key: "mentorat", label: "Mentorat" },
  { key: "conseilConsultatif", label: "Conseil consultatif" },
];

const formatNumber = (num: number) => {
  return num.toLocaleString("fr-FR") + " FCFA";
};

const CategoriesComparison = () => {
  const navigate = useNavigate();
  
  // Filter states
  const [budgetRange, setBudgetRange] = useState<number[]>([5000, 200000]);
  const [gainRange, setGainRange] = useState<number[]>([50000, 2400000]);
  
  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter(
      (cat) =>
        cat.amount >= budgetRange[0] &&
        cat.amount <= budgetRange[1] &&
        cat.totalGain >= gainRange[0] &&
        cat.totalGain <= gainRange[1]
    );
  }, [budgetRange, gainRange]);

  // Find best value category based on features-to-price ratio
  const bestValueSlug = useMemo(() => {
    if (filteredCategories.length === 0) return null;
    let bestScore = -1;
    let bestSlug = "";
    filteredCategories.forEach((cat) => {
      const score = calculateValueScore(cat);
      if (score > bestScore) {
        bestScore = score;
        bestSlug = cat.slug;
      }
    });
    return bestSlug;
  }, [filteredCategories]);

  const resetFilters = () => {
    setBudgetRange([5000, 200000]);
    setGainRange([50000, 2400000]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <Link
            to="/#categories"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Link>

          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Comparatif des Catégories
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Comparez toutes nos catégories de cotisation en un coup d'œil et choisissez celle qui correspond le mieux à vos objectifs financiers.
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl font-semibold text-foreground">Filtrer les catégories</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Réinitialiser
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Budget Filter */}
            <div className="space-y-4">
              <Label className="text-foreground font-medium">
                Budget hebdomadaire: {formatNumber(budgetRange[0])} - {formatNumber(budgetRange[1])}
              </Label>
              <Slider
                value={budgetRange}
                onValueChange={setBudgetRange}
                min={5000}
                max={200000}
                step={5000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 000 FCFA</span>
                <span>200 000 FCFA</span>
              </div>
            </div>

            {/* Gain Filter */}
            <div className="space-y-4">
              <Label className="text-foreground font-medium">
                Gain souhaité: {formatNumber(gainRange[0])} - {formatNumber(gainRange[1])}
              </Label>
              <Slider
                value={gainRange}
                onValueChange={setGainRange}
                min={50000}
                max={2400000}
                step={50000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>50 000 FCFA</span>
                <span>2 400 000 FCFA</span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {filteredCategories.length} catégorie{filteredCategories.length > 1 ? "s" : ""} correspond{filteredCategories.length > 1 ? "ent" : ""} à vos critères
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">Aucune catégorie ne correspond à vos critères.</p>
              <Button variant="outline" onClick={resetFilters}>
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[180px] font-semibold text-foreground">
                      Caractéristiques
                    </TableHead>
                    {filteredCategories.map((cat) => (
                      <TableHead key={cat.slug} className="text-center relative">
                        <div className="flex flex-col items-center gap-2">
                          {cat.slug === bestValueSlug && (
                            <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-600 hover:bg-green-600 text-white text-xs px-2 py-0.5 whitespace-nowrap">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Meilleur rapport
                            </Badge>
                          )}
                          <div className={`p-2 rounded-lg ${cat.color} text-white ${cat.slug === bestValueSlug ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}>
                            {cat.icon}
                          </div>
                          <span className="font-semibold text-foreground">{cat.name}</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Cotisation */}
                  <TableRow>
                    <TableCell className="font-medium text-foreground">
                      Cotisation / semaine
                    </TableCell>
                    {filteredCategories.map((cat) => (
                      <TableCell key={cat.slug} className="text-center font-semibold text-primary">
                        {cat.amountDisplay}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Durée du cycle */}
                  <TableRow>
                    <TableCell className="font-medium text-foreground">
                      Durée du cycle
                    </TableCell>
                    {filteredCategories.map((cat) => (
                      <TableCell key={cat.slug} className="text-center text-muted-foreground">
                        {cat.cycleDuration} semaines
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Nombre de membres */}
                  <TableRow>
                    <TableCell className="font-medium text-foreground">
                      Membres par groupe
                    </TableCell>
                    {filteredCategories.map((cat) => (
                      <TableCell key={cat.slug} className="text-center text-muted-foreground">
                        {cat.groupSize} membres
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Gain total */}
                  <TableRow className="bg-primary/5">
                    <TableCell className="font-medium text-foreground">
                      Gain par cycle
                    </TableCell>
                    {filteredCategories.map((cat) => (
                      <TableCell key={cat.slug} className="text-center font-bold text-primary">
                        {cat.totalGainDisplay}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Features */}
                  {featureLabels.map((feature) => (
                    <TableRow key={feature.key}>
                      <TableCell className="font-medium text-foreground">
                        {feature.label}
                      </TableCell>
                      {filteredCategories.map((cat) => (
                        <TableCell key={cat.slug} className="text-center">
                          {cat.features[feature.key as keyof typeof cat.features] ? (
                            <Check className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                  {/* Action row */}
                  <TableRow>
                    <TableCell className="font-medium text-foreground">
                      Action
                    </TableCell>
                    {filteredCategories.map((cat) => (
                      <TableCell key={cat.slug} className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/categorie/${cat.slug}`)}
                          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          Détails
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </section>

      {/* Cards for mobile */}
      <section className="py-8 lg:hidden">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center">
            Vue mobile
          </h2>
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Aucune catégorie ne correspond à vos critères.</p>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Réinitialiser
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.slug}
                  className={`bg-card border rounded-xl p-5 hover:shadow-lg transition-shadow relative ${cat.slug === bestValueSlug ? 'border-green-500 ring-2 ring-green-500/20' : 'border-border'}`}
                >
                  {cat.slug === bestValueSlug && (
                    <Badge className="absolute -top-2 right-3 bg-green-600 hover:bg-green-600 text-white text-xs px-2 py-0.5">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Meilleur rapport
                    </Badge>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${cat.color} text-white`}>
                      {cat.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{cat.name}</h3>
                      <p className="text-sm text-primary font-medium">{cat.amountDisplay}/sem.</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Durée</span>
                      <span className="text-foreground">{cat.cycleDuration} semaines</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Membres</span>
                      <span className="text-foreground">{cat.groupSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gain</span>
                      <span className="font-bold text-primary">{cat.totalGainDisplay}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/categorie/${cat.slug}`)}
                  >
                    Voir les détails
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recommendation Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Recommandation personnalisée</span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                Vous ne savez pas quelle catégorie choisir ?
              </h2>
              <p className="text-muted-foreground">
                Répondez à quelques questions pour découvrir la catégorie idéale pour vous.
              </p>
            </div>
            <CategoryRecommender />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
            Prêt à rejoindre le Cercle des Titans ?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Choisissez votre catégorie et commencez votre parcours vers l'indépendance financière.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth?mode=signup")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            S'inscrire maintenant
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CategoriesComparison;
