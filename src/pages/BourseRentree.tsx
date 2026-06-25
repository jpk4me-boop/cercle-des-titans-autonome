import { useState } from "react";
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
import BourseWaitlistForm from "@/components/bourse/BourseWaitlistForm";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Hourglass,
  Home,
  Info,
  PiggyBank,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";

/**
 * Bourse Rentrée Titans 2026 — page publique premium.
 *
 * Phase 1 (vitrine) : aucune inscription réelle, aucun paiement, aucune table,
 * aucune migration, aucun tracking. Le CTA ouvre un mailto vers le contact
 * existant pour rejoindre la liste d'attente.
 *
 * Source de vérité unique des chiffres : la constante PLANS. Le simulateur et
 * les cartes formules dérivent TOUT de `weeklySaving` / `weeklyFee` via les
 * constantes du programme (12 semaines, bourse conditionnelle 25 %). Aucun
 * montant n'est codé en dur en double → pas d'incohérence possible.
 */

// --- Paramètres officiels du programme (source unique) ---
const PROGRAM_WEEKS = 12;
const BOURSE_RATE = 0.25; // Bourse conditionnelle = 25 % du capital épargné.

interface Plan {
  id: string;
  name: string;
  weeklySaving: number; // Épargne hebdomadaire (FCFA).
  weeklyFee: number; // Frais de gestion hebdomadaires (FCFA).
  tagline: string;
  limited?: boolean; // Mention « places limitées ».
  highlight?: boolean; // Mise en avant visuelle (plan central).
}

const PLANS: Plan[] = [
  {
    id: "serenite",
    name: "Plan Sérénité",
    weeklySaving: 5000,
    weeklyFee: 500,
    tagline: "Pour démarrer la préparation de la rentrée en douceur.",
  },
  {
    id: "excellence",
    name: "Plan Excellence",
    weeklySaving: 10000,
    weeklyFee: 1000,
    tagline: "L'équilibre idéal entre effort et objectif scolaire.",
    highlight: true,
  },
  {
    id: "prestige",
    name: "Plan Prestige Scolaire",
    weeklySaving: 25000,
    weeklyFee: 2500,
    tagline: "L'engagement le plus ambitieux du programme.",
    limited: true,
  },
];

const formatFcfa = (value: number): string =>
  `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;

/** Dérive toutes les valeurs d'un plan depuis ses deux montants de base. */
const derivePlan = (plan: Plan) => {
  const weeklyTotal = plan.weeklySaving + plan.weeklyFee;
  const savedCapital = plan.weeklySaving * PROGRAM_WEEKS;
  const bourse = Math.round(savedCapital * BOURSE_RATE);
  const targetAmount = savedCapital + bourse;
  return { weeklyTotal, savedCapital, bourse, targetAmount };
};

// --- Wording prudent imposé (réutilisé tel quel) ---
const BONUS_DISCLAIMER =
  "Bourse scolaire de 25 % offerte aux participants ayant validé les 12 cotisations " +
  "du cycle, dans la limite des places disponibles et selon les conditions du programme.";

const programmeSteps = [
  {
    icon: PiggyBank,
    title: "Une épargne hebdomadaire encadrée",
    text:
      "Chaque semaine, vous cotisez selon la formule choisie. La discipline collective de la tontine transforme de petits efforts réguliers en un capital de rentrée.",
  },
  {
    icon: CalendarDays,
    title: "Un cycle court de 12 semaines",
    text:
      "Le programme est saisonnier : 12 cotisations pour préparer sereinement la rentrée scolaire, sans engagement à long terme.",
  },
  {
    icon: GraduationCap,
    title: "Une bourse conditionnelle de fin de cycle",
    text:
      "À la fin du cycle, les participants ayant validé l'intégralité de leurs cotisations peuvent bénéficier d'une bourse scolaire, selon les conditions du programme.",
  },
];

const bonusConditions = [
  "Avoir validé les 12 cotisations hebdomadaires du cycle.",
  "Être inscrit dans la limite des places disponibles pour la formule choisie.",
  "Respecter les conditions générales du programme communiquées à l'inscription.",
  "La bourse correspond à 25 % du capital réellement épargné sur le cycle.",
];

const faqItems = [
  {
    question: "La bourse est-elle automatique pour tous ?",
    answer:
      "Non. Il s'agit d'une bourse scolaire conditionnelle, soumise au respect des conditions du programme. Elle est offerte aux participants ayant validé les 12 cotisations du cycle, dans la limite des places disponibles. Ce dispositif est un programme de préparation scolaire, pas un produit financier.",
  },
  {
    question: "Comment est calculée la bourse de 25 % ?",
    answer:
      "La bourse correspond à 25 % du capital réellement épargné durant le cycle (hors frais de gestion). Par exemple, pour un capital épargné de 60 000 FCFA, la bourse conditionnelle est de 15 000 FCFA.",
  },
  {
    question: "À quoi servent les frais de gestion ?",
    answer:
      "Les frais de gestion hebdomadaires couvrent l'organisation, le suivi et l'animation du programme. Ils sont distincts de votre épargne et n'entrent pas dans le calcul du capital ni de la bourse.",
  },
  {
    question: "Que se passe-t-il si je manque une cotisation ?",
    answer:
      "La bourse conditionnelle suppose d'avoir validé l'ensemble des 12 cotisations du cycle. En cas de difficulté, le mieux est de contacter l'équipe en amont pour étudier les options possibles.",
  },
  {
    question: "Puis-je m'inscrire dès maintenant ?",
    answer:
      "Pour cette phase, les inscriptions ne sont pas encore ouvertes. Vous pouvez rejoindre la liste d'attente pour être informé(e) en priorité du lancement et de l'ouverture des places.",
  },
];

/** Liseré or décoratif (luxe sombre) réutilisé sur les cartes. */
const GoldHairline = () => (
  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
);

const PlanCard = ({ plan }: { plan: Plan }) => {
  const d = derivePlan(plan);
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl border bg-card/60 p-6 backdrop-blur-sm transition-all hover:border-gold/40 ${
        plan.highlight
          ? "border-gold/40 shadow-[0_0_40px_-12px_hsl(var(--gold)/0.4)]"
          : "border-border"
      }`}
    >
      <GoldHairline />
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-2xl text-gold">{plan.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
        </div>
        {plan.limited && (
          <Badge className="shrink-0 border-gold/30 bg-gold/10 text-gold">
            Places limitées
          </Badge>
        )}
      </div>

      <div className="my-4 flex items-baseline gap-2">
        <span className="font-display text-4xl font-bold text-foreground">
          {formatFcfa(d.weeklyTotal)}
        </span>
        <span className="text-sm text-muted-foreground">/ semaine</span>
      </div>

      <ul className="space-y-3 text-sm">
        {[
          { label: "Épargne hebdomadaire", value: formatFcfa(plan.weeklySaving) },
          { label: "Frais de gestion", value: formatFcfa(plan.weeklyFee) },
          {
            label: `Capital sur ${PROGRAM_WEEKS} semaines`,
            value: formatFcfa(d.savedCapital),
          },
          {
            label: "Bourse conditionnelle (25 %)",
            value: formatFcfa(d.bourse),
            gold: true,
          },
        ].map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span
              className={`font-medium ${row.gold ? "text-gold" : "text-foreground"}`}
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-xl border border-gold/20 bg-gold/5 p-4 text-center">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Montant cible
        </p>
        <p className="font-display text-2xl font-bold text-gold">
          {formatFcfa(d.targetAmount)}
        </p>
      </div>

      <a href="#liste-attente" className="mt-5">
        <Button
          variant={plan.highlight ? "default" : "outline"}
          className={`w-full rounded-full ${
            plan.highlight
              ? ""
              : "border-gold/40 text-gold hover:bg-gold/10"
          }`}
        >
          <Send className="mr-2 h-4 w-4" />
          Rejoindre la liste d'attente
        </Button>
      </a>
    </div>
  );
};

const Simulator = () => {
  const [selectedId, setSelectedId] = useState<string>(PLANS[1].id);
  const plan = PLANS.find((p) => p.id === selectedId) ?? PLANS[0];
  const d = derivePlan(plan);

  const lines = [
    { label: "Total hebdomadaire", value: formatFcfa(d.weeklyTotal), icon: Wallet },
    {
      label: `Capital épargné (${PROGRAM_WEEKS} semaines)`,
      value: formatFcfa(d.savedCapital),
      icon: PiggyBank,
    },
    {
      label: "Bourse conditionnelle (25 %)",
      value: formatFcfa(d.bourse),
      icon: GraduationCap,
      gold: true,
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm md:p-8">
      <GoldHairline />
      <div className="mb-6 flex flex-wrap gap-2">
        {PLANS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedId(p.id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              p.id === selectedId
                ? "border-gold bg-gold/15 text-gold"
                : "border-border text-muted-foreground hover:border-gold/40 hover:text-gold"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {lines.map((line) => (
          <div
            key={line.label}
            className="rounded-xl border border-border/60 bg-background/40 p-4"
          >
            <line.icon
              className={`mb-2 h-5 w-5 ${line.gold ? "text-gold" : "text-muted-foreground"}`}
            />
            <p className="text-xs text-muted-foreground">{line.label}</p>
            <p
              className={`mt-1 font-display text-xl font-bold ${
                line.gold ? "text-gold" : "text-foreground"
              }`}
            >
              {line.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-xl border border-gold/25 bg-gold/5 p-5 text-center sm:flex-row sm:text-left">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Montant cible à la fin du cycle
          </p>
          <p className="font-display text-3xl font-bold text-gold">
            {formatFcfa(d.targetAmount)}
          </p>
        </div>
        <p className="max-w-xs text-xs text-muted-foreground">
          Capital épargné + bourse conditionnelle, sous réserve de validation des{" "}
          {PROGRAM_WEEKS} cotisations et des conditions du programme.
        </p>
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
        Simulation indicative. La bourse est conditionnelle : {BONUS_DISCLAIMER.toLowerCase()}
      </p>
    </div>
  );
};

const BourseRentree = () => {
  return (
    <>
      <Helmet>
        <title>Bourse Rentrée Titans 2026 | Cercle des Titans</title>
        <meta
          name="description"
          content="Bourse Rentrée Titans 2026 : programme saisonnier de préparation scolaire sur 12 semaines, avec une bourse scolaire conditionnelle de 25 % en fin de cycle, dans la limite des places disponibles et selon les conditions du programme."
        />
        <meta
          name="keywords"
          content="bourse rentrée, préparation scolaire, tontine, cercle des titans, épargne, 2026, FCFA"
        />
        <link rel="canonical" href="/bourse-rentree" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-24 pb-16">
          {/* Breadcrumb */}
          <div className="mx-auto max-w-6xl px-6 py-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      to="/"
                      className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-gold"
                    >
                      <Home className="h-4 w-4" />
                      Accueil
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium text-gold">
                    Bourse Rentrée Titans 2026
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Hero — dark luxury */}
          <section className="relative overflow-hidden px-6 py-16 md:py-24">
            {/* Halo or en fond */}
            <div
              className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--gold)/0.18), transparent 70%)",
              }}
            />
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 flex items-center justify-center gap-2">
                <GraduationCap className="h-7 w-7 text-gold" />
                <Badge className="border-gold/30 bg-gold/10 px-4 py-1 text-sm text-gold">
                  Programme saisonnier 2026
                </Badge>
              </div>

              <h1 className="font-display text-4xl leading-tight text-foreground md:text-6xl">
                Bourse Rentrée <span className="gradient-text">Titans 2026</span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                Préparez sereinement la rentrée scolaire grâce à un cycle d'épargne
                encadré de {PROGRAM_WEEKS} semaines, assorti d'une{" "}
                <span className="text-gold">bourse scolaire conditionnelle</span> de
                fin de cycle.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a href="#liste-attente">
                  <Button
                    size="lg"
                    className="rounded-full px-8 py-6 text-base font-semibold shadow-lg"
                  >
                    <Send className="mr-2 h-5 w-5" />
                    Rejoindre la liste d'attente
                  </Button>
                </a>
                <a href="#simulateur">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full border-gold/40 px-8 py-6 text-base text-gold hover:bg-gold/10"
                  >
                    <Target className="mr-2 h-5 w-5" />
                    Simuler ma bourse
                  </Button>
                </a>
              </div>

              <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Hourglass className="h-4 w-4 text-gold" />
                Places limitées — lancement à venir, inscriptions pas encore ouvertes.
              </p>
            </div>
          </section>

          {/* Présentation du programme */}
          <section className="px-6 py-12">
            <div className="mx-auto max-w-5xl">
              <div className="mb-10 text-center">
                <h2 className="font-display text-3xl text-foreground md:text-4xl">
                  Comment fonctionne le programme
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                  Un dispositif simple, court et discipliné, pensé pour la rentrée
                  scolaire.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {programmeSteps.map((step) => (
                  <div
                    key={step.title}
                    className="relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm transition-colors hover:border-gold/30"
                  >
                    <GoldHairline />
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-gold/10">
                      <step.icon className="h-5 w-5 text-gold" />
                    </div>
                    <h3 className="font-display text-xl text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Formules */}
          <section className="px-6 py-12">
            <div className="mx-auto max-w-6xl">
              <div className="mb-10 text-center">
                <h2 className="font-display text-3xl text-foreground md:text-4xl">
                  Trois formules au choix
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                  Choisissez le rythme d'épargne qui correspond à votre objectif de
                  rentrée.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {PLANS.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            </div>
          </section>

          {/* Simulateur */}
          <section id="simulateur" className="scroll-mt-24 px-6 py-12">
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 text-center">
                <h2 className="font-display text-3xl text-foreground md:text-4xl">
                  Simulateur de bourse
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                  Sélectionnez une formule pour visualiser votre capital et votre
                  bourse conditionnelle estimée.
                </p>
              </div>
              <Simulator />
            </div>
          </section>

          {/* Conditions du bonus */}
          <section className="px-6 py-12">
            <div className="mx-auto max-w-4xl">
              <div className="relative overflow-hidden rounded-2xl border border-gold/25 bg-card/60 p-8 backdrop-blur-sm">
                <GoldHairline />
                <div className="mb-6 flex items-center gap-3">
                  <ShieldCheck className="h-7 w-7 text-gold" />
                  <h2 className="font-display text-2xl text-foreground md:text-3xl">
                    Conditions de la bourse
                  </h2>
                </div>

                <div className="mb-6 rounded-xl border border-gold/20 bg-gold/5 p-5">
                  <p className="text-sm leading-relaxed text-foreground">
                    {BONUS_DISCLAIMER}
                  </p>
                </div>

                <ul className="grid gap-3 sm:grid-cols-2">
                  {bonusConditions.map((cond) => (
                    <li key={cond} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      <span className="text-muted-foreground">{cond}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Bandeau places limitées */}
          <section className="px-6 py-8">
            <div className="mx-auto max-w-4xl">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-gradient-to-r from-gold/5 via-card/60 to-gold/5 p-6 text-center backdrop-blur-sm sm:flex-row sm:justify-center sm:gap-4 sm:text-left">
                <Hourglass className="h-8 w-8 shrink-0 text-gold" />
                <p className="text-base text-foreground">
                  <span className="font-semibold text-gold">Places limitées.</span>{" "}
                  Le nombre de participants par formule est restreint pour préserver
                  un suivi de qualité. Rejoignez la liste d'attente pour être
                  informé(e) en priorité.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ prudente */}
          <section className="px-6 py-12">
            <div className="mx-auto max-w-3xl">
              <div className="mb-8 flex items-center justify-center gap-3">
                <BookOpen className="h-7 w-7 text-gold" />
                <h2 className="font-display text-3xl text-foreground md:text-4xl">
                  Questions fréquentes
                </h2>
              </div>

              <Accordion type="single" collapsible className="space-y-4">
                {faqItems.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="rounded-xl border border-border bg-card/60 px-6 backdrop-blur-sm transition-colors data-[state=open]:border-gold/30"
                  >
                    <AccordionTrigger className="py-5 text-left text-base font-medium text-foreground hover:text-gold">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 leading-relaxed text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          {/* Liste d'attente — formulaire réel */}
          <section id="liste-attente" className="scroll-mt-24 px-6 py-16">
            <div className="mx-auto max-w-3xl">
              <div className="mb-8 text-center">
                <Sparkles className="mx-auto mb-5 h-10 w-10 text-gold" />
                <h2 className="font-display text-3xl text-foreground md:text-4xl">
                  Rejoindre la liste d'attente
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                  Les inscriptions ne sont pas encore ouvertes. Laissez vos
                  coordonnées pour être informé(e) en priorité de l'ouverture
                  officielle.
                </p>
                <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-4 w-4 text-gold" />
                  Aucune inscription officielle ni paiement à cette étape.
                </p>
              </div>

              <BourseWaitlistForm />
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default BourseRentree;
