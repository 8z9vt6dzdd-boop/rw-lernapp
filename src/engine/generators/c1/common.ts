// Gemeinsame Bausteine für die Beschaffungs-Generatoren C1–C4 (Lehrbrief BA 3.1).
import { aufwandKonto, bezugskostenKonto, nachlassKonto, type Stoff } from '../../accounts';
import { Val, dec } from '../../money';
import type { Rng } from '../../rng';
import type { FirmaConfig } from '../../firma';

/** Stoffarten, die in C1–C4 vorkommen (Werkstoffe und Handelswaren). */
export const STOFFE_C1: readonly Stoff[] = [
  'Rohstoffe',
  'Rohstoffe',
  'Hilfsstoffe',
  'Hilfsstoffe',
  'Betriebsstoffe',
  'Vorprodukte und Fremdbauteile',
  'Handelswaren',
];

export type Erfassung = 'bestand' | 'aufwand';

export interface Gegenstand {
  name: string;
  /** Mengeneinheit für Mengenangaben, z. B. „kg“ */
  einheit: string;
  /** Netto-Einzelpreis in € (Dezimal-String) für Mengenaufgaben */
  preis: string;
  /** Gewicht je Einheit in kg (für die Aufteilung von Fracht nach Gewicht) */
  kgJeEinheit: string;
}

/** Werkstoffe der MBG (08-firma-mbg.md), Reihenfolge passend zu den Lieferanten in config.ts. */
export const GEGENSTAENDE: Record<Stoff, Gegenstand[]> = {
  Rohstoffe: [
    { name: 'Aromen', einheit: 'kg', preis: '24', kgJeEinheit: '1' },
    { name: 'Zucker', einheit: 'kg', preis: '0.8', kgJeEinheit: '1' },
    { name: 'Fruchtsaftkonzentrat', einheit: 'l', preis: '3.5', kgJeEinheit: '1' },
    { name: 'Braumalz', einheit: 'kg', preis: '0.6', kgJeEinheit: '1' },
  ],
  Hilfsstoffe: [
    { name: 'Getränkedosen', einheit: 'Stück', preis: '0.1', kgJeEinheit: '0.02' },
    { name: 'Etiketten', einheit: 'Rollen', preis: '45', kgJeEinheit: '2' },
    { name: 'Verschlüsse', einheit: 'Stück', preis: '0.05', kgJeEinheit: '0.005' },
  ],
  Betriebsstoffe: [
    { name: 'Kohlensäure (CO₂)', einheit: 'kg', preis: '1.5', kgJeEinheit: '1' },
    {
      name: 'Reinigungsmittel für die Abfüllanlage',
      einheit: 'Kanister',
      preis: '60',
      kgJeEinheit: '25',
    },
  ],
  'Vorprodukte und Fremdbauteile': [
    { name: 'Getränkegrundstoff', einheit: 'l', preis: '6', kgJeEinheit: '1' },
  ],
  Handelswaren: [
    { name: 'Weißwein „Liboriwein“', einheit: 'Flaschen', preis: '4', kgJeEinheit: '1.25' },
    { name: 'Vodka „Domkreuz Vodka“', einheit: 'Flaschen', preis: '7.5', kgJeEinheit: '1' },
  ],
};

export function lieferantFuer(stoff: Stoff, firma: FirmaConfig, index: number): string {
  const l = firma.lieferanten;
  const map: Record<Stoff, string[]> = {
    Rohstoffe: l.rohstoffe,
    Hilfsstoffe: l.hilfsstoffe,
    Betriebsstoffe: l.betriebsstoffe,
    'Vorprodukte und Fremdbauteile': l.vorprodukte,
    Handelswaren: l.handelswaren,
  };
  const liste = map[stoff];
  return liste[index % liste.length]!;
}

/** Stoff, Gegenstand (Index) und Lieferant zufällig wählen. */
export function waehleStoff(
  rng: Rng,
  firma: FirmaConfig,
  erlaubt: readonly Stoff[] = STOFFE_C1,
): { stoff: Stoff; index: number; gegenstand: string; partner: string } {
  const stoff = rng.pick(erlaubt);
  const index = rng.int(0, GEGENSTAENDE[stoff].length - 1);
  return {
    stoff,
    index,
    gegenstand: GEGENSTAENDE[stoff][index]!.name,
    partner: lieferantFuer(stoff, firma, index),
  };
}

/** Konto, auf dem der Einkauf (und alle Korrekturen dazu) bei der gewählten Erfassung landet. */
export function einkaufsKonto(stoff: Stoff, erfassung: Erfassung): string {
  return erfassung === 'aufwand' ? aufwandKonto(stoff) : stoff;
}

/** Bezugskosten: bestandsorientiert auf das Unterkonto, aufwandsorientiert auf das Aufwandskonto. */
export function bezugsKonto(stoff: Stoff, erfassung: Erfassung): string {
  return erfassung === 'aufwand' ? aufwandKonto(stoff) : bezugskostenKonto(stoff);
}

/** Nachlässe: bestandsorientiert auf das Nachlass-Unterkonto, aufwandsorientiert auf das Aufwandskonto. */
export function nachlassKontoFuer(stoff: Stoff, erfassung: Erfassung): string {
  return erfassung === 'aufwand' ? aufwandKonto(stoff) : nachlassKonto(stoff);
}

/** Steuer auf einen Nettobetrag, auf Cent gerundet (echter Geldbetrag). */
export function steuerAuf(netto: Val, ustSatz: string): Val {
  return netto.times(dec(ustSatz)).fix();
}

/** Nettoanteil eines Bruttobetrags, auf Cent gerundet; die Steuer ist die Differenz. */
export function zerlege(brutto: Val, ustSatz: string): { netto: Val; steuer: Val } {
  const netto = brutto.div(dec(1).plus(ustSatz)).fix();
  return { netto, steuer: brutto.minus(netto) };
}

/** Bruttobetrag aus einem Nettobetrag. */
export function brutto(netto: Val, ustSatz: string): Val {
  return netto.plus(steuerAuf(netto, ustSatz));
}

/** Kapitel im Geschäftsjahr der MBG (08-firma-mbg.md): Abschnitt C spielt im Februar und März. */
export const KONTEXT_C = 'Februar–März: Einkauf für die Sommersaison';

/** Einheitlicher Name der Erfassungsmethode für Aufgabentexte. */
export const ERFASSUNG_TEXT: Record<Erfassung, string> = {
  bestand: 'bestandsorientiert (Einkauf auf dem Bestandskonto)',
  aufwand: 'aufwandsorientiert (Einkauf direkt als Aufwand, „Just-in-time“)',
};

const SINGULAR: Record<string, string> = { Rollen: 'Rolle', Flaschen: 'Flasche' };

/** „je Rolle“ statt „je Rollen“ */
export function einheitSingular(einheit: string): string {
  return SINGULAR[einheit] ?? einheit;
}
