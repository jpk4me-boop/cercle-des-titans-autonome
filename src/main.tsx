import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Récupération des chunks obsolètes : après un déploiement, un onglet ouvert sur
// l'ancienne version peut tenter de charger un chunk lazy dont le hash n'existe
// plus (ChunkLoadError / "Failed to fetch dynamically imported module").
// Vite émet alors "vite:preloadError" : on recharge une seule fois pour
// récupérer le nouvel index.html (garde sessionStorage contre toute boucle).
window.addEventListener("vite:preloadError", (event) => {
  const RELOAD_FLAG = "chunk-reload-attempted";
  if (sessionStorage.getItem(RELOAD_FLAG)) return;
  sessionStorage.setItem(RELOAD_FLAG, "1");
  event.preventDefault();
  window.location.reload();
});
// Chargement réussi : on réarme la garde pour les prochains déploiements.
window.addEventListener("load", () => {
  sessionStorage.removeItem("chunk-reload-attempted");
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
