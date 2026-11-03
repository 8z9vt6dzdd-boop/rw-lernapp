// Lernereignisse (05-technik.md, Datenmodell). Append-only, Grundlage für Abgleich und KI-Tutor (V2).
import type { TaskAnswer } from '../engine/task';

export type SkillId = string;
export type Modus = 'kurz' | 'fall' | 'mini-klausur' | 'probeklausur' | 'einstufung';
export type FsrsRating = 1 | 2 | 3 | 4;

export interface AttemptEvent {
  typ: 'attempt';
  id: string;
  ts: string;
  deviceId: string;
  skillId: SkillId;
  variant?: string;
  seed?: number;
  mode: Modus;
  answer: TaskAnswer | unknown;
  correct: boolean;
  partial?: number;
  hintsUsed: 0 | 1 | 2 | 3;
  errorTypes: string[];
  durationMs: number;
  fsrsRating: FsrsRating;
  /** Nur bei falschen Antworten: Parameter und erwartete Lösung für den späteren KI-Tutor. */
  params?: unknown;
  expected?: unknown;
}

export type LernEreignis = AttemptEvent;

export type Theme = 'auto' | 'hell' | 'dunkel';

export interface Settings {
  weeklyGoal: number;
  examDate?: string;
  theme: Theme;
  teilkostenInKlausur: boolean;
  iosHinweisGesehen?: boolean;
}
