// F7 – Golden Cases (GC-13 aus 04-fachregeln.md, GC-F7-x aus docs/m7/f2.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { dec } from '../../money';
import { buchungText, forSeeds } from '../../test-utils';
import { antwortAusParts } from '../../testing';
import { rechnungsabgrenzung as g, solveF7, type F7Params } from './rechnungsabgrenzung';

const t = (p: F7Params) => buchungText(solveF7(p).buchung);

describe('F7 Golden Cases', () => {
  it('GC-13 Miete Dezember bis Februar am 1.12. bezahlt: 2/3 aktiv abgrenzen', () => {
    const p: F7Params = { fall: 'arap', vorlage: 0, betrag: '3000', start: 12, monate: 3 };
    expect(solveF7(p).neuMonate).toBe(2);
    expect(t(p)).toEqual(['ARAP 2.000,00 € an Mietaufwendungen 2.000,00 €']);
  });

  it('GC-F7-1 Kfz-Steuer April bis März: 3 Monate gehören ins neue Jahr', () => {
    expect(t({ fall: 'arap', vorlage: 1, betrag: '960', start: 4, monate: 12 })).toEqual([
      'ARAP 240,00 € an Betriebssteuern 240,00 €',
    ]);
  });

  it('GC-F7-2 Messestand im Februar des neuen Jahres: voller Betrag aktiv abgrenzen', () => {
    expect(t({ fall: 'arap', vorlage: 3, betrag: '6000', start: 14, monate: 1 })).toEqual([
      'ARAP 6.000,00 € an Werbung 6.000,00 €',
    ]);
  });

  it('GC-F7-3 Miete November bis April im Voraus erhalten: 4/6 passiv abgrenzen', () => {
    expect(t({ fall: 'prap', vorlage: 0, betrag: '7200', start: 11, monate: 6 })).toEqual([
      'Mieterträge 4.800,00 € an PRAP 4.800,00 €',
    ]);
  });

  it('GC-F7-4 Darlehenszinsen November bis April nachträglich: 2/6 sonstige Verbindlichkeit', () => {
    expect(
      t({ fall: 'sonstige-verbindlichkeit', vorlage: 0, betrag: '4800', start: 11, monate: 6 }),
    ).toEqual(['Zinsaufwendungen 1.600,00 € an Sonstige Verbindlichkeiten 1.600,00 €']);
  });

  it('GC-F7-5 Festgeldzinsen August bis Januar nachträglich: 5/6 sonstige Forderung', () => {
    expect(
      t({ fall: 'sonstige-forderung', vorlage: 0, betrag: '900', start: 8, monate: 6 }),
    ).toEqual(['Sonstige Forderungen 750,00 € an Zinserträge 750,00 €']);
  });
});

describe('F7 Eigenschaften', () => {
  for (const variant of g.variants) {
    it(`${variant}: Zeitanteil monatsgenau, Zahlungszeitpunkt passt zum Fall`, () => {
      forSeeds(
        g,
        500,
        (p, s) => {
          expect(s.altMonate + s.neuMonate).toBe(p.monate);
          const transitorisch = p.fall === 'arap' || p.fall === 'prap';
          if (transitorisch) {
            expect(s.neuMonate).toBeGreaterThanOrEqual(1);
            expect(s.abgrenzMonate).toBe(s.neuMonate);
          } else {
            expect(s.altMonate).toBeGreaterThanOrEqual(1);
            expect(p.start).toBeLessThanOrEqual(12);
            expect(s.abgrenzMonate).toBe(s.altMonate);
          }
          // Betrag ÷ Monate × Anteil, kaufmännisch auf Cent gerundet
          const soll = dec(p.betrag).times(s.abgrenzMonate).div(p.monate);
          expect(s.abgrenzung.value.minus(soll).abs().lte('0.005')).toBe(true);
          expect(s.abgrenzung.value.lte(p.betrag)).toBe(true);
          for (const v of g.errorVariants(p)) {
            expect(g.check(p, s, antwortAusParts(v.parts)).korrekt, v.fehlertyp).toBe(false);
          }
        },
        { variant },
      );
    });
  }
});
