// Geldbeträge und Zahlen: exakt mit decimal.js, nie mit Float.
// Jeder Wert wird in zwei Lösungspfaden mitgeführt (siehe 04-fachregeln.md, Abschnitt 3):
//   exakt          – erst am Ende runden
//   schrittweise   – jeder Zwischenwert so gerundet, wie es in der Klausur üblich ist
import DecimalBase from 'decimal.js';

export const Decimal = DecimalBase.clone({ precision: 40, rounding: DecimalBase.ROUND_HALF_UP });
export type Dec = InstanceType<typeof Decimal>;
export type NumLike = Dec | number | string;

export function dec(x: NumLike): Dec {
  return x instanceof Decimal ? x : new Decimal(x);
}

/** Kaufmännisch runden (ROUND_HALF_UP) auf `dp` Nachkommastellen. */
export function round(x: NumLike, dp = 2): Dec {
  return dec(x).toDecimalPlaces(dp, Decimal.ROUND_HALF_UP);
}

/** Betrag in ganzzahligen Cent. */
export function toCents(x: NumLike): number {
  return round(x, 2).times(100).toNumber();
}

export function fromCents(c: number): Dec {
  if (!Number.isInteger(c)) throw new Error(`Cent-Betrag muss ganzzahlig sein: ${c}`);
  return new Decimal(c).div(100);
}

/** Zwei-Pfad-Wert: exakt und schrittweise gerundet, mit Anzahl tatsächlich wirksamer Rundungen. */
export class Val {
  readonly exact: Dec;
  readonly stepped: Dec;
  readonly steps: number;

  constructor(exact: NumLike, stepped?: NumLike, steps = 0) {
    this.exact = dec(exact);
    this.stepped = stepped === undefined ? this.exact : dec(stepped);
    this.steps = steps;
  }

  static of(x: NumLike | Val): Val {
    return x instanceof Val ? x : new Val(x);
  }

  plus(o: NumLike | Val): Val {
    const b = Val.of(o);
    return new Val(this.exact.plus(b.exact), this.stepped.plus(b.stepped), this.steps + b.steps);
  }

  minus(o: NumLike | Val): Val {
    const b = Val.of(o);
    return new Val(this.exact.minus(b.exact), this.stepped.minus(b.stepped), this.steps + b.steps);
  }

  times(o: NumLike | Val): Val {
    const b = Val.of(o);
    return new Val(this.exact.times(b.exact), this.stepped.times(b.stepped), this.steps + b.steps);
  }

  div(o: NumLike | Val): Val {
    const b = Val.of(o);
    return new Val(this.exact.div(b.exact), this.stepped.div(b.stepped), this.steps + b.steps);
  }

  neg(): Val {
    return new Val(this.exact.neg(), this.stepped.neg(), this.steps);
  }

  abs(): Val {
    return new Val(this.exact.abs(), this.stepped.abs(), this.steps);
  }

  /** Schrittweisen Pfad runden (wie in der Klausur). Der exakte Pfad bleibt unverändert. */
  round(dp = 2): Val {
    const r = round(this.stepped, dp);
    return new Val(this.exact, r, this.steps + (r.equals(this.stepped) ? 0 : 1));
  }

  /**
   * Beide Pfade runden: für echte Geldbeträge (Zahlungen, Buchungsbeträge), die es nur in Cent gibt.
   * Danach rechnen beide Pfade mit demselben Centbetrag weiter, damit Buchungen aufgehen.
   */
  fix(dp = 2): Val {
    const r = round(this.stepped, dp);
    const changed = !round(this.exact, dp).equals(this.exact) || !r.equals(this.stepped);
    return new Val(r, r, this.steps + (changed ? 1 : 0));
  }

  /** Anzuzeigender Wert: exakter Pfad, kaufmännisch gerundet. */
  get value(): Dec {
    return round(this.exact, 2);
  }

  /** Wert mit `dp` Nachkommastellen (z. B. 4 für Sätze je Leistungseinheit). */
  valueDp(dp: number): Dec {
    return round(this.exact, dp);
  }

  isNegative(): boolean {
    return this.exact.isNegative() && !this.exact.isZero();
  }

  cmp(o: NumLike | Val): number {
    return this.exact.cmp(Val.of(o).exact);
  }

  toJSON(): string {
    return this.value.toFixed(2);
  }
}

export function sum(values: readonly (Val | NumLike)[]): Val {
  return values.reduce<Val>((acc, v) => acc.plus(v), new Val(0));
}

// ---------- Toleranzprüfung ----------

export type FieldKind = 'betrag' | 'satz' | 'prozent' | 'menge' | 'zahl';

export type Bewertung = 'richtig' | 'rundung' | 'falsch';

const MAX_TOL = new Decimal('0.05');
const TOL_SATZ = new Decimal('0.01');

/** Zulässige Abweichung für einen Wert gemäß 04-fachregeln.md, Abschnitt 3. */
export function tolerance(v: Val, kind: FieldKind): Dec {
  if (kind === 'menge') return new Decimal(0);
  const perStep = new Decimal('0.01').times(v.steps);
  const cap = kind === 'satz' || kind === 'prozent' ? TOL_SATZ : MAX_TOL;
  return Decimal.min(perStep, cap);
}

/**
 * Vergleicht eine Eingabe mit beiden Lösungspfaden.
 * 'richtig'  – entspricht dem exakten Ergebnis (auf 2 Stellen)
 * 'rundung'  – weicht nur durch Rundung ab (gilt als richtig, dezenter Hinweis)
 * 'falsch'   – sonst
 */
export function bewerte(answer: Dec, v: Val, kind: FieldKind, dp = 2): Bewertung {
  const exactR = round(v.exact, dp);
  const steppedR = round(v.stepped, dp);
  if (answer.equals(exactR)) return 'richtig';
  if (kind === 'menge') return 'falsch';
  if (answer.equals(steppedR)) return 'rundung';
  const tol = tolerance(v, kind);
  if (answer.minus(exactR).abs().lte(tol) || answer.minus(steppedR).abs().lte(tol))
    return 'rundung';
  return 'falsch';
}

// ---------- Ein- und Ausgabe im deutschen Format ----------

/**
 * Liest Zahlen tolerant ein: „1.234,5“ → 1234,50; „1234.5“ → 1234,50; „1.234“ → 1234;
 * „12,5 %“ → 12,5; „-3.000“ → −3000. Gibt null bei ungültiger Eingabe.
 */
export function parseNumber(input: string): Dec | null {
  let s = input
    .trim()
    .replace(/[€%\s]/g, '')
    .replace(/[−–]/g, '-');
  if (s === '' || s === '-' || s === '+') return null;
  let sign = '';
  if (s.startsWith('-') || s.startsWith('+')) {
    sign = s[0] === '-' ? '-' : '';
    s = s.slice(1);
  }
  if (!/^[\d.,]+$/.test(s)) return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  let normalized: string;
  if (lastComma >= 0 && lastDot >= 0) {
    // Das zuletzt stehende Zeichen ist das Dezimaltrennzeichen.
    const decSep = lastComma > lastDot ? ',' : '.';
    const thouSep = decSep === ',' ? '.' : ',';
    const [intPart, fracPart, ...rest] = s.split(decSep);
    if (rest.length > 0 || intPart === undefined || fracPart === undefined) return null;
    if (fracPart.includes(thouSep)) return null;
    if (!isValidGrouping(intPart, thouSep)) return null;
    normalized = intPart.split(thouSep).join('') + '.' + fracPart;
  } else if (lastComma >= 0) {
    const parts = s.split(',');
    if (parts.length !== 2) return null;
    normalized = parts.join('.');
  } else if (lastDot >= 0) {
    const parts = s.split('.');
    // Nur Punkte: Tausendergruppen (je 3 Ziffern) → Tausendertrennzeichen, sonst Dezimalpunkt.
    if (parts.length > 1 && parts.slice(1).every((p) => p.length === 3) && parts[0] !== '') {
      normalized = parts.join('');
    } else if (parts.length === 2) {
      normalized = parts.join('.');
    } else {
      return null;
    }
  } else {
    normalized = s;
  }
  if (normalized.startsWith('.')) normalized = '0' + normalized;
  if (normalized.endsWith('.')) normalized = normalized.slice(0, -1);
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  return new Decimal(sign + normalized);
}

function isValidGrouping(intPart: string, sep: string): boolean {
  if (!intPart.includes(sep)) return /^\d*$/.test(intPart);
  const groups = intPart.split(sep);
  return /^\d{1,3}$/.test(groups[0] ?? '') && groups.slice(1).every((g) => /^\d{3}$/.test(g));
}

/** Deutsches Zahlenformat mit Tausenderpunkten: 1234.5 → „1.234,50“. */
export function formatNumber(x: NumLike | Val, dp = 2): string {
  const d = x instanceof Val ? round(x.exact, dp) : round(dec(x), dp);
  const negative = d.isNegative() && !d.isZero();
  const [intPart = '0', frac] = d.abs().toFixed(dp).split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (negative ? '−' : '') + grouped + (frac ? ',' + frac : '');
}

/** „1.234,56 €“ (mit geschütztem Leerzeichen). */
export function formatEuro(x: NumLike | Val, dp = 2): string {
  return formatNumber(x, dp) + ' €';
}

/** Prozentsatz aus Dezimal-String: „0.025“ → „2,5 %“. Sätze werden als Dezimal-Strings geführt. */
export function formatProzent(rate: NumLike, maxDp = 2): string {
  const p = dec(rate).times(100);
  const s = p.toDecimalPlaces(maxDp).toString();
  const [i = '0', f] = s.split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (f ? ',' + f : '') + ' %';
}

/** Zahl ohne erzwungene Nachkommastellen: 0.8 → „0,8“, 1500 → „1.500“. */
export function formatPlain(x: NumLike, maxDp = 4): string {
  const d = dec(x).toDecimalPlaces(maxDp);
  const negative = d.isNegative() && !d.isZero();
  const [i = '0', f] = d.abs().toString().split('.');
  return (negative ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (f ? ',' + f : '');
}
