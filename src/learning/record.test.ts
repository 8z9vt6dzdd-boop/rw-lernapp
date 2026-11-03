import { describe, expect, it } from 'vitest';
import { checkPart } from '../engine/check';
import { antwortAusParts } from '../engine/testing';
import { prepareTask } from './prepare';
import { erstelleAttempt } from './record';
import { kurzSitzung } from './session';

describe('Lernereignisse', () => {
  it('speichert falsche Antworten mit Parametern und erwarteter Lösung (auch Brüche)', () => {
    const task = prepareTask({ key: 'k', art: 'aufgabe', skillId: 'I5-simultan', seed: 3 });
    const answers = {};
    const results = task.parts.map((p) => checkPart(p, undefined, task.variants));
    const e = erstelleAttempt({
      task,
      answers,
      results,
      hintsUsed: 0,
      durationMs: 1000,
      deviceId: 'd',
      mode: 'kurz',
      frueher: [],
      loesungGezeigt: false,
    });
    expect(e.correct).toBe(false);
    expect(e.fsrsRating).toBe(1);
    expect(JSON.stringify(e.expected)).toContain('/');
    expect(e.params).toBeDefined();
    expect(() => structuredClone(e)).not.toThrow();
  });

  it('richtige Antwort ohne Hilfe → Bewertung 4, ohne gespeicherte Lösung', () => {
    const task = prepareTask({ key: 'k', art: 'aufgabe', skillId: 'C5-skonto-einkauf', seed: 9 });
    const answers = antwortAusParts(task.parts);
    const results = task.parts.map((p) => checkPart(p, answers[p.id], task.variants));
    const e = erstelleAttempt({
      task,
      answers,
      results,
      hintsUsed: 0,
      durationMs: 1000,
      deviceId: 'd',
      mode: 'kurz',
      frueher: [],
      loesungGezeigt: false,
    });
    expect(e.correct).toBe(true);
    expect(e.fsrsRating).toBe(4);
    expect(e.expected).toBeUndefined();
  });

  it('aufgedeckte Lösung zählt nicht als gelöst', () => {
    const task = prepareTask({ key: 'k', art: 'aufgabe', skillId: 'B3-ust-abschluss', seed: 2 });
    const answers = antwortAusParts(task.parts);
    const results = task.parts.map((p) => checkPart(p, answers[p.id], task.variants));
    const e = erstelleAttempt({
      task,
      answers,
      results,
      hintsUsed: 3,
      durationMs: 1,
      deviceId: 'd',
      mode: 'kurz',
      frueher: [],
      loesungGezeigt: true,
    });
    expect(e.correct).toBe(false);
  });
});

describe('Kurz-Sitzung', () => {
  it('enthält Rechenaufgaben, Erkennen-Fragen und eine Verständnisfrage; alle lassen sich vorbereiten', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const specs = kurzSitzung(seed);
      expect(specs.length).toBe(8);
      expect(specs.filter((s) => s.art === 'erkennen')).toHaveLength(2);
      for (const s of specs) {
        const t = prepareTask(s);
        expect(t.parts.length).toBeGreaterThan(0);
        if (t.spec.art === 'erkennen') {
          const opts = t.parts[0]!.typ === 'aufgabe-erkennen' ? t.parts[0]!.optionen : [];
          expect(opts.filter((o) => o.richtig)).toHaveLength(1);
          expect(new Set(opts.map((o) => o.text)).size).toBe(4);
        }
      }
    }
  });
});
