'use client';

/**
 * Shared renderer for the project's pixel art: a grid of characters, one per
 * pixel, each keyed to a colour in a palette. '.' is transparent.
 *
 * Sprites are drawn as SVG rects rather than an image so they stay crisp at any
 * size and can be recoloured from CSS. Runs of the same colour on a row are
 * merged into one rect, which cuts the node count by roughly two thirds.
 */
export type Palette = Record<string, string>;

const runs = (row: string) => {
  const out: { x: number; w: number; ch: string }[] = [];
  for (let x = 0; x < row.length; x++) {
    const ch = row[x];
    if (ch === '.') continue;
    const prev = out[out.length - 1];
    if (prev && prev.ch === ch && prev.x + prev.w === x) prev.w++;
    else out.push({ x, w: 1, ch });
  }
  return out;
};

/** Rects for one row of the grid. `y` is the row's index in the sprite. */
export const pixelRow = (row: string, y: number, palette: Palette) =>
  runs(row).map(({ x, w, ch }) => (
    <rect key={`${y}-${x}`} x={x} y={y} width={w} height={1} fill={palette[ch]} />
  ));

/** A whole sprite as a standalone <svg>. */
export function PixelArt({
  rows,
  palette,
  className,
}: {
  rows: string[];
  palette: Palette;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${rows[0].length} ${rows.length}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {rows.map((row, y) => pixelRow(row, y, palette))}
    </svg>
  );
}
