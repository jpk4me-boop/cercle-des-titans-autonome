import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Share, Plus } from "lucide-react";
import { toast } from "sonner";

// Minimal typing for the non-standard event (not in the TS DOM lib).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !(window as unknown as { MSStream?: unknown }).MSStream;

interface InstallAppButtonProps {
  className?: string;
  fullWidth?: boolean; // for the mobile menu
}

export default function InstallAppButton({ className, fullWidth }: InstallAppButtonProps) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHelpOpen, setIosHelpOpen] = useState(false);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Nothing to offer: already installed, or no Android prompt and not iOS.
  if (installed) return null;
  if (!deferred && !isIos()) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") toast.success("Application en cours d'installation…");
      setDeferred(null);
      return;
    }
    if (isIos()) setIosHelpOpen(true);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className={`border-gold/50 text-gold hover:bg-gold/10 ${fullWidth ? "w-full" : ""} ${className ?? ""}`}
      >
        <Download className="w-4 h-4 mr-2" />
        Installer l'application
      </Button>

      <Dialog open={iosHelpOpen} onOpenChange={setIosHelpOpen}>
        <DialogContent className="sm:max-w-sm border-gold/20 bg-gradient-to-br from-black/80 via-card to-card">
          <DialogHeader>
            <DialogTitle className="text-gold">Installer Cercle des Titans</DialogTitle>
            <DialogDescription>
              Ajoutez l'application à votre écran d'accueil iPhone/iPad.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm text-foreground">
            <li className="flex items-center gap-3">
              <Share className="h-5 w-5 text-gold shrink-0" />
              Touchez l'icône <strong>Partager</strong> en bas de Safari.
            </li>
            <li className="flex items-center gap-3">
              <Plus className="h-5 w-5 text-gold shrink-0" />
              Choisissez <strong>« Sur l'écran d'accueil »</strong>.
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
