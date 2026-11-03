// Lektion K8 – Voll- oder Teilkostenrechnung (eigene Formulierung; Inhalt nach K1 Kap. 1.5–1.6,
// S. 34–38: Verursachungsprinzip, Voll- und Teilkostenrechnung; K2 Kap. 2.1, S. 51–52: Kalkulation
// für Bestandsbewertung und dispositive Zwecke). Alle Beträge werden mit der Engine gerechnet.
import { Val, formatEuro, formatPlain } from '../../engine/money';
import type { KurzantwortPart } from '../../engine/task';
import type { Lektion } from './types';

// Beispiel: Almeblick Tequila-Bier „macht Verlust“ – nach Vollkosten
const PREIS = '0.9';
const KV = '0.6';
const FIX_JE_FLASCHE = '0.35';
const MENGE = 200_000;
const selbstkosten = new Val(KV).plus(FIX_JE_FLASCHE);
const verlustJeFlasche = new Val(PREIS).minus(selbstkosten);
const vollkostenErgebnis = verlustJeFlasche.times(MENGE);
const db = new Val(PREIS).minus(KV).times(MENGE);
const fixGesamt = new Val(FIX_JE_FLASCHE).times(MENGE);

// Ferienwohnung als Alltagsvergleich
const MIETE = new Val('900');
const DRITTEL = MIETE.div(3);
const HAELFTE = MIETE.div(2);

const e = formatEuro;
const n = formatPlain;

const KLAUSUR: KurzantwortPart = {
  typ: 'kurzantwort',
  id: 'k8-kurz',
  frage:
    'Erläutern Sie, warum eine Entscheidung auf Basis der Vollkostenrechnung kurzfristig zu einem schlechteren Betriebsergebnis führen kann.',
  punkte: 4,
  checkliste: [
    {
      aussage:
        'Die Vollkostenrechnung verteilt auch fixe Gemeinkosten über Schlüssel und Zuschläge auf die Stücke.',
      punkte: 1,
    },
    {
      aussage: 'Dadurch wirken fixe Kosten je Stück so, als würden sie mit der Menge entstehen.',
      punkte: 1,
    },
    {
      aussage:
        'Kurzfristig fallen die Fixkosten aber unabhängig von der Entscheidung an; sie bleiben auch, wenn ein Produkt oder Auftrag wegfällt.',
      punkte: 1,
    },
    {
      aussage:
        'Entscheidungsrelevant ist daher der Deckungsbeitrag: Ein Produkt mit positivem Deckungsbeitrag zu streichen oder einen solchen Auftrag abzulehnen, verschlechtert das Ergebnis.',
      punkte: 1,
    },
  ],
  muster:
    'Die Vollkostenrechnung rechnet alle Kosten den Kostenträgern zu, die fixen Gemeinkosten über Schlüssel und Zuschlagssätze. Je Stück sehen diese Fixkosten dann aus wie Kosten, die mit jeder Einheit entstehen. Kurzfristig ändern sie sich aber durch die Entscheidung nicht: Streicht man ein Produkt oder lehnt einen Auftrag ab, bleiben sie bestehen und müssen von den übrigen Produkten getragen werden. Maßgeblich ist deshalb der Deckungsbeitrag. Ist er positiv, verbessert das Produkt oder der Auftrag das Ergebnis, auch wenn der Preis unter den Selbstkosten liegt.',
};

export const lektionK8: Lektion = {
  id: 'K8',
  skillId: 'K8-voll-vs-teil',
  abschnitt: 'K',
  titel: 'Voll- oder Teilkosten: Welche Brille wofür?',
  kernAha:
    'Die Vollkostenrechnung verteilt Fixkosten auf die Stücke und lässt sie wie variable Kosten aussehen. Für kurzfristige Entscheidungen zählt deshalb der Deckungsbeitrag; für langfristige Preise und die Bewertung der Bestände braucht man weiter die vollen Kosten.',
  dauerMin: 7,
  figuren: ['frank', 'leni', 'jana'],
  ort: 'gesellschafter',
  quelle:
    'K1 Kap. 1.5–1.6 (S. 34–38); K2 Kap. 2.1 (S. 51–52); Lehrbuch-Übungen Deckungsbeitragsrechnung',
  teaser: {
    figur: 'frank',
    ausdruck: 'gruebelt',
    text: 'Laut Kalkulation macht unser Tequila-Bier Verlust. Weg damit?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'entsetzt',
          text: `Selbstkosten ${e(selbstkosten)}, Preis ${e(PREIS)}: Das Tequila-Bier verliert an jeder Flasche ${e(verlustJeFlasche.abs())}. Streichen wir es!`,
        },
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: 'Moment. Was passiert mit den Fixkosten, die wir dem Bier zugerechnet haben?',
        },
      ],
      frage: 'Steigt der Gewinn der MBG, wenn sie das Tequila-Bier streicht?',
    },
    {
      typ: 'dialog',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: `Drei Freunde mieten eine Ferienwohnung für ${e(MIETE)}. Springt einer ab, weil ihm ${e(DRITTEL)} zu viel sind, zahlen die anderen je ${e(HAELFTE)}.`,
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'So wirken verteilte Fixkosten. Sie verschwinden nicht, sie wandern zu den anderen Sorten.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Das Bier verkauft ${n(MENGE)} Flaschen im Jahr; die zugerechneten Fixkosten von ${e(fixGesamt)} bleiben auch ohne das Bier. Wie verändert sich das Betriebsergebnis, wenn die MBG es streicht?`,
      optionen: [
        { text: `Es sinkt um ${e(db)}.`, richtig: true },
        {
          text: `Es steigt um ${e(vollkostenErgebnis.abs())}.`,
          erklaerung: 'So rechnet die Vollkostenrechnung. Die Fixkosten fallen aber weiter an.',
        },
        {
          text: 'Es bleibt gleich.',
          erklaerung: 'Mit dem Bier fällt auch sein Deckungsbeitrag weg.',
        },
      ],
      aufloesung: `Mit dem Bier fallen Erlöse und variable Kosten weg, also sein Deckungsbeitrag: (${e(PREIS)} − ${e(KV)}) × ${n(MENGE)} = ${e(db)}. Die ${e(fixGesamt)} Fixkosten tragen künftig die anderen Sorten.`,
    },
    {
      typ: 'konzept',
      titel: 'Zwei Brillen auf die Kosten',
      text: 'Vollkostenrechnung: alle Kosten auf die Produkte, Gemeinkosten über Schlüssel und Zuschläge. Teilkostenrechnung: nur die verursachten, variablen Kosten auf die Produkte; die Fixkosten als Block ins Betriebsergebnis.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Vollkosten',
            text: `Bier: ${e(PREIS)} − ${e(selbstkosten)} = ${e(verlustJeFlasche)} je Flasche`,
            farbe: '#e8792b',
          },
          {
            titel: 'Teilkosten',
            text: `Bier: ${e(PREIS)} − ${e(KV)} = ${e(new Val(PREIS).minus(KV))} Deckungsbeitrag je Flasche`,
            farbe: '#8cbf3f',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Welche Brille passt?',
      text: 'Welche Rechnung brauchst du für die Frage?',
      kategorien: ['Teilkostenrechnung', 'Vollkostenrechnung'],
      elemente: [
        {
          text: 'Eigenmarke für einen Discounter bei freier Kapazität',
          kategorie: 'Teilkostenrechnung',
          erklaerung: 'Kurzfristige Entscheidung: Preis gegen variable Stückkosten.',
        },
        {
          text: 'Welche Sorte im Juli zuerst abgefüllt wird',
          kategorie: 'Teilkostenrechnung',
          erklaerung: 'Engpass: relativer Deckungsbeitrag.',
        },
        {
          text: 'Selbst abfüllen oder Lohnabfüller bei freier Kapazität',
          kategorie: 'Teilkostenrechnung',
          erklaerung: 'Variable Kosten gegen den Preis des Lohnabfüllers.',
        },
        {
          text: 'Dauerhafter Listenpreis für die Hotelkette',
          kategorie: 'Vollkostenrechnung',
          erklaerung: 'Auf Dauer muss der Preis alle Kosten decken.',
        },
        {
          text: 'Wert der fertigen Dosen im Lager am Jahresende',
          kategorie: 'Vollkostenrechnung',
          erklaerung:
            'Bestände werden mit Herstellkosten bewertet, darin stecken auch Gemeinkosten.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Die Vorlage für die Gesellschafter',
      text: 'Eine Zeile zieht den falschen Schluss. Tippe sie an.',
      zeilen: [
        `Selbstkosten Tequila-Bier: ${e(selbstkosten)} je Flasche, Preis ${e(PREIS)}`,
        `Ergebnis nach Vollkosten: ${e(vollkostenErgebnis)} im Jahr`,
        `Folgerung: Ohne das Bier steigt der Gewinn um ${e(vollkostenErgebnis.abs())}`,
      ],
      fehlerZeile: 2,
      gruende: [
        {
          text: 'Die zugerechneten Fixkosten bleiben; es fällt nur der Deckungsbeitrag weg.',
          richtig: true,
        },
        {
          text: 'Die Selbstkosten sind falsch addiert.',
          erklaerung: `${e(KV)} + ${e(FIX_JE_FLASCHE)} = ${e(selbstkosten)} stimmt.`,
        },
        {
          text: 'Der Preis ist zu niedrig angesetzt.',
          erklaerung: 'Der Preis ist vorgegeben. Falsch ist der Schluss aus der Rechnung.',
        },
      ],
      aufloesung: `Richtig wäre: Ohne das Bier sinkt das Ergebnis um ${e(db)}. Erst wenn die Fixkosten mit dem Bier abgebaut werden könnten, sähe die Rechnung anders aus.`,
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Und was wird jetzt aus der Vollkostenrechnung?',
      a: {
        figur: 'frank',
        ausdruck: 'gruebelt',
        text: 'Dann schaffen wir die Vollkostenrechnung einfach ab.',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Für dauerhafte Preise und die Bewertung der Lagerbestände brauchen wir sie weiter. Nur für kurzfristige Entscheidungen setzen wir die andere Brille auf.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Auf Dauer müssen alle Kosten gedeckt sein, und Bestände werden mit Herstellkosten bewertet.',
          richtig: true,
        },
        {
          text: 'Die Teilkostenrechnung ist immer ungenauer.',
          erklaerung: 'Sie ist nicht ungenauer, sie beantwortet eine andere Frage.',
        },
        {
          text: 'Fixkosten spielen in der Teilkostenrechnung gar keine Rolle.',
          erklaerung:
            'Sie werden als Block vom Deckungsbeitrag abgezogen und bestimmen das Betriebsergebnis.',
        },
      ],
      aufloesung:
        'Beide Rechnungen ergänzen sich: Teilkosten für kurzfristige Entscheidungen, Vollkosten für langfristige Preise und Bestandsbewertung.',
    },
    {
      typ: 'verstaendnis',
      frage:
        'Im Winter sinkt der Absatz von Senne Lemon. Warum steigen nach der Vollkostenrechnung die Selbstkosten je Flasche?',
      optionen: [
        {
          text: 'Die gleichen Fixkosten verteilen sich auf weniger Flaschen.',
          richtig: true,
        },
        {
          text: 'Die variablen Kosten je Flasche steigen im Winter.',
          erklaerung:
            'Variable Stückkosten bleiben je Flasche gleich. Es sind die Fixkosten je Stück, die steigen.',
        },
        {
          text: 'Die Fixkosten steigen, wenn weniger produziert wird.',
          erklaerung: 'Die Fixkosten insgesamt bleiben gleich. Nur ihr Anteil je Flasche wächst.',
        },
      ],
      figur: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Das ist der Grund, warum Selbstkosten je Stück für kurzfristige Entscheidungen trügen.',
      },
    },
    {
      typ: 'merksatz',
      id: 'K8-m1',
      frage: 'Wann nutzt man die Teilkosten-, wann die Vollkostenrechnung?',
      text: 'Teilkostenrechnung für kurzfristige Entscheidungen (Zusatzauftrag, Engpass, Eigenfertigung oder Fremdbezug, Sortiment): Es zählt der Deckungsbeitrag. Vollkostenrechnung für langfristige Preise und die Bewertung der Bestände: Alle Kosten müssen gedeckt sein.',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe: KLAUSUR.frage,
      part: KLAUSUR,
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Nächste Woche plane ich das Budget der Abfüllung. Und am Monatsende prüfen wir, ob dort mehr verbraucht wurde als erlaubt.',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Was verrechnet die Teilkostenrechnung auf die Produkte?',
      optionen: [
        { text: 'Nur die variablen, verursachten Kosten', richtig: true },
        { text: 'Alle Kosten einschließlich der Fixkosten' },
        { text: 'Nur die Fixkosten' },
      ],
    },
    {
      frage:
        'Ein Produkt hat einen positiven Deckungsbeitrag, aber nach Vollkosten einen Verlust. Die Fixkosten bleiben. Was bewirkt kurzfristig seine Streichung?',
      optionen: [
        { text: 'Das Ergebnis sinkt um den Deckungsbeitrag.', richtig: true },
        { text: 'Das Ergebnis steigt um den Verlust.' },
        { text: 'Das Ergebnis bleibt gleich.' },
      ],
    },
    {
      frage: 'Wofür braucht man die Vollkostenrechnung weiterhin?',
      optionen: [
        { text: 'Für langfristige Preise und die Bewertung der Bestände', richtig: true },
        { text: 'Für die Entscheidung über einen Zusatzauftrag bei freier Kapazität' },
        { text: 'Für die Rangfolge bei einem Engpass' },
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
      'K1 Kap. 1.5–1.6 (S. 34–38: Verursachungsprinzip rein nur in der Teilkostenrechnung, Vollkosten über Schlüsselung und Zuschläge, Fixkosten en bloc ins Betriebsergebnis) und K2 Kap. 2.1 (S. 51–52: Bestandsbewertung mit Herstellkosten, Preisuntergrenzen, Eigenfertigung/Fremdbezug) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
