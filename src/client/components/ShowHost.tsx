'use client';

/**
 * Auditorium host, 16-bit style pixel art. The sprite is a 48x57 char grid
 * drawn as SVG rects — one source row is one row of pixels, each letter a
 * PALETTE entry. Regenerate with `python3 scripts/gen-host-sprite.py`; editable by hand too.
 */
export type HostMood = 'idle' | 'tense' | 'correct' | 'wrong';

const PALETTE: Record<string, string> = {
  o: '#2b2333', // outline
  1: '#ffe0bd', // skin highlight
  2: '#f4bf95', // skin
  3: '#d1906a', // skin shadow
  h: '#f4f7ff', // hair highlight
  H: '#dfe5f6', // hair mid
  i: '#c3cbe4', // hair
  k: '#8b95b6', // hair shadow
  b: '#8e98b8', // eyebrow
  e: '#ffffff', // eye white
  I: '#4a7ac4', // iris
  q: '#2b2333', // pupil
  w: '#ffffff', // eye specular
  5: '#8f5c3d', // nostril
  m: '#6b2733', // mouth
  n: '#a83a49', // tongue
  t: '#e09aa0', // lower lip
  S: '#3d4c8f', // suit highlight
  s: '#2b3670', // suit
  d: '#1f2758', // suit shade
  D: '#151b40', // lapel
  W: '#ffffff', // shirt
  v: '#ccd6f0', // shirt shade
  g: '#ffe38a', // tie highlight
  G: '#ffd24a', // tie
  F: '#d99b12', // tie shadow
  c: '#eef2ff', // mic highlight
  C: '#a6b0cc', // mic head
  K: '#39406a', // mic body
  L: '#171c30', // mic body shadow
};

const SPRITE = [
  '................................................',
  '................................................',
  '................................................',
  '.................oooooooooooooo.................',
  '...............oiHhhhhhHiiiiiiio................',
  '.............oiiHhhhhhhHiiiiiiiiio..............',
  '...........oiiHhhhhhhhHiiiiiiiiiiiio............',
  '..........oiiHhhhhhhhHiiiiiiiiiiiiiiio..........',
  '........oiiiHhhhhhhhHiiiiiiiiiiiiiiiiiko........',
  '........oiiiHhhhhhhhHiiiiiiiiiiiiiiiikko........',
  '........oiiiHhhhhhhHiiiiiiiiiiiiiikiikko........',
  '........oiiHhhhhhhHiiiiiiiiiiiiiiikiikko........',
  '........oiiHhhhhhHiiiiiiiiiiiiiiiikiikko........',
  '........oiHhhhhhHiiiiiiiiiiiiiiiikiiikko........',
  '........oiHhhhhHiiiiiiiiiiiiiiiiikiiikko........',
  '........oHhhhhHiiiiiiiiiiiiiiiiiikiiikko........',
  '........oHhhhHiiiiiiiiiiiiiiiiiikiiiikko........',
  '........oHhhHiiiiiiiiiiiiiiiiiiikiiiikko........',
  '........okii122222222222222222222233iiko........',
  '........okii222222222222222222222233iiko........',
  '........okii222222222222222222222233iiko........',
  '........okii2bbbbbbbb222222bbbbbbbb3iiko........',
  '........okii22bbbbbb22222222bbbbbb33iiko........',
  '........okii222222222222222222222233iiko........',
  '........okii22oooooo22222222oooooo33iiko........',
  '........okii2oeeIwIeo222222oeIwIeeo3iiko........',
  '........okii2oeIqqIeo222222oeIqqIeo3iiko........',
  '........okii2oeeIIIeo222222oeIIIeeo3iiko........',
  '........okii22oooooo22222222oooooo33iiko........',
  '........o322223322222222222222223322223o........',
  '........o322222222222222332222222222223o........',
  '........o322222222222222332222222222223o........',
  '........o322222222222233332222222222223o........',
  '........o322222222222533335222222222223o........',
  '........o322222222222222222222222222223o........',
  '........o322222222m2222222222m222222223o........',
  '........o3222222222mmmmmmmmmm2222222223o........',
  '........o32222222222tttttttt22222222223o........',
  '.........o3222222222222222222222222223o.........',
  '...........o322222222222222222222223o...........',
  '..............o322222222222222223o..............',
  '................o33333333333333o................',
  '.................o333333333333o.................',
  '.................o333333333333o.................',
  '.................o333333333333o.................',
  '..............oooWWWWWWWvvvvvvvooo..............',
  '............ooSsDDWWWWWWvvvvvvDDsdoo............',
  '..........oosssDDDssWWWWvvvvssDDDCCCCo..........',
  '........oossssDDDDsssGGGGFFsssDDcCCCCCoo........',
  '.....ooossssssDDDssssgGGGFFssssDcCCCCCssooo.....',
  '...oossssssssDDDDssssgGGGFFssssDcCCCCCsssssoo...',
  '..oSSssssssssDDDsssssgGGGFFsssssDCCCCssssssddo..',
  '..oSSsssssssDDDDsssssgGGGFFsssssDKKKKssssssddo..',
  '..oSSsssssssDDDssssssgGGGFFssssssKKLLssssssddo..',
  '..oSSssssssDDDDssssssgGGGFFsssss122KLLsssssddo..',
  '..oSSssssssDDDsssssssgGGGFFsssss12233Lsssssddo..',
  '..oSSsssssDDDDsssssssgGGGFFssssss2333Dsssssddo..',
];

/** Shut lids, flashed over the sprite by CSS to blink. */
const BLINK_ROWS: Record<number, string> = {
  24: '........okii222222222222222222222223iiko........',
  25: '........okii222222222222222222222223iiko........',
  26: '........okii2oooooooo222222oooooooo3iiko........',
  27: '........okii233333333222222333333333iiko........',
  28: '........okii222222222222222222222223iiko........',
};

/** Eyes cut to the right, flashed the same way. */
const GLANCE_ROWS: Record<number, string> = {
  24: '........okii22oooooo22222222oooooo33iiko........',
  25: '........okii2oeeeIwIo222222oeeeIwIo3iiko........',
  26: '........okii2oeeIqqIo222222oeeIqqIo3iiko........',
  27: '........okii2oeeeIIIo222222oeeeIIIo3iiko........',
  28: '........okii22oooooo22222222oooooo33iiko........',
};


const MOOD_ROWS: Record<HostMood, Record<number, string>> = {
  idle: {
  },
  tense: {
    21: '........okii222222222222222222222233iiko........',
    22: '........okii2bbbbb222222222222bbbbb3iiko........',
    23: '........okii222bbbbbb222222bbbbbb233iiko........',
    35: '........o322222222222222222222222222223o........',
    36: '........o322222222mmmmmmmmmmmm222222223o........',
  },
  correct: {
    20: '........okii2bbbbbbbb222222bbbbbbbb3iiko........',
    21: '........okii22bbbbbb22222222bbbbbb33iiko........',
    22: '........okii222222222222222222222233iiko........',
    34: '........o322222222m2222222222m222222223o........',
    35: '........o3222222222mmmmmmmmmm2222222223o........',
    36: '........o322222222mWWWWWWWWWWm222222223o........',
    37: '........o322222222mnnnnnnnnnnm222222223o........',
    38: '.........o322222222mmmmmmmmmm222222223o.........',
  },
  wrong: {
    21: '........okii2222bbbbb222222bbbbb2233iiko........',
    22: '........okii2bbbbbb2222222222bbbbbb3iiko........',
    25: '........okii2oooooooo222222oooooooo3iiko........',
    35: '........o322222222222mmmmmm222222222223o........',
    36: '........o3222222222mm222222mm2222222223o........',
    37: '........o322222222m2222222222m222222223o........',
  },
};

/** Merge runs of the same colour into one rect — roughly a third of the nodes. */
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

const rects = (row: string, y: number) =>
  runs(row).map(({ x, w, ch }) => (
    <rect key={`${y}-${x}`} x={x} y={y} width={w} height={1} fill={PALETTE[ch]} />
  ));

export function ShowHost({ mood }: { mood: HostMood }) {
  const overrides = MOOD_ROWS[mood];
  return (
    // The frame holds still and the sprite bobs inside it, so the character
    // does not read as floating in empty space.
    <div className={`show-host-frame is-${mood}`} aria-hidden="true">
      <svg className="show-host" viewBox="0 0 48 57" shapeRendering="crispEdges">
        {SPRITE.map((base, y) => rects(overrides[y] ?? base, y))}
        {/* Both overlays sit on top of the open eyes and are flashed by CSS.
            Blink is rendered last so it wins if the two ever coincide. */}
        <g className="host-glance">
          {Object.entries(GLANCE_ROWS).map(([y, row]) => rects(row, Number(y)))}
        </g>
        <g className="host-blink">
          {Object.entries(BLINK_ROWS).map(([y, row]) => rects(row, Number(y)))}
        </g>
      </svg>
    </div>
  );
}
