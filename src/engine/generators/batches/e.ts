// Generatoren M7, Batch e (Skills E1, E2, E3, E5).
import type { Generator } from '../../task';
import { anlagenkauf } from '../e/anlagenkauf';
import { bilanzAfa } from '../e/bilanz-afa';
import { eigenleistungAib } from '../e/eigenleistung-aib';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenerator = Generator<any, any>;

export const BATCH_E: {
  generatoren: AnyGenerator[];
  /** Skills mit großer Tabelle: auf dem Handy Laptop-Hinweis und Teilschritte */
  tabellen: string[];
  /** Skills, deren Buchungssatz sich für „Fehler finden“ eignet (genau ein Buchungssatz-Teil) */
  fehlerjagd: string[];
} = {
  generatoren: [anlagenkauf, eigenleistungAib, bilanzAfa],
  tabellen: [],
  // E5 ist ein Fall (src/engine/faelle/geschaeftsgang.ts), kein Generator.
  fehlerjagd: ['E1-anlagenkauf', 'E2-eigenleistung-aib'],
};
