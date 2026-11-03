// Golden Cases GC-06 bis GC-20 aus docs/04-fachregeln.md (GC-01 bis GC-05: generators/skonto.test.ts).
import { describe, expect, it } from 'vitest';
import { solveAequivalenz } from './generators/aequivalenz';
import { solveBestand } from './generators/bestandsveraenderung';
import { solveKalkAfa, type KalkAfaParams } from './generators/kalk-afa';
import { solveSimultan, solveStufenleiter, type LvParams } from './generators/leistungsverrechnung';
import { solveUstAbschluss } from './generators/ust-abschluss';
import { solveZuschlag } from './generators/zuschlag';
import { formatNumber } from './money';
import {
  aktiveRechnungsabgrenzung,
  einkaufMitBezugskosten,
  forderungsbewertung,
  privatentnahmeGegenstand,
  ruecksendungEinkauf,
} from './solvers/buchungsfaelle';
import { bewertePeriodisch } from './solvers/materialbewertung';
import { buchungText } from './test-utils';
import type { Val } from './money';

const f = (v: Val) => formatNumber(v);

describe('Golden Cases', () => {
  it('GC-06 Rücksendung Einkauf', () => {
    expect(buchungText(ruecksendungEinkauf('Rohstoffe', '1000'))).toEqual([
      'Verbindlichkeiten a. LL 1.190,00 € an Rohstoffe 1.000,00 €, an Vorsteuer 190,00 €',
    ]);
  });

  it('GC-07 Bezugskosten', () => {
    const r = einkaufMitBezugskosten('Rohstoffe', '20000', '500');
    expect(buchungText(r.einkauf)).toEqual([
      'Rohstoffe 20.000,00 €, Bezugskosten für Rohstoffe 500,00 €, Vorsteuer 3.895,00 € an Verbindlichkeiten a. LL 24.395,00 €',
    ]);
    expect(buchungText(r.abschluss)).toEqual([
      'Rohstoffe 500,00 € an Bezugskosten für Rohstoffe 500,00 €',
    ]);
  });

  it('GC-08 Privatentnahme Gegenstand', () => {
    expect(buchungText(privatentnahmeGegenstand('600'))).toEqual([
      'Privat 714,00 € an Entnahme v. G. u. s. L. 600,00 €, an Umsatzsteuer 114,00 €',
    ]);
  });

  it('GC-09 USt-Abschluss Zahllast', () => {
    const s = solveUstAbschluss({
      vorsteuer: '30000',
      umsatzsteuer: '45000',
      anlass: 'jahresabschluss',
      monat: 'Dezember',
    });
    expect(s.fall).toBe('zahllast');
    expect(buchungText(s.buchung)).toEqual([
      'Umsatzsteuer 30.000,00 € an Vorsteuer 30.000,00 €',
      'Umsatzsteuer 15.000,00 € an SBK 15.000,00 €',
    ]);
  });

  it('GC-10 USt-Abschluss Überhang', () => {
    const s = solveUstAbschluss({
      vorsteuer: '52000',
      umsatzsteuer: '40000',
      anlass: 'jahresabschluss',
      monat: 'Dezember',
    });
    expect(s.fall).toBe('ueberhang');
    expect(buchungText(s.buchung)).toEqual([
      'Umsatzsteuer 40.000,00 € an Vorsteuer 40.000,00 €',
      'SBK 12.000,00 € an Vorsteuer 12.000,00 €',
    ]);
  });

  it('GC-11 Bestandsveränderungen', () => {
    const s = solveBestand({ ueAB: '10000', ueEB: '14000', feAB: '30000', feEB: '22000' });
    expect(buchungText(s.buchung)).toEqual([
      'Unfertige Erzeugnisse 4.000,00 € an Bestandsveränderungen 4.000,00 €',
      'Bestandsveränderungen 8.000,00 € an Fertige Erzeugnisse 8.000,00 €',
      'GuV 4.000,00 € an Bestandsveränderungen 4.000,00 €',
    ]);
    expect(s.saldo.isNegative()).toBe(true); // Minderbestand mindert den Erfolg
  });

  it('GC-12 Forderungsbewertung', () => {
    const r = forderungsbewertung({
      zweifelhaftBrutto: '11900',
      ausfallQuote: '0.4',
      restBrutto: '238000',
      pwbSatz: '0.01',
    });
    expect(buchungText(r.umbuchung)).toEqual([
      'Zweifelhafte Forderungen 11.900,00 € an Forderungen a. LL 11.900,00 €',
    ]);
    expect(buchungText(r.ewb)).toEqual([
      'Einstellung in Wertberichtigungen 4.000,00 € an EWB 4.000,00 €',
    ]);
    expect(buchungText(r.pwb)).toEqual([
      'Einstellung in Wertberichtigungen 2.000,00 € an PWB 2.000,00 €',
    ]);
  });

  it('GC-13 Rechnungsabgrenzung', () => {
    const r = aktiveRechnungsabgrenzung({
      aufwandskonto: 'Mietaufwendungen',
      betrag: '3000',
      monateGesamt: 3,
      monateAltesJahr: 1,
    });
    expect(buchungText(r.zahlung)).toEqual(['Mietaufwendungen 3.000,00 € an Bank 3.000,00 €']);
    expect(buchungText(r.abschluss)).toEqual(['ARAP 2.000,00 € an Mietaufwendungen 2.000,00 €']);
  });

  describe('GC-14 Kalkulatorische Abschreibung', () => {
    const base: Omit<KalkAfaParams, 'verfahren'> = {
      anlage: 'Abfüllanlage',
      ak: '120000',
      nebenkosten: '6000',
      nebenkostenArt: 'Montagekosten',
      restwert: '6000',
      nd: 5,
      gesamtLeistung: 30000,
      leistungJahr1: 9000,
    };
    it('GC-14 linear', () => {
      expect(f(solveKalkAfa({ ...base, verfahren: 'linear' }).linear!)).toBe('24.000,00');
    });
    it('GC-14 arithmetisch-degressiv', () => {
      const s = solveKalkAfa({ ...base, verfahren: 'arithmetisch' });
      expect(f(s.degression!)).toBe('8.000,00');
      expect(s.jahre!.map(f)).toEqual(['40.000,00', '32.000,00', '24.000,00']);
    });
    it('GC-14 leistungsbezogen', () => {
      const s = solveKalkAfa({ ...base, verfahren: 'leistung' });
      expect(f(s.satzJeEinheit!)).toBe('4,00');
      expect(f(s.leistungJahr1!)).toBe('36.000,00');
    });
  });

  describe('GC-15 Materialbewertung', () => {
    const posten = [
      { menge: 100, preis: '10' },
      { menge: 200, preis: '12' },
      { menge: 100, preis: '15' },
    ];
    it('GC-15 FIFO', () =>
      expect(f(bewertePeriodisch('fifo', posten, 250).verbrauch)).toBe('2.800,00'));
    it('GC-15 LIFO', () =>
      expect(f(bewertePeriodisch('lifo', posten, 250).verbrauch)).toBe('3.300,00'));
    it('GC-15 gewogener Durchschnitt', () => {
      const b = bewertePeriodisch('durchschnitt', posten, 250);
      expect(f(b.durchschnittspreis!)).toBe('12,25');
      expect(f(b.verbrauch)).toBe('3.062,50');
    });
  });

  const gc16: LvParams = {
    hilfs: [
      { name: 'Energie', primaer: '40000', einheit: 'kWh' },
      { name: 'Reparatur', primaer: '18000', einheit: 'Std.' },
    ],
    haupt: [
      { name: 'Material', primaer: '30000' },
      { name: 'Fertigung', primaer: '50000' },
    ],
    mengen: [
      [0, 2000, 3000, 5000],
      [50, 0, 100, 150],
    ],
  };

  it('GC-16 Stufenleiterverfahren', () => {
    const s = solveStufenleiter(gc16);
    expect(s.werte.map(f)).toEqual(['8.000,00', '3.000,00']);
    expect(s.erste).toBe(0);
    expect(s.saetze.map(f)).toEqual(['4,00', '104,00']);
    expect(s.summen.map(f)).toEqual(['52.400,00', '85.600,00']);
    expect(f(s.summen[0]!.plus(s.summen[1]!))).toBe('138.000,00');
    expect(f(s.primaerGesamt)).toBe('138.000,00');
  });

  it('GC-17 Simultanverfahren', () => {
    const s = solveSimultan(gc16);
    expect(s.saetzeBruch.map((x) => x.toFraction())).toEqual(['129/29', '2600/29']);
    expect(s.saetze.map(f)).toEqual(['4,45', '89,66']);
    // Exakter Pfad (erst am Ende runden)
    expect(s.summen.map((v) => formatNumber(v.exact))).toEqual(['52.310,34', '85.689,66']);
    expect(formatNumber(s.summen[0]!.plus(s.summen[1]!).exact)).toBe('138.000,00');
  });

  it('GC-18 Äquivalenzziffern', () => {
    const s = solveAequivalenz({
      sorten: [
        { name: 'A', menge: 1000, aez: '1' },
        { name: 'B', menge: 2000, aez: '0.8' },
        { name: 'C', menge: 500, aez: '1.5' },
      ],
      basis: 0,
      gesamtkosten: '67000',
      variante: 'ziffern',
    });
    expect(formatNumber(s.summeRe.exact, 0)).toBe('3.350');
    expect(f(s.kostenJeRe)).toBe('20,00');
    expect(s.stueckkosten.map(f)).toEqual(['20,00', '16,00', '30,00']);
  });

  it('GC-19 Zuschlagskalkulation', () => {
    const s = solveZuschlag({
      variante: 'differenzierend',
      auftrag: 'Test',
      kunde: 'Test',
      fm: '10000',
      mgk: '0.1',
      fertigung: [{ name: 'Fertigung', fl: '5000', fgk: '1.2' }],
      vwgk: '0.15',
      vtgk: '0.05',
    });
    const w = Object.fromEntries(s.werte.map((x) => [x.id, f(x.wert)]));
    expect(w).toMatchObject({
      mk: '11.000,00',
      fk: '11.000,00',
      hk: '22.000,00',
      vwgk: '3.300,00',
      vtgk: '1.100,00',
      sk: '26.400,00',
    });
  });

  it('GC-20 Verkaufskalkulation', () => {
    const s = solveZuschlag({
      variante: 'angebot',
      auftrag: 'Test',
      kunde: 'Test',
      sk: '93000',
      gewinn: '0.15',
      skonto: '0.02',
      provision: '0.06',
      rabatt: '0.07',
    });
    const w = Object.fromEntries(s.werte.map((x) => [x.id, f(x.wert)]));
    expect(w).toMatchObject({ bvp: '106.950,00', zvp: '116.250,00', lvp: '125.000,00' });
  });
});
