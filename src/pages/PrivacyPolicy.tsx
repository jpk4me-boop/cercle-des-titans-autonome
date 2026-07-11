import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Shield,
  Info,
  Building2,
  Database,
  Target,
  Scale,
  ListChecks,
  Users,
  Server,
  Banknote,
  Archive,
  Lock,
  UserCheck,
  Trash2,
  Cookie,
  Activity,
  Link2,
  Globe,
  HeartHandshake,
  RefreshCw,
  Mail,
  ArrowLeft,
} from "lucide-react";

const LAST_UPDATED = "11 juillet 2026";

const controllerDetails = [
  { label: "Raison sociale", value: "TITANEX SARL" },
  { label: "Forme juridique", value: "Société à responsabilité limitée unipersonnelle" },
  { label: "Capital social", value: "1 000 000 FCFA" },
  { label: "Siège social", value: "New-Bell, face Total New-Bell, Douala, Cameroun" },
  { label: "RCCM", value: "CM-DLA-02-2026-B13-00145" },
  { label: "NIU (numéro de contribuable)", value: "M022618389246M" },
  { label: "Téléphone", value: "+237 691 849 494" },
  { label: "E-mail (demandes relatives aux données)", value: "titanex.cm@gmail.com" },
  { label: "Responsable de publication", value: "KENNE Jean Pierre" },
  { label: "Site internet", value: "https://www.cercledestitans.com" },
];

const sections = [
  {
    icon: Database,
    title: "Données collectées",
    content: `Nous collectons uniquement les données nécessaires au fonctionnement de la plateforme.

Données d'identification et de compte :
• prénom et nom ;
• adresse e-mail ;
• numéro de téléphone ;
• adresse et ville déclarées ;
• date de naissance ;
• profession ;
• photo de profil (si vous en téléversez une) ;
• identifiant de compte et informations renseignées dans votre profil.

Données liées aux tontines :
• catégorie de tontine choisie et statut d'adhésion ;
• cycles, cotisations et échéances ;
• déclarations de paiement (montant, moyen de paiement, référence) ;
• validation ou rejet administratif des paiements ;
• historique des opérations et reçus générés.

Justificatifs :
• lien vers une preuve de paiement que vous fournissez lors d'une déclaration ;
• informations éventuellement visibles sur ces documents.
Nous vous invitons à ne transmettre dans vos justificatifs que les informations strictement nécessaires, et à masquer toute donnée sensible qui ne serait pas utile à la vérification.

Communications :
• messages officiels échangés entre l'administration et les membres ;
• réponses, statut de lecture et historique nécessaires au suivi des demandes.

Bourse Rentrée Titans (liste d'attente) :
• nom complet et téléphone ;
• e-mail et ville (facultatifs) ;
• formule d'intérêt et message éventuel ;
• consentement exprimé lors de la soumission et statut de suivi de la demande.

Formulaire public de contact / demande d'adhésion :
• nom, e-mail, téléphone et message décrivant vos objectifs.

Données techniques et statistiques :
• pages consultées (chemin de la page uniquement, sans paramètres) ;
• clics sur certains boutons identifiés dans le code ;
• source d'arrivée normalisée (par exemple : direct, WhatsApp, réseaux sociaux, moteur de recherche) ;
• identifiant de session aléatoire généré par votre navigateur ;
• signal de présence en ligne (membre ou visiteur) ;
• date et heure des événements.
Le dispositif de mesure interne de la plateforme n'enregistre ni adresse IP, ni signature détaillée du navigateur, ni adresse complète de provenance. Les prestataires techniques d'hébergement peuvent toutefois traiter des journaux techniques dans le cadre de leur propre fonctionnement et de la sécurité.`,
  },
  {
    icon: Target,
    title: "Finalités des traitements",
    content: `Vos données sont utilisées pour :
• créer et sécuriser les comptes ;
• gérer les profils des membres ;
• gérer les tontines, catégories et cycles ;
• suivre les cotisations et les paiements ;
• vérifier les justificatifs transmis ;
• générer et vérifier les reçus ;
• communiquer avec les membres ;
• gérer les demandes liées à la Bourse Rentrée Titans ;
• assurer l'administration et l'assistance ;
• prévenir les abus et la fraude ;
• établir des statistiques et améliorer la plateforme ;
• mesurer la fréquentation ;
• respecter les obligations légales, comptables ou de sécurité.`,
  },
  {
    icon: Scale,
    title: "Fondements des traitements",
    content: `Selon les cas, les traitements reposent sur :
• l'exécution du service que vous demandez (gestion du compte, des tontines, des paiements) ;
• votre consentement, lorsqu'il est requis ;
• l'intérêt légitime de TITANEX SARL à assurer la sécurité, l'administration et l'amélioration de la plateforme ;
• le respect des obligations légales et réglementaires applicables.`,
  },
  {
    icon: ListChecks,
    title: "Données obligatoires et facultatives",
    content: `Certaines informations sont nécessaires pour :
• créer un compte ;
• vérifier l'identité du membre ;
• accéder aux fonctionnalités de la plateforme ;
• rejoindre une catégorie de tontine ;
• déclarer ou contrôler un paiement.

L'absence de certaines données peut empêcher l'utilisation de la fonctionnalité correspondante. Les champs facultatifs sont signalés comme tels dans les formulaires.`,
  },
  {
    icon: Users,
    title: "Destinataires et accès",
    content: `Vos données peuvent être accessibles uniquement, selon les besoins :
• à TITANEX SARL ;
• aux administrateurs et personnes autorisées de la plateforme ;
• aux prestataires techniques nécessaires au fonctionnement du service ;
• aux autorités compétentes lorsqu'une obligation légale l'impose.

Les membres ordinaires n'ont pas accès aux informations privées des autres membres, sauf fonctionnalité explicitement prévue par la plateforme. Les accès administratifs sont limités par des rôles et des règles de sécurité au niveau de la base de données.`,
  },
  {
    icon: Server,
    title: "Prestataires techniques",
    content: `La plateforme s'appuie sur les services suivants :
• Supabase, pour l'authentification, la base de données, le stockage de fichiers et certaines fonctions techniques ;
• Vercel, pour l'hébergement et la diffusion de l'application.

Ces prestataires appliquent leurs propres mesures de sécurité et de confidentialité. Aucune donnée n'est vendue à des tiers.`,
  },
  {
    icon: Banknote,
    title: "Paiements",
    content: `Les informations liées aux cotisations et aux déclarations de paiement (montant, moyen de paiement, référence, justificatif éventuel) sont enregistrées afin de permettre leur suivi et leur validation par les administrateurs autorisés.

Cercle des Titans ne collecte pas de données de carte bancaire. Lorsque vous effectuez un paiement au moyen d'un service externe (par exemple un service de paiement mobile), ce service applique sa propre politique de confidentialité et ses propres conditions.`,
  },
  {
    icon: Archive,
    title: "Durée de conservation",
    content: `Les données sont conservées pendant la durée nécessaire :
• à la gestion de votre compte et des services que vous utilisez ;
• à la durée du cycle de tontine ou de la relation avec le membre ;
• au traitement d'une réclamation ;
• au respect des obligations comptables, administratives, fiscales ou légales ;
• à la sécurité et à la prévention des fraudes.

Lorsqu'elles ne sont plus nécessaires, certaines données peuvent être supprimées, anonymisées ou archivées.`,
  },
  {
    icon: Lock,
    title: "Sécurité",
    content: `TITANEX SARL met en œuvre des mesures de protection cohérentes avec la nature de la plateforme :
• contrôle des accès et authentification des comptes ;
• rôles administratifs limitant les accès aux seules personnes autorisées ;
• règles de sécurité appliquées au niveau de la base de données ;
• restrictions d'accès au stockage de fichiers ;
• communications chiffrées en HTTPS ;
• journalisation de certaines opérations sensibles ;
• sauvegardes et mesures techniques assurées par les prestataires.

Malgré les mesures mises en œuvre, aucun système informatique ne peut garantir une sécurité absolue.`,
  },
  {
    icon: UserCheck,
    title: "Vos droits",
    content: `Vous pouvez, dans les conditions prévues par la réglementation applicable :
• demander l'accès à vos données ;
• demander la rectification d'informations inexactes ;
• demander la suppression de vos données lorsque cela est légalement possible ;
• vous opposer à certains traitements ;
• demander une limitation du traitement lorsque cela est applicable ;
• retirer votre consentement lorsque le traitement repose sur celui-ci ;
• demander des informations sur l'utilisation de vos données.

Les demandes doivent être adressées à titanex.cm@gmail.com. TITANEX SARL peut demander des informations raisonnables afin de vérifier l'identité du demandeur avant de répondre.

Certaines données peuvent être conservées malgré une demande de suppression lorsqu'une obligation légale, comptable, de sécurité ou de preuve l'exige.`,
  },
  {
    icon: Trash2,
    title: "Suppression du compte",
    content: `La plateforme ne propose pas actuellement de bouton de suppression automatique du compte.

Pour demander la suppression de votre compte, adressez votre demande à titanex.cm@gmail.com depuis l'adresse e-mail associée à votre compte, ou en fournissant les éléments permettant de vous identifier. La demande sera traitée sous réserve des obligations légales, comptables et de preuve applicables, notamment lorsque des opérations de tontine sont en cours ou récentes.`,
  },
  {
    icon: Cookie,
    title: "Cookies, stockage local et application (PWA)",
    content: `La plateforme utilise le stockage de votre navigateur pour son fonctionnement :
• maintien de votre session de connexion ;
• mémorisation de votre préférence de langue ;
• mémorisation de votre adresse e-mail de connexion si vous choisissez l'option « se souvenir de moi » ;
• identifiant de session aléatoire utilisé pour la présence en ligne et les statistiques ;
• mémorisation de la source d'arrivée pendant la session de navigation.

En tant qu'application installable (PWA), la plateforme utilise également un service worker et un cache local afin d'accélérer le chargement et de permettre un fonctionnement partiel hors connexion.

La plateforme n'utilise pas de cookies publicitaires ni de traceurs de tiers à des fins commerciales. Vous pouvez effacer les données de site depuis les réglages de votre navigateur ; certaines fonctionnalités (comme la connexion) devront alors être réinitialisées.`,
  },
  {
    icon: Activity,
    title: "Présence et statistiques",
    content: `La plateforme utilise des signaux temporaires pour afficher ou calculer :
• le nombre de membres en ligne ;
• le nombre de visiteurs en ligne ;
• la fréquentation du site ;
• les pages consultées ;
• les clics sur certains boutons ;
• les conversions ;
• les sources d'arrivée.

Ces mesures reposent sur un identifiant de session aléatoire généré par votre navigateur et sur des données limitées (chemin de page, type d'événement, source normalisée, horodatage). Pour les membres connectés, ces événements peuvent être rattachés au compte à des fins d'administration et de sécurité. Ces informations sont destinées à l'administration, à la sécurité et à l'amélioration de la plateforme ; les tableaux de bord internes exploitent des données agrégées.`,
  },
  {
    icon: Link2,
    title: "Liens et services externes",
    content: `La plateforme peut proposer des liens vers WhatsApp, les réseaux sociaux ou d'autres services externes, ainsi que des échanges effectués au moyen de services de paiement externes.

Ces services disposent de leurs propres politiques de confidentialité et de leurs propres conditions. TITANEX SARL ne contrôle pas leurs traitements indépendants et ne saurait en être tenue responsable.`,
  },
  {
    icon: Globe,
    title: "Transferts et infrastructure internationale",
    content: `Certains prestataires techniques peuvent traiter ou héberger des données au moyen d'infrastructures situées dans différents pays. TITANEX SARL sélectionne ses prestataires en tenant compte de leurs engagements de sécurité et de confidentialité.`,
  },
  {
    icon: HeartHandshake,
    title: "Mineurs",
    content: `Lorsqu'une demande concerne un enfant ou un mineur — par exemple dans le cadre de la Bourse Rentrée Titans —, elle doit être effectuée par son parent, son représentant légal ou avec son autorisation lorsque la loi l'exige. Seules les données nécessaires au traitement de la demande doivent être communiquées.`,
  },
  {
    icon: RefreshCw,
    title: "Modification de la présente politique",
    content: `La présente politique peut évoluer en fonction des fonctionnalités de la plateforme, des prestataires utilisés, des obligations légales et des pratiques de traitement, notamment à mesure de l'adoption des textes d'application de la réglementation camerounaise sur la protection des données à caractère personnel.

La date de dernière mise à jour figure en haut de cette page. Nous vous invitons à la consulter régulièrement.`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Politique de confidentialité | Cercle des Titans</title>
        <meta
          name="description"
          content="Politique de confidentialité de la plateforme Cercle des Titans : données collectées, finalités, sécurité et droits des utilisateurs. Responsable du traitement : TITANEX SARL."
        />
        <link rel="canonical" href="/privacy-policy" />
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
              <Shield className="w-10 h-10 text-gold" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                Politique de confidentialité
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Comment la plateforme Cercle des Titans collecte, utilise et protège
              vos données personnelles.
            </p>
            <p className="text-muted-foreground/60 text-sm mt-4">
              Dernière mise à jour : {LAST_UPDATED}
            </p>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="pb-8">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 hover:border-gold/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-gold/20 group-hover:border-gold/40 transition-colors" />
              </div>

              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center">
                  <Info className="w-7 h-7 text-gold" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl font-bold text-foreground mb-4 group-hover:text-gold transition-colors">
                    1. Introduction
                  </h2>
                  <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {`TITANEX SARL accorde une grande importance à la confidentialité des membres et visiteurs de la plateforme Cercle des Titans. La présente politique explique :
• quelles données sont collectées ;
• pourquoi elles sont utilisées ;
• comment elles sont protégées ;
• avec qui elles peuvent être traitées ;
• quels sont vos droits et comment les exercer.

Elle s'inscrit dans le cadre de la réglementation camerounaise applicable, notamment la loi n° 2024/017 du 23 décembre 2024 relative à la protection des données à caractère personnel au Cameroun, et sera mise à jour selon l'évolution des textes d'application et des obligations réglementaires.`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Responsable du traitement */}
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
                    2. Responsable du traitement
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Les données collectées sur la plateforme Cercle des Titans sont
                    traitées sous la responsabilité de TITANEX SARL.
                  </p>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    {controllerDetails.map((item) => (
                      <div key={item.label}>
                        <dt className="text-sm text-gold/80 font-medium">{item.label}</dt>
                        <dd className="text-muted-foreground text-sm mt-1 break-words">
                          {item.label.startsWith("E-mail") ? (
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
                      {index + 3}. {section.title}
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
              20. Contact
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Pour toute question concernant cette politique ou vos données personnelles :
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
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
            <p className="text-muted-foreground text-sm mt-6">
              Voir aussi nos{" "}
              <Link to="/mentions-legales" className="text-gold hover:text-gold-light transition-colors underline underline-offset-4">
                mentions légales
              </Link>
              .
            </p>
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
