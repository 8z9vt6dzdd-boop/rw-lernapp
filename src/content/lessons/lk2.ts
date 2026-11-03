// Lektion K2 – Einstufige Deckungsbeitragsrechnung (eigene Formulierung; Themen nach den
// Lehrbuch-Übungen zur Teilkostenrechnung: Stückdeckungsbeitrag, Deckungsbeitrag, Betriebsergebnis).
// Alle Beträge werden von der Engine berechnet.
import { solveBreakEven } from '../../engine/generators/k1/break-even';
import {
  dbEinstufig,
  solveDbEinstufig,
  type DbEinstufigParams,
} from '../../engine/generators/k1/db-einstufig';
import { Val, formatEuro, formatPlain } from '../../engine/money';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const eur = formatEuro;
const n = formatPlain;

const LEMON = {
  name: 'Senne Lemon 0,33 l',
  einheit: 'Flaschen',
  sg: 'Flasche',
  preis: '0.7',
  kv: '0.3',
};
const JULI_P: DbEinstufigParams = {
  variante: 'ein-produkt',
  monat: 'Juli',
  produkte: [{ ...LEMON, menge: 450_000 }],
  kf: '90000',
};
const FEB_P: DbEinstufigParams = {
  ...JULI_P,
  monat: 'Februar',
  produkte: [{ ...LEMON, menge: 150_000 }],
};
const JULI = solveDbEinstufig(JULI_P);
const FEB = solveDbEinstufig(FEB_P);
const DB = JULI.db[0]!;
// typischer Fehler: Fixkosten je Flasche im db
const FIX_JE = new Val(JULI_P.kf).div(450_000);
const FALSCH = solveDbEinstufig(JULI_P, { fixJeStueck: true }).db[0]!;
const SCHWELLE = solveBreakEven({
  ...LEMON,
  produkt: LEMON.name,
  variante: 'menge',
  zeitraum: 'Monat',
  kf: JULI_P.kf,
  kapazitaet: 0,
}).menge;
// Preissenkung auf 0,60 €: gleicher Deckungsbeitrag braucht mehr Flaschen
const DB_BILLIG = new Val('0.6').minus(LEMON.kv);
const MENGE_BILLIG = FEB.dbGesamt[0]!.div(DB_BILLIG);

// Klausurbrücke (eigene Zahlen)
const K: DbEinstufigParams = {
  variante: 'mehrere',
  monat: 'Mai',
  produkte: [
    {
      name: 'Senne Lemon 0,33 l',
      einheit: 'Flaschen',
      sg: 'Flasche',
      preis: '0.75',
      kv: '0.4',
      menge: 300_000,
    },
    {
      name: 'Paderquell Energy 0,33 l',
      einheit: 'Dosen',
      sg: 'Dose',
      preis: '0.9',
      kv: '0.5',
      menge: 400_000,
    },
    {
      name: 'Almeblick Tequila-Bier 0,33 l',
      einheit: 'Flaschen',
      sg: 'Flasche',
      preis: '1',
      kv: '0.7',
      menge: 200_000,
    },
  ],
  kf: '280000',
};
const K_TEIL = dbEinstufig
  .parts(K, solveDbEinstufig(K))
  .find((p) => p.id === 'tabelle') as TaskPart;

export const lektionK2: Lektion = {
  id: 'K2',
  skillId: 'K2-db-einstufig',
  abschnitt: 'K',
  titel: 'Deckungsbeitrag: Was von jeder Flasche übrig bleibt',
  kernAha:
    'Preis minus variable Kosten ergibt den Stückdeckungsbeitrag. Er deckt zuerst die Fixkosten, erst danach entsteht Gewinn. Eine Sorte mit positivem Deckungsbeitrag verbessert das Ergebnis, auch wenn das Betriebsergebnis noch negativ ist.',
  dauerMin: 7,
  figuren: ['frank', 'leni', 'jana', 'tobias'],
  ort: 'besprechung',
  quelle:
    'Lehrbuch-Übungen Teilkostenrechnung (Stückdeckungsbeitrag, Deckungsbeitrag, Betriebsergebnis); 04-fachregeln.md',
  teaser: {
    figur: 'frank',
    ausdruck: 'gruebelt',
    text: 'Senne Lemon hat im Februar Verlust gemacht. Fliegt die Sorte jetzt raus?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'gruebelt',
          text: `Im Februar hat Senne Lemon ${eur(FEB.be.abs())} Verlust gemacht. Sollen wir die Sorte streichen?`,
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Moment, jede verkaufte Flasche hat uns trotzdem etwas eingebracht.',
        },
      ],
      frage: 'Wie kann eine Sorte Verlust machen und trotzdem etwas einbringen?',
    },
    {
      typ: 'dialog',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Stell dir einen Stand auf dem Flohmarkt vor: Die Standgebühr zahlst du sowieso. Jedes verkaufte Stück bringt Preis minus Einkauf, und damit zahlst du die Gebühr ab.',
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Und erst wenn die Gebühr drin ist, verdiene ich wirklich etwas!',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Eine Flasche Senne Lemon bringt ${eur(LEMON.preis)}, ihre variablen Kosten betragen ${eur(LEMON.kv)}. Wie viel bleibt je Flasche für die Fixkosten?`,
      optionen: [
        { text: eur(DB), richtig: true },
        { text: eur(LEMON.preis) },
        { text: eur(FALSCH) },
      ],
      aufloesung: `${eur(LEMON.preis)} − ${eur(LEMON.kv)} = ${eur(DB)}. Die Fixkosten werden nicht je Flasche abgezogen, sondern erst vom Gesamtbetrag.`,
    },
    {
      typ: 'konzept',
      titel: 'Der Deckungsbeitrag',
      text: 'Preis minus variable Kosten je Stück ergibt den Stückdeckungsbeitrag (db). Mal Absatzmenge ergibt den Deckungsbeitrag (DB). Erst davon werden die Fixkosten abgezogen: Betriebsergebnis = DB − K_f.',
      visual: {
        typ: 'karten',
        karten: [
          { titel: 'Preis', text: `${eur(LEMON.preis)} je Flasche`, farbe: '#1c6670' },
          {
            titel: '− variable Kosten',
            text: `${eur(LEMON.kv)} je Flasche`,
            farbe: '#e8792b',
          },
          {
            titel: '= Stückdeckungsbeitrag',
            text: `${eur(DB)} je Flasche für die Fixkosten`,
            farbe: '#8cbf3f',
          },
        ],
      },
    },
    {
      typ: 'erkunden',
      titel: 'Schieb die Absatzmenge',
      text: `Die Erlösgerade steigt um ${eur(LEMON.preis)} je Flasche, die Kostengerade nur um ${eur(LEMON.kv)}. Der Abstand wächst mit jeder Flasche um den Stückdeckungsbeitrag.`,
      erkunden: {
        art: 'kostenfunktion',
        preis: LEMON.preis,
        kv: LEMON.kv,
        kf: JULI_P.kf,
        xmax: 500_000,
        einheit: 'Flaschen',
      },
      fazit: `Unter ${n(SCHWELLE.exact)} Flaschen reicht der Deckungsbeitrag nicht für die ${eur(JULI_P.kf)} Fixkosten, darüber entsteht Gewinn. Wie man diese Menge direkt berechnet, kommt in der nächsten Lektion.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Februar und Juli im Vergleich',
      text: `Fixkosten der Abfüllung: ${eur(JULI_P.kf)} im Monat, egal wie viel verkauft wird.`,
      schritte: [
        {
          text: `Februar: ${n(FEB_P.produkte[0]!.menge)} Flaschen`,
          rechnung: `DB = ${eur(DB)} × ${n(FEB_P.produkte[0]!.menge)} = ${eur(FEB.dbGesamt[0]!)}; Ergebnis ${eur(FEB.dbGesamt[0]!)} − ${eur(JULI_P.kf)} = ${eur(FEB.be)}`,
          warum: 'Der Deckungsbeitrag deckt nur einen Teil der Fixkosten.',
        },
        {
          text: `Juli: ${n(JULI_P.produkte[0]!.menge)} Flaschen`,
          rechnung: `DB = ${eur(DB)} × ${n(JULI_P.produkte[0]!.menge)} = ${eur(JULI.dbGesamt[0]!)}; Ergebnis ${eur(JULI.dbGesamt[0]!)} − ${eur(JULI_P.kf)} = ${eur(JULI.be)}`,
          warum: 'Die Fixkosten sind gedeckt, der Rest ist Gewinn.',
        },
        {
          text: 'Was sich geändert hat',
          rechnung: `Nur die Menge: Der Stückdeckungsbeitrag bleibt ${eur(DB)}.`,
          warum: 'Mehr Absatz bedeutet mehr Deckungsbeitrag bei gleichen Fixkosten.',
        },
      ],
    },
    {
      typ: 'entscheidung',
      frage:
        'Frank will Senne Lemon streichen. Halle, Anlage und Gehälter bleiben aber auch ohne die Sorte. Was rätst du?',
      figur: {
        figur: 'frank',
        ausdruck: 'gruebelt',
        text: 'Ohne Senne Lemon hätten wir im Februar keinen Verlust gehabt, oder?',
      },
      optionen: [
        {
          text: 'Streichen, die Sorte macht Verlust',
          folge: `Der Deckungsbeitrag von ${eur(FEB.dbGesamt[0]!)} fällt weg, die ${eur(JULI_P.kf)} Fixkosten bleiben. Der Verlust steigt von ${eur(FEB.be.abs())} auf ${eur(JULI_P.kf)}.`,
          ausdruck: 'entsetzt',
        },
        {
          text: 'Behalten, jede Flasche trägt zu den Fixkosten bei',
          folge: `Jede Flasche bringt ${eur(DB)} für die Fixkosten. Im Juli macht die Sorte sogar ${eur(JULI.be)} Gewinn.`,
          ausdruck: 'freut',
          empfohlen: true,
        },
        {
          text: 'Den Preis auf 0,60 € senken, um mehr zu verkaufen',
          folge: `Der Stückdeckungsbeitrag sinkt auf ${eur(DB_BILLIG)}. Für die ${eur(FEB.dbGesamt[0]!)} vom Februar bräuchte die MBG dann ${n(MENGE_BILLIG.exact)} statt ${n(FEB_P.produkte[0]!.menge)} Flaschen.`,
          ausdruck: 'gruebelt',
        },
      ],
      fazit:
        'Solange der Stückdeckungsbeitrag positiv ist und die Fixkosten ohnehin anfallen, verbessert jede verkaufte Flasche das Ergebnis.',
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege rechnet den Stückdeckungsbeitrag',
      text: 'Eine Zeile ist falsch. Tippe sie an.',
      zeilen: [
        `Preis je Flasche: ${eur(LEMON.preis)}`,
        `variable Kosten je Flasche: ${eur(LEMON.kv)}`,
        `Fixkosten je Flasche bei 450.000 Flaschen: ${eur(JULI_P.kf)} ÷ 450.000 = ${eur(FIX_JE)}`,
        `Stückdeckungsbeitrag: ${eur(LEMON.preis)} − ${eur(LEMON.kv)} − ${eur(FIX_JE)} = ${eur(FALSCH)}`,
      ],
      fehlerZeile: 3,
      gruende: [
        { text: 'Fixkosten gehören nicht in den Stückdeckungsbeitrag.', richtig: true },
        { text: 'Die Fixkosten hätten durch die Kapazität geteilt werden müssen.' },
        { text: 'Die variablen Kosten müssten addiert werden.' },
      ],
      aufloesung: `Richtig ist ${eur(LEMON.preis)} − ${eur(LEMON.kv)} = ${eur(DB)}. Die ${eur(FALSCH)} wären der Stückgewinn bei genau 450.000 Flaschen – und der ändert sich mit jeder Menge.`,
    },
    {
      typ: 'verstaendnis',
      frage:
        'Eine Sorte hat einen positiven Deckungsbeitrag, das Betriebsergebnis ist aber negativ. Was bedeutet das?',
      optionen: [
        {
          text: 'Die Sorte deckt einen Teil der Fixkosten, für Gewinn reicht der Deckungsbeitrag noch nicht.',
          richtig: true,
        },
        {
          text: 'Die Sorte macht mit jeder Flasche Verlust.',
          erklaerung: 'Nein: Jede Flasche bringt mehr ein, als sie an variablen Kosten verursacht.',
        },
        {
          text: 'Die variablen Kosten sind höher als der Preis.',
          erklaerung: 'Dann wäre schon der Stückdeckungsbeitrag negativ.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'K2-m1',
      frage: 'Wie werden Stückdeckungsbeitrag, Deckungsbeitrag und Betriebsergebnis berechnet?',
      text: 'Stückdeckungsbeitrag db = Preis − variable Kosten je Stück. Deckungsbeitrag DB = db × Absatzmenge. Betriebsergebnis = Summe der Deckungsbeiträge − Fixkosten. Fixkosten werden nie je Stück vom Preis abgezogen.',
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Eine andere Sorte, gleiches Muster. Ergänze Stückdeckungsbeitrag und Deckungsbeitrag.',
      skillId: 'K2-db-einstufig',
      seed: 3,
      variant: 'ein-produkt',
      partId: 'db',
      gefragt: ['db', 'dbGesamt'],
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe: `Für den Monat ${K.monat} liegen vor: ${K.produkte
        .map(
          (x) =>
            `${x.name}: Preis ${eur(x.preis)}, variable Kosten ${eur(x.kv)} je Stück, Absatz ${n(x.menge)} Stück`,
        )
        .join(
          '; ',
        )}. Ermitteln Sie die Stückdeckungsbeiträge sowie die Deckungsbeiträge je Sorte und insgesamt.`,
      part: K_TEIL,
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Wir planen eine neue Sorte: Senne Lemon Zero. Ab wie vielen Flaschen lohnt sie sich?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Preis 1,20 €, variable Kosten 0,70 €, Fixkosten 50.000 €. Wie hoch ist der Stückdeckungsbeitrag?',
      optionen: [{ text: '0,50 €', richtig: true }, { text: '1,20 €' }, { text: '0,70 €' }],
    },
    {
      frage: 'Deckungsbeitrag 180.000 €, Fixkosten 200.000 €. Wie hoch ist das Betriebsergebnis?',
      optionen: [{ text: '−20.000 €', richtig: true }, { text: '20.000 €' }, { text: '380.000 €' }],
    },
    {
      frage: 'Was deckt der Deckungsbeitrag?',
      optionen: [
        { text: 'Zuerst die Fixkosten, danach entsteht Gewinn.', richtig: true },
        { text: 'Die variablen Kosten.' },
        { text: 'Nur den Gewinn.' },
      ],
    },
  ],
  checkliste: {
    raetsel: true,
    alltagVorFachbegriff: true,
    kernAhaErreicht: true,
    figurImDialog: true,
    klausurbrueckeUndCliffhanger: true,
    fachlichGeprueft:
      'Lehrbuch-Übungen Teilkostenrechnung (Stückdeckungsbeitrag, Betriebsergebnis mehrerer Erzeugnisse, Rückrechnung aus dem Betriebsgewinn) inhaltlich abgeglichen am 03.11.2026; Definition Deckungsbeitrag deckungsgleich mit K1 Kap. 1.5',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
