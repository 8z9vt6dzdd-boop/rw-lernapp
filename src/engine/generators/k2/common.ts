// Gemeinsame Bausteine für Batch k2 (Teilkostenrechnung K5–K9).
import type { WahlPart } from '../../task';

export interface WahlText {
  id: string;
  text: string;
  /** Erklärung, wenn diese Option gewählt wurde, aber falsch ist */
  erklaerung?: string;
}

/**
 * Auswahl-Teil, dessen richtige Option aus der Lösung folgt. `fehlwege` nennt je typischem
 * Fehlweg die Option, die dieser Weg wählen würde: Sie trägt dann den Fehlertyp (sofern sie
 * nicht ohnehin richtig ist).
 */
export function wahlPart(
  typ: WahlPart['typ'],
  id: string,
  frage: string,
  optionen: readonly WahlText[],
  richtigId: string,
  fehlwege: readonly { fehlertyp: string; optionId: string }[] = [],
  begruendung?: string,
): WahlPart {
  const part: WahlPart = {
    typ,
    id,
    frage,
    optionen: optionen.map((o) => {
      const richtig = o.id === richtigId;
      const opt: WahlPart['optionen'][number] = { id: o.id, text: o.text, richtig };
      const fw = richtig ? undefined : fehlwege.find((f) => f.optionId === o.id);
      if (fw) opt.fehlertyp = fw.fehlertyp;
      if (!richtig && o.erklaerung) opt.erklaerung = o.erklaerung;
      return opt;
    }),
  };
  if (begruendung) part.begruendung = begruendung;
  return part;
}

/** Einheit je Produkt (Dose oder Flasche) im Text. */
export function einheitVon(produkt: string): { ein: string; mehr: string } {
  return /Energy/.test(produkt)
    ? { ein: 'Dose', mehr: 'Dosen' }
    : { ein: 'Flasche', mehr: 'Flaschen' };
}
