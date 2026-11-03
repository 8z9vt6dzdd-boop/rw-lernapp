import { describe, expect, it } from 'vitest';
import { ABSCHNITTE } from '../content/curriculum';
import { antwortAusParts } from '../engine/testing';
import {
  bewerteKlausur,
  klausurTask,
  miniKlausur,
  miniKlausurMoeglich,
  probeklausur,
  punkteAus,
} from './klausur';

describe('Probeklausur', () => {
  it('hat 90 Punkte, ca. 40 Buchführung und 50 KLR', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const p = probeklausur(seed);
      const summe = p.aufgaben.reduce((a, x) => a + x.punkte, 0);
      expect(summe).toBe(90);
      expect(p.minuten).toBe(90);
      const bf = p.aufgaben
        .filter((a) => /^[A-F]/.test(a.skillId))
        .reduce((a, x) => a + x.punkte, 0);
      expect(bf).toBe(40);
    }
  });

  it('Musterlösung ergibt volle Punktzahl, leere Abgabe null Punkte', () => {
    for (let seed = 1; seed <= 15; seed++) {
      const plan = probeklausur(seed);
      const voll = Object.fromEntries(
        plan.aufgaben.map((a) => [a.key, antwortAusParts(klausurTask(a).parts)]),
      );
      const e = bewerteKlausur(plan, voll);
      expect(e.punkte).toBe(90);
      expect(e.prozent).toBe(100);
      const leer = bewerteKlausur(plan, {});
      expect(leer.punkte).toBe(0);
      expect(leer.skills.length).toBeGreaterThan(4);
    }
  });

  it('Teilpunkte auf halbe Punkte abgerundet', () => {
    expect(punkteAus(0.5, 5)).toBe(2.5);
    expect(punkteAus(0.33, 10)).toBe(3);
    expect(punkteAus(1, 24)).toBe(24);
  });
});

describe('Mini-Klausur', () => {
  it('für jeden Abschnitt mit Rechen-Skills lösbar', () => {
    for (const a of ABSCHNITTE.filter((x) => miniKlausurMoeglich(x.id))) {
      const plan = miniKlausur(a.id, 7);
      expect(plan.aufgaben.length).toBeGreaterThanOrEqual(3);
      const voll = Object.fromEntries(
        plan.aufgaben.map((x) => [x.key, antwortAusParts(klausurTask(x).parts)]),
      );
      expect(bewerteKlausur(plan, voll).prozent).toBe(100);
    }
  });
});
