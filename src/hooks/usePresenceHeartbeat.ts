import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// Phase 4B — Présence en ligne (heartbeat léger, pas de Realtime).
//
// Le navigateur génère un session_id ALÉATOIRE (UUID en localStorage). On envoie
// uniquement ce session_id à la RPC record_presence toutes les 60 s ; le user_id
// est déduit côté serveur via auth.uid() (NULL pour un visiteur anonyme).
// Aucune donnée personnelle (ni IP, ni user-agent, ni pays, ni fingerprint).

const STORAGE_KEY = "presence_session_id";
const PING_INTERVAL_MS = 60_000; // 60 s

// La RPC record_presence attend un uuid valide. On valide strictement la
// valeur stockée et on ne génère que de vrais UUID v4.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Génère un UUID v4 valide. Priorité à crypto.randomUUID() ; sinon repli sur
 * crypto.getRandomValues. Retourne null si aucun générateur fiable n'est
 * disponible (on préfère ne rien envoyer plutôt qu'un faux UUID).
 */
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
 * Récupère ou crée l'identifiant de session anonyme (UUID v4 valide).
 * Une valeur localStorage absente OU invalide est régénérée puis réécrite.
 * Retourne null si localStorage est inaccessible ou si aucun générateur UUID
 * fiable n'existe.
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
    // localStorage indisponible (navigation privée stricte) : on n'insiste pas.
    return null;
  }
};

/**
 * Heartbeat de présence. À monter UNE seule fois au niveau racine (sous
 * AuthProvider). Fonctionne pour anon et authenticated ; un changement d'auth
 * (login/logout) relance immédiatement un ping pour rafraîchir le user_id
 * côté serveur.
 */
export const usePresenceHeartbeat = (): void => {
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    // Attend la résolution initiale de l'auth pour que le premier ping porte
    // déjà le bon JWT (visiteur vs membre).
    if (loading) return;

    const sessionId = getSessionId();
    if (!sessionId) return;

    let cancelled = false;

    const ping = async () => {
      try {
        await (supabase.rpc as any)("record_presence", {
          _session_id: sessionId,
        });
      } catch {
        // Présence best-effort : on ignore silencieusement les erreurs réseau.
      }
    };

    // Ping immédiat (et à chaque bascule d'auth via la dépendance userId),
    // puis toutes les 60 s.
    ping();
    const interval = window.setInterval(() => {
      if (!cancelled) ping();
    }, PING_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [loading, userId]);
};
