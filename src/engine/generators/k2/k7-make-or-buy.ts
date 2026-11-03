// K7 – Eigenfertigung oder Fremdbezug: selbst abfüllen oder Lohnabfüller (MBG Paderborn).
// Spezifikation und Golden Cases: docs/m7/k2.md (GC-24 aus docs/04-fachregeln.md).
import { Val, dec, sum } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, Feld, SolutionStep, TaskPart } from '../../task';
import { defineGenerator, eur, feld, isKrumm, plain, retry } from '../base';
import { einheitVon, wahlPart, type WahlText } from './common';

export type MobVariante = 'freie-kapazitaet' | 'kritische-menge';

export interface MobParams {
  variante: MobVariante;
  produkt: string;
  /** Preis des Lohnabfüllers je Stück */
  fremdpreis: string;
  /** Variable Kosten der eigenen Abfüllung je Stück, aufgeschlüsselt */
  bestandteile: { name: string; betrag: string }[];
  /** freie-kapazitaet: ohnehin anfallende Fixkosten, umgelegt je Stück (nicht entscheidungsrelevant) */
  fixUmlage?: string;
  /** kritische-menge: zusätzliche Fixkosten der eigenen Abfüllung je Jahr */
  zusatzFix?: string;
  /** geplante Menge je Jahr */
  menge: number;
}

export type MobEntscheidung =
  'eigen' | 'fremd-vk' | 'fremd-kv' | 'eigen-krit' | 'fremd-krit' | 'eigen-kv';

export interface MobSolution {
  kv: Val;
  /** Kosten je Stück, mit denen verglichen wird (richtig: nur variable Kosten) */
  relevant: Val;
  /** freie-kapazitaet: Selbstkosten je Stück einschließlich Fixkostenumlage */
  vollkosten: Val;
  /** Fremdpreis − (relevante) Kosten je Stück */
  differenz: Val;
  vorteilGesamt: Val;
  kritischeMenge: number;
  kostenEigen: Val;
  kostenFremd: Val;
  entscheidung: MobEntscheidung;
}

export interface MobWeg {
  /** typischer Fehler: ohnehin anfallende Fixkosten trotz freier Kapazität eingerechnet */
  fixkostenEingerechnet?: boolean;
  /** typischer Fehler: zusätzliche Fixkosten der eigenen Abfüllung übersehen */
  zusatzFixVergessen?: boolean;
}

export function solveMob(p: MobParams, w: MobWeg = {}): MobSolution {
  const kv = sum(p.bestandteile.map((b) => b.betrag));
  const vollkosten = kv.plus(p.fixUmlage ?? '0');
  const fremd = new Val(p.fremdpreis);
  if (p.variante === 'freie-kapazitaet') {
    const relevant = w.fixkostenEingerechnet ? vollkosten : kv;
    const differenz = fremd.minus(relevant);
    const vorteilGesamt = differenz.times(p.menge).round();
    let entscheidung: MobEntscheidung;
    if (fremd.exact.lt(kv.exact)) entscheidung = 'fremd-kv';
    else if (fremd.exact.lt(relevant.exact)) entscheidung = 'fremd-vk';
    else entscheidung = 'eigen';
    return {
      kv,
      relevant,
      vollkosten,
      differenz,
      vorteilGesamt,
      kritischeMenge: 0,
      kostenEigen: relevant.times(p.menge).round(),
      kostenFremd: fremd.times(p.menge).round(),
      entscheidung,
    };
  }
  const differenz = fremd.minus(kv);
  const zf = w.zusatzFixVergessen ? dec(0) : dec(p.zusatzFix!);
  const kritischeMenge = zf.div(differenz.exact).ceil().toNumber();
  const kostenEigen = kv.times(p.menge).round().plus(zf);
  const kostenFremd = fremd.times(p.menge).round();
  const entscheidung: MobEntscheidung = w.zusatzFixVergessen
    ? 'eigen-kv'
    : p.menge > kritischeMenge
      ? 'eigen-krit'
      : 'fremd-krit';
  return {
    kv,
    relevant: kv,
    vollkosten,
    differenz,
    vorteilGesamt: kostenFremd.minus(kostenEigen),
    kritischeMenge,
    kostenEigen,
    kostenFremd,
    entscheidung,
  };
}

const OPT_FREI: WahlText[] = [
  {
    id: 'eigen',
    text: 'Selbst abfüllen: Die variablen Kosten der eigenen Abfüllung liegen unter dem Preis des Lohnabfüllers.',
    erklaerung:
      'Vergleiche den Preis des Lohnabfüllers noch einmal mit den variablen Kosten je Stück.',
  },
  {
    id: 'fremd-vk',
    text: 'Lohnabfüller beauftragen: Die eigenen Selbstkosten je Stück liegen über seinem Preis.',
    erklaerung:
      'Die umgelegten Fixkosten fallen bei freier Kapazität ohnehin an. Entscheidend sind nur die variablen Kosten.',
  },
  {
    id: 'fremd-kv',
    text: 'Lohnabfüller beauftragen: Schon die variablen Kosten der eigenen Abfüllung liegen über seinem Preis.',
    erklaerung:
      'Vergleiche den Preis des Lohnabfüllers noch einmal mit den variablen Kosten je Stück.',
  },
];

const OPT_KRIT: WahlText[] = [
  {
    id: 'eigen-krit',
    text: 'Selbst abfüllen: Die geplante Menge liegt über der kritischen Menge.',
    erklaerung:
      'Unterhalb der kritischen Menge decken die Einsparungen je Stück die zusätzlichen Fixkosten nicht.',
  },
  {
    id: 'fremd-krit',
    text: 'Lohnabfüller beauftragen: Die geplante Menge liegt unter der kritischen Menge.',
    erklaerung: 'Oberhalb der kritischen Menge ist die eigene Abfüllung günstiger.',
  },
  {
    id: 'eigen-kv',
    text: 'Selbst abfüllen: Die variablen Kosten je Stück sind niedriger als der Preis des Lohnabfüllers.',
    erklaerung:
      'Die eigene Abfüllung verursacht zusätzliche Fixkosten. Sie lohnt sich erst ab der kritischen Menge.',
  },
];

function partsMob(p: MobParams, s: MobSolution, mitFehlwegen = true): TaskPart[] {
  const { ein, mehr } = einheitVon(p.produkt);
  const je = `€/${ein}`;
  let felder: Feld[];
  let optionen: WahlText[];
  let fehlwege: { fehlertyp: string; optionId: string }[] = [];
  if (p.variante === 'freie-kapazitaet') {
    felder = [
      feld(
        'kv',
        `Entscheidungsrelevante Kosten der eigenen Abfüllung je ${ein}`,
        s.relevant,
        'betrag',
        je,
      ),
      feld('diff', `Kostenvorteil der eigenen Abfüllung je ${ein}`, s.differenz, 'betrag', je),
      feld('gesamt', 'Kostenvorteil der eigenen Abfüllung insgesamt', s.vorteilGesamt),
    ];
    optionen = OPT_FREI;
    if (mitFehlwegen)
      fehlwege = [
        {
          fehlertyp: 'fixkosten-bei-freier-kapazitaet',
          optionId: solveMob(p, { fixkostenEingerechnet: true }).entscheidung,
        },
      ];
  } else {
    felder = [
      feld(
        'diff',
        `Kostendifferenz je ${ein} (Lohnabfüller − eigene variable Kosten)`,
        s.differenz,
        'betrag',
        je,
      ),
      feld('xkrit', 'Kritische Menge', s.kritischeMenge, 'menge', mehr),
      feld('eigen', `Kosten der eigenen Abfüllung bei ${plain(p.menge)} ${mehr}`, s.kostenEigen),
      feld('fremd', `Kosten beim Lohnabfüller bei ${plain(p.menge)} ${mehr}`, s.kostenFremd),
    ];
    optionen = OPT_KRIT;
    if (mitFehlwegen)
      fehlwege = [
        {
          fehlertyp: 'zusatzfixkosten-vergessen',
          optionId: solveMob(p, { zusatzFixVergessen: true }).entscheidung,
        },
      ];
  }
  return [
    { typ: 'rechenkette', id: 'rechnung', titel: 'Kostenvergleich', felder },
    wahlPart(
      'mc',
      'entscheidung',
      'Wie soll die MBG entscheiden?',
      optionen,
      s.entscheidung,
      fehlwege,
    ),
  ];
}

const PRODUKTE = [
  'Paderquell Energy 0,33 l',
  'Senne Lemon 0,33 l',
  'Almeblick Tequila-Bier 0,33 l',
];

function cent(rng: Rng, min: number, max: number): string {
  return dec(rng.int(min, max)).div(100).toString();
}

function erzeuge(rng: Rng, variante: MobVariante, krumm: boolean): MobParams {
  const produkt = rng.pick(PRODUKTE);
  const { ein } = einheitVon(produkt);
  if (variante === 'freie-kapazitaet') {
    const bestandteile = [
      { name: `${ein} und Verschluss`, betrag: cent(rng, 3, 8) },
      { name: 'Energie, Kohlensäure und Reinigung', betrag: cent(rng, 1, 4) },
      { name: 'zusätzliche Schichtlöhne', betrag: cent(rng, 1, 4) },
    ];
    const kv = bestandteile.reduce((a, b) => a.plus(b.betrag), dec(0));
    const fix = dec(rng.int(3, 8)).div(100);
    const fremd = rng.chance(0.75)
      ? kv.plus(dec(rng.int(1, fix.times(100).toNumber() - 1)).div(100))
      : kv.minus(dec(rng.int(1, 3)).div(100));
    return {
      variante,
      produkt,
      fremdpreis: fremd.toString(),
      bestandteile,
      fixUmlage: fix.toString(),
      menge: rng.step(krumm ? 210_000 : 200_000, 2_000_000, krumm ? 7_000 : 50_000),
    };
  }
  const fremd = dec(rng.int(8, 20)).div(100);
  const diff = dec(rng.int(1, 6)).div(100);
  const xkrit = rng.step(200_000, 1_500_000, 50_000);
  const zusatzFix = diff.times(xkrit);
  let menge = xkrit + (rng.chance(0.5) ? 1 : -1) * rng.step(100_000, 500_000, 50_000);
  if (menge <= 0) menge = xkrit + rng.step(100_000, 500_000, 50_000);
  return {
    variante,
    produkt,
    fremdpreis: fremd.toString(),
    bestandteile: [
      { name: 'variable Kosten der eigenen Abfüllung', betrag: fremd.minus(diff).toString() },
    ],
    zusatzFix: zusatzFix.toFixed(2),
    menge,
  };
}

export const makeOrBuy = defineGenerator<MobParams, MobSolution>({
  skillId: 'K7-make-or-buy',
  titel: 'Eigenfertigung oder Fremdbezug',
  variants: ['freie-kapazitaet', 'kritische-menge'],
  points: 5,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const variante =
      (opts.variant as MobVariante | undefined) ??
      (rng.chance(0.5) ? 'kritische-menge' : 'freie-kapazitaet');
    return retry(
      rng,
      (r) => erzeuge(r, variante, krumm),
      (p) => {
        const s = solveMob(p);
        if (s.differenz.exact.isZero()) return false;
        if (p.variante === 'kritische-menge')
          return p.menge !== s.kritischeMenge && s.kv.exact.gt(0);
        return true;
      },
    );
  },
  render: (p) => {
    const { ein, mehr } = einheitVon(p.produkt);
    if (p.variante === 'freie-kapazitaet') {
      const s = solveMob(p);
      return {
        titel: 'Selbst abfüllen oder Lohnabfüller?',
        kontext: 'Teilkostenrechnung: Eigenfertigung oder Fremdbezug',
        sachverhalt: [
          `Die MBG plant im Herbst ${plain(p.menge)} ${mehr} ${p.produkt}. Auf der eigenen Abfüllanlage ist dafür noch Kapazität frei.`,
          `Ein Lohnabfüller aus der Region bietet an, die Menge für ${eur(p.fremdpreis)} je ${ein} abzufüllen, einschließlich ${ein} und Verschluss. Den Sirup liefert die MBG in beiden Fällen selbst.`,
          `Die Kalkulation weist für die eigene Abfüllung Selbstkosten von ${eur(s.vollkosten)} je ${ein} aus. Darin enthalten ist eine Umlage von ${eur(p.fixUmlage!)} je ${ein} für Abschreibung der Anlage, Hallenmiete und Werksleitung; diese Kosten fallen ohnehin an.`,
        ],
        daten: {
          spalten: ['Variable Kosten der eigenen Abfüllung', `€ je ${ein}`],
          zeilen: p.bestandteile.map((b) => [b.name, eur(b.betrag)]),
        },
        aufgabe:
          'Ermittle die entscheidungsrelevanten Kosten je Stück, den Kostenvorteil der eigenen Abfüllung je Stück und insgesamt und entscheide.',
      };
    }
    return {
      titel: 'Selbst abfüllen oder Lohnabfüller?',
      kontext: 'Teilkostenrechnung: Eigenfertigung oder Fremdbezug',
      sachverhalt: [
        `Ein Lohnabfüller verlangt ${eur(p.fremdpreis)} je ${ein} ${p.produkt}.`,
        `Für die eigene Abfüllung müsste die MBG eine zusätzliche Linie mieten: zusätzliche Fixkosten ${eur(p.zusatzFix!)} im Jahr, variable Kosten ${eur(p.bestandteile[0]!.betrag)} je ${ein}.`,
        `Geplant sind ${plain(p.menge)} ${mehr} im Jahr.`,
      ],
      aufgabe:
        'Ermittle die Kostendifferenz je Stück, die kritische Menge und die Kosten beider Möglichkeiten bei der geplanten Menge. Entscheide.',
    };
  },
  solve: (p) => solveMob(p),
  parts: (p, s) => partsMob(p, s),
  steps: (p, s): SolutionStep[] => {
    const { ein, mehr } = einheitVon(p.produkt);
    if (p.variante === 'freie-kapazitaet') {
      return [
        {
          titel: 'Entscheidungsrelevante Kosten',
          rechnung: `${p.bestandteile.map((b) => eur(b.betrag)).join(' + ')} = ${eur(s.kv)} je ${ein}`,
          erlaeuterung: `Die Umlage von ${eur(p.fixUmlage!)} je ${ein} fällt bei freier Kapazität ohnehin an und bleibt außen vor.`,
        },
        {
          titel: 'Kostenvorteil je Stück',
          rechnung: `${eur(p.fremdpreis)} − ${eur(s.kv)} = ${eur(s.differenz)}`,
        },
        {
          titel: 'Kostenvorteil insgesamt',
          rechnung: `${eur(s.differenz)} × ${plain(p.menge)} = ${eur(s.vorteilGesamt)}`,
          erlaeuterung: s.differenz.isNegative()
            ? 'Negativ: Der Lohnabfüller ist günstiger.'
            : 'Positiv: Die eigene Abfüllung ist günstiger.',
        },
      ];
    }
    return [
      {
        titel: 'Kostendifferenz je Stück',
        rechnung: `${eur(p.fremdpreis)} − ${eur(s.kv)} = ${eur(s.differenz)}`,
        erlaeuterung: 'So viel spart jede selbst abgefüllte Einheit gegenüber dem Lohnabfüller.',
      },
      {
        titel: 'Kritische Menge',
        rechnung: `${eur(p.zusatzFix!)} ÷ ${eur(s.differenz)} = ${plain(s.kritischeMenge)} ${mehr}`,
        erlaeuterung: `Bei dieser Menge kosten beide Möglichkeiten gleich viel. Darüber ist die eigene Abfüllung günstiger.`,
      },
      {
        titel: 'Kosten bei der geplanten Menge',
        rechnung: `eigen: ${eur(p.zusatzFix!)} + ${eur(s.kv)} × ${plain(p.menge)} = ${eur(s.kostenEigen)}; Lohnabfüller: ${eur(p.fremdpreis)} × ${plain(p.menge)} = ${eur(s.kostenFremd)}`,
      },
      {
        titel: 'Entscheidung',
        erlaeuterung: OPT_KRIT.find((o) => o.id === s.entscheidung)!.text,
      },
    ];
  },
  hints: (p, s) => {
    const { ein } = einheitVon(p.produkt);
    if (p.variante === 'freie-kapazitaet')
      return [
        'Welche Kosten entstehen nur, wenn die MBG selbst abfüllt? Nur diese zählen.',
        `Die Umlage für Anlage, Miete und Werksleitung fällt ohnehin an. Relevante Kosten: ${eur(s.kv)} je ${ein}.`,
        `${eur(p.fremdpreis)} − ${eur(s.kv)} = ${eur(s.differenz)} je ${ein}.`,
      ];
    return [
      'Bei der kritischen Menge sind die Kosten beider Möglichkeiten gleich hoch.',
      'Zusätzliche Fixkosten + variable Kosten × x = Preis des Lohnabfüllers × x.',
      `Kritische Menge = ${eur(p.zusatzFix!)} ÷ ${eur(s.differenz)}.`,
    ];
  },
  errorVariants: (p): ErrorVariant[] =>
    p.variante === 'freie-kapazitaet'
      ? [
          {
            fehlertyp: 'fixkosten-bei-freier-kapazitaet',
            parts: partsMob(p, solveMob(p, { fixkostenEingerechnet: true }), false),
          },
        ]
      : [
          {
            fehlertyp: 'zusatzfixkosten-vergessen',
            parts: partsMob(p, solveMob(p, { zusatzFixVergessen: true }), false),
          },
        ],
  verfahren: (p) =>
    p.variante === 'kritische-menge'
      ? 'Eigenfertigung oder Fremdbezug: kritische Menge bei zusätzlichen Fixkosten'
      : 'Eigenfertigung oder Fremdbezug: variable Kosten mit dem Fremdbezugspreis vergleichen',
});
