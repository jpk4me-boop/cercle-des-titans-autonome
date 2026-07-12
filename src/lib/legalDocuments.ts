import { supabase } from "@/integrations/supabase/client";

// Phase J4 — Versions des documents juridiques et consentement à l'inscription.
//
// Le SERVEUR est autoritaire : le cutoff (legal_consent_config.enforced_from)
// et le statut de consentement sont calculés côté SQL par la RPC
// get_current_legal_consent_status(), à partir de auth.uid() uniquement.
// Le frontend ne compare jamais de dates de création de compte.
//
// Les versions ci-dessous sont celles AFFICHÉES à l'utilisateur ; la RPC
// d'enregistrement les compare strictement à la configuration serveur. Toute
// évolution juridique doit être répercutée ici ET dans une nouvelle migration.

export const CGU_VERSION = "2026-07-11";
export const PRIVACY_POLICY_VERSION = "2026-07-11";

/** Libellé affiché sous la case de consentement. */
export const LEGAL_VERSIONS_LABEL = "Versions du 11 juillet 2026.";

export type OAuthConsentProvider = "google" | "github";

/**
 * Marqueurs transmis dans options.data de signUp (lus par le trigger SQL,
 * qui compare aux versions de la configuration serveur et impose lui-même la
 * source 'email_signup').
 */
export const buildSignupConsentMetadata = () => ({
  legal_consent: true,
  terms_version: CGU_VERSION,
  privacy_policy_version: PRIVACY_POLICY_VERSION,
});

// --- Marqueur temporaire du parcours OAuth ------------------------------------
// Purement CONTEXTUEL : posé avant la redirection OAuth (mode inscription), il
// sert uniquement à afficher une note sur l'écran d'acceptation de la garde.
// Il ne constitue jamais une preuve et ne déclenche aucune acceptation
// silencieuse (il ne peut pas relier techniquement le callback à une
// identité). Supprimé après succès de l'acceptation, expiration (30 min) ou
// annulation confirmée (erreur OAuth, « Utiliser un autre compte »).
// Jamais de localStorage. started_at limite la durée de vie du flux : ce
// n'est JAMAIS la date juridique d'acceptation, qui est now() côté SQL.

const PENDING_CONSENT_KEY = "pending_legal_consent";
const PENDING_CONSENT_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface PendingOAuthConsent {
  terms_version: string;
  privacy_policy_version: string;
  provider: OAuthConsentProvider;
  flow_id: string;
  started_at: number;
}

export const storePendingOAuthConsent = (provider: OAuthConsentProvider): void => {
  try {
    const pending: PendingOAuthConsent = {
      terms_version: CGU_VERSION,
      privacy_policy_version: PRIVACY_POLICY_VERSION,
      provider,
      flow_id: crypto.randomUUID(),
      started_at: Date.now(),
    };
    sessionStorage.setItem(PENDING_CONSENT_KEY, JSON.stringify(pending));
  } catch {
    // sessionStorage ou crypto indisponible : sans marqueur, la garde
    // exigera de toute façon l'acceptation explicite.
  }
};

export const clearPendingOAuthConsent = (): void => {
  try {
    sessionStorage.removeItem(PENDING_CONSENT_KEY);
  } catch {
    // Ignoré : stockage indisponible.
  }
};

export type PendingOAuthConsentState =
  | { state: "none" }
  | { state: "expired" }
  | { state: "pending"; provider: OAuthConsentProvider };

const isValidPendingShape = (value: unknown): value is PendingOAuthConsent => {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Partial<PendingOAuthConsent>;
  return (
    p.terms_version === CGU_VERSION &&
    p.privacy_policy_version === PRIVACY_POLICY_VERSION &&
    (p.provider === "google" || p.provider === "github") &&
    typeof p.flow_id === "string" &&
    p.flow_id.length > 0 &&
    typeof p.started_at === "number"
  );
};

/**
 * Lit le marqueur temporaire sans le consommer. Un marqueur corrompu ou plus
 * vieux que 30 minutes est signalé "expired" : l'appelant doit le supprimer.
 */
export const getPendingOAuthConsent = (): PendingOAuthConsentState => {
  try {
    const raw = sessionStorage.getItem(PENDING_CONSENT_KEY);
    if (!raw) return { state: "none" };

    const parsed: unknown = JSON.parse(raw);
    if (!isValidPendingShape(parsed)) return { state: "expired" };

    const age = Date.now() - parsed.started_at;
    if (age < 0 || age > PENDING_CONSENT_TTL_MS) return { state: "expired" };

    return { state: "pending", provider: parsed.provider };
  } catch {
    return { state: "none" };
  }
};

// --- RPC typées localement -----------------------------------------------------
// Les fonctions user_legal_consents ne sont pas encore dans les types Supabase
// générés ; on les type localement, sans `any`.
//
// IMPORTANT : `rpc` est une MÉTHODE du client Supabase. Elle doit toujours être
// appelée sur l'objet (`client.rpc(...)`) — jamais extraite dans une variable
// (`const rpc = supabase.rpc; rpc(...)`) : l'appel détaché perd `this` et lève
// un TypeError avant tout appel réseau (incident production du 12/07/2026).

type GetLegalConsentStatusRpc = (
  fn: "get_current_legal_consent_status",
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

type RecordLegalConsentRpc = (
  fn: "record_legal_consent",
  args: { _terms_version: string; _privacy_policy_version: string },
) => PromiseLike<{ error: { message: string } | null }>;

export type LegalConsentStatus = "legacy" | "granted" | "missing" | "error";

/**
 * Statut de consentement de l'utilisateur COURANT, calculé côté serveur
 * (RPC SECURITY DEFINER : auth.uid(), auth.users.created_at,
 * legal_consent_config.enforced_from). "error" couvre l'échec de la RPC comme
 * toute valeur inattendue : la garde doit alors BLOQUER l'accès — jamais
 * laisser passer sans preuve, jamais afficher l'étape d'acceptation sur une
 * simple panne.
 */
export const fetchCurrentLegalConsentStatus = async (): Promise<LegalConsentStatus> => {
  try {
    const client = supabase as unknown as { rpc: GetLegalConsentStatusRpc };
    const { data, error } = await client.rpc("get_current_legal_consent_status");
    if (error) return "error";
    if (data === "legacy" || data === "granted" || data === "missing") {
      return data;
    }
    return "error";
  } catch {
    return "error";
  }
};

export type RecordConsentResult = { success: true } | { success: false; error: string };

/**
 * Enregistre le consentement de l'utilisateur COURANT via la RPC SECURITY
 * DEFINER (auth.uid() et now() côté serveur, versions comparées à la
 * configuration serveur, source imposée 'account_gate'). Idempotente côté
 * SQL. Ne touche pas au marqueur temporaire : sa suppression relève de
 * l'appelant, uniquement après un succès confirmé.
 */
export const recordCurrentLegalConsent = async (): Promise<RecordConsentResult> => {
  try {
    const client = supabase as unknown as { rpc: RecordLegalConsentRpc };
    const { error } = await client.rpc("record_legal_consent", {
      _terms_version: CGU_VERSION,
      _privacy_policy_version: PRIVACY_POLICY_VERSION,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur réseau inattendue",
    };
  }
};
