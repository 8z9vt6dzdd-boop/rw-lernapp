// Generatoren M7, Batch f2 (Skills F6–F10).
import type { Generator } from '../../task';
import { forderungsbewertung } from '../f2/forderungsbewertung';
import { rechnungsabgrenzung } from '../f2/rechnungsabgrenzung';
import { rueckstellungen } from '../f2/rueckstellungen';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenerator = Generator<any, any>;

export const BATCH_F2: {
  generatoren: AnyGenerator[];
  /** Skills mit großer Tabelle: auf dem Handy Laptop-Hinweis und Teilschritte */
  tabellen: string[];
  /** Skills, deren Buchungssatz sich für „Fehler finden“ eignet (genau ein Buchungssatz-Teil) */
  fehlerjagd: string[];
} = {
  // F9 (GuV-Aufbau) und F10 (IFRS) sind Theorie-Skills ohne Generator.
  generatoren: [forderungsbewertung, rechnungsabgrenzung, rueckstellungen],
  tabellen: [],
  fehlerjagd: ['F7-rap', 'F8-rueckstellungen'],
};
