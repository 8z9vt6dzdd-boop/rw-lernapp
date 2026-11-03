// Generatoren M7, Batch ij (Skills I1, I2, I3, I6, J1).
import type { Generator } from '../../task';
import { anbau } from '../ij/anbau';
import { babVerteilung } from '../ij/bab';
import { zuschlagssaetze } from '../ij/zuschlagssaetze';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenerator = Generator<any, any>;

export const BATCH_IJ: {
  generatoren: AnyGenerator[];
  /** Skills mit großer Tabelle: auf dem Handy Laptop-Hinweis und Teilschritte */
  tabellen: string[];
  /** Skills, deren Buchungssatz sich für „Fehler finden“ eignet (genau ein Buchungssatz-Teil) */
  fehlerjagd: string[];
} = {
  generatoren: [babVerteilung, anbau, zuschlagssaetze],
  tabellen: ['I2-bab-verteilung', 'I3-anbau'],
  fehlerjagd: [],
};
