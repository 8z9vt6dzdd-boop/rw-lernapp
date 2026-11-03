// Golden Cases und Eigenschaftstests Batch g (docs/m7/g.md). Eigene Zahlen, keine Lehrbrief-Beispiele.
import { describe, expect, it } from 'vitest';
import { FIRMA } from '../../../config';
import { formatNumber, type Val } from '../../money';
import { createRng } from '../../rng';
import type { Generator } from '../../task';
import { antwortAusParts } from '../../testing';
import { forSeeds } from '../../test-utils';
import {
  STUFEN,
  VORFAELLE_G1,
  g1Grundbegriffe,
  solveG1,
  vorfallG1,
  type G1Params,
} from './g1-grundbegriffe';
import {
  AK,
  AO,
  BF,
  GK,
  PF,
  SACHVERHALTE_G2,
  WEDER,
  ZK,
  g2Abgrenzung,
  sachverhaltG2,
  solveErgebnistabelle,
  type EtParams,
} from './g2-abgrenzung';
import { g4FixVariabel, solveG4 } from './g4-fix-variabel';
import { EGK, EK, SEK_F, SEK_V, UGK, kostenartG5, g5EinzelGemein } from './g5-einzel-gemein';

const f = (v: Val) => formatNumber(v);

describe('G1 Grundbegriffe', () => {
  it('GC-G1-1: Stufen der Lehrbrief-Fälle (Auszahlung/Ausgabe/Aufwand/Kosten)', () => {
    const erwartet: Record<string, string> = {
      'verbindlichkeit-bezahlt': 'JNNN',
      'barkauf-lager': 'JJNN',
      'zielkauf-verbraucht': 'NJJJ',
      'zielkauf-lager': 'NJNN',
      lagerverbrauch: 'NNJJ',
      gehalt: 'JJJJ',
      spende: 'JJJN',
      'steuer-vorjahr': 'JJJN',
      brandschaden: 'NNJN',
      unternehmerlohn: 'NNNJ',
      'kalk-zinsen-ek': 'NNNJ',
      tilgung: 'JNNN',
      'forderung-bezahlt': 'JNNN',
      zielverkauf: 'NJJJ',
      'produktion-lager': 'NNJJ',
      'miete-wohnung': 'JJJN',
      patent: 'NNNJ',
      'darlehen-aufnahme': 'JNNN',
    };
    for (const [id, code] of Object.entries(erwartet)) {
      expect(
        vorfallG1(id)
          .stufen.map((s) => (s ? 'J' : 'N'))
          .join(''),
        id,
      ).toBe(code);
    }
  });

  it('Logik der Stufen: Kosten ohne Aufwand nur kalkulatorisch, Aufwand ohne Kosten nur neutral', () => {
    for (const v of VORFAELLE_G1) {
      expect(STUFEN[v.seite]).toHaveLength(4);
      // Typische Fehler kehren genau eine Stufe um
      for (const fe of v.fehler) expect(fe.stufe).toBeGreaterThanOrEqual(0);
    }
  });

  it('GC-G1-2: Summen eines Januars', () => {
    const p: G1Params = {
      variante: 'betraege',
      vorfaelle: [
        { id: 'zielkauf-teilverbrauch', betrag: '20000', verbrauch: '12000' },
        { id: 'verbindlichkeit-bezahlt', betrag: '8000' },
        { id: 'spende', betrag: '1500' },
        { id: 'unternehmerlohn', betrag: '9000' },
      ],
    };
    expect(solveG1(p).summen.map(f)).toEqual(['9.500,00', '21.500,00', '13.500,00', '21.000,00']);
    // Denkfehler: Zieleinkauf vollständig als Aufwand
    expect(
      solveG1(p, { index: 0, fehlertyp: 'ausgabe-aufwand-verwechselt' }).summen.map(f),
    ).toEqual(['9.500,00', '21.500,00', '21.500,00', '29.000,00']);
  });

  it('jede Variante: Musterlösung richtig, Texte vollständig', () => {
    for (const variant of g1Grundbegriffe.variants) {
      forSeeds(
        g1Grundbegriffe,
        200,
        (p, s) => {
          expect(
            g1Grundbegriffe.check(p, s, antwortAusParts(g1Grundbegriffe.parts(p, s))).korrekt,
          ).toBe(true);
          expect(g1Grundbegriffe.render(p, FIRMA).sachverhalt.join(' ')).not.toMatch(/undefined/);
        },
        { variant },
      );
    }
  });

  it('Betragsvariante: jede Summe ist belegt', () => {
    forSeeds(
      g1Grundbegriffe,
      300,
      (_p, s) => {
        for (const x of s.summen) expect(x.exact.isZero()).toBe(false);
      },
      { variant: 'betraege' },
    );
  });
});

describe('G2 Abgrenzung', () => {
  it('GC-G2-1: Zuordnung der Sachverhalte', () => {
    const erwartet: Record<string, string> = {
      spende: BF,
      kursverlust: BF,
      'reparatur-wohnhaus': BF,
      'steuer-vorjahr': PF,
      'strom-nachberechnung': PF,
      brandschaden: AO,
      sturmschaden: AO,
      gehaelter: GK,
      versicherung: GK,
      zuckerverbrauch: GK,
      'kfz-steuer': GK,
      'wartung-fremd': GK,
      'kalk-afa': AK,
      tagespreis: AK,
      unternehmerlohn: ZK,
      'ek-zinsen': ZK,
      'kalk-miete': ZK,
      tilgung: WEDER,
      privatentnahme: WEDER,
      'etiketten-lager': WEDER,
    };
    expect(SACHVERHALTE_G2.map((s) => s.id).sort()).toEqual(Object.keys(erwartet).sort());
    for (const [id, k] of Object.entries(erwartet)) expect(sachverhaltG2(id).kategorie, id).toBe(k);
    // Kein typischer Fehler nennt die richtige Kategorie
    for (const s of SACHVERHALTE_G2)
      for (const fe of s.fehler) expect(fe.kategorie).not.toBe(s.kategorie);
  });

  const GC: EtParams = {
    umsatz: '900000',
    zinsertraege: '6000',
    mietertraege: '4000',
    rohstoffe: '310000',
    loehne: '180000',
    gehaelter: '95000',
    afaFb: '72000',
    afaKalk: '64000',
    zinsFb: '9000',
    zinsKalk: '15000',
    steuern: '21000',
    steuerNachzahlung: '5000',
    spende: '3000',
    unternehmerlohn: '12000',
  };

  it('GC-G2-2: Ergebnistabelle', () => {
    const s = solveErgebnistabelle(GC);
    expect(f(s.summen.aufwand)).toBe('690.000,00');
    expect(f(s.summen.ertrag)).toBe('910.000,00');
    expect(f(s.gesamtergebnis)).toBe('220.000,00');
    expect([s.summen.nA, s.summen.nE, s.ergebnisAbgrenzung].map(f)).toEqual([
      '8.000,00',
      '10.000,00',
      '2.000,00',
    ]);
    expect([s.summen.afb, s.summen.vk, s.ergebnisKorrekturen].map(f)).toEqual([
      '81.000,00',
      '91.000,00',
      '10.000,00',
    ]);
    expect(f(s.neutral)).toBe('12.000,00');
    expect([s.summen.k, s.summen.l, s.betriebsergebnis].map(f)).toEqual([
      '692.000,00',
      '900.000,00',
      '208.000,00',
    ]);
  });

  it('GC-G2-3: Abschreibung mit neutralem Anteil (nicht betrieblich genutztes Wohnhaus)', () => {
    const s = solveErgebnistabelle({ ...GC, afaNeutral: '2000' });
    const afa = s.zeilen.find((z) => z.id === 'afa')!;
    expect([afa.werte.nA!, afa.werte.afb!, afa.werte.vk!, afa.werte.k!].map(f)).toEqual([
      '2.000,00',
      '70.000,00',
      '64.000,00',
      '64.000,00',
    ]);
    expect(f(s.ergebnisAbgrenzung)).toBe('0,00');
    expect(f(s.ergebnisKorrekturen)).toBe('12.000,00');
    expect(f(s.betriebsergebnis)).toBe('208.000,00');
  });

  it('Abstimmung: Gesamtergebnis = neutrales Ergebnis + Betriebsergebnis (1.000 Seeds)', () => {
    forSeeds(
      g2Abgrenzung,
      1000,
      (_p, s) => {
        const t = s.tabelle!;
        expect(t.neutral.plus(t.betriebsergebnis).exact.equals(t.gesamtergebnis.exact)).toBe(true);
        // Summe der Spalten: Aufwand RK I = neutraler Aufwand + Aufwand lt. FB + Grundkosten
        const grund = t.summen.k.minus(t.summen.vk);
        expect(
          t.summen.nA.plus(t.summen.afb).plus(grund).exact.equals(t.summen.aufwand.exact),
        ).toBe(true);
        expect(t.summen.nE.plus(t.summen.l).exact.equals(t.summen.ertrag.exact)).toBe(true);
      },
      { variant: 'ergebnistabelle' },
    );
  });

  it('Fehler „Vorzeichen der Korrekturen“ verletzt die Abstimmung', () => {
    const s = solveErgebnistabelle(GC, { vorzeichen: true });
    expect(s.neutral.plus(s.betriebsergebnis).exact.equals(s.gesamtergebnis.exact)).toBe(false);
  });
});

describe('G4 Fixe und variable Kosten', () => {
  it('GC-G4-1: Kostenfunktion aus zwei Beschäftigungen', () => {
    const s = solveG4({
      variante: 'kostenfunktion',
      kf: '140000',
      kv: '40',
      x1: 4000,
      x2: 6000,
      x3: 5000,
    });
    expect([s.k1!, s.k2!, s.kv!, s.kf!, s.k3gesamt!, s.kf3!, s.k3!].map(f)).toEqual([
      '300.000,00',
      '380.000,00',
      '40,00',
      '140.000,00',
      '340.000,00',
      '28,00',
      '68,00',
    ]);
    // Typischer Fehler: Durchschnittskosten statt Differenzenquotient
    const d = solveG4(
      { variante: 'kostenfunktion', kf: '140000', kv: '40', x1: 4000, x2: 6000, x3: 5000 },
      'durchschnitt',
    );
    expect(f(d.kv!)).toBe('75,00');
  });

  it('GC-G4-2: Beschäftigungsgrad 100 % → 60 %', () => {
    const p = {
      variante: 'beschaeftigungsgrad' as const,
      grad: { a: 100, b: 60, c: 80, ka: '500000', kb: '380000' },
    };
    const s = solveG4(p);
    expect([s.varA!, s.kfGrad!, s.kc!].map(f)).toEqual(['300.000,00', '200.000,00', '440.000,00']);
    expect(f(solveG4(p, 'nicht-hochgerechnet').varA!)).toBe('120.000,00');
  });

  it('Stückkosten sinken mit steigender Menge (Fixkostendegression)', () => {
    forSeeds(
      g4FixVariabel,
      500,
      (p, s) => {
        const kGross = s.kf!.div(Math.max(p.x1!, p.x2!, p.x3!)).plus(s.kv!);
        const kKlein = s.kf!.div(Math.min(p.x1!, p.x2!, p.x3!)).plus(s.kv!);
        expect(kGross.cmp(kKlein)).toBeLessThan(0);
        expect(s.kv!.exact.equals(p.kv!)).toBe(true);
        expect(s.kf!.exact.equals(p.kf!)).toBe(true);
      },
      { variant: 'kostenfunktion' },
    );
  });
});

describe('G5 Einzel- und Gemeinkosten', () => {
  it('GC-G5-1: Zuordnung und Zusammenhang mit fix/variabel', () => {
    const erwartet: Record<string, [string, string?]> = {
      konzentrat: [EK, 'variabel'],
      braumalz: [EK, 'variabel'],
      akkordlohn: [EK, 'variabel'],
      leim: [UGK, 'variabel'],
      co2: [UGK, 'variabel'],
      folie: [UGK, 'variabel'],
      werkleitung: [EGK, 'fix'],
      miete: [EGK, 'fix'],
      versicherung: [EGK, 'fix'],
      'afa-anlage': [EGK, 'fix'],
      ruesten: [SEK_F],
      druckplatte: [SEK_F],
      ausgangsfracht: [SEK_V],
      geschenkkarton: [SEK_V],
    };
    for (const [id, [z, v]] of Object.entries(erwartet)) {
      expect(kostenartG5(id).zurechnung, id).toBe(z);
      expect(kostenartG5(id).verhalten, id).toBe(v);
    }
  });

  it('Lehrbrief-Zusammenhang: fixe Kosten sind Gemeinkosten, Einzelkosten sind variabel', () => {
    for (const id of [
      'konzentrat',
      'braumalz',
      'akkordlohn',
      'leim',
      'co2',
      'folie',
      'werkleitung',
      'miete',
      'versicherung',
      'afa-anlage',
    ]) {
      const k = kostenartG5(id);
      if (k.verhalten === 'fix') expect(k.zurechnung).toBe(EGK);
      if (k.zurechnung === EK) expect(k.verhalten).toBe('variabel');
    }
  });

  it('Zuordnungsaufgabe enthält Einzel-, unechte, echte Gemein- und Sondereinzelkosten', () => {
    forSeeds(
      g5EinzelGemein,
      200,
      (_p, s) => {
        expect(s.zurechnung).toContain(EK);
        expect(s.zurechnung).toContain(UGK);
        expect(s.zurechnung).toContain(EGK);
        expect(s.zurechnung.some((z) => z === SEK_F || z === SEK_V)).toBe(true);
      },
      { variant: 'zuordnung' },
    );
    expect(
      g5EinzelGemein.generate(createRng(3), { variant: 'zusammenhang' }).kostenarten,
    ).toHaveLength(4);
  });
});

describe('Fehlertypen Batch g', () => {
  it('jeder Fehlertyp der Fehlervarianten hat eine Erklärung', async () => {
    const { FEHLERTYPEN } = await import('../../fehlertypen');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gens: Generator<any, any>[] = [
      g1Grundbegriffe,
      g2Abgrenzung,
      g4FixVariabel,
      g5EinzelGemein,
    ];
    const typen = new Set<string>();
    for (const g of gens)
      for (const variant of g.variants)
        forSeeds(g, 100, (p) => g.errorVariants(p).forEach((v) => typen.add(v.fehlertyp)), {
          variant,
        });
    for (const t of typen) expect(FEHLERTYPEN[t], t).toBeDefined();
  });
});
