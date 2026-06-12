import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Crown, Star, Diamond, Award, Medal, Shield, ArrowLeft, Users, TrendingUp, Calendar, Wallet, CreditCard, Smartphone, Globe, Building2 } from "lucide-react";
import GainsSimulator from "@/components/GainsSimulator";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface PaymentMethod {
  name: string;
  icon: React.ReactNode;
  region: "africa" | "international" | "both";
  description: string;
}

interface CategoryData {
  name: string;
  amount: string;
  amountNumber: number;
  tagline: string;
  description: string;
  benefits: string[];
  icon: React.ReactNode;
  color: string;
  features: {
    title: string;
    description: string;
    icon: React.ReactNode;
  }[];
  eligibility: string[];
  frequency: string;
  minDuration: string;
  cycleDuration: number;
  groupSize: number;
  paymentMethods: PaymentMethod[];
}

// Payment methods available by category tier
const basicPaymentMethods: PaymentMethod[] = [
  { name: "Orange Money", icon: <Smartphone className="w-5 h-5" />, region: "africa", description: "Paiement automatique via Orange Money" },
  { name: "MTN Mobile Money", icon: <Smartphone className="w-5 h-5" />, region: "africa", description: "Prélèvement automatique MTN MoMo" },
  { name: "Wave", icon: <Smartphone className="w-5 h-5" />, region: "africa", description: "Transfert automatique Wave" },
];

const standardPaymentMethods: PaymentMethod[] = [
  ...basicPaymentMethods,
  { name: "Moov Money", icon: <Smartphone className="w-5 h-5" />, region: "africa", description: "Paiement mobile Moov Africa" },
  { name: "Free Money", icon: <Smartphone className="w-5 h-5" />, region: "africa", description: "Prélèvement Free Money" },
];

const premiumPaymentMethods: PaymentMethod[] = [
  ...standardPaymentMethods,
  { name: "Carte bancaire", icon: <CreditCard className="w-5 h-5" />, region: "both", description: "Visa, Mastercard - Prélèvement automatique" },
  { name: "Virement SEPA", icon: <Building2 className="w-5 h-5" />, region: "international", description: "Virement bancaire européen automatisé" },
];

const elitePaymentMethods: PaymentMethod[] = [
  ...premiumPaymentMethods,
  { name: "PayPal", icon: <Globe className="w-5 h-5" />, region: "international", description: "Paiement récurrent PayPal" },
  { name: "Stripe", icon: <CreditCard className="w-5 h-5" />, region: "international", description: "Prélèvement sécurisé Stripe" },
  { name: "Virement Swift", icon: <Building2 className="w-5 h-5" />, region: "international", description: "Transfert bancaire international" },
];

const categoriesData: Record<string, CategoryData> = {
  bronze: {
    name: "Bronze",
    amount: "5 000 FCFA",
    amountNumber: 5000,
    tagline: "Commencer à partir de rien",
    description: "La catégorie Bronze est idéale pour ceux qui souhaitent découvrir le système de tontine et développer une discipline financière solide. C'est le premier pas vers l'indépendance financière.",
    benefits: [
      "Tontine structurée avec un groupe de confiance",
      "Discipline financière renforcée",
      "Intégration dans une communauté solidaire",
      "Accès aux opportunités de base",
      "Possibilité de micro-financement",
      "Accompagnement personnalisé pour débutants"
    ],
    icon: <Shield className="w-12 h-12" />,
    color: "from-amber-600 to-amber-800",
    features: [
      { title: "Groupe de 12 membres", description: "Intégrez un groupe restreint pour une meilleure cohésion", icon: <Users className="w-6 h-6" /> },
      { title: "Cycle de 12 semaines", description: "Un cycle court pour voir rapidement les résultats", icon: <Calendar className="w-6 h-6" /> },
      { title: "Gain de 60 000 FCFA", description: "Recevez la cagnotte complète à votre tour", icon: <Wallet className="w-6 h-6" /> },
      { title: "Progression possible", description: "Évoluez vers les catégories supérieures", icon: <TrendingUp className="w-6 h-6" /> }
    ],
    eligibility: ["Être majeur (+18 ans)", "Disposer d'un revenu régulier", "S'engager sur la durée du cycle", "Fournir une pièce d'identité valide"],
    frequency: "Hebdomadaire",
    minDuration: "12 semaines",
    cycleDuration: 12,
    groupSize: 12,
    paymentMethods: basicPaymentMethods
  },
  silver: {
    name: "Silver",
    amount: "10 000 FCFA",
    amountNumber: 10000,
    tagline: "Le premier vrai levier de progression",
    description: "La catégorie Silver représente le premier vrai levier de progression financière. Elle offre un équilibre parfait entre accessibilité et rendement, idéale pour ceux qui veulent accélérer leur épargne.",
    benefits: [
      "Tontine renforcée avec des gains plus importants",
      "Bonus amélioré à chaque cycle",
      "Accès prioritaire à certaines opportunités",
      "Réseau actif et dynamique",
      "Possibilité de financement de projet",
      "Mentorat par des membres expérimentés"
    ],
    icon: <Medal className="w-12 h-12" />,
    color: "from-slate-400 to-slate-600",
    features: [
      { title: "Groupe de 12 membres", description: "Un groupe légèrement plus grand pour plus de dynamisme", icon: <Users className="w-6 h-6" /> },
      { title: "Cycle de 12 semaines", description: "Un trimestre pour optimiser votre épargne", icon: <Calendar className="w-6 h-6" /> },
      { title: "Gain de 120 000 FCFA", description: "Une cagnotte conséquente pour vos projets", icon: <Wallet className="w-6 h-6" /> },
      { title: "Bonus de fidélité", description: "Récompenses pour les membres réguliers", icon: <TrendingUp className="w-6 h-6" /> }
    ],
    eligibility: ["Être majeur (+18 ans)", "Justifier d'un revenu stable", "Avoir une bonne réputation financière", "S'engager sur la durée complète"],
    frequency: "Hebdomadaire",
    minDuration: "12 semaines",
    cycleDuration: 12,
    groupSize: 12,
    paymentMethods: standardPaymentMethods
  },
  gold: {
    name: "Gold",
    amount: "25 000 FCFA",
    amountNumber: 25000,
    tagline: "Transformer l'ambition en action",
    description: "La catégorie Gold est conçue pour les membres ambitieux qui souhaitent transformer leurs rêves en réalité. Avec des gains substantiels et un réseau influent, c'est le tremplin vers le succès.",
    benefits: [
      "Gains significativement plus importants",
      "Bonus renforcé à chaque participation",
      "Éligibilité élevée au fonds de financement",
      "Reconnaissance communautaire",
      "Accès aux événements exclusifs",
      "Priorité sur les nouveaux projets"
    ],
    icon: <Award className="w-12 h-12" />,
    color: "from-yellow-500 to-yellow-700",
    features: [
      { title: "Groupe de 12 membres", description: "Une communauté élargie de professionnels", icon: <Users className="w-6 h-6" /> },
      { title: "Cycle de 12 semaines", description: "Plus de temps pour des gains optimisés", icon: <Calendar className="w-6 h-6" /> },
      { title: "Gain de 300 000 FCFA", description: "Un capital important pour vos investissements", icon: <Wallet className="w-6 h-6" /> },
      { title: "Accès financement", description: "Éligibilité aux prêts du fonds commun", icon: <TrendingUp className="w-6 h-6" /> }
    ],
    eligibility: ["Être majeur (+18 ans)", "Avoir complété au moins 1 cycle Silver", "Démontrer une stabilité financière", "Recommandation d'un membre existant"],
    frequency: "Hebdomadaire",
    minDuration: "12 semaines",
    cycleDuration: 12,
    groupSize: 12,
    paymentMethods: standardPaymentMethods
  },
  diamond: {
    name: "Diamond",
    amount: "50 000 FCFA",
    amountNumber: 50000,
    tagline: "Accélérer sa réussite financière",
    description: "La catégorie Diamond est réservée aux membres qui veulent accélérer significativement leur réussite financière. C'est un investissement conséquent qui ouvre des portes exceptionnelles.",
    benefits: [
      "Tontine à fort impact financier",
      "Bonus élevé et privilèges exclusifs",
      "Priorité absolue au financement",
      "Position stratégique dans la communauté",
      "Accès aux partenariats commerciaux",
      "Conseils financiers personnalisés"
    ],
    icon: <Diamond className="w-12 h-12" />,
    color: "from-cyan-400 to-blue-600",
    features: [
      { title: "Groupe de 12 membres", description: "Un réseau d'affaires puissant", icon: <Users className="w-6 h-6" /> },
      { title: "Cycle de 12 semaines", description: "Un engagement sur près de 3 mois", icon: <Calendar className="w-6 h-6" /> },
      { title: "Gain de 600 000 FCFA", description: "Un capital pour concrétiser vos ambitions", icon: <Wallet className="w-6 h-6" /> },
      { title: "Réseau VIP", description: "Connexions avec des entrepreneurs établis", icon: <TrendingUp className="w-6 h-6" /> }
    ],
    eligibility: ["Être majeur (+18 ans)", "Avoir complété au moins 2 cycles Gold", "Présenter un projet d'investissement", "Entretien avec le comité"],
    frequency: "Hebdomadaire",
    minDuration: "12 semaines",
    cycleDuration: 12,
    groupSize: 12,
    paymentMethods: premiumPaymentMethods
  },
  platinium: {
    name: "Platinium",
    amount: "100 000 FCFA",
    amountNumber: 100000,
    tagline: "Jouer dans la cour des grands",
    description: "La catégorie Platinium est l'antichambre de l'excellence. Réservée aux membres confirmés, elle offre des avantages exceptionnels et un accès privilégié aux plus grandes opportunités.",
    benefits: [
      "Accès privilégié aux gros financements",
      "Bonus premium sur chaque cycle",
      "Accompagnement stratégique personnalisé",
      "Visibilité renforcée dans le réseau",
      "Invitation aux summits exclusifs",
      "Participation aux décisions communautaires"
    ],
    icon: <Star className="w-12 h-12" />,
    color: "from-slate-300 to-slate-500",
    features: [
      { title: "Groupe de 12 membres", description: "L'élite des entrepreneurs du Cercle", icon: <Users className="w-6 h-6" /> },
      { title: "Cycle de 12 semaines", description: "Un trimestre d'engagement premium", icon: <Calendar className="w-6 h-6" /> },
      { title: "Gain de 1 200 000 FCFA", description: "Un capital majeur pour des projets d'envergure", icon: <Wallet className="w-6 h-6" /> },
      { title: "Mentorat exclusif", description: "Accompagnement par des membres Prestige", icon: <TrendingUp className="w-6 h-6" /> }
    ],
    eligibility: ["Avoir complété au moins 2 cycles Diamond", "Présenter un business plan solide", "Validation par le conseil d'administration", "Parrainage par un membre Platinium ou Prestige"],
    frequency: "Hebdomadaire",
    minDuration: "12 semaines",
    cycleDuration: 12,
    groupSize: 12,
    paymentMethods: elitePaymentMethods
  },
  prestige: {
    name: "Prestige",
    amount: "200 000 FCFA",
    amountNumber: 200000,
    tagline: "Le sommet du Cercle des Titans",
    description: "La catégorie Prestige représente le sommet absolu du Cercle des Titans. C'est l'aboutissement d'un parcours d'excellence, réservé aux leaders qui façonnent l'avenir de la communauté.",
    benefits: [
      "Accès maximal aux fonds de financement",
      "Bonus exclusifs et parts sur les bénéfices",
      "Réseau d'élite et connexions internationales",
      "Traitement prioritaire de tous les projets",
      "Siège au conseil consultatif",
      "Représentation officielle du Cercle"
    ],
    icon: <Crown className="w-12 h-12" />,
    color: "from-primary to-primary/70",
    features: [
      { title: "Groupe de 12 membres", description: "Les titans de l'économie locale", icon: <Users className="w-6 h-6" /> },
      { title: "Cycle de 12 semaines", description: "Un trimestre d'engagement d'élite", icon: <Calendar className="w-6 h-6" /> },
      { title: "Gain de 2 400 000 FCFA", description: "Un capital majeur pour des investissements stratégiques", icon: <Wallet className="w-6 h-6" /> },
      { title: "Statut de fondateur", description: "Participation aux décisions stratégiques", icon: <TrendingUp className="w-6 h-6" /> }
    ],
    eligibility: ["Avoir complété au moins 2 cycles Platinium", "Être recommandé par 3 membres Prestige", "Entretien avec le comité exécutif", "Engagement sur 2 cycles minimum"],
    frequency: "Hebdomadaire",
    minDuration: "12 semaines",
    cycleDuration: 12,
    groupSize: 12,
    paymentMethods: elitePaymentMethods
  }
};

const CategoryDetail = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  
  const category = categoryName ? categoriesData[categoryName.toLowerCase()] : null;

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Catégorie non trouvée</h1>
            <Button onClick={() => navigate("/#categories")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux catégories
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className={`pt-32 pb-20 bg-gradient-to-br ${category.color} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="container mx-auto px-4 relative z-10">
          <Link 
            to="/#categories" 
            className="inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux catégories
          </Link>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm text-white">
              {category.icon}
            </div>
            <div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
                Catégorie {category.name}
              </h1>
              <p className="text-xl text-white/90">{category.tagline}</p>
            </div>
          </div>
          
          <div className="mt-8 flex flex-wrap gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
              <span className="text-white/70 text-sm">Cotisation</span>
              <p className="text-white font-bold text-2xl">{category.amount}/semaine</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
              <span className="text-white/70 text-sm">Fréquence</span>
              <p className="text-white font-bold text-2xl">{category.frequency}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
              <span className="text-white/70 text-sm">Durée minimum</span>
              <p className="text-white font-bold text-2xl">{category.minDuration}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
              À propos de cette catégorie
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {category.description}
            </p>
          </div>
        </div>
      </section>

      {/* Gains Simulator */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <GainsSimulator
              weeklyAmount={category.amountNumber}
              cycleDuration={category.cycleDuration}
              groupSize={category.groupSize}
              categoryName={category.name}
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-10 text-center">
            Ce que vous obtenez
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {category.features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all"
              >
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 text-primary">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits & Eligibility */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Benefits */}
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8">
                Avantages inclus
              </h2>
              <ul className="space-y-4">
                {category.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className="p-1 bg-primary/20 rounded-full text-primary flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Eligibility */}
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8">
                Conditions d'éligibilité
              </h2>
              <ul className="space-y-4">
                {category.eligibility.map((item, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-foreground pt-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Methods Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 text-center">
            Moyens de paiement automatique
          </h2>
          <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            Configurez un prélèvement automatique pour ne jamais manquer une cotisation
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Africa Payment Methods */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Smartphone className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Paiements en Afrique
                </h3>
              </div>
              <ul className="space-y-4">
                {category.paymentMethods
                  .filter(pm => pm.region === "africa" || pm.region === "both")
                  .map((method, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                        {method.icon}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{method.name}</p>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>

            {/* International Payment Methods */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Paiements internationaux
                </h3>
              </div>
              {category.paymentMethods.filter(pm => pm.region === "international" || pm.region === "both").length > 0 ? (
                <ul className="space-y-4">
                  {category.paymentMethods
                    .filter(pm => pm.region === "international" || pm.region === "both")
                    .map((method, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                          {method.icon}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{method.name}</p>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    Les paiements internationaux sont disponibles à partir de la catégorie Diamond
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Prêt à rejoindre la catégorie {category.name} ?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Commencez votre parcours vers l'indépendance financière dès aujourd'hui. 
            Notre équipe vous accompagne à chaque étape.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate(`/auth?category=${encodeURIComponent(category.name)}&mode=signup`)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Rejoindre maintenant
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate("/#contact")}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Nous contacter
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CategoryDetail;
