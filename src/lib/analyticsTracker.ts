import { supabase } from "@/integrations/supabase/client";

// Phase 4C — Tracker analytics anonyme (pas de Realtime, pas de service externe).
//
// On réutilise le MÊME identifiant de session anonyme que le heartbeat de
// présence (clé localStorage presence_session_id, UUID v4). On n'envoie QUE :
//   - session_id (anonyme)
//   - event_type (whitelist)
//   - path (pathname seul, sans query string)
//   - label / source éventuels (constantes de code — non utilisés en 4C-A)
// Le user_id est déduit côté serveur via auth.uid(). created_at est posé par la
// base. JAMAIS d'IP, de user-agent, de referrer brut, de query string, d'email,
// de téléphone ni de contenu de formulaire.

const STORAGE_KEY = "presence_session_id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Génère un UUID v4 valide (crypto.randomUUID, sinon getRandomValues). */
const generateUuid = (): string | null => {
  if (typeof crypto === "undefined") return null;

  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  if (typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    return (
      `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-` +
      `${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-` +
      `${hex.slice(10, 16).join("")}`
    );
  }

  return null;
};

/**
 * Récupère/crée l'identifiant de session anonyme partagé avec le heartbeat.
 * Une valeur absente OU invalide est régénérée puis réécrite. Retourne null si
 * localStorage est inaccessible ou si aucun générateur UUID fiable n'existe.
 */
const getSessionId = (): string | null => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && UUID_RE.test(existing)) {
      return existing;
    }

    const id = generateUuid();
    if (!id) return null;

    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return null;
  }
};

// --- Détection / normalisation de la source d'acquisition --------------------
// On ne stocke QUE la valeur normalisée (whitelist ci-dessous). JAMAIS l'URL
// referrer complète, le hostname brut ni la query string.

const SOURCE_KEY = "analytics_source";

type AnalyticsSource =
  | "direct"
  | "whatsapp"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "google"
  | "referral"
  | "unknown";

const VALID_SOURCES: readonly AnalyticsSource[] = [
  "direct",
  "whatsapp",
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
  "linkedin",
  "google",
  "referral",
  "unknown",
];

/** Garde de type : la valeur appartient-elle à la whitelist des sources ? */
const isValidSource = (value: unknown): value is AnalyticsSource =>
  typeof value === "string" &&
  (VALID_SOURCES as readonly string[]).includes(value);

/** Mappe un fragment (utm_source ou hostname) vers la whitelist, sinon null. */
const matchNetwork = (value: string): AnalyticsSource | null => {
  const v = value.toLowerCase();
  if (v.includes("whatsapp") || v.includes("wa.me")) return "whatsapp";
  if (v.includes("facebook") || v === "fb" || v.includes("fb.")) return "facebook";
  if (v.includes("instagram") || v === "ig") return "instagram";
  if (v.includes("tiktok")) return "tiktok";
  if (v.includes("youtube") || v.includes("youtu.be")) return "youtube";
  if (v.includes("linkedin") || v.includes("lnkd.in")) return "linkedin";
  if (v.includes("google")) return "google";
  return null;
};

/** Calcule la source normalisée à partir de utm_source puis du referrer. */
const detectSource = (): AnalyticsSource => {
  try {
    // 1) utm_source : on lit UNIQUEMENT ce paramètre, pas la query string.
    const utm = new URLSearchParams(window.location.search).get("utm_source");
    if (utm) {
      return matchNetwork(utm) ?? "unknown";
    }

    // 2) referrer : on n'exploite que le hostname, jamais l'URL complète.
    const referrer = document.referrer;
    if (!referrer) return "direct";

    const host = new URL(referrer).hostname;
    if (host === window.location.hostname) return "direct"; // navigation interne
    return matchNetwork(host) ?? "referral";
  } catch {
    return "unknown";
  }
};

/** Source d'acquisition figée pour la session (mémorisée en sessionStorage). */
const getSource = (): AnalyticsSource => {
  try {
    const cached = sessionStorage.getItem(SOURCE_KEY);
    // On n'utilise la valeur stockée que si elle appartient à la whitelist.
    if (isValidSource(cached)) return cached;

    // Absente ou invalide : on recalcule et on réécrit une source valide.
    const source = detectSource();
    sessionStorage.setItem(SOURCE_KEY, source);
    return source;
  } catch {
    // sessionStorage indisponible : recalcul best-effort sans cache.
    return detectSource();
  }
};

export type AnalyticsEventType = "page_view" | "click" | "conversion";

interface TrackOptions {
  /** Pathname seul (jamais la query string). */
  path?: string;
  /** Identifiant d'action stable défini dans le code (jamais une saisie). */
  label?: string;
}

/**
 * Enregistre un événement analytics anonyme via la RPC sécurisée. Best-effort :
 * toute erreur (RPC absente avant migration, réseau, hors-ligne) est ignorée
 * silencieusement pour ne jamais perturber l'expérience.
 */
export const trackEvent = async (
  type: AnalyticsEventType,
  options: TrackOptions = {},
): Promise<void> => {
  const sessionId = getSessionId();
  if (!sessionId) return;

  try {
    await (supabase.rpc as any)("record_analytics_event", {
      _session_id: sessionId,
      _event_type: type,
      _path: options.path ?? null,
      _label: options.label ?? null,
      _source: getSource(),
    });
  } catch {
    // Analytics best-effort : on n'interrompt jamais le rendu.
  }
};
