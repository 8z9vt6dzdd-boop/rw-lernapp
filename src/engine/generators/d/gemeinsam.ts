// Gemeinsame Bausteine für Batch d (Absatz und Privat, BA 3.2 / 3.3).
import { Val, dec } from '../../money';
import type { Rng } from '../../rng';
import { FIRMA } from '../../../config';

export type Verkaufsart = 'erzeugnisse' | 'handelswaren';

export const ERLOESKONTO: Record<Verkaufsart, string> = {
  erzeugnisse: 'Umsatzerlöse für eigene Erzeugnisse',
  handelswaren: 'Umsatzerlöse für Handelswaren',
};

export const FORDERUNGEN = 'Forderungen aus Lieferungen und Leistungen';
export const VERBINDLICHKEITEN = 'Verbindlichkeiten aus Lieferungen und Leistungen';

export interface Zerlegung {
  netto: Val;
  ust: Val;
  brutto: Val;
}

/** Netto gegeben: Steuer auf Cent runden, Brutto = Netto + Steuer. */
export function ausNetto(netto: Val | string, ustSatz: string): Zerlegung {
  const n = Val.of(netto);
  const ust = n.times(ustSatz).fix();
  return { netto: n, ust, brutto: n.plus(ust) };
}

/** Brutto gegeben: Netto = Brutto ÷ (1 + Satz) auf Cent, Steuer = Differenz. */
export function ausBrutto(brutto: Val | string, ustSatz: string): Zerlegung {
  const b = Val.of(brutto);
  const netto = b.div(dec(1).plus(ustSatz)).fix();
  return { netto, ust: b.minus(netto), brutto: b };
}

/** Eigene Erzeugnisse (für Verkauf, Rücksendung, Entnahme). */
export function erzeugnisse(): string[] {
  const p = FIRMA.produkte;
  return [`„${p.energy}“`, `„${p.lemon}“`, `„${p.bier}“`];
}

/** Handelswaren der MBG. */
export function handelswaren(): string[] {
  const p = FIRMA.produkte;
  return [`Weißwein „${p.wein}“`, `„${p.vodka}“`];
}

export function produktFuer(rng: Rng, art: Verkaufsart): string {
  return rng.pick(art === 'erzeugnisse' ? erzeugnisse() : handelswaren());
}

export function kunde(rng: Rng): string {
  return rng.pick(FIRMA.kunden);
}

/** Klausurfreundlicher Bruttobetrag: Nettowert als Vielfaches von `step`, daraus brutto (geht auf). */
export function glattBrutto(rng: Rng, min: number, max: number, step: number, ustSatz: string) {
  return dec(rng.step(min, max, step))
    .times(dec(1).plus(ustSatz))
    .toFixed(2);
}
