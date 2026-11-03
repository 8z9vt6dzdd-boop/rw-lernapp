// KLR-Fall: Stufenleiterverfahren → Zuschlagssätze → Zuschlagskalkulation eines Auftrags.
import { FIRMA } from '../../config';
import { feld, pct } from '../generators/base';
import {
  generateStufenleiter,
  renderLv,
  solveStufenleiter,
  stufenleiter,
  stufenParts,
  stufenVariants,
} from '../generators/leistungsverrechnung';
import {
  solveZuschlag,
  zuschlag,
  zuschlagParts,
  type ZuschlagParams,
} from '../generators/zuschlag';
import { Val, formatEuro, formatNumber } from '../money';
import { createRng, type Rng } from '../rng';
import type { ErrorVariant, TaskPart } from '../task';
import type { Fall, FallSchritt } from './types';

const K = FIRMA.kostenstellen;
const HAUPT = [K.material, K.fertigung1, K.verwaltung, K.vertrieb];

export interface SaetzeParams {
  /** Gemeinkosten je Hauptkostenstelle nach der Leistungsverrechnung */
  mgk: Val;
  fgk: Val;
  vwgk: Val;
  vtgk: Val;
  fm: number;
  fl: number;
}

export interface SaetzeLoesung {
  mgk: Val;
  fgk: Val;
  hk: Val;
  vwgk: Val;
  vtgk: Val;
}

/** Zuschlagssätze in Prozentpunkten, auf 2 Nachkommastellen gerundet. */
export function solveSaetze(p: SaetzeParams, w: { vtAufHkPlusVw?: boolean } = {}): SaetzeLoesung {
  const hk = new Val(p.fm).plus(p.mgk).plus(p.fl).plus(p.fgk);
  const proz = (gk: Val, basis: Val | number) => gk.div(Val.of(basis)).times(100).round();
  return {
    mgk: proz(p.mgk, p.fm),
    fgk: proz(p.fgk, p.fl),
    hk,
    vwgk: proz(p.vwgk, hk),
    vtgk: proz(p.vtgk, w.vtAufHkPlusVw ? hk.plus(p.vwgk) : hk),
  };
}

function saetzeParts(s: SaetzeLoesung): TaskPart[] {
  return [
    {
      typ: 'rechenkette',
      id: 'saetze',
      titel: 'Zuschlagssätze',
      felder: [
        feld('mgk', 'Materialgemeinkostenzuschlag', s.mgk, 'prozent'),
        feld('fgk', 'Fertigungsgemeinkostenzuschlag', s.fgk, 'prozent'),
        feld('hk', 'Herstellkosten (Basis für Verwaltung und Vertrieb)', s.hk),
        feld('vwgk', 'Verwaltungsgemeinkostenzuschlag', s.vwgk, 'prozent'),
        feld('vtgk', 'Vertriebsgemeinkostenzuschlag', s.vtgk, 'prozent'),
      ],
    },
  ];
}

function einzelkosten(rng: Rng, gk: Val, min: number, max: number): number {
  // Einzelkosten so wählen, dass der Zuschlagssatz in einer üblichen Spanne liegt.
  const satz = min + rng.int(0, Math.round((max - min) * 100)) / 100;
  return Math.max(1_000, Math.round(gk.value.toNumber() / satz / 1_000) * 1_000);
}

export function klrFall(seed: number): Fall {
  const rng = createRng(seed);
  const lv = generateStufenleiter(rng, false, HAUPT);
  const sl = solveStufenleiter(lv);
  const [mgk, fgk, vwgk, vtgk] = sl.summen as [Val, Val, Val, Val];
  const sp: SaetzeParams = {
    mgk,
    fgk,
    vwgk,
    vtgk,
    fm: einzelkosten(rng, mgk, 0.08, 0.3),
    fl: einzelkosten(rng, fgk, 0.8, 2.5),
  };
  const ss = solveSaetze(sp);
  const lvText = renderLv(lv, 'stufenleiter');

  const schritt1: FallSchritt = {
    id: 'stufenleiter',
    titel: 'Leistungsverrechnung',
    skillId: 'I4-stufenleiter',
    text: { ...lvText, kontext: 'BAB der MBG, Schritt 1 von 3' },
    parts: stufenParts(lv, sl),
    variants: stufenVariants(lv),
    steps: stufenleiter.steps(lv, sl),
    hints: stufenleiter.hints(lv, sl),
    punkte: 15,
  };

  const e = (v: Val | number) => formatEuro(v);
  const schritt2: FallSchritt = {
    id: 'saetze',
    titel: 'Zuschlagssätze',
    skillId: 'I6-zuschlagssaetze',
    text: {
      titel: 'Zuschlagssätze ermitteln',
      kontext: 'BAB der MBG, Schritt 2 von 3',
      sachverhalt: [
        'Rechne mit den richtigen Gemeinkosten der Hauptkostenstellen aus Schritt 1 weiter.',
        `Die Einzelkosten des Monats: Fertigungsmaterial ${e(sp.fm)}, Fertigungslöhne ${e(sp.fl)}. Es gibt keine Bestandsveränderungen, die Herstellkosten der Produktion entsprechen also den Herstellkosten des Umsatzes.`,
      ],
      daten: {
        spalten: ['Hauptkostenstelle', 'Gemeinkosten'],
        zeilen: HAUPT.map((n, i) => [n, formatNumber(sl.summen[i]!)]),
      },
      aufgabe:
        'Ermittle die Zuschlagssätze in Prozent (auf 2 Nachkommastellen) und die Herstellkosten.',
    },
    parts: saetzeParts(ss),
    variants: [
      {
        fehlertyp: 'zuschlagsbasis-falsch',
        parts: saetzeParts(solveSaetze(sp, { vtAufHkPlusVw: true })),
      },
    ],
    steps: [
      { titel: 'Material', rechnung: `${e(mgk)} ÷ ${e(sp.fm)} × 100 = ${formatNumber(ss.mgk)} %` },
      { titel: 'Fertigung', rechnung: `${e(fgk)} ÷ ${e(sp.fl)} × 100 = ${formatNumber(ss.fgk)} %` },
      {
        titel: 'Herstellkosten',
        rechnung: `${e(sp.fm)} + ${e(mgk)} + ${e(sp.fl)} + ${e(fgk)} = ${e(ss.hk)}`,
      },
      {
        titel: 'Verwaltung und Vertrieb',
        rechnung: `${e(vwgk)} ÷ ${e(ss.hk)} × 100 = ${formatNumber(ss.vwgk)} %; ${e(vtgk)} ÷ ${e(ss.hk)} × 100 = ${formatNumber(ss.vtgk)} %`,
        erlaeuterung: 'Beide Zuschläge beziehen sich auf die Herstellkosten.',
      },
    ],
    hints: [
      'Zuschlagssatz = Gemeinkosten der Stelle ÷ Zuschlagsbasis × 100.',
      'Material auf Fertigungsmaterial, Fertigung auf Fertigungslöhne, Verwaltung und Vertrieb auf die Herstellkosten.',
      `Herstellkosten = Materialkosten + Fertigungskosten = ${e(sp.fm)} + ${e(mgk)} + ${e(sp.fl)} + ${e(fgk)}.`,
    ],
    punkte: 8,
  };

  const auftrag = rng.pick([
    '1.200 Kartons Senne Lemon 0,33 l',
    '600 Fässer Almeblick Tequila-Bier',
    '2.500 Kartons Paderquell Energy 0,25 l',
  ]);
  const zp: ZuschlagParams = {
    variante: 'differenzierend',
    auftrag,
    kunde: rng.pick(FIRMA.kunden),
    fm: String(rng.step(2_000, 12_000, 100)),
    mgk: ss.mgk.value.div(100).toString(),
    fertigung: [
      {
        name: K.fertigung1,
        fl: String(rng.step(1_000, 8_000, 100)),
        fgk: ss.fgk.value.div(100).toString(),
      },
    ],
    vwgk: ss.vwgk.value.div(100).toString(),
    vtgk: ss.vtgk.value.div(100).toString(),
  };
  const zs = solveZuschlag(zp);
  const zText = zuschlag.render(zp, FIRMA);
  const schritt3: FallSchritt = {
    id: 'kalkulation',
    titel: 'Kalkulation',
    skillId: 'J4-zuschlag',
    text: {
      ...zText,
      kontext: 'Angebot der MBG, Schritt 3 von 3',
      sachverhalt: [
        `Rechne mit den richtigen Zuschlagssätzen aus Schritt 2 weiter: Material ${pct(zp.mgk!)}, Fertigung ${pct(zp.fertigung![0]!.fgk)}, Verwaltung ${pct(zp.vwgk!)}, Vertrieb ${pct(zp.vtgk!)}.`,
        ...zText.sachverhalt,
      ],
    },
    parts: zuschlagParts(zp, zs),
    variants: zuschlag.errorVariants(zp) as ErrorVariant[],
    steps: zuschlag.steps(zp, zs),
    hints: zuschlag.hints(zp, zs),
    punkte: 7,
  };

  return {
    id: 'klr',
    titel: 'Vom BAB zum Angebotspreis',
    seed,
    einleitung: [
      'Ein Monat in der Kostenrechnung der MBG: Erst werden die Vorkostenstellen verrechnet, dann die Zuschlagssätze gebildet, zum Schluss wird ein Auftrag kalkuliert.',
      'Jeder Schritt wird für sich bewertet. Danach geht es mit der richtigen Lösung weiter.',
    ],
    schritte: [schritt1, schritt2, schritt3],
  };
}
