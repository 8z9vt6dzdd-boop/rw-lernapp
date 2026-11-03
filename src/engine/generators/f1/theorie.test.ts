// Formatprüfung der Theorie-Elemente aus Batch f1 (07-content-pipeline.md).
import { describe, expect, it } from 'vitest';
import elemente from '../../../content/theory/f1.json' with { type: 'json' };
import { FEHLERTYPEN } from '../../fehlertypen';

type Roh = Record<string, unknown> & { id: string; typ: string; status: string };
const ALLE = elemente as unknown as Roh[];
const SKILLS = [
  'F1-bilanztheorien',
  'F2-hgb-grundlagen',
  'F3-wertmassstaebe',
  'F4-ansatz',
  'F5-bewertung-uv',
];

describe('Theorie Batch f1', () => {
  it('Pflichtfelder, eindeutige IDs, Prüfvermerk', () => {
    expect(new Set(ALLE.map((e) => e.id)).size).toBe(ALLE.length);
    for (const e of ALLE) {
      for (const k of ['id', 'skill', 'typ', 'quelle', 'status', 'pruefung'])
        expect(e[k], `${e.id}.${k}`).toBeDefined();
      expect(SKILLS).toContain(e.skill);
      const p = e.pruefung as { faktenabgleich: string; ueberschneidung: string; datum: string };
      expect(p.datum).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (e.status === 'aktiv') expect(p.faktenabgleich).toMatch(/^(ok|korrigiert)/);
    }
  });

  it('je Theorie-Skill 5–15 aktive Elemente, mindestens eine Kurzantwort', () => {
    for (const skill of ['F1-bilanztheorien', 'F2-hgb-grundlagen', 'F4-ansatz']) {
      const aktiv = ALLE.filter((e) => e.skill === skill && e.status === 'aktiv');
      expect(aktiv.length).toBeGreaterThanOrEqual(5);
      expect(aktiv.length).toBeLessThanOrEqual(15);
      expect(aktiv.some((e) => e.typ === 'kurzantwort')).toBe(true);
    }
  });

  it('Formate: Karte ≤ 60 Wörter, MC mit genau einer richtigen Option, Kurzantwort mit Punkten', () => {
    for (const e of ALLE) {
      if (e.typ === 'karte')
        expect((e.antwort as string).split(/\s+/).length, e.id).toBeLessThanOrEqual(60);
      if (e.typ === 'mc') {
        const o = e.optionen as { richtig?: boolean; fehlertyp?: string; erklaerung?: string }[];
        expect(o.filter((x) => x.richtig)).toHaveLength(1);
        for (const x of o) {
          if (!x.richtig) expect(x.erklaerung, e.id).toBeDefined();
          if (x.fehlertyp) expect(FEHLERTYPEN[x.fehlertyp], x.fehlertyp).toBeDefined();
        }
      }
      if (e.typ === 'kurzantwort') {
        const c = e.checkliste as { aussage: string; punkte: number }[];
        expect(c.reduce((a, x) => a + x.punkte, 0)).toBe(e.punkte);
        expect((e.muster as string).length).toBeGreaterThan(100);
        expect(e.frage as string).toMatch(/^(Erläutern|Erklären|Nennen|Unterscheiden)/);
      }
    }
  });
});
