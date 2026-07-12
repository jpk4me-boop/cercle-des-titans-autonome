// Tontine & Contributions utility service (Phase 1)
// File: src/services/tontineService.ts

import { supabase } from "@/integrations/supabase/client";
import {
  TontineCategory,
  MemberTontineCategory,
  TontineCycle,
  PaymentMethod,
  TontineContribution,
  ContributionPayment,
} from "@/types/tontine";

// --- Categories ---

// Effective tier amount used for sorting: the canonical weekly amount when present,
// otherwise the legacy daily amount (keeps a sensible order before/after the migration).
const effectiveCategoryAmount = (c: TontineCategory): number =>
  c.weekly_amount != null ? c.weekly_amount : c.daily_amount;

const sortCategoriesByAmount = (rows: TontineCategory[]): TontineCategory[] =>
  [...rows].sort((a, b) => effectiveCategoryAmount(a) - effectiveCategoryAmount(b));

export const fetchActiveCategories = async (): Promise<TontineCategory[]> => {
  const { data, error } = await supabase
    .from("tontine_categories" as any)
    .select("*")
    .eq("is_active", true);

  if (error) throw error;
  return sortCategoriesByAmount((data || []) as TontineCategory[]);
};

export const fetchAllCategories = async (): Promise<TontineCategory[]> => {
  const { data, error } = await supabase
    .from("tontine_categories" as any)
    .select("*");

  if (error) throw error;
  return sortCategoriesByAmount((data || []) as TontineCategory[]);
};

export const fetchMemberCategories = async (userId: string): Promise<MemberTontineCategory[]> => {
  const { data, error } = await supabase
    .from("member_tontine_categories" as any)
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) throw error;
  return (data || []) as MemberTontineCategory[];
};

export const memberSelectCategory = async (categoryId: string): Promise<string> => {
  const { data, error } = await supabase.rpc("member_select_tontine_category", {
    p_category_id: categoryId,
  });

  if (error) throw error;
  return data as string;
};

export const memberUnselectCategory = async (categoryId: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc("member_unselect_tontine_category", {
    p_category_id: categoryId,
  });

  if (error) throw error;
  return data as boolean;
};

// --- Cycles ---

export const fetchActiveCycle = async (): Promise<TontineCycle | null> => {
  const { data, error } = await supabase
    .from("tontine_cycles" as any)
    .select("*")
    .eq("status", "active")
    .limit(1);

  if (error) throw error;
  return data && data.length > 0 ? (data[0] as TontineCycle) : null;
};

// Member-facing cycle lookup: prefer the active cycle ("En cours"), otherwise
// fall back to the next planned/draft cycle ("Programmé"). Read-only, relies on
// the existing "select cycles for authenticated users" RLS policy.
export const fetchActiveOrPlannedCycle = async (): Promise<TontineCycle | null> => {
  const { data, error } = await supabase
    .from("tontine_cycles" as any)
    .select("*")
    .in("status", ["active", "planned", "draft"])
    .order("start_date", { ascending: true });

  if (error) throw error;
  const rows = (data || []) as TontineCycle[];
  const active = rows.find((c) => c.status === "active");
  if (active) return active;
  return rows.find((c) => c.status === "planned" || c.status === "draft") ?? null;
};

// --- Contributions ---

export const fetchMemberContributions = async (
  userId: string,
  limitNum = 50
): Promise<TontineContribution[]> => {
  const { data, error } = await supabase
    .from("tontine_contributions" as any)
    .select("*")
    .eq("user_id", userId)
    .order("due_date", { ascending: false })
    .limit(limitNum);

  if (error) throw error;
  return (data || []) as TontineContribution[];
};

// Contributions d'un membre pour un cycle donné (indicateurs du dashboard).
// Toutes les lignes user+cycle sont chargées en une seule requête puis filtrées
// par category_id côté client : le changement de catégorie recalcule les
// indicateurs sans nouvelle requête réseau.
export const fetchMemberCycleContributions = async (
  userId: string,
  cycleId: string
): Promise<TontineContribution[]> => {
  const { data, error } = await supabase
    .from("tontine_contributions" as any)
    .select("*")
    .eq("user_id", userId)
    .eq("cycle_id", cycleId)
    .order("due_date", { ascending: true });

  if (error) throw error;
  return (data || []) as TontineContribution[];
};

export const fetchAllContributions = async (filters?: {
  userId?: string;
  categoryId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<TontineContribution[]> => {
  let query = supabase.from("tontine_contributions" as any).select("*");

  if (filters?.userId && filters.userId !== "all") {
    query = query.eq("user_id", filters.userId);
  }
  if (filters?.categoryId && filters.categoryId !== "all") {
    query = query.eq("category_id", filters.categoryId);
  }
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.dateFrom) {
    query = query.gte("due_date", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("due_date", filters.dateTo);
  }

  const { data, error } = await query.order("due_date", { ascending: false });
  if (error) throw error;
  return (data || []) as TontineContribution[];
};

// --- Payment Methods ---

export const fetchPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const { data, error } = await supabase
    .from("payment_methods" as any)
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data || []) as PaymentMethod[];
};

export const fetchAllPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const { data, error } = await supabase
    .from("payment_methods" as any)
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data || []) as PaymentMethod[];
};

// --- Payments ---

// Member declares a payment for one of their own contributions.
// Goes through the SECURITY DEFINER RPC member_declare_tontine_payment: the
// frontend must NOT send user_id/category_id/cycle_id — the RPC derives them
// from the contribution itself after verifying it belongs to auth.uid().
// Returns the inserted payment id.
export const declareContributionPayment = async (payload: {
  contributionId: string;
  paymentMethodId: string;
  amount: number;
  paymentReference?: string;
  proofUrl?: string;
}): Promise<string> => {
  const { data, error } = await supabase.rpc("member_declare_tontine_payment", {
    p_contribution_id: payload.contributionId,
    p_payment_method_id: payload.paymentMethodId,
    p_amount: payload.amount,
    p_payment_reference: payload.paymentReference ?? null,
    p_proof_url: payload.proofUrl ?? null,
  });

  if (error) throw error;
  return data as string;
};

export const fetchMemberPayments = async (userId: string): Promise<ContributionPayment[]> => {
  const { data, error } = await supabase
    .from("contribution_payments" as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as ContributionPayment[];
};

export const fetchAllPayments = async (): Promise<ContributionPayment[]> => {
  const { data, error } = await supabase
    .from("contribution_payments" as any)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as ContributionPayment[];
};

// --- RPC Admin Calls ---

export const adminValidatePayment = async (
  paymentId: string,
  status: "paid" | "rejected" | "pending",
  adminNote: string
): Promise<boolean> => {
  const { data, error } = await supabase.rpc("admin_validate_tontine_payment", {
    p_payment_id: paymentId,
    p_status: status,
    p_admin_note: adminNote,
  });

  if (error) throw error;
  return data as boolean;
};

export const generateDailyContributions = async (targetDate: string): Promise<number> => {
  const { data, error } = await supabase.rpc("generate_daily_tontine_contributions", {
    p_target_date: targetDate,
  });

  if (error) throw error;
  return data as number;
};

export const closeDailyContributions = async (targetDate: string): Promise<number> => {
  const { data, error } = await supabase.rpc("close_daily_tontine_contributions", {
    p_target_date: targetDate,
  });

  if (error) throw error;
  return data as number;
};

// --- Weekly cadence (clean weekly model) ---
// The weekly RPCs are added by 20260616140000_create_tontine_weekly_functions.sql and are
// not yet in the generated Supabase types, hence the `rpc as any` cast. They mirror the
// daily ones but charge weekly_amount once per week (due_date = the week's due date).

export const generateWeeklyContributions = async (weekDueDate: string): Promise<number> => {
  const { data, error } = await (supabase.rpc as any)("generate_weekly_tontine_contributions", {
    p_week_due_date: weekDueDate,
  });

  if (error) throw error;
  return data as number;
};

// Service-role-only maintenance runner (used by the future cron / edge function). Exposed
// here for completeness; member/admin UI does not call it directly under RLS.
export const runWeeklyTontineMaintenance = async (
  generateDate: string,
  closeDate: string,
  dryRun = true
): Promise<unknown> => {
  const { data, error } = await (supabase.rpc as any)("run_weekly_tontine_maintenance", {
    p_generate_date: generateDate,
    p_close_date: closeDate,
    p_dry_run: dryRun,
  });

  if (error) throw error;
  return data;
};
