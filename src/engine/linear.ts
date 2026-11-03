// Exakter Löser für lineare Gleichungssysteme mit Brüchen (Simultanverfahren).
import { Fraction } from 'fraction.js';
import { Decimal, type Dec, type NumLike } from './money';

export { Fraction };

export function frac(x: NumLike | bigint): Fraction {
  if (typeof x === 'number' || typeof x === 'bigint') return new Fraction(x);
  // Dezimal-String exakt als Bruch übernehmen.
  return new Fraction(x.toString());
}

export function fracToDec(f: Fraction): Dec {
  return new Decimal((f.s * f.n).toString()).div(f.d.toString());
}

/** Löst A·x = b exakt (Gauß-Elimination mit Pivotsuche). Wirft bei singulärer Matrix. */
export function solveLinear(
  A: readonly (readonly Fraction[])[],
  b: readonly Fraction[],
): Fraction[] {
  const n = A.length;
  if (b.length !== n || A.some((row) => row.length !== n)) {
    throw new Error('Gleichungssystem muss quadratisch sein');
  }
  const M = A.map((row, i) => [...row.map((x) => x.clone()), (b[i] as Fraction).clone()]);
  for (let col = 0; col < n; col++) {
    const pivot = M.findIndex((row, r) => r >= col && !(row[col] as Fraction).equals(0));
    if (pivot < 0) throw new Error('Gleichungssystem ist nicht eindeutig lösbar');
    [M[col], M[pivot]] = [M[pivot] as Fraction[], M[col] as Fraction[]];
    const pr = M[col] as Fraction[];
    const pv = pr[col] as Fraction;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const row = M[r] as Fraction[];
      const factor = (row[col] as Fraction).div(pv);
      if (factor.equals(0)) continue;
      for (let c = col; c <= n; c++)
        row[c] = (row[c] as Fraction).sub(factor.mul(pr[c] as Fraction));
    }
  }
  return M.map((row, i) => (row[n] as Fraction).div(row[i] as Fraction));
}
