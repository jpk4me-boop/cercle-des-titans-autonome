import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ScrollText,
  FileCheck,
  Building2,
  LayoutGrid,
  KeyRound,
  UserPlus,
  Lock,
  ClipboardCheck,
  Coins,
  HandshakeIcon,
  Banknote,
  FileText,
  Receipt,
  Percent,
  AlertTriangle,
  PiggyBank,
  GraduationCap,
  Bell,
  Ban,
  Upload,
  ShieldCheck,
  UserX,
  Server,
  RefreshCw,
  Link2,
  Database,
  Copyright,
  Scale,
  MessageCircle,
  History,
  Gavel,
  Mail,
  ArrowLeft,
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

interface Section {
  icon: typeof FileCheck;
  title: string;
  content: string;
  after?: JSX.Element;
}

const sections: Section[] = [
  {
    icon: LayoutGrid,
    title: "Description de la plateforme",
    content: `Cercle des Titans est une plateforme numérique de gestion, de coordination et de suivi communautaire. Elle permet notamment :
• la gestion des membres et de leurs profils ;
• l'organisation et le suivi des tontines par catégories et par cycles ;
• le suivi des contributions et des échéances ;
• la déclaration et le contrôle des paiements ;
• la communication officielle entre l'administration et les membres ;
• la présentation de programmes ou services complémentaires (fonds d'appui, Bourse Rentrée Titans, etc.).

Cercle des Titans n'est ni une banque, ni un établissement de microfinance, ni un établissement de crédit, ni un assureur, ni un service public. La plateforme ne garantit automatiquement aucun financement.`,
  },
  {
    icon: KeyRound,
    title: "Conditions d'accès",
    content: `Pour utiliser la plateforme, l'utilisateur doit :
• fournir des informations exactes lors de son inscription ;
• disposer de la capacité juridique nécessaire pour utiliser le service et souscrire les engagements correspondants ;
• utiliser une adresse e-mail ou un moyen d'identification valide ;
• respecter les présentes conditions ;
• ne pas créer de compte frauduleux ni usurper l'identité d'un tiers.

La participation aux tontines est en outre soumise aux conditions d'éligibilité affichées pour chaque catégorie, qui exigent notamment d'être majeur.`,
  },
  {
    icon: UserPlus,
    title: "Création et gestion du compte",
    content: `La création d'un compte s'effectue depuis la page d'inscription de la plateforme. L'utilisateur renseigne ensuite son profil membre : identité, coordonnées, date de naissance, profession, adresse et ville, ainsi qu'une photo de profil.

L'utilisateur peut mettre à jour ses informations depuis son espace personnel et utiliser la procédure de récupération de mot de passe en cas d'oubli.

Certaines fonctionnalités sensibles — notamment rejoindre une catégorie de tontine ou déclarer un paiement — peuvent être limitées tant que le profil n'est pas complété, en particulier tant qu'aucune photo de profil n'a été ajoutée.`,
  },
  {
    icon: Lock,
    title: "Sécurité du compte",
    content: `L'utilisateur est responsable :
• de la confidentialité de ses identifiants de connexion ;
• des opérations effectuées depuis son compte ;
• du signalement rapide de tout accès non autorisé à titanex.cm@gmail.com ;
• de l'utilisation d'informations de connexion suffisamment sécurisées.

TITANEX SARL peut prendre des mesures de protection lorsqu'une activité suspecte est détectée sur un compte. Malgré les mesures mises en œuvre, aucun système informatique ne peut garantir une sécurité absolue.`,
  },
  {
    icon: ClipboardCheck,
    title: "Exactitude des informations",
    content: `L'utilisateur s'engage à fournir des informations exactes, complètes, licites, actuelles et non trompeuses, et à les maintenir à jour.

Lorsque des données sont manifestement inexactes ou incomplètes, TITANEX SARL peut demander leur correction ou limiter certaines fonctionnalités jusqu'à leur régularisation.`,
  },
  {
    icon: Coins,
    title: "Fonctionnement des tontines",
    content: `Les tontines proposées sur la plateforme sont organisées selon :
• une catégorie, avec ses conditions d'éligibilité ;
• un montant de cycle ;
• des frais éventuels affichés ;
• un cycle avec ses échéances de cotisation ;
• des règles de participation ;
• des procédures de déclaration et de validation des paiements.

Les montants, frais, échéances et conditions applicables sont ceux affichés sur la plateforme au moment de l'engagement du membre. Avant de rejoindre une tontine, le membre doit consulter et comprendre l'ensemble des informations affichées pour la catégorie concernée.`,
  },
  {
    icon: HandshakeIcon,
    title: "Engagement du membre dans une tontine",
    content: `En rejoignant une catégorie de tontine, le membre s'engage à respecter :
• les échéances de cotisation du cycle ;
• les montants applicables ;
• les règles du cycle en cours ;
• les procédures de déclaration de paiement ;
• les justificatifs demandés ;
• les décisions administratives conformes aux règles affichées.

Le sérieux et la régularité de chaque membre conditionnent le bon fonctionnement de la tontine pour l'ensemble de la communauté.`,
  },
  {
    icon: Banknote,
    title: "Contributions et paiements",
    content: `Le suivi des contributions fonctionne de la manière suivante :
• des cotisations sont générées selon le cycle et la catégorie du membre ;
• le membre déclare son paiement en indiquant le montant, le moyen de paiement utilisé, une référence éventuelle et, le cas échéant, un justificatif ;
• la déclaration est enregistrée avec un statut en attente ;
• un administrateur autorisé examine la déclaration puis la valide ou la rejette.

Une déclaration effectuée par un membre ne constitue pas à elle seule une validation définitive. Une contribution n'est considérée comme validée qu'à l'issue de la procédure de contrôle prévue dans l'application.`,
  },
  {
    icon: FileText,
    title: "Justificatifs et preuves de paiement",
    content: `Le membre est responsable de l'authenticité des justificatifs qu'il transmet. Les documents doivent être lisibles et correspondre à l'opération déclarée.

Tout faux document, document falsifié ou justificatif réutilisé de manière trompeuse est strictement interdit.

Les administrateurs autorisés peuvent examiner les justificatifs, et TITANEX SARL peut demander un complément d'information avant de valider une opération.

Lorsque cela est possible, le membre doit masquer toute information bancaire ou personnelle non nécessaire à la vérification avant l'envoi d'un justificatif.`,
  },
  {
    icon: Receipt,
    title: "Reçus",
    content: `Les reçus générés par la plateforme :
• correspondent aux informations enregistrées et validées dans l'application ;
• peuvent comporter un identifiant ou un mécanisme de vérification d'authenticité ;
• ne remplacent pas nécessairement les documents délivrés par un prestataire de paiement externe ;
• ne doivent en aucun cas être falsifiés, modifiés ou réutilisés de manière trompeuse.`,
  },
  {
    icon: Percent,
    title: "Frais",
    content: `Les frais éventuels applicables aux services de la plateforme :
• sont affichés avant l'engagement ou l'opération concernée ;
• peuvent dépendre de la catégorie de tontine ou du service utilisé ;
• doivent être consultés par le membre avant tout engagement.

Les frais applicables sont ceux affichés sur la plateforme au moment de l'opération.`,
  },
  {
    icon: AlertTriangle,
    title: "Retards, absences de paiement et incidents",
    content: `En cas de retard ou d'absence de paiement :
• la contribution concernée reste en attente ou est clôturée comme impayée à l'issue de son échéance ;
• l'opération n'est pas validée ;
• l'administration peut adresser un rappel au membre ;
• la situation peut faire l'objet d'un examen administratif ;
• l'accès à certaines fonctionnalités peut être limité ;
• le statut du compte peut être modifié dans les conditions décrites à la section « Suspension et fermeture du compte ».

Les incidents répétés ou graves peuvent être pris en compte dans les décisions administratives relatives à la participation aux cycles.`,
  },
  {
    icon: PiggyBank,
    title: "Financement et appui financier",
    content: `La plateforme permet de soumettre des demandes de financement ou d'appui communautaire au moyen des formulaires prévus à cet effet.

La soumission d'un formulaire :
• ne constitue pas une promesse d'accord ;
• ne crée aucun droit automatique au financement ;
• fait l'objet d'un examen administratif ;
• peut nécessiter des informations ou justificatifs complémentaires.

Aucun financement n'est garanti par la simple soumission d'une demande. Les conditions propres à chaque programme sont présentées sur la plateforme ou communiquées lors de l'examen du dossier.`,
  },
  {
    icon: GraduationCap,
    title: "Bourse Rentrée Titans",
    content: `L'inscription à la liste d'attente de la Bourse Rentrée Titans ne garantit pas l'attribution d'une bourse.

Les critères, le nombre de places, les montants et les conditions du programme peuvent être communiqués séparément. TITANEX SARL peut contacter les demandeurs pour compléter leur dossier.

Seules les informations nécessaires au traitement de la demande doivent être transmises. Lorsqu'une demande concerne un mineur, elle doit être introduite par son parent, son représentant légal ou avec l'autorisation requise.`,
  },
  {
    icon: Bell,
    title: "Communications officielles",
    content: `La plateforme peut transmettre aux membres :
• des messages administratifs ;
• des notifications ;
• des rappels d'échéances ;
• des informations liées aux tontines et aux cycles ;
• des demandes de complément d'information ;
• des décisions concernant les paiements ou les comptes.

La messagerie interne est réservée aux échanges officiels entre l'administration et les membres. Le membre doit consulter régulièrement son espace personnel et maintenir ses coordonnées à jour.`,
  },
  {
    icon: Ban,
    title: "Comportements interdits",
    content: `Sont notamment interdits sur la plateforme :
• la fraude sous toutes ses formes ;
• l'usurpation d'identité ;
• la transmission de faux justificatifs ;
• la manipulation ou la falsification des reçus ;
• le contournement des contrôles et procédures ;
• l'accès non autorisé à des comptes, données ou fonctions ;
• toute tentative d'altération du fonctionnement de la plateforme ;
• la collecte abusive de données d'autres utilisateurs ;
• le harcèlement des membres ou de l'administration ;
• la publication de contenu illégal ou trompeur ;
• l'utilisation commerciale non autorisée du service ;
• la diffusion de logiciels malveillants ;
• toute atteinte aux droits d'un tiers.`,
  },
  {
    icon: Upload,
    title: "Contenus transmis par les utilisateurs",
    content: `L'utilisateur reste responsable des textes, photographies, justificatifs, messages, documents et informations qu'il transmet sur la plateforme.

Il doit disposer des droits nécessaires sur ces contenus et s'abstenir de transmettre tout contenu illégal, confidentiel ou appartenant à un tiers sans autorisation.

L'utilisateur accorde à TITANEX SARL les seuls droits techniques nécessaires pour héberger, traiter et afficher ces contenus dans le cadre du fonctionnement du service. Aucune cession générale de droits de propriété intellectuelle n'est demandée.`,
  },
  {
    icon: ShieldCheck,
    title: "Administration et modération",
    content: `Les administrateurs autorisés de la plateforme peuvent :
• vérifier les informations fournies par les membres ;
• valider ou rejeter une opération, notamment une déclaration de paiement ;
• demander un complément d'information ou de justificatif ;
• modérer un contenu contraire aux présentes conditions ;
• suspendre ou limiter un compte ;
• réactiver un compte lorsque cela est prévu ;
• prendre des mesures de sécurité.

Ces mesures sont liées à la sécurité de la plateforme, au respect des présentes CGU, à la prévention de la fraude, aux obligations légales ou au bon fonctionnement du service.`,
  },
  {
    icon: UserX,
    title: "Suspension et fermeture du compte",
    content: `Le compte d'un membre peut se trouver dans l'un des statuts suivants : actif, en pause, suspendu ou banni. Lorsqu'un compte n'est pas actif, les actions sensibles — notamment rejoindre une catégorie ou déclarer un paiement — sont bloquées.

Une suspension ou une limitation peut intervenir notamment en cas de :
• fraude présumée ;
• informations fausses ou trompeuses ;
• faux justificatif ;
• violation des présentes CGU ;
• risque de sécurité ;
• obligation légale ;
• incident grave lié à une tontine.

La plateforme ne propose pas de fonctionnalité de suppression automatique du compte. Toute demande relative au statut, à la fermeture ou à la suppression d'un compte peut être adressée à titanex.cm@gmail.com ; elle sera traitée sous réserve des obligations légales, comptables et de preuve applicables, notamment lorsque des opérations de tontine sont en cours.`,
  },
  {
    icon: Server,
    title: "Disponibilité de la plateforme",
    content: `TITANEX SARL s'efforce d'assurer l'accès au service dans de bonnes conditions. L'accès peut toutefois être perturbé, ralenti ou interrompu notamment en cas de :
• maintenance ou mise à jour ;
• panne technique ;
• indisponibilité d'un prestataire ;
• défaillance du réseau Internet ;
• événement extérieur ;
• mesure de sécurité.

TITANEX SARL ne garantit ni une disponibilité permanente du service ni une absence totale d'erreurs.`,
  },
  {
    icon: RefreshCw,
    title: "Application installable (PWA), cache et mises à jour",
    content: `La plateforme peut utiliser un service worker, un cache local et des fonctionnalités d'application installable (PWA), avec des mises à jour automatiques.

En conséquence, une ancienne version de l'application peut temporairement rester visible sur l'appareil de l'utilisateur jusqu'au rechargement de la page ou à la mise à jour du cache.`,
  },
  {
    icon: Link2,
    title: "Services et liens externes",
    content: `La plateforme s'appuie sur des prestataires techniques, notamment Supabase (authentification, base de données, stockage) et Vercel (hébergement). Elle peut proposer des liens ou renvois vers WhatsApp, les réseaux sociaux ou des services de paiement externes.

Ces services disposent de leurs propres conditions d'utilisation et politiques de confidentialité, que l'utilisateur est invité à consulter. TITANEX SARL ne contrôle pas leurs traitements et prestations indépendants.`,
  },
  {
    icon: Database,
    title: "Protection des données",
    content: `Les données personnelles des utilisateurs sont traitées par TITANEX SARL pour la gestion des comptes, des tontines, des contributions, des paiements, des communications et de la sécurité de la plateforme, dans le respect de la réglementation applicable, notamment la loi n° 2024/017 du 23 décembre 2024 relative à la protection des données à caractère personnel au Cameroun.

Les modalités détaillées de ces traitements — données collectées, finalités, destinataires, durées, droits des utilisateurs — sont décrites dans la politique de confidentialité.`,
    after: (
      <p className="mt-4">
        <Link
          to="/privacy-policy"
          className="text-gold hover:text-gold-light transition-colors underline underline-offset-4"
        >
          Consulter la politique de confidentialité
        </Link>
      </p>
    ),
  },
  {
    icon: Copyright,
    title: "Propriété intellectuelle",
    content: `Les éléments de la plateforme appartenant à TITANEX SARL ou utilisés avec autorisation comprennent notamment : la marque, le logo, l'identité visuelle, les textes, les interfaces, le code, les fonctionnalités, les bases de données, les documents et les contenus graphiques.

Toute reproduction, copie, adaptation, extraction ou exploitation non autorisée de ces éléments, totale ou partielle, est interdite sans l'accord écrit préalable de TITANEX SARL.`,
  },
  {
    icon: Scale,
    title: "Responsabilité",
    content: `TITANEX SARL est responsable de la fourniture du service dans les limites prévues par la loi et par les présentes conditions.

Elle ne peut toutefois être tenue responsable d'un dommage directement causé par :
• une information fausse ou inexacte fournie par l'utilisateur ;
• la perte ou le partage des identifiants de connexion ;
• un usage frauduleux du compte ;
• un justificatif falsifié ;
• le non-respect des échéances par un membre ;
• une panne ou indisponibilité externe ;
• un service tiers ;
• un événement indépendant de son contrôle.

Les présentes conditions ne privent pas l'utilisateur des droits impératifs que lui reconnaît la législation applicable, notamment en matière de protection du consommateur.`,
  },
  {
    icon: MessageCircle,
    title: "Réclamations et règlement amiable",
    content: `En cas de difficulté, de désaccord ou de réclamation, l'utilisateur est invité à contacter en priorité TITANEX SARL à l'adresse titanex.cm@gmail.com, en décrivant précisément la situation.

Les parties rechercheront de bonne foi une solution amiable avant d'engager toute procédure contentieuse.`,
  },
  {
    icon: History,
    title: "Modification des CGU",
    content: `Les présentes conditions peuvent évoluer pour tenir compte des fonctionnalités de la plateforme, des pratiques, des obligations légales, des prestataires utilisés ou des conditions financières des services.

Les changements importants sont portés à la connaissance des utilisateurs par un moyen approprié (publication sur la plateforme, message officiel ou autre canal adapté). La version applicable est celle publiée sur la plateforme, avec sa date de dernière mise à jour.`,
  },
  {
    icon: Gavel,
    title: "Droit applicable",
    content: `Les présentes Conditions générales d'utilisation sont régies par le droit applicable en République du Cameroun — notamment les règles relatives au commerce électronique, à la protection du consommateur et à la protection des données à caractère personnel. En cas de difficulté, les parties rechercheront prioritairement une solution amiable avant toute procédure contentieuse.`,
  },
];

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Conditions générales d'utilisation | Cercle des Titans</title>
        <meta
          name="description"
          content="Conditions générales d'utilisation de la plateforme Cercle des Titans : accès, comptes, tontines, contributions, paiements et responsabilités. Éditeur : TITANEX SARL."
        />
        <link rel="canonical" href="/terms-of-use" />
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
              <ScrollText className="w-10 h-10 text-gold" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                Conditions générales d'utilisation
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Les règles d'accès et d'utilisation de la plateforme Cercle des Titans,
              éditée et exploitée par TITANEX SARL.
            </p>
            <p className="text-muted-foreground/60 text-sm mt-4">
              Dernière mise à jour : {LAST_UPDATED}
            </p>
          </div>
        </div>
      </section>

      {/* Objet des CGU */}
      <section className="pb-8">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 hover:border-gold/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-gold/20 group-hover:border-gold/40 transition-colors" />
              </div>

              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center">
                  <FileCheck className="w-7 h-7 text-gold" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl font-bold text-foreground mb-4 group-hover:text-gold transition-colors">
                    1. Objet des CGU
                  </h2>
                  <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {`Les présentes Conditions générales d'utilisation (CGU) définissent :
• les modalités d'accès à la plateforme Cercle des Titans ;
• les règles d'utilisation de la plateforme ;
• les responsabilités de TITANEX SARL ;
• les engagements des membres ;
• les conditions générales liées aux tontines et aux services associés.

L'utilisation de la plateforme implique l'acceptation des présentes CGU dans leur version applicable au moment de l'utilisation. L'utilisateur qui n'accepte pas ces conditions doit s'abstenir d'utiliser le service.`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Présentation de l'éditeur */}
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
                    2. Présentation de l'éditeur
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    La plateforme Cercle des Titans est éditée et exploitée par TITANEX SARL.
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
                  <p className="text-muted-foreground text-sm mt-6">
                    Voir aussi les{" "}
                    <Link to="/mentions-legales" className="text-gold hover:text-gold-light transition-colors underline underline-offset-4">
                      mentions légales
                    </Link>{" "}
                    et la{" "}
                    <Link to="/privacy-policy" className="text-gold hover:text-gold-light transition-colors underline underline-offset-4">
                      politique de confidentialité
                    </Link>
                    .
                  </p>
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
                    {section.after ?? null}
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
              31. Contact
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Pour toute question concernant les présentes conditions :
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
              </Link>{" "}
              et notre{" "}
              <Link to="/privacy-policy" className="text-gold hover:text-gold-light transition-colors underline underline-offset-4">
                politique de confidentialité
              </Link>
              .
            </p>
            <p className="text-muted-foreground/60 text-sm mt-4">
              Dernière mise à jour : {LAST_UPDATED}
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
