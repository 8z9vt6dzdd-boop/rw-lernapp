// Gemeinsame Bausteine für die Teilkosten-Generatoren K1–K4 (Abschnitt K, Kulisse MBG Paderborn).
import { Val, dec, type NumLike } from '../../money';
import type { Rng } from '../../rng';

/** Erzeugnis der MBG mit Mengeneinheit (Produktnamen wie in config.ts, 08-firma-mbg.md). */
export interface Sorte {
  produkt: string;
  /** Mehrzahl, z. B. „Flaschen“ */
  einheit: string;
  /** Einzahl, z. B. „Flasche“ */
  sg: string;
}

export const SORTEN_K: readonly Sorte[] = [
  { produkt: 'Senne Lemon 0,33 l', einheit: 'Flaschen', sg: 'Flasche' },
  { produkt: 'Paderquell Energy 0,33 l', einheit: 'Dosen', sg: 'Dose' },
  { produkt: 'Paderquell Energy 0,5 l', einheit: 'Dosen', sg: 'Dose' },
  { produkt: 'Almeblick Tequila-Bier 0,33 l', einheit: 'Flaschen', sg: 'Flasche' },
];

export const MONATE = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
] as const;

/** Zufälliger Eurobetrag in Cent-Schritten als Dezimal-String, z. B. 0.35. */
export function cent(rng: Rng, minCent: number, maxCent: number, stepCent = 1): string {
  return dec(rng.step(minCent, maxCent, stepCent))
    .div(100)
    .toString();
}

/** Aufrunden auf ganze Stück (Gewinnschwelle: „ab dem x-ten Stück kein Verlust“). */
export function aufrunden(x: NumLike): Val {
  return new Val(dec(x).ceil());
}

/** Abrunden auf ganze Stück. */
export function abrunden(x: NumLike): Val {
  return new Val(dec(x).floor());
}

/** Prozentwert aus Anteil: 0.75 → 75 (Prozentpunkte, schrittweiser Pfad auf 2 Stellen gerundet). */
export function prozent(anteil: Val): Val {
  return anteil.times(100).round(2);
}
