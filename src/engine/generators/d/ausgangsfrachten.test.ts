// D5 – Golden Cases (eigene Zahlen, docs/m7/d.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { antwortAusParts } from '../../testing';
import { alleAusgeglichen, buchungText, forSeeds } from '../../test-utils';
import {
  ausgangsfrachten,
  solveAusgangsfracht,
  type AusgangsfrachtParams,
} from './ausgangsfrachten';

const basis: AusgangsfrachtParams = {
  fall: 'ausgang',
  gegeben: 'brutto',
  betrag: '1190',
  zahlung: 'kasse',
  stoff: 'Rohstoffe',
  gegenstand: 'Aromen',
  kunde: 'Testkunde',
  produkt: '„Senne Lemon“',
  warenwert: '0',
  frachtBerechnet: '0',
  erkennen: true,
  ustSatz: '0.19',
};

describe('Golden Cases D5', () => {
  it('GC-D5-01 Ausgangsfracht 1.190 € brutto bar', () => {
    expect(buchungText(solveAusgangsfracht(basis).buchung)).toEqual([
      'Ausgangsfrachten 1.000,00 €, Vorsteuer 190,00 € an Kasse 1.190,00 €',
    ]);
  });

  it('GC-D5-02 Eingangsfracht für Rohstoffe 500 € netto auf Ziel', () => {
    const s = solveAusgangsfracht({
      ...basis,
      fall: 'eingang',
      gegeben: 'netto',
      betrag: '500',
      zahlung: 'ziel',
    });
    expect(buchungText(s.buchung)).toEqual([
      'Bezugskosten für Rohstoffe 500,00 €, Vorsteuer 95,00 € an Verbindlichkeiten a. LL 595,00 €',
    ]);
  });

  it('GC-D5-03 Fracht teils dem Kunden berechnet, Spedition auf Ziel', () => {
    const s = solveAusgangsfracht({
      ...basis,
      fall: 'weiterberechnet',
      gegeben: 'netto',
      betrag: '300',
      zahlung: 'ziel',
      warenwert: '10000',
      frachtBerechnet: '250',
    });
    expect(buchungText(s.buchung)).toEqual([
      'Forderungen a. LL 12.197,50 € an Umsatzerlöse 10.250,00 €, an Umsatzsteuer 1.947,50 €',
      'Ausgangsfrachten 300,00 €, Vorsteuer 57,00 € an Verbindlichkeiten a. LL 357,00 €',
    ]);
  });
});

describe('D5 Bewertung', () => {
  it('Konto „Bezugskosten“ bei Ausgangsfracht wird als Denkfehler erkannt', () => {
    const s = solveAusgangsfracht(basis);
    const parts = ausgangsfrachten.parts(basis, s);
    const a = antwortAusParts(parts);
    const konto = parts.find((x) => x.id === 'konto');
    if (konto?.typ !== 'aufgabe-erkennen') throw new Error('Konto-Teil fehlt');
    a['konto'] = {
      typ: 'wahl',
      optionId: konto.optionen.find((o) => o.text === 'Bezugskosten für Rohstoffe')!.id,
    };
    expect(ausgangsfrachten.check(basis, s, a).fehlertypen).toContain(
      'ausgangsfracht-als-bezugskosten',
    );
  });
});

describe('D5 Eigenschaften', () => {
  it('Fracht: Netto + Vorsteuer = Brutto; Ausgangsfracht nie auf Bezugskosten', () => {
    forSeeds(ausgangsfrachten, 500, (p, s) => {
      expect(alleAusgeglichen(s.buchung)).toBe(true);
      expect(s.netto.plus(s.vorsteuer).value.equals(s.brutto.value)).toBe(true);
      const konten = s.buchung.saetze.flatMap((x) => x.soll.map((z) => z.konto));
      if (p.fall === 'eingang') expect(konten).not.toContain('Ausgangsfrachten');
      else expect(konten).toContain('Ausgangsfrachten');
      expect(konten).toContain('Vorsteuer');
    });
  });
});
