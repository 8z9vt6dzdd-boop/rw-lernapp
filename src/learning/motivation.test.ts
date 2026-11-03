import { describe, expect, it } from 'vitest';
import {
  erfolge,
  karriere,
  plusTage,
  serie,
  stufe,
  tagKey,
  tagesaufgaben,
  xpGesamt,
} from './motivation';
import type { LektionEvent, LernEreignis } from './types';

const START = '2026-03-02'; // Montag

let n = 0;
function lektion(tag: string, stunde = 18): LektionEvent {
  n++;
  return {
    typ: 'lektion',
    id: `l${n}`,
    ts: new Date(`${tag}T${String(stunde).padStart(2, '0')}:00:00`).toISOString(),
    deviceId: 'd',
    lektionId: '0.1',
    skillId: '0.1-wozu',
    art: 'abgeschlossen',
    durationMs: 120_000,
  };
}

/** Lernplan: Zeichen je Tag ab START – '1' Ziel erreicht, '2' doppeltes Ziel, '0' verpasst. */
function plan(muster: string): LernEreignis[] {
  const ev: LernEreignis[] = [];
  [...muster].forEach((c, i) => {
    const tag = plusTage(START, i);
    if (c === '1') ev.push(lektion(tag));
    if (c === '2') ev.push(lektion(tag, 10), lektion(tag, 20));
  });
  return ev;
}

const heuteNach = (muster: string) => plusTage(START, muster.length - 1);

describe('Tagesserie mit Serienschutz und Reparatur (simulierte Datumswechsel)', () => {
  it('zählt aufeinanderfolgende Tage und vergibt je 7 Tage einen Schutz', () => {
    const m = '1111111111';
    const s = serie(plan(m), 'normal', heuteNach(m));
    expect(s.laenge).toBe(10);
    expect(s.schutz).toBe(1);
    expect(s.heuteErreicht).toBe(true);
    expect(s.meilenstein).toBe(7);
  });

  it('höchstens 2 Schutztage', () => {
    const m = '1'.repeat(30);
    expect(serie(plan(m), 'normal', heuteNach(m)).schutz).toBe(2);
  });

  it('ein verpasster Tag verbraucht automatisch den Schutz, die Serie läuft weiter', () => {
    const m = '1111111' + '0' + '1';
    const s = serie(plan(m), 'normal', heuteNach(m));
    expect(s.laenge).toBe(8);
    expect(s.schutz).toBe(0);
    expect(s.geschuetzt).toEqual([plusTage(START, 7)]);
  });

  it('ohne Schutz: doppeltes Tagesziel am nächsten Tag repariert die Serie', () => {
    const m = '111' + '0' + '2';
    const s = serie(plan(m), 'normal', heuteNach(m));
    expect(s.laenge).toBe(5);
    expect(s.reparatur).toBeUndefined();
  });

  it('ohne Schutz: einfaches Ziel startet neu, Reparatur bleibt 48 Stunden möglich', () => {
    const m = '111' + '0' + '1';
    const s = serie(plan(m), 'normal', heuteNach(m));
    expect(s.laenge).toBe(1);
    expect(s.reparatur).toEqual({
      verpasst: plusTage(START, 3),
      bis: plusTage(START, 5),
      vorher: 3,
    });
    const m2 = '111' + '0' + '1' + '2';
    expect(serie(plan(m2), 'normal', heuteNach(m2)).laenge).toBe(6);
  });

  it('nach Ablauf der 48 Stunden ist keine Reparatur mehr möglich', () => {
    const m = '111' + '0' + '1' + '1' + '2';
    const s = serie(plan(m), 'normal', heuteNach(m));
    expect(s.laenge).toBe(3);
    expect(s.rekord).toBe(3);
  });

  it('zwei verpasste Tage ohne Schutz: Serie gerissen, keine Reparatur', () => {
    const m = '111' + '00' + '2';
    const s = serie(plan(m), 'normal', heuteNach(m));
    expect(s.laenge).toBe(1);
    expect(s.reparatur).toBeUndefined();
  });

  it('der heutige Tag reißt die Serie nie (noch offen)', () => {
    const m = '11111';
    const s = serie(plan(m), 'normal', plusTage(START, 5));
    expect(s.laenge).toBe(5);
    expect(s.heuteErreicht).toBe(false);
  });

  it('Lernpause von 14 Tagen: alles wieder aufbaubar, Rekord bleibt erhalten', () => {
    const m = '1'.repeat(10) + '0'.repeat(14) + '1';
    const s = serie(plan(m), 'normal', heuteNach(m));
    expect(s.laenge).toBe(1);
    expect(s.rekord).toBe(10);
  });
});

describe('Tagesaufgaben, XP, Stufen, Karriere, Erfolge', () => {
  it('drei unterschiedliche Tagesaufgaben je Tag, deterministisch', () => {
    for (let i = 0; i < 60; i++) {
      const tag = plusTage(START, i);
      const a = tagesaufgaben([], tag);
      expect(a).toHaveLength(3);
      expect(new Set(a.map((x) => x.id)).size).toBe(3);
      expect(tagesaufgaben([], tag).map((x) => x.id)).toEqual(a.map((x) => x.id));
    }
  });

  it('XP nie negativ, Stufen wachsen', () => {
    expect(xpGesamt([])).toBe(0);
    expect(xpGesamt(plan('111'))).toBeGreaterThan(0);
    expect(stufe(0).stufe).toBe(1);
    expect(stufe(100).stufe).toBe(2);
    expect(stufe(299).stufe).toBe(2);
    expect(stufe(300).stufe).toBe(3);
  });

  it('Karriere startet bei „Neu im Team“', () => {
    expect(karriere([]).aktuell.titel).toBe('Neu im Team');
    expect(karriere([]).naechste?.titel).toBe('Assistenz Buchhaltung');
  });

  it('rund 25 Erfolge mit eindeutigen IDs; erste Lektion schaltet einen frei', () => {
    const e = erfolge(plan('1'), 'normal', START);
    expect(e.length).toBeGreaterThanOrEqual(25);
    expect(new Set(e.map((x) => x.id)).size).toBe(e.length);
    expect(e.find((x) => x.id === 'erste-lektion')?.erreicht).toBe(true);
    expect(tagKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
