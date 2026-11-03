// Kleine Helfer für den handgezeichneten Strich: leicht unregelmäßige Linien und Rechtecke.

/** Deterministische Zitter-Werte (gleicher Seed → gleiche Linie). */
function jitter(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s / 4294967296 - 0.5) * 2;
  };
}

/** Linie als leicht gebogener Pfad. */
export function handLinie(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed = 1,
  staerke = 1.6,
): string {
  const r = jitter(seed);
  const mx = (x1 + x2) / 2 + r() * staerke;
  const my = (y1 + y2) / 2 + r() * staerke;
  return `M${(x1 + r() * 0.6).toFixed(1)} ${(y1 + r() * 0.6).toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${(x2 + r() * 0.6).toFixed(1)} ${(y2 + r() * 0.6).toFixed(1)}`;
}

/** Rechteck aus vier leicht schiefen Linien (Ecken überlappen wie gezeichnet). */
export function handRechteck(x: number, y: number, w: number, h: number, seed = 1): string {
  return [
    handLinie(x - 1, y, x + w + 1, y, seed),
    handLinie(x + w, y - 1, x + w, y + h + 1, seed + 1),
    handLinie(x + w + 1, y + h, x - 1, y + h, seed + 2),
    handLinie(x, y + h + 1, x, y - 1, seed + 3),
  ].join(' ');
}

export const STRICH = {
  stroke: 'var(--peep-ink)',
  strokeWidth: 2.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
};
