import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertTriangle,
  Ban,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  FileText,
  Globe,
  GraduationCap,
  Layers,
  Lock,
  MessageCircle,
  MessagesSquare,
  MousePointerClick,
  PauseCircle,
  RefreshCw,
  Send,
  Share2,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { formatAmount } from "@/lib/paymentService";
import {
  getAnalyticsSummary,
  type AnalyticsSummary,
  type Breakdown,
  type Metric,
} from "@/services/analyticsService";

interface AnalyticsTabProps {
  readOnly?: boolean;
}

type KpiTone = "gold" | "neutral";

interface KpiConfig {
  key: string;
  title: string;
  icon: typeof Users;
  metric: Metric;
  /** Formatte la valeur réelle (par défaut : nombre localisé fr). */
  format?: (value: number) => string;
  tone?: KpiTone;
}

const formatCount = (value: number): string =>
  new Intl.NumberFormat("fr-FR").format(value);

/** Badge discret signalant qu'une donnée n'est pas encore collectée. */
const PendingBadge = () => (
  <Badge
    variant="outline"
    className="gap-1 border-gold/25 bg-gold/5 text-[10px] font-medium uppercase tracking-wide text-gold/70"
  >
    <Lock className="h-3 w-3" />
    Bientôt
  </Badge>
);

const KpiCard = ({ config }: { config: KpiConfig }) => {
  const { title, icon: Icon, metric, format = formatCount, tone = "neutral" } = config;
  const isPending = metric.status === "pending" || metric.value === null;
  const valueColor = tone === "gold" ? "text-gold" : "text-foreground";

  return (
    <Card className="relative overflow-hidden border-border bg-card transition-colors hover:border-gold/30">
      {/* Liseré or décoratif (luxe sombre) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium leading-tight text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 shrink-0 ${isPending ? "text-muted-foreground/50" : "text-gold"}`} />
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-2">
            <div className="text-2xl font-bold text-muted-foreground/40">—</div>
            <div className="flex items-center gap-2">
              <PendingBadge />
              <span className="text-xs text-muted-foreground">
                Données non encore collectées
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className={`text-2xl font-bold ${valueColor}`}>
              {format(metric.value as number)}
            </div>
            {metric.hint && (
              <p className="text-xs text-muted-foreground">{metric.hint}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const BreakdownCard = ({
  title,
  icon: Icon,
  breakdown,
  emptyHint,
  caption,
}: {
  title: string;
  icon: typeof Globe;
  breakdown: Breakdown;
  emptyHint: string;
  /** Légende courte sous le titre (sens de la donnée). */
  caption?: string;
}) => {
  const isPending = breakdown.status === "pending" || breakdown.rows.length === 0;
  const max = Math.max(1, ...breakdown.rows.map((r) => r.value));

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex min-w-0 items-start gap-2">
          <Icon className="h-4 w-4 shrink-0 text-gold" />
          <div className="min-w-0">
            <CardTitle className="text-base leading-tight">{title}</CardTitle>
            {caption && (
              <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>
            )}
          </div>
        </div>
        {isPending && <PendingBadge />}
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              Données non encore collectées
            </p>
            <p className="max-w-xs text-xs text-muted-foreground/70">{emptyHint}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {breakdown.rows.map((row) => (
              <li key={row.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{row.label}</span>
                  <span className="font-medium text-muted-foreground">
                    {formatCount(row.value)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold"
                    style={{ width: `${Math.round((row.value / max) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default function AnalyticsTab({ readOnly = false }: AnalyticsTabProps) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = async (force = false) => {
    setLoading(true);
    try {
      const data = await getAnalyticsSummary({ force });
      setSummary(data);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      toast.error("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading && !summary) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-gold" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Statistiques indisponibles pour le moment.
      </div>
    );
  }

  // KPI regroupés par section thématique (présentation uniquement — les
  // métriques et leur calcul restent inchangés côté service).
  const audienceKpis: KpiConfig[] = [
    { key: "members", title: "Membres", icon: Users, metric: summary.members, tone: "gold" },
    { key: "newMembers", title: "Nouveaux membres", icon: UserCheck, metric: summary.newMembersThisMonth },
    { key: "onlineMembers", title: "Membres en ligne", icon: Wifi, metric: summary.onlineMembers },
    { key: "onlineVisitors", title: "Visiteurs en ligne", icon: Activity, metric: summary.onlineVisitors },
    { key: "visitorsToday", title: "Visiteurs aujourd'hui", icon: Clock, metric: summary.visitorsToday },
    { key: "visitors7d", title: "Visiteurs 7 jours", icon: CalendarDays, metric: summary.visitors7d },
    { key: "visitors", title: "Visiteurs (30 j)", icon: Globe, metric: summary.visitors },
    { key: "pageViews", title: "Pages vues", icon: Eye, metric: summary.pageViews, tone: "gold" },
  ];

  const marketingKpis: KpiConfig[] = [
    { key: "clicks", title: "Clics CTA (tous)", icon: MousePointerClick, metric: summary.clicks },
    { key: "publicWhatsappClicks", title: "Clics WhatsApp publics", icon: Share2, metric: summary.publicWhatsappClicks },
    { key: "bourseSignups", title: "Inscriptions Bourse Rentrée", icon: GraduationCap, metric: summary.bourseSignups, tone: "gold" },
  ];

  const conversionKpis: KpiConfig[] = [
    { key: "conversions", title: "Conversions", icon: Target, metric: summary.conversions, tone: "gold" },
    {
      key: "conversionAmount",
      title: "Montant converti",
      icon: TrendingUp,
      metric: summary.conversionAmount,
      format: formatAmount,
    },
    { key: "conversionRate", title: "Taux de conversion (formulaire)", icon: BarChart3, metric: summary.conversionRate, format: (v) => `${v.toFixed(1)} %` },
    { key: "prospectsConverted", title: "Prospects convertis", icon: Target, metric: summary.prospectsConverted, tone: "gold" },
    { key: "bourseConversionRate", title: "Taux conversion Bourse → membre", icon: BarChart3, metric: summary.bourseConversionRate, format: (v) => `${v.toFixed(1)} %` },
  ];

  // Statistiques opérationnelles : données internes réelles (communauté,
  // messagerie, tontines). Réutilise KpiCard et le même type Metric.
  const operationalKpis: KpiConfig[] = [
    { key: "membersActive", title: "Membres actifs", icon: UserCheck, metric: summary.operational.membersActive, tone: "gold" },
    { key: "membersPaused", title: "Membres en pause", icon: PauseCircle, metric: summary.operational.membersPaused },
    { key: "membersSuspended", title: "Membres suspendus", icon: AlertTriangle, metric: summary.operational.membersSuspended },
    { key: "membersBanned", title: "Membres bannis", icon: Ban, metric: summary.operational.membersBanned },
    { key: "officialConversations", title: "Conversations officielles", icon: MessagesSquare, metric: summary.operational.officialConversations },
    { key: "messagesSent", title: "Messages envoyés", icon: Send, metric: summary.operational.messagesSent },
    { key: "contributionsPending", title: "Cotisations en attente", icon: Clock, metric: summary.operational.contributionsPending },
    { key: "contributionsValidated", title: "Cotisations validées", icon: CheckCircle2, metric: summary.operational.contributionsValidated, tone: "gold" },
    { key: "recentPayments", title: "Paiements récents", icon: CreditCard, metric: summary.operational.recentPayments },
    { key: "activeCycles", title: "Cycles actifs", icon: Layers, metric: summary.operational.activeCycles, tone: "gold" },
    { key: "activeTontineMembers", title: "Membres actifs tontine", icon: UserCheck, metric: summary.activeTontineMembers, tone: "gold" },
    { key: "whatsappClicksAdmin", title: "Contacts WhatsApp (admin)", icon: MessageCircle, metric: summary.whatsappClicksAdmin },
  ];

  // Sections affichées dans l'ordre, chacune avec son titre et sa grille.
  const kpiSections: {
    key: string;
    title: string;
    description: string;
    icon: typeof Users;
    items: KpiConfig[];
  }[] = [
    {
      key: "audience",
      title: "Audience",
      description: "Visiteurs, pages vues et présence en ligne.",
      icon: Globe,
      items: audienceKpis,
    },
    {
      key: "marketing",
      title: "Acquisition & marketing",
      description: "Clics CTA, contacts WhatsApp publics et inscriptions.",
      icon: Share2,
      items: marketingKpis,
    },
    {
      key: "conversions",
      title: "Conversions",
      description: "Paiements aboutis et conversion des prospects (estimations).",
      icon: Target,
      items: conversionKpis,
    },
    {
      key: "operational",
      title: "Statistiques opérationnelles",
      description:
        "Communauté, messagerie officielle et tontines — données internes issues de la base.",
      icon: Activity,
      items: operationalKpis,
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête de section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <BarChart3 className="h-5 w-5 text-gold" />
            Statistiques &amp; Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Aperçu de l'audience, de l'engagement et des conversions.
            {readOnly && " (lecture seule)"}
          </p>
        </div>
        <Button onClick={() => loadSummary(true)} disabled={loading} size="sm" variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* KPI regroupés par section thématique */}
      {kpiSections.map((section) => {
        const SectionIcon = section.icon;
        return (
          <div key={section.key} className="space-y-4">
            <div className="space-y-1">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <SectionIcon className="h-5 w-5 text-gold" />
                {section.title}
              </h3>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {section.items.map((kpi) => (
                <KpiCard key={kpi.key} config={kpi} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Répartitions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownCard
          title="Pages les plus vues"
          icon={FileText}
          breakdown={summary.topPages}
          caption="Vues par page · 30 j"
          emptyHint="Les pages les plus consultées apparaîtront ici dès que des visites seront enregistrées."
        />
        <BreakdownCard
          title="Pays"
          icon={Globe}
          breakdown={summary.countries}
          caption="Géographie des visiteurs"
          emptyHint="À venir — sans collecte d'IP."
        />
        <BreakdownCard
          title="Sources / Réseaux sociaux"
          icon={Share2}
          breakdown={summary.sources}
          caption="Sessions réellement détectées · 30 j"
          emptyHint="L'origine du trafic (réseaux sociaux, recherche, liens directs) s'affichera après l'activation du tracking."
        />
      </div>
    </div>
  );
}
