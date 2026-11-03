// Gemeinsame Bausteine für Batch a (Fundament: BA 2.3, Kontenarten, Bilanzveränderungen,
// Buchungssätze, Eröffnung und Abschluss, Eigenkapitalvergleich). Eigene Formulierungen und Zahlen.
import type { KontoTyp } from '../../accounts';
import { getKonto } from '../../accounts';
import { eur } from '../base';
import type { AuswahlFeld, ErrorVariant, Feld, RechenkettePart, TaskPart } from '../../task';

export const BANK = 'Bank';
export const KASSE = 'Kasse';
export const EK = 'Eigenkapital';
export const DARLEHEN = 'Darlehensschulden';
export const VERB = 'Verbindlichkeiten aus Lieferungen und Leistungen';
export const FORD = 'Forderungen aus Lieferungen und Leistungen';
export const EBK = 'Eröffnungsbilanzkonto';
export const SBK = 'Schlussbilanzkonto';
export const GUV = 'Gewinn- und Verlustkonto';

export const SOLL = 'Soll';
export const HABEN = 'Haben';
export const SEITEN = [SOLL, HABEN];

export type Seite = typeof SOLL | typeof HABEN;

export const AKTIVKONTO = 'Aktivkonto';
export const PASSIVKONTO = 'Passivkonto';
export const AUFWANDSKONTO = 'Aufwandskonto';
export const ERTRAGSKONTO = 'Ertragskonto';
export const KONTENARTEN = [AKTIVKONTO, PASSIVKONTO, AUFWANDSKONTO, ERTRAGSKONTO];

export type Kontenart = 'aktiv' | 'passiv' | 'aufwand' | 'ertrag';

export const KONTENART_LABEL: Record<Kontenart, string> = {
  aktiv: AKTIVKONTO,
  passiv: PASSIVKONTO,
  aufwand: AUFWANDSKONTO,
  ertrag: ERTRAGSKONTO,
};

/** Kontenart laut Kontenliste (Abschlusskonten kommen hier nicht vor). */
export function kontenart(konto: string): Kontenart {
  const t: KontoTyp = getKonto(konto).typ;
  if (t === 'abschluss') throw new Error(`Abschlusskonto ohne Kontenart: ${konto}`);
  return t;
}

export function gegenseite(s: Seite): Seite {
  return s === SOLL ? HABEN : SOLL;
}

/** Seite, auf der ein Konto zunimmt (Aktiv- und Aufwandskonten im Soll, Passiv- und Ertragskonten im Haben). */
export function zugangsSeite(art: Kontenart): Seite {
  return art === 'aktiv' || art === 'aufwand' ? SOLL : HABEN;
}

/** Seite des Saldos (Schlussbestand bzw. Abschlussbetrag): immer die Abnahmeseite. */
export function saldoSeite(art: Kontenart): Seite {
  return gegenseite(zugangsSeite(art));
}

export function istBestandskonto(art: Kontenart): boolean {
  return art === 'aktiv' || art === 'passiv';
}

/** Gegenkonto beim Abschluss: Bestandskonten über das SBK, Erfolgskonten über die GuV. */
export function abschlussKonto(art: Kontenart): string {
  return istBestandskonto(art) ? SBK : GUV;
}

export function auswahl(id: string, label: string, optionen: string[], soll: string): AuswahlFeld {
  return { typ: 'auswahl', id, label, optionen: [...optionen], soll };
}

/** Ersetzt in einer Feldliste Sollwerte (für Fehlervarianten). Zahlfelder erhalten neue Werte über `zahlen`. */
export function mitSoll(felder: Feld[], aenderungen: Record<string, string>): Feld[] {
  return felder.map((f) =>
    f.typ === 'auswahl' && aenderungen[f.id] !== undefined ? { ...f, soll: aenderungen[f.id]! } : f,
  );
}

/** Fehlervariante einer einteiligen Auswahlaufgabe mit geänderten Sollwerten, je Fehlertyp gebündelt. */
export function auswahlVarianten(
  part: RechenkettePart,
  einzel: { fehlertyp: string; feldId: string; soll: string }[],
): ErrorVariant[] {
  const je = new Map<string, Record<string, string>>();
  for (const e of einzel) {
    const a = je.get(e.fehlertyp) ?? {};
    a[e.feldId] = e.soll;
    je.set(e.fehlertyp, a);
  }
  return [...je.entries()].map(([fehlertyp, a]) => {
    const parts: TaskPart[] = [{ ...part, felder: mitSoll(part.felder, a) }];
    return { fehlertyp, parts };
  });
}

/** Euro-Betrag aus Dezimal-Text ohne Rundungsartefakte. */
export const e = (x: string) => eur(x);

/** Tabelle einer Bilanz (Kontenform) für den Sachverhalt. */
export function bilanzDaten(
  aktiva: { konto: string; betrag: string }[],
  passiva: { konto: string; betrag: string }[],
  summe: string,
): { spalten: string[]; zeilen: string[][] } {
  const n = Math.max(aktiva.length, passiva.length);
  const zeilen: string[][] = [];
  for (let i = 0; i < n; i++) {
    const a = aktiva[i];
    const p = passiva[i];
    zeilen.push([
      a ? getKonto(a.konto).kurz : '',
      a ? eur(a.betrag) : '',
      p ? getKonto(p.konto).kurz : '',
      p ? eur(p.betrag) : '',
    ]);
  }
  zeilen.push(['Summe', eur(summe), 'Summe', eur(summe)]);
  return { spalten: ['Aktiva', 'Betrag', 'Passiva', 'Betrag'], zeilen };
}
