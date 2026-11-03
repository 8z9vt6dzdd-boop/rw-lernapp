// Generatoren M7, Batch c1 (Skills C1–C4).
import type { Generator } from '../../task';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenerator = Generator<any, any>;

export const BATCH_C1: {
  generatoren: AnyGenerator[];
  /** Skills mit großer Tabelle: auf dem Handy Laptop-Hinweis und Teilschritte */
  tabellen: string[];
  /** Skills, deren Buchungssatz sich für „Fehler finden“ eignet (genau ein Buchungssatz-Teil) */
  fehlerjagd: string[];
} = { generatoren: [], tabellen: [], fehlerjagd: [] };
