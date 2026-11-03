// Generatoren M7, Batch j (Skills J2, J5, J6, J7).
import type { Generator } from '../../task';
import { division } from '../j/division';
import { gkvUkv } from '../j/gkv-ukv';
import { kuppel } from '../j/kuppel';
import { maschinensatz } from '../j/maschinensatz';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenerator = Generator<any, any>;

export const BATCH_J: {
  generatoren: AnyGenerator[];
  /** Skills mit großer Tabelle: auf dem Handy Laptop-Hinweis und Teilschritte */
  tabellen: string[];
  /** Skills, deren Buchungssatz sich für „Fehler finden“ eignet (genau ein Buchungssatz-Teil) */
  fehlerjagd: string[];
} = {
  generatoren: [division, maschinensatz, kuppel, gkvUkv],
  tabellen: ['J6-kuppel', 'J7-gkv-ukv'],
  fehlerjagd: [],
};
