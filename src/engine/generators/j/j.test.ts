// Golden Cases und Prüfregeln Batch j (docs/m7/j.md): J2 Division, J5 Maschinenstundensatz,
// J6 Kuppelkalkulation, J7 Gesamt- und Umsatzkostenverfahren. Eigene Zahlen.
import { describe, expect, it } from 'vitest';
import { felderVon } from '../../check';
import { formatNumber, type Val } from '../../money';
import { createRng } from '../../rng';
import { antwortAusParts } from '../../testing';
import { forSeeds } from '../../test-utils';
import type { AnyGenerator } from '../index';
import { isExact } from '../base';
import { division, solveDivision, type DivisionParams } from './division';
import { gkvUkv, solveGkvUkv, type GkvUkvParams } from './gkv-ukv';
import { kuppel, solveKuppel, type KuppelParams } from './kuppel';
import { maschinensatz, solveMaschinensatz, type MaschinenParams } from './maschinensatz';

const f = (v: Val) => formatNumber(v);
const werte = (s: { werte: { liste: { id: string; wert: Val }[] } }) =>
  Object.fromEntries(s.werte.liste.map((w) => [w.id, f(w.wert)]));

describe('Golden Cases J2 Divisionskalkulation', () => {
  it('GC-J2-1 einstufig', () => {
    const p: DivisionParams = {
      variante: 'einstufig',
      monat: 'Mai',
      produkt: 'Paderquell Energy 0,5 l',
      einheit: 'Kartons',
      kostenarten: [
        { name: 'Rohstoffe', betrag: '54000' },
        { name: 'Dosen', betrag: '42000' },
        { name: 'Löhne', betrag: '30000' },
      ],
      menge: 42_000,
    };
    expect(werte(solveDivision(p))).toEqual({ gesamt: '126.000,00', ks: '3,00' });
  });

  const zwei: DivisionParams = {
    variante: 'zweistufig',
    monat: 'Juni',
    produkt: 'Senne Lemon 0,33 l',
    einheit: 'Kartons',
    produziert: 12_000,
    lagerAnfang: 1_500,
    lagerEnde: 3_500,
    abgesetzt: 10_000,
    herstellkosten: '96000',
    vvKosten: '15000',
  };

  it('GC-J2-2 zweistufig mit Lagerbeständen', () => {
    expect(werte(solveDivision(zwei))).toEqual({
      absatz: '10.000,00',
      khs: '8,00',
      vvs: '1,50',
      ks: '9,50',
      bv: '16.000,00',
    });
  });

  it('GC-J2-3 zweistufig, Gesamtkosten einschließlich Verwaltung und Vertrieb', () => {
    const p: DivisionParams = {
      variante: 'zweistufig',
      monat: 'Juni',
      produkt: 'Senne Lemon 0,33 l',
      einheit: 'Kartons',
      produziert: 12_000,
      abgesetzt: 10_000,
      gesamtkosten: '111000',
      vvKosten: '15000',
    };
    const w = werte(solveDivision(p));
    expect(w.hk).toBe('96.000,00');
    expect(w.ks).toBe('9,50');
    // typischer Fehler: VV nicht herausgerechnet
    expect(werte(solveDivision(p, { hkInklVv: true })).khs).toBe('9,25');
  });

  it('GC-J2-4 mehrstufig mit Zwischenlagern', () => {
    const p: DivisionParams = {
      variante: 'mehrstufig',
      monat: 'Juli',
      produkt: 'Senne Lemon',
      einheit: 'hl',
      stufen: [
        { name: 'Sirupansatz', kosten: '36000', menge: 4_000 },
        { name: 'Ausmischen', kosten: '22800', menge: 3_800 },
        { name: 'Abfüllung', kosten: '15400', menge: 4_400 },
      ],
      vvKosten: '12600',
      abgesetzt: 4_200,
    };
    expect(werte(solveDivision(p))).toEqual({
      'kh-0': '9,00',
      'kh-1': '15,00',
      'kh-2': '18,50',
      vvs: '3,00',
      ks: '21,50',
      'bv-0': '1.800,00',
      'bv-1': '−9.000,00',
      'bv-2': '3.700,00',
      bv: '−3.500,00',
    });
    // Probe: Selbstkosten des Absatzes + Bestandsveränderungen = alle Kosten der Periode
    expect(21.5 * 4_200 - 3_500).toBe(36_000 + 22_800 + 15_400 + 12_600);
    expect(werte(solveDivision(p, { nichtKumuliert: true }))['kh-1']).toBe('6,00');
  });
});

describe('Golden Cases J5 Maschinenstundensatz', () => {
  const satz: MaschinenParams = {
    variante: 'stundensatz',
    anlage: 'neue Dosenabfüllanlage der Linie 3',
    wbw: '960000',
    nd: 8,
    zinssatz: '0.08',
    flaeche: 80,
    raumSatz: '15',
    raumJe: 'monat',
    energie: {
      art: 'leistung',
      kw: 60,
      leistungsgrad: '0.75',
      grundpreis: '12',
      arbeitspreis: '0.2',
    },
    instand: { art: 'faktor', faktor: '0.4' },
    laufzeit: 2_000,
  };

  it('GC-J5-1 Maschinenstundensatz', () => {
    expect(werte(solveMaschinensatz(satz))).toEqual({
      afa: '120.000,00',
      zinsen: '38.400,00',
      raum: '14.400,00',
      'energie-fix': '8.640,00',
      'energie-var': '18.000,00',
      instand: '48.000,00',
      summe: '247.440,00',
      mss: '123,72',
    });
  });

  it('GC-J5-1 typische Fehler', () => {
    expect(werte(solveMaschinensatz(satz, { zinsenVoll: true })).zinsen).toBe('76.800,00');
    expect(werte(solveMaschinensatz(satz, { monatVergessen: true })).raum).toBe('1.200,00');
    expect(werte(solveMaschinensatz(satz, { faktorNichtVerteilt: true })).instand).toBe(
      '384.000,00',
    );
    expect(werte(solveMaschinensatz(satz, { leistungsgradVergessen: true }))['energie-var']).toBe(
      '24.000,00',
    );
  });

  it('GC-J5-2 Maschinensatzkalkulation', () => {
    const p: MaschinenParams = {
      variante: 'kalkulation',
      anlage: 'neue Dosenabfüllanlage der Linie 3',
      auftrag: '1.200 Kartons Senne Lemon 0,33 l',
      fm: '4000',
      mgk: '0.1',
      fl: '1200',
      restFgk: '0.8',
      mss: '123.72',
      stunden: '6.5',
      vwgk: '0.1',
      vtgk: '0.05',
    };
    expect(werte(solveMaschinensatz(p))).toEqual({
      mgk: '400,00',
      mk: '4.400,00',
      masch: '804,18',
      rest: '960,00',
      fk: '2.964,18',
      hk: '7.364,18',
      vwgk: '736,42',
      vtgk: '368,21',
      sk: '8.468,81',
    });
    expect(werte(solveMaschinensatz(p, { restFgkFalscheBasis: true })).rest).toBe('1.603,34');
  });
});

describe('Golden Cases J6 Kuppelkalkulation', () => {
  it('GC-J6-1 Verteilungsmethode (Marktpreise als Äquivalenzziffern)', () => {
    const p: KuppelParams = {
      variante: 'verteilung',
      monat: 'Mai',
      gesamtkosten: '189200',
      produkte: [
        { name: 'Zitronensaft', einheit: 'hl', menge: 1_000, preis: '150', einzelkosten: '20000' },
        { name: 'Zitronenöl', einheit: 'kg', menge: 400, preis: '50', einzelkosten: '3200' },
        { name: 'Fruchtfasern', einheit: 't', menge: 60, preis: '500', einzelkosten: '6000' },
      ],
    };
    const s = solveKuppel(p);
    expect(f(s.kuppelkosten!)).toBe('160.000,00');
    expect(f(s.summeErloese!)).toBe('200.000,00');
    expect(f(s.kostenJeEuro!)).toBe('0,80');
    expect(s.stueckKuppel!.map(f)).toEqual(['120,00', '40,00', '400,00']);
    expect(s.stueckEinzel!.map(f)).toEqual(['20,00', '8,00', '100,00']);
    expect(s.stueckSelbst!.map(f)).toEqual(['140,00', '48,00', '500,00']);
    expect(s.selbstSorte!.map(f)).toEqual(['140.000,00', '19.200,00', '30.000,00']);
    expect(f(solveKuppel(p, { einzelkostenNichtAbgezogen: true }).kostenJeEuro!)).toBe('0,95');
  });

  it('GC-J6-2 Restwertmethode', () => {
    const p: KuppelParams = {
      variante: 'restwert',
      monat: 'Juni',
      gesamtkosten: '412000',
      produkte: [
        { name: 'Almeblick Tequila-Bier', einheit: 'hl', menge: 8_000 },
        { name: 'Biertreber', einheit: 't', menge: 1_200, preis: '40', wvk: '15' },
        { name: 'Überschusshefe', einheit: 'kg', menge: 2_500, preis: '6', wvk: '2' },
      ],
    };
    const s = solveKuppel(p);
    expect(s.nettoerloese!.map(f)).toEqual(['30.000,00', '10.000,00']);
    expect(f(s.restkosten!)).toBe('372.000,00');
    expect(f(s.hkHaupt!)).toBe('46,50');
    expect(f(solveKuppel(p, { wvkNichtAbgezogen: true }).hkHaupt!)).toBe('43,63');
  });
});

describe('Golden Case J7 Gesamt- und Umsatzkostenverfahren', () => {
  const p: GkvUkvParams = {
    variante: 'vergleich',
    monat: 'Mai',
    produkte: [
      {
        name: 'Paderquell Energy',
        produziert: 20_000,
        abgesetzt: 18_000,
        preis: '14',
        material: '120000',
        fertigung: '60000',
        vv: '30000',
      },
      {
        name: 'Senne Lemon',
        produziert: 10_000,
        abgesetzt: 11_000,
        preis: '12',
        material: '50000',
        fertigung: '30000',
        vv: '16000',
      },
    ],
  };

  it('GC-J7 beide Verfahren liefern 88.000 €', () => {
    const s = solveGkvUkv(p);
    expect(s.kh.map(f)).toEqual(['9,00', '8,00']);
    expect(s.dx).toEqual([2_000, -1_000]);
    expect(s.bv.map(f)).toEqual(['18.000,00', '−8.000,00']);
    expect(f(s.umsatzSumme)).toBe('384.000,00');
    expect(f(s.gesamtleistung)).toBe('394.000,00');
    expect(f(s.kosten)).toBe('306.000,00');
    expect(f(s.beGkv)).toBe('88.000,00');
    expect(s.skUmsatz.map(f)).toEqual(['192.000,00', '104.000,00']);
    expect(s.erfolg.map(f)).toEqual(['60.000,00', '28.000,00']);
    expect(f(s.beUkv)).toBe('88.000,00');
  });

  it('GC-J7 typische Fehler', () => {
    expect(f(solveGkvUkv(p, { bvVorzeichen: true }).beGkv)).toBe('104.000,00');
    expect(f(solveGkvUkv(p, { ohneBv: true }).beGkv)).toBe('78.000,00');
    expect(f(solveGkvUkv(p, { ukvProduktion: true }).beUkv)).toBe('78.000,00');
  });
});

const ALLE: AnyGenerator[] = [division, maschinensatz, kuppel, gkvUkv];

describe('Prüfregeln Batch j (1.000 Seeds)', () => {
  const near = (a: Val, b: string | number | Val) => {
    const x = typeof b === 'object' ? b.exact : b;
    return a.exact.minus(x).abs().lte('0.000001');
  };

  it('J2: Selbstkosten des Absatzes + Bestandsveränderungen = alle Kosten (exakter Pfad)', () => {
    forSeeds(division, 1000, (p, s) => {
      if (p.variante === 'einstufig') return;
      const ks = s.werte.get('ks');
      const bv = s.werte.get('bv');
      const A = s.werte.has('absatz') ? s.werte.get('absatz').exact.toNumber() : p.abgesetzt!;
      let kosten = Number(p.vvKosten);
      if (p.variante === 'zweistufig')
        kosten += Number(p.herstellkosten ?? Number(p.gesamtkosten) - Number(p.vvKosten));
      else kosten += p.stufen!.reduce((a, x) => a + Number(x.kosten), 0);
      // Exakte Stückwerte: Rundung nur im schrittweisen Pfad
      expect(ks.exact.times(A).plus(bv.exact).minus(kosten).abs().lte('0.01')).toBe(true);
    });
  });

  it('J5: Summe = Einzelposten, Stundensatz × Laufzeit = Summe', () => {
    forSeeds(maschinensatz, 1000, (p, s) => {
      if (p.variante !== 'stundensatz') return;
      const ids = ['afa', 'zinsen', 'raum', 'energie-fix', 'energie-var', 'energie', 'instand'];
      const summe = ids
        .filter((id) => s.werte.has(id))
        .reduce((a, id) => a.plus(s.werte.get(id).exact), s.werte.get('afa').exact.times(0));
      expect(summe.equals(s.werte.get('summe').exact)).toBe(true);
      expect(
        s.werte
          .get('mss')
          .exact.times(p.laufzeit!)
          .minus(summe)
          .abs()
          .lte(0.005 * p.laufzeit!),
      ).toBe(true);
    });
  });

  it('J6: verteilte Kosten = Gesamtkosten (exakter Pfad)', () => {
    forSeeds(kuppel, 1000, (p, s) => {
      if (p.variante === 'verteilung') {
        const summe = s.selbstSorte!.reduce((a, v) => a.plus(v), s.selbstSorte![0]!.times(0));
        expect(near(summe, p.gesamtkosten)).toBe(true);
      } else {
        const summe = s.nettoerloese!.reduce((a, v) => a.plus(v), s.restkosten!);
        expect(near(summe, p.gesamtkosten)).toBe(true);
        expect(s.hkHaupt!.isNegative()).toBe(false);
      }
    });
  });

  it('J7: Gesamt- und Umsatzkostenverfahren führen zum gleichen Ergebnis (exakter Pfad)', () => {
    forSeeds(gkvUkv, 1000, (_p, s) => {
      expect(near(s.beGkv, s.beUkv)).toBe(true);
    });
  });

  it.each(ALLE.map((g) => [g.skillId, g] as const))(
    '%s: klausurfreundliche Werte in den meisten Aufgaben',
    (_id, g) => {
      let glatt = 0;
      for (let seed = 1; seed <= 500; seed++) {
        const p = g.generate(createRng(seed), { krummAnteil: 0 });
        const alle = g.parts(p, g.solve(p)).flatMap((part) => felderVon(part));
        if (alle.every((x) => x.typ !== 'zahl' || isExact(x.soll.exact))) glatt++;
      }
      expect(glatt).toBeGreaterThan(500 * 0.7);
    },
  );

  it('Fehlervarianten weichen von der Lösung ab und werden als falsch erkannt', () => {
    for (const g of ALLE) {
      for (const variant of g.variants) {
        const p = g.generate(createRng(17), { variant, krummAnteil: 0 });
        const s = g.solve(p);
        for (const v of g.errorVariants(p)) {
          const r = g.check(p, s, antwortAusParts(v.parts));
          expect(r.korrekt, `${g.skillId} ${variant} ${v.fehlertyp}`).toBe(false);
          expect(r.fehlertypen).toContain(v.fehlertyp);
        }
      }
    }
  });
});
