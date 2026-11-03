// D3 – Golden Cases (eigene Zahlen, docs/m7/d.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { antwortAusParts, eingabeAusLoesung } from '../../testing';
import { alleAusgeglichen, buchungText, forSeeds } from '../../test-utils';
import {
  erloesberichtigung,
  solveErloesberichtigung,
  type ErloesberichtigungParams,
} from './erloesberichtigung';

const basis: ErloesberichtigungParams = {
  fall: 'nachlass',
  anlass: 'maengelruege',
  gegeben: 'prozent-netto',
  betrag: '8000',
  satz: '0.1',
  methode: 'netto',
  ausgleich: 'forderung',
  umsatzerloese: '0',
  erloesberichtigungen: '0',
  ustSatz: '0.19',
  kunde: 'Testkunde',
  produkt: '„Senne Lemon“',
};

describe('Golden Cases D3', () => {
  it('GC-D3-01 Mängelrüge 10 % auf 8.000 € netto, Nettomethode', () => {
    expect(buchungText(solveErloesberichtigung(basis).buchung)).toEqual([
      'Erlösberichtigungen 800,00 €, Umsatzsteuer 152,00 € an Forderungen a. LL 952,00 €',
    ]);
  });

  it('GC-D3-02 dieselbe Mängelrüge, Bruttomethode', () => {
    expect(buchungText(solveErloesberichtigung({ ...basis, methode: 'brutto' }).buchung)).toEqual([
      'Erlösberichtigungen 952,00 € an Forderungen a. LL 952,00 €',
      'Umsatzsteuer 152,00 € an Erlösberichtigungen 152,00 €',
    ]);
  });

  it('GC-D3-03 Bonus 3 % auf 150.000 € Jahresumsatz, Überweisung', () => {
    const s = solveErloesberichtigung({
      ...basis,
      anlass: 'bonus',
      betrag: '150000',
      satz: '0.03',
      ausgleich: 'bank',
    });
    expect(buchungText(s.buchung)).toEqual([
      'Erlösberichtigungen 4.500,00 €, Umsatzsteuer 855,00 € an Bank 5.355,00 €',
    ]);
  });

  it('GC-D3-04 Gutschrift 1.785 € brutto', () => {
    const s = solveErloesberichtigung({ ...basis, gegeben: 'gutschrift-brutto', betrag: '1785' });
    expect(s.netto.value.toFixed(2)).toBe('1500.00');
    expect(s.ust.value.toFixed(2)).toBe('285.00');
  });

  it('GC-D3-05 Abschluss über Umsatzerlöse', () => {
    const s = solveErloesberichtigung({
      ...basis,
      fall: 'abschluss',
      umsatzerloese: '900000',
      erloesberichtigungen: '18500',
    });
    expect(s.nettoumsatz.value.toFixed(2)).toBe('881500.00');
    expect(buchungText(s.buchung)).toEqual([
      'Umsatzerlöse 18.500,00 € an Erlösberichtigungen 18.500,00 €',
      'Umsatzerlöse 881.500,00 € an GuV 881.500,00 €',
    ]);
  });
});

describe('D3 Bewertung', () => {
  it('Methode offen: Brutto- und Nettomethode werden beide akzeptiert', () => {
    const p = { ...basis, methode: 'offen' as const };
    const s = solveErloesberichtigung(p);
    const a = antwortAusParts(erloesberichtigung.parts(p, s));
    a['buchung'] = { typ: 'buchung', saetze: eingabeAusLoesung(s.alternativen[0]!) };
    expect(erloesberichtigung.check(p, s, a).korrekt).toBe(true);
  });

  it('Bruttomethode: Gutschrift und Steuerkorrektur dürfen nicht zusammengefasst werden', () => {
    const s = solveErloesberichtigung({ ...basis, methode: 'brutto' });
    expect(s.buchung.zusammenfassbar).toBe(false);
  });

  it('Nachlass direkt auf Umsatzerlöse wird erkannt', () => {
    const s = solveErloesberichtigung(basis);
    const a = antwortAusParts(erloesberichtigung.parts(basis, s));
    const e = eingabeAusLoesung(s.buchung);
    e[0]!.soll[0]!.konto = 'Umsatzerlöse';
    a['buchung'] = { typ: 'buchung', saetze: e };
    expect(erloesberichtigung.check(basis, s, a).fehlertypen).toContain(
      'nachlass-als-umsatzstorno',
    );
  });
});

describe('D3 Eigenschaften', () => {
  it('Netto + Steuer = Brutto; Erlösberichtigungen im Soll der Gutschrift', () => {
    forSeeds(erloesberichtigung, 500, (p, s) => {
      expect(alleAusgeglichen(s.buchung)).toBe(true);
      if (p.fall === 'abschluss') {
        expect(s.nettoumsatz.plus(p.erloesberichtigungen).value.toFixed(2)).toBe(
          Number(p.umsatzerloese).toFixed(2),
        );
        return;
      }
      expect(s.netto.plus(s.ust).value.equals(s.brutto.value)).toBe(true);
      expect(s.buchung.saetze[0]!.soll[0]!.konto).toBe('Erlösberichtigungen');
    });
  });
});
