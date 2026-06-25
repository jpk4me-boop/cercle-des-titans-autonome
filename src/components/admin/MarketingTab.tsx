import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Download,
  Loader2,
  Megaphone,
  QrCode,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

// Section Admin → Marketing.
// Pour l'instant : carte « QR Code du site ». Le QR est généré entièrement
// côté client via la librairie `qrcode` (aucun service externe) → fonctionne
// hors ligne après build.

const SITE_URL = "https://cercledestitans.com";
const QR_FILENAME = "cercle-des-titans-qr.png";

export default function MarketingTab() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(SITE_URL, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0a0a0a", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((error) => {
        console.error("Erreur de génération du QR code:", error);
        if (!cancelled) toast.error("Impossible de générer le QR code");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      toast.success("Lien copié dans le presse-papiers");
    } catch {
      toast.error("Copie impossible sur cet appareil");
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = QR_FILENAME;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareWhatsApp = () => {
    const text = `Scannez ce QR code pour découvrir Cercle des Titans. ${SITE_URL}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête de section */}
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
          <Megaphone className="h-5 w-5 text-gold" />
          Marketing
        </h2>
        <p className="text-sm text-muted-foreground">
          Outils de promotion du Cercle des Titans.
        </p>
      </div>

      {/* Carte QR Code du site (glassmorphism, liseré or) */}
      <Card className="relative max-w-xl overflow-hidden border-border bg-card/60 backdrop-blur-sm transition-colors hover:border-gold/30">
        {/* Liseré or décoratif (luxe sombre) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <QrCode className="h-5 w-5 text-gold" />
          <CardTitle className="text-base">QR Code du site</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Visuel QR — fond clair pour garantir la lisibilité au scan */}
          <div className="flex justify-center">
            <div className="rounded-2xl border border-gold/20 bg-white p-4 shadow-lg shadow-black/20">
              {loading ? (
                <div className="flex h-48 w-48 items-center justify-center sm:h-56 sm:w-56">
                  <Loader2 className="h-8 w-8 animate-spin text-gold" />
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR code vers cercledestitans.com"
                  className="h-48 w-48 sm:h-56 sm:w-56"
                  width={224}
                  height={224}
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center text-center text-xs text-muted-foreground sm:h-56 sm:w-56">
                  QR indisponible
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Scannez ce QR code pour découvrir Cercle des Titans.
          </p>

          {/* Lien affiché */}
          <p className="break-all text-center font-mono text-xs text-gold/80">
            {SITE_URL}
          </p>

          {/* Actions — responsive : empilées sur mobile, alignées en desktop */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2 border-gold/30 hover:border-gold/50 hover:bg-gold/5"
            >
              <Copy className="h-4 w-4" />
              Copier le lien
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className="gap-2 border-gold/30 hover:border-gold/50 hover:bg-gold/5"
            >
              <Download className="h-4 w-4" />
              Télécharger le QR Code
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="gap-2 border-gold/30 hover:border-gold/50 hover:bg-gold/5"
            >
              <Share2 className="h-4 w-4" />
              Partager sur WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
