// C3 – Rücksendungen an den Lieferer als Stornobuchung (Lehrbrief BA 3.1.3 und 3.1.5;
// 04-fachregeln.md, Konvention 5 und GC-06; Spezifikation in docs/m7/c1.md).
import { nachlassKonto, type Stoff } from '../../accounts';
import { loesung, satz, zeile, type BuchungsLoesung } from '../../booking';
import { Val, dec } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, GenOptions, SolutionStep, TaskPart, TaskText } from '../../task';
import { FIRMA } from '../../../config';
import { betrag, defineGenerator, eur, feld, isKrumm, pct, plain, retry } from '../base';
import {
  einheitSingular,
  einkaufsKonto,
  GEGENSTAENDE,
  KONTEXT_C,
  steuerAuf,
  waehleStoff,
  zerlege,
  type Erfassung,
} from './common';

export type C3Variante = 'netto' | 'brutto' | 'anteil' | 'rabatt' | 'aufwand';

export interface C3Params {
  variante: C3Variante;
  erfassung: Erfassung;
  stoff: Stoff;
  gegenstand: string;
  einheit: string;
  partner: string;
  ustSatz: string;
  /** netto, aufwand: Warenwert der Rücksendung netto */
  netto: string;
  /** brutto: Gutschrift des Lieferers brutto */
  brutto: string;
  /** anteil: gelieferte Menge, zurückgesandte Menge, Einzelpreis netto */
  menge: number;
  zurueck: number;
  preis: string;
  /** rabatt: Listenpreis der zurückgesandten Ware und Sofortrabatt */
  listenpreis: string;
  rabatt: string;
  grund: string;
  vorlage: number;
}

export interface C3Solution {
  /** Warenwert der Rücksendung netto */
  netto: Val;
  vorsteuer: Val;
  /** Gutschrift brutto = Minderung der Verbindlichkeit */
  gutschrift: Val;
  buchung: BuchungsLoesung;
}

const VERB = 'Verbindlichkeiten aus Lieferungen und Leistungen';

interface Rechenweg {
  /** Bruttobetrag der Gutschrift als Nettowert behandelt */
  bruttoAlsNetto?: boolean;
  /** Listenpreis statt rabattiertem Preis */
  ohneRabatt?: boolean;
  /** keine Vorsteuer herausgerechnet */
  ohneSteuer?: boolean;
}

export function rechneC3(p: C3Params, w: Rechenweg = {}) {
  let netto: Val;
  switch (p.variante) {
    case 'brutto':
      netto = w.bruttoAlsNetto
        ? new Val(p.brutto)
        : w.ohneSteuer
          ? new Val(p.brutto)
          : zerlege(new Val(p.brutto), p.ustSatz).netto;
      break;
    case 'anteil':
      netto = new Val(p.preis).times(p.zurueck).fix();
      break;
    case 'rabatt':
      netto = w.ohneRabatt
        ? new Val(p.listenpreis)
        : new Val(p.listenpreis).times(dec(1).minus(p.rabatt)).fix();
      break;
    default:
      netto = new Val(p.netto);
  }
  let vorsteuer: Val;
  let gutschrift: Val;
  if (w.ohneSteuer) {
    vorsteuer = new Val(0);
    gutschrift = netto;
  } else if (p.variante === 'brutto' && !w.bruttoAlsNetto) {
    gutschrift = new Val(p.brutto);
    vorsteuer = gutschrift.minus(netto);
  } else {
    vorsteuer = steuerAuf(netto, p.ustSatz);
    gutschrift = netto.plus(vorsteuer);
  }
  return { netto, vorsteuer, gutschrift };
}

type Werte = ReturnType<typeof rechneC3>;

function buchungC3(
  p: C3Params,
  v: Werte,
  k: { konto?: string; steuerKonto?: string } = {},
): BuchungsLoesung {
  const konto = k.konto ?? einkaufsKonto(p.stoff, p.erfassung);
  return loesung([
    satz(
      [zeile(VERB, v.gutschrift)],
      v.vorsteuer.exact.isZero()
        ? [zeile(konto, v.netto)]
        : [zeile(konto, v.netto), zeile(k.steuerKonto ?? 'Vorsteuer', v.vorsteuer)],
      'Rücksendung',
    ),
  ]);
}

export function solveC3(p: C3Params): C3Solution {
  const v = rechneC3(p);
  return { ...v, buchung: buchungC3(p, v) };
}

function c3Parts(p: C3Params, s: C3Solution): TaskPart[] {
  const felder =
    p.variante === 'brutto'
      ? [
          feld('netto', 'Warenwert der Rücksendung netto', s.netto),
          feld('vorsteuer', 'Vorsteuerkorrektur', s.vorsteuer),
        ]
      : p.variante === 'netto' || p.variante === 'aufwand'
        ? [
            feld('vorsteuer', 'Vorsteuerkorrektur', s.vorsteuer),
            feld('gutschrift', 'Gutschrift (brutto)', s.gutschrift),
          ]
        : [
            feld('netto', 'Warenwert der Rücksendung netto', s.netto),
            feld('vorsteuer', 'Vorsteuerkorrektur', s.vorsteuer),
            feld('gutschrift', 'Gutschrift (brutto)', s.gutschrift),
          ];
  return [
    { typ: 'rechenkette', id: 'rechnung', titel: 'Gutschrift berechnen', felder },
    {
      typ: 'buchungssatz',
      id: 'buchung',
      titel: 'Buchungssatz für die Rücksendung',
      loesung: s.buchung,
    },
  ];
}

const GRUENDE = [
  'weil die Verpackung beim Transport beschädigt wurde',
  'weil eine falsche Sorte geliefert wurde',
  'weil die Eingangskontrolle Qualitätsmängel festgestellt hat',
  'weil mehr geliefert wurde als bestellt',
];

function generateC3(rng: Rng, opts: GenOptions = {}): C3Params {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const alle: C3Variante[] = ['netto', 'brutto', 'anteil', 'rabatt', 'aufwand'];
  const variante: C3Variante = alle.includes(opts.variant as C3Variante)
    ? (opts.variant as C3Variante)
    : rng.pick<C3Variante>(['netto', 'netto', 'brutto', 'brutto', 'anteil', 'rabatt', 'aufwand']);
  const { stoff, index, gegenstand, partner } = waehleStoff(rng, FIRMA);
  const g = GEGENSTAENDE[stoff][index]!;
  const grund = rng.pick(GRUENDE);
  const vorlage = rng.int(0, 1);
  const make = (r: Rng): C3Params => {
    const netto = betrag(r, 200, 15_000, 50, krumm);
    const menge = Math.round(r.step(2_000, 40_000, 100) / Number(g.preis));
    const p: C3Params = {
      variante,
      erfassung: variante === 'aufwand' ? 'aufwand' : 'bestand',
      stoff,
      gegenstand,
      einheit: g.einheit,
      partner,
      ustSatz: '0.19',
      netto,
      brutto: krumm
        ? betrag(r, 200, 15_000, 1, true)
        : dec(r.step(200, 15_000, 50))
            .times('1.19')
            .toFixed(2),
      menge,
      zurueck: Math.round(menge * r.pick([0.1, 0.2, 0.25, 0.5])),
      preis: g.preis,
      listenpreis: betrag(r, 500, 20_000, 100, krumm),
      rabatt: r.pick(['0.05', '0.1', '0.15', '0.2', '0.25']),
      grund,
      vorlage,
    };
    return p;
  };
  return retry(rng, make, (p) => {
    if (p.variante !== 'anteil') return true;
    // Mengen ganzzahlig, Warenwert der Lieferung in vollen Euro (klausurfreundlich)
    const wert = dec(p.preis).times(p.menge);
    return (
      Number.isInteger(p.zurueck) &&
      p.zurueck > 0 &&
      wert.isInteger() &&
      dec(p.preis).times(p.zurueck).isInteger() &&
      p.menge % 10 === 0 &&
      p.zurueck % (p.menge >= 1_000 ? 100 : 10) === 0
    );
  });
}

function renderC3(p: C3Params): TaskText {
  const u = pct(p.ustSatz);
  const titel = 'Rücksendung an den Lieferer';
  const erfassung =
    p.erfassung === 'aufwand'
      ? `Die MBG hat diesen Einkauf aufwandsorientiert erfasst (Lieferung direkt in die Produktion).`
      : 'Die MBG erfasst ihre Einkäufe bestandsorientiert.';
  switch (p.variante) {
    case 'netto':
    case 'aufwand':
      return {
        titel,
        kontext: KONTEXT_C,
        sachverhalt: [
          p.vorlage === 0
            ? `Die MBG schickt einen Teil einer Lieferung ${p.gegenstand} an ${p.partner} zurück, ${p.grund}. Der Warenwert der Rücksendung beträgt ${eur(p.netto)} netto.`
            : `${p.partner} erteilt der MBG eine Gutschrift für zurückgesandte Ware (${p.gegenstand}) im Wert von ${eur(p.netto)} netto zuzüglich ${u} Umsatzsteuer. Grund: Die Ware ging zurück, ${p.grund}.`,
          `Die ursprüngliche Rechnung ist noch nicht bezahlt. ${erfassung}`,
        ],
        aufgabe: 'Berechne die Gutschrift und bilde den Buchungssatz für die Rücksendung.',
      };
    case 'brutto':
      return {
        titel,
        kontext: KONTEXT_C,
        sachverhalt: [
          `Die MBG hat ${p.gegenstand} an ${p.partner} zurückgeschickt, ${p.grund}.`,
          `Der Lieferer schickt eine Gutschrift über ${eur(p.brutto)} einschließlich ${u} Umsatzsteuer. Die Rechnung ist noch offen. ${erfassung}`,
        ],
        aufgabe: 'Zerlege die Gutschrift und bilde den Buchungssatz für die Rücksendung.',
      };
    case 'anteil': {
      const wert = new Val(p.preis).times(p.menge).fix();
      return {
        titel,
        kontext: KONTEXT_C,
        sachverhalt: [
          `${p.partner} hat ${plain(p.menge)} ${p.einheit} ${p.gegenstand} zu ${eur(p.preis)} je ${einheitSingular(p.einheit)} netto geliefert (Warenwert ${eur(wert)} zuzüglich ${u} Umsatzsteuer, auf Ziel).`,
          `Die MBG sendet ${plain(p.zurueck)} ${p.einheit} zurück, ${p.grund}. ${erfassung}`,
        ],
        aufgabe:
          'Berechne Warenwert, Vorsteuerkorrektur und Gutschrift und bilde den Buchungssatz.',
      };
    }
    case 'rabatt':
      return {
        titel,
        kontext: KONTEXT_C,
        sachverhalt: [
          `Die MBG sendet ${p.gegenstand} an ${p.partner} zurück, ${p.grund}.`,
          `Die Ware war zum Listenpreis von ${eur(p.listenpreis)} abzüglich ${pct(p.rabatt)} Sofortrabatt zuzüglich ${u} Umsatzsteuer berechnet worden. Die Rechnung ist noch offen. ${erfassung}`,
        ],
        aufgabe: 'Berechne die Gutschrift und bilde den Buchungssatz für die Rücksendung.',
      };
  }
}

function c3Steps(p: C3Params, s: C3Solution): SolutionStep[] {
  const u = pct(p.ustSatz);
  const konto = einkaufsKonto(p.stoff, p.erfassung);
  const steps: SolutionStep[] = [];
  if (p.variante === 'brutto') {
    steps.push(
      {
        titel: 'Warenwert netto',
        rechnung: `${eur(p.brutto)} ÷ (1 + ${u}) = ${eur(s.netto)}`,
      },
      {
        titel: 'Vorsteuerkorrektur',
        rechnung: `${eur(p.brutto)} − ${eur(s.netto)} = ${eur(s.vorsteuer)}`,
      },
    );
  } else {
    if (p.variante === 'anteil')
      steps.push({
        titel: 'Warenwert der Rücksendung',
        rechnung: `${plain(p.zurueck)} ${p.einheit} × ${eur(p.preis)} = ${eur(s.netto)}`,
      });
    if (p.variante === 'rabatt')
      steps.push({
        titel: 'Rabattierter Warenwert',
        rechnung: `${eur(p.listenpreis)} × (1 − ${pct(p.rabatt)}) = ${eur(s.netto)}`,
        erlaeuterung:
          'Sofortrabatte wurden nie gebucht. Zurückgebucht wird der Wert, der tatsächlich auf dem Konto steht.',
      });
    steps.push(
      {
        titel: 'Vorsteuerkorrektur',
        rechnung: `${eur(s.netto)} × ${u} = ${eur(s.vorsteuer)}`,
      },
      {
        titel: 'Gutschrift',
        rechnung: `${eur(s.netto)} + ${eur(s.vorsteuer)} = ${eur(s.gutschrift)}`,
      },
    );
  }
  steps.push({
    titel: 'Stornobuchung',
    rechnung: `Verbindlichkeiten a. LL ${eur(s.gutschrift)} an ${konto} ${eur(s.netto)}, an Vorsteuer ${eur(s.vorsteuer)}`,
    erlaeuterung:
      p.erfassung === 'aufwand'
        ? 'Die Rücksendung macht den Einkauf teilweise rückgängig: zurück auf das Konto, auf dem der Einkauf gebucht wurde – hier das Aufwandskonto.'
        : 'Die Rücksendung macht den Einkauf teilweise rückgängig: Die Einkaufsbuchung wird mit vertauschten Seiten wiederholt.',
  });
  return steps;
}

function c3Hints(p: C3Params, s: C3Solution): [string, string, string] {
  const konto = einkaufsKonto(p.stoff, p.erfassung);
  return [
    'Eine Rücksendung ist ein Storno: Die Einkaufsbuchung wird für die zurückgeschickte Menge umgekehrt.',
    p.variante === 'brutto'
      ? `Netto = Gutschrift ÷ (1 + ${pct(p.ustSatz)}); die Differenz korrigiert die Vorsteuer.`
      : `Vorsteuerkorrektur = Warenwert netto × ${pct(p.ustSatz)}.`,
    `Verbindlichkeiten a. LL ${eur(s.gutschrift)} an ${konto} ${eur(s.netto)}, an Vorsteuer ${eur(s.vorsteuer)}.`,
  ];
}

function c3Variants(p: C3Params): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const mk = (
    fehlertyp: string,
    w: Rechenweg,
    k: { konto?: string; steuerKonto?: string } = {},
  ) => {
    const v = rechneC3(p, w);
    out.push({ fehlertyp, parts: c3Parts(p, { ...v, buchung: buchungC3(p, v, k) }) });
  };
  mk('ruecksendung-als-nachlass', {}, { konto: nachlassKonto(p.stoff) });
  mk('ruecksendung-ohne-vorsteuer', { ohneSteuer: true });
  mk('steuer-falsches-konto', {}, { steuerKonto: 'Umsatzsteuer' });
  if (p.variante === 'brutto') mk('gutschrift-brutto-als-netto', { bruttoAlsNetto: true });
  if (p.variante === 'rabatt') mk('sofortrabatt-nicht-abgezogen', { ohneRabatt: true });
  if (p.variante === 'aufwand') mk('erfassungsmethode-verwechselt', {}, { konto: p.stoff });
  return out;
}

export const ruecksendungEinkauf = defineGenerator<C3Params, C3Solution>({
  skillId: 'C3-ruecksendung-einkauf',
  titel: 'Rücksendung an den Lieferer',
  variants: ['netto', 'brutto', 'anteil', 'rabatt', 'aufwand'],
  points: 2,
  generate: generateC3,
  render: (p) => renderC3(p),
  solve: solveC3,
  parts: c3Parts,
  steps: c3Steps,
  hints: c3Hints,
  errorVariants: c3Variants,
  verfahren: () => 'Rücksendung an den Lieferer: Stornobuchung mit Vorsteuerkorrektur',
});
