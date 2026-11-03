// Generatoren M7, Batch c2 (Skills C6–C8).
import type { Generator } from '../../task';
import { bezugskalkulation } from '../c2/bezugskalkulation';
import { handelswaren } from '../c2/handelswaren';
import { leihverpackung } from '../c2/leihverpackung';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenerator = Generator<any, any>;

export const BATCH_C2: {
  generatoren: AnyGenerator[];
  /** Skills mit großer Tabelle: auf dem Handy Laptop-Hinweis und Teilschritte */
  tabellen: string[];
  /** Skills, deren Buchungssatz sich für „Fehler finden“ eignet (genau ein Buchungssatz-Teil) */
  fehlerjagd: string[];
} = {
  generatoren: [leihverpackung, bezugskalkulation, handelswaren],
  tabellen: [],
  fehlerjagd: ['C6-leihverpackung'],
};
