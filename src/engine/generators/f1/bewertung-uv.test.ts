// F5 – Golden Cases (eigene Zahlen, docs/m7/f1.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { formatNumber, type Val } from '../../money';
import { createRng } from '../../rng';
import { antwortAusParts } from '../../testing';
import { felderVon } from '../../check';
import { buchungText, forSeeds } from '../../test-utils';
import { FEHLERTYPEN_F1 } from '../../fehlertypen-batches/f1';
import { bewertungUv, solveVorrat, type VorratParams, type VorratVerfahren } from './bewertung-uv';

const f = (v: Val | undefined) => formatNumber(v!);

const GC = (verfahren: VorratVerfahren, tagespreis: string): VorratParams => ({
  verfahren,
  art: 'konzentrat',
  ab: { menge: 1000, preis: '4.00' },
  zugaenge: [
    { menge: 2000, preis: '4.60' },
    { menge: 1500, preis: '5.20' },
    { menge: 500, preis: '4.80' },
  ],
  endbestand: 1200,
  tagespreis,
});

describe('F5 Golden Cases', () => {
  it('GC-F5-1 gewogener Durchschnitt, Tageswert niedriger', () => {
    const s = solveVorrat(GC('durchschnitt', '4.50'));
    expect(f(s.durchschnitt)).toBe('4,68');
    expect([f(s.ak), f(s.tageswert), f(s.ansatz), f(s.abwertung)]).toEqual([
      '5.616,00',
      '5.400,00',
      '5.400,00',
      '216,00',
    ]);
    expect(buchungText(s.buchung)).toEqual(['SBK 5.400,00 € an Rohstoffe 5.400,00 €']);
  });

  it('GC-F5-2 Fifo, Tageswert niedriger', () => {
    const s = solveVorrat(GC('fifo', '4.50'));
    expect(s.schichten.map((x) => [x.menge, x.preis])).toEqual([
      [500, '4.80'],
      [700, '5.20'],
    ]);
    expect([f(s.ak), f(s.tageswert), f(s.ansatz), f(s.abwertung)]).toEqual([
      '6.040,00',
      '5.400,00',
      '5.400,00',
      '640,00',
    ]);
  });

  it('GC-F5-3 Lifo, Tageswert höher (Anschaffungskosten als Obergrenze)', () => {
    const s = solveVorrat(GC('lifo', '5.00'));
    expect(s.schichten.map((x) => [x.menge, x.preis])).toEqual([
      [1000, '4.00'],
      [200, '4.60'],
    ]);
    expect([f(s.ak), f(s.tageswert), f(s.ansatz), f(s.abwertung)]).toEqual([
      '4.920,00',
      '6.000,00',
      '4.920,00',
      '0,00',
    ]);
    expect(s.wahl).toBe('Anschaffungskosten');
  });

  it('GC-F5-4 typische Fehler: ungewichteter Durchschnitt 4,65 €/kg', () => {
    const p = GC('durchschnitt', '4.50');
    const v = bewertungUv.errorVariants(p).find((x) => x.fehlertyp === 'durchschnitt-ungewichtet')!;
    const oe = felderVon(v.parts[0]!).find((x) => x.id === 'oe');
    expect(oe?.typ === 'zahl' && formatNumber(oe.soll)).toBe('4,65');
  });
});

describe('F5 Eigenschaften', () => {
  it('Bilanzansatz = Minimum aus Anschaffungskosten und Tageswert; Buchung = Ansatz', () => {
    for (const variant of bewertungUv.variants) {
      forSeeds(
        bewertungUv,
        1000,
        (_p, s) => {
          const min = s.ak.cmp(s.tageswert) <= 0 ? s.ak : s.tageswert;
          expect(s.ansatz.exact.equals(min.exact)).toBe(true);
          expect(s.ak.minus(s.ansatz).exact.equals(s.abwertung.exact)).toBe(true);
          expect(s.buchung.saetze[0]!.soll[0]!.betrag.exact.equals(s.ansatz.exact)).toBe(true);
        },
        { variant },
      );
    }
  });

  it('Fifo + Lifo: Endbestand besteht aus genau der Inventurmenge', () => {
    for (const variant of ['fifo', 'lifo']) {
      forSeeds(
        bewertungUv,
        500,
        (p, s) => expect(s.schichten.reduce((a, x) => a + x.menge, 0)).toBe(p.endbestand),
        { variant },
      );
    }
  });

  it('jede Fehlervariante ist im Fehlerkatalog erklärt und wird erkannt', () => {
    for (const variant of bewertungUv.variants) {
      for (let seed = 1; seed <= 50; seed++) {
        const p = bewertungUv.generate(createRng(seed), { variant });
        const s = bewertungUv.solve(p);
        for (const v of bewertungUv.errorVariants(p)) {
          expect(FEHLERTYPEN_F1[v.fehlertyp], v.fehlertyp).toBeDefined();
          const r = bewertungUv.check(p, s, antwortAusParts(v.parts));
          if (!r.korrekt) expect(r.fehlertypen).toContain(v.fehlertyp);
        }
      }
    }
  });
});
