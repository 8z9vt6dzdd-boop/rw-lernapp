// Golden Cases GC-22 bis GC-24 (docs/04-fachregeln.md) und eigene Fälle für Batch k2 (docs/m7/k2.md).
import { describe, expect, it } from 'vitest';
import { FIRMA } from '../../../config';
import { formatNumber, type Val } from '../../money';
import { createRng } from '../../rng';
import { antwortAusParts } from '../../testing';
import { forSeeds } from '../../test-utils';
import type { TaskAnswer, WahlPart } from '../../task';
import { preisuntergrenze, solvePug, type PugParams } from './k5-preisuntergrenze';
import { engpass, solveEngpass, type EngpassParams } from './k6-engpass';
import { makeOrBuy, solveMob, type MobParams } from './k7-make-or-buy';
import { plankosten, solvePlan, type PlanParams } from './k9-plankosten';

const f = (v: Val) => formatNumber(v);

// ---------- K5 ----------

const GC22: PugParams = {
  variante: 'zusatzauftrag',
  produkt: 'Paderquell Energy 0,33 l',
  kv: '0.5',
  kf: '240000',
  kapazitaet: 1_200_000,
  menge: 800_000,
  preis: '0.95',
  zusatzMenge: 200_000,
  zusatzPreis: '0.55',
};

describe('K5 Preisuntergrenze', () => {
  it('GC-22 Zusatzauftrag Eigenmarke: PUG 0,50 €, annehmen, +10.000,00 €', () => {
    const s = solvePug(GC22);
    expect(f(s.kurzPug)).toBe('0,50');
    expect(f(s.dbJeStueck)).toBe('0,05');
    expect(f(s.ergebnis)).toBe('10.000,00');
    expect(s.entscheidung).toBe('annehmen-kv');
    expect(s.freieKapazitaet).toBe(400_000);
  });

  it('GC-22 Fehlweg Vollkosten: Selbstkosten 0,80 € als Untergrenze führen zur Ablehnung', () => {
    const s = solvePug(GC22, { vollkosten: true });
    expect(f(s.kurzPug)).toBe('0,80');
    expect(f(s.ergebnis)).toBe('−50.000,00');
    expect(s.entscheidung).toBe('ablehnen-vk');
    const parts = preisuntergrenze.parts(GC22, solvePug(GC22));
    const fehl = preisuntergrenze
      .errorVariants(GC22)
      .find((v) => v.fehlertyp === 'vollkosten-als-untergrenze')!;
    const r = preisuntergrenze.check(GC22, solvePug(GC22), antwortAusParts(fehl.parts));
    expect(r.korrekt).toBe(false);
    expect(r.fehlertypen).toContain('vollkosten-als-untergrenze');
    expect(parts.find((p) => p.id === 'entscheidung')).toBeDefined();
  });

  it('GC-K5a kurz- und langfristige Preisuntergrenze', () => {
    const s = solvePug({ ...GC22, variante: 'kurz-lang', zusatzPreis: '0.65' });
    expect(f(s.kurzPug)).toBe('0,50');
    expect(f(s.fixJeStueck)).toBe('0,30');
    expect(f(s.langPug)).toBe('0,80');
    expect(s.entscheidung).toBe('kurz');
    expect(solvePug({ ...GC22, variante: 'kurz-lang', zusatzPreis: '0.45' }).entscheidung).toBe(
      'unter-kv',
    );
    expect(solvePug({ ...GC22, variante: 'kurz-lang', zusatzPreis: '0.85' }).entscheidung).toBe(
      'lang',
    );
  });

  it('GC-K5b Zusatzauftrag mit Verdrängung: −16.000,00 €, ablehnen, PUG 0,68 €', () => {
    const p: PugParams = {
      ...GC22,
      variante: 'verdraengung',
      kapazitaet: 1_000_000,
      menge: 880_000,
      zusatzPreis: '0.6',
    };
    const s = solvePug(p);
    expect(s.freieKapazitaet).toBe(120_000);
    expect(s.verdraengt).toBe(80_000);
    expect(f(s.dbZusatz)).toBe('20.000,00');
    expect(f(s.entgangenerDb)).toBe('36.000,00');
    expect(f(s.ergebnis)).toBe('−16.000,00');
    expect(f(s.pugAuftrag)).toBe('0,68');
    expect(s.entscheidung).toBe('ablehnen-verdr');
    const ign = solvePug(p, { verdraengungIgnoriert: true });
    expect(f(ign.ergebnis)).toBe('20.000,00');
    expect(ign.entscheidung).toBe('annehmen-kv');
  });

  it('Eigenschaft: Preisuntergrenze des Auftrags ⇔ Ergebnisänderung (Preis darüber ⇒ Ergebnis steigt)', () => {
    forSeeds(
      preisuntergrenze,
      500,
      (p, s) => {
        if (p.variante === 'kurz-lang') return;
        const preisDarueber = s.pugAuftrag.exact.lt(p.zusatzPreis);
        expect(preisDarueber).toBe(!s.ergebnis.isNegative());
      },
      { variant: 'verdraengung' },
    );
  });
});

// ---------- K6 ----------

const GC23: EngpassParams = {
  variante: 'db-gegeben',
  kapazitaet: 10_000,
  produkte: [
    { name: FIRMA.produkte.bier, kurz: 'A', db: '0.3', zeit: '0.05', maxAbsatz: 80_000 },
    { name: FIRMA.produkte.lemon, kurz: 'B', db: '0.4', zeit: '0.08', maxAbsatz: 100_000 },
    { name: FIRMA.produkte.energy, kurz: 'C', db: '0.2', zeit: '0.025', maxAbsatz: 200_000 },
  ],
};

describe('K6 Engpass', () => {
  it('GC-23 Engpass Abfüllanlage: Rangfolge C, A, B; Gesamt-DB 69.000,00 €', () => {
    const s = solveEngpass(GC23);
    expect(s.relDb.map(f)).toEqual(['6,00', '5,00', '8,00']);
    expect(s.rang.map((i) => GC23.produkte[i]!.kurz)).toEqual(['C', 'A', 'B']);
    expect(s.menge).toEqual([80_000, 12_500, 200_000]);
    expect(s.beanspruchung.map((v) => formatNumber(v, 0))).toEqual(['4.000', '1.000', '5.000']);
    expect(f(s.summeDb)).toBe('69.000,00');
    expect(s.summeZeit.exact.toNumber()).toBe(10_000);
  });

  it('GC-23 typischer Fehler: Rangfolge nach absolutem Stück-DB (B zuerst) ergibt nur 52.000,00 €', () => {
    const fehl = solveEngpass(GC23, { nachAbsolutemDb: true });
    expect(fehl.rang.map((i) => GC23.produkte[i]!.kurz)).toEqual(['B', 'A', 'C']);
    expect(fehl.menge).toEqual([40_000, 100_000, 0]);
    expect(f(fehl.summeDb)).toBe('52.000,00');
    const s = solveEngpass(GC23);
    const v = engpass.errorVariants(GC23)[0]!;
    expect(v.fehlertyp).toBe('rangfolge-nach-absolutem-db');
    const r = engpass.check(GC23, s, antwortAusParts(v.parts));
    expect(r.korrekt).toBe(false);
    expect(r.fehlertypen).toContain('rangfolge-nach-absolutem-db');
    // Auch die Rangfolge-Frage allein erkennt den Fehler.
    const rang = engpass.parts(GC23, s).find((p) => p.id === 'rangfolge') as WahlPart;
    const falsch = rang.optionen.find((o) => o.text === 'B → A → C')!;
    expect(falsch.fehlertyp).toBe('rangfolge-nach-absolutem-db');
    const nurRang: TaskAnswer = {
      ...antwortAusParts(engpass.parts(GC23, s)),
      rangfolge: { typ: 'wahl', optionId: falsch.id },
    };
    expect(engpass.check(GC23, s, nurRang).fehlertypen).toEqual(['rangfolge-nach-absolutem-db']);
  });

  it('Eigenschaft: Kapazität wird genau ausgeschöpft, kein Absatzlimit überschritten, Optimum ≥ Fehlweg', () => {
    forSeeds(engpass, 1000, (p, s) => {
      expect(s.summeZeit.exact.toNumber()).toBe(p.kapazitaet);
      s.menge.forEach((m, i) => expect(m).toBeLessThanOrEqual(p.produkte[i]!.maxAbsatz));
      const fehl = solveEngpass(p, { nachAbsolutemDb: true });
      expect(fehl.summeZeit.exact.lte(p.kapazitaet)).toBe(true);
      expect(s.summeDb.exact.gt(fehl.summeDb.exact)).toBe(true);
    });
  });
});

// ---------- K7 ----------

const GC24: MobParams = {
  variante: 'kritische-menge',
  produkt: 'Paderquell Energy 0,33 l',
  fremdpreis: '0.12',
  bestandteile: [{ name: 'variable Kosten der eigenen Abfüllung', betrag: '0.08' }],
  zusatzFix: '30000',
  menge: 1_000_000,
};

describe('K7 Make-or-buy', () => {
  it('GC-24 Selbst abfüllen oder Lohnabfüller: kritische Menge 750.000 Dosen', () => {
    const s = solveMob(GC24);
    expect(f(s.differenz)).toBe('0,04');
    expect(s.kritischeMenge).toBe(750_000);
    expect(f(s.kostenEigen)).toBe('110.000,00');
    expect(f(s.kostenFremd)).toBe('120.000,00');
    expect(s.entscheidung).toBe('eigen-krit');
    // An der kritischen Menge sind beide Möglichkeiten gleich teuer, darunter ist der Lohnabfüller günstiger.
    const gleich = solveMob({ ...GC24, menge: 750_000 });
    expect(f(gleich.kostenEigen)).toBe(f(gleich.kostenFremd));
    expect(solveMob({ ...GC24, menge: 500_000 }).entscheidung).toBe('fremd-krit');
  });

  it('GC-24 Fehlweg: zusätzliche Fixkosten vergessen', () => {
    const p = { ...GC24, menge: 500_000 };
    const fehl = solveMob(p, { zusatzFixVergessen: true });
    expect(fehl.entscheidung).toBe('eigen-kv');
    const r = makeOrBuy.check(
      p,
      solveMob(p),
      antwortAusParts(makeOrBuy.errorVariants(p)[0]!.parts),
    );
    expect(r.fehlertypen).toContain('zusatzfixkosten-vergessen');
  });

  it('GC-K7 freie Kapazität: nur variable Kosten zählen', () => {
    const p: MobParams = {
      variante: 'freie-kapazitaet',
      produkt: 'Paderquell Energy 0,33 l',
      fremdpreis: '0.12',
      bestandteile: [
        { name: 'Dose und Verschluss', betrag: '0.05' },
        { name: 'Energie, Kohlensäure und Reinigung', betrag: '0.02' },
        { name: 'zusätzliche Schichtlöhne', betrag: '0.02' },
      ],
      fixUmlage: '0.05',
      menge: 500_000,
    };
    const s = solveMob(p);
    expect(f(s.kv)).toBe('0,09');
    expect(f(s.vollkosten)).toBe('0,14');
    expect(f(s.differenz)).toBe('0,03');
    expect(f(s.vorteilGesamt)).toBe('15.000,00');
    expect(s.entscheidung).toBe('eigen');
    const fehl = solveMob(p, { fixkostenEingerechnet: true });
    expect(f(fehl.differenz)).toBe('−0,02');
    expect(fehl.entscheidung).toBe('fremd-vk');
  });

  it('Eigenschaft: Entscheidung = kostengünstigere Möglichkeit', () => {
    forSeeds(makeOrBuy, 1000, (p, s) => {
      if (p.variante === 'kritische-menge') {
        const eigenGuenstiger = s.kostenEigen.exact.lt(s.kostenFremd.exact);
        expect(s.entscheidung === 'eigen-krit').toBe(eigenGuenstiger);
      } else {
        expect(s.entscheidung === 'eigen').toBe(!s.differenz.isNegative());
      }
    });
  });
});

// ---------- K9 ----------

const GC_K9: PlanParams = {
  variante: 'abweichungen',
  planB: 2_000,
  planKosten: '300000',
  planFix: '120000',
  istB: 1_800,
  istKosten: '290000',
};

describe('K9 Plankosten', () => {
  it('GC-K9 Abfüllung Juni: Soll 282.000, verrechnet 270.000, BA 12.000, VA 8.000', () => {
    const s = solvePlan(GC_K9);
    expect(f(s.satz)).toBe('150,00');
    expect(f(s.satzVar)).toBe('90,00');
    expect(f(s.sollkosten)).toBe('282.000,00');
    expect(f(s.verrechnet)).toBe('270.000,00');
    expect(f(s.ba)).toBe('12.000,00');
    expect(f(s.va!)).toBe('8.000,00');
    expect(f(s.ga!)).toBe('20.000,00');
    expect(s.deutung).toBe('mehr');
  });

  it('GC-K9 Fehlwege: Sollkosten proportional bzw. Verbrauchsabweichung gegen verrechnete Plankosten', () => {
    expect(f(solvePlan(GC_K9, { sollProportional: true }).sollkosten)).toBe('270.000,00');
    expect(f(solvePlan(GC_K9, { vaGegenVerrechnete: true }).va!)).toBe('20.000,00');
  });

  it('Eigenschaften: BA = fixe Plankosten × (1 − Beschäftigungsgrad); BA + VA = Gesamtabweichung', () => {
    forSeeds(plankosten, 1000, (p, s) => {
      const erwartet = s.beschGrad.exact.neg().plus(1).times(p.planFix);
      expect(s.ba.exact.minus(erwartet).abs().lte('0.01')).toBe(true);
      if (s.va && s.ga) expect(s.ba.plus(s.va).exact.equals(s.ga.exact)).toBe(true);
    });
  });
});

describe('Batch k2 allgemein', () => {
  it('jede Variante erzeugt vollständige Texte ohne Platzhalter', () => {
    for (const g of [preisuntergrenze, engpass, makeOrBuy, plankosten]) {
      for (const variant of g.variants) {
        for (let seed = 1; seed <= 50; seed++) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const gg = g as any;
          const p = gg.generate(createRng(seed), { variant });
          const t = gg.render(p, FIRMA);
          expect(JSON.stringify(t)).not.toMatch(/undefined|NaN|null/);
        }
      }
    }
  });
});
