// Golden Cases C3 (GC-06 aus 04-fachregeln.md plus eigene Zahlen, Herleitung in docs/m7/c1.md).
import { describe, expect, it } from 'vitest';
import { buchungText, forSeeds } from '../../test-utils';
import { antwortAusParts, eingabeAusLoesung } from '../../testing';
import { ruecksendungEinkauf, solveC3, type C3Params } from './c3-ruecksendung';

const basis: C3Params = {
  variante: 'netto',
  erfassung: 'bestand',
  stoff: 'Rohstoffe',
  gegenstand: 'Zucker',
  einheit: 'kg',
  partner: 'Testlieferant',
  ustSatz: '0.19',
  netto: '0',
  brutto: '0',
  menge: 0,
  zurueck: 0,
  preis: '0',
  listenpreis: '0',
  rabatt: '0',
  grund: 'weil die Ware beschädigt war',
  vorlage: 0,
};

describe('Golden Cases C3 – Rücksendung an den Lieferer', () => {
  it('GC-06 Rücksendung Rohstoffe netto 1.000 (04-fachregeln.md)', () => {
    const s = solveC3({ ...basis, netto: '1000' });
    expect(buchungText(s.buchung)).toEqual([
      'Verbindlichkeiten a. LL 1.190,00 € an Rohstoffe 1.000,00 €, an Vorsteuer 190,00 €',
    ]);
  });

  it('GC-C3-01 Gutschrift brutto gegeben', () => {
    const s = solveC3({ ...basis, variante: 'brutto', brutto: '2975' });
    expect(s.netto.value.toFixed(2)).toBe('2500.00');
    expect(s.vorsteuer.value.toFixed(2)).toBe('475.00');
    expect(buchungText(s.buchung)).toEqual([
      'Verbindlichkeiten a. LL 2.975,00 € an Rohstoffe 2.500,00 €, an Vorsteuer 475,00 €',
    ]);
  });

  it('GC-C3-02 Teilmenge zurück', () => {
    const s = solveC3({
      ...basis,
      variante: 'anteil',
      gegenstand: 'Braumalz',
      menge: 2000,
      zurueck: 500,
      preis: '0.6',
    });
    expect(buchungText(s.buchung)).toEqual([
      'Verbindlichkeiten a. LL 357,00 € an Rohstoffe 300,00 €, an Vorsteuer 57,00 €',
    ]);
  });

  it('GC-C3-03 Rücksendung mit Sofortrabatt', () => {
    const s = solveC3({
      ...basis,
      variante: 'rabatt',
      stoff: 'Vorprodukte und Fremdbauteile',
      listenpreis: '4000',
      rabatt: '0.1',
    });
    expect(buchungText(s.buchung)).toEqual([
      'Verbindlichkeiten a. LL 4.284,00 € an Vorprodukte und Fremdbauteile 3.600,00 €, an Vorsteuer 684,00 €',
    ]);
  });

  it('GC-C3-04 Rücksendung bei aufwandsorientierter Erfassung', () => {
    const s = solveC3({
      ...basis,
      variante: 'aufwand',
      erfassung: 'aufwand',
      stoff: 'Hilfsstoffe',
      netto: '800',
    });
    expect(buchungText(s.buchung)).toEqual([
      'Verbindlichkeiten a. LL 952,00 € an Aufwendungen für Hilfsstoffe 800,00 €, an Vorsteuer 152,00 €',
    ]);
  });
});

describe('Eigenschaften C3', () => {
  it('Gutschrift = Warenwert netto + Vorsteuer (alle Varianten)', () => {
    forSeeds(ruecksendungEinkauf, 1000, (_p, s) => {
      expect(s.netto.plus(s.vorsteuer).value.toFixed(2)).toBe(s.gutschrift.value.toFixed(2));
      expect(s.netto.cmp(0)).toBeGreaterThan(0);
    });
  });

  it('Rücksendung über das Nachlasskonto wird als Denkfehler erkannt', () => {
    const p: C3Params = { ...basis, netto: '1000' };
    const s = solveC3(p);
    const falsch = eingabeAusLoesung(s.buchung).map((x) => ({
      ...x,
      haben: x.haben.map((z) =>
        z.konto === 'Rohstoffe' ? { ...z, konto: 'Nachlässe für Rohstoffe' } : z,
      ),
    }));
    const r = ruecksendungEinkauf.check(p, s, {
      ...antwortAusParts(ruecksendungEinkauf.parts(p, s)),
      buchung: { typ: 'buchung', saetze: falsch },
    });
    expect(r.korrekt).toBe(false);
    expect(r.fehlertypen).toContain('ruecksendung-als-nachlass');
  });
});
