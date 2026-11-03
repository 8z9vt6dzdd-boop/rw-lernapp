// Generatoren M7, Batch k2 (Skills K5–K9).
import type { Generator } from '../../task';
import { preisuntergrenze } from '../k2/k5-preisuntergrenze';
import { engpass } from '../k2/k6-engpass';
import { makeOrBuy } from '../k2/k7-make-or-buy';
import { plankosten } from '../k2/k9-plankosten';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenerator = Generator<any, any>;

export const BATCH_K2: {
  generatoren: AnyGenerator[];
  /** Skills mit großer Tabelle: auf dem Handy Laptop-Hinweis und Teilschritte */
  tabellen: string[];
  /** Skills, deren Buchungssatz sich für „Fehler finden“ eignet (genau ein Buchungssatz-Teil) */
  fehlerjagd: string[];
} = {
  generatoren: [preisuntergrenze, engpass, makeOrBuy, plankosten],
  tabellen: ['K6-engpass'],
  fehlerjagd: [],
};
