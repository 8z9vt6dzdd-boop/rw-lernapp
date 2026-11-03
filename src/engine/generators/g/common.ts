// Gemeinsame Bausteine für die KLR-Grundlagen-Generatoren G1–G5 (Lehrbrief K1 Kap. 1).
import type { Rng } from '../../rng';
import type { AuswahlFeld, ErrorVariant, Feld, RechenkettePart, TaskPart } from '../../task';

export const JA = 'ja';
export const NEIN = 'nein';
export const JA_NEIN = [JA, NEIN];

/** Abrechnungsperiode aller Sachverhalte in Abschnitt G (08-firma-mbg.md: Januar Folgejahr). */
export const MONAT = 'Januar';

export function auswahl(id: string, label: string, optionen: string[], soll: string): AuswahlFeld {
  return { typ: 'auswahl', id, label, optionen: [...optionen], soll };
}

/** Wählt `n` verschiedene Elemente in zufälliger Reihenfolge (deterministisch über den Rng). */
export function ziehe<T>(rng: Rng, items: readonly T[], n: number): T[] {
  return rng.shuffle(items).slice(0, n);
}

/** Ersetzt in einer Feldliste die Sollwerte einzelner Auswahlfelder (für Fehlervarianten). */
export function mitSoll(felder: Feld[], aenderungen: Record<string, string>): Feld[] {
  return felder.map((f) =>
    f.typ === 'auswahl' && aenderungen[f.id] !== undefined ? { ...f, soll: aenderungen[f.id]! } : f,
  );
}

/** Fehlervariante einer einteiligen Zuordnungsaufgabe: ein Teil, geänderte Sollwerte. */
export function zuordnungsVariante(
  part: RechenkettePart,
  fehlertyp: string,
  aenderungen: Record<string, string>,
): ErrorVariant {
  const parts: TaskPart[] = [{ ...part, felder: mitSoll(part.felder, aenderungen) }];
  return { fehlertyp, parts };
}

/** Fasst Fehlervarianten mit gleichem Fehlertyp zusammen (eine Variante je Fehlertyp). */
export function buendeln(
  part: RechenkettePart,
  einzel: { fehlertyp: string; feldId: string; soll: string }[],
): ErrorVariant[] {
  const je = new Map<string, Record<string, string>>();
  for (const e of einzel) {
    const a = je.get(e.fehlertyp) ?? {};
    a[e.feldId] = e.soll;
    je.set(e.fehlertyp, a);
  }
  return [...je.entries()].map(([fehlertyp, a]) => zuordnungsVariante(part, fehlertyp, a));
}
