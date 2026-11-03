// Generatoren M7, Batch b (Skills B1, B2).
import type { Generator } from '../../task';
import { ustBuchen } from '../b/ust-buchen';
import { ustRechnen } from '../b/ust-rechnen';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenerator = Generator<any, any>;

export const BATCH_B: {
  generatoren: AnyGenerator[];
  /** Skills mit großer Tabelle: auf dem Handy Laptop-Hinweis und Teilschritte */
  tabellen: string[];
  /** Skills, deren Buchungssatz sich für „Fehler finden“ eignet (genau ein Buchungssatz-Teil) */
  fehlerjagd: string[];
} = { generatoren: [ustRechnen, ustBuchen], tabellen: [], fehlerjagd: ['B2-ust-buchen'] };
