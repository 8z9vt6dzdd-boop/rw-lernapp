// Generatoren M7, Batch d (Skills D1, D2, D3, D5, D6).
import type { Generator } from '../../task';
import { ausgangsfrachten } from '../d/ausgangsfrachten';
import { erloesberichtigung } from '../d/erloesberichtigung';
import { privat } from '../d/privat';
import { ruecksendungVerkauf } from '../d/ruecksendung-verkauf';
import { verkauf } from '../d/verkauf';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenerator = Generator<any, any>;

export const BATCH_D: {
  generatoren: AnyGenerator[];
  /** Skills mit großer Tabelle: auf dem Handy Laptop-Hinweis und Teilschritte */
  tabellen: string[];
  /** Skills, deren Buchungssatz sich für „Fehler finden“ eignet (genau ein Buchungssatz-Teil) */
  fehlerjagd: string[];
} = {
  generatoren: [verkauf, ruecksendungVerkauf, erloesberichtigung, ausgangsfrachten, privat],
  tabellen: [],
  fehlerjagd: [
    'D1-verkauf',
    'D2-ruecksendung-verkauf',
    'D3-erloesberichtigung',
    'D5-ausgangsfrachten',
    'D6-privat',
  ],
};
