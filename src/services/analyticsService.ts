import { supabase } from "@/integrations/supabase/client";

/**
 * Couche d'abstraction Analytics.
 *
 * Objectif : exposer un résumé statistique stable pour l'UI admin, en
 * distinguant clairement :
 *   - les métriques RÉELLES dérivées des tables existantes (membres, conversions) ;
 *   - les métriques EN ATTENTE de tracking (visiteurs, pays, sources, clics…)
 *     qui nécessiteront une future infrastructure (table `analytics_events`).
 *
 * Aucune écriture, aucune migration : lecture seule sur tables existantes.
 * Le jour où le tracking Supabase sera validé, il suffira de brancher les
 * sections marquées « TODO tracking » sans toucher à l'UI.
 */

/** Statut d'une métrique : disponible (donnée réelle) ou en attente de tracking. */
export type MetricStatus = "available" | "pending";

/** Une métrique numérique avec son statut de disponibilité. */
export interface Metric {
  status: MetricStatus;
  /** Valeur réelle si `status === 'available'`, sinon `null`. */
  value: number | null;
  /** Aide contextuelle affichée sous la valeur (libellé court). */
  hint?: string;
}

/** Une ligne de répartition (pays, source…) avec son poids. */
export interface BreakdownRow {
  label: string;
  value: number;
}

/** Une section de répartition pouvant elle aussi être « en attente ». */
export interface Breakdown {
  status: MetricStatus;
  rows: BreakdownRow[];
}

export interface AnalyticsSummary {
  // --- Métriques réelles (tables existantes) ---
  members: Metric;
  newMembersThisMonth: Metric;
  conversions: Metric;
  conversionAmount: Metric;

  // --- Métriques en attente de tracking ---
  visitors: Metric;
  onlineVisitors: Metric;
  onlineMembers: Metric;
  clicks: Metric;
  conversionRate: Metric;

  // --- Répartitions ---
  countries: Breakdown;
  sources: Breakdown;
}

/** Fabrique une métrique « en attente de tracking ». */
const pending = (hint = "Tracking non encore branché"): Metric => ({
  status: "pending",
  value: null,
  hint,
});

const startOfMonthIso = (): string => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
};

/** Compte les lignes d'une table (lecture seule, sans charger les données). */
const countRows = async (
  table: "profiles",
  apply?: (q: ReturnType<typeof buildCountQuery>) => ReturnType<typeof buildCountQuery>,
): Promise<number> => {
  let query = buildCountQuery(table);
  if (apply) query = apply(query);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
};

const buildCountQuery = (table: "profiles") =>
  supabase.from(table).select("*", { count: "exact", head: true });

/**
 * Conversions = paiements réellement aboutis, agrégés depuis les deux sources
 * de paiement existantes :
 *   - `transactions` au statut `completed` (funnel public) ;
 *   - `contribution_payments` au statut `paid` (module tontine membre).
 *
 * On renvoie le nombre total et le montant cumulé. Si aucune des deux sources
 * n'est lisible/peuplée, la métrique reste « disponible » avec une valeur 0
 * (et non « pending »), car l'absence de paiement est une information réelle.
 */
const fetchConversions = async (): Promise<{ count: number; amount: number }> => {
  let count = 0;
  let amount = 0;

  // Source 1 : transactions publiques confirmées.
  const { data: txRows, error: txError } = await supabase
    .from("transactions")
    .select("amount")
    .eq("status", "completed");
  if (txError) throw txError;
  for (const row of txRows ?? []) {
    count += 1;
    amount += Number(row.amount) || 0;
  }

  // Source 2 : paiements de cotisations tontine validés.
  const { data: payRows, error: payError } = await supabase
    .from("contribution_payments")
    .select("amount")
    .eq("status", "paid");
  if (payError) throw payError;
  for (const row of payRows ?? []) {
    count += 1;
    amount += Number(row.amount) || 0;
  }

  return { count, amount };
};

/**
 * Construit le résumé analytics complet.
 *
 * Les métriques réelles sont calculées en parallèle. Toute source qui échoue
 * est dégradée proprement en « pending » plutôt que de faire planter la page.
 */
export const getAnalyticsSummary = async (): Promise<AnalyticsSummary> => {
  const [membersRes, newMembersRes, conversionsRes] = await Promise.allSettled([
    countRows("profiles"),
    countRows("profiles", (q) => q.gte("created_at", startOfMonthIso())),
    fetchConversions(),
  ]);

  const members: Metric =
    membersRes.status === "fulfilled"
      ? { status: "available", value: membersRes.value, hint: "Total inscrits" }
      : pending("Source membres indisponible");

  const newMembersThisMonth: Metric =
    newMembersRes.status === "fulfilled"
      ? { status: "available", value: newMembersRes.value, hint: "Ce mois-ci" }
      : pending("Source membres indisponible");

  const conversions: Metric =
    conversionsRes.status === "fulfilled"
      ? { status: "available", value: conversionsRes.value.count, hint: "Paiements aboutis" }
      : pending("Source paiements indisponible");

  const conversionAmount: Metric =
    conversionsRes.status === "fulfilled"
      ? { status: "available", value: conversionsRes.value.amount, hint: "Montant cumulé" }
      : pending("Source paiements indisponible");

  // --- TODO tracking : à brancher sur `analytics_events` une fois validé ---
  const visitors = pending();
  const onlineVisitors = pending("Temps réel à venir");
  const onlineMembers = pending("Présence à venir");
  const clicks = pending();
  // Le taux de conversion dépend des visiteurs (conversions / visiteurs) :
  // tant que les visiteurs ne sont pas suivis, il reste indisponible.
  const conversionRate = pending("Nécessite le suivi des visiteurs");
  const countries: Breakdown = { status: "pending", rows: [] };
  const sources: Breakdown = { status: "pending", rows: [] };

  return {
    members,
    newMembersThisMonth,
    conversions,
    conversionAmount,
    visitors,
    onlineVisitors,
    onlineMembers,
    clicks,
    conversionRate,
    countries,
    sources,
  };
};
