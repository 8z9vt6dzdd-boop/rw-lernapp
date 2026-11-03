// Gemeinsame Bausteine für Batch b (Umsatzsteuer rechnen und buchen, BA 2.3.5.3).
// Spezifikation: docs/m7/b.md. Alle Namen stammen aus src/config.ts bzw. src/content/characters.ts.
import { FIRMA } from '../../../config';
import { Val, dec, formatPlain } from '../../money';

/** Allgemeiner Steuersatz und ermäßigter Steuersatz (BA 2.3.5.3). */
export const REGELSATZ = '0.19';
export const ERMAESSIGT = '0.07';

/** Kapitel im Geschäftsjahr der MBG (08-firma-mbg.md): Abschnitt B spielt im Januar. */
export const KONTEXT_B = 'Januar: erste Umsatzsteuer-Voranmeldung';

export const FORDERUNGEN = 'Forderungen aus Lieferungen und Leistungen';
export const VERBINDLICHKEITEN = 'Verbindlichkeiten aus Lieferungen und Leistungen';

/** Steuer auf einen Nettobetrag, auf Cent gerundet (echter Geldbetrag). */
export function steuerVomNetto(netto: Val | string, satz: string): Val {
  return Val.of(netto).times(satz).fix();
}

/** Nettobetrag aus einem Bruttobetrag: Brutto ÷ (1 + Satz), auf Cent gerundet. */
export function nettoAusBrutto(brutto: Val | string, satz: string): Val {
  return Val.of(brutto).div(dec(1).plus(satz)).fix();
}

/** Denkfehler „Prozentsatz vom Bruttobetrag“: Steuer = Brutto × Satz, Netto = Brutto − Steuer. */
export function steuerVomBruttoFalsch(brutto: Val | string, satz: string): Val {
  return Val.of(brutto).times(satz).fix();
}

/** Faktor als Text: „0.19“ → „1,19“. */
export function faktor(satz: string): string {
  return formatPlain(dec(1).plus(satz));
}

/** Bruttobetrag in Prozent des Nettobetrags: „0.19“ → „119 %“. */
export function bruttoProzent(satz: string): string {
  return `${formatPlain(dec(1).plus(satz).times(100))} %`;
}

/** Klausurfreundlicher Bruttobetrag aus einem glatten Nettobetrag (geht auf den Cent auf). */
export function glattBrutto(netto: number, satz: string): string {
  return dec(netto).times(dec(1).plus(satz)).toFixed(2);
}

/** Der jeweils andere Steuersatz (Denkfehler „Steuersatz verwechselt“). */
export function andererSatz(satz: string): string {
  return dec(satz).equals(REGELSATZ) ? ERMAESSIGT : REGELSATZ;
}

export function istErmaessigt(satz: string): boolean {
  return dec(satz).equals(ERMAESSIGT);
}

const L = FIRMA.lieferanten;
const P = FIRMA.produkte;

export interface Artikel {
  /** Konto bei bestandsorientierter Erfassung bzw. Aufwandskonto */
  konto: string;
  text: string;
  /** Geschäftspartner (aus config.ts) oder Beschreibung ohne Namen */
  partner: string;
  min: number;
  max: number;
  /** Auch als kleiner Barkauf denkbar */
  barOk?: boolean;
}

/** Eingangsrechnungen zum Regelsatz (19 %), passend zu 08-firma-mbg.md. */
export const EINKAUF_19: readonly Artikel[] = [
  { konto: 'Rohstoffe', text: 'Aromen', partner: L.rohstoffe[0]!, min: 1_000, max: 20_000 },
  {
    konto: 'Rohstoffe',
    text: 'Fruchtsaftkonzentrat',
    partner: L.rohstoffe[2]!,
    min: 2_000,
    max: 30_000,
  },
  { konto: 'Rohstoffe', text: 'Braumalz', partner: L.rohstoffe[3]!, min: 2_000, max: 25_000 },
  {
    konto: 'Hilfsstoffe',
    text: 'Getränkedosen 0,33 l',
    partner: L.hilfsstoffe[0]!,
    min: 2_000,
    max: 30_000,
  },
  { konto: 'Hilfsstoffe', text: 'Etiketten', partner: L.hilfsstoffe[1]!, min: 500, max: 8_000 },
  {
    konto: 'Hilfsstoffe',
    text: 'Kronkorken und Schraubverschlüsse',
    partner: L.hilfsstoffe[2]!,
    min: 500,
    max: 10_000,
  },
  {
    konto: 'Betriebsstoffe',
    text: 'Kohlensäure (CO₂)',
    partner: L.betriebsstoffe[0]!,
    min: 300,
    max: 6_000,
  },
  {
    konto: 'Betriebsstoffe',
    text: 'Reinigungsmittel für die Abfüllanlage',
    partner: L.betriebsstoffe[1]!,
    min: 300,
    max: 5_000,
    barOk: true,
  },
  {
    konto: 'Vorprodukte und Fremdbauteile',
    text: 'Getränkegrundstoff',
    partner: L.vorprodukte[0]!,
    min: 2_000,
    max: 30_000,
  },
  {
    konto: 'Handelswaren',
    text: `Weißwein „${P.wein}“`,
    partner: L.handelswaren[0]!,
    min: 1_000,
    max: 20_000,
  },
  {
    konto: 'Handelswaren',
    text: `„${P.vodka}“`,
    partner: L.handelswaren[1]!,
    min: 1_000,
    max: 15_000,
  },
  {
    konto: 'Büromaterial',
    text: 'Druckerpapier und Toner',
    partner: 'einem Bürofachhandel in Paderborn',
    min: 50,
    max: 900,
    barOk: true,
  },
  {
    konto: 'Fremdinstandhaltung',
    text: 'Wartung der Abfüllanlage',
    partner: L.anlagen[0]!,
    min: 400,
    max: 6_000,
  },
  {
    konto: 'Werbung',
    text: 'Werbeplakate für die Sommersaison',
    partner: L.hilfsstoffe[1]!,
    min: 500,
    max: 8_000,
  },
  {
    konto: 'Werbung',
    text: 'Werbeflyer für den Werksverkauf',
    partner: 'einem Copyshop in Paderborn',
    min: 40,
    max: 600,
    barOk: true,
  },
];

/** Eingangsbelege zum ermäßigten Satz (7 %): Bücher, Zeitschriften, Personenbeförderung (BA 2.3.5.3). */
export const EINKAUF_7: readonly Artikel[] = [
  {
    konto: 'Sonstige betriebliche Aufwendungen',
    text: 'Fachbücher zum Lebensmittelrecht für die Qualitätssicherung',
    partner: 'einer Fachbuchhandlung in Paderborn',
    min: 80,
    max: 900,
  },
  {
    konto: 'Sonstige betriebliche Aufwendungen',
    text: 'ein Jahresabonnement einer gedruckten Fachzeitschrift für die Getränkebranche',
    partner: 'einem Fachverlag',
    min: 100,
    max: 600,
  },
  {
    konto: 'Sonstige betriebliche Aufwendungen',
    text: 'Bahnfahrkarten für Dienstreisen von Tobias Hesse im Außendienst',
    partner: 'einem Bahnunternehmen',
    min: 80,
    max: 1_200,
  },
];

/** Verkäufe der MBG (immer Regelsatz: Getränke). */
export interface VerkaufsArtikel {
  konto: string;
  text: string;
}

export const VERKAUF: readonly VerkaufsArtikel[] = [
  { konto: 'Umsatzerlöse für eigene Erzeugnisse', text: `„${P.energy}“ (Dosen)` },
  { konto: 'Umsatzerlöse für eigene Erzeugnisse', text: `„${P.lemon}“ (Glasflaschen)` },
  { konto: 'Umsatzerlöse für eigene Erzeugnisse', text: `„${P.bier}“` },
  { konto: 'Umsatzerlöse für Handelswaren', text: `Weißwein „${P.wein}“ (Handelsware)` },
  { konto: 'Umsatzerlöse für Handelswaren', text: `„${P.vodka}“ (Handelsware)` },
];
