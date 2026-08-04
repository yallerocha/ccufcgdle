'use client';

/** Which aid a scene belongs to. Mirrors LifelineType in the show page. */
export type LifelineType = 'fifty' | 'skip' | 'audience' | 'students';

/**
 * The drawn scene that plays while an aid is spent. Assets are 1408x768 WebP,
 * halved from the 2816px originals with a BOX filter so the pixel grid survives
 * the resize, then encoded at q92 — the art carries too many colours for a
 * 256-colour PNG to hold its gradients without banding.
 */
const ART: Record<LifelineType, { src: string; w: number; h: number }> = {
  fifty: { src: '/scene-cards.webp', w: 1408, h: 768 },
  skip: { src: '/scene-skip.webp', w: 1408, h: 768 },
  audience: { src: '/scene-audience.webp', w: 1408, h: 768 },
  students: { src: '/scene-students.webp', w: 1408, h: 768 },
};

export function ShowLifelineScene({ type }: { type: LifelineType }) {
  const art = ART[type];
  return (
    /* next/image would re-encode the art; keeping the asset exactly as
       authored is what matters for pixel work. */
    // eslint-disable-next-line @next/next/no-img-element
    <img className="show-scene-art" src={art.src} alt="" width={art.w} height={art.h} />
  );
}
