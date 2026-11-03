// Erzeugt das Lernereignis zu einer abgeschlossenen Aufgabe.
import { combineResults } from '../engine/check';
import type { PartResult, TaskAnswer } from '../engine/task';
import type { PreparedTask } from './prepare';
import { fsrsRating } from './rating';
import type { AttemptEvent, LernEreignis, Modus } from './types';

export function erstelleAttempt(opts: {
  task: PreparedTask;
  answers: TaskAnswer;
  results: readonly PartResult[];
  hintsUsed: number;
  durationMs: number;
  deviceId: string;
  mode: Modus;
  /** Frühere Ereignisse desselben Skills (für die Median-Dauer) */
  frueher: readonly LernEreignis[];
  /** Wurde für einen Teil die Lösung aufgedeckt? Dann gilt die Aufgabe als nicht gelöst. */
  loesungGezeigt: boolean;
  now?: Date;
}): AttemptEvent {
  const { task } = opts;
  const combined = combineResults(task.parts, opts.results);
  const correct = combined.korrekt && !opts.loesungGezeigt;
  const hintsUsed = Math.min(3, Math.max(0, opts.hintsUsed)) as 0 | 1 | 2 | 3;
  const fruehereDauern = opts.frueher
    .filter((e) => e.typ === 'attempt' && e.correct && e.variant === eventVariant(task))
    .map((e) => e.durationMs);
  const event: AttemptEvent = {
    typ: 'attempt',
    id: crypto.randomUUID(),
    ts: (opts.now ?? new Date()).toISOString(),
    deviceId: opts.deviceId,
    skillId: task.spec.skillId,
    seed: task.spec.seed,
    mode: opts.mode,
    answer: opts.answers,
    correct,
    partial: Math.round(combined.score * 1000) / 1000,
    hintsUsed,
    errorTypes: combined.fehlertypen,
    durationMs: Math.round(opts.durationMs),
    fsrsRating: fsrsRating({ correct, hintsUsed, durationMs: opts.durationMs, fruehereDauern }),
  };
  const variant = eventVariant(task);
  if (variant) event.variant = variant;
  if (!correct) {
    event.params = plain(task.params);
    event.expected = plain(task.solution);
  }
  return event;
}

/** Art der Übung als Variante: „erkennen“ und „mc“ werden getrennt von Rechenaufgaben geführt. */
export function eventVariant(task: PreparedTask): string | undefined {
  if (task.spec.art === 'erkennen') return 'erkennen';
  if (task.spec.art === 'mc') return `mc:${task.spec.elementId ?? ''}`;
  return task.spec.variant;
}

/** Serialisierbare Kopie (Geldwerte als Text, Brüche als „z/n“). */
export function plain(x: unknown): unknown {
  return JSON.parse(
    JSON.stringify(x, (_k, v: unknown) => {
      if (typeof v === 'bigint') return v.toString();
      if (v && typeof v === 'object' && 'toFraction' in v && typeof v.toFraction === 'function') {
        return (v as { toFraction: () => string }).toFraction();
      }
      return v;
    }),
  );
}
