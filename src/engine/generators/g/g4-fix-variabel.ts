// G4 – Fixe und variable Kosten: Kostenfunktion aus zwei Beschäftigungen, Stückkosten bei
// Beschäftigungsänderung, Zuordnung fix/variabel (Lehrbrief K1 Kap. 1.4.1; eigene Zahlen).
import { Val, dec } from '../../money';
import type { ErrorVariant, RechenkettePart, TaskPart } from '../../task';
import { defineGenerator, eur, feld, isExact, isKrumm, plain, retry } from '../base';
import { MONAT, auswahl, buendeln, ziehe } from './common';

export const FIX = 'fix';
export const VARIABEL = 'variabel';
export const INTERVALLFIX = 'intervallfix (sprungfix)';
export const VERHALTEN = [FIX, VARIABEL, INTERVALLFIX];

export interface KostenartG4 {
  id: string;
  text: string;
  verhalten: string;
  begruendung: string;
  fehler: { verhalten: string; fehlertyp: string }[];
}

const FV = 'fix-variabel-vertauscht';

export const KOSTENARTEN_G4: readonly KostenartG4[] = [
  {
    id: 'zucker',
    text: 'Zucker für den Sirup',
    verhalten: VARIABEL,
    begruendung: 'Je mehr Sirup angesetzt wird, desto mehr Zucker wird verbraucht.',
    fehler: [{ verhalten: FIX, fehlertyp: FV }],
  },
  {
    id: 'akkordlohn',
    text: 'Akkordlohn der Abfüllkräfte je Palette',
    verhalten: VARIABEL,
    begruendung: 'Akkordlohn wird je Leistungseinheit bezahlt und steigt mit der Menge.',
    fehler: [{ verhalten: FIX, fehlertyp: FV }],
  },
  {
    id: 'dosen',
    text: 'Leere Dosen für Paderquell Energy',
    verhalten: VARIABEL,
    begruendung: 'Jede abgefüllte Dose braucht eine leere Dose: mengenabhängig.',
    fehler: [{ verhalten: FIX, fehlertyp: FV }],
  },
  {
    id: 'co2',
    text: 'Kohlensäure für die Abfüllung',
    verhalten: VARIABEL,
    begruendung: 'Der Verbrauch an Kohlensäure steigt mit der abgefüllten Menge.',
    fehler: [{ verhalten: FIX, fehlertyp: FV }],
  },
  {
    id: 'miete',
    text: 'Miete für die Lagerhalle im Logistikzentrum',
    verhalten: FIX,
    begruendung: 'Die Miete fällt in gleicher Höhe an, egal wie viel produziert wird.',
    fehler: [{ verhalten: VARIABEL, fehlertyp: FV }],
  },
  {
    id: 'gehalt-werkleiter',
    text: 'Gehalt der Werkleiterin',
    verhalten: FIX,
    begruendung: 'Das Monatsgehalt hängt nicht von der Produktionsmenge ab.',
    fehler: [{ verhalten: VARIABEL, fehlertyp: FV }],
  },
  {
    id: 'versicherung',
    text: 'Feuerversicherung des Werks',
    verhalten: FIX,
    begruendung: 'Die Prämie ist für den Zeitraum vereinbart, unabhängig von der Menge.',
    fehler: [{ verhalten: VARIABEL, fehlertyp: FV }],
  },
  {
    id: 'afa-zeit',
    text: 'Zeitabhängige Abschreibung der Sirupanlage',
    verhalten: FIX,
    begruendung: 'Zeitabhängig abgeschrieben: jeden Monat gleich viel, auch bei Stillstand.',
    fehler: [{ verhalten: VARIABEL, fehlertyp: FV }],
  },
  {
    id: 'schichtleitung',
    text: 'Zweite Schichtleitung, die erst ab 10.000 hl Monatsmenge eingestellt wird',
    verhalten: INTERVALLFIX,
    begruendung:
      'Bis zur Grenze fix, beim Überschreiten springen die Kosten auf ein neues Niveau und bleiben dort wieder fix.',
    fehler: [
      { verhalten: VARIABEL, fehlertyp: 'intervallfix-verkannt' },
      { verhalten: FIX, fehlertyp: 'intervallfix-verkannt' },
    ],
  },
];

const KA = new Map(KOSTENARTEN_G4.map((k) => [k.id, k]));
export function kostenartG4(id: string): KostenartG4 {
  const k = KA.get(id);
  if (!k) throw new Error(`Unbekannte Kostenart ${id}`);
  return k;
}

// ---------- Parameter ----------

export interface G4Params {
  variante: 'kostenfunktion' | 'beschaeftigungsgrad' | 'zuordnung';
  /** Kostenfunktion: Fertigung I (Sirup- und Braukeller), Mengen in hl */
  kf?: string;
  kv?: string;
  x1?: number;
  x2?: number;
  x3?: number;
  /** Beschäftigungsgrad in %: Kosten bei a % und b %, gesucht Kosten bei c % */
  grad?: { a: number; b: number; c: number; ka: string; kb: string };
  kostenarten?: string[];
}

export interface G4Solution {
  k1?: Val;
  k2?: Val;
  kv?: Val;
  kf?: Val;
  k3gesamt?: Val;
  kf3?: Val;
  k3?: Val;
  varA?: Val;
  kfGrad?: Val;
  kc?: Val;
  verhalten?: string[];
}

export type G4Weg =
  'durchschnitt' | 'alles-variabel' | 'fixkosten-vergessen' | 'nicht-hochgerechnet';

export function solveG4(p: G4Params, weg?: G4Weg): G4Solution {
  if (p.variante === 'zuordnung') {
    return { verhalten: (p.kostenarten ?? []).map((id) => kostenartG4(id).verhalten) };
  }
  if (p.variante === 'beschaeftigungsgrad') {
    const g = p.grad!;
    const jeProzent = new Val(g.ka).minus(g.kb).div(g.a - g.b);
    let varA = jeProzent.times(g.a);
    if (weg === 'nicht-hochgerechnet') varA = new Val(g.ka).minus(g.kb);
    if (weg === 'alles-variabel') varA = new Val(g.ka);
    const kfGrad = new Val(g.ka).minus(varA);
    const kc =
      weg === 'alles-variabel'
        ? new Val(g.ka).div(g.a).times(g.c)
        : kfGrad.plus(varA.div(g.a).times(g.c));
    return { varA, kfGrad, kc };
  }
  const x1 = p.x1!;
  const x2 = p.x2!;
  const x3 = p.x3!;
  const k1 = new Val(p.kf!).plus(new Val(p.kv!).times(x1));
  const k2 = new Val(p.kf!).plus(new Val(p.kv!).times(x2));
  let kv = k2.minus(k1).div(x2 - x1);
  if (weg === 'durchschnitt') kv = k1.div(x1).round();
  const kf = k1.minus(kv.times(x1));
  let k3gesamt = kf.plus(kv.times(x3));
  let kf3 = kf.div(x3).round();
  let k3 = kv.plus(kf3);
  if (weg === 'alles-variabel') {
    k3 = k1.div(x1).round();
    k3gesamt = k3.times(x3);
    kf3 = kf.div(x1).round();
  }
  if (weg === 'fixkosten-vergessen') {
    k3gesamt = kv.times(x3);
    kf3 = new Val(0);
    k3 = kv;
  }
  return { k1, k2, kv, kf, k3gesamt, kf3, k3 };
}

// ---------- Teile ----------

function zuordnungsPart(p: G4Params): RechenkettePart {
  return {
    typ: 'rechenkette',
    id: 'verhalten',
    titel: 'Fix oder variabel?',
    felder: (p.kostenarten ?? []).map((id, i) =>
      auswahl(`k${i + 1}`, kostenartG4(id).text, VERHALTEN, kostenartG4(id).verhalten),
    ),
  };
}

function parts(p: G4Params, s: G4Solution): TaskPart[] {
  if (p.variante === 'zuordnung') return [zuordnungsPart(p)];
  if (p.variante === 'beschaeftigungsgrad') {
    const g = p.grad!;
    return [
      {
        typ: 'rechenkette',
        id: 'grad',
        titel: 'Variable und fixe Kosten',
        felder: [
          feld('var-a', `Variable Kosten gesamt bei ${g.a} %`, s.varA!),
          feld('kf', 'Fixkosten', s.kfGrad!),
          feld('kc', `Gesamtkosten bei ${g.c} %`, s.kc!),
        ],
      },
    ];
  }
  return [
    {
      typ: 'rechenkette',
      id: 'funktion',
      titel: 'Kostenfunktion K = Kf + kv · x',
      felder: [
        feld('kv', 'Variable Stückkosten kv', s.kv!, 'betrag', '€/hl'),
        feld('kf', 'Fixkosten Kf', s.kf!),
        feld('k3gesamt', `Gesamtkosten bei ${plain(p.x3!)} hl`, s.k3gesamt!),
        feld('kf3', `Fixe Stückkosten bei ${plain(p.x3!)} hl`, s.kf3!, 'betrag', '€/hl'),
        feld('k3', `Stückkosten bei ${plain(p.x3!)} hl`, s.k3!, 'betrag', '€/hl'),
      ],
    },
  ];
}

function errorVariants(p: G4Params): ErrorVariant[] {
  if (p.variante === 'zuordnung') {
    return buendeln(
      zuordnungsPart(p),
      (p.kostenarten ?? []).flatMap((id, i) =>
        kostenartG4(id).fehler.map((f) => ({
          fehlertyp: f.fehlertyp,
          feldId: `k${i + 1}`,
          soll: f.verhalten,
        })),
      ),
    );
  }
  const wege: { weg: G4Weg; fehlertyp: string }[] =
    p.variante === 'beschaeftigungsgrad'
      ? [
          { weg: 'nicht-hochgerechnet', fehlertyp: 'differenz-nicht-hochgerechnet' },
          { weg: 'alles-variabel', fehlertyp: 'alles-variabel' },
        ]
      : [
          { weg: 'durchschnitt', fehlertyp: 'durchschnitt-statt-differenz' },
          { weg: 'alles-variabel', fehlertyp: 'alles-variabel' },
          { weg: 'fixkosten-vergessen', fehlertyp: 'fixkosten-vergessen' },
        ];
  return wege.map(({ weg, fehlertyp }) => ({ fehlertyp, parts: parts(p, solveG4(p, weg)) }));
}

// ---------- Generator ----------

const ZUORDNUNG_MIT_INTERVALL = 0.5;

export const g4FixVariabel = defineGenerator<G4Params, G4Solution>({
  skillId: 'G4-fix-variabel',
  titel: 'Fixe und variable Kosten',
  variants: ['kostenfunktion', 'beschaeftigungsgrad', 'zuordnung'],
  points: 5,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const variante =
      (opts.variant as G4Params['variante'] | undefined) ??
      rng.pick<G4Params['variante']>([
        'kostenfunktion',
        'kostenfunktion',
        'beschaeftigungsgrad',
        'zuordnung',
      ]);
    if (variante === 'zuordnung') {
      const mitIntervall = rng.chance(ZUORDNUNG_MIT_INTERVALL);
      const fix = ziehe(
        rng,
        KOSTENARTEN_G4.filter((k) => k.verhalten === FIX),
        2,
      );
      const vari = ziehe(
        rng,
        KOSTENARTEN_G4.filter((k) => k.verhalten === VARIABEL),
        2,
      );
      const extra = mitIntervall
        ? KOSTENARTEN_G4.filter((k) => k.verhalten === INTERVALLFIX)
        : ziehe(
            rng,
            KOSTENARTEN_G4.filter(
              (k) => k.verhalten !== INTERVALLFIX && !fix.includes(k) && !vari.includes(k),
            ),
            1,
          );
      return {
        variante,
        kostenarten: rng.shuffle([...fix, ...vari, ...extra]).map((k) => k.id),
      };
    }
    if (variante === 'beschaeftigungsgrad') {
      return retry(
        rng,
        (r) => {
          const a = r.pick([100, 100, 90, 80]);
          const b = r.pick([40, 50, 60, 70].filter((x) => x < a));
          const c = r.pick(
            [50, 60, 70, 75, 80, 90, 100].filter((x) => x !== a && x !== b && x <= 100),
          );
          const jeProzent = krumm ? r.int(150_000, 1_200_000) / 100 : r.step(1_000, 12_000, 500);
          const kf = r.step(100_000, 500_000, 10_000);
          const ka = dec(kf).plus(dec(jeProzent).times(a)).toFixed(2);
          const kb = dec(kf).plus(dec(jeProzent).times(b)).toFixed(2);
          return { variante, grad: { a, b, c, ka, kb } } satisfies G4Params;
        },
        (p) => {
          const s = solveG4(p);
          return s.kfGrad!.exact.gt(0) && isExact(s.kc!.exact);
        },
      );
    }
    return retry(
      rng,
      (r) => {
        const kv = krumm ? (r.int(2_000, 9_000) / 100).toFixed(2) : String(r.step(20, 90, 0.5));
        const kf = String(r.step(60_000, 240_000, 5_000));
        const mengen = r.shuffle([1_500, 2_000, 2_500, 3_000, 4_000, 5_000, 6_000, 7_500, 8_000]);
        const [x1, x2] = [mengen[0]!, mengen[1]!].sort((a, b) => a - b) as [number, number];
        const x3 = mengen[2]!;
        return { variante, kf, kv, x1, x2, x3 } satisfies G4Params;
      },
      (p) => {
        if (krumm) return true;
        const s = solveG4(p);
        return isExact(s.kf3!.exact) && isExact(s.kv!.exact);
      },
    );
  },
  render: (p, f) => {
    if (p.variante === 'zuordnung') {
      return {
        titel: 'Fixe und variable Kosten',
        kontext: 'Januar Folgejahr: Controlling baut die Kostenrechnung auf',
        sachverhalt: [
          `Das Controlling untersucht, wie sich die Kosten im Werk ${f.ort} verhalten, wenn die MBG mehr oder weniger abfüllt.`,
        ],
        aufgabe: 'Ordne jede Kostenart zu: fix, variabel oder intervallfix (sprungfix).',
      };
    }
    if (p.variante === 'beschaeftigungsgrad') {
      const g = p.grad!;
      return {
        titel: 'Fixe und variable Kosten',
        kontext: 'Januar Folgejahr: Controlling baut die Kostenrechnung auf',
        sachverhalt: [
          `In der Kostenstelle ${f.kostenstellen.fertigung2} sinkt die Beschäftigung von ${g.a} % auf ${g.b} %. Die Kosten der Periode gehen dabei von ${eur(g.ka)} auf ${eur(g.kb)} zurück.`,
          'Die variablen Kosten verhalten sich proportional zur Beschäftigung.',
        ],
        aufgabe: `Ermittle die gesamten variablen Kosten bei ${g.a} %, die Fixkosten und die Gesamtkosten bei einer Beschäftigung von ${g.c} %.`,
      };
    }
    return {
      titel: 'Kostenfunktion und Stückkosten',
      kontext: 'Januar Folgejahr: Controlling baut die Kostenrechnung auf',
      sachverhalt: [
        `In der Kostenstelle ${f.kostenstellen.fertigung1} wird Sirup für ${f.produkte.lemon} angesetzt. Das Controlling kennt die Gesamtkosten zweier Monate:`,
      ],
      daten: {
        spalten: ['Monat', 'Menge (hl)', 'Gesamtkosten'],
        zeilen: [
          ['Monat A', plain(p.x1!), eur(solveG4(p).k1!)],
          ['Monat B', plain(p.x2!), eur(solveG4(p).k2!)],
        ],
      },
      aufgabe: `Ermittle die Kostenfunktion (variable Stückkosten und Fixkosten) unter der Annahme eines linearen Kostenverlaufs. Berechne für ${plain(p.x3!)} hl die Gesamtkosten, die fixen Stückkosten und die Stückkosten je Hektoliter (${MONAT}-Planung).`,
    };
  },
  solve: (p) => solveG4(p),
  parts,
  steps: (p, s) => {
    if (p.variante === 'zuordnung') {
      return (p.kostenarten ?? []).map((id) => {
        const k = kostenartG4(id);
        return { titel: k.text, ergebnis: k.verhalten, erlaeuterung: k.begruendung };
      });
    }
    if (p.variante === 'beschaeftigungsgrad') {
      const g = p.grad!;
      return [
        {
          titel: 'Variable Kosten je Prozentpunkt',
          rechnung: `(${eur(g.ka)} − ${eur(g.kb)}) ÷ (${g.a} − ${g.b}) = ${eur(new Val(g.ka).minus(g.kb).div(g.a - g.b))}`,
          erlaeuterung: 'Nur die variablen Kosten ändern sich mit der Beschäftigung.',
        },
        { titel: `Variable Kosten bei ${g.a} %`, ergebnis: eur(s.varA!) },
        {
          titel: 'Fixkosten',
          rechnung: `${eur(g.ka)} − ${eur(s.varA!)} = ${eur(s.kfGrad!)}`,
        },
        {
          titel: `Gesamtkosten bei ${g.c} %`,
          rechnung: `${eur(s.kfGrad!)} + ${eur(s.varA!)} ÷ ${g.a} × ${g.c} = ${eur(s.kc!)}`,
        },
      ];
    }
    return [
      {
        titel: 'Variable Stückkosten',
        rechnung: `(${eur(s.k2!)} − ${eur(s.k1!)}) ÷ (${plain(p.x2!)} − ${plain(p.x1!)}) hl = ${eur(s.kv!)}/hl`,
        erlaeuterung:
          'Die Kostendifferenz entsteht nur durch die variablen Kosten der Mehrmenge; die Fixkosten fallen bei beiden Mengen gleich an.',
      },
      {
        titel: 'Fixkosten',
        rechnung: `${eur(s.k1!)} − ${eur(s.kv!)} × ${plain(p.x1!)} = ${eur(s.kf!)}`,
      },
      {
        titel: `Gesamtkosten bei ${plain(p.x3!)} hl`,
        rechnung: `${eur(s.kf!)} + ${eur(s.kv!)} × ${plain(p.x3!)} = ${eur(s.k3gesamt!)}`,
      },
      {
        titel: 'Stückkosten',
        rechnung: `kf = ${eur(s.kf!)} ÷ ${plain(p.x3!)} = ${eur(s.kf3!)}/hl; k = ${eur(s.kv!)} + ${eur(s.kf3!)} = ${eur(s.k3!)}/hl`,
        erlaeuterung: 'Je größer die Menge, desto kleiner der Fixkostenanteil je Hektoliter.',
      },
    ];
  },
  hints: (p, s) => {
    if (p.variante === 'zuordnung')
      return [
        'Frage je Kostenart: Ändert sich der Betrag, wenn die MBG doppelt so viel abfüllt?',
        'Was je Dose, Palette oder Hektoliter verbraucht wird, ist variabel. Was pro Monat vereinbart ist, ist fix.',
        'Intervallfix sind Kosten, die bis zu einer Grenze gleich bleiben und dann sprunghaft steigen.',
      ];
    if (p.variante === 'beschaeftigungsgrad')
      return [
        'Die Kostendifferenz zwischen beiden Beschäftigungsgraden besteht nur aus variablen Kosten.',
        `Differenz ÷ Differenz der Prozentpunkte = variable Kosten je Prozentpunkt; dann × ${p.grad!.a}.`,
        `Variable Kosten bei ${p.grad!.a} %: ${eur(s.varA!)}. Fixkosten = Gesamtkosten − variable Kosten.`,
      ];
    return [
      'Lineare Kostenfunktion: K = Kf + kv · x. Die Fixkosten sind bei beiden Mengen gleich.',
      'kv = Kostendifferenz ÷ Mengendifferenz. Danach Kf = K − kv · x.',
      `kv = ${eur(s.kv!)}/hl. Stückkosten = Gesamtkosten ÷ Menge = kv + Kf ÷ Menge.`,
    ];
  },
  errorVariants,
  verfahren: (p) =>
    p.variante === 'zuordnung'
      ? 'Kosten nach dem Verhalten bei Beschäftigungsänderung einteilen'
      : 'Lineare Kostenfunktion und Stückkosten (fixe und variable Kosten)',
});
