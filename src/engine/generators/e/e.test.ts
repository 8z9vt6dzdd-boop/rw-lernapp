// Golden Cases (eigene Zahlen, docs/m7/e.md) und Eigenschaftstests für E1, E2, E3.
import { describe, expect, it } from 'vitest';
import { Val, dec, formatNumber, sum } from '../../money';
import { buchungText, forSeeds } from '../../test-utils';
import { anlagenkauf, solveAnlagenkauf, type AnlagenkaufParams } from './anlagenkauf';
import { bilanzAfa, solveBilanzAfa, type BilanzAfaParams } from './bilanz-afa';
import {
  eigenleistungAib,
  solveEigenleistung,
  type EigenleistungParams,
} from './eigenleistung-aib';

const f = (v: Val) => formatNumber(v);

const KAUF: AnlagenkaufParams = {
  variante: 'kauf',
  anlage: 'eine Etikettiermaschine',
  bezeichnung: 'Etikettiermaschine',
  konto: 'Technische Anlagen und Maschinen',
  verkaeufer: 'Anlagenbau Tiemann KG (Warburg)',
  listenpreis: '50000',
  rabattSatz: '0.1',
  nebenkosten: [
    { art: 'Transport', betrag: '800' },
    { art: 'Montage', betrag: '1200' },
  ],
  ustSatz: '0.19',
};

describe('Golden Cases E1 – Anlagenkauf', () => {
  it('GC-E1-a Kauf mit Rabatt und Nebenkosten', () => {
    const s = solveAnlagenkauf(KAUF);
    expect(f(s.anschaffungspreis)).toBe('45.000,00');
    expect(f(s.nebenkosten)).toBe('2.000,00');
    expect(f(s.anschaffungskosten)).toBe('47.000,00');
    expect(f(s.vorsteuer)).toBe('8.930,00');
    expect(f(s.rechnung)).toBe('55.930,00');
    expect(buchungText(s.eingang)).toEqual([
      'TA und Maschinen 47.000,00 €, Vorsteuer 8.930,00 € an Verbindlichkeiten a. LL 55.930,00 €',
    ]);
  });

  it('GC-E1-b Zahlung mit 2 % Skonto mindert das Anlagekonto (Nettomethode)', () => {
    const s = solveAnlagenkauf({ ...KAUF, variante: 'skonto', skontoSatz: '0.02' });
    expect(f(s.skontoBrutto!)).toBe('1.118,60');
    expect(f(s.skontoNetto!)).toBe('940,00');
    expect(f(s.steuerKorrektur!)).toBe('178,60');
    expect(f(s.zahlbetrag!)).toBe('54.811,40');
    expect(f(s.akEndgueltig!)).toBe('46.060,00');
    expect(buchungText(s.zahlung!)).toEqual([
      'Verbindlichkeiten a. LL 55.930,00 € an Bank 54.811,40 €, an TA und Maschinen 940,00 €, an Vorsteuer 178,60 €',
    ]);
  });

  it('GC-E1-c Nebenkosten auf getrennter Rechnung', () => {
    const s = solveAnlagenkauf({
      variante: 'nebenkosten-getrennt',
      anlage: 'einen Auslieferungs-Lkw',
      bezeichnung: 'Auslieferungs-Lkw',
      konto: 'Fuhrpark',
      verkaeufer: 'einem Nutzfahrzeughändler in Paderborn',
      dienstleister: 'einem Überführungsdienst aus Lippstadt',
      listenpreis: '80000',
      rabattSatz: '0',
      nebenkosten: [{ art: 'Überführung', betrag: '600' }],
      ustSatz: '0.19',
    });
    expect(buchungText(s.eingang)).toEqual([
      'Fuhrpark 80.000,00 €, Vorsteuer 15.200,00 € an Verbindlichkeiten a. LL 95.200,00 €',
    ]);
    expect(buchungText(s.nebenkostenBuchung!)).toEqual([
      'Fuhrpark 600,00 €, Vorsteuer 114,00 € an Bank 714,00 €',
    ]);
    expect(f(s.anschaffungskosten)).toBe('80.600,00');
  });

  it('Eigenschaften: AK = Preis − Rabatt + Nebenkosten, Rechnung = AK + Vorsteuer, Zahlung + Skonto = Rechnung', () => {
    for (const variant of anlagenkauf.variants)
      forSeeds(
        anlagenkauf,
        400,
        (p, s) => {
          const nk = sum(p.nebenkosten.map((n) => n.betrag));
          expect(s.anschaffungskosten.value.equals(s.anschaffungspreis.plus(nk).value)).toBe(true);
          expect(s.anschaffungspreis.value.lte(dec(p.listenpreis))).toBe(true);
          const netto =
            p.variante === 'nebenkosten-getrennt' ? s.anschaffungspreis : s.anschaffungskosten;
          expect(s.rechnung.value.equals(netto.plus(s.vorsteuer).value)).toBe(true);
          if (p.variante === 'skonto') {
            expect(s.zahlbetrag!.plus(s.skontoBrutto!).value.equals(s.rechnung.value)).toBe(true);
            expect(
              s.skontoNetto!.plus(s.steuerKorrektur!).value.equals(s.skontoBrutto!.value),
            ).toBe(true);
            expect(s.akEndgueltig!.cmp(s.anschaffungskosten)).toBeLessThan(0);
          }
        },
        { variant },
      );
  });
});

const EIGEN: EigenleistungParams = {
  variante: 'eigenleistung',
  objekt: 'eine Förderstrecke zwischen Abfüllung und Logistikzentrum',
  konto: 'Technische Anlagen und Maschinen',
  ustSatz: '0.19',
  material: '12000',
  loehne: '8000',
  mgkSatz: '0.1',
  fgkSatz: '1.5',
  vtgkSatz: '0.05',
};

describe('Golden Cases E2 – Eigenleistungen, Anlagen im Bau, Anzahlungen', () => {
  it('GC-E2-a Aktivierte Eigenleistung ohne Vertriebskosten', () => {
    const s = solveEigenleistung(EIGEN);
    expect(f(s.mgk!)).toBe('1.200,00');
    expect(f(s.fgk!)).toBe('12.000,00');
    expect(f(s.hk!)).toBe('33.200,00');
    expect(buchungText(s.buchungen.buchung!)).toEqual([
      'TA und Maschinen 33.200,00 € an Aktivierte Eigenleistungen 33.200,00 €',
    ]);
  });

  it('GC-E2-b Anzahlung und Schlussrechnung mit Verrechnung', () => {
    const s = solveEigenleistung({
      variante: 'anzahlung',
      objekt: 'die neue Abfülllinie für Glasflaschen',
      konto: 'Technische Anlagen und Maschinen',
      ustSatz: '0.19',
      anzahlung: '30000',
      schlussrechnung: '90000',
      partner: 'Abfülltechnik Hagedorn GmbH (Lippstadt)',
    });
    expect(buchungText(s.buchungen.anzahlung!)).toEqual([
      'Geleistete Anzahlungen auf Sachanlagen 30.000,00 €, Vorsteuer 5.700,00 € an Bank 35.700,00 €',
    ]);
    expect(f(s.rest!)).toBe('60.000,00');
    expect(f(s.vstRest!)).toBe('11.400,00');
    expect(f(s.ueberweisung!)).toBe('71.400,00');
    expect(buchungText(s.buchungen.schluss!)).toEqual([
      'Anlagen im Bau 90.000,00 €, Vorsteuer 11.400,00 € an Bank 71.400,00 €, an Geleistete Anzahlungen auf Sachanlagen 30.000,00 €',
    ]);
  });

  it('GC-E2-c Schlussrechnung und Umbuchung bei Fertigstellung', () => {
    const s = solveEigenleistung({
      variante: 'fertigstellung',
      objekt: 'die neue Abfülllinie für Glasflaschen',
      konto: 'Technische Anlagen und Maschinen',
      ustSatz: '0.19',
      aibVorjahr: '140000',
      schlussrechnung: '60000',
      partner: 'Abfülltechnik Hagedorn GmbH (Lippstadt)',
      monat: 'April',
    });
    expect(buchungText(s.buchungen.schluss!)).toEqual([
      'Anlagen im Bau 60.000,00 €, Vorsteuer 11.400,00 € an Verbindlichkeiten a. LL 71.400,00 €',
    ]);
    expect(buchungText(s.buchungen.umbuchung!)).toEqual([
      'TA und Maschinen 200.000,00 € an Anlagen im Bau 200.000,00 €',
    ]);
  });

  it('Eigenschaften: HK = Summe der Bestandteile, Anzahlung vollständig verrechnet, Vorsteuer gesamt = 19 % der Schlussrechnung', () => {
    forSeeds(
      eigenleistungAib,
      400,
      (p, s) => {
        const hk = sum([p.material!, p.loehne!, s.mgk!, s.fgk!]);
        expect(s.hk!.value.equals(hk.value)).toBe(true);
      },
      { variant: 'eigenleistung' },
    );
    forSeeds(
      eigenleistungAib,
      400,
      (p, s) => {
        const vstGesamt = s.vstAnzahlung!.plus(s.vstRest!);
        const soll = new Val(p.schlussrechnung!).times(p.ustSatz).value;
        expect(vstGesamt.value.minus(soll).abs().lte('0.01')).toBe(true);
        // Konto Geleistete Anzahlungen ist nach der Schlussrechnung ausgeglichen
        const ganz = 'Geleistete Anzahlungen auf Sachanlagen';
        const zugang = s.buchungen.anzahlung!.saetze[0]!.soll.find((z) => z.konto === ganz)!;
        const abgang = s.buchungen.schluss!.saetze[0]!.haben.find((z) => z.konto === ganz)!;
        expect(zugang.betrag.value.equals(abgang.betrag.value)).toBe(true);
      },
      { variant: 'anzahlung' },
    );
    forSeeds(
      eigenleistungAib,
      400,
      (p, s) => {
        expect(s.ak!.value.equals(sum([p.aibVorjahr!, p.schlussrechnung!]).value)).toBe(true);
      },
      { variant: 'fertigstellung' },
    );
  });
});

const AFA: BilanzAfaParams = {
  variante: 'linear',
  anlage: 'eine neue Etikettiermaschine',
  konto: 'Technische Anlagen und Maschinen',
  kaufpreis: '70500',
  nebenkosten: '1500',
  nebenkostenArt: 'Montage',
  nd: 8,
  monat: 9,
};

describe('Golden Cases E3 – Bilanzielle Abschreibung', () => {
  it('GC-E3-a linear, zeitanteilig ab September', () => {
    const s = solveBilanzAfa(AFA);
    expect(f(s.ak)).toBe('72.000,00');
    expect(f(s.jahresAfa!)).toBe('9.000,00');
    expect(s.monate).toBe(4);
    expect(f(s.afa1)).toBe('3.000,00');
    expect(f(s.bw1)).toBe('69.000,00');
    expect(f(s.bw2!)).toBe('60.000,00');
    expect(buchungText(s.buchung)).toEqual([
      'Abschreibungen auf SA 3.000,00 € an TA und Maschinen 3.000,00 €',
    ]);
  });

  it('GC-E3-b geometrisch-degressiv 25 % vom Buchwert, Anschaffung im April', () => {
    const s = solveBilanzAfa({
      ...AFA,
      variante: 'degressiv',
      kaufpreis: '120000',
      nebenkosten: '0',
      nd: 10,
      monat: 4,
      satz: '0.25',
    });
    expect(s.monate).toBe(9);
    expect(f(s.afa1)).toBe('22.500,00');
    expect(f(s.bw1)).toBe('97.500,00');
    expect(f(s.afa2!)).toBe('24.375,00');
    expect(f(s.bw2!)).toBe('73.125,00');
  });

  it('GC-E3-c nach Leistungseinheiten (Lkw)', () => {
    const s = solveBilanzAfa({
      variante: 'leistung',
      anlage: 'einen neuen Auslieferungs-Lkw',
      konto: 'Fuhrpark',
      kaufpreis: '150000',
      nebenkosten: '0',
      nebenkostenArt: 'Überführung',
      nd: 8,
      monat: 3,
      gesamtLeistung: 300000,
      leistungJahr: 48000,
      einheit: 'km',
    });
    expect(f(s.satzJeEinheit!)).toBe('0,50');
    expect(f(s.afa1)).toBe('24.000,00');
    expect(f(s.bw1)).toBe('126.000,00');
    expect(buchungText(s.buchung)).toEqual([
      'Abschreibungen auf SA 24.000,00 € an Fuhrpark 24.000,00 €',
    ]);
  });

  it('Satz je Leistungseinheit wird nicht vorab gerundet (exakter Pfad)', () => {
    const s = solveBilanzAfa({
      ...AFA,
      variante: 'leistung',
      kaufpreis: '100000',
      nebenkosten: '0',
      gesamtLeistung: 30000,
      leistungJahr: 9000,
      einheit: 'h',
    });
    expect(f(s.afa1)).toBe('30.000,00');
    // Klausurweg mit 3,33 €/h ist ebenfalls zulässig
    expect(s.afa1.stepped.toFixed(2)).toBe('29970.00');
  });

  it('Eigenschaften: Buchwert = AK − Abschreibung, Abschreibung im Anschaffungsjahr ≤ volles Jahr, Buchwerte positiv', () => {
    for (const variant of bilanzAfa.variants)
      forSeeds(
        bilanzAfa,
        400,
        (p, s) => {
          expect(s.bw1.value.equals(s.ak.minus(s.afa1).value)).toBe(true);
          expect(s.monate).toBe(13 - p.monat);
          expect(s.bw1.isNegative()).toBe(false);
          if (p.variante === 'linear') {
            expect(s.afa1.cmp(s.jahresAfa!)).toBeLessThanOrEqual(0);
            // Über die volle Nutzungsdauer wird genau die Anschaffung abgeschrieben (exakter Pfad)
            expect(s.jahresAfa!.exact.times(p.nd).minus(s.ak.exact).abs().lte('0.000001')).toBe(
              true,
            );
          }
          if (p.variante === 'degressiv') {
            expect(s.afa1.cmp(s.ak.times(p.satz!))).toBeLessThanOrEqual(0);
            expect(s.bw2!.isNegative()).toBe(false);
            expect(dec(p.satz!).lte(dec(3).div(p.nd))).toBe(true);
            expect(dec(p.satz!).lte('0.3')).toBe(true);
          }
        },
        { variant },
      );
  });
});
