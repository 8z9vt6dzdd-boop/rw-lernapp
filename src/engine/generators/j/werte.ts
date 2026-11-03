// Kleine Hilfen für die Generatoren in Batch j: benannte Zwischenwerte sammeln und als Felder ausgeben.
import type { Val } from '../../money';
import type { FieldKind } from '../../money';
import type { ZahlFeld } from '../../task';
import { feld } from '../base';

export interface Wert {
  id: string;
  label: string;
  wert: Val;
  kind: FieldKind;
  einheit?: string;
}

export class Werte {
  readonly liste: Wert[] = [];

  put(id: string, label: string, wert: Val, kind: FieldKind = 'betrag', einheit?: string): Val {
    const w: Wert = { id, label, wert, kind };
    if (einheit !== undefined) w.einheit = einheit;
    this.liste.push(w);
    return wert;
  }

  get(id: string): Val {
    const w = this.liste.find((x) => x.id === id);
    if (!w) throw new Error(`Wert ${id} fehlt`);
    return w.wert;
  }

  has(id: string): boolean {
    return this.liste.some((x) => x.id === id);
  }
}

export function alsFeld(w: Wert): ZahlFeld {
  return feld(w.id, w.label, w.wert, w.kind, w.einheit);
}

export function felderAus(werte: Werte, ids: readonly string[]): ZahlFeld[] {
  return ids
    .filter((id) => werte.has(id))
    .map((id) => alsFeld(werte.liste.find((x) => x.id === id)!));
}
