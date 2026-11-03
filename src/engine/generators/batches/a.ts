// Generatoren M7, Batch a (Skills A1–A7). A1 und A2 sind Theorie (src/content/theory/a.json).
import type { Generator } from '../../task';
import { bilanzveraenderung } from '../a/bilanzveraenderung';
import { buchungssatzBasis } from '../a/buchungssatz-basis';
import { ekVergleich } from '../a/ek-vergleich';
import { eroeffnungAbschluss } from '../a/eroeffnung-abschluss';
import { kontenarten } from '../a/kontenarten';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenerator = Generator<any, any>;

export const BATCH_A: {
  generatoren: AnyGenerator[];
  /** Skills mit großer Tabelle: auf dem Handy Laptop-Hinweis und Teilschritte */
  tabellen: string[];
  /** Skills, deren Buchungssatz sich für „Fehler finden“ eignet (genau ein Buchungssatz-Teil) */
  fehlerjagd: string[];
} = {
  generatoren: [
    kontenarten,
    bilanzveraenderung,
    buchungssatzBasis,
    eroeffnungAbschluss,
    ekVergleich,
  ],
  tabellen: [],
  fehlerjagd: ['A5-buchungssatz-basis', 'A6-eroeffnung-abschluss'],
};
