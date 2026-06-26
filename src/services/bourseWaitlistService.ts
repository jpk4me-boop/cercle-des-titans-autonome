import { supabase } from "@/integrations/supabase/client";

/**
 * Service liste d'attente « Bourse Rentrée Titans 2026 » (Phase B2S-2).
 *
 * Source unique des libellés de formules et de statuts, et seul point d'accès à
 * la table `bourse_rentree_waitlist`. La table n'étant pas dans les types
 * Supabase générés, on utilise le cast `(supabase as any)` — même motif que
 * `analyticsService` / `tontineService`.
 *
 * Aucune écriture vers d'autres tables ; aucun paiement, aucune cotisation.
 */

// --- Formules autorisées (doivent rester alignées sur le CHECK SQL) ---
export type WaitlistPlan =
  | "serenite"
  | "excellence"
  | "prestige_scolaire"
  | "undecided";

export const WAITLIST_PLANS: { value: WaitlistPlan; label: string }[] = [
  { value: "serenite", label: "Sérénité" },
  { value: "excellence", label: "Excellence" },
  { value: "prestige_scolaire", label: "Prestige Scolaire" },
  { value: "undecided", label: "Je ne sais pas encore" },
];

export const planLabel = (value: string): string =>
  WAITLIST_PLANS.find((p) => p.value === value)?.label ?? value;

// --- Statuts admin (alignés sur le CHECK SQL) ---
export type WaitlistStatus =
  | "new"
  | "contacted"
  | "converted"
  | "declined"
  | "archived";

export const WAITLIST_STATUSES: { value: WaitlistStatus; label: string }[] = [
  { value: "new", label: "Nouveau" },
  { value: "contacted", label: "Contacté" },
  { value: "converted", label: "Converti" },
  { value: "declined", label: "Décliné" },
  { value: "archived", label: "Archivé" },
];

export const statusLabel = (value: string): string =>
  WAITLIST_STATUSES.find((s) => s.value === value)?.label ?? value;

/** Ligne telle que lue côté admin. */
export interface WaitlistEntry {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  city: string | null;
  plan_interest: WaitlistPlan;
  message: string | null;
  status: WaitlistStatus;
  created_at: string;
  updated_at: string;
}

/** Payload de soumission publique (avant nettoyage). */
export interface WaitlistSubmission {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  planInterest: WaitlistPlan;
  message: string;
  consent: boolean;
}

export type SubmitResult =
  | { ok: true }
  | { ok: true; duplicate: true }
  | { ok: false; message: string };

/** Convertit une chaîne vide/espaces en null (champs optionnels). */
const emptyToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Insert public d'une demande de liste d'attente.
 *
 * - email / city / message vides → null ;
 * - insert SANS `.select()` (anon n'a aucune policy SELECT) ;
 * - doublon (phone, plan_interest) → code 23505 traité comme « déjà inscrit » ;
 * - aucune erreur technique n'est propagée au visiteur.
 */
export const submitWaitlist = async (
  data: WaitlistSubmission,
): Promise<SubmitResult> => {
  const payload = {
    full_name: data.fullName.trim(),
    phone: data.phone.trim(),
    email: emptyToNull(data.email),
    city: emptyToNull(data.city),
    plan_interest: data.planInterest,
    message: emptyToNull(data.message),
    consent: data.consent,
    status: "new" as const,
  };

  // Pas de `.select()` : la policy RLS n'autorise pas anon à relire la ligne.
  const { error } = await (supabase as any)
    .from("bourse_rentree_waitlist")
    .insert(payload);

  if (error) {
    // 23505 = violation d'unicité (phone + plan_interest) → déjà enregistré.
    if (error.code === "23505") {
      return { ok: true, duplicate: true };
    }
    // Anti-spam (A2.2) : le trigger de rate limiting lève 'rate_limited'
    // (ERRCODE P0001) → message propre, sans détail technique.
    if ((error.message ?? "").toLowerCase().includes("rate_limited")) {
      return {
        ok: false,
        message: "Trop de tentatives, réessayez dans quelques minutes.",
      };
    }
    // On logge pour le debug interne, jamais affiché au visiteur.
    console.error("submitWaitlist error:", error);
    return {
      ok: false,
      message:
        "Une difficulté est survenue lors de l'enregistrement. Veuillez réessayer dans un instant.",
    };
  }

  return { ok: true };
};

/** Liste récente (admin). RLS garantit l'accès admin/super_admin uniquement. */
export const fetchWaitlist = async (limit = 100): Promise<WaitlistEntry[]> => {
  const { data, error } = await (supabase as any)
    .from("bourse_rentree_waitlist")
    .select(
      "id, full_name, phone, email, city, plan_interest, message, status, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as WaitlistEntry[];
};

export interface WaitlistStats {
  total: number;
  byPlan: Record<WaitlistPlan, number>;
}

/** Agrégats simples calculés depuis les lignes lues (admin). */
export const computeStats = (entries: WaitlistEntry[]): WaitlistStats => {
  const byPlan: Record<WaitlistPlan, number> = {
    serenite: 0,
    excellence: 0,
    prestige_scolaire: 0,
    undecided: 0,
  };
  for (const e of entries) {
    if (e.plan_interest in byPlan) byPlan[e.plan_interest] += 1;
  }
  return { total: entries.length, byPlan };
};

/** Met à jour le statut d'une demande (admin). */
export const updateWaitlistStatus = async (
  id: string,
  status: WaitlistStatus,
): Promise<void> => {
  const { error } = await (supabase as any)
    .from("bourse_rentree_waitlist")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
};
