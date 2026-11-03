// Wiederholungsplanung im Zeitraffer (simuliertes Datum).
import { describe, expect, it } from 'vitest';
import { abrufwahrscheinlichkeit, faellig, karten, merksatzKarten, skillStand } from './scheduler';
import { kurzSitzungGeplant, verschraenken } from './session';
import { createRng } from '../engine/rng';
import { lektionFuerSkill } from '../content/lessons';
import type { AttemptEvent, LektionEvent, LernEreignis } from './types';

const T0 = new Date('2026-03-02T18:00:00');
const tag = (n: number) => new Date(T0.getTime() + n * 86_400_000);
let nr = 0;

function lektion(skillId: string, lektionId: string, d: Date): LektionEvent {
  return {
    typ: 'lektion',
    id: `l${++nr}`,
    ts: d.toISOString(),
    deviceId: 'd',
    lektionId,
    skillId,
    art: 'abgeschlossen',
    durationMs: 240_000,
  };
}

function versuch(
  skillId: string,
  d: Date,
  correct = true,
  rating: 1 | 2 | 3 | 4 = 4,
): AttemptEvent {
  return {
    typ: 'attempt',
    id: `a${++nr}`,
    ts: d.toISOString(),
    deviceId: 'd',
    skillId,
    seed: nr,
    mode: 'kurz',
    answer: {},
    correct,
    hintsUsed: 0,
    errorTypes: [],
    durationMs: 60_000,
    fsrsRating: correct ? rating : 1,
  };
}

describe('FSRS-Rekonstruktion aus Ereignissen', () => {
  it('jeder Merksatz der Lektionen wird eine Karte mit Frage', () => {
    const m = merksatzKarten();
    expect(m.length).toBeGreaterThanOrEqual(5);
    for (const k of m) expect(k.frage.length).toBeGreaterThan(10);
  });

  it('nach einer Lektion: Merksatz-Karten und Übung sind neu und fällig', () => {
    const ev = [lektion('C5-skonto-einkauf', 'C5', T0)];
    const k = karten(ev);
    expect(k.get('C5-skonto-einkauf')?.status).toBe('neu');
    expect(k.get('karte:C5-m1')).toBeDefined();
  });

  it('Kompetenz verblasst im Zeitraffer und Wiederholung wird fällig', () => {
    const ev: LernEreignis[] = [
      lektion('C5-skonto-einkauf', 'C5', T0),
      versuch('C5-skonto-einkauf', T0),
    ];
    const k = karten(ev).get('C5-skonto-einkauf')!;
    const r1 = abrufwahrscheinlichkeit(k, tag(1));
    const r30 = abrufwahrscheinlichkeit(k, tag(30));
    const r120 = abrufwahrscheinlichkeit(k, tag(120));
    expect(r1).toBeGreaterThan(r30);
    expect(r30).toBeGreaterThan(r120);
    expect(faellig(k, tag(0.5))).toBe(false);
    expect(faellig(k, tag(120))).toBe(true);
  });

  it('gefestigt nach 3 richtigen Lösungen ohne Hilfe an unterschiedlichen Tagen', () => {
    const ev = [
      versuch('B3-ust-abschluss', T0),
      versuch('B3-ust-abschluss', T0),
      versuch('B3-ust-abschluss', tag(3)),
      versuch('B3-ust-abschluss', tag(9)),
    ];
    expect(karten(ev).get('B3-ust-abschluss')?.status).toBe('gefestigt');
  });

  it('Rekonstruktion ist unabhängig von der Reihenfolge der Ereignisse (Abgleich mehrerer Geräte)', () => {
    const ev = [
      lektion('C5-skonto-einkauf', 'C5', T0),
      versuch('C5-skonto-einkauf', tag(1)),
      versuch('C5-skonto-einkauf', tag(4), false),
    ];
    const a = karten(ev).get('C5-skonto-einkauf')!.card.due.getTime();
    const b = karten([...ev].reverse())
      .get('C5-skonto-einkauf')!
      .card.due.getTime();
    expect(a).toBe(b);
  });

  it('Skill-Stand zwischen 0 und 1', () => {
    const k = karten([lektion('C5-skonto-einkauf', 'C5', T0), versuch('C5-skonto-einkauf', T0)]);
    const s = skillStand(k, 'C5-skonto-einkauf', tag(2))!;
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThanOrEqual(1);
  });
});

describe('Geplante Kurz-Sitzung', () => {
  it('ohne erledigte Lektion: nur Skills ohne Lektion (sonst leer – erst die Lektion)', () => {
    for (const spec of kurzSitzungGeplant([], T0, 1))
      expect(lektionFuerSkill(spec.skillId)).toBeUndefined();
  });

  it('nach Lektion C5: Übung und Merksatz-Karte als Neues', () => {
    const s = kurzSitzungGeplant([lektion('C5-skonto-einkauf', 'C5', T0)], tag(0.1), 1);
    expect(s.some((x) => x.art === 'aufgabe' && x.skillId === 'C5-skonto-einkauf')).toBe(true);
    expect(s.some((x) => x.art === 'karte')).toBe(true);
  });

  it('fällige Wiederholungen werden bevorzugt, nicht fällige nach kurzer Zeit nicht wiederholt geplant', () => {
    const ev: LernEreignis[] = [
      lektion('C5-skonto-einkauf', 'C5', T0),
      versuch('C5-skonto-einkauf', T0),
    ];
    const spaeter = kurzSitzungGeplant(ev, tag(200), 2);
    expect(
      spaeter.filter((x) => x.skillId === 'C5-skonto-einkauf' && x.art === 'aufgabe').length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('Interleaving: keine zwei gleichen Skills direkt hintereinander, wenn vermeidbar', () => {
    const specs = ['a', 'a', 'a', 'b', 'b', 'c', 'c', 'd'].map((skillId, i) => ({
      key: String(i),
      art: 'aufgabe' as const,
      skillId,
      seed: i,
    }));
    for (let seed = 1; seed < 50; seed++) {
      const v = verschraenken(createRng(seed), specs);
      const doppelt = v.filter((x, i) => i > 0 && x.skillId === v[i - 1]!.skillId).length;
      expect(doppelt).toBeLessThanOrEqual(1);
    }
  });
});
