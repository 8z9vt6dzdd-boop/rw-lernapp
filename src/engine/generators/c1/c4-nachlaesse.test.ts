// Golden Cases C4 (eigene Zahlen, Herleitung in docs/m7/c1.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { buchungText, forSeeds } from '../../test-utils';
import { sum } from '../../money';
import { antwortAusParts, eingabeAusLoesung } from '../../testing';
import { nachlaesseEinkauf, solveC4, type C4Params } from './c4-nachlaesse';

const basis: C4Params = {
  variante: 'netto-methode',
  erfassung: 'bestand',
  methode: 'netto',
  stoff: 'Hilfsstoffe',
  gegenstand: 'Etiketten',
  partner: 'Testlieferant',
  ustSatz: '0.19',
  warenwert: '0',
  satz: '0',
  anlass: 'maengel',
  jahresumsatz: '0',
  bonusGegeben: 'satz',
  bonusBrutto: '0',
  haben: [],
  soll: [],
  vorlage: 0,
};

describe('Golden Cases C4 – Nachlässe vom Lieferer', () => {
  it('GC-C4-01 Preisnachlass nach Mängelrüge, Nettomethode', () => {
    const s = solveC4({ ...basis, warenwert: '30000', satz: '0.1' });
    expect(s.rechnung.value.toFixed(2)).toBe('35700.00');
    expect(buchungText(s.buchung)).toEqual([
      'Verbindlichkeiten a. LL 3.570,00 € an Nachlässe für Hilfsstoffe 3.000,00 €, an Vorsteuer 570,00 €',
    ]);
  });

  it('GC-C4-02 Preisnachlass nach Mängelrüge, Bruttomethode', () => {
    const s = solveC4({
      ...basis,
      variante: 'brutto-methode',
      methode: 'brutto',
      warenwert: '30000',
      satz: '0.1',
    });
    expect(buchungText(s.buchung)).toEqual([
      'Verbindlichkeiten a. LL 3.570,00 € an Nachlässe für Hilfsstoffe 3.570,00 €',
      'Nachlässe für Hilfsstoffe 570,00 € an Vorsteuer 570,00 €',
    ]);
    expect(s.buchung.zusammenfassbar).toBe(false);
  });

  it('GC-C4-03 Bonus auf den Vorjahresumsatz', () => {
    const s = solveC4({
      ...basis,
      variante: 'bonus',
      stoff: 'Rohstoffe',
      jahresumsatz: '120000',
      satz: '0.02',
    });
    expect(buchungText(s.buchung)).toEqual([
      'Verbindlichkeiten a. LL 2.856,00 € an Nachlässe für Rohstoffe 2.400,00 €, an Vorsteuer 456,00 €',
    ]);
  });

  it('GC-C4-04 Bonusgutschrift brutto gegeben', () => {
    const s = solveC4({
      ...basis,
      variante: 'bonus',
      stoff: 'Rohstoffe',
      bonusGegeben: 'gutschrift',
      bonusBrutto: '1785',
    });
    expect(s.nachlassNetto.value.toFixed(2)).toBe('1500.00');
    expect(s.vorsteuer.value.toFixed(2)).toBe('285.00');
  });

  it('GC-C4-05 Umbuchung des Nachlasskontos (mit Bruttobuchung und Korrektur)', () => {
    const s = solveC4({
      ...basis,
      variante: 'umbuchung',
      stoff: 'Rohstoffe',
      haben: [
        { text: 'Skonto (netto)', betrag: '200' },
        { text: 'Preisnachlass Kulanz (brutto)', betrag: '1190' },
      ],
      soll: [{ text: 'Vorsteuerkorrektur', betrag: '190' }],
    });
    expect(buchungText(s.buchung)).toEqual([
      'Nachlässe für Rohstoffe 1.200,00 € an Rohstoffe 1.200,00 €',
    ]);
  });

  it('GC-C4-06 Nachlass bei aufwandsorientierter Erfassung', () => {
    const s = solveC4({
      ...basis,
      variante: 'aufwand',
      erfassung: 'aufwand',
      stoff: 'Rohstoffe',
      warenwert: '8000',
      satz: '0.05',
    });
    expect(buchungText(s.buchung)).toEqual([
      'Verbindlichkeiten a. LL 476,00 € an Aufwendungen für Rohstoffe 400,00 €, an Vorsteuer 76,00 €',
    ]);
  });
});

describe('Eigenschaften C4', () => {
  it('Gutschrift = Nachlass netto + Vorsteuerkorrektur; Netto- und Bruttomethode buchen gleich viel', () => {
    for (const variant of ['netto-methode', 'brutto-methode', 'bonus', 'aufwand']) {
      forSeeds(
        nachlaesseEinkauf,
        300,
        (p, s) => {
          expect(s.nachlassNetto.plus(s.vorsteuer).value.toFixed(2)).toBe(
            s.nachlassBrutto.value.toFixed(2),
          );
          const netto = solveC4({ ...p, methode: 'netto' });
          const brutto = solveC4({ ...p, methode: 'brutto' });
          // Nach der Steuerkorrektur steht auf dem Nachlasskonto bei beiden Methoden derselbe Betrag.
          const saldo = (l: typeof netto.buchung, konto: string) =>
            sum(
              l.saetze.flatMap((x) => [
                ...x.haben.filter((z) => z.konto === konto).map((z) => z.betrag),
                ...x.soll.filter((z) => z.konto === konto).map((z) => z.betrag.neg()),
              ]),
            ).value.toFixed(2);
          const k = netto.buchung.saetze[0]!.haben[0]!.konto;
          expect(saldo(brutto.buchung, k)).toBe(saldo(netto.buchung, k));
        },
        { variant },
      );
    }
  });

  it('Preisnachlass direkt auf dem Stoffkonto wird erkannt', () => {
    const p: C4Params = { ...basis, warenwert: '30000', satz: '0.1' };
    const s = solveC4(p);
    const falsch = eingabeAusLoesung(s.buchung).map((x) => ({
      ...x,
      haben: x.haben.map((z) =>
        z.konto === 'Nachlässe für Hilfsstoffe' ? { ...z, konto: 'Hilfsstoffe' } : z,
      ),
    }));
    const r = nachlaesseEinkauf.check(p, s, {
      ...antwortAusParts(nachlaesseEinkauf.parts(p, s)),
      buchung: { typ: 'buchung', saetze: falsch },
    });
    expect(r.korrekt).toBe(false);
    expect(r.fehlertypen).toContain('nachlass-direkt-auf-stoffkonto');
  });

  it('ohne Methodenangabe gelten Netto- und Bruttomethode', () => {
    const p: C4Params = { ...basis, methode: 'offen', warenwert: '30000', satz: '0.1' };
    const s = solveC4(p);
    const brutto = solveC4({ ...p, methode: 'brutto' });
    const r = nachlaesseEinkauf.check(p, s, {
      ...antwortAusParts(nachlaesseEinkauf.parts(p, s)),
      buchung: { typ: 'buchung', saetze: eingabeAusLoesung(brutto.buchung) },
    });
    expect(r.korrekt).toBe(true);
  });
});
