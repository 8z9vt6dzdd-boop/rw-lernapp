// Seedbarer Zufallsgenerator (mulberry32). Gleicher Seed → gleiche Aufgabe.

export interface Rng {
  readonly seed: number;
  /** Gleichverteilt in [0, 1). */
  next(): number;
  /** Ganzzahl in [min, max] (beide inklusive). */
  int(min: number, max: number): number;
  /** Ganzzahliges Vielfaches von `step` in [min, max]. */
  step(min: number, max: number, step: number): number;
  pick<T>(items: readonly T[]): T;
  chance(p: number): boolean;
  shuffle<T>(items: readonly T[]): T[];
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));
  return {
    seed,
    next,
    int,
    step: (min, max, step) => {
      const lo = Math.ceil(min / step);
      const hi = Math.floor(max / step);
      return int(lo, hi) * step;
    },
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0) throw new Error('pick() auf leerer Liste');
      return items[int(0, items.length - 1)] as T;
    },
    chance: (p) => next() < p,
    shuffle: <T>(items: readonly T[]): T[] => {
      const a = [...items];
      for (let i = a.length - 1; i > 0; i--) {
        const j = int(0, i);
        [a[i], a[j]] = [a[j] as T, a[i] as T];
      }
      return a;
    },
  };
}

/** Neuer zufälliger Seed (für neue Aufgaben in der App). */
export function randomSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
  }
  return Math.floor(Math.random() * 2 ** 32);
}
