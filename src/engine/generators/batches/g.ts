// Generatoren M7, Batch g (Skills G1–G6).
import type { Generator } from '../../task';
import { g1Grundbegriffe } from '../g/g1-grundbegriffe';
import { g2Abgrenzung } from '../g/g2-abgrenzung';
import { g4FixVariabel } from '../g/g4-fix-variabel';
import { g5EinzelGemein } from '../g/g5-einzel-gemein';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenerator = Generator<any, any>;

export const BATCH_G: {
  generatoren: AnyGenerator[];
  /** Skills mit großer Tabelle: auf dem Handy Laptop-Hinweis und Teilschritte */
  tabellen: string[];
  /** Skills, deren Buchungssatz sich für „Fehler finden“ eignet (genau ein Buchungssatz-Teil) */
  fehlerjagd: string[];
} = {
  generatoren: [g1Grundbegriffe, g2Abgrenzung, g4FixVariabel, g5EinzelGemein],
  // G2 enthält die Ergebnistabelle (8 Spalten)
  tabellen: ['G2-abgrenzung'],
  fehlerjagd: [],
};
