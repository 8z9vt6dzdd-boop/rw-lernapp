// Mehrstufige Fälle (Fallmodus): Jeder Schritt wird für sich bewertet und baut auf der richtigen Lösung
// des Vorschritts auf – ein Fehler in Schritt 1 kostet in Schritt 2 keine Punkte (folgefehlerfrei).
import { checkTask } from '../check';
import type {
  CheckResult,
  ErrorVariant,
  SolutionStep,
  TaskAnswer,
  TaskPart,
  TaskText,
} from '../task';

export interface FallSchritt {
  id: string;
  titel: string;
  /** Skill, auf den die Antwort im Lernstand gebucht wird. */
  skillId: string;
  text: TaskText;
  parts: TaskPart[];
  variants: ErrorVariant[];
  steps: SolutionStep[];
  hints: [string, string, string];
  punkte: number;
}

export interface Fall {
  id: string;
  titel: string;
  seed: number;
  einleitung: string[];
  schritte: FallSchritt[];
}

export function pruefeSchritt(s: FallSchritt, antwort: TaskAnswer): CheckResult {
  return checkTask(s.parts, s.variants, antwort);
}

export function fallPunkte(f: Fall): number {
  return f.schritte.reduce((a, s) => a + s.punkte, 0);
}
