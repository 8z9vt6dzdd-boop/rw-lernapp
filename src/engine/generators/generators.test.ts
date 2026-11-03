// Eigenschaftstests für alle Generatoren über je 1.000 Seeds.
import { describe, expect, it } from 'vitest';
import { FIRMA } from '../../config';
import { felderVon } from '../check';
import { istAusgeglichen } from '../booking';
import { sum } from '../money';
import { createRng } from '../rng';
import { antwortAusParts } from '../testing';
import { forSeeds } from '../test-utils';
import { aequivalenz } from './aequivalenz';
import { GENERATOREN } from './index';
import { simultan, stufenleiter } from './leistungsverrechnung';

const SEEDS = 1000;

describe.each(GENERATOREN.map((g) => [g.skillId, g] as const))('%s', (_id, g) => {
  it('Musterlösung wird als richtig erkannt, ohne Fehlertypen', () => {
    forSeeds(g, SEEDS, (p, s) => {
      const parts = g.parts(p, s);
      const r = g.check(p, s, antwortAusParts(parts));
      expect(r.korrekt).toBe(true);
      expect(r.fehlertypen).toEqual([]);
      expect(r.score).toBe(1);
    });
  });

  it('alle Buchungssätze sind ausgeglichen (Soll = Haben)', () => {
    forSeeds(g, SEEDS, (p, s) => {
      for (const part of g.parts(p, s)) {
        if (part.typ !== 'buchungssatz') continue;
        for (const l of [part.loesung, ...(part.alternativen ?? [])]) {
          for (const satz of l.saetze) expect(istAusgeglichen(satz)).toBe(true);
        }
      }
    });
  });

  it('typische Fehler werden erkannt', () => {
    let erkannt = 0;
    forSeeds(g, 300, (p, s) => {
      for (const v of g.errorVariants(p)) {
        const r = g.check(p, s, antwortAusParts(v.parts));
        if (!r.korrekt) {
          expect(r.fehlertypen).toContain(v.fehlertyp);
          erkannt++;
        }
      }
    });
    if (g.errorVariants(g.generate(createRng(1))).length > 0) expect(erkannt).toBeGreaterThan(0);
  });

  it('Texte sind vollständig (keine leeren Platzhalter)', () => {
    forSeeds(g, 200, (p, s) => {
      const t = g.render(p, FIRMA);
      const all = [
        t.titel,
        t.aufgabe,
        ...t.sachverhalt,
        ...(t.daten?.zeilen.flat() ?? []),
        ...g.hints(p, s),
      ].join(' ');
      expect(all).not.toMatch(/undefined|NaN|null|\[object/);
      for (const step of g.steps(p, s)) expect(JSON.stringify(step)).not.toMatch(/undefined|NaN/);
      for (const part of g.parts(p, s))
        for (const f of felderVon(part)) expect(f.label).not.toMatch(/undefined/);
    });
  });

  it('deterministisch bei gleichem Seed', () => {
    for (const seed of [1, 7, 99, 12345]) {
      expect(JSON.stringify(g.generate(createRng(seed)))).toBe(
        JSON.stringify(g.generate(createRng(seed))),
      );
    }
  });

  it('jede Variante lässt sich erzeugen', () => {
    for (const variant of g.variants) {
      const p = g.generate(createRng(5), { variant });
      expect(g.check(p, g.solve(p), antwortAusParts(g.parts(p, g.solve(p)))).korrekt).toBe(true);
    }
  });
});

describe('Prüfregeln Kostenstellenrechnung', () => {
  it('Stufenleiter: Summe Hauptkostenstellen = primäre Gemeinkosten (exakter Pfad)', () => {
    forSeeds(stufenleiter, SEEDS, (_p, s) => {
      expect(sum(s.summen).exact.minus(s.primaerGesamt.exact).abs().lte('0.000001')).toBe(true);
    });
  });

  it('Stufenleiter: gerundete Einzelwerte weichen höchstens 0,01 je Empfänger ab', () => {
    forSeeds(stufenleiter, SEEDS, (p, s) => {
      const gerundet = s.summen.reduce((a, v) => a.plus(v.value), sum([]).exact);
      expect(
        gerundet
          .minus(s.primaerGesamt.exact)
          .abs()
          .lte(0.01 * p.haupt.length + 0.005),
      ).toBe(true);
    });
  });

  it('Stufenleiter: klausurfreundliche Fälle gehen auf den Cent auf', () => {
    let glatt = 0;
    forSeeds(stufenleiter, SEEDS, (_p, s) => {
      if (sum(s.summen).value.equals(s.primaerGesamt.value)) glatt++;
    });
    expect(glatt).toBeGreaterThan(SEEDS * 0.7);
  });

  it('Simultan: exakter Pfad verteilt genau die primären Gemeinkosten', () => {
    forSeeds(simultan, SEEDS, (_p, s) => {
      const exakt = s.summen.reduce(
        (a, v) => a.plus(v.exact),
        s.summen[0]!.exact.minus(s.summen[0]!.exact),
      );
      expect(exakt.minus(s.primaerGesamt.exact).abs().lte('0.000001')).toBe(true);
    });
  });

  it('Äquivalenzziffern: Kosten aller Sorten = Gesamtkosten (Rundung ≤ 0,01 je Sorte bzw. je Stück)', () => {
    forSeeds(aequivalenz, SEEDS, (p, s) => {
      const exakt = s.kostenSorte.reduce((a, v) => a.plus(v.exact), sum([]).exact);
      expect(exakt.minus(p.gesamtkosten).abs().lte('0.000001')).toBe(true);
    });
  });
});
