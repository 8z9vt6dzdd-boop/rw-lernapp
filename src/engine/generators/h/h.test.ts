// Golden Cases und Eigenschaftstests Batch h (H1, H2, H5, H6). Eigene Zahlen, siehe docs/m7/h.md.
import { describe, expect, it } from 'vitest';
import { FEHLERTYPEN } from '../../fehlertypen';
import { BATCH_H } from '../batches/h';
import { formatNumber } from '../../money';
import type { Val } from '../../money';
import { forSeeds } from '../../test-utils';
import { kalkZinsen, solveZinsen, type ZinsParams } from './kalk-zinsen';
import { materialbewertung, solveMatBew, type MatBewParams } from './materialbewertung';
import { materialmengen, solveMengen, type MengenParams } from './materialmengen';
import { solveWagnis, wagnisse } from './wagnisse';

const f = (v: Val) => formatNumber(v.value);

describe('GC-15 Materialbewertung (04-fachregeln.md)', () => {
  const p: Omit<MatBewParams, 'verfahren'> = {
    art: 'periodisch',
    material: 'Zitronenaroma',
    einheit: 'kg',
    monat: 1,
    ab: { menge: 100, preis: '10' },
    bewegungen: [
      { tag: 5, menge: 200, preis: '12' },
      { tag: 12, menge: 100, preis: '15' },
      { tag: 28, menge: 250 },
    ],
  };
  it('FIFO 2.800,00', () =>
    expect(f(solveMatBew({ ...p, verfahren: 'fifo' }).verbrauch)).toBe('2.800,00'));
  it('LIFO 3.300,00', () =>
    expect(f(solveMatBew({ ...p, verfahren: 'lifo' }).verbrauch)).toBe('3.300,00'));
  it('gewogener Durchschnitt 12,25 → 3.062,50', () => {
    const s = solveMatBew({ ...p, verfahren: 'durchschnitt' });
    expect(f(s.durchschnittspreis!)).toBe('12,25');
    expect(f(s.verbrauch)).toBe('3.062,50');
  });
});

describe('GC-H2 Materialbewertung periodisch und permanent', () => {
  const p: Omit<MatBewParams, 'verfahren' | 'art'> = {
    material: 'Zitronenaroma',
    einheit: 'kg',
    monat: 3,
    ab: { menge: 50, preis: '30' },
    bewegungen: [
      { tag: 3, menge: 30 },
      { tag: 8, menge: 100, preis: '33' },
      { tag: 14, menge: 70 },
      { tag: 20, menge: 50, preis: '37' },
      { tag: 27, menge: 60 },
    ],
  };
  const per = (verfahren: MatBewParams['verfahren']) =>
    solveMatBew({ ...p, verfahren, art: 'periodisch' });
  const perm = (verfahren: MatBewParams['verfahren']) =>
    solveMatBew({ ...p, verfahren, art: 'permanent' });

  it('periodischer Durchschnitt: 33,25 €/kg, Verbrauch 5.320,00, Endbestand 1.330,00', () => {
    const s = per('durchschnitt');
    expect(s.verbrauchMenge).toBe(160);
    expect(f(s.durchschnittspreis!)).toBe('33,25');
    expect(f(s.verbrauch)).toBe('5.320,00');
    expect(f(s.endbestand)).toBe('1.330,00');
  });
  it('periodischer Durchschnitt ohne Anfangsbestand (Fehlertyp) 34,33 → 5.492,80 (ungerundet 5.493,33)', () => {
    const s = solveMatBew(
      { ...p, verfahren: 'durchschnitt', art: 'periodisch' },
      { ohneAnfangsbestand: true },
    );
    expect(f(s.verbrauch)).toBe('5.492,80');
    // ungerundeter zweiter Pfad
    expect(s.verbrauch.stepped.toDecimalPlaces(2).toFixed(2)).toBe('5493.33');
  });
  it('permanenter Durchschnitt: 30,00 / 32,50 / 34,75 → 900,00 + 2.275,00 + 2.085,00 = 5.260,00', () => {
    const s = perm('durchschnitt');
    expect(s.abgaenge!.map((a) => f(a.preis!))).toEqual(['30,00', '32,50', '34,75']);
    expect(s.abgaenge!.map((a) => f(a.wert))).toEqual(['900,00', '2.275,00', '2.085,00']);
    expect(f(s.verbrauch)).toBe('5.260,00');
    expect(f(s.endbestand)).toBe('1.390,00');
  });
  it('Fifo periodisch = permanent 5.170,00, Endbestand 1.480,00', () => {
    expect(f(per('fifo').verbrauch)).toBe('5.170,00');
    expect(perm('fifo').abgaenge!.map((a) => f(a.wert))).toEqual([
      '900,00',
      '2.250,00',
      '2.020,00',
    ]);
    expect(f(perm('fifo').verbrauch)).toBe('5.170,00');
    expect(f(per('fifo').endbestand)).toBe('1.480,00');
  });
  it('Lifo periodisch 5.450,00, permanent 900,00 + 2.310,00 + 2.180,00 = 5.390,00', () => {
    expect(f(per('lifo').verbrauch)).toBe('5.450,00');
    expect(f(per('lifo').endbestand)).toBe('1.200,00');
    expect(perm('lifo').abgaenge!.map((a) => f(a.wert))).toEqual([
      '900,00',
      '2.310,00',
      '2.180,00',
    ]);
    expect(f(perm('lifo').endbestand)).toBe('1.260,00');
  });
  it('Hifo und Lofo', () => {
    expect(f(per('hifo').verbrauch)).toBe('5.450,00');
    expect(f(perm('hifo').verbrauch)).toBe('5.390,00');
    expect(f(per('lofo').verbrauch)).toBe('5.170,00');
    expect(f(perm('lofo').verbrauch)).toBe('5.170,00');
  });
});

describe('GC-H1 Materialverbrauchsmengen', () => {
  const p: MengenParams = {
    variante: 'vergleich',
    material: 'Zucker',
    einheit: 'kg',
    erzeugnisEinheit: 'Chargen',
    preis: '0.9',
    ab: 12_000,
    zugaenge: [18_000, 9_000],
    eb: 10_500,
    entnahmen: [14_000, 9_500, 4_000],
    erzeugnisse: [
      { name: 'Senne Lemon', menge: 50, bedarf: 250 },
      { name: 'Paderquell Energy', menge: 35, bedarf: 400 },
    ],
  };
  it('Inventur 28.500, Skontration 27.500, retrograd 26.500, Schwund 1.000, Mehrverbrauch 1.000', () => {
    const s = solveMengen(p);
    expect([s.inventur, s.skontration, s.retrograd, s.schwund, s.mehrverbrauch]).toEqual([
      28_500, 27_500, 26_500, 1_000, 1_000,
    ]);
    expect([s.sollEbSkontration, s.sollEbRetrograd]).toEqual([11_500, 12_500]);
  });
  it('Bewertung mit 0,90 €/kg', () => {
    expect(f(solveMengen({ ...p, variante: 'inventur' }).kosten!)).toBe('25.650,00');
    expect(f(solveMengen({ ...p, variante: 'skontration' }).kosten!)).toBe('24.750,00');
    expect(f(solveMengen({ ...p, variante: 'retrograd' }).kosten!)).toBe('23.850,00');
  });
});

describe('GC-H5 Kalkulatorische Zinsen', () => {
  const anlage: ZinsParams = {
    variante: 'durchschnitt',
    zinssatz: '0.08',
    anlage: 'Abfüllanlage',
    anschaffungswert: '480000',
    restwert: '40000',
    nd: 8,
  };
  it('Durchschnittswertverzinsung: 260.000 gebunden, 20.800,00 p. a., 1.733,33 je Monat', () => {
    const s = solveZinsen(anlage);
    expect(f(s.kapitalbindung!)).toBe('260.000,00');
    expect(f(s.zinsenJahr)).toBe('20.800,00');
    expect(f(s.zinsenMonat)).toBe('1.733,33');
  });
  it('Restwertverzinsung: AfA 55.000, Zinsen 38.400 / 34.000 / 29.600', () => {
    const s = solveZinsen({ ...anlage, variante: 'restwert' });
    expect(f(s.afa!)).toBe('55.000,00');
    expect(s.zinsenJahre!.map(f)).toEqual(['38.400,00', '34.000,00', '29.600,00']);
  });
  it('betriebsnotwendiges Kapital 1.750.000, Zinsen 175.000,00 p. a. bzw. 14.583,33 je Monat', () => {
    const s = solveZinsen({
      variante: 'betriebsnotwendig',
      zinssatz: '0.1',
      positionen: [
        { name: 'Grundstück', wert: '300000', art: 'grund' },
        { name: 'Gebäude', wert: '1200000', art: 'abnutzbar' },
        { name: 'Abfüllanlage', wert: '900000', art: 'abnutzbar' },
        { name: 'Vermietetes Wohnhaus', wert: '250000', art: 'nicht-betrieblich' },
        { name: 'Vorräte', wert: '320000', endwert: '280000', art: 'uv' },
        { name: 'Forderungen', wert: '180000', endwert: '220000', art: 'uv' },
        { name: 'Zahlungsmittel', wert: '50000', art: 'uv' },
        { name: 'Kundenanzahlungen', wert: '60000', art: 'abzug' },
        { name: 'Lieferantenkredite', wert: '90000', art: 'abzug' },
        { name: 'Darlehen', wert: '500000', art: 'verzinst' },
      ],
    });
    expect([s.bnAV, s.bnUV, s.bnV, s.abzug, s.bnK].map((v) => f(v!))).toEqual([
      '1.350.000,00',
      '550.000,00',
      '1.900.000,00',
      '150.000,00',
      '1.750.000,00',
    ]);
    expect(f(s.zinsenJahr)).toBe('175.000,00');
    expect(f(s.zinsenMonat)).toBe('14.583,33');
  });
});

describe('GC-H6 Wagnisse und Zusatzkosten', () => {
  it('Beständewagnis: 15.000 ÷ 1.000.000 = 1,5 % → 4.200,00', () => {
    const s = solveWagnis({
      variante: 'bestaende',
      basisJahre: ['240000', '260000', '300000', '200000'],
      schaeden: '15000',
      basisAktuell: '280000',
    });
    expect(f(s.summeBasis!)).toBe('1.000.000,00');
    expect(s.satz!.exact.toString()).toBe('0.015');
    expect(f(s.wagnis!)).toBe('4.200,00');
  });
  it('Unternehmerlohn 180.000 + Miete 39.600 = 219.600,00 Zusatzkosten', () => {
    const s = solveWagnis({
      variante: 'zusatzkosten',
      gehaelter: ['8000', '7000'],
      flaeche: 600,
      mieteQm: '5.5',
    });
    expect(
      [s.lohnMonat, s.lohnJahr, s.mieteMonat, s.mieteJahr, s.zusatzJahr].map((v) => f(v!)),
    ).toEqual(['15.000,00', '180.000,00', '3.300,00', '39.600,00', '219.600,00']);
  });
});

describe('Eigenschaften', () => {
  it('H2: Verbrauch + Endbestand = Wert von Anfangsbestand und Zugängen (außer periodischer Durchschnitt: Endbestand = Menge × Preis)', () => {
    for (const variant of materialbewertung.variants.filter((v) => v !== 'durchschnitt-periodisch'))
      forSeeds(
        materialbewertung,
        150,
        (_p, s) => {
          expect(
            s.verbrauch.exact
              .plus(s.endbestand.exact)
              .minus(s.gesamtWert.exact)
              .abs()
              .lte('0.000001'),
          ).toBe(true);
          expect(s.ebMenge).toBeGreaterThan(0);
        },
        { variant },
      );
  });

  it('H2: Fifo periodisch = Fifo permanent; Lofo ≤ Durchschnitt ≤ Hifo', () => {
    forSeeds(materialbewertung, 300, (p) => {
      const v = (verfahren: MatBewParams['verfahren'], art: MatBewParams['art'] = 'periodisch') =>
        solveMatBew({ ...p, verfahren, art }).verbrauch.exact;
      expect(v('fifo').equals(v('fifo', 'permanent'))).toBe(true);
      const zugaenge = p.bewegungen.filter((b) => b.preis);
      const menge = p.ab.menge + zugaenge.reduce((a, b) => a + b.menge, 0);
      const s = solveMatBew({ ...p, verfahren: 'fifo', art: 'periodisch' });
      const avg = s.gesamtWert.exact.div(menge).times(s.verbrauchMenge);
      expect(v('lofo').lte(avg.plus('0.000001'))).toBe(true);
      expect(v('hifo').gte(avg.minus('0.000001'))).toBe(true);
    });
  });

  it('H2: klausurfreundliche periodische Durchschnittspreise gehen meist ohne Rundung auf', () => {
    let glatt = 0;
    forSeeds(
      materialbewertung,
      300,
      (_p, s) => {
        if (s.durchschnittspreis!.exact.equals(s.durchschnittspreis!.stepped)) glatt++;
      },
      { variant: 'durchschnitt-periodisch' },
    );
    expect(glatt).toBeGreaterThan(200);
  });

  it('H1: Inventurverbrauch − Sollverbrauch = Schwund + Mehrverbrauch, alle Mengen positiv', () => {
    for (const variant of materialmengen.variants)
      forSeeds(
        materialmengen,
        200,
        (p, s) => {
          expect(s.inventur - s.retrograd).toBe(s.schwund + s.mehrverbrauch);
          expect(s.schwund).toBeGreaterThan(0);
          expect(s.mehrverbrauch).toBeGreaterThan(0);
          expect(p.eb).toBeGreaterThan(0);
          expect(p.entnahmen.reduce((a, b) => a + b, 0)).toBe(s.skontration);
        },
        { variant },
      );
  });

  it('H5: betriebsnotwendiges Kapital = Vermögen − Abzugskapital; Durchschnittszinsen < Zinsen vom vollen Wert', () => {
    forSeeds(kalkZinsen, 300, (p, s) => {
      if (p.variante === 'betriebsnotwendig')
        expect(s.bnK!.exact.equals(s.bnV!.exact.minus(s.abzug!.exact))).toBe(true);
      if (p.variante === 'durchschnitt')
        expect(s.zinsenJahr.exact.lt(solveZinsen(p, { vollerWert: true }).zinsenJahr.exact)).toBe(
          true,
        );
      if (p.variante === 'restwert') {
        const z = s.zinsenJahre!.map((x) => x.exact);
        expect(z[0]!.gt(z[1]!) && z[1]!.gt(z[2]!)).toBe(true);
      }
    });
  });

  it('H6: Wagniskosten = Satz × Basis; Zusatzkosten = Lohn + Miete', () => {
    forSeeds(wagnisse, 300, (p, s) => {
      if (p.variante === 'zusatzkosten')
        expect(s.zusatzJahr!.exact.equals(s.lohnJahr!.exact.plus(s.mieteJahr!.exact))).toBe(true);
      else expect(s.satz!.exact.gt(0) && s.satz!.exact.lt('0.05')).toBe(true);
    });
  });

  it('alle Fehlertypen der Batch-h-Generatoren sind im Katalog erklärt', () => {
    for (const g of BATCH_H.generatoren)
      for (const variant of g.variants)
        forSeeds(
          g,
          20,
          (p, s) => {
            for (const v of g.errorVariants(p))
              expect(FEHLERTYPEN[v.fehlertyp], v.fehlertyp).toBeDefined();
            for (const part of g.parts(p, s))
              if (part.typ === 'aufgabe-erkennen')
                for (const o of part.optionen)
                  if (o.fehlertyp) expect(FEHLERTYPEN[o.fehlertyp]).toBeDefined();
          },
          { variant },
        );
  });
});
