import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Building2,
  Server,
  Copyright,
  ShieldAlert,
  Coins,
  Database,
  Cookie,
  Link2,
  Scale,
  Mail,
  ArrowLeft,
  Landmark,
} from "lucide-react";

const LAST_UPDATED = "11 juillet 2026";

const editorDetails = [
  { label: "Raison sociale", value: "TITANEX SARL" },
  { label: "Forme juridique", value: "Société à responsabilité limitée unipersonnelle" },
  { label: "Capital social", value: "1 000 000 FCFA" },
  { label: "Siège social", value: "New-Bell, face Total New-Bell, Douala, Cameroun" },
  { label: "RCCM", value: "CM-DLA-02-2026-B13-00145" },
  { label: "NIU (numéro de contribuable)", value: "M022618389246M" },
  { label: "Téléphone", value: "+237 691 849 494" },
  { label: "E-mail", value: "titanex.cm@gmail.com" },
  { label: "Responsable de publication", value: "KENNE Jean Pierre" },
  { label: "Site internet", value: "https://www.cercledestitans.com" },
];

const sections = [
  {
    icon: Server,
    title: "Hébergement",
    content: `La plateforme Cercle des Titans est hébergée sur l'infrastructure cloud de Vercel. Les données applicatives sont traitées au moyen des services techniques utilisés par la plateforme, notamment Supabase.`,
  },
  {
    icon: Copyright,
    title: "Propriété intellectuelle",
    content: `L'ensemble des éléments composant la plateforme Cercle des Titans — textes, éléments graphiques, logos, interfaces, fonctionnalités, bases de données, contenus, marques et signes distinctifs — appartient à TITANEX SARL ou est utilisé avec l'autorisation de ses titulaires.

Toute reproduction, copie, adaptation, modification, diffusion ou exploitation, totale ou partielle, de ces éléments, par quelque procédé que ce soit, est interdite sans l'autorisation écrite préalable de TITANEX SARL.`,
  },
  {
    icon: ShieldAlert,
    title: "Responsabilité",
    content: `TITANEX SARL s'efforce de fournir, sur la plateforme Cercle des Titans, des informations fiables et régulièrement mises à jour. Elle ne peut toutefois garantir l'absence totale d'erreurs, d'interruptions ou d'indisponibilités du service.

L'utilisateur reste responsable :
• de l'exactitude des informations qu'il fournit ;
• de la confidentialité de ses identifiants de connexion ;
• de l'utilisation faite de son compte ;
• du respect des règles de tontine et des engagements pris au sein de la communauté.`,
  },
  {
    icon: Coins,
    title: "Tontines et services financiers",
    content: `Cercle des Titans est une plateforme de gestion, de coordination et de suivi communautaire. Elle facilite l'organisation des tontines, le suivi des contributions et la communication entre les membres.

Les règles propres à chaque tontine sont présentées aux membres sur la plateforme. Avant de s'engager, chaque membre doit vérifier les conditions, montants, échéances et frais applicables à la tontine concernée.

La validation d'une contribution ou d'un paiement dépend des procédures prévues sur la plateforme. Cercle des Titans n'est pas une banque et ne fournit pas de services bancaires.`,
  },
  {
    icon: Database,
    title: "Données personnelles",
    content: `Les données collectées sur la plateforme sont utilisées pour gérer les comptes des membres, les tontines, les contributions, les paiements, les communications, les statistiques et la sécurité de la plateforme.

Les données des utilisateurs ne sont pas vendues à des tiers.

Chaque utilisateur peut demander l'accès à ses données, leur correction ou leur suppression, sous réserve des obligations légales et comptables applicables. Les demandes peuvent être adressées à titanex.cm@gmail.com.

Une politique de confidentialité distincte peut compléter les présentes mentions légales.`,
  },
  {
    icon: Cookie,
    title: "Cookies et statistiques",
    content: `La plateforme peut utiliser des cookies techniques, le stockage local du navigateur, des outils de mesure d'audience, des données de session ainsi que des statistiques anonymisées ou agrégées.

Ces outils servent au fonctionnement, à la sécurité et à l'amélioration continue de la plateforme.`,
  },
  {
    icon: Link2,
    title: "Liens externes",
    content: `Cercle des Titans peut proposer des liens vers WhatsApp, les réseaux sociaux ou d'autres services externes.

TITANEX SARL ne contrôle pas nécessairement les contenus, la disponibilité ou les politiques de confidentialité de ces services tiers et ne saurait en être tenue responsable.`,
  },
  {
    icon: Scale,
    title: "Droit applicable",
    content: `Les présentes mentions légales sont régies par le droit applicable en République du Cameroun. En cas de difficulté, les parties rechercheront prioritairement une solution amiable avant toute procédure contentieuse.`,
  },
];

export default function LegalNotices() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Mentions légales | Cercle des Titans</title>
        <meta
          name="description"
          content="Mentions légales de la plateforme Cercle des Titans, éditée par TITANEX SARL — Douala, Cameroun."
        />
      </Helmet>

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        {/* African Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30L30 0z' fill='%23D4AF37' fill-opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 mb-6">
              <Landmark className="w-10 h-10 text-gold" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                Mentions légales
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Informations légales relatives à la plateforme Cercle des Titans,
              éditée et exploitée par TITANEX SARL.
            </p>
            <p className="text-muted-foreground/60 text-sm mt-4">
              Dernière mise à jour : {LAST_UPDATED}
            </p>
          </div>
        </div>
      </section>

      {/* Éditeur du site */}
      <section className="pb-8">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 hover:border-gold/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-gold/20 group-hover:border-gold/40 transition-colors" />
              </div>

              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-gold" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl font-bold text-foreground mb-4 group-hover:text-gold transition-colors">
                    1. Éditeur du site
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Le site Cercle des Titans, accessible à l'adresse{" "}
                    <a href="https://www.cercledestitans.com" className="text-gold hover:text-gold-light transition-colors">
                      https://www.cercledestitans.com
                    </a>
                    , est édité et exploité par TITANEX SARL.
                  </p>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    {editorDetails.map((item) => (
                      <div key={item.label}>
                        <dt className="text-sm text-gold/80 font-medium">{item.label}</dt>
                        <dd className="text-muted-foreground text-sm mt-1 break-words">
                          {item.label === "E-mail" ? (
                            <a href="mailto:titanex.cm@gmail.com" className="hover:text-gold transition-colors">
                              {item.value}
                            </a>
                          ) : item.label === "Téléphone" ? (
                            <a href="tel:+237691849494" className="hover:text-gold transition-colors">
                              {item.value}
                            </a>
                          ) : item.label === "Site internet" ? (
                            <a href={item.value} className="hover:text-gold transition-colors">
                              {item.value}
                            </a>
                          ) : (
                            item.value
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {sections.map((section, index) => (
              <div
                key={section.title}
                className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 hover:border-gold/30 transition-all duration-300"
              >
                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                  <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-gold/20 group-hover:border-gold/40 transition-colors" />
                </div>

                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center">
                    <section.icon className="w-7 h-7 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-xl font-bold text-foreground mb-4 group-hover:text-gold transition-colors">
                      {index + 2}. {section.title}
                    </h2>
                    <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 mb-6">
              <Mail className="w-7 h-7 text-gold" />
            </div>
            <h2 className="font-display text-2xl font-bold text-gold mb-4">
              10. Contact
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              TITANEX SARL
              <br />
              New-Bell, face Total New-Bell
              <br />
              Douala, Cameroun
            </p>
            <div className="mt-4 space-y-1">
              <p>
                <a href="tel:+237691849494" className="text-gold hover:text-gold-light transition-colors">
                  +237 691 849 494
                </a>
              </p>
              <p>
                <a href="mailto:titanex.cm@gmail.com" className="text-gold hover:text-gold-light transition-colors">
                  titanex.cm@gmail.com
                </a>
              </p>
            </div>
            <Link
              to="/"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-6 py-3 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-background focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-background"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
