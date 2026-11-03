// Generatoren M7, Batch h (Skills H1, H2, H3, H5, H6, H7).
import type { Generator } from '../../task';
import { kalkZinsen } from '../h/kalk-zinsen';
import { materialbewertung } from '../h/materialbewertung';
import { materialmengen } from '../h/materialmengen';
import { wagnisse } from '../h/wagnisse';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenerator = Generator<any, any>;

export const BATCH_H: {
  generatoren: AnyGenerator[];
  /** Skills mit großer Tabelle: auf dem Handy Laptop-Hinweis und Teilschritte */
  tabellen: string[];
  /** Skills, deren Buchungssatz sich für „Fehler finden“ eignet (genau ein Buchungssatz-Teil) */
  fehlerjagd: string[];
} = {
  generatoren: [materialmengen, materialbewertung, kalkZinsen, wagnisse],
  tabellen: [],
  fehlerjagd: [],
};
