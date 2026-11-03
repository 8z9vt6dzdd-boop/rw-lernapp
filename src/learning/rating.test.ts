import { describe, expect, it } from 'vitest';
import { fsrsRating, median } from './rating';

describe('FSRS-Bewertung', () => {
  const base = { durationMs: 60_000, fruehereDauern: [50_000, 60_000, 70_000] };
  it('falsch → 1', () => expect(fsrsRating({ ...base, correct: false, hintsUsed: 0 })).toBe(1));
  it('Hinweis 2 oder 3 → 2', () => {
    expect(fsrsRating({ ...base, correct: true, hintsUsed: 2 })).toBe(2);
    expect(fsrsRating({ ...base, correct: true, hintsUsed: 3 })).toBe(2);
  });
  it('Hinweis 1 → 3', () => expect(fsrsRating({ ...base, correct: true, hintsUsed: 1 })).toBe(3));
  it('deutlich langsamer als üblich → 3', () =>
    expect(fsrsRating({ ...base, durationMs: 100_000, correct: true, hintsUsed: 0 })).toBe(3));
  it('ohne Hilfe → 4', () => expect(fsrsRating({ ...base, correct: true, hintsUsed: 0 })).toBe(4));
  it('ohne Vorgeschichte zählt die Dauer nicht', () =>
    expect(
      fsrsRating({ correct: true, hintsUsed: 0, durationMs: 999_999, fruehereDauern: [] }),
    ).toBe(4));
  it('Median', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeUndefined();
  });
});
