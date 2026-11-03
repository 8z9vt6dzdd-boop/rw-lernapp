// Generatoren M7, Batch f2 (Skills F6–F10).
import type { Generator } from '../../task';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenerator = Generator<any, any>;

export const BATCH_F2: {
  generatoren: AnyGenerator[];
  /** Skills mit großer Tabelle: auf dem Handy Laptop-Hinweis und Teilschritte */
  tabellen: string[];
  /** Skills, deren Buchungssatz sich für „Fehler finden“ eignet (genau ein Buchungssatz-Teil) */
  fehlerjagd: string[];
} = { generatoren: [], tabellen: [], fehlerjagd: [] };
