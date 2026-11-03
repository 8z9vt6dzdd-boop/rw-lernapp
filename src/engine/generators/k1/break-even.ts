// K3 – Gewinnschwelle (Break-even-Menge und -Umsatz), Änderung der Gewinnschwelle,
// kritische Menge zweier Verfahren.
import { Val, dec } from '../../money';
import type { ErrorVariant, Feld, TaskPart } from '../../task';
import { defineGenerator, eur, feld, isKrumm, plain, retry } from '../base';
import { SORTEN_K, abrunden, aufrunden, cent, prozent, type Sorte } from './common';

export type BreakEvenVariante = 'menge' | 'aenderung' | 'verfahren';

export type AenderungsArt = 'preis' | 'kv' | 'kf';

export interface Anlage {
  name: string;
  /** Fixkosten je Monat in € */
  kf: string;
  /** variable Kosten je Einheit in € */
  kv: string;
}

export interface BreakEvenParams extends Sorte {
  variante: BreakEvenVariante;
  /** Zeitraum der Fixkosten */
  zeitraum: 'Jahr' | 'Monat';
  preis: string;
  kv: string;
  /** Fixkosten je Zeitraum in € */
  kf: string;
  /** Kapazität je Zeitraum (0 = nicht angegeben) */
  kapazitaet: number;
  /** aenderung: Art und Höhe der Änderung (Preissenkung, Erhöhung der variablen Kosten bzw. der Fixkosten) */
  aenderung?: { art: AenderungsArt; betrag: string };
  /** verfahren: zwei Anlagen (A: niedrige Fixkosten, B: niedrige variable Kosten) und Planmenge */
  anlagen?: [Anlage, Anlage];
  planMenge?: number;
}

export interface BreakEvenSolution {
  db: Val;
  /** Gewinnschwelle exakt (Bruch) */
  mengeExakt: Val;
  /** Gewinnschwelle aufgerundet auf ganze Einheiten */
  menge: Val;
  umsatz: Val;
  grad: Val;
  dbNeu: Val;
  mengeNeu: Val;
  differenz: Val;
  kritisch: Val;
  kostenA: Val;
  kostenB: Val;
  guenstiger: string;
}

interface Weg {
  /** Fixkosten durch den Preis statt durch den Stückdeckungsbeitrag geteilt */
  preisStattDb?: boolean;
  /** Gewinnschwelle abgerundet statt aufgerundet */
  abgerundet?: boolean;
  /** Menge und Umsatz verwechselt: Menge als Umsatz eingetragen */
  umsatzStattMenge?: boolean;
  /** kritische Menge: Summe statt Differenz der Fixkosten */
  fixSumme?: boolean;
}

function schwelle(kf: Val, divisor: Val, w: Weg): { exakt: Val; ganz: Val } {
  const exakt = kf.div(divisor);
  return { exakt, ganz: w.abgerundet ? abrunden(exakt.exact) : aufrunden(exakt.exact) };
}

export function neueWerte(p: BreakEvenParams): { preis: Val; kv: Val; kf: Val } {
  const a = p.aenderung;
  return {
    preis: a?.art === 'preis' ? new Val(p.preis).minus(a.betrag) : new Val(p.preis),
    kv: a?.art === 'kv' ? new Val(p.kv).plus(a.betrag) : new Val(p.kv),
    kf: a?.art === 'kf' ? new Val(p.kf).plus(a.betrag) : new Val(p.kf),
  };
}

export function solveBreakEven(p: BreakEvenParams, w: Weg = {}): BreakEvenSolution {
  const preis = new Val(p.preis);
  const kf = new Val(p.kf);
  const db = preis.minus(p.kv);
  const { exakt: mengeExakt, ganz: menge } = schwelle(kf, w.preisStattDb ? preis : db, w);
  // Umsatz an der Gewinnschwelle: aufgerundete Menge × Preis; der exakte Bruch K_f × p ÷ db
  // gilt als gleichwertiger zweiter Lösungsweg.
  const umsatzGanz = menge.times(preis).exact;
  const umsatzBruch = mengeExakt.times(preis).exact;
  const umsatz = w.umsatzStattMenge
    ? menge
    : new Val(umsatzGanz, umsatzBruch, umsatzGanz.equals(umsatzBruch) ? 0 : 1);
  const grad = p.kapazitaet > 0 ? prozent(menge.div(p.kapazitaet)) : new Val(0);

  const n = neueWerte(p);
  const dbNeu = n.preis.minus(n.kv);
  const mengeNeu = dbNeu.exact.gt(0)
    ? schwelle(n.kf, w.preisStattDb ? n.preis : dbNeu, w).ganz
    : new Val(0);
  const differenz = mengeNeu.minus(menge);

  let kritisch = new Val(0);
  let kostenA = new Val(0);
  let kostenB = new Val(0);
  let guenstiger = '';
  if (p.anlagen && p.planMenge !== undefined) {
    const [a, b] = p.anlagen;
    const fix = w.fixSumme ? new Val(b.kf).plus(a.kf) : new Val(b.kf).minus(a.kf);
    kritisch = fix.div(new Val(a.kv).minus(b.kv));
    kostenA = new Val(a.kf).plus(new Val(a.kv).times(p.planMenge));
    kostenB = new Val(b.kf).plus(new Val(b.kv).times(p.planMenge));
    guenstiger = p.planMenge > kritisch.exact.toNumber() ? b.name : a.name;
  }
  return {
    db,
    mengeExakt,
    menge,
    umsatz,
    grad,
    dbNeu,
    mengeNeu,
    differenz,
    kritisch,
    kostenA,
    kostenB,
    guenstiger,
  };
}

function aenderungText(p: BreakEvenParams): string {
  const a = p.aenderung!;
  if (a.art === 'preis') return `Der Preis sinkt um ${eur(a.betrag)} je ${p.sg}.`;
  if (a.art === 'kv') return `Die variablen Kosten steigen um ${eur(a.betrag)} je ${p.sg}.`;
  return `Eine neue Etikettiermaschine erhöht die Fixkosten um ${eur(a.betrag)} je ${p.zeitraum}.`;
}

function parts(p: BreakEvenParams, s: BreakEvenSolution): TaskPart[] {
  if (p.variante === 'verfahren') {
    const [a, b] = p.anlagen!;
    return [
      {
        typ: 'rechenkette',
        id: 'kritisch',
        titel: 'Kritische Menge',
        felder: [
          feld('kritisch', `Kritische Menge (${p.einheit})`, s.kritisch, 'menge', p.einheit),
          feld('kostenA', `Kosten ${a.name} bei ${plain(p.planMenge!)} ${p.einheit}`, s.kostenA),
          feld('kostenB', `Kosten ${b.name} bei ${plain(p.planMenge!)} ${p.einheit}`, s.kostenB),
          {
            typ: 'auswahl',
            id: 'wahl',
            label: `Günstiger bei ${plain(p.planMenge!)} ${p.einheit}`,
            optionen: [a.name, b.name],
            soll: s.guenstiger,
          },
        ],
      },
    ];
  }
  const felder: Feld[] = [
    feld('db', `Stückdeckungsbeitrag je ${p.sg}`, s.db),
    feld('menge', `Gewinnschwelle (${p.einheit})`, s.menge, 'menge', p.einheit),
  ];
  if (p.variante === 'menge') {
    felder.push(feld('umsatz', 'Umsatz an der Gewinnschwelle', s.umsatz));
    if (p.kapazitaet > 0)
      felder.push(feld('grad', 'Beschäftigungsgrad an der Gewinnschwelle', s.grad, 'prozent'));
    return [{ typ: 'rechenkette', id: 'bep', titel: 'Gewinnschwelle', felder }];
  }
  return [
    { typ: 'rechenkette', id: 'bep', titel: 'Gewinnschwelle bisher', felder },
    {
      typ: 'rechenkette',
      id: 'neu',
      titel: 'Gewinnschwelle nach der Änderung',
      felder: [
        feld('dbNeu', `neuer Stückdeckungsbeitrag je ${p.sg}`, s.dbNeu),
        feld('mengeNeu', `neue Gewinnschwelle (${p.einheit})`, s.mengeNeu, 'menge', p.einheit),
        feld(
          'differenz',
          `Veränderung der Gewinnschwelle (${p.einheit}, Rückgang mit Minus)`,
          s.differenz,
          'menge',
          p.einheit,
        ),
      ],
    },
  ];
}

/** Preisrahmen je Sorte in Cent */
const PREIS: Record<string, [number, number]> = {
  'Senne Lemon 0,33 l': [60, 110],
  'Paderquell Energy 0,33 l': [60, 120],
  'Paderquell Energy 0,5 l': [80, 150],
  'Almeblick Tequila-Bier 0,33 l': [70, 130],
};

const ANLAGEN: [string, string][] = [
  ['Etikettierer A (halbautomatisch)', 'Etikettierer B (vollautomatisch)'],
  ['Abfüllanlage A (gebraucht)', 'Abfüllanlage B (neu)'],
  ['Verpackungslinie A (Handpacken)', 'Verpackungslinie B (Roboter)'],
];

export const breakEven = defineGenerator<BreakEvenParams, BreakEvenSolution>({
  skillId: 'K3-break-even',
  titel: 'Gewinnschwelle',
  variants: ['menge', 'aenderung', 'verfahren'],
  points: 6,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const variante =
      (opts.variant as BreakEvenVariante | undefined) ??
      rng.pick<BreakEvenVariante>(['menge', 'menge', 'aenderung', 'verfahren']);
    return retry(
      rng,
      (r) => {
        const sorte = r.pick(SORTEN_K);
        const zeitraum: 'Jahr' | 'Monat' = r.chance(0.5) ? 'Jahr' : 'Monat';
        const [lo, hi] = PREIS[sorte.produkt]!;
        const preis = cent(r, lo, hi, 5);
        const dbCent = r.step(
          10,
          Math.min(60, dec(preis).times(50).round().toNumber()),
          krumm ? 1 : 5,
        );
        const kv = dec(preis).minus(dec(dbCent).div(100)).toString();
        const faktor = zeitraum === 'Jahr' ? 12 : 1;
        const kf = String(
          krumm ? r.step(10_000, 60_000, 100) * faktor : r.step(10_000, 60_000, 2_000) * faktor,
        );
        const kapazitaet = r.chance(0.6)
          ? r.step(400_000, 2_000_000, 100_000) * (faktor === 12 ? 6 : 1)
          : 0;
        const p: BreakEvenParams = { ...sorte, variante, zeitraum, preis, kv, kf, kapazitaet };
        if (variante === 'aenderung') {
          const art = r.pick<AenderungsArt>(['preis', 'kv', 'kf']);
          p.aenderung = {
            art,
            betrag:
              art === 'kf'
                ? String(r.step(2_000, 20_000, 1_000) * faktor)
                : cent(r, 2, Math.min(20, dbCent - 5), krumm ? 1 : 5),
          };
          p.kapazitaet = 0;
        }
        if (variante === 'verfahren') {
          const [na, nb] = r.pick(ANLAGEN);
          const kfA = r.step(4_000, 30_000, 1_000);
          const kfB = kfA + r.step(6_000, 60_000, 2_000);
          const kvB = r.step(3, 30, 1);
          const kvA = kvB + r.step(1, 10, 1);
          p.anlagen = [
            { name: na, kf: String(kfA), kv: dec(kvA).div(100).toString() },
            { name: nb, kf: String(kfB), kv: dec(kvB).div(100).toString() },
          ];
          const krit = dec(kfB - kfA)
            .div(dec(kvA - kvB).div(100))
            .toNumber();
          p.planMenge = Math.max(
            10_000,
            Math.round((krit * r.pick([0.5, 0.7, 0.8, 1.25, 1.5, 2])) / 10_000) * 10_000,
          );
          p.kapazitaet = 0;
          p.zeitraum = 'Monat';
          p.kf = '0';
        }
        return p;
      },
      (p) => {
        const s = solveBreakEven(p);
        if (p.variante === 'verfahren') {
          // kritische Menge ganzzahlig, Planmenge eindeutig auf einer Seite
          return s.kritisch.exact.isInteger() && !s.kritisch.exact.equals(p.planMenge!);
        }
        if (!s.db.exact.gt(0)) return false;
        if (p.kapazitaet > 0 && s.menge.exact.gt(p.kapazitaet)) return false;
        if (p.kapazitaet > 0 && s.menge.exact.lt(dec(p.kapazitaet).times('0.2'))) return false;
        if (p.variante === 'aenderung') {
          if (!s.dbNeu.exact.gt(0) || s.differenz.exact.isZero()) return false;
          if (!krumm && !s.mengeNeu.exact.equals(neueWerte(p).kf.exact.div(s.dbNeu.exact)))
            return false;
        }
        // klausurfreundlich: Gewinnschwelle geht ohne Rest auf
        return krumm || s.mengeExakt.exact.isInteger();
      },
    );
  },
  render: (p) => {
    if (p.variante === 'verfahren') {
      const [a, b] = p.anlagen!;
      return {
        titel: 'Kritische Menge zweier Anlagen',
        kontext: 'Teilkostenrechnung: Verfahrensvergleich',
        sachverhalt: [
          `Für ${p.produkt} stehen zwei Anlagen zur Wahl. Die Kosten verlaufen linear, die Qualität ist gleich.`,
          `Geplant sind ${plain(p.planMenge!)} ${p.einheit} im Monat.`,
        ],
        daten: {
          spalten: ['Anlage', 'Fixkosten je Monat', `variable Kosten je ${p.sg}`],
          zeilen: [a, b].map((x) => [x.name, eur(x.kf), eur(x.kv)]),
        },
        aufgabe:
          'Ermittle die kritische Menge, die Kosten beider Anlagen bei der Planmenge und entscheide, welche Anlage günstiger ist.',
      };
    }
    const basis = [
      `Für ${p.produkt} rechnet die MBG mit einem Nettoverkaufspreis von ${eur(p.preis)} und variablen Kosten von ${eur(p.kv)} je ${p.sg}. Die Fixkosten betragen ${eur(p.kf)} im ${p.zeitraum}.`,
    ];
    if (p.kapazitaet > 0)
      basis.push(`Die Kapazität liegt bei ${plain(p.kapazitaet)} ${p.einheit} im ${p.zeitraum}.`);
    if (p.variante === 'aenderung') {
      basis.push(aenderungText(p));
      return {
        titel: 'Gewinnschwelle nach einer Änderung',
        kontext: 'Teilkostenrechnung: Was-wäre-wenn',
        sachverhalt: basis,
        aufgabe:
          'Ermittle die Gewinnschwelle vorher und nachher sowie die Veränderung der Gewinnschwellenmenge.',
      };
    }
    return {
      titel: 'Gewinnschwelle',
      kontext: 'Teilkostenrechnung: Ab wann lohnt sich die Sorte?',
      sachverhalt: basis,
      aufgabe: `Ermittle Stückdeckungsbeitrag, Gewinnschwellenmenge (ganze ${p.einheit}) und den Umsatz an der Gewinnschwelle${p.kapazitaet > 0 ? ' sowie den Beschäftigungsgrad an der Gewinnschwelle' : ''}.`,
    };
  },
  solve: (p) => solveBreakEven(p),
  parts,
  steps: (p, s) => {
    if (p.variante === 'verfahren') {
      const [a, b] = p.anlagen!;
      return [
        {
          titel: 'Kostengleichung',
          rechnung: `${eur(a.kf)} + ${eur(a.kv)} · x = ${eur(b.kf)} + ${eur(b.kv)} · x`,
          erlaeuterung: 'An der kritischen Menge kosten beide Anlagen gleich viel.',
        },
        {
          titel: 'Kritische Menge',
          rechnung: `x = (${eur(b.kf)} − ${eur(a.kf)}) ÷ (${eur(a.kv)} − ${eur(b.kv)}) = ${plain(s.kritisch.exact)} ${p.einheit}`,
        },
        {
          titel: 'Vergleich bei der Planmenge',
          rechnung: `${a.name}: ${eur(s.kostenA)}; ${b.name}: ${eur(s.kostenB)}`,
          erlaeuterung: `Über der kritischen Menge lohnt die Anlage mit den niedrigeren variablen Kosten, darunter die mit den niedrigeren Fixkosten. Günstiger: ${s.guenstiger}.`,
        },
      ];
    }
    const out = [
      {
        titel: 'Stückdeckungsbeitrag',
        rechnung: `${eur(p.preis)} − ${eur(p.kv)} = ${eur(s.db)}`,
      },
      {
        titel: 'Gewinnschwelle',
        rechnung: `${eur(p.kf)} ÷ ${eur(s.db)} = ${plain(s.mengeExakt.exact, 2)} → ${plain(s.menge.exact)} ${p.einheit}`,
        erlaeuterung: s.mengeExakt.exact.isInteger()
          ? 'Bei dieser Menge decken die Deckungsbeiträge genau die Fixkosten.'
          : 'Nicht ganzzahlig: Es wird aufgerundet, denn erst die nächste ganze Einheit deckt die Fixkosten vollständig.',
      },
    ];
    if (p.variante === 'menge') {
      out.push({
        titel: 'Umsatz an der Gewinnschwelle',
        rechnung: `${plain(s.menge.exact)} × ${eur(p.preis)} = ${eur(s.umsatz)}`,
      });
      if (p.kapazitaet > 0)
        out.push({
          titel: 'Beschäftigungsgrad',
          rechnung: `${plain(s.menge.exact)} ÷ ${plain(p.kapazitaet)} × 100 = ${plain(s.grad.value)} %`,
        });
    } else {
      const n = neueWerte(p);
      out.push(
        {
          titel: 'Neuer Stückdeckungsbeitrag',
          rechnung: `${eur(n.preis)} − ${eur(n.kv)} = ${eur(s.dbNeu)}`,
        },
        {
          titel: 'Neue Gewinnschwelle',
          rechnung: `${eur(n.kf)} ÷ ${eur(s.dbNeu)} → ${plain(s.mengeNeu.exact)} ${p.einheit}; Veränderung ${plain(s.differenz.exact)} ${p.einheit}`,
        },
      );
    }
    return out;
  },
  hints: (p, s) =>
    p.variante === 'verfahren'
      ? [
          'Setze die beiden Kostenfunktionen gleich: K_fA + k_vA · x = K_fB + k_vB · x.',
          'Kritische Menge = Differenz der Fixkosten ÷ Differenz der variablen Kosten je Einheit.',
          `Kritische Menge: ${plain(s.kritisch.exact)}. Liegt die Planmenge darüber oder darunter?`,
        ]
      : [
          'An der Gewinnschwelle decken die Deckungsbeiträge genau die Fixkosten.',
          `Gewinnschwelle = Fixkosten ÷ Stückdeckungsbeitrag = ${eur(p.kf)} ÷ ${eur(s.db)}.`,
          'Nicht ganzzahlige Ergebnisse werden auf ganze Einheiten aufgerundet.',
        ],
  errorVariants: (p) => {
    if (p.variante === 'verfahren') {
      return [
        {
          fehlertyp: 'fixkosten-summe-statt-differenz',
          parts: parts(p, solveBreakEven(p, { fixSumme: true })),
        },
      ];
    }
    const out: ErrorVariant[] = [
      { fehlertyp: 'preis-statt-db', parts: parts(p, solveBreakEven(p, { preisStattDb: true })) },
    ];
    const s = solveBreakEven(p);
    const n = neueWerte(p);
    const neuGanz = p.variante !== 'aenderung' || n.kf.exact.div(s.dbNeu.exact).isInteger();
    if (!s.mengeExakt.exact.isInteger() || !neuGanz)
      out.push({
        fehlertyp: 'nicht-aufgerundet',
        parts: parts(p, solveBreakEven(p, { abgerundet: true })),
      });
    if (p.variante === 'menge')
      out.push({
        fehlertyp: 'umsatz-statt-menge',
        parts: parts(p, solveBreakEven(p, { umsatzStattMenge: true })),
      });
    return out;
  },
  verfahren: (p) =>
    p.variante === 'verfahren'
      ? 'Kritische Menge (Verfahrensvergleich)'
      : 'Gewinnschwellenanalyse (Break-even)',
});
