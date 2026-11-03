// Kopplungscode: 8 Wörter aus einer Liste von 256 (64 Bit Zufall). Kein Konto, kein Passwort.
import { WOERTER } from './woerter';

export const CODE_WOERTER = 8;

export function neuerCode(
  zufall: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n)),
): string {
  return [...zufall(CODE_WOERTER)].map((b) => WOERTER[b]!).join('-');
}

/** Eingabe tolerant lesen: Groß/klein, Umlaute, Leerzeichen, Bindestriche, Kommas. */
export function codeAusEingabe(text: string): string | null {
  const woerter = text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .split(/[^a-z]+/)
    .filter(Boolean);
  if (woerter.length !== CODE_WOERTER) return null;
  return woerter.every((w) => WOERTER.includes(w)) ? woerter.join('-') : null;
}

export const LINK_PRAEFIX = '#verbinden-';

export function verbindenLink(code: string, basis: string): string {
  return `${basis.split('#')[0]}${LINK_PRAEFIX}${code}`;
}

/** Code aus dem Adress-Anhang lesen (…/#verbinden-wort-wort-…), sonst null. */
export function codeAusHash(hash: string): string | null {
  if (!hash.startsWith(LINK_PRAEFIX)) return null;
  return codeAusEingabe(decodeURIComponent(hash.slice(LINK_PRAEFIX.length)));
}
