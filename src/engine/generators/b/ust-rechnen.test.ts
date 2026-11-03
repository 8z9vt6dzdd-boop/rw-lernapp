// B1 – Golden Cases (eigene Zahlen, docs/m7/b.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { dec, round } from '../../money';
import { antwortAusParts } from '../../testing';
import { forSeeds, selbstpruefung } from '../../test-utils';
import type { TaskAnswer } from '../../task';
import { ustRechnen, solveB1, type B1Beleg, type B1Params } from './ust-rechnen';

const basis: B1Params = {
  variante: 'netto-brutto',
  richtung: 'eingang',
  satz: '0.19',
  betrag: '0',
  gegenstand: 'Testgegenstand',
  partner: 'Testpartner',
  positionen: [],
  belege: [],
  monat: 'Januar',
  vorlage: 0,
};

const f2 = (v: { value: { toFixed(n: number): string } }) => v.value.toFixed(2);

function mitWerten(p: B1Params, werte: Record<string, string>): TaskAnswer {
  const a = antwortAusParts(ustRechnen.parts(p, solveB1(p)));
  const alt = (a['rechnung'] as { werte: Record<string, string> }).werte;
  a['rechnung'] = { typ: 'felder', werte: { ...alt, ...werte } };
  return a;
}

describe('Golden Cases B1', () => {
  it('GC-B1-01 Netto 4.200,00 zu 19 %', () => {
    const s = solveB1({ ...basis, betrag: '4200' });
    expect([f2(s.steuer), f2(s.brutto)]).toEqual(['798.00', '4998.00']);
  });

  it('GC-B1-02 Netto 350,00 zu 7 %', () => {
    const s = solveB1({ ...basis, satz: '0.07', betrag: '350' });
    expect([f2(s.steuer), f2(s.brutto)]).toEqual(['24.50', '374.50']);
  });

  it('GC-B1-03 Brutto 7.140,00 zu 19 %: ÷ 1,19, nicht „minus 19 %“', () => {
    const p: B1Params = { ...basis, variante: 'brutto-netto', betrag: '7140' };
    const s = solveB1(p);
    expect([f2(s.netto), f2(s.steuer)]).toEqual(['6000.00', '1140.00']);
    // Denkfehler: 7.140 − 19 % = 5.783,40 (Steuer 1.356,60)
    const r = ustRechnen.check(p, s, mitWerten(p, { netto: '5.783,40', steuer: '1.356,60' }));
    expect(r.korrekt).toBe(false);
    expect(r.fehlertypen).toContain('b-prozent-vom-brutto');
  });

  it('GC-B1-04 Brutto 214,00 zu 7 %', () => {
    const p: B1Params = { ...basis, variante: 'brutto-netto', satz: '0.07', betrag: '214' };
    const s = solveB1(p);
    expect([f2(s.netto), f2(s.steuer)]).toEqual(['200.00', '14.00']);
    // 19 % statt 7 % gerechnet: 214 ÷ 1,19 = 179,83
    const r = ustRechnen.check(p, s, mitWerten(p, { netto: '179,83', steuer: '34,17' }));
    expect(r.fehlertypen).toContain('b-steuersatz-verwechselt');
  });

  it('GC-B1-05 krummer Bruttobetrag 1.000,00 zu 19 %', () => {
    const s = solveB1({ ...basis, variante: 'brutto-netto', betrag: '1000' });
    expect([f2(s.netto), f2(s.steuer)]).toEqual(['840.34', '159.66']);
  });

  it('GC-B1-06 Steuerbetrag 570,00 zu 19 %', () => {
    const p: B1Params = { ...basis, variante: 'steuer-netto', betrag: '570' };
    const s = solveB1(p);
    expect([f2(s.netto), f2(s.brutto)]).toEqual(['3000.00', '3570.00']);
    // Denkfehler: 570 ÷ 0,19 = 3.000 als Bruttobetrag verstanden
    const r = ustRechnen.check(p, s, mitWerten(p, { netto: '2.430,00', brutto: '3.000,00' }));
    expect(r.fehlertypen).toContain('b-prozent-vom-brutto');
  });

  it('GC-B1-07 Rechnung mit 7 % (300,00) und 19 % (500,00)', () => {
    const p: B1Params = {
      ...basis,
      variante: 'zwei-saetze',
      positionen: [
        { text: 'Fachbücher', netto: '300', satz: '0.07' },
        { text: 'Druckerpapier', netto: '500', satz: '0.19' },
      ],
    };
    const s = solveB1(p);
    expect([f2(s.steuerRegel), f2(s.steuerErm), f2(s.brutto)]).toEqual([
      '95.00',
      '21.00',
      '916.00',
    ]);
    // alles mit 19 %: 7-%-Position mit 57,00 Steuer, Brutto 952,00
    const r = ustRechnen.check(p, s, mitWerten(p, { steuerErm: '57,00', brutto: '952,00' }));
    expect(r.fehlertypen).toContain('b-ein-satz-fuer-alles');
  });

  const belege: B1Beleg[] = [
    { richtung: 'ausgang', text: 'A1', betrag: '50000', brutto: false, satz: '0.19' },
    { richtung: 'ausgang', text: 'A2', betrag: '11900', brutto: true, satz: '0.19' },
    { richtung: 'eingang', text: 'E1', betrag: '20000', brutto: false, satz: '0.19' },
    { richtung: 'eingang', text: 'E2', betrag: '2140', brutto: true, satz: '0.07' },
  ];

  it('GC-B1-08 Zahllast eines Monats aus vier Belegen', () => {
    const p: B1Params = { ...basis, variante: 'zahllast', belege };
    const s = solveB1(p);
    expect([f2(s.vorsteuer), f2(s.umsatzsteuer), s.fall, f2(s.saldo)]).toEqual([
      '3940.00',
      '11400.00',
      'zahllast',
      '7460.00',
    ]);
    expect(
      ustRechnen.check(p, s, mitWerten(p, { fall: 'Vorsteuerüberhang' })).fehlertypen,
    ).toContain('b-zahllast-richtung');
    expect(
      ustRechnen.check(
        p,
        s,
        mitWerten(p, {
          vorsteuer: '11.400,00',
          umsatzsteuer: '3.940,00',
          fall: 'Vorsteuerüberhang',
        }),
      ).fehlertypen,
    ).toContain('steuer-falsches-konto');
  });

  it('GC-B1-09 Vorsteuerüberhang nach großer Investition', () => {
    const p: B1Params = {
      ...basis,
      variante: 'zahllast',
      belege: [
        { richtung: 'eingang', text: 'Maschine', betrag: '100000', brutto: false, satz: '0.19' },
        { richtung: 'ausgang', text: 'Verkauf', betrag: '30000', brutto: false, satz: '0.19' },
      ],
    };
    const s = solveB1(p);
    expect([s.fall, f2(s.saldo)]).toEqual(['ueberhang', '13300.00']);
  });
});

describe('B1 Eigenschaften', () => {
  it('Netto + Steuer = Brutto exakt; Musterlösung ist richtig', () => {
    forSeeds(ustRechnen, 1000, (p, s) => {
      if (p.variante !== 'zahllast')
        expect(s.netto.plus(s.steuer).value.equals(s.brutto.value)).toBe(true);
      expect(selbstpruefung(ustRechnen, p, s)).toBe(true);
    });
  });

  it('Steuer vom Nettobetrag, Rückrechnung mit ÷ (1 + Satz) statt „minus Satz“', () => {
    forSeeds(ustRechnen, 1000, (p, s) => {
      if (p.variante === 'netto-brutto') {
        expect(s.steuer.value.equals(round(dec(p.betrag).times(p.satz)))).toBe(true);
      }
      if (p.variante === 'brutto-netto') {
        const b = dec(p.betrag);
        expect(s.netto.value.equals(round(b.div(dec(1).plus(p.satz))))).toBe(true);
        // Gegenprobe: Netto × (1 + Satz) trifft den Bruttobetrag bis auf einen Cent
        expect(s.netto.value.times(dec(1).plus(p.satz)).minus(b).abs().lte('0.01')).toBe(true);
        // „Brutto minus 19 %“ ergäbe immer einen kleineren Nettobetrag
        expect(s.netto.value.gt(round(b.times(dec(1).minus(p.satz))))).toBe(true);
      }
      if (p.variante === 'steuer-netto') {
        expect(s.netto.value.times(p.satz).equals(dec(p.betrag))).toBe(true);
      }
    });
  });

  it('Zahllast: Summen je Richtung, Ergebnis passt zum Vergleich', () => {
    forSeeds(
      ustRechnen,
      500,
      (p, s) => {
        expect(p.belege.some((b) => b.richtung === 'eingang')).toBe(true);
        expect(p.belege.some((b) => b.richtung === 'ausgang')).toBe(true);
        const summe = (r: string) =>
          s.belegSteuern
            .filter((_, i) => p.belege[i]!.richtung === r)
            .reduce((a, v) => a.plus(v.value), dec(0));
        expect(summe('eingang').equals(s.vorsteuer.value)).toBe(true);
        expect(summe('ausgang').equals(s.umsatzsteuer.value)).toBe(true);
        const diff = s.umsatzsteuer.value.minus(s.vorsteuer.value);
        expect(s.fall).toBe(diff.gt(0) ? 'zahllast' : 'ueberhang');
        expect(s.saldo.value.equals(diff.abs())).toBe(true);
      },
      { variant: 'zahllast' },
    );
  });

  it('beide Steuersätze und krumme Werte kommen vor', () => {
    const saetze = new Set<string>();
    let krumm = 0;
    forSeeds(ustRechnen, 500, (p) => {
      saetze.add(p.satz);
      if (p.variante !== 'zahllast' && !dec(p.betrag).isInteger()) krumm++;
    });
    expect([...saetze].sort()).toEqual(['0.07', '0.19']);
    expect(krumm).toBeGreaterThan(20);
  });
});
