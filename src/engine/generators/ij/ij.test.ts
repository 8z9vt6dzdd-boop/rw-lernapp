// Golden Cases und Eigenschaftstests Batch ij (I2 BAB, I3 Anbauverfahren, I6 Zuschlagssätze).
// Golden Cases mit eigenen Zahlen, dokumentiert in docs/m7/ij.md.
import { describe, expect, it } from 'vitest';
import { FIRMA } from '../../../config';
import { checkTask, felderVon } from '../../check';
import { Val, sum } from '../../money';
import { createRng } from '../../rng';
import { antwortAusParts } from '../../testing';
import { forSeeds } from '../../test-utils';
import type { TaskAnswer, TaskPart } from '../../task';
import { anbau, solveAnbau, type AnbauParams } from './anbau';
import { babVerteilung, solveBab, verteile, type BabParams } from './bab';
import { solveZs, zuschlagssaetze, type ZsParams } from './zuschlagssaetze';

const K = FIRMA.kostenstellen;
const f2 = (v: Val) => v.value.toFixed(2);
const stepped2 = (v: Val) => v.stepped.toDecimalPlaces(2).toFixed(2);

function werteMit(
  parts: TaskPart[],
  partId: string,
  ueberschreiben: Record<string, string>,
): TaskAnswer {
  const a = antwortAusParts(parts);
  const p = a[partId];
  if (p?.typ === 'felder') Object.assign(p.werte, ueberschreiben);
  return a;
}

// ---------- I2 ----------

/** GC-IJ-01: einstufiger BAB mit vier Endkostenstellen, alles glatt */
const GC_IJ_01: BabParams = {
  variante: 'endkostenstellen',
  monat: 'März',
  stellen: [K.material, K.fertigung1, K.verwaltung, K.vertrieb],
  vorkostenstellen: 0,
  zeilen: [
    {
      kostenart: 'Hilfslöhne',
      betrag: '18000',
      verteilung: {
        art: 'direkt',
        grundlage: 'Lohnlisten',
        werte: ['2000', '12500', '1000', '2500'],
      },
    },
    {
      kostenart: 'Raumkosten',
      betrag: '24000',
      verteilung: {
        art: 'schluessel',
        grundlage: 'Fläche in m²',
        schluessel: ['400', '1200', '300', '500'],
      },
    },
    {
      kostenart: 'Energiekosten',
      betrag: '15000',
      verteilung: {
        art: 'schluessel',
        grundlage: 'Schlüsselzahlen',
        schluessel: ['1', '6', '1', '2'],
      },
    },
    {
      kostenart: 'Kalkulatorische Abschreibungen',
      betrag: '36000',
      verteilung: {
        art: 'schluessel',
        grundlage: 'Anlagenwerte in €',
        schluessel: ['60000', '300000', '40000', '50000'],
      },
    },
  ],
};

describe('I2 – BAB: Verteilung primärer Gemeinkosten', () => {
  it('GC-IJ-01: Anteile, Schlüsselsummen und Summenzeile', () => {
    const s = solveBab(GC_IJ_01);
    expect(s.schluesselSumme.map((x) => x?.toString() ?? null)).toEqual([
      null,
      '2400',
      '10',
      '450000',
    ]);
    expect(s.anteile[1]!.map(f2)).toEqual(['4000.00', '12000.00', '3000.00', '5000.00']);
    expect(s.anteile[2]!.map(f2)).toEqual(['1500.00', '9000.00', '1500.00', '3000.00']);
    expect(s.anteile[3]!.map(f2)).toEqual(['4800.00', '24000.00', '3200.00', '4000.00']);
    expect(s.summen.map(f2)).toEqual(['12300.00', '57500.00', '8700.00', '14500.00']);
    expect(f2(s.gesamt)).toBe('93000.00');
    expect(f2(sum(s.summen))).toBe('93000.00');
  });

  it('GC-IJ-02: Rundungsausgleich in der Stelle mit dem größten Schlüssel', () => {
    // 10.000 € im Verhältnis 1 : 1 : 1 : 3 → 1.666,67 / 1.666,67 / 1.666,67 / 4.999,99
    const v = verteile('10000', ['1', '1', '1', '3']);
    expect(v.map(f2)).toEqual(['1666.67', '1666.67', '1666.67', '4999.99']);
    expect(f2(sum(v))).toBe('10000.00');
    // Einfach kaufmännisch gerundet (5.000,00) gilt ebenfalls als richtig (zweiter Pfad)
    expect(stepped2(v[3]!)).toBe('5000.00');
    const p: BabParams = {
      ...GC_IJ_01,
      zeilen: [
        {
          kostenart: 'Versicherungen',
          betrag: '10000',
          verteilung: {
            art: 'schluessel',
            grundlage: 'Schlüsselzahlen',
            schluessel: ['1', '1', '1', '3'],
          },
        },
        GC_IJ_01.zeilen[1]!,
      ],
    };
    const s = solveBab(p);
    const parts = babVerteilung.parts(p, s);
    const r = checkTask(
      parts,
      [],
      werteMit(parts, 'bab', { 'a-0-3': '5.000,00', 'summe-3': '10.000,00' }),
    );
    expect(r.korrekt).toBe(true);
    expect(r.rundungshinweis).toBe(true);
  });

  it('typischer Fehler: Schlüsselsumme ohne Vorkostenstellen wird erkannt', () => {
    const p = babVerteilung.generate(createRng(3), { variant: 'mit-vorkostenstellen' });
    const s = babVerteilung.solve(p);
    const falsch = babVerteilung
      .errorVariants(p)
      .find((v) => v.fehlertyp === 'schluessel-falsch-summiert')!;
    const r = babVerteilung.check(p, s, antwortAusParts(falsch.parts));
    expect(r.korrekt).toBe(false);
    expect(r.fehlertypen).toContain('schluessel-falsch-summiert');
  });

  it('Eigenschaft: jede Zeile verteilt genau ihren Betrag, Summe = alle primären Gemeinkosten', () => {
    for (const variant of babVerteilung.variants) {
      forSeeds(
        babVerteilung,
        500,
        (p, s) => {
          p.zeilen.forEach((z, i) => {
            expect(f2(sum(s.anteile[i]!))).toBe(Val.of(z.betrag).value.toFixed(2));
          });
          expect(sum(s.summen).exact.equals(s.gesamt.exact)).toBe(true);
          expect(p.stellen.length).toBeGreaterThanOrEqual(4);
          expect(p.stellen.length).toBeLessThanOrEqual(6);
          expect(p.zeilen.length).toBeGreaterThanOrEqual(4);
          expect(p.zeilen.length).toBeLessThanOrEqual(8);
        },
        { variant },
      );
    }
  });

  it('Eigenschaft: einfach gerundete Anteile (ohne Ausgleich) gelten ebenfalls als richtig', () => {
    forSeeds(babVerteilung, 300, (p, s) => {
      const parts = babVerteilung.parts(p, s);
      const tab = parts.find((x) => x.id === 'bab')!;
      const ueber: Record<string, string> = {};
      for (const f of felderVon(tab))
        if (f.typ === 'zahl') ueber[f.id] = stepped2(f.soll).replace('.', ',');
      expect(checkTask(parts, [], werteMit(parts, 'bab', ueber)).korrekt).toBe(true);
    });
  });
});

// ---------- I3 ----------

/** GC-IJ-03: Anbauverfahren mit glatten Sätzen */
const GC_IJ_03: AnbauParams = {
  hilfs: [
    { name: K.energie, primaer: '18000', einheit: 'kWh' },
    { name: K.instandhaltung, primaer: '12000', einheit: 'Std.' },
  ],
  haupt: [
    { name: K.material, primaer: '30000' },
    { name: K.fertigung1, primaer: '80000' },
    { name: K.verwaltung, primaer: '20000' },
    { name: K.vertrieb, primaer: '25000' },
  ],
  mengen: [
    [0, 1000, 2000, 5000, 1000, 1000],
    [20, 0, 80, 300, 40, 60],
  ],
};

describe('I3 – Anbauverfahren', () => {
  it('GC-IJ-03: Verrechnungssätze nur auf Leistungen an Hauptkostenstellen', () => {
    const s = solveAnbau(GC_IJ_03);
    expect(s.anHaupt).toEqual([9000, 480]);
    expect(s.saetze.map(f2)).toEqual(['2.00', '25.00']);
    expect(s.umlage[0]!.map(f2)).toEqual(['4000.00', '10000.00', '2000.00', '2000.00']);
    expect(s.umlage[1]!.map(f2)).toEqual(['2000.00', '7500.00', '1000.00', '1500.00']);
    expect(s.summen.map(f2)).toEqual(['36000.00', '97500.00', '23000.00', '28500.00']);
    expect(f2(sum(s.summen))).toBe('185000.00');
    expect(f2(s.primaerGesamt)).toBe('185000.00');
  });

  it('GC-IJ-03: typischer Fehler „durch Gesamtleistung geteilt“ ergibt 1,80 €/kWh und 24,00 €/Std.', () => {
    const s = solveAnbau(GC_IJ_03, { durchGesamtleistung: true });
    expect(s.saetze.map(f2)).toEqual(['1.80', '24.00']);
    const v = anbau.errorVariants(GC_IJ_03).find((x) => x.fehlertyp === 'anbau-gesamtleistung')!;
    const r = anbau.check(GC_IJ_03, solveAnbau(GC_IJ_03), antwortAusParts(v.parts));
    expect(r.fehlertypen).toContain('anbau-gesamtleistung');
  });

  it('GC-IJ-04: gerundeter Verrechnungssatz (Lehrbrief-Weg) gilt als richtig', () => {
    // 20.000 € ÷ 6.000 kWh = 3,333… → gerundet 3,33 €/kWh; 1.000 kWh × 3,33 = 3.330,00
    const p: AnbauParams = {
      hilfs: [
        { name: K.energie, primaer: '20000', einheit: 'kWh' },
        { name: K.instandhaltung, primaer: '9000', einheit: 'Std.' },
      ],
      haupt: [
        { name: K.material, primaer: '10000' },
        { name: K.fertigung1, primaer: '40000' },
      ],
      mengen: [
        [0, 500, 1000, 5000],
        [10, 0, 100, 200],
      ],
    };
    const s = solveAnbau(p);
    expect(f2(s.saetze[0]!)).toBe('3.33');
    expect(f2(s.umlage[0]![0]!)).toBe('3333.33');
    expect(stepped2(s.umlage[0]![0]!)).toBe('3330.00');
    expect(f2(sum(s.summen))).toBe('79000.00');
    const parts = anbau.parts(p, s);
    const r = checkTask(
      parts,
      [],
      werteMit(parts, 'bab', {
        'u0-0': '3.330,00',
        'u0-1': '16.650,00',
        'summe-0': '16.330,00',
        'summe-1': '62.650,00',
      }),
    );
    expect(r.korrekt).toBe(true);
    expect(r.rundungshinweis).toBe(true);
  });

  it('Eigenschaft: Summe der Hauptkostenstellen = primäre Gemeinkosten aller Stellen', () => {
    forSeeds(anbau, 1000, (p, s) => {
      expect(sum(s.summen).exact.minus(s.primaerGesamt.exact).abs().lte('0.000001')).toBe(true);
      // Rundungsdifferenz der gerundeten Einzelwerte ≤ 0,01 je Empfänger
      const gerundet = s.summen.reduce((a, v) => a.plus(v.value), sum([]).exact);
      expect(
        gerundet
          .minus(s.primaerGesamt.exact)
          .abs()
          .lte(0.01 * p.haupt.length * p.hilfs.length + 0.005),
      ).toBe(true);
      // Es gibt immer gegenseitige Lieferungen, die das Anbauverfahren ignoriert
      expect(p.mengen[0]![1]! > 0 && p.mengen[1]![0]! > 0).toBe(true);
    });
  });

  it('Eigenschaft: klausurfreundliche Fälle gehen auf den Cent auf', () => {
    let glatt = 0;
    forSeeds(anbau, 1000, (_p, s) => {
      if (
        f2(sum(s.summen)) === f2(s.primaerGesamt) &&
        s.saetze.every((q) => q.exact.equals(q.value))
      )
        glatt++;
    });
    expect(glatt).toBeGreaterThan(700);
  });
});

// ---------- I6 ----------

/** GC-IJ-05: Ist-Zuschlagssätze mit Bestandsveränderungen */
const GC_IJ_05: ZsParams = {
  variante: 'ist-saetze',
  monat: 'April',
  fm: '200000',
  fertigung: [{ name: K.fertigung1, fl: '120000' }],
  ist: { mgk: '24000', fgk: ['180000'], vwgk: '50000', vtgk: '25000' },
  bestand: [
    { art: 'mehr', erzeugnis: 'fertige', betrag: '30000' },
    { art: 'minder', erzeugnis: 'unfertige', betrag: '6000' },
  ],
};

/** GC-IJ-06: wie GC-IJ-05, dazu Normalzuschläge 10 % / 160 % / 9 % / 6 % */
const GC_IJ_06: ZsParams = {
  ...GC_IJ_05,
  variante: 'deckung',
  normal: { mgk: '0.1', fgk: ['1.6'], vwgk: '0.09', vtgk: '0.06' },
};

describe('I6 – Zuschlagssätze, Über- und Unterdeckung', () => {
  it('GC-IJ-05: Ist-Zuschlagssätze und Herstellkosten des Umsatzes', () => {
    const s = solveZs(GC_IJ_05);
    expect(f2(s.satz.mgk)).toBe('12.00');
    expect(f2(s.satz.fgk[0]!)).toBe('150.00');
    expect(f2(s.hkPeriode)).toBe('524000.00');
    expect(f2(s.hkUmsatz)).toBe('500000.00');
    expect(f2(s.satz.vwgk)).toBe('10.00');
    expect(f2(s.satz.vtgk)).toBe('5.00');
  });

  it('GC-IJ-05: Bestandsveränderung mit falschem Vorzeichen wird erkannt', () => {
    const falsch = solveZs(GC_IJ_05, { bestandVorzeichenFalsch: true });
    expect(f2(falsch.hkUmsatz)).toBe('548000.00');
    const v = zuschlagssaetze
      .errorVariants(GC_IJ_05)
      .find((x) => x.fehlertyp === 'bestandsveraenderung-vorzeichen')!;
    const r = zuschlagssaetze.check(GC_IJ_05, solveZs(GC_IJ_05), antwortAusParts(v.parts));
    expect(r.fehlertypen).toContain('bestandsveraenderung-vorzeichen');
  });

  it('GC-IJ-06: Normalgemeinkosten, Über- und Unterdeckung', () => {
    const s = solveZs(GC_IJ_06);
    const n = s.normal!;
    expect(f2(n.mgk)).toBe('20000.00');
    expect(f2(n.fgk[0]!)).toBe('192000.00');
    expect(f2(n.hkPeriode)).toBe('532000.00');
    expect(f2(n.hkUmsatz)).toBe('508000.00');
    expect(f2(n.vwgk)).toBe('45720.00');
    expect(f2(n.vtgk)).toBe('30480.00');
    expect(s.deckung!.map((d) => f2(d.differenz))).toEqual([
      '-4000.00',
      '12000.00',
      '-4280.00',
      '5480.00',
    ]);
    expect(f2(s.deckungGesamt!)).toBe('9200.00');
    const parts = zuschlagssaetze.parts(GC_IJ_06, s);
    const deckung = parts.find((x) => x.id === 'deckung')!;
    const art = Object.fromEntries(
      felderVon(deckung).flatMap((f) => (f.typ === 'auswahl' ? [[f.id, f.soll]] : [])),
    );
    expect(art).toEqual({
      'd-mgk-art': 'Unterdeckung',
      'd-fgk-0-art': 'Überdeckung',
      'd-vwgk-art': 'Unterdeckung',
      'd-vtgk-art': 'Überdeckung',
      'd-gesamt-art': 'Überdeckung',
    });
  });

  it('GC-IJ-06: vertauschte Über-/Unterdeckung und Ist-Basis werden erkannt', () => {
    const s = solveZs(GC_IJ_06);
    for (const typ of ['ueber-unterdeckung-vertauscht', 'normal-auf-ist-basis']) {
      const v = zuschlagssaetze.errorVariants(GC_IJ_06).find((x) => x.fehlertyp === typ)!;
      const r = zuschlagssaetze.check(GC_IJ_06, s, antwortAusParts(v.parts));
      expect(r.korrekt).toBe(false);
      expect(r.fehlertypen).toContain(typ);
    }
    // Ist-Basis: 500.000 × 9 % = 45.000 statt 45.720
    expect(f2(solveZs(GC_IJ_06, { normalAufIstBasis: true }).normal!.vwgk)).toBe('45000.00');
  });

  it('Eigenschaft: Gesamtdeckung = Summe der Stellen = Σ Normal − Σ Ist', () => {
    forSeeds(
      zuschlagssaetze,
      1000,
      (p, s) => {
        const d = s.deckung!;
        const normal = sum(d.map((x) => x.normal));
        const ist = sum(d.map((x) => x.ist));
        expect(s.deckungGesamt!.exact.equals(normal.minus(ist).exact)).toBe(true);
        expect(d.every((x) => !x.differenz.value.isZero())).toBe(true);
        expect(p.normal).toBeDefined();
      },
      { variant: 'deckung' },
    );
  });

  it('Eigenschaft: Ist-Zuschlagssätze reproduzieren die Istgemeinkosten', () => {
    forSeeds(
      zuschlagssaetze,
      1000,
      (p, s) => {
        // Satz × Basis ÷ 100 trifft die Gemeinkosten bis auf die Rundung des Satzes (± 0,005 %)
        const tol = (basis: Val) => basis.exact.times('0.00005').plus('0.01');
        const fm = new Val(p.fm);
        expect(s.satz.mgk.value.times(fm.exact).div(100).minus(p.ist.mgk).abs().lte(tol(fm))).toBe(
          true,
        );
        expect(
          s.satz.vwgk.value
            .times(s.hkUmsatz.exact)
            .div(100)
            .minus(p.ist.vwgk)
            .abs()
            .lte(tol(s.hkUmsatz)),
        ).toBe(true);
        expect(s.hkUmsatz.cmp(0)).toBeGreaterThan(0);
      },
      { variant: 'ist-saetze' },
    );
  });
});
