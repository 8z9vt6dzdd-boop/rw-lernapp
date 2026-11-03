// Golden Cases C1 (eigene Zahlen, Herleitung in docs/m7/c1.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { buchungText, forSeeds, selbstpruefung } from '../../test-utils';
import { Val } from '../../money';
import { antwortAusParts, eingabeAusLoesung } from '../../testing';
import { bestandVsAufwand, solveC1, type C1Params } from './c1-bestand-vs-aufwand';

const basis: C1Params = {
  variante: 'einkauf',
  erfassung: 'bestand',
  stoff: 'Rohstoffe',
  gegenstand: 'Zucker',
  partner: 'Testlieferant',
  ustSatz: '0.19',
  netto: '0',
  ab: '0',
  zugaenge: [],
  entnahmen: [],
  sb: '0',
  vorlage: 0,
};

describe('Golden Cases C1 – Bestand vs. Aufwand', () => {
  it('GC-C1-01 Einkauf bestandsorientiert', () => {
    const s = solveC1({ ...basis, netto: '8000' });
    expect(s.vorsteuer.value.toFixed(2)).toBe('1520.00');
    expect(buchungText(s.buchung)).toEqual([
      'Rohstoffe 8.000,00 €, Vorsteuer 1.520,00 € an Verbindlichkeiten a. LL 9.520,00 €',
    ]);
  });

  it('GC-C1-02 Einkauf aufwandsorientiert', () => {
    const s = solveC1({ ...basis, erfassung: 'aufwand', netto: '8000' });
    expect(buchungText(s.buchung)).toEqual([
      'Aufwendungen für Rohstoffe 8.000,00 €, Vorsteuer 1.520,00 € an Verbindlichkeiten a. LL 9.520,00 €',
    ]);
  });

  it('GC-C1-03 Inventurmethode, bestandsorientiert', () => {
    const s = solveC1({
      ...basis,
      variante: 'inventur-bestand',
      ab: '6000',
      zugaenge: ['9000', '5000'],
      sb: '4500',
    });
    expect(s.verbrauch.value.toFixed(2)).toBe('15500.00');
    expect(buchungText(s.buchung)).toEqual([
      'SBK 4.500,00 € an Rohstoffe 4.500,00 €',
      'Aufwendungen für Rohstoffe 15.500,00 € an Rohstoffe 15.500,00 €',
    ]);
  });

  it('GC-C1-04 Aufwandsorientiert mit Minderbestand (gleicher Aufwand wie GC-C1-03)', () => {
    const s = solveC1({
      ...basis,
      variante: 'inventur-aufwand',
      erfassung: 'aufwand',
      ab: '6000',
      zugaenge: ['9000', '5000'],
      sb: '4500',
    });
    expect(s.delta.value.toFixed(2)).toBe('-1500.00');
    expect(s.verbrauch.value.toFixed(2)).toBe('15500.00');
    expect(buchungText(s.buchung)).toEqual([
      'SBK 4.500,00 € an Rohstoffe 4.500,00 €',
      'Aufwendungen für Rohstoffe 1.500,00 € an Rohstoffe 1.500,00 €',
    ]);
  });

  it('GC-C1-05 Aufwandsorientiert mit Mehrbestand', () => {
    const s = solveC1({
      ...basis,
      variante: 'inventur-aufwand',
      erfassung: 'aufwand',
      stoff: 'Hilfsstoffe',
      ab: '3000',
      zugaenge: ['7000', '5000'],
      sb: '5000',
    });
    expect(s.verbrauch.value.toFixed(2)).toBe('10000.00');
    expect(buchungText(s.buchung)).toEqual([
      'SBK 5.000,00 € an Hilfsstoffe 5.000,00 €',
      'Hilfsstoffe 2.000,00 € an Aufwendungen für Hilfsstoffe 2.000,00 €',
    ]);
  });

  it('GC-C1-06 Fortschreibung mit Entnahmescheinen', () => {
    const s = solveC1({
      ...basis,
      variante: 'entnahme',
      ab: '10000',
      zugaenge: ['4000', '6000'],
      entnahmen: ['3000', '2500', '5000'],
    });
    expect(s.entnahmen.value.toFixed(2)).toBe('10500.00');
    expect(s.buchbestand.value.toFixed(2)).toBe('9500.00');
    expect(buchungText(s.buchung)).toEqual([
      'Aufwendungen für Rohstoffe 10.500,00 € an Rohstoffe 10.500,00 €',
    ]);
  });
});

describe('Eigenschaften C1', () => {
  it('beide Erfassungsmethoden führen zum selben Aufwand der Periode', () => {
    forSeeds(
      bestandVsAufwand,
      500,
      (p) => {
        const bestand = solveC1({ ...p, variante: 'inventur-bestand', erfassung: 'bestand' });
        const aufwand = solveC1({ ...p, variante: 'inventur-aufwand', erfassung: 'aufwand' });
        expect(aufwand.verbrauch.value.equals(bestand.verbrauch.value)).toBe(true);
      },
      { variant: 'inventur-aufwand' },
    );
  });

  it('Endbestand des Stoffkontos = Schlussbestand laut Inventur (aufwandsorientiert)', () => {
    forSeeds(
      bestandVsAufwand,
      500,
      (p, s) => {
        expect(new Val(p.ab).plus(s.delta).value.toFixed(2)).toBe(new Val(p.sb).value.toFixed(2));
      },
      { variant: 'inventur-aufwand' },
    );
  });

  it('Musterlösung je Variante richtig, falsche Erfassung wird erkannt', () => {
    for (const variant of bestandVsAufwand.variants) {
      forSeeds(
        bestandVsAufwand,
        50,
        (p, s) => {
          expect(selbstpruefung(bestandVsAufwand, p, s)).toBe(true);
        },
        { variant },
      );
    }
    const p = { ...basis, netto: '8000' };
    const s = solveC1(p);
    const falsch = solveC1({ ...p, erfassung: 'aufwand' });
    const antwort = {
      ...antwortAusParts(bestandVsAufwand.parts(p, s)),
      buchung: { typ: 'buchung' as const, saetze: eingabeAusLoesung(falsch.buchung) },
    };
    const r = bestandVsAufwand.check(p, s, antwort);
    expect(r.korrekt).toBe(false);
    expect(r.fehlertypen).toContain('erfassungsmethode-verwechselt');
  });
});
