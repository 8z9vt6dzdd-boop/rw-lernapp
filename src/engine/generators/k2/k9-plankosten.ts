// K9 – Flexible Plankostenrechnung (Grundzüge): Kostenstelle Abfüllung der MBG.
// Spezifikation, eigener Golden Case und Annahmen zur Vorzeichenregel: docs/m7/k2.md.
import { Val, dec } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, Feld, SolutionStep, TaskPart } from '../../task';
import { defineGenerator, eur, feld, isKrumm, pct, plain, retry } from '../base';
import { wahlPart, type WahlText } from './common';

export type PlanVariante = 'sollkosten' | 'abweichungen';

export interface PlanParams {
  variante: PlanVariante;
  /** Planbeschäftigung in Abfüllstunden */
  planB: number;
  /** Plankosten bei Planbeschäftigung */
  planKosten: string;
  /** davon fixe Plankosten */
  planFix: string;
  /** Istbeschäftigung in Abfüllstunden */
  istB: number;
  /** Istkosten (zu Planpreisen bewertet); nur Variante „abweichungen“ */
  istKosten?: string;
}

export interface PlanSolution {
  /** Plankostenverrechnungssatz = Plankosten ÷ Planbeschäftigung */
  satz: Val;
  /** variabler Plankostensatz = variable Plankosten ÷ Planbeschäftigung */
  satzVar: Val;
  beschGrad: Val;
  sollkosten: Val;
  verrechnet: Val;
  /** Beschäftigungsabweichung = Sollkosten − verrechnete Plankosten */
  ba: Val;
  /** Verbrauchsabweichung = Istkosten − Sollkosten */
  va?: Val;
  /** Gesamtabweichung = Istkosten − verrechnete Plankosten */
  ga?: Val;
  deutung?: 'mehr' | 'weniger';
}

export interface PlanWeg {
  /** typischer Fehler: Sollkosten proportional (fixe Kosten wie variable behandelt) */
  sollProportional?: boolean;
  /** typischer Fehler: Verbrauchsabweichung gegen die verrechneten Plankosten statt gegen die Sollkosten */
  vaGegenVerrechnete?: boolean;
}

export function solvePlan(p: PlanParams, w: PlanWeg = {}): PlanSolution {
  const satz = new Val(p.planKosten).div(p.planB).round();
  const satzVar = new Val(p.planKosten).minus(p.planFix).div(p.planB).round();
  const beschGrad = new Val(p.istB).div(p.planB);
  const verrechnet = satz.times(p.istB).round();
  const sollkosten = w.sollProportional
    ? verrechnet
    : satzVar.times(p.istB).round().plus(p.planFix);
  const ba = sollkosten.minus(verrechnet);
  const s: PlanSolution = { satz, satzVar, beschGrad, sollkosten, verrechnet, ba };
  if (p.istKosten !== undefined) {
    const ist = new Val(p.istKosten);
    s.va = ist.minus(w.vaGegenVerrechnete ? verrechnet : sollkosten);
    s.ga = ist.minus(verrechnet);
    s.deutung = s.va.isNegative() ? 'weniger' : 'mehr';
  }
  return s;
}

const OPT_DEUTUNG: WahlText[] = [
  {
    id: 'mehr',
    text: 'Die Abfüllung hat mehr verbraucht, als für die tatsächlich geleisteten Stunden vorgesehen war (ungünstig).',
    erklaerung:
      'Maßstab sind die Sollkosten der Ist-Beschäftigung. Liegen die Istkosten darunter, wurde sparsamer gearbeitet.',
  },
  {
    id: 'weniger',
    text: 'Die Abfüllung hat weniger verbraucht, als für die tatsächlich geleisteten Stunden vorgesehen war (günstig).',
    erklaerung:
      'Maßstab sind die Sollkosten der Ist-Beschäftigung. Liegen die Istkosten darüber, wurde mehr verbraucht als vorgesehen.',
  },
  {
    id: 'besch',
    text: 'Die Abweichung entsteht nur, weil mehr oder weniger Stunden gearbeitet wurden als geplant.',
    erklaerung:
      'Das beschreibt die Beschäftigungsabweichung. Die Verbrauchsabweichung vergleicht Istkosten und Sollkosten bei gleicher Beschäftigung.',
  },
];

function partsPlan(p: PlanParams, s: PlanSolution, mitFehlwegen = true): TaskPart[] {
  const felder: Feld[] = [
    feld('satz', 'Plankostenverrechnungssatz', s.satz, 'satz', '€/h'),
    feld('satzvar', 'Variabler Plankostensatz', s.satzVar, 'satz', '€/h'),
    feld('soll', 'Sollkosten bei Istbeschäftigung', s.sollkosten),
    feld('verrechnet', 'Verrechnete Plankosten', s.verrechnet),
    feld('ba', 'Beschäftigungsabweichung', s.ba),
  ];
  const parts: TaskPart[] = [];
  if (s.va && s.ga) {
    felder.push(feld('va', 'Verbrauchsabweichung', s.va), feld('ga', 'Gesamtabweichung', s.ga));
  }
  parts.push({ typ: 'rechenkette', id: 'rechnung', titel: 'Plankostenrechnung', felder });
  if (s.deutung) {
    const fehlwege = mitFehlwegen
      ? [
          {
            fehlertyp: 'verbrauchsabweichung-falsche-basis',
            optionId: solvePlan(p, { vaGegenVerrechnete: true }).deutung!,
          },
        ]
      : [];
    parts.push(
      wahlPart(
        'mc',
        'deutung',
        'Was sagt die Verbrauchsabweichung über die Abfüllung aus?',
        OPT_DEUTUNG,
        s.deutung,
        fehlwege,
        'Die Verbrauchsabweichung vergleicht Istkosten und Sollkosten. Die Sollkosten sind das an die tatsächliche Beschäftigung angepasste Budget.',
      ),
    );
  }
  return parts;
}

function erzeuge(rng: Rng, variante: PlanVariante, krumm: boolean): PlanParams {
  const planB = rng.step(1_000, 4_000, 100);
  const satz = rng.step(80, 250, 5);
  const planKosten = dec(satz).times(planB);
  const fixAnteil = dec(rng.step(30, 60, 5)).div(100);
  const planFix = planKosten.times(fixAnteil);
  const grad = dec(rng.pick([70, 75, 80, 85, 90, 95, 105, 110])).div(100);
  const istB = grad.times(planB).toNumber();
  const p: PlanParams = {
    variante,
    planB,
    planKosten: planKosten.toFixed(2),
    planFix: planFix.toFixed(2),
    istB,
  };
  if (variante === 'abweichungen') {
    const s = solvePlan(p);
    const va = krumm ? dec(rng.int(30_000, 800_000)).div(100) : dec(rng.step(500, 8_000, 100));
    const ist = s.sollkosten.exact.plus(rng.chance(0.65) ? va : va.neg());
    p.istKosten = ist.toFixed(2);
  }
  return p;
}

export const plankosten = defineGenerator<PlanParams, PlanSolution>({
  skillId: 'K9-plankosten',
  titel: 'Flexible Plankostenrechnung',
  variants: ['sollkosten', 'abweichungen'],
  points: 6,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const variante =
      (opts.variant as PlanVariante | undefined) ??
      (rng.chance(0.6) ? 'abweichungen' : 'sollkosten');
    return retry(
      rng,
      (r) => erzeuge(r, variante, krumm),
      (p) => {
        const s = solvePlan(p);
        if (s.ba.exact.isZero()) return false;
        // Der Fehlweg „Verbrauch gegen verrechnete Plankosten“ soll zu einem anderen Ergebnis führen.
        if (s.va) {
          const f = solvePlan(p, { vaGegenVerrechnete: true });
          if (f.va!.exact.equals(s.va.exact)) return false;
        }
        return true;
      },
    );
  },
  render: (p) => {
    const sachverhalt = [
      `Für die Kostenstelle Fertigung II (Abfüllung) hat das Controlling der MBG für Juni geplant: Planbeschäftigung ${plain(p.planB)} Abfüllstunden, Plankosten ${eur(p.planKosten)}, davon fix ${eur(p.planFix)}.`,
      `Tatsächlich lief die Anlage ${plain(p.istB)} Stunden.`,
    ];
    if (p.istKosten !== undefined)
      sachverhalt.push(`Die Istkosten (zu Planpreisen bewertet) betragen ${eur(p.istKosten)}.`);
    return {
      titel: 'Flexible Plankostenrechnung',
      kontext: 'Teilkostenrechnung: Budget und Kontrolle der Abfüllung',
      sachverhalt,
      aufgabe:
        p.istKosten !== undefined
          ? 'Ermittle Plankostenverrechnungssatz, variablen Plankostensatz, Sollkosten, verrechnete Plankosten sowie Beschäftigungs-, Verbrauchs- und Gesamtabweichung (Vorzeichen: Sollkosten − verrechnete Plankosten, Istkosten − Sollkosten, Istkosten − verrechnete Plankosten). Deute die Verbrauchsabweichung.'
          : 'Ermittle Plankostenverrechnungssatz, variablen Plankostensatz, Sollkosten, verrechnete Plankosten und die Beschäftigungsabweichung (Sollkosten − verrechnete Plankosten).',
    };
  },
  solve: (p) => solvePlan(p),
  parts: (p, s) => partsPlan(p, s),
  steps: (p, s): SolutionStep[] => {
    const out: SolutionStep[] = [
      {
        titel: 'Plankostenverrechnungssatz',
        rechnung: `${eur(p.planKosten)} ÷ ${plain(p.planB)} h = ${eur(s.satz)}/h`,
      },
      {
        titel: 'Variabler Plankostensatz',
        rechnung: `(${eur(p.planKosten)} − ${eur(p.planFix)}) ÷ ${plain(p.planB)} h = ${eur(s.satzVar)}/h`,
      },
      {
        titel: 'Sollkosten',
        rechnung: `${eur(p.planFix)} + ${eur(s.satzVar)}/h × ${plain(p.istB)} h = ${eur(s.sollkosten)}`,
        erlaeuterung: `Das Budget, angepasst an die Istbeschäftigung (Beschäftigungsgrad ${pct(s.beschGrad.exact)}). Die Fixkosten bleiben voll erhalten.`,
      },
      {
        titel: 'Verrechnete Plankosten',
        rechnung: `${eur(s.satz)}/h × ${plain(p.istB)} h = ${eur(s.verrechnet)}`,
        erlaeuterung:
          'Der Verrechnungssatz behandelt auch die Fixkosten so, als wären sie proportional.',
      },
      {
        titel: 'Beschäftigungsabweichung',
        rechnung: `${eur(s.sollkosten)} − ${eur(s.verrechnet)} = ${eur(s.ba)}`,
        erlaeuterung: s.ba.isNegative()
          ? 'Überbeschäftigung: Es wurden mehr Fixkosten verrechnet, als angefallen sind.'
          : 'Unterbeschäftigung: Ein Teil der Fixkosten wurde nicht verrechnet (Leerkosten).',
      },
    ];
    if (s.va && s.ga && p.istKosten !== undefined) {
      out.push(
        {
          titel: 'Verbrauchsabweichung',
          rechnung: `${eur(p.istKosten)} − ${eur(s.sollkosten)} = ${eur(s.va)}`,
          erlaeuterung: s.va.isNegative()
            ? 'Weniger verbraucht als vorgesehen: günstig.'
            : 'Mehr verbraucht als vorgesehen: ungünstig, die Kostenstelle muss das erklären.',
        },
        {
          titel: 'Gesamtabweichung',
          rechnung: `${eur(p.istKosten)} − ${eur(s.verrechnet)} = ${eur(s.ga)}`,
          erlaeuterung: `Kontrolle: ${eur(s.ba)} + ${eur(s.va)} = ${eur(s.ga)}`,
        },
      );
    }
    return out;
  },
  hints: (p, s) => [
    'Verrechnungssatz = Plankosten ÷ Planbeschäftigung. Sollkosten = fixe Plankosten + variabler Satz × Istbeschäftigung.',
    `Sollkosten: ${eur(p.planFix)} + ${eur(s.satzVar)}/h × ${plain(p.istB)} h.`,
    p.istKosten !== undefined
      ? 'Beschäftigungsabweichung = Sollkosten − verrechnete Plankosten; Verbrauchsabweichung = Istkosten − Sollkosten.'
      : 'Beschäftigungsabweichung = Sollkosten − verrechnete Plankosten.',
  ],
  errorVariants: (p): ErrorVariant[] => {
    const out: ErrorVariant[] = [
      {
        fehlertyp: 'sollkosten-proportional',
        parts: partsPlan(p, solvePlan(p, { sollProportional: true }), false),
      },
    ];
    if (p.istKosten !== undefined)
      out.push({
        fehlertyp: 'verbrauchsabweichung-falsche-basis',
        parts: partsPlan(p, solvePlan(p, { vaGegenVerrechnete: true }), false),
      });
    return out;
  },
  verfahren: () => 'Flexible Plankostenrechnung: Sollkosten und Abweichungen ermitteln',
});
