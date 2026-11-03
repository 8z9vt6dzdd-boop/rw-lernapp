// Lernereignisse (05-technik.md, Datenmodell). Append-only, Grundlage für Abgleich und KI-Tutor (V2).
import type { TaskAnswer } from '../engine/task';
import type { IchAussehen } from '../content/characters';

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
  /** ohne Netzverbindung gelernt (für den Erfolg „Ohne Netz“) */
  offline?: boolean;
  /** Zugehörige Mini- oder Probeklausur */
  klausurId?: string;
}

/** Lektion abgeschlossen oder per Test übersprungen */
export interface LektionEvent {
  typ: 'lektion';
  id: string;
  ts: string;
  deviceId: string;
  lektionId: string;
  skillId: SkillId;
  art: 'abgeschlossen' | 'uebersprungen' | 'wiederholt';
  durationMs: number;
  /** Ergebnisse der interaktiven Bildschirme (für spätere Auswertung) */
  richtig?: number;
  gesamt?: number;
  /** in Fehlerjagd-Bildschirmen gefundene Fehler */
  fehlerGefunden?: number;
  offline?: boolean;
}

/** Überspringen-Test auf Ebene Lektion, Abschnitt oder Einstufung */
export interface UeberspringenEvent {
  typ: 'ueberspringen';
  id: string;
  ts: string;
  deviceId: string;
  ebene: 'lektion' | 'abschnitt' | 'einstufung';
  ziel: string;
  bestanden: boolean;
  richtig: number;
  gesamt: number;
  skillsErledigt: SkillId[];
  skillsOffen: SkillId[];
  durationMs: number;
}

/** Tabellenaufgabe für den Laptop gemerkt bzw. dort erledigt */
export interface LaptopEvent {
  typ: 'laptop-merken' | 'laptop-erledigt';
  id: string;
  ts: string;
  deviceId: string;
  /** ID der gemerkten Aufgabe (bei 'laptop-erledigt': Verweis auf das Merken-Ereignis) */
  ref: string;
  skillId: SkillId;
  seed: number;
  variant?: string;
}

export type LernEreignis = AttemptEvent | LektionEvent | UeberspringenEvent | LaptopEvent;

export type Theme = 'auto' | 'hell' | 'dunkel';

export type Tagesziel = 'leicht' | 'normal' | 'intensiv';

export interface Settings {
  tagesziel: Tagesziel;
  examDate?: string;
  theme: Theme;
  teilkostenInKlausur: boolean;
  iosHinweisGesehen?: boolean;
  /** Bewegungen in der App ruhig stellen (zusätzlich zur Systemeinstellung) */
  bewegungReduziert: boolean;
  /** Sparsame Sound-Effekte (Standard: an) */
  toene: boolean;
  /** Aussehen der eigenen Figur */
  ich: IchAussehen;
  name?: string;
  onboardingErledigt: boolean;
  /** Montag der zuletzt gesehenen Wochenrückblick-Woche (YYYY-MM-DD) */
  wochenrueckblickGesehen?: string;
  /** zuletzt gefeierte Karrierestufe bzw. Serien-Meilenstein (für Belohnungsszenen) */
  gefeiert?: { karriere?: number; serie?: number; erfolge?: string[]; abschnitte?: string[] };
}
