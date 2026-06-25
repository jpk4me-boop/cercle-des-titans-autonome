import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent } from "@/lib/analyticsTracker";

// Phase 4C-A — Suivi des pages vues (anonyme). À monter UNE seule fois DANS
// le BrowserRouter (useLocation a besoin du contexte Router).
//
// On n'envoie que le pathname (location.pathname), jamais la query string.
// Un dédoublonnage simple par path évite les doublons inutiles (re-rendus,
// double-montage StrictMode en dev).

export const usePageViewTracker = (): void => {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname; // sans query string
    if (lastPath.current === path) return;
    lastPath.current = path;
    void trackEvent("page_view", { path });
  }, [location.pathname]);
};
