import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FinancingRequestForm from "@/components/FinancingRequestForm";
import { 
  Flame, 
  ArrowRight, 
  Target, 
  Users, 
  Shield, 
  Lightbulb, 
  Rocket,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  FileText,
  Home
} from "lucide-react";

const categories = [
  {
    name: "Bronze",
    color: "bg-amber-700",
    cotisation: "5 000 FCFA",
    financement: "500 000 FCFA",
    icon: "🟤",
    description: "La Catégorie Bronze est la porte d'entrée idéale pour toute personne qui démarre avec des moyens modestes mais une vision claire.",
    avantages: [
      "Cotisation accessible",
      "Discipline d'épargne collective",
      "Bonus de participation",
      "Accès à un fonds de financement de projet pouvant aller jusqu'à 500 000 FCFA"
    ],
    ideal: [
      "Petit commerce",
      "Vente en ligne",
      "Activité génératrice de revenus",
      "Redémarrage ou relance d'un projet bloqué"
    ]
  },
  {
    name: "Silver",
    color: "bg-slate-400",
    cotisation: "10 000 FCFA",
    financement: "1 000 000 FCFA",
    icon: "⚪",
    description: "La Catégorie Silver permet de passer à un niveau supérieur. Ici, on ne parle plus seulement de survie financière, mais de croissance réelle.",
    avantages: [
      "Cotisation maîtrisée",
      "Bonus renforcé",
      "Accès à un fonds de financement pouvant atteindre 1 000 000 FCFA"
    ],
    ideal: [
      "Développement d'un commerce existant",
      "Achat de stock important",
      "Projet agricole ou artisanal",
      "Activité stable avec besoin de capital"
    ]
  },
  {
    name: "Gold",
    color: "bg-yellow-500",
    cotisation: "25 000 FCFA",
    financement: "2 000 000 FCFA",
    icon: "🟡",
    description: "La Catégorie Gold s'adresse aux membres qui ont déjà une vision structurée et souhaitent accélérer leur réussite.",
    avantages: [
      "Cotisation stratégique",
      "Bonus plus élevé",
      "Accès à un fonds de financement de projet jusqu'à 2 000 000 FCFA"
    ],
    ideal: [
      "Entreprises en croissance",
      "Projets commerciaux d'envergure",
      "Expansion d'activité",
      "Investissements à moyen terme"
    ]
  },
  {
    name: "Diamond",
    color: "bg-blue-500",
    cotisation: "50 000 FCFA",
    financement: "3 000 000 FCFA",
    icon: "🔷",
    description: "La Catégorie Diamond est réservée à ceux qui pensent grand et agissent avec méthode.",
    avantages: [
      "Cotisation premium",
      "Bonus significatif",
      "Accès à un fonds de financement pouvant atteindre 3 000 000 FCFA"
    ],
    ideal: [
      "Structuration d'entreprise",
      "Lancement de projets ambitieux",
      "Investissements à fort potentiel",
      "Création d'emplois"
    ]
  },
  {
    name: "Platinium",
    color: "bg-slate-800",
    cotisation: "100 000 FCFA",
    financement: "5 000 000 FCFA",
    icon: "⚫",
    description: "La Catégorie Platinium représente le sommet du Cercle des Titans. Ici, on parle de leaders, d'investisseurs et de bâtisseurs.",
    avantages: [
      "Cotisation élite",
      "Bonus maximal",
      "Accès à un fonds de financement pouvant aller jusqu'à 5 000 000 FCFA"
    ],
    ideal: [
      "Grands projets structurés",
      "Investissements majeurs",
      "Expansion nationale ou internationale",
      "Création de véritables entreprises solides"
    ]
  }
];

const keyPoints = [
  "Chaque membre peut s'inscrire avec 2, 3 ou 4 noms pour multiplier ses opportunités et ses financements",
  "Le Fonds de financement n'est pas un prêt bancaire, mais un mécanisme communautaire intelligent",
  "Plus ta catégorie est élevée, plus ton potentiel de financement augmente",
  "Tout est basé sur la discipline, la transparence et la solidarité"
];

const faqItems = [
  {
    question: "Comment fonctionne le fonds de financement ?",
    answer: "Le fonds de financement est alimenté par les cotisations des membres du Cercle. Chaque membre cotise selon sa catégorie, et ces fonds sont redistribués sous forme de financement à ceux qui en ont besoin pour leurs projets. C'est un système de solidarité financière basé sur la confiance et la discipline collective."
  },
  {
    question: "Quelles sont les conditions pour obtenir un financement ?",
    answer: "Pour être éligible au financement, vous devez être membre actif du Cercle des Titans, avoir cotisé régulièrement pendant au moins un cycle complet, et présenter un projet viable. Le montant accessible dépend de votre catégorie d'adhésion."
  },
  {
    question: "Combien de temps faut-il pour recevoir le financement ?",
    answer: "Une fois votre demande validée par le comité, le financement est généralement disponible sous 48 à 72 heures. La rapidité du processus est l'un des avantages majeurs par rapport aux banques traditionnelles."
  },
  {
    question: "Y a-t-il des intérêts à payer sur le financement ?",
    answer: "Non, le fonds de financement du Cercle des Titans fonctionne sans intérêt. C'est un mécanisme communautaire solidaire, pas un prêt bancaire. Vous remboursez uniquement le montant emprunté selon un échéancier convenu."
  },
  {
    question: "Puis-je m'inscrire dans plusieurs catégories ?",
    answer: "Oui, chaque membre peut s'inscrire avec 2, 3 ou 4 noms différents pour multiplier ses opportunités et ses financements potentiels. Cela vous permet d'accéder à des montants plus importants tout en diversifiant vos placements."
  },
  {
    question: "Que se passe-t-il si je ne peux pas rembourser à temps ?",
    answer: "Le Cercle des Titans privilégie le dialogue et la solidarité. En cas de difficulté, contactez immédiatement le comité pour discuter d'un réaménagement de votre échéancier. Des solutions flexibles sont toujours envisageables pour les membres de bonne foi."
  },
  {
    question: "Quels types de projets peuvent être financés ?",
    answer: "Tous types de projets peuvent être financés : commerce, agriculture, artisanat, services, immobilier, etc. L'important est de présenter un projet réaliste et viable. Le comité vous accompagne dans la structuration de votre demande."
  },
  {
    question: "Comment changer de catégorie pour augmenter mon potentiel de financement ?",
    answer: "Vous pouvez évoluer vers une catégorie supérieure à tout moment en ajustant votre cotisation. Cette évolution prend effet au cycle suivant et vous donne immédiatement accès aux avantages de la nouvelle catégorie."
  }
];

const FondsFinancement = () => {
  return (
    <>
      <Helmet>
        <title>Fonds de Financement de Projet | Cercle des Titans</title>
        <meta 
          name="description" 
          content="Découvrez le Fonds de Financement de Projet du Cercle des Titans. Accédez à des financements de 500 000 à 5 000 000 FCFA sans banque, sans intérêts. Tontine solidaire pour réaliser vos projets." 
        />
        <meta name="keywords" content="financement projet, tontine, cercle des titans, épargne collective, prêt sans intérêt, FCFA" />
        <link rel="canonical" href="/financement/fonds-de-financement" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="pt-24 pb-16">
          {/* Breadcrumb */}
          <div className="px-6 py-4 max-w-6xl mx-auto">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-gold transition-colors">
                      <Home className="w-4 h-4" />
                      Accueil
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <a href="/#financement" className="text-muted-foreground hover:text-gold transition-colors">
                      Financement
                    </a>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-gold font-medium">
                    Fonds de financement
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Hero Section */}
          <section className="px-6 py-12 bg-gradient-to-b from-gold/10 to-background">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Flame className="w-8 h-8 text-gold" />
                <Badge className="bg-gold/20 text-gold border-gold/30 text-sm px-4 py-1">
                  Le Cercle des Titans
                </Badge>
              </div>
              
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-forest mb-6 leading-tight">
                Fonds de Financement de Projet
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Le Fonds de Financement de Projet est l'un des piliers les plus puissants du Cercle des Titans.
                Il a été conçu pour transformer une simple cotisation collective en un véritable levier de réalisation de projets personnels et professionnels.
              </p>
            </div>
          </section>

          {/* Introduction */}
          <section className="px-6 py-12">
            <div className="max-w-4xl mx-auto">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
                <p className="text-lg text-foreground leading-relaxed mb-6">
                  Grâce à la discipline de la tontine, à la force du collectif et à l'organisation interne du Cercle, 
                  chaque membre peut accéder, selon sa catégorie, à un financement structuré, <strong>sans passer par les banques</strong>, 
                  <strong> sans dossiers interminables</strong>, et <strong>sans intérêts étouffants</strong>.
                </p>
                <div className="flex items-center gap-3 text-gold font-semibold text-lg">
                  <ArrowRight className="w-6 h-6" />
                  <span>Ici, l'argent circule au service des membres.</span>
                </div>
              </div>
            </div>
          </section>

          {/* Categories Grid */}
          <section className="px-6 py-12">
            <div className="max-w-6xl mx-auto">
              <h2 className="font-display text-3xl md:text-4xl text-forest text-center mb-12">
                Les Catégories de Financement
              </h2>
              
              <div className="grid gap-8">
                {categories.map((cat, index) => (
                  <div 
                    key={cat.name}
                    className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div className={`${cat.color} text-white p-6`}>
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{cat.icon}</span>
                          <div>
                            <h3 className="font-display text-2xl md:text-3xl">
                              Catégorie {cat.name}
                            </h3>
                            <p className="text-white/80 text-lg">{cat.cotisation}</p>
                          </div>
                        </div>
                        <Badge className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
                          Jusqu'à {cat.financement}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-6 md:p-8">
                      <p className="text-foreground text-lg mb-6 leading-relaxed">
                        {cat.description}
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="flex items-center gap-2 font-semibold text-forest mb-4">
                            <CheckCircle2 className="w-5 h-5 text-gold" />
                            Avantages
                          </h4>
                          <ul className="space-y-2">
                            {cat.avantages.map((avantage, i) => (
                              <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                <Sparkles className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                                {avantage}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="flex items-center gap-2 font-semibold text-forest mb-4">
                            <Target className="w-5 h-5 text-gold" />
                            Idéal pour
                          </h4>
                          <ul className="space-y-2">
                            {cat.ideal.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                <ArrowRight className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Key Points */}
          <section className="px-6 py-16 bg-forest/5">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-8">
                <Lightbulb className="w-8 h-8 text-gold" />
                <h2 className="font-display text-3xl md:text-4xl text-forest">
                  À Retenir Absolument
                </h2>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {keyPoints.map((point, index) => (
                  <div 
                    key={index}
                    className="bg-card border border-border rounded-xl p-6 shadow-md hover:border-gold/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-gold font-bold">{index + 1}</span>
                      </div>
                      <p className="text-foreground leading-relaxed">{point}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Conclusion */}
          <section className="px-6 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <Rocket className="w-12 h-12 text-gold mx-auto mb-6" />
              <h2 className="font-display text-3xl md:text-4xl text-forest mb-6">
                Conclusion
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-4">
                Le Fonds de Financement de Projet du Cercle des Titans n'est pas une promesse vide.
              </p>
              <p className="text-xl md:text-2xl text-forest font-semibold mb-8">
                C'est un outil concret, pensé pour ceux qui veulent passer à l'action, bâtir, investir et réussir.
              </p>
              <p className="text-lg text-gold font-medium">
                Ne reste pas spectateur. Choisis ta catégorie. Intègre le Cercle. Et finance ton avenir.
              </p>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="px-6 py-16 bg-card/50">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-8">
                <HelpCircle className="w-8 h-8 text-gold" />
                <h2 className="font-display text-3xl md:text-4xl text-forest">
                  Questions Fréquentes
                </h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-4">
                {faqItems.map((item, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
                    className="bg-background border border-border rounded-xl px-6 data-[state=open]:border-gold/30 transition-colors"
                  >
                    <AccordionTrigger className="text-left text-foreground hover:text-gold py-5 text-base md:text-lg font-medium">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          {/* CTA Section */}
          <section className="px-6 py-16 bg-gradient-to-t from-gold/10 to-background">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-display text-2xl md:text-3xl text-forest mb-8">
                Prêt à financer votre projet ?
              </h2>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <FinancingRequestForm 
                  trigger={
                    <Button 
                      size="lg" 
                      className="bg-gold hover:bg-gold/90 text-forest font-semibold px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Demander un financement
                    </Button>
                  }
                />
                
                <Link to="/#categories">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="px-10 py-6 text-lg rounded-full border-gold/50 text-gold hover:bg-gold/10"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Voir les catégories
                  </Button>
                </Link>
              </div>
              
              <p className="text-muted-foreground mt-6 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                Inscription rapide — assistance disponible en cas de besoin.
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default FondsFinancement;