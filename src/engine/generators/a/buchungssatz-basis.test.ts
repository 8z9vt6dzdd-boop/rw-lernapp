// A5 – Golden Cases (eigene Zahlen, docs/m7/a.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { getKonto } from '../../accounts';
import { alleAusgeglichen, buchungText, forSeeds } from '../../test-utils';
import { antwortAusParts } from '../../testing';
import { buchungssatzBasis, solveBuchungssatzBasis, type A5Params } from './buchungssatz-basis';

const einzeln = (id: string, betrag: string, teil = '0'): A5Params => ({
  variante:
    id.includes('-teil') || ['lkw-anzahlung', 'lohn-gehalt', 'rate'].includes(id)
      ? 'zusammengesetzt'
      : 'einfach',
  vorfaelle: [{ id, betrag, teil }],
});

describe('Golden Cases A5', () => {
  it('GC-A5-01 Barabhebung 800 €', () => {
    expect(buchungText(solveBuchungssatzBasis(einzeln('abhebung', '800')).buchung)).toEqual([
      'Kasse 800,00 € an Bank 800,00 €',
    ]);
  });

  it('GC-A5-02 Lieferantenrechnung 3.200 €, davon 500 € bar', () => {
    expect(
      buchungText(solveBuchungssatzBasis(einzeln('lieferant-teil', '3200', '500')).buchung),
    ).toEqual(['Verbindlichkeiten a. LL 3.200,00 € an Kasse 500,00 €, an Bank 2.700,00 €']);
  });

  it('GC-A5-03 Darlehensrate 6.250 € mit 5.000 € Tilgung', () => {
    expect(buchungText(solveBuchungssatzBasis(einzeln('rate', '6250', '5000')).buchung)).toEqual([
      'Darlehensschulden 5.000,00 €, Zinsaufwendungen 1.250,00 € an Bank 6.250,00 €',
    ]);
  });

  it('GC-A5-04 Lkw 60.000 €, 15.000 € sofort, Rest auf Ziel', () => {
    expect(
      buchungText(solveBuchungssatzBasis(einzeln('lkw-anzahlung', '60000', '15000')).buchung),
    ).toEqual(['Fuhrpark 60.000,00 € an Bank 15.000,00 €, an Verbindlichkeiten a. LL 45.000,00 €']);
  });

  it('GC-A5-05 Löhne 18.000 € und Gehälter 12.000 € in einer Überweisung', () => {
    expect(
      buchungText(solveBuchungssatzBasis(einzeln('lohn-gehalt', '30000', '18000')).buchung),
    ).toEqual(['Löhne 18.000,00 €, Gehälter 12.000,00 € an Bank 30.000,00 €']);
  });

  it('GC-A5-06 Zinsgutschrift 240 € und Verkauf auf Ziel 5.000 € (ohne USt)', () => {
    expect(buchungText(solveBuchungssatzBasis(einzeln('zinsen-gut', '240')).buchung)).toEqual([
      'Bank 240,00 € an Zinserträge 240,00 €',
    ]);
    expect(buchungText(solveBuchungssatzBasis(einzeln('verkauf-ziel', '5000')).buchung)).toEqual([
      'Forderungen a. LL 5.000,00 € an Umsatzerlöse 5.000,00 €',
    ]);
  });
});

describe('A5 Bewertung', () => {
  it('Tilgung als Zinsaufwand wird erkannt', () => {
    const p = einzeln('tilgung', '4000');
    const s = solveBuchungssatzBasis(p);
    const a = antwortAusParts(buchungssatzBasis.parts(p, s));
    a['buchung'] = {
      typ: 'buchung',
      saetze: [
        {
          soll: [{ konto: 'Zinsaufwendungen', betrag: '4.000' }],
          haben: [{ konto: 'Bank', betrag: '4.000' }],
        },
      ],
    };
    expect(buchungssatzBasis.check(p, s, a).fehlertypen).toContain('a-tilgung-als-aufwand');
  });
});

describe('A5 Eigenschaften', () => {
  it('Soll = Haben, keine Umsatzsteuer, keine Abschlusskonten', () => {
    forSeeds(buchungssatzBasis, 1000, (_p, s) => {
      expect(alleAusgeglichen(s.buchung)).toBe(true);
      for (const x of s.buchung.saetze)
        for (const z of [...x.soll, ...x.haben]) {
          expect(['Vorsteuer', 'Umsatzsteuer']).not.toContain(z.konto);
          expect(getKonto(z.konto).typ).not.toBe('abschluss');
          expect(z.betrag.exact.gt(0)).toBe(true);
        }
    });
  });
});
