// Generatoren M7, Batch k1 (Skills K1–K4).
import type { Generator } from '../../task';
import { breakEven } from '../k1/break-even';
import { dbEinstufig } from '../k1/db-einstufig';
import { dbMehrstufig } from '../k1/db-mehrstufig';
import { kostenverlauf } from '../k1/kostenverlauf';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenerator = Generator<any, any>;

export const BATCH_K1: {
  generatoren: AnyGenerator[];
  /** Skills mit großer Tabelle: auf dem Handy Laptop-Hinweis und Teilschritte */
  tabellen: string[];
  /** Skills, deren Buchungssatz sich für „Fehler finden“ eignet (genau ein Buchungssatz-Teil) */
  fehlerjagd: string[];
} = {
  generatoren: [kostenverlauf, dbEinstufig, breakEven, dbMehrstufig],
  tabellen: ['K4-db-mehrstufig'],
  fehlerjagd: [],
};
