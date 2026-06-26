import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Eye,
  GraduationCap,
  MessageCircle,
  Minus,
  Share2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  getAnalyticsDaily,
  type AnalyticsSummary,
  type DailyPoint,
} from "@/services/analyticsService";

// --- Outils de tendance (purs, agrégats only — aucune PII) ------------------
type TrendDir = "up" | "down" | "flat";

interface Trend {
  last7: number;
  prev7: number;
  deltaPct: number | null; // null si pas de base de comparaison
  dir: TrendDir;
}

const sumKey = (rows: DailyPoint[], key: keyof DailyPoint): number =>
  rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);

const computeTrend = (rows: DailyPoint[], key: keyof DailyPoint): Trend => {
  const last7 = sumKey(rows.slice(-7), key);
  const prev7 = sumKey(rows.slice(-14, -7), key);
  let deltaPct: number | null = null;
  let dir: TrendDir = "flat";
  if (prev7 > 0) {
    deltaPct = ((last7 - prev7) / prev7) * 100;
    dir = deltaPct > 5 ? "up" : deltaPct < -5 ? "down" : "flat";
  } else if (last7 > 0) {
    dir = "up"; // activité nouvelle, sans base précédente
  }
  return { last7, prev7, deltaPct, dir };
};

const formatCount = (v: number): string =>
  new Intl.NumberFormat("fr-FR").format(v);

const TrendChip = ({
  label,
  icon: Icon,
  trend,
  comparable,
}: {
  label: string;
  icon: typeof Users;
  trend: Trend;
  comparable: boolean;
}) => {
  const DirIcon =
    trend.dir === "up" ? TrendingUp : trend.dir === "down" ? TrendingDown : Minus;
  const dirColor =
    trend.dir === "up"
      ? "text-emerald-400"
      : trend.dir === "down"
        ? "text-red-400"
        : "text-muted-foreground";

  return (
    <div className="rounded-lg border border-gold/15 bg-black/30 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-gold" />
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-bold text-foreground">
          {formatCount(trend.last7)}
        </span>
        {comparable && trend.deltaPct !== null ? (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${dirColor}`}>
            <DirIcon className="h-3.5 w-3.5" />
            {trend.deltaPct > 0 ? "+" : ""}
            {trend.deltaPct.toFixed(0)} %
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">7 j</span>
        )}
      </div>
    </div>
  );
};

/**
 * Phase C2 — « Lecture des tendances » : synthèse courte des 7 derniers jours
 * (vs période précédente) + source principale + 2-3 recommandations
 * déterministes. Lecture seule via getAnalyticsDaily(30). Aucune PII.
 */
export default function AnalyticsInsights({
  summary,
}: {
  summary: AnalyticsSummary;
}) {
  const [data, setData] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAnalyticsDaily(30)
      .then((rows) => {
        if (active) setData(rows);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visitors = useMemo(() => computeTrend(data, "uniqueVisitors"), [data]);
  const pages = useMemo(() => computeTrend(data, "pageViews"), [data]);
  const whatsapp = useMemo(
    () => computeTrend(data, "whatsappPublicClicks"),
    [data],
  );
  const bourse = useMemo(() => computeTrend(data, "bourseSignups"), [data]);

  // Y a-t-il assez d'historique pour comparer (la période précédente a-t-elle
  // au moins une donnée) ?
  const comparable = useMemo(
    () =>
      data
        .slice(-14, -7)
        .some(
          (d) =>
            d.uniqueVisitors > 0 ||
            d.pageViews > 0 ||
            d.whatsappPublicClicks > 0 ||
            d.bourseSignups > 0,
        ),
    [data],
  );

  const hasAny = useMemo(
    () =>
      data.some(
        (d) =>
          d.uniqueVisitors > 0 ||
          d.pageViews > 0 ||
          d.whatsappPublicClicks > 0 ||
          d.bourseSignups > 0,
      ),
    [data],
  );

  const mainSource =
    summary.sources.status === "available" && summary.sources.rows.length > 0
      ? summary.sources.rows[0]
      : null;

  // Recommandations déterministes (max 3, par priorité, ton non alarmiste).
  const recos = useMemo(() => {
    const out: { icon: typeof Users; text: string }[] = [];

    if (whatsapp.last7 === 0) {
      out.push({
        icon: MessageCircle,
        text: "Renforcer les CTA WhatsApp publics : aucun clic sur les 7 derniers jours.",
      });
    } else if (whatsapp.dir === "down") {
      out.push({
        icon: MessageCircle,
        text: "Les clics WhatsApp publics fléchissent — remettez les boutons en avant.",
      });
    }

    if (bourse.last7 === 0) {
      out.push({
        icon: GraduationCap,
        text: "Partager davantage la page Bourse Rentrée pour générer des inscriptions.",
      });
    } else {
      out.push({
        icon: GraduationCap,
        text: `Surveiller les inscriptions Bourse cette semaine (${bourse.last7} sur 7 j).`,
      });
    }

    if (visitors.dir === "up") {
      out.push({
        icon: TrendingUp,
        text: "Affluence en hausse — bon moment pour pousser les inscriptions.",
      });
    } else if (visitors.dir === "down") {
      out.push({
        icon: TrendingDown,
        text: "Trafic en baisse — relancez le partage sur les réseaux sociaux.",
      });
    }

    if (mainSource) {
      out.push({
        icon: Share2,
        text: `Canal principal : ${mainSource.label} — capitalisez dessus.`,
      });
    }

    return out.slice(0, 3);
  }, [whatsapp, bourse, visitors, mainSource]);

  return (
    <Card className="relative overflow-hidden border-gold/20 bg-card">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-gold" />
          Lecture des tendances
        </CardTitle>
        <CardDescription>
          7 derniers jours
          {comparable ? " vs période précédente" : ""} — agrégats anonymes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-24 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-t-2 border-b-2 border-gold" />
          </div>
        ) : !hasAny ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Pas encore assez de données pour dégager une tendance.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Chips de tendance */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <TrendChip label="Visiteurs" icon={Users} trend={visitors} comparable={comparable} />
              <TrendChip label="Pages vues" icon={Eye} trend={pages} comparable={comparable} />
              <TrendChip label="Clics WhatsApp publics" icon={MessageCircle} trend={whatsapp} comparable={comparable} />
              <TrendChip label="Inscriptions Bourse" icon={GraduationCap} trend={bourse} comparable={comparable} />
            </div>

            {/* Ligne source principale */}
            <div className="flex items-center gap-2 text-sm">
              <Share2 className="h-4 w-4 shrink-0 text-gold" />
              <span className="text-muted-foreground">Source principale :</span>
              <span className="font-medium capitalize text-foreground">
                {mainSource ? `${mainSource.label} (${formatCount(mainSource.value)})` : "non détectée"}
              </span>
            </div>

            {/* Repère si historique insuffisant */}
            {!comparable && (
              <p className="text-xs text-muted-foreground/70">
                Historique insuffisant pour comparer à la période précédente — valeurs des 7 derniers jours affichées.
              </p>
            )}

            {/* Recommandations déterministes */}
            {recos.length > 0 && (
              <div className="space-y-2 border-t border-border/60 pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gold/80">
                  Recommandations
                </p>
                <ul className="space-y-1.5">
                  {recos.map((r, i) => {
                    const Icon = r.icon;
                    return (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                        <span>{r.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
