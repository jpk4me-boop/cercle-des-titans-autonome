import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCw, ScrollText, LogOut } from "lucide-react";
import LegalConsentField from "@/components/auth/LegalConsentField";
import {
  clearPendingOAuthConsent,
  fetchCurrentLegalConsentStatus,
  getPendingOAuthConsent,
  recordCurrentLegalConsent,
} from "@/lib/legalDocuments";

// Phase J4 — Garde globale de consentement CGU/confidentialité.
//
// Montée comme route-layout autour de TOUTES les routes privées (App.tsx) :
// elle rend <Outlet /> uniquement quand l'accès est autorisé.
//
// Le SERVEUR est autoritaire : pour tout utilisateur authentifié, la RPC
// get_current_legal_consent_status() calcule le statut à partir de
// auth.uid(), auth.users.created_at et legal_consent_config.enforced_from.
// * 'legacy'  (compte antérieur à l'activation) → accès autorisé ;
// * 'granted' (preuve présente pour les versions courantes) → accès autorisé ;
// * 'missing' → étape d'acceptation obligatoire (case jamais précochée),
//   RPC record_legal_consent, puis REVÉRIFICATION serveur avant de rendre
//   la route ;
// * 'error'   → accès bloqué + « Réessayer » (fail-closed).
// Tant que la vérification est en cours, la route protégée n'est JAMAIS
// rendue. Utilisateur non authentifié → garde transparente (les pages/gardes
// existantes gèrent leur propre redirection).
//
// Le marqueur temporaire OAuth (sessionStorage) est purement contextuel : il
// ne constitue jamais une preuve et ne déclenche aucun enregistrement
// silencieux. Il est purgé après succès, expiration ou abandon explicite.
//
// Protection contre les réponses asynchrones obsolètes : chaque évaluation
// porte un identifiant (evaluationIdRef) ; toute réponse arrivant après un
// changement de compte ou une évaluation plus récente est ignorée.

type GuardStatus = "checking" | "allowed" | "consent" | "error";

export default function LegalConsentGuard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<GuardStatus>("checking");
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentSubmitting, setConsentSubmitting] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [consentNotice, setConsentNotice] = useState<string | null>(null);

  const evaluationIdRef = useRef(0);

  const userId = user?.id ?? null;

  const evaluate = useCallback(async () => {
    // Nouvelle évaluation : invalide toute réponse encore en vol et repart
    // d'un état propre (aucune notice/erreur/case d'un ancien compte).
    evaluationIdRef.current += 1;
    const evaluationId = evaluationIdRef.current;

    setConsentNotice(null);
    setConsentError(null);
    setConsentChecked(false);
    setConsentSubmitting(false);

    // Auth non résolue : on attend (écran de chargement).
    if (loading) {
      setStatus("checking");
      return;
    }

    // Non authentifié : garde transparente.
    if (!user) {
      setStatus("allowed");
      return;
    }

    setStatus("checking");
    const consentStatus = await fetchCurrentLegalConsentStatus();
    if (evaluationIdRef.current !== evaluationId) return; // réponse obsolète

    if (consentStatus === "legacy" || consentStatus === "granted") {
      // Accès autorisé : un éventuel marqueur OAuth restant n'a plus d'objet.
      clearPendingOAuthConsent();
      setStatus("allowed");
      return;
    }

    if (consentStatus === "error") {
      setStatus("error");
      return;
    }

    // 'missing' : étape d'acceptation obligatoire. Le marqueur OAuth éventuel
    // est purement contextuel (note affichée) ; un marqueur périmé est purgé.
    const pending = getPendingOAuthConsent();
    if (pending.state === "expired") {
      clearPendingOAuthConsent();
      setConsentNotice(
        "Votre parcours d'inscription a expiré. Merci de confirmer votre acceptation pour ce compte.",
      );
    } else if (pending.state === "pending") {
      setConsentNotice(
        "Vous avez accepté nos documents avant la redirection. Confirmez une dernière fois pour le compte affiché ci-dessous.",
      );
    }
    setStatus("consent");
  }, [loading, user]);

  useEffect(() => {
    void evaluate();
    // Re-évalue à chaque changement d'utilisateur (connexion, déconnexion,
    // changement de compte) : le consentement n'est jamais reporté d'une
    // session sur une autre.
  }, [evaluate, userId]);

  // Acceptation : RPC sécurisée (auth.uid(), now(), versions comparées à la
  // configuration serveur), puis REVÉRIFICATION serveur avant d'accorder
  // l'accès. Ignorée si le compte a changé pendant l'appel.
  const handleConsentSubmit = async () => {
    if (!consentChecked || consentSubmitting) return;
    const evaluationId = evaluationIdRef.current;
    setConsentSubmitting(true);
    setConsentError(null);

    const result = await recordCurrentLegalConsent();
    if (evaluationIdRef.current !== evaluationId) return; // compte changé

    if (!result.success) {
      if (import.meta.env.DEV) {
        console.error("[LegalConsentGuard] RPC failed:", result.error);
      }
      setConsentError(
        "L'enregistrement de votre acceptation a échoué. Veuillez réessayer dans quelques instants.",
      );
      setConsentSubmitting(false);
      return;
    }

    const verified = await fetchCurrentLegalConsentStatus();
    if (evaluationIdRef.current !== evaluationId) return; // compte changé

    if (verified === "granted") {
      clearPendingOAuthConsent();
      setConsentSubmitting(false);
      setStatus("allowed");
      return;
    }

    setConsentError(
      "Votre acceptation n'a pas pu être confirmée. Veuillez réessayer.",
    );
    setConsentSubmitting(false);
  };

  // « Utiliser un autre compte » : abandon explicite du flux → le marqueur
  // temporaire est supprimé, la session fermée, retour à la connexion.
  const handleSignOut = async () => {
    clearPendingOAuthConsent();
    await signOut();
    navigate("/auth", { replace: true });
  };

  if (status === "allowed") {
    return <Outlet />;
  }

  if (status === "consent") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ScrollText className="w-8 h-8 text-primary" />
            </div>

            <h1 className="text-xl font-bold text-foreground mb-2 text-center">
              Une dernière étape
            </h1>

            <p className="text-muted-foreground mb-2 text-center">
              Pour finaliser la création de votre compte, veuillez accepter nos
              documents juridiques.
            </p>

            {user?.email && (
              <p className="text-sm text-center mb-6">
                <span className="text-muted-foreground">Compte connecté : </span>
                <span className="text-foreground font-medium break-all">{user.email}</span>
              </p>
            )}

            {consentNotice && (
              <p className="text-sm text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 mb-6">
                {consentNotice}
              </p>
            )}

            <LegalConsentField checked={consentChecked} onCheckedChange={setConsentChecked} />

            {consentError && (
              <p className="text-sm text-destructive flex items-center gap-2 mt-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {consentError}
              </p>
            )}

            <Button
              onClick={handleConsentSubmit}
              disabled={!consentChecked || consentSubmitting}
              className="w-full mt-6"
            >
              {consentSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Accepter et continuer
            </Button>

            <Button
              variant="outline"
              onClick={handleSignOut}
              disabled={consentSubmitting}
              className="w-full mt-3"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Utiliser un autre compte
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-card border border-destructive/30 rounded-2xl p-8 shadow-lg">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>

            <h1 className="text-xl font-bold text-foreground mb-2">
              Vérification impossible
            </h1>

            <p className="text-muted-foreground mb-6">
              Nous n'avons pas pu vérifier l'acceptation de nos documents
              juridiques pour votre compte. Veuillez réessayer.
            </p>

            <div className="space-y-3">
              <Button onClick={() => void evaluate()} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>

              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Utiliser un autre compte
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // status === "checking" : la route protégée n'est jamais rendue avant la
  // confirmation.
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
