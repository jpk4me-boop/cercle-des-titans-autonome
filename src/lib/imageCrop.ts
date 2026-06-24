// Recadrage / compression d'avatar côté client, sans dépendance externe.
// Tout passe par <canvas> : on dessine la portion carrée choisie par le membre
// puis on exporte en image compressée (WebP si supporté, sinon JPEG) afin de
// garantir un rendu propre 1:1 et un poids maîtrisé (< 2 Mo).

export interface CropArea {
  // Coordonnées source (en pixels de l'image d'origine) du carré à conserver.
  sx: number;
  sy: number;
  size: number; // côté du carré source (carré => largeur = hauteur)
}

export interface CroppedImage {
  blob: Blob;
  // Extension cohérente avec le type MIME, utilisée pour nommer le fichier.
  extension: 'webp' | 'jpg';
  type: 'image/webp' | 'image/jpeg';
}

// Charge un fichier image en HTMLImageElement via Object URL (révoqué ensuite).
export const loadImageFromFile = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire l'image sélectionnée."));
    };
    img.src = url;
  });

// Choisit une taille de sortie carrée "premium" : 1024 ou 768 quand la source
// le permet, sans jamais sur-agrandir une petite image (ce qui la rendrait floue).
const pickOutputSize = (sourceSize: number): number => {
  if (sourceSize >= 1024) return 1024;
  if (sourceSize >= 768) return 768;
  // Source plus petite : on garde sa taille réelle (bornée à 256 minimum).
  return Math.max(256, Math.round(sourceSize));
};

// Promesse autour de canvas.toBlob.
const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), type, quality));

// Dessine le carré source sur un canvas carré puis exporte une image compressée
// dont le poids reste sous `maxBytes`. Réduit la qualité par paliers si besoin.
export const cropImageToSquare = async (
  image: HTMLImageElement,
  area: CropArea,
  maxBytes: number,
): Promise<CroppedImage> => {
  const outputSize = pickOutputSize(area.size);

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error("Le recadrage n'est pas supporté par ce navigateur.");
  }

  // Lissage de qualité pour un rendu net malgré le redimensionnement.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    area.sx,
    area.sy,
    area.size,
    area.size,
    0,
    0,
    outputSize,
    outputSize,
  );

  // WebP en priorité (meilleure compression) ; JPEG en repli si non supporté.
  const webpProbe = await canvasToBlob(canvas, 'image/webp', 0.9);
  const useWebp = !!webpProbe && webpProbe.type === 'image/webp';
  const type: CroppedImage['type'] = useWebp ? 'image/webp' : 'image/jpeg';
  const extension: CroppedImage['extension'] = useWebp ? 'webp' : 'jpg';

  // Qualités décroissantes : on s'arrête dès qu'on passe sous la limite de poids.
  const qualities = [0.92, 0.85, 0.78, 0.7, 0.6];
  let result: Blob | null = useWebp ? webpProbe : null;

  for (const quality of qualities) {
    const blob = await canvasToBlob(canvas, type, quality);
    if (!blob) continue;
    result = blob;
    if (blob.size <= maxBytes) break;
  }

  if (!result) {
    throw new Error("Échec de la compression de l'image.");
  }

  return { blob: result, extension, type };
};
