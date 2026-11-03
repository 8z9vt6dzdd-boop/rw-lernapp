// Gemeinsame Bausteine für Generatoren.
import { checkTask } from '../check';
import { Val, formatEuro, formatNumber, formatPlain, formatProzent, type NumLike } from '../money';
import type { Rng } from '../rng';
import type { CheckResult, Generator, TaskAnswer, ZahlFeld } from '../task';
import type { FieldKind } from '../money';

type Base<P, S> = Omit<Generator<P, S>, 'check'> & { check?: Generator<P, S>['check'] };

/** Ergänzt die Standard-Bewertung: Teile gegen Lösung und Fehlervarianten prüfen. */
export function defineGenerator<P, S>(g: Base<P, S>): Generator<P, S> {
  return {
    ...g,
    check:
      g.check ??
      ((p: P, s: S, answer: TaskAnswer): CheckResult =>
        checkTask(g.parts(p, s), g.errorVariants(p), answer)),
  };
}

export function feld(
  id: string,
  label: string,
  soll: Val | NumLike,
  kind: FieldKind = 'betrag',
  einheit?: string,
  extra: Partial<ZahlFeld> = {},
): ZahlFeld {
  const f: ZahlFeld = { typ: 'zahl', id, label, kind, soll: Val.of(soll), ...extra };
  if (einheit !== undefined) f.einheit = einheit;
  else if (kind === 'betrag') f.einheit = '€';
  else if (kind === 'prozent') f.einheit = '%';
  return f;
}

/** Ist `x` ohne Rundung auf `dp` Nachkommastellen darstellbar? */
export function isExact(x: Val | NumLike, dp = 2): boolean {
  const v = Val.of(x).exact;
  return v.toDecimalPlaces(dp).equals(v);
}

/** Wiederholt `make`, bis `ok` erfüllt ist (deterministisch über den Rng). */
export function retry<T>(rng: Rng, make: (rng: Rng) => T, ok: (t: T) => boolean, max = 500): T {
  let last: T = make(rng);
  for (let i = 0; i < max; i++) {
    if (ok(last)) return last;
    last = make(rng);
  }
  return last;
}

export const eur = formatEuro;
export const num = formatNumber;
export const plain = formatPlain;
export const pct = formatProzent;

/** Zufälliger Geldbetrag in Euro: „klausurfreundlich“ (Vielfaches von step) oder „krumm“ (Cent). */
export function betrag(rng: Rng, min: number, max: number, step: number, krumm: boolean): string {
  if (krumm) {
    const c = rng.int(min * 100, max * 100);
    return `${Math.floor(c / 100)}.${String(c % 100).padStart(2, '0')}`;
  }
  return String(rng.step(min, max, step));
}

export function isKrumm(rng: Rng, anteil = 0.2): boolean {
  return rng.chance(anteil);
}
