// D1 – Golden Cases (eigene Zahlen, docs/m7/d.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { dec, round } from '../../money';
import { antwortAusParts, eingabeAusLoesung } from '../../testing';
import { alleAusgeglichen, buchungText, forSeeds } from '../../test-utils';
import { solveVerkauf, verkauf, type VerkaufParams } from './verkauf';

const basis: VerkaufParams = {
  art: 'erzeugnisse',
  produkt: '„Senne Lemon“',
  kunde: 'Testkunde',
  listenpreis: '30000',
  rabattSatz: '0.15',
  verpackung: { betrag: '238', brutto: true },
  fracht: { betrag: '400', brutto: false },
  ustSatz: '0.19',
  zahlung: 'ziel',
  vorlage: 0,
};

describe('Golden Cases D1', () => {
  it('GC-D1-01 Rabatt, Verpackung brutto, Fracht netto', () => {
    const s = solveVerkauf(basis);
    expect(s.rabatt.value.toFixed(2)).toBe('4500.00');
    expect(s.warenwert.value.toFixed(2)).toBe('25500.00');
    expect(s.nebenkosten.value.toFixed(2)).toBe('600.00');
    expect(s.netto.value.toFixed(2)).toBe('26100.00');
    expect(s.ust.value.toFixed(2)).toBe('4959.00');
    expect(buchungText(s.buchung)).toEqual([
      'Forderungen a. LL 31.059,00 € an Umsatzerlöse 26.100,00 €, an Umsatzsteuer 4.959,00 €',
    ]);
  });

  it('GC-D1-02 Handelswaren gegen Bank, ohne Rabatt und Nebenkosten', () => {
    const p: VerkaufParams = {
      ...basis,
      art: 'handelswaren',
      listenpreis: '8000',
      rabattSatz: '0',
      zahlung: 'bank',
    };
    delete p.verpackung;
    delete p.fracht;
    expect(buchungText(solveVerkauf(p).buchung)).toEqual([
      'Bank 9.520,00 € an Umsatzerlöse für Handelswaren 8.000,00 €, an Umsatzsteuer 1.520,00 €',
    ]);
  });
});

describe('D1 Bewertung', () => {
  const s = solveVerkauf(basis);
  const parts = verkauf.parts(basis, s);

  it('erkennt Rabatt auf Nebenkosten (Rabatt 4.590 statt 4.500)', () => {
    const a = antwortAusParts(parts);
    a['rechnung'] = {
      typ: 'felder',
      werte: { ...(a['rechnung'] as { werte: Record<string, string> }).werte, rabatt: '4.590,00' },
    };
    expect(verkauf.check(basis, s, a).fehlertypen).toContain('rabatt-auf-nebenkosten');
  });

  it('erkennt Vorsteuer statt Umsatzsteuer', () => {
    const a = antwortAusParts(parts);
    const e = eingabeAusLoesung(s.buchung);
    e[0]!.haben[1]!.konto = 'Vorsteuer';
    a['buchung'] = { typ: 'buchung', saetze: e };
    expect(verkauf.check(basis, s, a).fehlertypen).toContain('steuer-falsches-konto');
  });
});

describe('D1 Eigenschaften', () => {
  it('Netto + Steuer = Brutto, Soll = Haben, Rabatt nur auf den Warenwert', () => {
    forSeeds(verkauf, 500, (p, s) => {
      expect(s.netto.plus(s.ust).value.equals(s.brutto.value)).toBe(true);
      expect(alleAusgeglichen(s.buchung)).toBe(true);
      expect(s.warenwert.plus(s.nebenkosten).value.equals(s.netto.value)).toBe(true);
      // Rabatt bezieht sich nur auf den Listenpreis, nicht auf Verpackung und Fracht
      expect(s.rabatt.value.equals(round(dec(p.listenpreis).times(p.rabattSatz)))).toBe(true);
    });
  });
});
