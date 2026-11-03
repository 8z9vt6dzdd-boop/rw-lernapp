// D6 – Golden Cases (eigene Zahlen, docs/m7/d.md; GC-08 aus 04-fachregeln.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { alleAusgeglichen, buchungText, forSeeds } from '../../test-utils';
import { privat, solvePrivat, type PrivatParams } from './privat';

const basis: PrivatParams = {
  fall: 'gegenstand',
  gesellschafter: 'Frank Wessel',
  betrag: '600',
  menge: 0,
  stueckwert: '0',
  konto: 'Bank',
  was: '„Senne Lemon“',
  anlagekonto: '',
  soll: [],
  haben: [],
  ustSatz: '0.19',
};

describe('Golden Cases D6', () => {
  it('GC-08 Entnahme von Erzeugnissen netto 600 €', () => {
    expect(buchungText(solvePrivat(basis).buchung)).toEqual([
      'Privat 714,00 € an Entnahme v. G. u. s. L. 600,00 €, an Umsatzsteuer 114,00 €',
    ]);
  });

  it('GC-D6-01 Entnahme 50 Kartons à 7,50 € netto', () => {
    expect(buchungText(solvePrivat({ ...basis, menge: 50, stueckwert: '7.5' }).buchung)).toEqual([
      'Privat 446,25 € an Entnahme v. G. u. s. L. 375,00 €, an Umsatzsteuer 71,25 €',
    ]);
  });

  it('GC-D6-02 private Rechnung 2.380 € brutto über das Geschäftskonto', () => {
    expect(
      buchungText(solvePrivat({ ...basis, fall: 'privatrechnung', betrag: '2380' }).buchung),
    ).toEqual(['Privat 2.380,00 € an Bank 2.380,00 €']);
  });

  it('GC-D6-03 Sacheinlage Pkw, Zeitwert 12.000 €', () => {
    expect(
      buchungText(
        solvePrivat({ ...basis, fall: 'einlage-sache', betrag: '12000', anlagekonto: 'Fuhrpark' })
          .buchung,
      ),
    ).toEqual(['Fuhrpark 12.000,00 € an Privat 12.000,00 €']);
  });

  it('GC-D6-04 Abschluss: Entnahmen überwiegen', () => {
    const s = solvePrivat({
      ...basis,
      fall: 'abschluss',
      soll: [
        { text: 'Geldentnahmen', betrag: '30000' },
        { text: 'Einkommensteuer', betrag: '8000' },
        { text: 'Entnahme Erzeugnisse', betrag: '714' },
      ],
      haben: [{ text: 'Einlage Bank', betrag: '10000' }],
    });
    expect(s.saldoSeite).toBe('Haben');
    expect(buchungText(s.buchung)).toEqual(['Eigenkapital 28.714,00 € an Privat 28.714,00 €']);
  });

  it('GC-D6-05 Abschluss: Einlagen überwiegen', () => {
    const s = solvePrivat({
      ...basis,
      fall: 'abschluss',
      soll: [{ text: 'Geldentnahmen', betrag: '5000' }],
      haben: [{ text: 'Einlage Bank', betrag: '20000' }],
    });
    expect(s.saldoSeite).toBe('Soll');
    expect(buchungText(s.buchung)).toEqual(['Privat 15.000,00 € an Eigenkapital 15.000,00 €']);
  });
});

describe('D6 Eigenschaften', () => {
  it('Privat steht bei Entnahmen im Soll, bei Einlagen im Haben; USt nur bei Gegenständen/Leistungen', () => {
    forSeeds(privat, 500, (p, s) => {
      expect(alleAusgeglichen(s.buchung)).toBe(true);
      const satz = s.buchung.saetze[0]!;
      const soll = satz.soll.map((z) => z.konto);
      const haben = satz.haben.map((z) => z.konto);
      if (p.fall.startsWith('einlage')) expect(haben).toEqual(['Privat']);
      else if (p.fall !== 'abschluss') expect(soll).toEqual(['Privat']);
      const mitUst = haben.includes('Umsatzsteuer');
      expect(mitUst).toBe(p.fall === 'gegenstand' || p.fall === 'leistung');
      expect([...soll, ...haben]).not.toContain('Vorsteuer');
      expect([...soll, ...haben]).not.toContain('Gewinn- und Verlustkonto');
    });
  });
});
