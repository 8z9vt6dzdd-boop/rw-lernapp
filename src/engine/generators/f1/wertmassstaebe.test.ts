// F3 – Golden Cases (eigene Zahlen, docs/m7/f1.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { formatNumber, type Val } from '../../money';
import { createRng } from '../../rng';
import { antwortAusParts } from '../../testing';
import { forSeeds } from '../../test-utils';
import { FEHLERTYPEN_F1 } from '../../fehlertypen-batches/f1';
import {
  solveWertmassstab,
  wertmassstaebe,
  type AvParams,
  type F3Params,
  type HkParams,
  type UvParams,
} from './wertmassstaebe';

const f = (v: Val | undefined) => formatNumber(v!);

const HK: HkParams = {
  variante: 'herstellungskosten',
  anlage: 'Förderband für die Abfüllung',
  mek: '40000',
  fl: '15000',
  mgkSatz: '0.25',
  fgkSatz: '2',
  sekf: '3000',
  vwgkSatz: '0.1',
  sekv: '2500',
  vtgkSatz: '0.05',
  fkZinsen: '1500',
  afaFert: '2000',
  sozial: '1200',
  forschung: '4000',
};

const UV = (kurs: string, erholungErwartet = false): UvParams => ({
  variante: 'niederstwert-uv',
  stueck: 500,
  akJeStueck: '42.00',
  kurs,
  erholungErwartet,
});

const AV = (beizulegend: string, dauernd: boolean): AvParams => ({
  variante: 'niederstwert-av',
  anlage: 'Etikettiermaschine',
  ak: '96000',
  nd: 8,
  jahre: 3,
  beizulegend,
  dauernd,
});

describe('F3 Golden Cases', () => {
  it('GC-F3-1 Herstellungskosten: Wertunter- und -obergrenze', () => {
    const s = solveWertmassstab(HK);
    expect(f(s.mgk)).toBe('10.000,00');
    expect(f(s.fgk)).toBe('30.000,00');
    expect(f(s.untergrenze)).toBe('100.000,00');
    expect(f(s.vwgk)).toBe('10.000,00');
    expect(f(s.obergrenze)).toBe('112.700,00');
    expect(f(solveWertmassstab(HK, { ohneWerteverzehr: true }).untergrenze)).toBe('98.000,00');
    expect(f(solveWertmassstab(HK, { mitForschung: true }).obergrenze)).toBe('116.700,00');
  });

  it('GC-F3-2 Aktien im Umlaufvermögen (strenges Niederstwertprinzip)', () => {
    const s = solveWertmassstab(UV('38.50', true));
    expect([f(s.ausgangswert), f(s.vergleichswert), f(s.ansatz), f(s.abschreibung)]).toEqual([
      '21.000,00',
      '19.250,00',
      '19.250,00',
      '1.750,00',
    ]);
    expect(s.prinzip).toBe('Strenges Niederstwertprinzip');
    const hoch = solveWertmassstab(UV('45.00'));
    expect([f(hoch.ansatz), f(hoch.abschreibung)]).toEqual(['21.000,00', '0,00']);
  });

  it('GC-F3-3 Maschine im Anlagevermögen (gemildertes Niederstwertprinzip)', () => {
    const d = solveWertmassstab(AV('45000', true));
    expect([f(d.planmaessig), f(d.ausgangswert), f(d.abschreibung), f(d.ansatz)]).toEqual([
      '12.000,00',
      '60.000,00',
      '15.000,00',
      '45.000,00',
    ]);
    const v = solveWertmassstab(AV('45000', false));
    expect([f(v.abschreibung), f(v.ansatz)]).toEqual(['0,00', '60.000,00']);
    const hoch = solveWertmassstab(AV('110000', true));
    expect([f(hoch.abschreibung), f(hoch.ansatz)]).toEqual(['0,00', '60.000,00']);
  });

  it('GC-F3-4 Verbindlichkeit in US-Dollar (Höchstwertprinzip)', () => {
    const s = solveWertmassstab({
      variante: 'hoechstwert',
      lieferant: 'einem Aromenhersteller in Kalifornien',
      ware: 'Aromen',
      usd: '21600.00',
      kursEin: '1.0800',
      kursStichtag: '1.0500',
    });
    expect([f(s.wertEin), f(s.wertStichtag), f(s.ansatz), f(s.erhoehung)]).toEqual([
      '20.000,00',
      '20.571,43',
      '20.571,43',
      '571,43',
    ]);
  });
});

describe('F3 Eigenschaften', () => {
  it('Bilanzansatz nie über den (fortgeführten) Anschaffungskosten, Abschreibung = Differenz', () => {
    for (const variant of ['niederstwert-uv', 'niederstwert-av']) {
      forSeeds(
        wertmassstaebe,
        1000,
        (p: F3Params, s) => {
          expect(s.ansatz!.cmp(s.ausgangswert!)).toBeLessThanOrEqual(0);
          expect(s.ausgangswert!.minus(s.ansatz!).exact.equals(s.abschreibung!.exact)).toBe(true);
          if (p.variante === 'niederstwert-uv')
            expect(
              s.ansatz!.exact.equals(
                s.ausgangswert!.exact.lt(s.vergleichswert!.exact)
                  ? s.ausgangswert!.exact
                  : s.vergleichswert!.exact,
              ),
            ).toBe(true);
          if (p.variante === 'niederstwert-av' && !p.dauernd)
            expect(s.abschreibung!.exact.isZero()).toBe(true);
        },
        { variant },
      );
    }
  });

  it('Höchstwertprinzip: Ansatz ≥ Wert bei Einbuchung', () => {
    forSeeds(
      wertmassstaebe,
      1000,
      (_p, s) => {
        expect(s.ansatz!.cmp(s.wertEin!)).toBeGreaterThanOrEqual(0);
        expect(s.erhoehung!.exact.gt(0)).toBe(true);
      },
      { variant: 'hoechstwert' },
    );
  });

  it('Herstellungskosten: Untergrenze < Obergrenze', () => {
    forSeeds(
      wertmassstaebe,
      1000,
      (_p, s) => expect(s.untergrenze!.cmp(s.obergrenze!)).toBeLessThan(0),
      { variant: 'herstellungskosten' },
    );
  });

  it('jede Fehlervariante ist im Fehlerkatalog erklärt und wird erkannt', () => {
    for (const variant of wertmassstaebe.variants) {
      for (let seed = 1; seed <= 50; seed++) {
        const p = wertmassstaebe.generate(createRng(seed), { variant });
        const s = wertmassstaebe.solve(p);
        for (const v of wertmassstaebe.errorVariants(p)) {
          expect(FEHLERTYPEN_F1[v.fehlertyp], v.fehlertyp).toBeDefined();
          const r = wertmassstaebe.check(p, s, antwortAusParts(v.parts));
          expect(r.korrekt).toBe(false);
          expect(r.fehlertypen).toContain(v.fehlertyp);
        }
      }
    }
  });
});
