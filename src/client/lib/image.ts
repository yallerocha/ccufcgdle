// Client-side image resizing/cropping for profile photos. Photos are stored inline as
// base64 data URLs, so downscaling at upload time keeps the database and every
// list endpoint (members, autocomplete, rankings) light.

const MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.85;

export function loadImageFromFile(file: File): Promise<{ image: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ image: img, objectUrl });
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
}

export interface CropGeometry {
  scale: number;
  renderedW: number;
  renderedH: number;
  panX: number;
  panY: number;
}

/**
 * Framing math for the crop viewport. The photo is cover-fitted to the crop
 * window, scaled by `zoom`, and positioned so the normalized image point
 * (centerX, centerY) sits at the middle of the window. The centre is clamped so
 * the window is always fully covered — which is what lets squareCropToDataUrl
 * export exactly the region the user sees.
 */
export function cropGeometry(
  naturalW: number,
  naturalH: number,
  cropSize: number,
  zoom: number,
  centerX: number,
  centerY: number,
): CropGeometry {
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
  const cover = naturalW && naturalH && cropSize ? Math.max(cropSize / naturalW, cropSize / naturalH) : 1;
  const scale = cover * zoom;
  const renderedW = naturalW * scale;
  const renderedH = naturalH * scale;
  const halfX = renderedW ? cropSize / 2 / renderedW : 0.5;
  const halfY = renderedH ? cropSize / 2 / renderedH : 0.5;
  return {
    scale,
    renderedW,
    renderedH,
    panX: cropSize / 2 - clamp(centerX, halfX, 1 - halfX) * renderedW,
    panY: cropSize / 2 - clamp(centerY, halfY, 1 - halfY) * renderedH,
  };
}

/** Maps on-screen crop viewport coordinates to a square JPEG data URL. */
export function squareCropToDataUrl(
  image: HTMLImageElement,
  displayScale: number,
  panX: number,
  panY: number,
  viewportSize: number,
  outputSize = MAX_DIMENSION,
): string {
  const cropX = Math.max(0, -panX / displayScale);
  const cropY = Math.max(0, -panY / displayScale);
  const cropSize = viewportSize / displayScale;

  const maxX = Math.max(0, image.naturalWidth - cropSize);
  const maxY = Math.max(0, image.naturalHeight - cropSize);
  const x = Math.min(maxX, cropX);
  const y = Math.min(maxY, cropY);
  const size = Math.min(cropSize, image.naturalWidth - x, image.naturalHeight - y);

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outputSize, outputSize);
  ctx.drawImage(image, x, y, size, size, 0, 0, outputSize, outputSize);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

/** Center-crop to square + resize (fallback when crop modal is skipped). */
export function fileToResizedDataUrl(file: File): Promise<string> {
  return loadImageFromFile(file).then(({ image, objectUrl }) => {
    try {
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      const cropX = (image.naturalWidth - side) / 2;
      const cropY = (image.naturalHeight - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = MAX_DIMENSION;
      canvas.height = MAX_DIMENSION;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, MAX_DIMENSION, MAX_DIMENSION);
      ctx.drawImage(image, cropX, cropY, side, side, 0, 0, MAX_DIMENSION, MAX_DIMENSION);
      return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  });
}
