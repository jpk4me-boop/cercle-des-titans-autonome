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

/**
 * Statistiques opérationnelles internes (communauté, messagerie, tontines).
 * Toutes dérivées de tables existantes — aucune dépend du tracking visiteurs.
 */
export interface OperationalMetrics {
  membersActive: Metric;
  membersPaused: Metric;
  membersSuspended: Metric;
  membersBanned: Metric;
  officialConversations: Metric;
  messagesSent: Metric;
  contributionsPending: Metric;
  contributionsValidated: Metric;
  recentPayments: Metric;
  activeCycles: Metric;
}

export interface AnalyticsSummary {
  // --- Métriques réelles (tables existantes) ---
  members: Metric;
  newMembersThisMonth: Metric;
  conversions: Metric;
  conversionAmount: Metric;

  // --- Statistiques opérationnelles réelles (données internes) ---
  operational: OperationalMetrics;

  // --- Analytics visiteurs (Phase 4C-A : pages vues / visiteurs uniques) ---
  pageViews: Metric;
  topPages: Breakdown;

  // --- Métriques en attente de tracking ---
  visitors: Metric;
  onlineVisitors: Metric;
  onlineMembers: Metric;
  clicks: Metric;
  conversionRate: Metric;

  // --- Phase A : fenêtres visiteurs + KPI ciblés ---
  visitorsToday: Metric;
  visitors7d: Metric;
  /** Clics WhatsApp « contact interne admin » (≠ conversions marketing). */
  whatsappClicksAdmin: Metric;
  bourseSignups: Metric;
  activeTontineMembers: Metric;

  // --- Phase B1 : marketing public + conversion prospect → membre ---
  /** Clics WhatsApp PUBLICS (intentions visiteurs : partage / contact). */
  publicWhatsappClicks: Metric;
  /** Estimation agrégée : prospects Bourse Rentrée également membres. */
  prospectsConverted: Metric;
  /** Estimation : prospects convertis / total prospects (plafonné à 100 %). */
  bourseConversionRate: Metric;

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

/** Date ISO il y a `days` jours (fenêtre « récent »). */
const daysAgoIso = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

/**
 * Compte générique (head-only, sans charger les lignes) sur une table non
 * encore présente dans les types Supabase générés. Le cast `as any` suit le
 * même motif que tontineService / memberStatusService. Lecture seule.
 */
const countWhere = async (
  table: string,
  build?: (q: any) => any,
): Promise<number> => {
  let query: any = (supabase as any)
    .from(table)
    .select("*", { count: "exact", head: true });
  if (build) query = build(query);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
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
 * Visiteurs uniques (sessions distinctes) sur une fenêtre de `days` jours, via
 * la RPC admin existante. Retourne `null` si la lecture échoue (→ « pending »).
 */
const fetchUniqueVisitors = async (days: number): Promise<number | null> => {
  try {
    const { data, error } = await (supabase.rpc as any)("get_analytics_overview", {
      _days: days,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return row ? Number(row.unique_visitors) || 0 : 0;
  } catch {
    return null;
  }
};

/** Normalise le retour d'une RPC scalaire (`integer`) en nombre. */
const scalarRpcValue = (data: unknown): number =>
  typeof data === "number"
    ? data
    : Number(Array.isArray(data) ? (data as unknown[])[0] : data) || 0;

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

  // --- Statistiques opérationnelles (données internes réelles) ---
  // Chaque source est isolée : un échec (RLS, table absente) dégrade SA seule
  // métrique en « pending » sans faire planter le reste de la page.
  const [
    totalMembersRes,
    pausedRes,
    suspendedRes,
    bannedRes,
    conversationsRes,
    messagesRes,
    contribPendingRes,
    contribPaidRes,
    recentPaymentsRes,
    activeCyclesRes,
  ] = await Promise.allSettled([
    countWhere("profiles"),
    countWhere("member_account_status", (q) => q.eq("status", "paused")),
    countWhere("member_account_status", (q) => q.eq("status", "suspended")),
    countWhere("member_account_status", (q) => q.eq("status", "banned")),
    countWhere("conversations"),
    countWhere("messages"),
    countWhere("tontine_contributions", (q) => q.eq("status", "pending")),
    countWhere("tontine_contributions", (q) => q.eq("status", "paid")),
    countWhere("contribution_payments", (q) =>
      q.gte("created_at", daysAgoIso(7)),
    ),
    countWhere("tontine_cycles", (q) => q.eq("status", "active")),
  ]);

  const countMetric = (
    res: PromiseSettledResult<number>,
    hint: string,
  ): Metric =>
    res.status === "fulfilled"
      ? { status: "available", value: res.value, hint }
      : pending("Source indisponible");

  // Membres actifs = total − (pausés + suspendus + bannis). Les membres sans
  // ligne dans member_account_status sont actifs par défaut, d'où la déduction
  // plutôt qu'un comptage direct du statut 'active'.
  const allMemberStatusOk =
    totalMembersRes.status === "fulfilled" &&
    pausedRes.status === "fulfilled" &&
    suspendedRes.status === "fulfilled" &&
    bannedRes.status === "fulfilled";

  const membersActive: Metric = allMemberStatusOk
    ? {
        status: "available",
        value: Math.max(
          0,
          totalMembersRes.value -
            pausedRes.value -
            suspendedRes.value -
            bannedRes.value,
        ),
        hint: "Comptes actifs",
      }
    : pending("Source membres indisponible");

  const operational: OperationalMetrics = {
    membersActive,
    membersPaused: countMetric(pausedRes, "En pause"),
    membersSuspended: countMetric(suspendedRes, "Suspendus"),
    membersBanned: countMetric(bannedRes, "Bannis"),
    officialConversations: countMetric(conversationsRes, "Avec l'administration"),
    messagesSent: countMetric(messagesRes, "Total échangés"),
    contributionsPending: countMetric(contribPendingRes, "À régler"),
    contributionsValidated: countMetric(contribPaidRes, "Réglées"),
    recentPayments: countMetric(recentPaymentsRes, "7 derniers jours"),
    activeCycles: countMetric(activeCyclesRes, "En cours"),
  };

  // --- Présence en ligne (Phase 4B, heartbeat — pas de Realtime) ---
  // Fenêtre serveur par défaut : 5 minutes. Dégradation propre en « pending »
  // si la RPC échoue (non-admin, RPC absente avant application de la migration).
  let onlineMembers: Metric = pending("Présence à venir");
  let onlineVisitors: Metric = pending("Présence à venir");
  try {
    const { data, error } = await (supabase.rpc as any)("get_presence_counts", {
      _window_minutes: 5,
    });
    if (error) throw error;
    // La RPC renvoie un tableau d'une ligne { online_members, online_visitors }.
    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      onlineMembers = {
        status: "available",
        value: Number(row.online_members) || 0,
        hint: "5 dernières minutes",
      };
      onlineVisitors = {
        status: "available",
        value: Number(row.online_visitors) || 0,
        hint: "5 dernières minutes",
      };
    }
  } catch {
    // Compteurs de présence indisponibles : on conserve l'état « pending ».
  }

  // --- Analytics visiteurs (Phase 4C-A) : pages vues + visiteurs uniques ---
  // Dégradation propre en « pending » si la RPC échoue (non-admin, RPC absente
  // avant application de la migration). clicks/conversions restent à venir
  // (sous-phases 4C-B / 4C-C) → on garde visitors/pageViews ici uniquement.
  let pageViews: Metric = pending("Pages vues à venir");
  let visitors: Metric = pending();
  let clicks: Metric = pending();
  let conversionRate: Metric = pending("Nécessite le suivi des visiteurs");
  let topPages: Breakdown = { status: "pending", rows: [] };
  let sources: Breakdown = { status: "pending", rows: [] };
  try {
    const { data, error } = await (supabase.rpc as any)("get_analytics_overview", {
      _days: 30,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      const uniqueVisitors = Number(row.unique_visitors) || 0;
      const formConversions = Number(row.conversions) || 0;

      pageViews = {
        status: "available",
        value: Number(row.page_views) || 0,
        hint: "30 derniers jours",
      };
      visitors = {
        status: "available",
        value: uniqueVisitors,
        hint: "Sessions uniques · 30 j",
      };
      // Phase 4C-B : clics importants (CTA).
      clicks = {
        status: "available",
        value: Number(row.clicks) || 0,
        hint: "Clics CTA · 30 j",
      };
      // Phase 4C-C : taux = conversions FORMULAIRE / visiteurs uniques, plafonné
      // à 100 % (un visiteur peut soumettre plusieurs fois). La carte
      // « Conversions » reste, elle, liée aux paiements aboutis (inchangée).
      // Sans visiteur réel, le ratio n'a pas de sens (0/0) → on reste « pending »
      // plutôt que d'afficher un « 0,0 % » trompeur.
      conversionRate =
        uniqueVisitors > 0
          ? {
              status: "available",
              value: Math.min(100, (formConversions / uniqueVisitors) * 100),
              hint: "Formulaires / visiteurs",
            }
          : pending("Nécessite au moins un visiteur réel");
    }
  } catch {
    // Synthèse analytics indisponible : on conserve l'état « pending ».
  }

  try {
    const { data, error } = await (supabase.rpc as any)("get_analytics_top_pages", {
      _days: 30,
      _limit: 5,
    });
    if (error) throw error;
    const rows = (Array.isArray(data) ? data : [])
      .map((r: any) => ({ label: String(r.label), value: Number(r.value) || 0 }))
      .filter((r: BreakdownRow) => r.label.length > 0);
    if (rows.length > 0) {
      topPages = { status: "available", rows };
    }
  } catch {
    // Top pages indisponible : on conserve l'état « pending ».
  }

  // Phase 4C-C : sources / réseaux sociaux (sessions distinctes par source).
  try {
    const { data, error } = await (supabase.rpc as any)("get_analytics_top_sources", {
      _days: 30,
      _limit: 10,
    });
    if (error) throw error;
    const rows = (Array.isArray(data) ? data : [])
      .map((r: any) => ({ label: String(r.label), value: Number(r.value) || 0 }))
      .filter((r: BreakdownRow) => r.label.length > 0);
    if (rows.length > 0) {
      sources = { status: "available", rows };
    }
  } catch {
    // Sources indisponibles : on conserve l'état « pending ».
  }

  // --- Phase A : fenêtres visiteurs (aujourd'hui / 7 j) ---
  // Réutilise get_analytics_overview avec _days=1 et _days=7. Dégradation
  // propre en « pending » si la RPC échoue (non-admin, RPC absente).
  const [todayVisitors, weekVisitors] = await Promise.all([
    fetchUniqueVisitors(1),
    fetchUniqueVisitors(7),
  ]);
  const visitorsToday: Metric =
    todayVisitors === null
      ? pending("Tracking visiteurs à venir")
      : { status: "available", value: todayVisitors, hint: "Dernières 24 h" };
  const visitors7d: Metric =
    weekVisitors === null
      ? pending("Tracking visiteurs à venir")
      : { status: "available", value: weekVisitors, hint: "7 derniers jours" };

  // --- Phase A : clics WhatsApp « contact interne admin » (30 j) ---
  let whatsappClicksAdmin: Metric = pending("Tracking clics à venir");
  try {
    const { data, error } = await (supabase.rpc as any)(
      "get_analytics_whatsapp_clicks",
      { _days: 30 },
    );
    if (error) throw error;
    whatsappClicksAdmin = {
      status: "available",
      value: scalarRpcValue(data),
      hint: "Contacts internes · 30 j",
    };
  } catch {
    // RPC absente avant migration : on conserve l'état « pending ».
  }

  // --- Phase A : inscriptions Bourse Rentrée (liste d'attente, RLS admin) ---
  let bourseSignups: Metric = pending("Source liste d'attente indisponible");
  try {
    const value = await countWhere("bourse_rentree_waitlist");
    bourseSignups = {
      status: "available",
      value,
      hint: "Total liste d'attente",
    };
  } catch {
    // Lecture indisponible : on conserve l'état « pending ».
  }

  // --- Phase A : membres actifs tontine (user_id distincts, adhésion active) ---
  let activeTontineMembers: Metric = pending("Source tontine indisponible");
  try {
    const { data, error } = await (supabase.rpc as any)(
      "get_active_tontine_members_count",
    );
    if (error) throw error;
    activeTontineMembers = {
      status: "available",
      value: scalarRpcValue(data),
      hint: "Adhésions actives",
    };
  } catch {
    // RPC absente avant migration : on conserve l'état « pending ».
  }

  // --- Phase B1 : clics WhatsApp PUBLICS (intentions visiteurs, 30 j) ---
  let publicWhatsappClicks: Metric = pending("Tracking clics à venir");
  try {
    const { data, error } = await (supabase.rpc as any)(
      "get_analytics_public_whatsapp_clicks",
      { _days: 30 },
    );
    if (error) throw error;
    publicWhatsappClicks = {
      status: "available",
      value: scalarRpcValue(data),
      hint: "Partages / contacts · 30 j",
    };
  } catch {
    // RPC absente avant migration : on conserve l'état « pending ».
  }

  // --- Phase B1 : conversion prospect Bourse Rentrée → membre (estimation) ---
  // Recoupement agrégé côté serveur (user_id / email / téléphone). La RPC ne
  // renvoie que deux entiers — aucune donnée personnelle ne transite.
  let prospectsConverted: Metric = pending("Source conversion indisponible");
  let bourseConversionRate: Metric = pending("Source conversion indisponible");
  try {
    const { data, error } = await (supabase.rpc as any)(
      "get_bourse_conversion_stats",
    );
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    const prospects = Number(row?.prospects) || 0;
    const converted = Number(row?.converted) || 0;
    prospectsConverted = {
      status: "available",
      value: converted,
      hint: "Estimation (email / téléphone)",
    };
    bourseConversionRate =
      prospects > 0
        ? {
            status: "available",
            value: Math.min(100, (converted / prospects) * 100),
            hint: "Estimation · convertis / prospects",
          }
        : pending("Aucun prospect pour estimer");
  } catch {
    // RPC absente avant migration : on conserve l'état « pending ».
  }

  // --- TODO tracking : pays (reste « Bientôt ») ---
  const countries: Breakdown = { status: "pending", rows: [] };

  return {
    members,
    newMembersThisMonth,
    conversions,
    conversionAmount,
    operational,
    pageViews,
    topPages,
    visitors,
    onlineVisitors,
    onlineMembers,
    clicks,
    conversionRate,
    visitorsToday,
    visitors7d,
    whatsappClicksAdmin,
    bourseSignups,
    activeTontineMembers,
    publicWhatsappClicks,
    prospectsConverted,
    bourseConversionRate,
    countries,
    sources,
  };
};
