// D2 – Golden Cases (eigene Zahlen, docs/m7/d.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { antwortAusParts, eingabeAusLoesung } from '../../testing';
import { alleAusgeglichen, buchungText, forSeeds } from '../../test-utils';
import {
  ruecksendungVerkauf,
  solveRuecksendung,
  type RuecksendungParams,
} from './ruecksendung-verkauf';

const basis: RuecksendungParams = {
  art: 'erzeugnisse',
  produkt: '„Paderquell Energy“',
  kunde: 'Testkunde',
  gegeben: 'liste',
  betrag: '6000',
  rabattSatz: '0.2',
  anteil: '1',
  grund: 0,
  ustSatz: '0.19',
  ausgleich: 'forderung',
  vorlage: 0,
};

describe('Golden Cases D2', () => {
  it('GC-D2-01 Rücksendung zum Listenpreis mit 20 % Rabatt', () => {
    expect(buchungText(solveRuecksendung(basis).buchung)).toEqual([
      'Umsatzerlöse 4.800,00 €, Umsatzsteuer 912,00 € an Forderungen a. LL 5.712,00 €',
    ]);
  });

  it('GC-D2-02 Gutschrift brutto, Kunde hatte schon bezahlt', () => {
    const s = solveRuecksendung({ ...basis, gegeben: 'brutto', betrag: '2975', ausgleich: 'bank' });
    expect(buchungText(s.buchung)).toEqual([
      'Umsatzerlöse 2.500,00 €, Umsatzsteuer 475,00 € an Bank 2.975,00 €',
    ]);
  });

  it('GC-D2-03 Rückgabe berechneter Mehrwegpaletten, 75 % Gutschrift', () => {
    const s = solveRuecksendung({ ...basis, gegeben: 'verpackung', betrag: '600', anteil: '0.75' });
    expect(buchungText(s.buchung)).toEqual([
      'Umsatzerlöse 450,00 €, Umsatzsteuer 85,50 € an Forderungen a. LL 535,50 €',
    ]);
  });

  it('GC-D2-04 Handelswaren, Nettowert', () => {
    const s = solveRuecksendung({
      ...basis,
      art: 'handelswaren',
      gegeben: 'netto',
      betrag: '1250',
    });
    expect(buchungText(s.buchung)).toEqual([
      'Umsatzerlöse für Handelswaren 1.250,00 €, Umsatzsteuer 237,50 € an Forderungen a. LL 1.487,50 €',
    ]);
  });
});

describe('D2 Bewertung', () => {
  const s = solveRuecksendung(basis);
  const parts = ruecksendungVerkauf.parts(basis, s);

  it('Rücksendung über Erlösberichtigungen wird als Denkfehler erkannt', () => {
    const a = antwortAusParts(parts);
    const e = eingabeAusLoesung(s.buchung);
    e[0]!.soll[0]!.konto = 'Erlösschmälerungen';
    a['buchung'] = { typ: 'buchung', saetze: e };
    const r = ruecksendungVerkauf.check(basis, s, a);
    expect(r.korrekt).toBe(false);
    expect(r.fehlertypen).toContain('ruecksendung-als-erloesberichtigung');
  });

  it('Rabatt vergessen wird erkannt', () => {
    const a = antwortAusParts(parts);
    a['rechnung'] = {
      typ: 'felder',
      werte: { netto: '6.000,00', ust: '1.140,00', brutto: '7.140,00' },
    };
    expect(ruecksendungVerkauf.check(basis, s, a).fehlertypen).toContain('rabatt-vergessen');
  });
});

describe('D2 Eigenschaften', () => {
  it('Storno: Erlöskonto und Umsatzsteuer im Soll, Netto + Steuer = Brutto', () => {
    forSeeds(ruecksendungVerkauf, 500, (_p, s) => {
      expect(alleAusgeglichen(s.buchung)).toBe(true);
      expect(s.netto.plus(s.ust).value.equals(s.brutto.value)).toBe(true);
      const soll = s.buchung.saetze[0]!.soll.map((z) => z.konto);
      expect(soll).toContain('Umsatzsteuer');
      expect(soll).not.toContain('Erlösberichtigungen');
    });
  });
});
