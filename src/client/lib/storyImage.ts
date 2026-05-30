'use client';

// Generates a 1080x1920 (Instagram Stories) PNG summarizing the day's result and
// shares it through the Web Share API (which, on mobile, lets the user pick
// Instagram → Stories). Falls back to downloading the PNG when sharing files
// isn't supported (e.g. most desktop browsers).

export type CellResult = 'correct' | 'partial' | 'incorrect';

export interface StoryImageData {
  attempts: number;
  dateLabel: string; // already formatted, e.g. "30/05/2026"
  grid: CellResult[][]; // one row per guess, normalized cells
  targetName: string;
  targetPhoto?: string | null;
  url: string;
  labels: {
    resultTitle: string; // e.g. "RESULTADO DE HOJE"
    attemptsWord: string; // e.g. "tentativas" / "tentativa"
    answerWas: string; // e.g. "A pessoa era"
    playAt: string; // e.g. "Jogue em"
  };
}

const W = 1080;
const H = 1920;

// LSD brand palette (mirrors the CSS custom properties in globals.css).
const PALETTE = ['#4ab5c4', '#4562c1', '#6b52a4', '#a55a8e', '#de5d60', '#e19d53'];
const TILE_COLORS: Record<CellResult, string> = {
  correct: '#10b981',
  partial: '#f59e0b',
  incorrect: '#d4d4d8', // light-theme neutral
};

// Light theme colors (mirror the [data-theme="light"] block in globals.css).
const INK = '#18181b';
const INK_MUTED = 'rgba(24,24,27,0.55)';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    // Only needed for non-data URLs; harmless for data URLs.
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Resolves a photo (data URL, or a remote URL fetched and inlined to a data URL)
// to an <img>. Remote images are downloaded and re-encoded so drawing them never
// taints the canvas (which would break PNG export). Returns null on any failure
// so the caller can fall back to the initials avatar.
async function resolvePhoto(src?: string | null): Promise<HTMLImageElement | null> {
  if (!src) return null;
  if (src.startsWith('data:')) return loadImage(src);
  try {
    const res = await fetch(src, { mode: 'cors' });
    if (!res.ok) return null;
    const dataUrl = await blobToDataUrl(await res.blob());
    return await loadImage(dataUrl);
  } catch {
    return null;
  }
}

function horizontalGradient(ctx: CanvasRenderingContext2D, x0: number, x1: number): CanvasGradient {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  PALETTE.forEach((c, i) => g.addColorStop(i / (PALETTE.length - 1), c));
  return g;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export async function buildStoryCanvas(data: StoryImageData): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Light background with a subtle vertical gradient.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(1, '#eef0f4');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Soft brand glows (subtle on light).
  const glow = (cx: number, cy: number, radius: number, color: string, alpha: number) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  };
  glow(160, 280, 640, '#4562c1', 0.1);
  glow(940, 1640, 700, '#de5d60', 0.1);

  // Top & bottom gradient stripes
  ctx.fillStyle = horizontalGradient(ctx, 0, W);
  ctx.fillRect(0, 0, W, 16);
  ctx.fillRect(0, H - 16, W, 16);

  ctx.textAlign = 'center';

  // Logo mark (top-anchored), then the "LSDLE" wordmark so the game name is
  // always present even if the logo image is unavailable.
  let cursorY = 120;
  const logo = await loadImage('/logo.png');
  if (logo && logo.width > 0) {
    const maxW = 340;
    const maxH = 150;
    const scale = Math.min(maxW / logo.width, maxH / logo.height);
    const lw = logo.width * scale;
    const lh = logo.height * scale;
    ctx.drawImage(logo, (W - lw) / 2, cursorY, lw, lh);
    cursorY += lh + 26;
  }
  ctx.font = '900 96px Inter, system-ui, sans-serif';
  ctx.fillStyle = horizontalGradient(ctx, W / 2 - 190, W / 2 + 190);
  ctx.fillText('LSDLE', W / 2, cursorY + 80);
  cursorY += 80 + 40;

  // "RESULTADO DE HOJE • 30/05/2026"
  ctx.font = '700 34px Inter, system-ui, sans-serif';
  ctx.fillStyle = INK_MUTED;
  ctx.fillText(
    `${spaced(data.labels.resultTitle.toUpperCase())}   •   ${data.dateLabel}`,
    W / 2,
    cursorY + 30
  );
  cursorY += 30 + 56;

  // Hero: the character of the day's photo (or initials fallback). Remote URLs
  // are fetched and inlined so the canvas isn't tainted on export.
  const photo = await resolvePhoto(data.targetPhoto);
  const R = 165;
  const cx = W / 2;
  const cy = cursorY + R;
  drawAvatar(ctx, photo, data.targetName, cx, cy, R);
  cursorY = cy + R + 48;

  // Caption + name
  ctx.font = '600 34px Inter, system-ui, sans-serif';
  ctx.fillStyle = INK_MUTED;
  ctx.fillText(data.labels.answerWas, W / 2, cursorY + 30);
  cursorY += 30 + 30;

  ctx.font = '800 70px Inter, system-ui, sans-serif';
  ctx.fillStyle = INK;
  ctx.fillText(truncate(ctx, data.targetName, 920), W / 2, cursorY + 64);
  cursorY += 64 + 64;

  // Attempts: big gradient number + word
  ctx.font = '900 150px Inter, system-ui, sans-serif';
  ctx.fillStyle = horizontalGradient(ctx, W / 2 - 140, W / 2 + 140);
  ctx.fillText(String(data.attempts), W / 2, cursorY + 120);
  cursorY += 130;
  ctx.font = '700 44px Inter, system-ui, sans-serif';
  ctx.fillStyle = INK_MUTED;
  ctx.fillText(data.labels.attemptsWord, W / 2, cursorY + 30);
  cursorY += 30 + 56;

  // Grid of tiles (auto-fits the remaining vertical space)
  const rows = data.grid.length;
  const cols = rows > 0 ? data.grid[0].length : 0;
  if (rows > 0 && cols > 0) {
    const gap = 14;
    const maxGridW = 720;
    const gridBottomLimit = 1640; // leave room for the footer
    const availH = gridBottomLimit - cursorY;
    const cellByW = (maxGridW - gap * (cols - 1)) / cols;
    const cellByH = (availH - gap * (rows - 1)) / rows;
    const cell = Math.max(24, Math.min(cellByW, cellByH));
    const gridW = cell * cols + gap * (cols - 1);
    const startX = (W - gridW) / 2;
    const startY = cursorY;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * (cell + gap);
        const y = startY + r * (cell + gap);
        ctx.fillStyle = TILE_COLORS[data.grid[r][c]] ?? TILE_COLORS.incorrect;
        roundRect(ctx, x, y, cell, cell, cell * 0.18);
        ctx.fill();
      }
    }
  }

  // Footer URL
  ctx.font = '700 38px Inter, system-ui, sans-serif';
  ctx.fillStyle = horizontalGradient(ctx, W / 2 - 280, W / 2 + 280);
  ctx.fillText(`${data.labels.playAt} ${prettyUrl(data.url)}`, W / 2, H - 130);

  return canvas;
}

// Draws a circular avatar (cover-fit photo, or initials fallback) with a
// brand-gradient ring.
function drawAvatar(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement | null,
  name: string,
  cx: number,
  cy: number,
  R: number
) {
  // Gradient ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R + 10, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = horizontalGradient(ctx, cx - R, cx + R);
  ctx.fill();
  ctx.restore();

  // Inner circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (photo && photo.width > 0 && photo.height > 0) {
    // cover-fit the (square) avatar box
    const s = Math.max((2 * R) / photo.width, (2 * R) / photo.height);
    const dw = photo.width * s;
    const dh = photo.height * s;
    ctx.drawImage(photo, cx - dw / 2, cy - dh / 2, dw, dh);
  } else if (photo) {
    // Image with no intrinsic size (e.g. some SVGs): fill the avatar box.
    ctx.drawImage(photo, cx - R, cy - R, 2 * R, 2 * R);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    ctx.fillStyle = INK;
    ctx.font = `800 ${Math.round(R * 0.85)}px Inter, system-ui, sans-serif`;
    const prevBaseline = ctx.textBaseline;
    ctx.textBaseline = 'middle';
    ctx.fillText(initials(name), cx, cy + 4);
    ctx.textBaseline = prevBaseline;
  }
  ctx.restore();
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function spaced(text: string): string {
  return text.split('').join(' '); // thin spaces between letters
}

function prettyUrl(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + '…';
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export type ShareOutcome = 'shared' | 'downloaded';

// Builds the story image and shares it. Returns how it was delivered so the UI
// can show appropriate feedback. Throws only on genuinely unexpected failures.
export async function shareStoryImage(
  data: StoryImageData,
  shareText: string
): Promise<ShareOutcome> {
  const canvas = await buildStoryCanvas(data);
  const blob = await canvasToBlob(canvas);
  if (!blob) throw new Error('Failed to render image');

  const file = new File([blob], `lsdle-${data.dateLabel.replace(/\//g, '-')}.png`, {
    type: 'image/png',
  });

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
  };

  if (nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], text: shareText });
      return 'shared';
    } catch (err) {
      // User cancelled the share sheet — treat as a no-op, don't fall back.
      if (err instanceof DOMException && err.name === 'AbortError') return 'shared';
      // Otherwise fall through to download.
    }
  }

  // Fallback: trigger a download.
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  return 'downloaded';
}
