// Golden Cases C2 (GC-07 aus 04-fachregeln.md plus eigene Zahlen, Herleitung in docs/m7/c1.md).
import { describe, expect, it } from 'vitest';
import { buchungText, forSeeds } from '../../test-utils';
import { antwortAusParts, eingabeAusLoesung } from '../../testing';
import { bezugskosten, solveC2, type C2Params } from './c2-bezugskosten';

const basis: C2Params = {
  variante: 'einkauf',
  stoff: 'Rohstoffe',
  gegenstand: 'Aromen',
  partner: 'Testlieferant',
  ustSatz: '0.19',
  warenwert: '0',
  posten: [],
  gutschrift: '0',
  speditionBrutto: '0',
  zahlung: 'Kasse',
  rechnungNetto: '0',
  anteil: '0',
  zweiterStoff: 'Hilfsstoffe',
  zweiterGegenstand: 'Etiketten',
  zweiterWarenwert: '0',
  kgErster: 0,
  kgZweiter: 0,
  fracht: '0',
  versicherung: '0',
  vorlage: 0,
};

describe('Golden Cases C2 – Bezugskosten', () => {
  it('GC-07 Bezugskosten auf dem Unterkonto (04-fachregeln.md)', () => {
    const s = solveC2({ ...basis, warenwert: '20000', posten: [{ art: 'Fracht', betrag: '500' }] });
    expect(buchungText(s.buchung)).toEqual([
      'Rohstoffe 20.000,00 €, Bezugskosten für Rohstoffe 500,00 €, Vorsteuer 3.895,00 € an Verbindlichkeiten a. LL 24.395,00 €',
    ]);
  });

  it('GC-07 Abschluss: Umbuchung auf das Stoffkonto', () => {
    const s = solveC2({
      ...basis,
      variante: 'umbuchung',
      posten: [{ art: 'Fracht', betrag: '500' }],
    });
    expect(buchungText(s.buchung)).toEqual([
      'Rohstoffe 500,00 € an Bezugskosten für Rohstoffe 500,00 €',
    ]);
  });

  it('GC-C2-01 Speditionsrechnung brutto, bar bezahlt', () => {
    const s = solveC2({ ...basis, variante: 'spedition', speditionBrutto: '595' });
    expect(s.bezugskosten.value.toFixed(2)).toBe('500.00');
    expect(s.vorsteuer.value.toFixed(2)).toBe('95.00');
    expect(buchungText(s.buchung)).toEqual([
      'Bezugskosten für Rohstoffe 500,00 €, Vorsteuer 95,00 € an Kasse 595,00 €',
    ]);
  });

  it('GC-C2-02 Frachtanteil im Nettobetrag', () => {
    const s = solveC2({
      ...basis,
      variante: 'frachtanteil',
      rechnungNetto: '12000',
      anteil: '0.1',
    });
    expect(buchungText(s.buchung)).toEqual([
      'Rohstoffe 10.800,00 €, Bezugskosten für Rohstoffe 1.200,00 €, Vorsteuer 2.280,00 € an Verbindlichkeiten a. LL 14.280,00 €',
    ]);
  });

  it('GC-C2-03 Aufteilung nach Gewicht (Fracht) und Wert (Versicherung)', () => {
    const s = solveC2({
      ...basis,
      variante: 'aufteilung',
      warenwert: '9000',
      zweiterWarenwert: '6000',
      kgErster: 6000,
      kgZweiter: 2000,
      fracht: '800',
      versicherung: '240',
    });
    expect(s.frachtErster.value.toFixed(2)).toBe('600.00');
    expect(s.frachtZweiter.value.toFixed(2)).toBe('200.00');
    expect(s.versErster.value.toFixed(2)).toBe('144.00');
    expect(s.versZweiter.value.toFixed(2)).toBe('96.00');
    expect(buchungText(s.buchung)).toEqual([
      'Bezugskosten für Rohstoffe 744,00 €, Bezugskosten für Hilfsstoffe 296,00 €, Vorsteuer 197,60 € an Verbindlichkeiten a. LL 1.237,60 €',
    ]);
  });

  it('GC-C2-04 Umbuchung mit Gutschrift im Haben', () => {
    const s = solveC2({
      ...basis,
      variante: 'umbuchung',
      posten: [
        { art: 'Fracht', betrag: '400' },
        { art: 'Verpackung', betrag: '250' },
        { art: 'Transportversicherung', betrag: '150' },
      ],
      gutschrift: '100',
    });
    expect(buchungText(s.buchung)).toEqual([
      'Rohstoffe 700,00 € an Bezugskosten für Rohstoffe 700,00 €',
    ]);
  });

  it('GC-C2-05 Aufwandsorientiert: Bezugskosten auf dem Aufwandskonto', () => {
    const s = solveC2({
      ...basis,
      variante: 'aufwandsorientiert',
      stoff: 'Hilfsstoffe',
      warenwert: '5000',
      posten: [{ art: 'Verpackung', betrag: '200' }],
    });
    expect(buchungText(s.buchung)).toEqual([
      'Aufwendungen für Hilfsstoffe 5.200,00 €, Vorsteuer 988,00 € an Verbindlichkeiten a. LL 6.188,00 €',
    ]);
  });
});

describe('Eigenschaften C2', () => {
  it('Aufteilung: Summe der verteilten Spesen = Fracht + Versicherung (exakt auf den Cent)', () => {
    forSeeds(
      bezugskosten,
      500,
      (p, s) => {
        expect(s.bezugErster.plus(s.bezugZweiter).value.toFixed(2)).toBe(
          s.bezugskosten.value.toFixed(2),
        );
        expect(s.frachtErster.plus(s.frachtZweiter).value.toFixed(2)).toBe(
          Number(p.fracht).toFixed(2),
        );
      },
      { variant: 'aufteilung' },
    );
  });

  it('Rechnungsbetrag = Warenwert + Bezugskosten + Vorsteuer', () => {
    forSeeds(
      bezugskosten,
      500,
      (_p, s) => {
        expect(s.warenwert.plus(s.bezugskosten).plus(s.vorsteuer).value.toFixed(2)).toBe(
          s.rechnung.value.toFixed(2),
        );
      },
      { variant: 'einkauf' },
    );
  });

  it('Eingangsfracht als Ausgangsfracht gebucht wird erkannt', () => {
    const p: C2Params = { ...basis, variante: 'spedition', speditionBrutto: '595' };
    const s = solveC2(p);
    const antwort = antwortAusParts(bezugskosten.parts(p, s));
    const falsch = eingabeAusLoesung(s.buchung).map((x) => ({
      ...x,
      soll: x.soll.map((z) =>
        z.konto === 'Bezugskosten für Rohstoffe' ? { ...z, konto: 'Ausgangsfrachten' } : z,
      ),
    }));
    const r = bezugskosten.check(p, s, { ...antwort, buchung: { typ: 'buchung', saetze: falsch } });
    expect(r.korrekt).toBe(false);
    expect(r.fehlertypen).toContain('bezugskosten-als-ausgangsfracht');
  });
});
