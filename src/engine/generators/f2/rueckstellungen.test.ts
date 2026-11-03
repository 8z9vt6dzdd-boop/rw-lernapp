// F8 – Golden Cases (GC-F8-x aus docs/m7/f2.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { buchungText, forSeeds } from '../../test-utils';
import { antwortAusParts } from '../../testing';
import { rueckstellungen as g, solveF8, type F8Params } from './rueckstellungen';

const t = (p: F8Params) => buchungText(solveF8(p).buchung);
const p0: F8Params = {
  fall: 'bildung',
  anlass: 'instandhaltung',
  rueckstellung: '12000',
  tatsaechlich: '12000',
  ustSatz: '0.19',
};

describe('F8 Golden Cases', () => {
  it('GC-F8-1 Bildung für unterlassene Instandhaltung: ohne Umsatzsteuer', () => {
    expect(t(p0)).toEqual(['Fremdinstandhaltung 12.000,00 € an Rückstellungen 12.000,00 €']);
    expect(solveF8(p0).art).toBe('instandhaltung');
  });

  it('GC-F8-2 Inanspruchnahme mit Mehrbetrag und Vorsteuer', () => {
    expect(t({ ...p0, fall: 'inanspruchnahme', tatsaechlich: '13500' })).toEqual([
      'Rückstellungen 12.000,00 €, Periodenfremde Aufwendungen 1.500,00 €, Vorsteuer 2.565,00 € an Bank 16.065,00 €',
    ]);
  });

  it('GC-F8-3 Inanspruchnahme mit Minderbetrag ohne Umsatzsteuer (Vergleich im Rechtsstreit)', () => {
    expect(
      t({
        ...p0,
        fall: 'inanspruchnahme',
        anlass: 'prozess',
        rueckstellung: '20000',
        tatsaechlich: '17000',
      }),
    ).toEqual([
      'Rückstellungen 20.000,00 € an Bank 17.000,00 €, an Erträge aus der Auflösung von Rückstellungen 3.000,00 €',
    ]);
  });

  it('GC-F8-4 Inanspruchnahme mit Minderbetrag und Vorsteuer (Abschlusskosten)', () => {
    expect(
      t({
        ...p0,
        fall: 'inanspruchnahme',
        anlass: 'abschluss',
        rueckstellung: '5000',
        tatsaechlich: '4500',
      }),
    ).toEqual([
      'Rückstellungen 5.000,00 €, Vorsteuer 855,00 € an Bank 5.355,00 €, an Erträge aus der Auflösung von Rückstellungen 500,00 €',
    ]);
  });

  it('GC-F8-5 Auflösung, weil der Grund entfallen ist', () => {
    expect(
      t({ ...p0, fall: 'aufloesung', anlass: 'prozess', rueckstellung: '8000', tatsaechlich: '0' }),
    ).toEqual([
      'Rückstellungen 8.000,00 € an Erträge aus der Auflösung von Rückstellungen 8.000,00 €',
    ]);
  });
});

describe('F8 Eigenschaften', () => {
  for (const variant of g.variants) {
    it(`${variant}: Rückstellung netto, vollständig ausgebucht`, () => {
      forSeeds(
        g,
        500,
        (p, s) => {
          const satz = s.buchung.saetze[0]!;
          const konten = [...satz.soll, ...satz.haben].map((z) => z.konto);
          if (p.fall === 'bildung') {
            // Bildung nie mit Vorsteuer, immer im Haben auf Rückstellungen
            expect(konten).not.toContain('Vorsteuer');
            expect(satz.haben.map((z) => z.konto)).toEqual(['Rückstellungen']);
          } else {
            // Rückstellung wird immer in voller Höhe im Soll ausgebucht
            const rs = satz.soll.find((z) => z.konto === 'Rückstellungen')!;
            expect(rs.betrag.value.equals(p.rueckstellung)).toBe(true);
            expect(
              konten.filter((k) => k === 'Periodenfremde Aufwendungen').length,
            ).toBeLessThanOrEqual(1);
            expect(
              konten.includes('Periodenfremde Aufwendungen') &&
                konten.includes('Erträge aus der Auflösung von Rückstellungen'),
            ).toBe(false);
          }
          for (const v of g.errorVariants(p)) {
            expect(g.check(p, s, antwortAusParts(v.parts)).korrekt, v.fehlertyp).toBe(false);
          }
        },
        { variant },
      );
    });
  }
});
