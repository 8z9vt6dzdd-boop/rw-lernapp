import { describe, expect, it } from 'vitest';
import { createRng } from '../../rng';
import { antwortAusParts } from '../../testing';
import { forSeeds, selbstpruefung } from '../../test-utils';
import {
  bezugskalkulation,
  kalkuliere,
  solveBezug,
  type Angebot,
  type BezugParams,
} from './bezugskalkulation';

const fix = (v: { value: { toFixed(n: number): string } }) => v.value.toFixed(2);

// GC-C7-1 (docs/m7/c2.md): 400 kg Zitronenaroma à 24,00 €, 10 % Rabatt, 2 % Skonto, Fracht 180,00 €.
const AROMA: Angebot = {
  lieferant: 'Aromahaus Tewes GmbH (Bielefeld)',
  preis: '24',
  rabatt: '0.1',
  skonto: '0.02',
  frachtArt: 'pauschal',
  fracht: '180',
  versicherung: '0',
};

// GC-C7-2: Angebotsvergleich, 2.000 Liter Fruchtsaftkonzentrat.
const A: Angebot = {
  lieferant: 'Fruchtkonzentrate Brakemeier GmbH (Detmold)',
  preis: '6',
  rabatt: '0.05',
  skonto: '0.02',
  frachtArt: 'pauschal',
  fracht: '240',
  versicherung: '0',
};
const B: Angebot = {
  lieferant: 'Aromahaus Tewes GmbH (Bielefeld)',
  preis: '6.4',
  rabatt: '0.125',
  skonto: '0.03',
  frachtArt: 'frei',
  fracht: '0',
  versicherung: '0',
};
const VERGLEICH: BezugParams = {
  variante: 'angebotsvergleich',
  gegenstand: 'Fruchtsaftkonzentrat',
  einheit: 'Liter',
  einheitEinzeln: 'Liter',
  preisBasis: 1,
  menge: 2000,
  a: A,
  b: B,
};

describe('Golden Cases Bezugskalkulation (GC-C7)', () => {
  it('GC-C7-1 vom Listeneinkaufspreis zum Bezugspreis', () => {
    const k = kalkuliere(AROMA, 400);
    expect([k.lep, k.rabatt, k.zep, k.skonto, k.bep, k.bezugskosten, k.bp].map(fix)).toEqual([
      '9600.00',
      '960.00',
      '8640.00',
      '172.80',
      '8467.20',
      '180.00',
      '8647.20',
    ]);
    expect(fix(k.bpEinheit)).toBe('21.62');
  });

  it('GC-C7-2 der niedrigere Listenpreis ist nicht das günstigere Angebot', () => {
    const s = solveBezug(VERGLEICH);
    expect(fix(s.a.bp)).toBe('11412.00');
    expect(fix(s.a.bpEinheit)).toBe('5.71');
    expect(fix(s.b!.bp)).toBe('10864.00');
    expect(fix(s.b!.bpEinheit)).toBe('5.43');
    expect(s.guenstiger).toBe('b');
    expect(fix(s.vorteil!)).toBe('548.00');
  });

  it('GC-C7-3 Preis je 100 kg und Fracht je 100 kg', () => {
    // 12.000 kg Zucker à 80,00 € je 100 kg, 10 % Rabatt, 2 % Skonto, Fracht 2,50 € je 100 kg
    const k = kalkuliere(
      {
        lieferant: 'Zuckerkontor Hellwegland KG (Lippstadt)',
        preis: '80',
        rabatt: '0.1',
        skonto: '0.02',
        frachtArt: 'je100',
        fracht: '2.5',
        versicherung: '0',
      },
      12000,
      {},
      100,
    );
    expect([k.lep, k.zep, k.bep, k.bezugskosten, k.bp, k.bpEinheit].map(fix)).toEqual([
      '9600.00',
      '8640.00',
      '8467.20',
      '300.00',
      '8767.20',
      '73.06',
    ]);
  });
});

describe('Bezugskalkulation: Bewertung und Fehlertypen', () => {
  const p: BezugParams = {
    variante: 'bezugspreis',
    gegenstand: 'Zitronenaroma',
    einheit: 'kg',
    einheitEinzeln: 'kg',
    preisBasis: 1,
    menge: 400,
    a: AROMA,
  };
  const s = solveBezug(p);
  const parts = bezugskalkulation.parts(p, s);

  it('erkennt Skonto vom Listenpreis', () => {
    const answer = antwortAusParts(parts);
    answer['schema'] = {
      typ: 'felder',
      werte: {
        lep: '9600',
        rabatt: '960',
        zep: '8640',
        skonto: '192',
        bep: '8448',
        bezugskosten: '180',
        bp: '8628',
        'bp-einheit': '21,57',
      },
    };
    const r = bezugskalkulation.check(p, s, answer);
    expect(r.korrekt).toBe(false);
    expect(r.fehlertypen).toContain('bezugskalk-skonto-vom-listenpreis');
  });

  it('erkennt mitskontierte Fracht', () => {
    const answer = antwortAusParts(parts);
    answer['schema'] = {
      typ: 'felder',
      werte: {
        lep: '9600',
        rabatt: '960',
        zep: '8640',
        skonto: '176,40',
        bep: '8463,60',
        bezugskosten: '180',
        bp: '8643,60',
        'bp-einheit': '21,61',
      },
    };
    expect(bezugskalkulation.check(p, s, answer).fehlertypen).toContain(
      'bezugskalk-bezugskosten-skontiert',
    );
  });

  it('erkennt die Entscheidung nach dem Listenpreis', () => {
    const sv = solveBezug(VERGLEICH);
    const answer = antwortAusParts(bezugskalkulation.parts(VERGLEICH, sv));
    answer['entscheidung'] = { typ: 'wahl', optionId: 'a' };
    const r = bezugskalkulation.check(VERGLEICH, sv, answer);
    expect(r.korrekt).toBe(false);
    expect(r.fehlertypen).toContain('bezugskalk-listenpreis-verglichen');
  });
});

describe('Bezugskalkulation: Eigenschaften über 1.000 Seeds', () => {
  it('Schema geht auf, Musterlösung wird akzeptiert', () => {
    forSeeds(bezugskalkulation, 1000, (p, s) => {
      for (const k of [s.a, ...(s.b ? [s.b] : [])]) {
        expect(k.lep.minus(k.rabatt).value.equals(k.zep.value)).toBe(true);
        expect(k.zep.minus(k.skonto).value.equals(k.bep.value)).toBe(true);
        expect(k.bep.plus(k.bezugskosten).value.equals(k.bp.value)).toBe(true);
        expect(k.bp.cmp(k.lep)).toBeLessThanOrEqual(1);
        expect(k.bpEinheit.exact.gt(0)).toBe(true);
      }
      if (p.variante === 'angebotsvergleich') {
        expect(p.b).toBeDefined();
        const besser = s.guenstiger === 'a' ? s.a : s.b!;
        const schlechter = s.guenstiger === 'a' ? s.b! : s.a;
        expect(besser.bp.cmp(schlechter.bp)).toBeLessThanOrEqual(0);
      }
      expect(selbstpruefung(bezugskalkulation, p, s)).toBe(true);
    });
  });

  it('im Vergleich verliert oft das Angebot mit dem niedrigeren Listenpreis', () => {
    let falle = 0;
    let n = 0;
    forSeeds(
      bezugskalkulation,
      300,
      (p, s) => {
        n++;
        const billiger = Number(p.a.preis) < Number(p.b!.preis) ? 'a' : 'b';
        if (billiger !== s.guenstiger) falle++;
      },
      { variant: 'angebotsvergleich' },
    );
    expect(falle / n).toBeGreaterThan(0.4);
    expect(falle / n).toBeLessThan(0.85);
  });

  it('deterministisch bei gleichem Seed', () => {
    expect(bezugskalkulation.generate(createRng(42))).toEqual(
      bezugskalkulation.generate(createRng(42)),
    );
  });
});
