// FSRS-Bewertung einer Generator-Aufgabe (05-technik.md):
// falsch → 1; richtig mit Hinweis 2 oder 3 → 2; richtig mit Hinweis 1 oder deutlich über der
// eigenen Median-Dauer → 3; richtig ohne Hilfe → 4.
import type { FsrsRating } from './types';

/** „Deutlich über“ dem Median: mehr als das 1,5-Fache. */
export const LANGSAM_FAKTOR = 1.5;

export function median(values: readonly number[]): number | undefined {
  if (values.length === 0) return undefined;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
}

export function fsrsRating(opts: {
  correct: boolean;
  hintsUsed: number;
  durationMs: number;
  /** Dauer früherer richtiger Versuche desselben Skills */
  fruehereDauern: readonly number[];
}): FsrsRating {
  if (!opts.correct) return 1;
  if (opts.hintsUsed >= 2) return 2;
  if (opts.hintsUsed === 1) return 3;
  const m = median(opts.fruehereDauern);
  if (m !== undefined && opts.fruehereDauern.length >= 3 && opts.durationMs > m * LANGSAM_FAKTOR)
    return 3;
  return 4;
}
