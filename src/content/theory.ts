// Theorie-Inhalte im Format aus 07-content-pipeline.md. Nur Elemente mit Status „aktiv“ werden verwendet.
import beispiele from './theory/beispiele.json' with { type: 'json' };
import theorie_c1 from './theory/c1.json' with { type: 'json' };
import theorie_c2 from './theory/c2.json' with { type: 'json' };
import theorie_d from './theory/d.json' with { type: 'json' };
import theorie_e from './theory/e.json' with { type: 'json' };
import theorie_f1 from './theory/f1.json' with { type: 'json' };
import theorie_f2 from './theory/f2.json' with { type: 'json' };
import theorie_g from './theory/g.json' with { type: 'json' };
import theorie_h from './theory/h.json' with { type: 'json' };
import theorie_ij from './theory/ij.json' with { type: 'json' };
import theorie_j from './theory/j.json' with { type: 'json' };
import theorie_k1 from './theory/k1.json' with { type: 'json' };
import theorie_k2 from './theory/k2.json' with { type: 'json' };
import type { WahlPart } from '../engine/task';

interface Pruefung {
  faktenabgleich: string;
  ueberschneidung: string;
  datum: string;
}

interface Basis {
  id: string;
  skill: string;
  status: 'entwurf' | 'aktiv' | 'zurueckgehalten' | 'gemeldet';
  quelle: string;
  pruefung: Pruefung;
}

export interface McElement extends Basis {
  typ: 'mc';
  frage: string;
  optionen: { text: string; richtig?: boolean; fehlertyp?: string; erklaerung?: string }[];
}

export interface KartenElement extends Basis {
  typ: 'karte';
  frage: string;
  antwort: string;
  beispiel?: string;
}

export type TheorieElement =
  McElement | KartenElement | (Basis & { typ: 'zuordnung' | 'kurzantwort' });

const ALLE = [
  beispiele,
  theorie_c1,
  theorie_c2,
  theorie_d,
  theorie_e,
  theorie_f1,
  theorie_f2,
  theorie_g,
  theorie_h,
  theorie_ij,
  theorie_j,
  theorie_k1,
  theorie_k2,
].flat() as unknown as TheorieElement[];

export const THEORIE: readonly TheorieElement[] = ALLE.filter((e) => e.status === 'aktiv');

export function mcElemente(): McElement[] {
  return THEORIE.filter((e): e is McElement => e.typ === 'mc');
}

export function mcAlsPart(e: McElement, reihenfolge: number[]): WahlPart {
  return {
    typ: 'mc',
    id: 'mc',
    frage: e.frage,
    optionen: reihenfolge.map((i) => {
      const o = e.optionen[i]!;
      const opt: WahlPart['optionen'][number] = {
        id: `o${i}`,
        text: o.text,
        richtig: o.richtig === true,
      };
      if (o.fehlertyp) opt.fehlertyp = o.fehlertyp;
      if (o.erklaerung) opt.erklaerung = o.erklaerung;
      return opt;
    }),
  };
}
