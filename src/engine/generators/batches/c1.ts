// Generatoren M7, Batch c1 (Skills C1–C4).
import type { Generator } from '../../task';
import { bestandVsAufwand } from '../c1/c1-bestand-vs-aufwand';
import { bezugskosten } from '../c1/c2-bezugskosten';
import { ruecksendungEinkauf } from '../c1/c3-ruecksendung';
import { nachlaesseEinkauf } from '../c1/c4-nachlaesse';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenerator = Generator<any, any>;

export const BATCH_C1: {
  generatoren: AnyGenerator[];
  /** Skills mit großer Tabelle: auf dem Handy Laptop-Hinweis und Teilschritte */
  tabellen: string[];
  /** Skills, deren Buchungssatz sich für „Fehler finden“ eignet (genau ein Buchungssatz-Teil) */
  fehlerjagd: string[];
} = {
  generatoren: [bestandVsAufwand, bezugskosten, ruecksendungEinkauf, nachlaesseEinkauf],
  tabellen: [],
  fehlerjagd: ['C2-bezugskosten', 'C3-ruecksendung-einkauf', 'C4-nachlaesse-einkauf'],
};
