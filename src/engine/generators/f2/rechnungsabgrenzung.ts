// F7 – Zeitliche Abgrenzung: aktive und passive Rechnungsabgrenzung (transitorisch),
// sonstige Forderungen und sonstige Verbindlichkeiten (antizipativ). Monatsgenaue Abgrenzung.
// Fachliche Grundlage: BA 6.1–6.3; 03-aufgabentypen.md (F7); GC-13. Spezifikation: docs/m7/f2.md.
import { loesung, satz, zeile, type BuchungsLoesung } from '../../booking';
import { Val } from '../../money';
import type { Rng } from '../../rng';
import type {
  ErrorVariant,
  GenOptions,
  SolutionStep,
  TaskPart,
  TaskText,
  WahlPart,
} from '../../task';
import { betrag as zufallsBetrag, defineGenerator, eur, feld, isKrumm } from '../base';

export type F7Fall = 'arap' | 'prap' | 'sonstige-verbindlichkeit' | 'sonstige-forderung';
export const F7_FAELLE: readonly F7Fall[] = [
  'arap',
  'prap',
  'sonstige-verbindlichkeit',
  'sonstige-forderung',
];

export interface F7Params {
  fall: F7Fall;
  /** Index der Sachverhaltsvorlage in VORLAGEN[fall] */
  vorlage: number;
  /** Gesamtbetrag für den ganzen Leistungszeitraum, Dezimal-String in € */
  betrag: string;
  /** Erster Monat des Leistungszeitraums: 1–12 im alten, 13–15 im neuen Geschäftsjahr */
  start: number;
  /** Länge des Leistungszeitraums in Monaten */
  monate: number;
}

export interface F7Solution {
  altMonate: number;
  neuMonate: number;
  /** Monate, die abgegrenzt werden (transitorisch: neues Jahr, antizipativ: altes Jahr) */
  abgrenzMonate: number;
  abgrenzung: Val;
  posten: string;
  buchung: BuchungsLoesung;
}

const ARAP = 'Aktive Rechnungsabgrenzung';
const PRAP = 'Passive Rechnungsabgrenzung';
const SF = 'Sonstige Forderungen';
const SV = 'Sonstige Verbindlichkeiten';

export const POSTEN: Record<F7Fall, string> = {
  arap: ARAP,
  prap: PRAP,
  'sonstige-forderung': SF,
  'sonstige-verbindlichkeit': SV,
};

const MONAT = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

/** Monatsname zu einem Index 1–24 (13 = Januar des neuen Jahres). */
function monat(i: number): string {
  return MONAT[(i - 1) % 12]!;
}

function zeitraum(start: number, monate: number): string {
  const ende = start + monate - 1;
  const jahr = (i: number) => (i > 12 ? ' des neuen Jahres' : '');
  if (monate === 1) return `${monat(start)}${jahr(start)}`;
  return `${monat(start)}${start > 12 ? jahr(start) : ''} bis ${monat(ende)}${jahr(ende)}`;
}

interface Vorlage {
  konto: string;
  monate: number[];
  /** erlaubte Startmonate */
  start: number[];
  /** Monatsbetrag: min, max, Schritt (klausurfreundlich) */
  rate: [number, number, number];
  /** antizipativ: frühester Endmonat (13 = Zahlung am Ende des Zeitraums im neuen Jahr) */
  endeMin?: number;
  text: (p: F7Params) => string[];
}

const ALT = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const VORLAGEN: Record<F7Fall, Vorlage[]> = {
  arap: [
    {
      konto: 'Mietaufwendungen',
      monate: [3, 6, 12],
      start: [7, 8, 9, 10, 11, 12],
      rate: [400, 3_000, 50],
      text: (p) => [
        `Die MBG mietet ein Außenlager in Lippstadt. Am 1. ${monat(p.start)} überweist sie die Miete für ${zeitraum(p.start, p.monate)} (${p.monate} Monate) im Voraus: ${eur(p.betrag)}.`,
        'Die Zahlung wurde auf dem Konto Mietaufwendungen gebucht.',
      ],
    },
    {
      konto: 'Betriebssteuern',
      monate: [12],
      start: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      rate: [30, 120, 5],
      text: (p) => [
        `Für einen neuen Auslieferungs-Lkw wird am 1. ${monat(p.start)} die Kfz-Steuer für ein Jahr im Voraus vom Bankkonto abgebucht: ${eur(p.betrag)} für ${zeitraum(p.start, p.monate)}.`,
        'Die Zahlung wurde auf dem Konto Betriebssteuern gebucht.',
      ],
    },
    {
      konto: 'Zinsaufwendungen',
      monate: [3, 6],
      start: [8, 9, 10, 11, 12],
      rate: [200, 2_500, 50],
      text: (p) => [
        `Für ein Darlehen der Sparkasse zahlt die MBG die Zinsen ${p.monate === 3 ? 'vierteljährlich' : 'halbjährlich'} im Voraus. Am 1. ${monat(p.start)} werden ${eur(p.betrag)} für ${zeitraum(p.start, p.monate)} abgebucht.`,
        'Die Zahlung wurde auf dem Konto Zinsaufwendungen gebucht.',
      ],
    },
    {
      konto: 'Werbung',
      monate: [1],
      start: [13, 14, 15],
      rate: [2_000, 12_000, 100],
      text: (p) => [
        `Die MBG stellt im ${monat(p.start)} des neuen Jahres auf einer Getränkefachmesse aus. Die Standmiete von ${eur(p.betrag)} netto überweist sie bereits am 15. Dezember.`,
        'Die Zahlung wurde netto auf dem Konto Werbung gebucht, die Vorsteuer ist richtig erfasst.',
      ],
    },
  ],
  prap: [
    {
      konto: 'Mieterträge',
      monate: [3, 6],
      start: [8, 9, 10, 11, 12],
      rate: [500, 3_000, 50],
      text: (p) => [
        `Die MBG vermietet eine freie Halle im Logistikzentrum an eine Spedition. Am 1. ${monat(p.start)} gehen ${eur(p.betrag)} Miete für ${zeitraum(p.start, p.monate)} (${p.monate} Monate) im Voraus auf dem Bankkonto ein.`,
        'Der Eingang wurde auf dem Konto Mieterträge gebucht (umsatzsteuerfreie Vermietung).',
      ],
    },
    {
      konto: 'Mieterträge',
      monate: [12],
      start: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      rate: [50, 400, 10],
      text: (p) => [
        `Ein Autohaus mietet eine Werbefläche am Werkszaun der MBG. Am 1. ${monat(p.start)} überweist es die Jahresmiete für ${zeitraum(p.start, p.monate)}: ${eur(p.betrag)}.`,
        'Der Eingang wurde auf dem Konto Mieterträge gebucht (ohne Umsatzsteuer).',
      ],
    },
    {
      konto: 'Mieterträge',
      monate: [3, 6, 12],
      start: [7, 8, 9, 10, 11, 12],
      rate: [100, 800, 10],
      text: (p) => [
        `Ein Nachbarbetrieb mietet zehn Parkplätze auf dem Werksgelände. Am 1. ${monat(p.start)} zahlt er ${eur(p.betrag)} für ${zeitraum(p.start, p.monate)} im Voraus.`,
        'Der Eingang wurde auf dem Konto Mieterträge gebucht (ohne Umsatzsteuer).',
      ],
    },
  ],
  'sonstige-verbindlichkeit': [
    {
      konto: 'Zinsaufwendungen',
      monate: [3, 6],
      start: [8, 9, 10, 11, 12],
      rate: [200, 2_500, 50],
      text: (p) => [
        `Für ein Darlehen zahlt die MBG die Zinsen nachträglich. Die Zinsen für ${zeitraum(p.start, p.monate)} (${p.monate} Monate) über ${eur(p.betrag)} werden erst Ende ${monat(p.start + p.monate - 1)} des neuen Jahres abgebucht.`,
        'Bisher ist für diese Zinsen noch nichts gebucht.',
      ],
    },
    {
      konto: 'Mietaufwendungen',
      monate: [1],
      start: [12],
      rate: [800, 4_000, 50],
      endeMin: 12,
      text: (p) => [
        `Die Dezembermiete für das Außenlager in Lippstadt über ${eur(p.betrag)} hat die MBG vergessen. Sie wird erst am 8. Januar überwiesen.`,
        'Bisher ist für diese Miete noch nichts gebucht.',
      ],
    },
    {
      konto: 'Zinsaufwendungen',
      monate: [3],
      start: [10],
      rate: [100, 1_500, 25],
      endeMin: 12,
      text: (p) => [
        `Die Sparkasse belastet die Zinsen für den Kontokorrentkredit für Oktober bis Dezember erst am 2. Januar: ${eur(p.betrag)}.`,
        'Bisher ist für diese Zinsen noch nichts gebucht.',
      ],
    },
  ],
  'sonstige-forderung': [
    {
      konto: 'Zinserträge',
      monate: [3, 6, 12],
      start: ALT,
      rate: [50, 600, 10],
      text: (p) => [
        `Die MBG hat Geld als Festgeld angelegt. Die Zinsen für ${zeitraum(p.start, p.monate)} (${p.monate} Monate) über ${eur(p.betrag)} werden erst am Ende der Laufzeit, Ende ${monat(p.start + p.monate - 1)} des neuen Jahres, gutgeschrieben.`,
        'Bisher ist für diese Zinsen noch nichts gebucht.',
      ],
    },
    {
      konto: 'Mieterträge',
      monate: [1],
      start: [12],
      rate: [500, 3_000, 50],
      endeMin: 12,
      text: (p) => [
        `Die Spedition, die eine Halle der MBG gemietet hat, überweist die Dezembermiete über ${eur(p.betrag)} erst am 5. Januar.`,
        'Bisher ist für diese Miete noch nichts gebucht (umsatzsteuerfreie Vermietung).',
      ],
    },
  ],
};

export function vorlageF7(p: F7Params): Vorlage {
  return VORLAGEN[p.fall][p.vorlage]!;
}

function transitorisch(fall: F7Fall): boolean {
  return fall === 'arap' || fall === 'prap';
}

interface Rechenweg {
  /** Fehler: die Monate der jeweils anderen Periode verwendet */
  zeitanteilFalsch?: boolean;
  /** Fehler: anderer Abgrenzungsposten */
  posten?: string;
}

export function rechneF7(p: F7Params, w: Rechenweg = {}): F7Solution {
  const ende = p.start + p.monate - 1;
  const altMonate = Math.max(0, Math.min(ende, 12) - p.start + 1);
  const neuMonate = p.monate - altMonate;
  const trans = transitorisch(p.fall);
  const abgrenzMonate = trans !== Boolean(w.zeitanteilFalsch) ? neuMonate : altMonate;
  const abgrenzung = new Val(p.betrag).times(abgrenzMonate).div(p.monate).fix();
  const posten = w.posten ?? POSTEN[p.fall];
  const konto = vorlageF7(p).konto;
  // transitorisch: Erfolgskonto wird berichtigt; antizipativ: Erfolg wird nachträglich erfasst
  const s =
    p.fall === 'arap' || p.fall === 'sonstige-forderung'
      ? satz([zeile(posten, abgrenzung)], [zeile(konto, abgrenzung)], 'Abgrenzung zum 31.12.')
      : satz([zeile(konto, abgrenzung)], [zeile(posten, abgrenzung)], 'Abgrenzung zum 31.12.');
  return { altMonate, neuMonate, abgrenzMonate, abgrenzung, posten, buchung: loesung([s]) };
}

export function solveF7(p: F7Params): F7Solution {
  return rechneF7(p);
}

// ---------- Aufgabenteile ----------

const OPTIONEN: { id: string; posten: string; text: string }[] = [
  { id: 'arap', posten: ARAP, text: 'Aktive Rechnungsabgrenzung (ARAP)' },
  { id: 'prap', posten: PRAP, text: 'Passive Rechnungsabgrenzung (PRAP)' },
  { id: 'sf', posten: SF, text: 'Sonstige Forderung' },
  { id: 'sv', posten: SV, text: 'Sonstige Verbindlichkeit' },
];

function fehlertypFuer(richtig: string, gewaehlt: string): string {
  const trans = (x: string) => x === ARAP || x === PRAP;
  if (trans(richtig) && trans(gewaehlt)) return 'arap-prap-vertauscht';
  if (trans(richtig) !== trans(gewaehlt)) return 'rap-statt-sonstige';
  // sonstige Forderung ↔ sonstige Verbindlichkeit: Aufwand und Ertrag verwechselt
  return 'konto-falsche-seite';
}

function fallPart(p: F7Params, posten: string): WahlPart {
  const richtig = POSTEN[p.fall];
  return {
    typ: 'aufgabe-erkennen',
    id: 'fall',
    frage: 'Welcher Posten ist zum 31.12. zu bilden?',
    optionen: OPTIONEN.map((o) => {
      const opt: WahlPart['optionen'][number] = {
        id: o.id,
        text: o.text,
        richtig: o.posten === posten,
      };
      if (o.posten !== richtig) opt.fehlertyp = fehlertypFuer(richtig, o.posten);
      return opt;
    }),
    begruendung: transitorisch(p.fall)
      ? 'Das Geld ist schon im alten Jahr geflossen, der Erfolg gehört (teilweise) ins neue Jahr: transitorische Abgrenzung über einen Rechnungsabgrenzungsposten.'
      : 'Der Erfolg gehört ins alte Jahr, das Geld fließt erst im neuen Jahr: antizipative Abgrenzung über eine sonstige Forderung bzw. Verbindlichkeit.',
  };
}

export function partsF7(p: F7Params, s: F7Solution): TaskPart[] {
  const trans = transitorisch(p.fall);
  return [
    fallPart(p, s.posten),
    {
      typ: 'rechenkette',
      id: 'betrag',
      titel: 'Zeitanteil bestimmen',
      felder: [
        feld(
          'monate',
          trans
            ? 'Monate, die das neue Geschäftsjahr betreffen'
            : 'Monate, die das alte Geschäftsjahr betreffen',
          s.abgrenzMonate,
          'menge',
          'Monate',
        ),
        feld('abgrenzung', 'Abzugrenzender Betrag', s.abgrenzung),
      ],
    },
    { typ: 'buchungssatz', id: 'buchung', titel: 'Buchungssatz zum 31.12.', loesung: s.buchung },
  ];
}

// ---------- Erzeugen und Texte ----------

export function generateF7(rng: Rng, opts: GenOptions = {}): F7Params {
  const fall: F7Fall = (F7_FAELLE as readonly string[]).includes(opts.variant ?? '')
    ? (opts.variant as F7Fall)
    : rng.pick(F7_FAELLE);
  const krumm = isKrumm(rng, opts.krummAnteil);
  const vorlage = rng.int(0, VORLAGEN[fall].length - 1);
  const v = VORLAGEN[fall][vorlage]!;
  const monate = rng.pick(v.monate);
  let starts = v.start;
  if (transitorisch(fall)) {
    // Zeitraum muss ins neue Jahr reichen
    starts = starts.filter((s) => s + monate - 1 >= 13);
  } else {
    // Zeitraum beginnt im alten Jahr; gezahlt wird erst im neuen Jahr
    starts = starts.filter((s) => s <= 12 && s + monate - 1 >= (v.endeMin ?? 13));
  }
  const start = rng.pick(starts);
  const [min, max, step] = v.rate;
  const betrag = krumm
    ? zufallsBetrag(rng, min * monate, max * monate, 1, true)
    : String(rng.step(min, max, step) * monate);
  return { fall, vorlage, betrag, start, monate };
}

export function renderF7(p: F7Params): TaskText {
  return {
    titel: 'Zeitliche Abgrenzung',
    kontext: '31. Dezember: Abschlussbuchungen',
    sachverhalt: vorlageF7(p).text(p),
    aufgabe:
      'Entscheide, welcher Abgrenzungsposten zu bilden ist, bestimme den Betrag monatsgenau und bilde die Buchung zum 31.12.',
  };
}

export function stepsF7(p: F7Params, s: F7Solution): SolutionStep[] {
  const trans = transitorisch(p.fall);
  const konto = vorlageF7(p).konto;
  const buchung =
    p.fall === 'arap' || p.fall === 'sonstige-forderung'
      ? `${s.posten} an ${konto} ${eur(s.abgrenzung)}`
      : `${konto} an ${s.posten} ${eur(s.abgrenzung)}`;
  return [
    {
      titel: 'Fall erkennen',
      rechnung: trans
        ? 'Zahlung im alten Jahr, Erfolg (teilweise) im neuen Jahr'
        : 'Erfolg im alten Jahr, Zahlung im neuen Jahr',
      ergebnis: s.posten,
    },
    {
      titel: 'Monate zählen',
      rechnung: `Leistungszeitraum ${p.monate} Monate: ${s.altMonate} im alten, ${s.neuMonate} im neuen Jahr`,
      erlaeuterung: trans
        ? 'Abgegrenzt wird der Teil, der das neue Jahr betrifft.'
        : 'Erfasst wird der Teil, der das alte Jahr betrifft.',
    },
    {
      titel: 'Betrag',
      rechnung: `${eur(p.betrag)} ÷ ${p.monate} × ${s.abgrenzMonate} = ${eur(s.abgrenzung)}`,
    },
    {
      titel: 'Buchung',
      rechnung: buchung,
      erlaeuterung: trans
        ? 'Das Erfolgskonto wird um den Teil des neuen Jahres berichtigt.'
        : 'Der Erfolg des alten Jahres wird nachträglich erfasst, obwohl noch kein Geld geflossen ist.',
    },
  ];
}

export function hintsF7(p: F7Params, s: F7Solution): [string, string, string] {
  const trans = transitorisch(p.fall);
  const konto = vorlageF7(p).konto;
  return [
    'Zwei Fragen: Wann fließt das Geld (altes oder neues Jahr)? Wohin gehört der Aufwand bzw. Ertrag?',
    trans
      ? `Das Geld ist schon geflossen. Abgegrenzt wird der Anteil des neuen Jahres${
          p.monate > 1 ? `: ${s.neuMonate} von ${p.monate} Monaten` : ' – hier der ganze Betrag'
        }.`
      : `Das Geld fließt erst im neuen Jahr. Erfasst wird der Anteil des alten Jahres${
          p.monate > 1 ? `: ${s.altMonate} von ${p.monate} Monaten` : ' – hier der ganze Betrag'
        }.`,
    p.fall === 'arap' || p.fall === 'sonstige-forderung'
      ? `${s.posten} an ${konto}.`
      : `${konto} an ${s.posten}.`,
  ];
}

export function variantsF7(p: F7Params): ErrorVariant[] {
  const s = solveF7(p);
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Rechenweg) => {
    const v = rechneF7(p, w);
    out.push({ fehlertyp, parts: partsF7(p, v) });
  };
  if (p.fall === 'arap') add('arap-prap-vertauscht', { posten: PRAP });
  if (p.fall === 'prap') add('arap-prap-vertauscht', { posten: ARAP });
  const sonstig: Record<F7Fall, string> = {
    arap: SF,
    prap: SV,
    'sonstige-verbindlichkeit': PRAP,
    'sonstige-forderung': ARAP,
  };
  add('rap-statt-sonstige', { posten: sonstig[p.fall] });
  const falsch = rechneF7(p, { zeitanteilFalsch: true });
  if (!falsch.abgrenzung.value.isZero() && !falsch.abgrenzung.value.equals(s.abgrenzung.value))
    add('zeitanteil-falsch', { zeitanteilFalsch: true });
  return out;
}

const VERFAHREN: Record<F7Fall, string> = {
  arap: 'Aktive Rechnungsabgrenzung: Aufwand im Voraus bezahlt',
  prap: 'Passive Rechnungsabgrenzung: Ertrag im Voraus erhalten',
  'sonstige-verbindlichkeit':
    'Sonstige Verbindlichkeit: Aufwand des alten Jahres, Zahlung im neuen',
  'sonstige-forderung': 'Sonstige Forderung: Ertrag des alten Jahres, Einnahme im neuen',
};

export const rechnungsabgrenzung = defineGenerator<F7Params, F7Solution>({
  skillId: 'F7-rap',
  titel: 'Zeitliche Abgrenzung',
  variants: [...F7_FAELLE],
  points: 4,
  generate: generateF7,
  render: (p) => renderF7(p),
  solve: solveF7,
  parts: partsF7,
  steps: stepsF7,
  hints: hintsF7,
  errorVariants: variantsF7,
  verfahren: (p) => VERFAHREN[p.fall],
});
