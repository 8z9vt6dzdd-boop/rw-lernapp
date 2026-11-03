// K1 – Kostenverlauf: Kostenfunktion K(x) = K_f + k_v · x, Beschäftigungsgrad, Fixkostendegression,
// Kostenauflösung aus zwei Beschäftigungen (Differenzen-Quotienten-Verfahren).
import { Val, dec } from '../../money';
import type { ErrorVariant, TabellenZeile, TaskPart } from '../../task';
import { defineGenerator, eur, feld, isExact, isKrumm, pct, plain, retry } from '../base';
import { MONATE, SORTEN_K, prozent, type Sorte } from './common';

export type KostenverlaufVariante = 'beschaeftigung' | 'aufloesung';

export interface KostenverlaufParams extends Sorte {
  variante: KostenverlaufVariante;
  /** Fixkosten je Monat in € */
  kf: string;
  /** variable Kosten je Einheit in € */
  kv: string;
  /** Kapazität der Abfüllanlage je Monat (Einheiten) */
  kapazitaet: number;
  /** beschaeftigung: Beschäftigungsgrade der Tabelle als Anteil, aufsteigend, z. B. ["0.5", "0.8", "1"] */
  grade: string[];
  /** beschaeftigung: tatsächlich abgefüllte Menge im laufenden Monat */
  istMenge: number;
  /** aufloesung: zwei Monate mit bekannten Gesamtkosten */
  monate: [string, string];
  mengen: [number, number];
  /** aufloesung: geplante Menge für die Prognose */
  planMenge: number;
}

export interface VerlaufZeile {
  grad: string;
  menge: number;
  gesamt: Val;
  fixJeStueck: Val;
  stueck: Val;
}

export interface KostenverlaufSolution {
  /** Beschäftigungsgrad der Ist-Menge in % */
  grad: Val;
  zeilen: VerlaufZeile[];
  /** Gesamtkosten der beiden Monate (gegeben bei der Kostenauflösung) */
  kosten: [Val, Val];
  dK: Val;
  dx: Val;
  kv: Val;
  kf: Val;
  planGesamt: Val;
  planStueck: Val;
}

interface Weg {
  /** Stückkosten der höchsten Beschäftigung als konstant behandelt (Fixkosten proportionalisiert) */
  stueckkostenKonstant?: boolean;
  /** variable Stückkosten = Gesamtkosten ÷ Menge statt Kostendifferenz ÷ Mengendifferenz */
  durchschnitt?: boolean;
}

export function gesamtkostenBei(p: Pick<KostenverlaufParams, 'kf' | 'kv'>, x: number): Val {
  return new Val(p.kf).plus(new Val(p.kv).times(x));
}

export function solveKostenverlauf(p: KostenverlaufParams, w: Weg = {}): KostenverlaufSolution {
  const kfGes = new Val(p.kf);
  const grad = prozent(new Val(p.istMenge).div(p.kapazitaet));

  // Tabelle der Beschäftigungsgrade
  const mengen = p.grade.map((g) => dec(g).times(p.kapazitaet).toNumber());
  const ref = mengen[mengen.length - 1]!;
  const kRef = gesamtkostenBei(p, ref).div(ref).round();
  const zeilen: VerlaufZeile[] = p.grade.map((g, i) => {
    const menge = mengen[i]!;
    if (w.stueckkostenKonstant) {
      return {
        grad: g,
        menge,
        gesamt: kRef.times(menge).round(),
        fixJeStueck: kfGes.div(ref).round(),
        stueck: kRef,
      };
    }
    const gesamt = gesamtkostenBei(p, menge);
    return {
      grad: g,
      menge,
      gesamt,
      fixJeStueck: kfGes.div(menge).round(),
      stueck: gesamt.div(menge).round(),
    };
  });

  // Kostenauflösung aus zwei Monaten
  const [x1, x2] = p.mengen;
  const kosten: [Val, Val] = [gesamtkostenBei(p, x1), gesamtkostenBei(p, x2)];
  // Differenzen immer „höhere minus niedrigere Beschäftigung“
  const dK = kosten[1].minus(kosten[0]).abs();
  const dx = new Val(Math.abs(x2 - x1));
  const kv = w.durchschnitt ? kosten[1].div(x2).round() : dK.div(dx).round();
  const kf = kosten[0].minus(kv.times(x1)).round();
  let planGesamt = kf.plus(kv.times(p.planMenge)).round();
  let planStueck = planGesamt.div(p.planMenge).round();
  if (w.stueckkostenKonstant) {
    planStueck = kosten[1].div(x2).round();
    planGesamt = planStueck.times(p.planMenge).round();
  }
  return { grad, zeilen, kosten, dK, dx, kv, kf, planGesamt, planStueck };
}

function parts(p: KostenverlaufParams, s: KostenverlaufSolution): TaskPart[] {
  if (p.variante === 'aufloesung') {
    return [
      {
        typ: 'rechenkette',
        id: 'aufloesung',
        titel: 'Kostenfunktion bestimmen',
        felder: [
          feld('dK', 'Kostendifferenz der beiden Monate', s.dK),
          feld('dx', `Mengendifferenz (${p.einheit})`, s.dx, 'menge', p.einheit),
          feld('kv', `variable Kosten je ${p.sg}`, s.kv),
          feld('kf', 'Fixkosten je Monat', s.kf),
        ],
      },
      {
        typ: 'rechenkette',
        id: 'prognose',
        titel: `Prognose für ${plain(p.planMenge)} ${p.einheit}`,
        felder: [
          feld('planGesamt', 'Gesamtkosten', s.planGesamt),
          feld('planStueck', `Stückkosten je ${p.sg}`, s.planStueck),
        ],
      },
    ];
  }
  const zeilen: TabellenZeile[] = s.zeilen.map((z, i) => ({
    label: pct(z.grad),
    zellen: [
      { typ: 'fest', text: plain(z.menge) },
      feld(`gesamt-${i}`, `Gesamtkosten bei ${pct(z.grad)}`, z.gesamt),
      feld(`fix-${i}`, `Fixkosten je ${p.sg} bei ${pct(z.grad)}`, z.fixJeStueck),
      feld(`stueck-${i}`, `Stückkosten bei ${pct(z.grad)}`, z.stueck),
    ],
  }));
  const erst = s.zeilen[0]!;
  const letzt = s.zeilen[s.zeilen.length - 1]!;
  return [
    {
      typ: 'rechenkette',
      id: 'grad',
      titel: 'Beschäftigungsgrad',
      felder: [feld('grad', 'Beschäftigungsgrad im laufenden Monat', s.grad, 'prozent')],
    },
    {
      typ: 'tabelle',
      id: 'verlauf',
      titel: 'Kosten bei unterschiedlicher Beschäftigung',
      spalten: [
        `Menge (${p.einheit})`,
        'Gesamtkosten',
        `Fixkosten je ${p.sg}`,
        `Stückkosten je ${p.sg}`,
      ],
      zeilen,
      hinweis: 'Kontrolle: Stückkosten = variable Kosten je Einheit + Fixkosten je Einheit.',
    },
    {
      typ: 'mc',
      id: 'degression',
      frage: `Warum sinken die Stückkosten von ${eur(erst.stueck)} auf ${eur(letzt.stueck)}?`,
      optionen: [
        {
          id: 'fix',
          text: `Die Fixkosten verteilen sich auf mehr ${p.einheit}.`,
          richtig: true,
        },
        {
          id: 'kv',
          text: `Die variablen Kosten je ${p.sg} sinken mit steigender Menge.`,
          richtig: false,
          fehlertyp: 'kv-je-stueck-sinkt',
          erklaerung: `Die variablen Kosten je ${p.sg} bleiben bei ${eur(p.kv)}. Nur der Fixkostenanteil je ${p.sg} wird kleiner.`,
        },
        {
          id: 'gesamt',
          text: 'Die Gesamtkosten sinken mit steigender Menge.',
          richtig: false,
          erklaerung: `Die Gesamtkosten steigen von ${eur(erst.gesamt)} auf ${eur(letzt.gesamt)}. Sie verteilen sich aber auf mehr ${p.einheit}.`,
        },
      ],
      begruendung: `Fixkostendegression: ${eur(p.kf)} Fixkosten verteilen sich bei ${plain(letzt.menge)} ${p.einheit} auf mehr Einheiten als bei ${plain(erst.menge)} ${p.einheit}.`,
    },
  ];
}

// Beschäftigungsgrade, bei denen Fixkosten je Einheit von 12, 24 oder 36 Cent bei Vollauslastung
// auf den Cent aufgehen (klausurfreundlich).
const GRADE = ['0.3', '0.4', '0.5', '0.6', '0.75', '0.8', '1'];
const FIX_VOLL = [12, 24, 36];
const KV = ['0.18', '0.2', '0.22', '0.25', '0.28', '0.3', '0.32', '0.35', '0.4', '0.45'];

export const kostenverlauf = defineGenerator<KostenverlaufParams, KostenverlaufSolution>({
  skillId: 'K1-kostenverlauf',
  titel: 'Kostenverlauf und Beschäftigungsgrad',
  variants: ['beschaeftigung', 'aufloesung'],
  points: 6,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const variante =
      (opts.variant as KostenverlaufVariante | undefined) ??
      (rng.chance(0.5) ? 'beschaeftigung' : 'aufloesung');
    return retry(
      rng,
      (r) => {
        const sorte = r.pick(SORTEN_K);
        const kapazitaet = r.step(300_000, 1_000_000, 100_000);
        const kf = krumm
          ? String(r.step(20_100, 119_900, 100))
          : dec(r.pick(FIX_VOLL)).times(kapazitaet).div(100).toString();
        const kv = r.pick(KV);
        const grade = r
          .shuffle(GRADE)
          .slice(0, 3)
          .sort((a, b) => dec(a).cmp(b));
        const istMenge = krumm
          ? r.step(Math.round(kapazitaet * 0.35), kapazitaet, 1_000)
          : dec(kapazitaet).times(r.int(35, 98)).div(100).toNumber();
        const start = r.int(0, MONATE.length - 2);
        const monate: [string, string] = [MONATE[start]!, MONATE[start + 1]!];
        const [g1, g2, g3] = r.shuffle(GRADE).slice(0, 3);
        const m = (g: string) => dec(g).times(kapazitaet).toNumber();
        const mengen = [m(g1!), m(g2!)].sort((a, b) => a - b) as [number, number];
        return {
          ...sorte,
          variante,
          kf,
          kv,
          kapazitaet,
          grade,
          istMenge,
          monate,
          mengen,
          planMenge: m(g3!),
        } satisfies KostenverlaufParams;
      },
      (p) => {
        if (p.mengen[0] === p.mengen[1] || p.planMenge === p.mengen[0]) return false;
        if (p.planMenge === p.mengen[1]) return false;
        if (krumm) return true;
        const s = solveKostenverlauf(p);
        return (
          s.zeilen.every((z) => isExact(z.stueck.exact) && isExact(z.fixJeStueck.exact)) &&
          isExact(s.planStueck.exact)
        );
      },
    );
  },
  render: (p) => {
    if (p.variante === 'aufloesung') {
      const s = solveKostenverlauf(p);
      return {
        titel: 'Kostenfunktion aus zwei Monaten',
        kontext: 'Controlling: Kostenverlauf der Abfüllung',
        sachverhalt: [
          `Dr. Leni Brandt kennt für ${p.produkt} nur die Gesamtkosten zweier Monate. Die Kosten verlaufen linear, Preise und Fixkosten sind in beiden Monaten gleich.`,
          `Für den nächsten Monat sind ${plain(p.planMenge)} ${p.einheit} geplant.`,
        ],
        daten: {
          spalten: ['Monat', `Menge (${p.einheit})`, 'Gesamtkosten'],
          zeilen: p.monate.map((mo, i) => [mo, plain(p.mengen[i]!), eur(s.kosten[i]!)]),
        },
        aufgabe: `Ermittle die variablen Kosten je ${p.sg} und die Fixkosten je Monat (Differenzen-Quotienten-Verfahren). Berechne dann Gesamt- und Stückkosten für die Planmenge.`,
      };
    }
    return {
      titel: 'Kostenverlauf bei unterschiedlicher Beschäftigung',
      kontext: 'Controlling: Auslastung der Abfüllanlage',
      sachverhalt: [
        `Die Abfüllanlage für ${p.produkt} schafft höchstens ${plain(p.kapazitaet)} ${p.einheit} im Monat. Im laufenden Monat wurden ${plain(p.istMenge)} ${p.einheit} abgefüllt.`,
        `Die Fixkosten betragen ${eur(p.kf)} je Monat, die variablen Kosten ${eur(p.kv)} je ${p.sg}.`,
      ],
      aufgabe: `Berechne den Beschäftigungsgrad. Ermittle dann für die Beschäftigungsgrade ${p.grade.map((g) => pct(g)).join(', ')} die Gesamtkosten, die Fixkosten je ${p.sg} und die Stückkosten.`,
    };
  },
  solve: (p) => solveKostenverlauf(p),
  parts,
  steps: (p, s) => {
    if (p.variante === 'aufloesung') {
      return [
        {
          titel: 'Variable Kosten je Einheit',
          rechnung: `(${eur(s.kosten[1])} − ${eur(s.kosten[0])}) ÷ (${plain(p.mengen[1])} − ${plain(p.mengen[0])}) = ${eur(s.dK)} ÷ ${plain(s.dx.exact)} = ${eur(s.kv)}`,
          erlaeuterung:
            'Die Fixkosten sind in beiden Monaten gleich. Die Kostendifferenz entsteht also nur durch die zusätzliche Menge.',
        },
        {
          titel: 'Fixkosten',
          rechnung: `${eur(s.kosten[0])} − ${plain(p.mengen[0])} × ${eur(s.kv)} = ${eur(s.kf)}`,
          erlaeuterung: `Kostenfunktion: K(x) = ${eur(s.kf)} + ${eur(s.kv)} · x`,
        },
        {
          titel: 'Prognose',
          rechnung: `${eur(s.kf)} + ${plain(p.planMenge)} × ${eur(s.kv)} = ${eur(s.planGesamt)}; ÷ ${plain(p.planMenge)} = ${eur(s.planStueck)} je ${p.sg}`,
        },
      ];
    }
    return [
      {
        titel: 'Beschäftigungsgrad',
        rechnung: `${plain(p.istMenge)} ÷ ${plain(p.kapazitaet)} × 100 = ${plain(s.grad.value)} %`,
        erlaeuterung: 'Ist-Menge im Verhältnis zur Kapazität.',
      },
      ...s.zeilen.map((z) => ({
        titel: `Bei ${pct(z.grad)}: ${plain(z.menge)} ${p.einheit}`,
        rechnung: `${eur(p.kf)} + ${plain(z.menge)} × ${eur(p.kv)} = ${eur(z.gesamt)}; Fixkosten je ${p.sg} ${eur(p.kf)} ÷ ${plain(z.menge)} = ${eur(z.fixJeStueck)}; Stückkosten ${eur(z.stueck)}`,
      })),
      {
        titel: 'Fixkostendegression',
        erlaeuterung:
          'Mit steigender Beschäftigung sinken die Fixkosten je Einheit und damit die Stückkosten. Die variablen Kosten je Einheit bleiben gleich.',
      },
    ];
  },
  hints: (p, s) =>
    p.variante === 'aufloesung'
      ? [
          'Die Fixkosten ändern sich zwischen den Monaten nicht. Was erklärt dann die Kostendifferenz?',
          `Teile die Kostendifferenz ${eur(s.dK)} durch die Mengendifferenz ${plain(s.dx.exact)}.`,
          `Fixkosten = Gesamtkosten eines Monats − Menge × ${eur(s.kv)}.`,
        ]
      : [
          'Beschäftigungsgrad = Ist-Menge ÷ Kapazität × 100.',
          `Gesamtkosten = ${eur(p.kf)} + Menge × ${eur(p.kv)}.`,
          `Stückkosten = Gesamtkosten ÷ Menge = ${eur(p.kv)} + Fixkosten je ${p.sg}.`,
        ],
  errorVariants: (p) => {
    const out: ErrorVariant[] = [
      {
        fehlertyp: 'stueckkosten-konstant',
        parts: parts(p, solveKostenverlauf(p, { stueckkostenKonstant: true })),
      },
    ];
    if (p.variante === 'aufloesung') {
      out.push({
        fehlertyp: 'kv-durchschnitt-statt-differenz',
        parts: parts(p, solveKostenverlauf(p, { durchschnitt: true })),
      });
    }
    return out;
  },
  verfahren: (p) =>
    p.variante === 'aufloesung'
      ? 'Kostenauflösung (Differenzen-Quotienten-Verfahren)'
      : 'Kostenverlauf bei Beschäftigungsänderung (Fixkostendegression)',
});
