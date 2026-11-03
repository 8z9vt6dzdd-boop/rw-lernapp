// Lektion K3 – Gewinnschwelle (eigene Formulierung; Themen nach den Lehrbuch-Übungen zur
// Teilkostenrechnung: Gewinnschwellenmenge, Beschäftigungsgrad, kritische Menge zweier Anlagen).
// Zahlen aus GC-21 (04-fachregeln.md), alle Beträge werden von der Engine berechnet.
import {
  breakEven,
  solveBreakEven,
  type BreakEvenParams,
} from '../../engine/generators/k1/break-even';
import { Val, formatEuro, formatPlain, formatProzent } from '../../engine/money';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const eur = formatEuro;
const n = formatPlain;

// GC-21 Senne Lemon Zero
const ZERO: BreakEvenParams = {
  produkt: 'Senne Lemon Zero',
  einheit: 'Flaschen',
  sg: 'Flasche',
  variante: 'menge',
  zeitraum: 'Jahr',
  preis: '0.9',
  kv: '0.5',
  kf: '120000',
  kapazitaet: 0,
};
const S = solveBreakEven(ZERO);
const PLAN = 250_000;
const ERGEBNIS_PLAN = S.db.times(PLAN).minus(ZERO.kf);
const FALSCHER_GEWINN = new Val(ZERO.preis).times(PLAN).minus(ZERO.kf);
const FALSCH_PREIS = solveBreakEven(ZERO, { preisStattDb: true }).menge;

// Nicht ganzzahlige Gewinnschwelle (eigene Zahlen)
const KRUMM: BreakEvenParams = { ...ZERO, preis: '0.8', kv: '0.5', kf: '100000' };
const SK = solveBreakEven(KRUMM);
const ABGERUNDET = SK.menge.minus(1);
const FEHLBETRAG = new Val(KRUMM.kf).minus(SK.db.times(ABGERUNDET));

// Kritische Menge zweier Etikettierer (eigene Zahlen)
const ETIKETT: BreakEvenParams = {
  ...ZERO,
  produkt: 'alle Sorten',
  variante: 'verfahren',
  zeitraum: 'Monat',
  kf: '0',
  anlagen: [
    { name: 'Etikettierer A', kf: '10000', kv: '0.12' },
    { name: 'Etikettierer B', kf: '25000', kv: '0.07' },
  ],
  planMenge: 400_000,
};
const SE = solveBreakEven(ETIKETT);
const [A, B] = ETIKETT.anlagen!;

// Klausurbrücke (eigene Zahlen)
const K: BreakEvenParams = {
  produkt: 'Paderquell Energy 0,5 l',
  einheit: 'Dosen',
  sg: 'Dose',
  variante: 'menge',
  zeitraum: 'Jahr',
  preis: '1.2',
  kv: '0.75',
  kf: '180000',
  kapazitaet: 1_000_000,
};
const K_TEIL = breakEven.parts(K, solveBreakEven(K)).find((p) => p.id === 'bep') as TaskPart;

export const lektionK3: Lektion = {
  id: 'K3',
  skillId: 'K3-break-even',
  abschnitt: 'K',
  titel: 'Gewinnschwelle: Ab wann lohnt sich Senne Lemon Zero?',
  kernAha:
    'Die Gewinnschwelle ist erreicht, wenn die Deckungsbeiträge genau die Fixkosten decken: Fixkosten ÷ Stückdeckungsbeitrag, auf ganze Stück aufgerundet. Darunter entsteht Verlust, darüber Gewinn.',
  dauerMin: 8,
  figuren: ['leni', 'tobias', 'jana', 'frank'],
  ort: 'besprechung',
  quelle:
    'Lehrbuch-Übungen Teilkostenrechnung (Gewinnschwelle rechnerisch, Beschäftigungsgrad, Vergleich zweier Anlagen); GC-21 aus 04-fachregeln.md',
  teaser: {
    figur: 'tobias',
    ausdruck: 'freut',
    text: 'Senne Lemon Zero kommt! Ich verkaufe davon locker eine Viertelmillion Flaschen.',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: `Senne Lemon Zero: ${eur(ZERO.preis)} Preis, ${eur(ZERO.kv)} variable Kosten je Flasche und ${eur(ZERO.kf)} zusätzliche Fixkosten im Jahr.`,
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: `Ich verkaufe im ersten Jahr locker ${n(PLAN)} Flaschen!`,
        },
      ],
      frage: `Reichen ${n(PLAN)} Flaschen, damit sich die neue Sorte lohnt?`,
    },
    {
      typ: 'dialog',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Ein Foodtruck zahlt jeden Monat Pacht, egal wie viele Burger er verkauft. Erst ab einer bestimmten Zahl Burger ist die Pacht verdient.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Diese Menge heißt Gewinnschwelle oder Break-even-Punkt. Darunter Verlust, darüber Gewinn.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Was bringen ${n(PLAN)} Flaschen Senne Lemon Zero im ersten Jahr?`,
      optionen: [
        { text: `Einen Verlust von ${eur(ERGEBNIS_PLAN.abs())}`, richtig: true },
        { text: `Einen Gewinn von ${eur(FALSCHER_GEWINN)}` },
        { text: 'Genau null' },
      ],
      aufloesung: `Deckungsbeitrag: ${n(PLAN)} × ${eur(S.db)} = ${eur(S.db.times(PLAN))}. Das reicht nicht für ${eur(ZERO.kf)} Fixkosten. Tobias’ Plan liegt unter der Gewinnschwelle.`,
    },
    {
      typ: 'konzept',
      titel: 'Die Gewinnschwelle',
      text: 'An der Gewinnschwelle decken die Deckungsbeiträge genau die Fixkosten. Gewinnschwellenmenge = Fixkosten ÷ Stückdeckungsbeitrag. Geht die Rechnung nicht auf, wird auf ganze Stück aufgerundet.',
      visual: {
        typ: 'kostenfunktion',
        preis: ZERO.preis,
        kv: ZERO.kv,
        kf: ZERO.kf,
        xmax: 500_000,
        einheit: 'Flaschen',
      },
    },
    {
      typ: 'erkunden',
      titel: 'Finde den Schnittpunkt',
      text: 'Schieb die Absatzmenge und beobachte das Ergebnis. Wo schneiden sich Erlös- und Kostengerade?',
      erkunden: {
        art: 'kostenfunktion',
        preis: ZERO.preis,
        kv: ZERO.kv,
        kf: ZERO.kf,
        xmax: 500_000,
        einheit: 'Flaschen',
      },
      fazit: `Bei ${n(S.menge.exact)} Flaschen ist das Ergebnis genau null. Jede weitere Flasche bringt ${eur(S.db)} Gewinn.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Gewinnschwelle von Senne Lemon Zero',
      schritte: [
        {
          text: 'Stückdeckungsbeitrag',
          rechnung: `${eur(ZERO.preis)} − ${eur(ZERO.kv)} = ${eur(S.db)}`,
          warum: 'So viel trägt jede Flasche zur Deckung der Fixkosten bei.',
        },
        {
          text: 'Gewinnschwellenmenge',
          rechnung: `${eur(ZERO.kf)} ÷ ${eur(S.db)} = ${n(S.menge.exact)} Flaschen`,
          warum: 'So viele Flaschen braucht es, bis die Fixkosten gedeckt sind.',
        },
        {
          text: 'Break-even-Umsatz',
          rechnung: `${n(S.menge.exact)} × ${eur(ZERO.preis)} = ${eur(S.umsatz)}`,
          warum: 'Den Umsatz an der Gewinnschwelle fragen Klausuren gern zusätzlich ab.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: `Eine andere Variante hätte ${eur(KRUMM.kf)} Fixkosten und ${eur(SK.db)} Stückdeckungsbeitrag. Wo liegt die Gewinnschwelle?`,
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: `${eur(KRUMM.kf)} ÷ ${eur(SK.db)} ergibt ${n(SK.mengeExakt.exact, 2)}, also reichen ${n(ABGERUNDET.exact)} Flaschen.`,
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: `Wir brauchen ${n(SK.menge.exact)} Flaschen, sonst bleibt ein kleiner Verlust.`,
      },
      richtig: 'b',
      begruendungen: [
        { text: 'Erst die nächste ganze Flasche deckt die Fixkosten vollständig.', richtig: true },
        { text: 'Mengen werden kaufmännisch gerundet.' },
        { text: 'Gewinnschwellen werden immer auf volle Tausend gerundet.' },
      ],
      aufloesung: `${n(ABGERUNDET.exact)} × ${eur(SK.db)} = ${eur(SK.db.times(ABGERUNDET))}, es fehlen noch ${eur(FEHLBETRAG)}. Deshalb wird bei der Gewinnschwelle immer aufgerundet.`,
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege rechnet die Gewinnschwelle',
      text: 'Eine Zeile ist falsch. Tippe sie an.',
      zeilen: [
        `Preis je Flasche: ${eur(ZERO.preis)}`,
        `Fixkosten im Jahr: ${eur(ZERO.kf)}`,
        `Gewinnschwelle: ${eur(ZERO.kf)} ÷ ${eur(ZERO.preis)} = ${n(FALSCH_PREIS.exact)} Flaschen`,
      ],
      fehlerZeile: 2,
      gruende: [
        {
          text: 'Es muss durch den Stückdeckungsbeitrag geteilt werden, nicht durch den Preis.',
          richtig: true,
        },
        { text: 'Es hätte abgerundet werden müssen.' },
        { text: 'Die Fixkosten müssen mit dem Preis multipliziert werden.' },
      ],
      aufloesung: `Von ${eur(ZERO.preis)} gehen ${eur(ZERO.kv)} für variable Kosten weg. Nur ${eur(S.db)} je Flasche decken Fixkosten: ${n(S.menge.exact)} Flaschen.`,
    },
    {
      typ: 'entscheidung',
      frage: `Für die ganze Abfüllung braucht die MBG einen neuen Etikettierer. ${A.name}: ${eur(A.kf)} Fixkosten im Monat und ${eur(A.kv)} je Flasche. ${B.name}: ${eur(B.kf)} und ${eur(B.kv)} je Flasche. Geplant sind ${n(ETIKETT.planMenge!)} Flaschen im Monat.`,
      figur: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Bei welcher Menge kosten beide Maschinen gleich viel? Das ist die kritische Menge.',
      },
      optionen: [
        {
          text: `${A.name}, weil die Fixkosten niedriger sind`,
          folge: `Bei ${n(ETIKETT.planMenge!)} Flaschen kostet ${A.name} ${eur(SE.kostenA)}, ${B.name} nur ${eur(SE.kostenB)}. Niedrige Fixkosten lohnen sich nur unter ${n(SE.kritisch.exact)} Flaschen.`,
          ausdruck: 'ueberrascht',
        },
        {
          text: `${B.name}, weil die Planmenge über der kritischen Menge liegt`,
          folge: `Kritische Menge: (${eur(B.kf)} − ${eur(A.kf)}) ÷ (${eur(A.kv)} − ${eur(B.kv)}) = ${n(SE.kritisch.exact)} Flaschen. Bei ${n(ETIKETT.planMenge!)} Flaschen spart ${B.name} ${eur(SE.kostenA.minus(SE.kostenB))} im Monat.`,
          ausdruck: 'freut',
          empfohlen: true,
        },
      ],
      fazit:
        'Kritische Menge = Differenz der Fixkosten ÷ Differenz der variablen Kosten je Stück. Darüber lohnt das Verfahren mit den niedrigeren variablen Kosten, darunter das mit den niedrigeren Fixkosten.',
    },
    {
      typ: 'merksatz',
      id: 'K3-m1',
      frage: 'Wie berechnet man Gewinnschwellenmenge, Break-even-Umsatz und kritische Menge?',
      text: 'Gewinnschwellenmenge = Fixkosten ÷ Stückdeckungsbeitrag, auf ganze Stück aufgerundet. Break-even-Umsatz = Gewinnschwellenmenge × Preis. Kritische Menge zweier Verfahren = Differenz der Fixkosten ÷ Differenz der variablen Kosten je Stück.',
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Eine andere Sorte, gleiches Muster. Ergänze Stückdeckungsbeitrag und Gewinnschwellenmenge.',
      skillId: 'K3-break-even',
      seed: 2,
      variant: 'menge',
      partId: 'bep',
      gefragt: ['db', 'menge'],
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe: `Für ${K.produkt} gelten: Nettoverkaufspreis ${eur(K.preis)} je Dose, variable Kosten ${eur(K.kv)} je Dose, fixe Kosten ${eur(K.kf)} im Jahr, Kapazität ${n(K.kapazitaet)} Dosen im Jahr. Ermitteln Sie den Stückdeckungsbeitrag, die Gewinnschwellenmenge, den Umsatz an der Gewinnschwelle und den Beschäftigungsgrad an der Gewinnschwelle.`,
      part: K_TEIL,
      cliffhanger: {
        figur: 'frank',
        ausdruck: 'gruebelt',
        text: 'Mit Zero hätten wir drei Softdrinks und ein Bier. Aber trägt sich unser Tequila-Bier überhaupt?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Fixkosten 60.000 €, Preis 1,00 €, variable Kosten 0,70 € je Stück. Wo liegt die Gewinnschwelle?',
      optionen: [
        { text: '200.000 Stück', richtig: true },
        { text: '60.000 Stück' },
        { text: '85.715 Stück' },
      ],
    },
    {
      frage: 'Die Rechnung ergibt 41.666,67 Stück. Welche Gewinnschwellenmenge gibst du an?',
      optionen: [
        { text: '41.667 Stück', richtig: true },
        { text: '41.666 Stück' },
        { text: '41.000 Stück' },
      ],
    },
    {
      frage: `Gewinnschwelle 400.000 Stück, Kapazität 1.000.000 Stück. Beschäftigungsgrad an der Gewinnschwelle?`,
      optionen: [
        { text: formatProzent('0.4'), richtig: true },
        { text: '250 %' },
        { text: '60 %' },
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
      'GC-21 (04-fachregeln.md) und Lehrbuch-Übungen Teilkostenrechnung (Gewinnschwelle, Beschäftigungsgrad an der Gewinnschwelle, Kostenvergleich zweier Anlagen) inhaltlich abgeglichen am 03.11.2026; Aufrunden auf ganze Stück nach 03-aufgabentypen.md',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
