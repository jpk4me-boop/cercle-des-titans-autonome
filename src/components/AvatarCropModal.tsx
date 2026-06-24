import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, ZoomIn, ZoomOut, Check, RotateCcw } from 'lucide-react';
import { cropImageToSquare, type CroppedImage } from '@/lib/imageCrop';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

interface AvatarCropModalProps {
  // Fichier image sélectionné par l'utilisateur (déjà validé : type + taille).
  file: File | null;
  open: boolean;
  // Poids maximal du résultat compressé (octets).
  maxBytes: number;
  // Désactive l'interface pendant l'upload du résultat.
  processing?: boolean;
  onCancel: () => void;
  onConfirm: (result: CroppedImage) => void;
}

// Modale de recadrage carré 1:1 (style « photo carte membre »).
// Pan par glisser-déposer, zoom au slider/molette, centrage automatique.
// Aucune dépendance externe : le rendu et l'export passent par <canvas>.
const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  file,
  open,
  maxBytes,
  processing = false,
  onCancel,
  onConfirm,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Source d'aperçu en data URL (et non blob URL) : évite l'erreur
  // ERR_FILE_NOT_FOUND quand le cleanup d'effet de React StrictMode révoque
  // l'URL blob alors que l'image est encore en cours de chargement.
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [viewport, setViewport] = useState(0); // côté carré rendu (px)
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imageReady, setImageReady] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Suivi du glisser : position pointeur de départ + offset initial.
  const dragState = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  // Mesure la taille réelle du carré de recadrage (responsive mobile/desktop).
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      if (viewportRef.current) {
        setViewport(viewportRef.current.offsetWidth);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open, imageReady]);

  // Étape 1 : lit le fichier en data URL (pas de blob URL à révoquer).
  useEffect(() => {
    setImageReady(false);
    setLoadError(null);
    imageRef.current = null;
    setImageSrc(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });

    if (!file || !open) return;

    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (cancelled) return;
      setImageSrc(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.onerror = () => {
      if (cancelled) return;
      setLoadError("Impossible de lire l'image sélectionnée.");
    };
    reader.readAsDataURL(file);

    return () => {
      cancelled = true;
    };
  }, [file, open]);

  // Étape 2 : décode la data URL en HTMLImageElement (rendu + export canvas).
  useEffect(() => {
    if (!imageSrc) return;

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      imageRef.current = image;
      setImageReady(true);
    };
    image.onerror = () => {
      if (cancelled) return;
      setLoadError("Impossible de charger l'image sélectionnée.");
    };
    image.src = imageSrc;

    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  const img = imageRef.current;

  // Échelle minimale couvrant le carré (comportement object-cover).
  const baseScale =
    img && viewport > 0 ? Math.max(viewport / img.naturalWidth, viewport / img.naturalHeight) : 1;
  const scale = baseScale * zoom;
  const dispW = img ? img.naturalWidth * scale : 0;
  const dispH = img ? img.naturalHeight * scale : 0;

  // Borne l'offset pour que l'image couvre toujours le carré (pas de vide).
  const clampOffset = useCallback(
    (x: number, y: number) => {
      const maxX = Math.max(0, (dispW - viewport) / 2);
      const maxY = Math.max(0, (dispH - viewport) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      };
    },
    [dispW, dispH, viewport],
  );

  // Re-borne l'offset après chaque changement de zoom/taille.
  useEffect(() => {
    setOffset((prev) => clampOffset(prev.x, prev.y));
  }, [clampOffset]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!imageReady || processing || exporting) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setOffset(clampOffset(dragState.current.baseX + dx, dragState.current.baseY + dy));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!imageReady) return;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom - e.deltaY * 0.0015));
    setZoom(next);
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleConfirm = async () => {
    if (!img || viewport <= 0) return;
    setExporting(true);
    try {
      // Conversion coordonnées écran -> coordonnées source.
      const imgLeft = (viewport - dispW) / 2 + offset.x;
      const imgTop = (viewport - dispH) / 2 + offset.y;
      const sx = Math.max(0, -imgLeft / scale);
      const sy = Math.max(0, -imgTop / scale);
      const sourceSquare = Math.min(viewport / scale, img.naturalWidth - sx, img.naturalHeight - sy);

      const result = await cropImageToSquare(
        img,
        { sx, sy, size: sourceSquare },
        maxBytes,
      );
      onConfirm(result);
    } catch (err) {
      console.error('Avatar crop failed:', err);
      setLoadError(err instanceof Error ? err.message : 'Recadrage impossible.');
    } finally {
      setExporting(false);
    }
  };

  const busy = processing || exporting;

  // Position CSS de l'image dans le carré (centrée + offset).
  const imgStyle: React.CSSProperties = img
    ? {
        width: dispW,
        height: dispH,
        left: (viewport - dispW) / 2 + offset.x,
        top: (viewport - dispH) / 2 + offset.y,
      }
    : {};

  return (
    <Dialog open={open} onOpenChange={(value) => !value && !busy && onCancel()}>
      <DialogContent className="max-w-md border-gold/30 bg-gradient-to-b from-card to-background shadow-[0_0_60px_rgba(212,175,55,0.12)]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">
            Ajustez votre photo avant de l'enregistrer
          </DialogTitle>
          <DialogDescription>
            Déplacez et zoomez pour cadrer votre visage. Le format carré garantit un rendu net et premium.
          </DialogDescription>
        </DialogHeader>

        {loadError ? (
          <div className="py-8 text-center text-sm text-destructive">{loadError}</div>
        ) : (
          <div className="space-y-5">
            {/* Zone de recadrage carrée */}
            <div className="flex justify-center">
              <div
                ref={viewportRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onWheel={handleWheel}
                className="relative aspect-square w-full max-w-[300px] cursor-grab touch-none select-none overflow-hidden rounded-2xl border border-gold/40 bg-black/40 shadow-inner active:cursor-grabbing ring-2 ring-gold/20 ring-offset-2 ring-offset-background"
              >
                {imageReady && img ? (
                  <img
                    src={imageSrc ?? undefined}
                    alt="Aperçu à recadrer"
                    draggable={false}
                    style={imgStyle}
                    className="pointer-events-none absolute max-w-none select-none"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-gold" />
                  </div>
                )}

                {/* Repère circulaire premium par-dessus le carré */}
                {imageReady && (
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-3 rounded-full border-2 border-gold/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                  </div>
                )}
              </div>
            </div>

            {/* Contrôle de zoom */}
            <div className="flex items-center gap-3 px-1">
              <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Slider
                value={[zoom]}
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                onValueChange={(v) => setZoom(v[0])}
                disabled={!imageReady || busy}
                aria-label="Zoom"
              />
              <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleReset}
                disabled={!imageReady || busy}
                aria-label="Réinitialiser le cadrage"
                className="shrink-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={busy}>
                Annuler
              </Button>
              <Button
                type="button"
                className="flex-1 bg-gold text-background hover:bg-gold/90"
                onClick={handleConfirm}
                disabled={!imageReady || busy}
              >
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Enregistrer la photo
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AvatarCropModal;
