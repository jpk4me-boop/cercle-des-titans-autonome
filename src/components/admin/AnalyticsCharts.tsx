import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Activity, BarChart3, GraduationCap, Share2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getAnalyticsDaily,
  type Breakdown,
  type DailyPoint,
} from "@/services/analyticsService";

// Couleurs : accent or (token gold) + vert WhatsApp (cohérent bg-emerald-500).
const trafficConfig = {
  uniqueVisitors: { label: "Visiteurs", color: "hsl(var(--gold))" },
  whatsappPublicClicks: { label: "Clics WhatsApp", color: "#10b981" },
} satisfies ChartConfig;

const bourseConfig = {
  bourseSignups: { label: "Inscriptions Bourse", color: "hsl(var(--gold))" },
} satisfies ChartConfig;

const fmtDay = (iso: string): string => {
  try {
    return format(new Date(`${iso}T00:00:00`), "dd/MM", { locale: fr });
  } catch {
    return iso;
  }
};

const formatCount = (v: number): string =>
  new Intl.NumberFormat("fr-FR").format(v);

const EmptyChart = ({ height, hint }: { height: number; hint: string }) => (
  <div
    className="flex flex-col items-center justify-center gap-2 text-center"
    style={{ height }}
  >
    <Activity className="h-8 w-8 text-muted-foreground/30" />
    <p className="text-sm font-medium text-muted-foreground">
      Pas encore assez de données
    </p>
    <p className="max-w-xs text-xs text-muted-foreground/70">{hint}</p>
  </div>
);

const Spinner = ({ height }: { height: number }) => (
  <div className="flex items-center justify-center" style={{ height }}>
    <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-gold" />
  </div>
);

/**
 * Phase C1 — Section « Évolution » : courbes 7/30 j (visiteurs + clics WhatsApp
 * publics, inscriptions Bourse) + mini-tableau des sources marketing.
 *
 * Lecture seule (getAnalyticsDaily). Aucune métrique/KPI existant n'est modifié.
 */
export default function AnalyticsCharts({ sources }: { sources: Breakdown }) {
  const [range, setRange] = useState<7 | 30>(30);
  const [data, setData] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAnalyticsDaily(range)
      .then((rows) => {
        if (active) setData(rows);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range]);

  const hasTraffic = useMemo(
    () => data.some((d) => d.uniqueVisitors > 0 || d.whatsappPublicClicks > 0),
    [data],
  );
  const hasBourse = useMemo(
    () => data.some((d) => d.bourseSignups > 0),
    [data],
  );

  const sourceRows = sources.status === "available" ? sources.rows : [];
  const maxSource = Math.max(1, ...sourceRows.map((r) => r.value));

  return (
    <div className="space-y-4">
      {/* En-tête + toggle 7 j / 30 j */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <BarChart3 className="h-5 w-5 text-gold" />
            Évolution
          </h3>
          <p className="text-sm text-muted-foreground">
            Tendance des {range} derniers jours — agrégats anonymes.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
          {([7, 30] as const).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={range === r ? "default" : "ghost"}
              className="h-7 px-3 text-xs"
              onClick={() => setRange(r)}
            >
              {r} jours
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Visiteurs + clics WhatsApp publics */}
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Visiteurs &amp; clics WhatsApp publics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Spinner height={220} />
            ) : hasTraffic ? (
              <ChartContainer
                config={trafficConfig}
                className="aspect-auto h-[220px] w-full"
              >
                <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-uniqueVisitors)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-uniqueVisitors)" stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="fillWa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-whatsappPublicClicks)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-whatsappPublicClicks)" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    tickFormatter={fmtDay}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent labelFormatter={(v) => fmtDay(String(v))} />
                    }
                  />
                  <Area
                    dataKey="uniqueVisitors"
                    type="monotone"
                    stroke="var(--color-uniqueVisitors)"
                    strokeWidth={2}
                    fill="url(#fillVisitors)"
                  />
                  <Area
                    dataKey="whatsappPublicClicks"
                    type="monotone"
                    stroke="var(--color-whatsappPublicClicks)"
                    strokeWidth={2}
                    fill="url(#fillWa)"
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <EmptyChart
                height={220}
                hint="Les visites et clics apparaîtront ici dès qu'ils seront enregistrés."
              />
            )}
          </CardContent>
        </Card>

        {/* Mini-tableau sources marketing (réutilise summary.sources) */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Share2 className="h-4 w-4 text-gold" />
              Sources marketing
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sourceRows.length === 0 ? (
              <EmptyChart
                height={220}
                hint="L'origine du trafic s'affichera après l'activation du tracking."
              />
            ) : (
              <ul className="space-y-2.5">
                {sourceRows.map((row) => (
                  <li key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-foreground">{row.label}</span>
                      <span className="font-medium text-muted-foreground">
                        {formatCount(row.value)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold"
                        style={{ width: `${Math.round((row.value / maxSource) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inscriptions Bourse Rentrée par jour */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4 text-gold" />
            Inscriptions Bourse Rentrée / jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Spinner height={180} />
          ) : hasBourse ? (
            <ChartContainer
              config={bourseConfig}
              className="aspect-auto h-[180px] w-full"
            >
              <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="fillBourse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-bourseSignups)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-bourseSignups)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  tickFormatter={fmtDay}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent labelFormatter={(v) => fmtDay(String(v))} />
                  }
                />
                <Area
                  dataKey="bourseSignups"
                  type="monotone"
                  stroke="var(--color-bourseSignups)"
                  strokeWidth={2}
                  fill="url(#fillBourse)"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <EmptyChart
              height={180}
              hint="Le nombre d'inscriptions par jour s'affichera dès les premières demandes."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
