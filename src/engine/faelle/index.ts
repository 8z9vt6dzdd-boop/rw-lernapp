// Verzeichnis der Fälle im Fallmodus.
import { geschaeftsgangFall } from './geschaeftsgang';
import { klrFall } from './klr-fall';
import type { Fall } from './types';

export interface FallInfo {
  id: string;
  titel: string;
  beschreibung: string;
  minuten: number;
  /** Skill im Lernpfad, falls der Fall dort als Übung erscheint */
  skillId?: string;
  erstelle: (seed: number) => Fall;
}

export const FAELLE: readonly FallInfo[] = [
  {
    id: 'geschaeftsgang',
    titel: 'Ein Geschäftsjahr der MBG',
    beschreibung: 'Buchungen, Abschluss, Erfolg und Schlussbilanz in fünf Schritten',
    minuten: 35,
    skillId: 'E5-geschaeftsgang',
    erstelle: geschaeftsgangFall,
  },
  {
    id: 'klr',
    titel: 'Vom BAB zum Angebotspreis',
    beschreibung: 'Stufenleiterverfahren, Zuschlagssätze und Kalkulation in drei Schritten',
    minuten: 30,
    erstelle: klrFall,
  },
];

export function fallFuerSkill(skillId: string): FallInfo | undefined {
  return FAELLE.find((f) => f.skillId === skillId);
}

export function fallInfo(id: string): FallInfo | undefined {
  return FAELLE.find((f) => f.id === id);
}

export { pruefeSchritt, fallPunkte, type Fall, type FallSchritt } from './types';
