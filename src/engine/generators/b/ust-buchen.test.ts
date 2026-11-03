// B2 – Golden Cases (eigene Zahlen, docs/m7/b.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { dec } from '../../money';
import { antwortAusParts, eingabeAusLoesung } from '../../testing';
import { alleAusgeglichen, buchungText, forSeeds } from '../../test-utils';
import type { TaskAnswer } from '../../task';
import { solveB2, ustBuchen, type B2Params } from './ust-buchen';

const basis: B2Params = {
  fall: 'einkauf',
  zahlung: 'ziel',
  partner: 'Testpartner',
  positionen: [{ konto: 'Hilfsstoffe', text: 'Getränkedosen', betrag: '8000' }],
  brutto: false,
  ustSatz: '0.19',
  betrag: '0',
  monat: 'Januar',
  vorlage: 0,
};

/** Antwort aus der Musterlösung, Buchung über `aendern` verfälscht. */
function antwortMit(
  p: B2Params,
  aendern: (e: ReturnType<typeof eingabeAusLoesung>) => void,
): TaskAnswer {
  const s = solveB2(p);
  const a = antwortAusParts(ustBuchen.parts(p, s));
  const e = eingabeAusLoesung(s.buchung);
  aendern(e);
  a['buchung'] = { typ: 'buchung', saetze: e };
  return a;
}

describe('Golden Cases B2', () => {
  it('GC-B2-01 Einkauf Hilfsstoffe 8.000,00 netto auf Ziel', () => {
    expect(buchungText(solveB2(basis).buchung)).toEqual([
      'Hilfsstoffe 8.000,00 €, Vorsteuer 1.520,00 € an Verbindlichkeiten a. LL 9.520,00 €',
    ]);
  });

  it('GC-B2-02 Barkauf Büromaterial 297,50 brutto', () => {
    const p: B2Params = {
      ...basis,
      zahlung: 'bar',
      brutto: true,
      positionen: [{ konto: 'Büromaterial', text: 'Toner', betrag: '297.50' }],
    };
    const s = solveB2(p);
    expect([s.netto.value.toFixed(2), s.steuer.value.toFixed(2)]).toEqual(['250.00', '47.50']);
    expect(buchungText(s.buchung)).toEqual([
      'Büromaterial 250,00 €, Vorsteuer 47,50 € an Kasse 297,50 €',
    ]);
  });

  it('GC-B2-03 Verkauf Handelswaren 4.760,00 brutto per Bank', () => {
    const p: B2Params = {
      ...basis,
      fall: 'verkauf',
      zahlung: 'bank',
      brutto: true,
      positionen: [{ konto: 'Umsatzerlöse für Handelswaren', text: 'Wein', betrag: '4760' }],
    };
    expect(buchungText(solveB2(p).buchung)).toEqual([
      'Bank 4.760,00 € an Umsatzerlöse für Handelswaren 4.000,00 €, an Umsatzsteuer 760,00 €',
    ]);
  });

  it('GC-B2-04 Eingangsrechnung mit drei Positionen auf drei Konten', () => {
    const p: B2Params = {
      ...basis,
      positionen: [
        { konto: 'Hilfsstoffe', text: 'Etiketten', betrag: '3000' },
        { konto: 'Werbung', text: 'Werbeplakate', betrag: '1200' },
        { konto: 'Büromaterial', text: 'Briefpapier', betrag: '300' },
      ],
    };
    expect(buchungText(solveB2(p).buchung)).toEqual([
      'Hilfsstoffe 3.000,00 €, Werbung 1.200,00 €, Büromaterial 300,00 €, Vorsteuer 855,00 € an Verbindlichkeiten a. LL 5.355,00 €',
    ]);
  });

  it('GC-B2-05 Ausgangsrechnung: zwei Erzeugnisse und eine Handelsware auf Ziel', () => {
    const p: B2Params = {
      ...basis,
      fall: 'verkauf',
      positionen: [
        { konto: 'Umsatzerlöse für eigene Erzeugnisse', text: 'Energy', betrag: '10000' },
        { konto: 'Umsatzerlöse für eigene Erzeugnisse', text: 'Lemon', betrag: '5000' },
        { konto: 'Umsatzerlöse für Handelswaren', text: 'Wein', betrag: '2000' },
      ],
    };
    expect(buchungText(solveB2(p).buchung)).toEqual([
      'Forderungen a. LL 20.230,00 € an Umsatzerlöse 15.000,00 €, an Umsatzerlöse für Handelswaren 2.000,00 €, an Umsatzsteuer 3.230,00 €',
    ]);
  });

  it('GC-B2-06 Überweisung der Zahllast 7.460,00', () => {
    const p: B2Params = { ...basis, fall: 'zahllast', positionen: [], betrag: '7460' };
    expect(buchungText(solveB2(p).buchung)).toEqual(['Umsatzsteuer 7.460,00 € an Bank 7.460,00 €']);
  });

  it('GC-B2-07 Erstattung eines Vorsteuerüberhangs 13.300,00', () => {
    const p: B2Params = { ...basis, fall: 'erstattung', positionen: [], betrag: '13300' };
    expect(buchungText(solveB2(p).buchung)).toEqual(['Bank 13.300,00 € an Vorsteuer 13.300,00 €']);
  });

  it('GC-B2-08 krummer Barverkauf 99,99 brutto', () => {
    const p: B2Params = {
      ...basis,
      fall: 'verkauf',
      zahlung: 'bar',
      brutto: true,
      positionen: [
        { konto: 'Umsatzerlöse für eigene Erzeugnisse', text: 'Lemon', betrag: '99.99' },
      ],
    };
    expect(buchungText(solveB2(p).buchung)).toEqual([
      'Kasse 99,99 € an Umsatzerlöse 84,03 €, an Umsatzsteuer 15,96 €',
    ]);
  });
});

describe('B2 Bewertung', () => {
  it('erkennt Umsatzsteuer statt Vorsteuer beim Einkauf', () => {
    const a = antwortMit(basis, (e) => {
      e[0]!.soll[1]!.konto = 'Umsatzsteuer';
    });
    expect(ustBuchen.check(basis, solveB2(basis), a).fehlertypen).toContain(
      'steuer-falsches-konto',
    );
  });

  it('erkennt Bank statt Verbindlichkeiten bei Kauf auf Ziel', () => {
    const a = antwortMit(basis, (e) => {
      e[0]!.haben[0]!.konto = 'Bank';
    });
    expect(ustBuchen.check(basis, solveB2(basis), a).fehlertypen).toContain(
      'b-zahlungskonto-falsch',
    );
  });

  it('erkennt Zahllast als Aufwand', () => {
    const p: B2Params = { ...basis, fall: 'zahllast', positionen: [], betrag: '7460' };
    const a = antwortMit(p, (e) => {
      e[0]!.soll[0]!.konto = 'Betriebssteuern';
    });
    expect(ustBuchen.check(p, solveB2(p), a).fehlertypen).toContain('b-zahllast-als-aufwand');
  });

  it('erkennt „minus 19 %“ beim Bruttobetrag', () => {
    const p: B2Params = {
      ...basis,
      zahlung: 'bar',
      brutto: true,
      positionen: [{ konto: 'Büromaterial', text: 'Toner', betrag: '297.50' }],
    };
    const a = antwortMit(p, (e) => {
      e[0]!.soll[0]!.betrag = '240,97';
      e[0]!.soll[1]!.betrag = '56,53';
    });
    expect(ustBuchen.check(p, solveB2(p), a).fehlertypen).toContain('b-prozent-vom-brutto');
  });
});

describe('B2 Eigenschaften', () => {
  it('Soll = Haben, Netto + Steuer = Brutto, Sachkonten netto', () => {
    forSeeds(ustBuchen, 1000, (p, s) => {
      expect(alleAusgeglichen(s.buchung)).toBe(true);
      expect(s.netto.plus(s.steuer).value.equals(s.brutto.value)).toBe(true);
      if (p.fall === 'einkauf' || p.fall === 'verkauf') {
        const summe = s.jeKonto.reduce((a, x) => a.plus(x.betrag.value), dec(0));
        expect(summe.equals(s.netto.value)).toBe(true);
      }
    });
  });

  it('Steuerkonto und Seite: Einkauf Vorsteuer im Soll, Verkauf Umsatzsteuer im Haben', () => {
    forSeeds(ustBuchen, 1000, (p, s) => {
      const x = s.buchung.saetze[0]!;
      const soll = x.soll.map((z) => z.konto);
      const haben = x.haben.map((z) => z.konto);
      switch (p.fall) {
        case 'einkauf':
          expect(soll).toContain('Vorsteuer');
          expect([...soll, ...haben]).not.toContain('Umsatzsteuer');
          expect(haben).toEqual([
            p.zahlung === 'bar'
              ? 'Kasse'
              : p.zahlung === 'bank'
                ? 'Bank'
                : 'Verbindlichkeiten aus Lieferungen und Leistungen',
          ]);
          break;
        case 'verkauf':
          expect(haben).toContain('Umsatzsteuer');
          expect([...soll, ...haben]).not.toContain('Vorsteuer');
          expect(soll).toEqual([
            p.zahlung === 'bar'
              ? 'Kasse'
              : p.zahlung === 'bank'
                ? 'Bank'
                : 'Forderungen aus Lieferungen und Leistungen',
          ]);
          break;
        case 'zahllast':
          expect([soll, haben]).toEqual([['Umsatzsteuer'], ['Bank']]);
          break;
        case 'erstattung':
          expect([soll, haben]).toEqual([['Bank'], ['Vorsteuer']]);
          break;
      }
    });
  });

  it('Kassenbons nennen den Bruttobetrag; netto gegebene Steuer geht auf den Cent', () => {
    forSeeds(ustBuchen, 1000, (p, s) => {
      if (p.zahlung === 'bar' && (p.fall === 'einkauf' || p.fall === 'verkauf'))
        expect(p.brutto).toBe(true);
      if (!p.brutto && (p.fall === 'einkauf' || p.fall === 'verkauf'))
        expect(s.steuer.value.equals(s.netto.value.times(p.ustSatz).toDecimalPlaces(2))).toBe(true);
    });
  });

  it('alle Fälle und Zahlungsarten kommen vor', () => {
    const faelle = new Set<string>();
    const zahlungen = new Set<string>();
    forSeeds(ustBuchen, 500, (p) => {
      faelle.add(p.fall);
      if (p.fall === 'einkauf' || p.fall === 'verkauf') zahlungen.add(p.zahlung);
    });
    expect(faelle.size).toBe(4);
    expect(zahlungen.size).toBe(3);
  });
});
