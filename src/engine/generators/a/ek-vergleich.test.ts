// A7 – Golden Cases (eigene Zahlen, docs/m7/a.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { forSeeds } from '../../test-utils';
import { ekVergleich, solveEkVergleich, type A7Params } from './ek-vergleich';

const leer: A7Params = {
  variante: 'standard',
  ekAnfang: '0',
  ekEnde: '0',
  vermoegenAnfang: '0',
  schuldenAnfang: '0',
  vermoegenEnde: '0',
  schuldenEnde: '0',
  entnahmen: [],
  einlagen: [],
  erfolg: '0',
};
const pp = (...b: string[]) => b.map((betrag) => ({ text: 'x', betrag }));

describe('Golden Cases A7', () => {
  it('GC-A7-01 EK 300.000 → 318.000, Entnahmen 30.000, Einlage 10.000 → Gewinn 38.000', () => {
    const s = solveEkVergleich({
      ...leer,
      ekAnfang: '300000',
      ekEnde: '318000',
      entnahmen: pp('24000', '6000'),
      einlagen: pp('10000'),
    });
    expect(s.veraenderung.value.toFixed(0)).toBe('18000');
    expect(s.erfolg.value.toFixed(0)).toBe('38000');
    expect(s.ergebnis).toBe('Gewinn');
  });

  it('GC-A7-02 EK 250.000 → 226.000, Entnahmen 15.000 → Verlust 9.000', () => {
    const s = solveEkVergleich({
      ...leer,
      ekAnfang: '250000',
      ekEnde: '226000',
      entnahmen: pp('15000'),
    });
    expect(s.veraenderung.value.toFixed(0)).toBe('-24000');
    expect(s.erfolg.value.toFixed(0)).toBe('-9000');
    expect(s.ergebnis).toBe('Verlust');
  });

  it('GC-A7-03 aus Vermögen und Schulden: EK 320.000 → 330.000, Entnahme 20.000 → Gewinn 30.000', () => {
    const s = solveEkVergleich({
      ...leer,
      variante: 'vermoegen',
      vermoegenAnfang: '520000',
      schuldenAnfang: '200000',
      vermoegenEnde: '560000',
      schuldenEnde: '230000',
      entnahmen: pp('20000'),
    });
    expect([s.ekAnfang, s.ekEnde, s.erfolg].map((x) => x.value.toFixed(0))).toEqual([
      '320000',
      '330000',
      '30000',
    ]);
  });

  it('GC-A7-04 rückwärts: 400.000 + 60.000 − 45.000 + 5.000 = 420.000', () => {
    const s = solveEkVergleich({
      ...leer,
      variante: 'rueckwaerts',
      ekAnfang: '400000',
      erfolg: '60000',
      entnahmen: pp('45000'),
      einlagen: pp('5000'),
    });
    expect(s.ekEnde.value.toFixed(0)).toBe('420000');
  });
});

describe('A7 Eigenschaften', () => {
  it('Erfolg = ΔEK + Entnahmen − Einlagen; rückwärts ist die Umkehrung', () => {
    forSeeds(ekVergleich, 1000, (p, s) => {
      if (p.variante === 'rueckwaerts') {
        const vorwaerts = solveEkVergleich({
          ...p,
          variante: 'standard',
          ekEnde: s.ekEnde.value.toFixed(2),
        });
        expect(vorwaerts.erfolg.value.equals(s.erfolg.value)).toBe(true);
      } else {
        expect(
          s.ekEnde
            .minus(s.ekAnfang)
            .plus(s.entnahmen)
            .minus(s.einlagen)
            .value.equals(s.erfolg.value),
        ).toBe(true);
        expect(s.ergebnis).toBe(s.erfolg.isNegative() ? 'Verlust' : 'Gewinn');
      }
      if (p.variante === 'ohne-privat')
        expect(s.erfolg.value.equals(s.veraenderung.value)).toBe(true);
    });
  });
});
