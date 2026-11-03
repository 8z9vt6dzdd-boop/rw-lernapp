import { describe, expect, it } from 'vitest';
import { elementIdVon, gemeldet } from './meldungen';
import { kurzSitzungGeplant } from './session';
import type { LernEreignis, LektionEvent, MeldungEvent } from './types';

const meldung = (elementId: string, ts: string, zurueckgezogen = false): MeldungEvent => ({
  typ: 'meldung',
  id: `${elementId}-${ts}`,
  ts,
  deviceId: 'd',
  elementId,
  ...(zurueckgezogen ? { zurueckgezogen } : {}),
});
const lektion = (skillId: string, lektionId: string): LektionEvent => ({
  typ: 'lektion',
  id: lektionId,
  ts: '2026-11-01T10:00:00Z',
  deviceId: 'd',
  lektionId,
  skillId,
  art: 'abgeschlossen',
  durationMs: 60_000,
});

describe('Meldefunktion', () => {
  it('jüngste Meldung zählt, Zurückziehen hebt sie auf', () => {
    const e: LernEreignis[] = [
      meldung('aufgabe:C5-skonto-einkauf', '2026-11-01T10:00:00Z'),
      meldung('karte:A2-m1', '2026-11-01T10:00:00Z'),
      meldung('karte:A2-m1', '2026-11-02T10:00:00Z', true),
    ];
    expect([...gemeldet(e)]).toEqual(['aufgabe:C5-skonto-einkauf']);
  });

  it('gemeldete Übungen kommen in der Kurz-Sitzung nicht mehr vor', () => {
    const basis: LernEreignis[] = [
      lektion('C5-skonto-einkauf', 'C5'),
      lektion('B3-ust-abschluss', 'B3'),
    ];
    const now = new Date('2026-11-03T10:00:00Z');
    const vorher = kurzSitzungGeplant(basis, now, 42);
    expect(vorher.some((s) => s.skillId === 'C5-skonto-einkauf')).toBe(true);
    const nachher = kurzSitzungGeplant(
      [...basis, meldung('aufgabe:C5-skonto-einkauf', '2026-11-02T10:00:00Z')],
      now,
      42,
    );
    expect(nachher.some((s) => elementIdVon(s) === 'aufgabe:C5-skonto-einkauf')).toBe(false);
    expect(nachher.length).toBeGreaterThan(0);
  });
});
