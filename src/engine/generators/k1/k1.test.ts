// Golden Cases GC-21 und GC-25 (docs/04-fachregeln.md) sowie eigene Golden Cases und
// Eigenschaftstests der Teilkosten-Generatoren K1–K4 (docs/m7/k1.md).
import { describe, expect, it } from 'vitest';
import { checkTask } from '../../check';
import { dec, formatNumber, sum, type Val } from '../../money';
import { antwortAusParts } from '../../testing';
import { forSeeds } from '../../test-utils';
import { breakEven, solveBreakEven, type BreakEvenParams } from './break-even';
import {
  betriebsergebnis,
  dbEinstufig,
  solveDbEinstufig,
  type DbEinstufigParams,
} from './db-einstufig';
import { dbMehrstufig, solveDbMehrstufig, type DbMehrstufigParams } from './db-mehrstufig';
import {
  gesamtkostenBei,
  kostenverlauf,
  solveKostenverlauf,
  type KostenverlaufParams,
} from './kostenverlauf';

const f = (v: Val) => formatNumber(v);
const SEEDS = 1000;

// ---------- Golden Cases aus 04-fachregeln.md ----------

const GC21: BreakEvenParams = {
  produkt: 'Senne Lemon Zero',
  einheit: 'Flaschen',
  sg: 'Flasche',
  variante: 'menge',
  zeitraum: 'Jahr',
  preis: '0.9',
  kv: '0.5',
  kf: '120000',
  kapazitaet: 0,
};

const GC25: DbMehrstufigParams = {
  variante: 'gesamt',
  gruppen: [
    { name: 'Softdrinks', fix: '90000' },
    { name: 'Bier', fix: '20000' },
  ],
  erzeugnisse: [
    {
      name: 'Paderquell Energy',
      gruppe: 0,
      umsatz: '600000',
      kvGesamt: '360000',
      erzeugnisfix: '80000',
    },
    { name: 'Senne Lemon', gruppe: 0, umsatz: '300000', kvGesamt: '180000', erzeugnisfix: '40000' },
    {
      name: 'Almeblick Tequila-Bier',
      gruppe: 1,
      umsatz: '200000',
      kvGesamt: '150000',
      erzeugnisfix: '60000',
    },
  ],
  unternehmensfix: '70000',
  reihenfolge: [0, 1, 2],
};

describe('Golden Cases Teilkostenrechnung', () => {
  it('GC-21 Break-even neue Sorte', () => {
    const s = solveBreakEven(GC21);
    expect(f(s.db)).toBe('0,40');
    expect(s.menge.exact.toString()).toBe('300000');
    expect(s.mengeExakt.exact.toString()).toBe('300000');
    expect(f(s.umsatz)).toBe('270.000,00');
    // Musterlösung wird als richtig erkannt
    const parts = breakEven.parts(GC21, s);
    expect(checkTask(parts, breakEven.errorVariants(GC21), antwortAusParts(parts)).korrekt).toBe(
      true,
    );
  });

  it('GC-21 typische Fehler: Fixkosten ÷ Preis', () => {
    const parts = breakEven.parts(GC21, solveBreakEven(GC21));
    const r = checkTask(parts, breakEven.errorVariants(GC21), {
      bep: { typ: 'felder', werte: { db: '0,40', menge: '133.334', umsatz: '270.000' } },
    });
    expect(r.korrekt).toBe(false);
    expect(r.fehlertypen).toContain('preis-statt-db');
  });

  it('GC-25 Mehrstufige Deckungsbeitragsrechnung', () => {
    const s = solveDbMehrstufig(GC25);
    expect(s.db1.map(f)).toEqual(['240.000,00', '120.000,00', '50.000,00']);
    expect(s.db2.map(f)).toEqual(['160.000,00', '80.000,00', '−10.000,00']);
    expect(s.gruppeDb2.map(f)).toEqual(['240.000,00', '−10.000,00']);
    expect(s.db3.map(f)).toEqual(['150.000,00', '−30.000,00']);
    expect(f(s.summeDb3)).toBe('120.000,00');
    expect(f(s.be)).toBe('50.000,00');
    // Folgerung: Tequila-Bier einstellen, Verbesserung 30.000 € (erzeugnis- und gruppenfix abbaubar)
    expect(GC25.erzeugnisse[s.sorgenkind]!.name).toBe('Almeblick Tequila-Bier');
    expect(s.allein).toBe(true);
    expect(f(s.verbesserung)).toBe('30.000,00');
    const parts = dbMehrstufig.parts(GC25, s);
    expect(checkTask(parts, dbMehrstufig.errorVariants(GC25), antwortAusParts(parts)).korrekt).toBe(
      true,
    );
  });

  it('GC-25 typische Fehler: gruppenfixe Kosten je Erzeugnis, Entscheidung nach DB I', () => {
    const s = solveDbMehrstufig(GC25);
    const parts = dbMehrstufig.parts(GC25, s);
    const antwort = antwortAusParts(parts);
    // Gruppenfixe Kosten der Softdrinks bei Senne Lemon abgezogen: DB II −10.000 statt 80.000
    antwort.erzeugnisse = {
      typ: 'felder',
      werte: {
        'db1-0': '240.000',
        'db1-1': '120.000',
        'db1-2': '50.000',
        'db2-0': '70.000',
        'db2-1': '−10.000',
        'db2-2': '−30.000',
      },
    };
    antwort.entscheidung = { typ: 'wahl', optionId: 'keins' };
    const r = checkTask(parts, dbMehrstufig.errorVariants(GC25), antwort);
    expect(r.fehlertypen).toContain('gruppenfix-einzeln-zugerechnet');
    expect(r.fehlertypen).toContain('einstellung-nach-db-i');
  });
});

// ---------- Eigene Golden Cases (docs/m7/k1.md) ----------

const K1A: KostenverlaufParams = {
  produkt: 'Senne Lemon 0,33 l',
  einheit: 'Flaschen',
  sg: 'Flasche',
  variante: 'beschaeftigung',
  kf: '90000',
  kv: '0.3',
  kapazitaet: 500_000,
  grade: ['0.3', '0.6', '0.9'],
  istMenge: 400_000,
  monate: ['Oktober', 'November'],
  mengen: [200_000, 300_000],
  planMenge: 450_000,
};

describe('Eigene Golden Cases K1–K4', () => {
  it('GC-K1a Kostenverlauf und Fixkostendegression', () => {
    const s = solveKostenverlauf(K1A);
    expect(f(s.grad)).toBe('80,00');
    expect(s.zeilen.map((z) => z.menge)).toEqual([150_000, 300_000, 450_000]);
    expect(s.zeilen.map((z) => f(z.gesamt))).toEqual(['135.000,00', '180.000,00', '225.000,00']);
    expect(s.zeilen.map((z) => f(z.fixJeStueck))).toEqual(['0,60', '0,30', '0,20']);
    expect(s.zeilen.map((z) => f(z.stueck))).toEqual(['0,90', '0,60', '0,50']);
  });

  it('GC-K1b Kostenauflösung (Differenzen-Quotienten-Verfahren)', () => {
    const s = solveKostenverlauf({ ...K1A, variante: 'aufloesung' });
    expect(s.kosten.map(f)).toEqual(['150.000,00', '180.000,00']);
    expect(f(s.dK)).toBe('30.000,00');
    expect(s.dx.exact.toString()).toBe('100000');
    expect(f(s.kv)).toBe('0,30');
    expect(f(s.kf)).toBe('90.000,00');
    expect(f(s.planGesamt)).toBe('225.000,00');
    expect(f(s.planStueck)).toBe('0,50');
    // typischer Fehler: Gesamtkosten ÷ Menge als variable Kosten
    expect(
      f(solveKostenverlauf({ ...K1A, variante: 'aufloesung' }, { durchschnitt: true }).kv),
    ).toBe('0,60');
  });

  const K2A: DbEinstufigParams = {
    variante: 'ein-produkt',
    monat: 'Juli',
    produkte: [
      {
        name: 'Senne Lemon 0,33 l',
        einheit: 'Flaschen',
        sg: 'Flasche',
        preis: '0.7',
        kv: '0.3',
        menge: 450_000,
      },
    ],
    kf: '90000',
  };

  it('GC-K2a Deckungsbeitrag und Betriebsergebnis (Gewinn und Verlust)', () => {
    const s = solveDbEinstufig(K2A);
    expect(f(s.db[0]!)).toBe('0,40');
    expect(f(s.dbGesamt[0]!)).toBe('180.000,00');
    expect(f(s.be)).toBe('90.000,00');
    const feb = { ...K2A, produkte: [{ ...K2A.produkte[0]!, menge: 150_000 }] };
    expect(f(solveDbEinstufig(feb).be)).toBe('−30.000,00');
    // typischer Fehler: Fixkosten je Stück (90.000 ÷ 450.000 = 0,20) im db
    expect(f(solveDbEinstufig(K2A, { fixJeStueck: true }).db[0]!)).toBe('0,20');
  });

  it('GC-K2b Rückrechnung der variablen Kosten aus dem Betriebsergebnis', () => {
    const p: DbEinstufigParams = {
      ...K2A,
      variante: 'rueckwaerts',
      produkte: [{ ...K2A.produkte[0]!, menge: 150_000 }],
    };
    expect(f(betriebsergebnis(p))).toBe('−30.000,00');
    const s = solveDbEinstufig(p);
    expect(f(s.dbGesamt[0]!)).toBe('60.000,00');
    expect(f(s.db[0]!)).toBe('0,40');
    expect(f(s.kv)).toBe('0,30');
  });

  it('GC-K3a Beschäftigungsgrad an der Gewinnschwelle', () => {
    expect(f(solveBreakEven({ ...GC21, kapazitaet: 1_000_000 }).grad)).toBe('30,00');
  });

  it('GC-K3b nicht ganzzahlige Gewinnschwelle wird aufgerundet', () => {
    const p: BreakEvenParams = { ...GC21, preis: '0.8', kv: '0.5', kf: '100000' };
    const s = solveBreakEven(p);
    expect(s.menge.exact.toString()).toBe('333334');
    expect(f(s.umsatz)).toBe('266.667,20');
    // Lösungsweg über den exakten Bruch (100.000 × 0,80 ÷ 0,30) gilt ebenfalls
    const parts = breakEven.parts(p, s);
    const r = checkTask(parts, breakEven.errorVariants(p), {
      bep: { typ: 'felder', werte: { db: '0,30', menge: '333.334', umsatz: '266.666,67' } },
    });
    expect(r.korrekt).toBe(true);
    const ab = checkTask(parts, breakEven.errorVariants(p), {
      bep: { typ: 'felder', werte: { db: '0,30', menge: '333.333', umsatz: '266.667,20' } },
    });
    expect(ab.fehlertypen).toContain('nicht-aufgerundet');
  });

  it('GC-K3c Preissenkung verschiebt die Gewinnschwelle', () => {
    const s = solveBreakEven({
      ...GC21,
      variante: 'aenderung',
      aenderung: { art: 'preis', betrag: '0.05' },
    });
    expect(f(s.dbNeu)).toBe('0,35');
    expect(s.mengeNeu.exact.toString()).toBe('342858');
    expect(s.differenz.exact.toString()).toBe('42858');
  });

  it('GC-K3d kritische Menge zweier Anlagen', () => {
    const s = solveBreakEven({
      ...GC21,
      variante: 'verfahren',
      kf: '0',
      zeitraum: 'Monat',
      anlagen: [
        { name: 'Anlage A', kf: '10000', kv: '0.12' },
        { name: 'Anlage B', kf: '25000', kv: '0.07' },
      ],
      planMenge: 400_000,
    });
    expect(s.kritisch.exact.toString()).toBe('300000');
    expect(f(s.kostenA)).toBe('58.000,00');
    expect(f(s.kostenB)).toBe('53.000,00');
    expect(s.guenstiger).toBe('Anlage B');
  });

  it('GC-K4 Erzeugnis teilt die Gruppe: nur erzeugnisfixe Kosten abbaubar', () => {
    // Wie GC-25, aber Senne Lemon mit DB II −20.000: Gruppe Softdrinks bleibt bestehen.
    const p: DbMehrstufigParams = {
      ...GC25,
      erzeugnisse: GC25.erzeugnisse.map((e, i) =>
        i === 1 ? { ...e, erzeugnisfix: '140000' } : i === 2 ? { ...e, erzeugnisfix: '30000' } : e,
      ),
    };
    const s = solveDbMehrstufig(p);
    expect(s.db2.map(f)).toEqual(['160.000,00', '−20.000,00', '20.000,00']);
    expect(s.sorgenkind).toBe(1);
    expect(s.allein).toBe(false);
    expect(f(s.verbesserung)).toBe('20.000,00');
  });
});

// ---------- Eigenschaftstests über viele Seeds ----------

describe('Eigenschaften K1–K4', () => {
  it('K1: Gesamtkosten = K_f + k_v · x, Stückkosten sinken mit steigender Beschäftigung', () => {
    forSeeds(
      kostenverlauf,
      SEEDS,
      (p, s) => {
        s.zeilen.forEach((z, i) => {
          expect(z.gesamt.exact.equals(gesamtkostenBei(p, z.menge).exact)).toBe(true);
          if (i > 0) expect(z.stueck.cmp(s.zeilen[i - 1]!.stueck)).toBeLessThan(0);
          // Stückkosten = variable Kosten je Stück + Fixkosten je Stück (Rundung ≤ 0,01)
          expect(z.stueck.value.minus(z.fixJeStueck.value).minus(p.kv).abs().lte('0.01')).toBe(
            true,
          );
        });
      },
      { variant: 'beschaeftigung' },
    );
  });

  it('K1: Kostenauflösung findet k_v und K_f exakt wieder', () => {
    forSeeds(
      kostenverlauf,
      SEEDS,
      (p, s) => {
        expect(s.kv.exact.equals(dec(p.kv))).toBe(true);
        expect(s.kf.exact.equals(dec(p.kf))).toBe(true);
      },
      { variant: 'aufloesung' },
    );
  });

  it('K2: Betriebsergebnis = Umsatz − variable Kosten − Fixkosten', () => {
    for (const variant of dbEinstufig.variants) {
      forSeeds(
        dbEinstufig,
        SEEDS,
        (p, s) => {
          const umsatz = sum(p.produkte.map((x) => dec(x.preis).times(x.menge)));
          const kv = sum(p.produkte.map((x) => dec(x.kv).times(x.menge)));
          expect(s.be.exact.equals(umsatz.minus(kv).minus(p.kf).exact)).toBe(true);
          expect(s.db.every((d) => d.exact.gt(0))).toBe(true);
        },
        { variant },
      );
    }
  });

  it('K3: an der Gewinnschwelle kein Verlust, eine Einheit weniger noch Verlust', () => {
    for (const variant of ['menge', 'aenderung']) {
      forSeeds(
        breakEven,
        SEEDS,
        (p, s) => {
          const ergebnis = (x: Val) => s.db.times(x).minus(p.kf).exact;
          expect(ergebnis(s.menge).gte(0)).toBe(true);
          expect(ergebnis(s.menge.minus(1)).lt(0)).toBe(true);
          expect(s.umsatz.exact.equals(s.menge.times(p.preis).exact)).toBe(true);
        },
        { variant },
      );
    }
  });

  it('K3: an der kritischen Menge kosten beide Anlagen gleich viel', () => {
    forSeeds(
      breakEven,
      SEEDS,
      (p, s) => {
        const [a, b] = p.anlagen!;
        const k = (x: { kf: string; kv: string }) =>
          dec(x.kf).plus(dec(x.kv).times(s.kritisch.exact));
        expect(k(a).equals(k(b))).toBe(true);
        const billiger = s.kostenA.cmp(s.kostenB) < 0 ? a.name : b.name;
        expect(s.guenstiger).toBe(billiger);
      },
      { variant: 'verfahren' },
    );
  });

  it('K4: Betriebsergebnis = Erlöse − alle Kosten; Einstellung verbessert genau um den Betrag', () => {
    for (const variant of dbMehrstufig.variants) {
      forSeeds(
        dbMehrstufig,
        SEEDS,
        (p, s) => {
          const fix = sum([
            ...p.erzeugnisse.map((e) => e.erzeugnisfix),
            ...p.gruppen.map((g) => g.fix),
            p.unternehmensfix,
          ]);
          const direkt = sum(s.umsatz).minus(sum(s.kvGesamt)).minus(fix);
          expect(s.be.exact.equals(direkt.exact)).toBe(true);
          // Ergebnis ohne das Sorgenkind (mit seiner Gruppe, falls es allein war)
          const rest = p.erzeugnisse.filter((_e, i) => i !== s.sorgenkind);
          const ohne: DbMehrstufigParams = {
            ...p,
            erzeugnisse: rest,
            gruppen: p.gruppen.map((g, j) =>
              rest.some((e) => e.gruppe === j) ? g : { ...g, fix: '0' },
            ),
          };
          const beOhne = solveDbMehrstufig(ohne).be;
          expect(beOhne.minus(s.be).exact.equals(s.verbesserung.exact)).toBe(true);
          expect(s.verbesserung.exact.gt(0)).toBe(true);
        },
        { variant },
      );
    }
  });
});
