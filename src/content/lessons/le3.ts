// Lektion E3 – Bilanzielle Abschreibung (eigene Formulierung; geprüft gegen BA 2.3.5.1, S. 63–65:
// Werteverzehr, AfA, linear auf Anschaffungs- oder Herstellungskosten, pro rata temporis; BA 3.4.5,
// S. 113: Leistungsabschreibung). Alle Beträge werden von der Engine berechnet.
import {
  MONATSNAMEN,
  solveBilanzAfa,
  type BilanzAfaParams,
} from '../../engine/generators/e/bilanz-afa';
import { formatEuro, formatPlain, formatProzent, type Val } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value.toString());

// Beispiel der Lektion (GC-E3-a/b in docs/m7/e.md)
const LIN: BilanzAfaParams = {
  variante: 'linear',
  anlage: 'eine neue Etikettiermaschine',
  konto: 'Technische Anlagen und Maschinen',
  kaufpreis: '70500',
  nebenkosten: '1500',
  nebenkostenArt: 'Montage',
  nd: 8,
  monat: 9,
};
const L = solveBilanzAfa(LIN);
const L_VOLL = solveBilanzAfa(LIN, { volleJahresAfa: true });
const L_OHNE_MONAT = solveBilanzAfa(LIN, { monatVergessen: true });
const L_HALB = L.jahresAfa!.div(2).round();
const MONAT = MONATSNAMEN[LIN.monat - 1]!;

const DEG: BilanzAfaParams = {
  ...LIN,
  variante: 'degressiv',
  kaufpreis: '120000',
  nebenkosten: '0',
  nd: 10,
  monat: 4,
  satz: '0.25',
};
const D = solveBilanzAfa(DEG);
const D_VOLL = solveBilanzAfa(DEG, { volleJahresAfa: true });
const D_FALSCH = solveBilanzAfa(DEG, { degressivVomAk: true });
const D_OHNE_MONAT = solveBilanzAfa(DEG, { monatVergessen: true });
const SATZ = formatProzent(DEG.satz!);

// Leistungsabschreibung (GC-E3-c)
const LKW: BilanzAfaParams = {
  variante: 'leistung',
  anlage: 'einen neuen Auslieferungs-Lkw',
  konto: 'Fuhrpark',
  kaufpreis: '150000',
  nebenkosten: '0',
  nebenkostenArt: 'Überführung',
  nd: 8,
  monat: 3,
  gesamtLeistung: 300000,
  leistungJahr: 48000,
  einheit: 'km',
};
const K = solveBilanzAfa(LKW);

export const lektionE3: Lektion = {
  id: 'E3',
  skillId: 'E3-bilanz-afa',
  abschnitt: 'E',
  titel: 'Bilanzielle Abschreibung: Wertverlust mit Kalender',
  kernAha:
    'Abgeschrieben werden die Anschaffungskosten einschließlich Nebenkosten, im Anschaffungsjahr nur zeitanteilig ab dem Anschaffungsmonat. Gebucht wird Abschreibungen auf Sachanlagen an Anlagekonto: Der Aufwand mindert den Gewinn, der Buchwert sinkt.',
  dauerMin: 8,
  figuren: ['frank', 'jana', 'tobias'],
  ort: 'buero',
  quelle: 'BA 2.3.5.1 (S. 63–65), BA 3.4.5 (S. 113)',
  teaser: {
    figur: 'frank',
    ausdruck: 'gruebelt',
    text: 'Die Etikettiermaschine läuft seit September. Wie viel ist sie bis Silvester weniger wert?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'gruebelt',
          text: `Die Etikettiermaschine hat ${e(L.ak)} gekostet und hält etwa ${LIN.nd} Jahre. Seit ${MONAT} läuft sie.`,
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Dann schreiben wir dieses Jahr einfach ein Achtel ab. Fertig!',
        },
      ],
      frage: 'Wie viel Wertverlust gehört in das Jahr, in dem die Maschine gekauft wurde?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Wie beim Auto: Es verliert jedes Jahr an Wert. Kaufst du es im September, hast du es dieses Jahr aber nur vier Monate gefahren.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'In der Bilanz heißt dieser Wertverlust Abschreibung, im Steuerrecht Absetzung für Abnutzung, kurz AfA. Im ersten Jahr zählt nur die Zeit, in der die Maschine schon uns gehört.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Anschaffungskosten ${e(L.ak)}, Nutzungsdauer ${LIN.nd} Jahre, linear, Anschaffung im ${MONAT}. Wie hoch ist die Abschreibung im ersten Jahr?`,
      optionen: [
        { text: e(L_VOLL.afa1) },
        { text: e(L.afa1), richtig: true },
        { text: e(L_OHNE_MONAT.afa1) },
        { text: e(L_HALB) },
      ],
      aufloesung: `Pro Jahr ${e(L.ak)} ÷ ${LIN.nd} = ${e(L.jahresAfa!)}. Von ${MONAT} bis Dezember sind es ${L.monate} Monate, der Anschaffungsmonat zählt voll: ${e(L.jahresAfa!)} × ${L.monate}/12 = ${e(L.afa1)}. Die frühere Vereinfachung mit einem halben Jahresbetrag gilt nicht mehr.`,
    },
    {
      typ: 'konzept',
      titel: 'So wird abgeschrieben und gebucht',
      text: 'Basis sind die Anschaffungskosten einschließlich Nebenkosten, ohne Restwert. Linear: durch die Nutzungsdauer teilen, im Anschaffungsjahr nur die Monate ab Anschaffung. Buchung: Abschreibungen auf Sachanlagen an Anlagekonto.',
      visual: {
        typ: 'tkonten',
        konten: [
          {
            name: 'Technische Anlagen und Maschinen',
            soll: [{ text: 'Anschaffung', betrag: L.ak.value.toString() }],
            haben: [
              { text: 'Abschreibung', betrag: L.afa1.value.toString(), neu: true },
              { text: 'Schlussbestand (SBK)', betrag: L.bw1.value.toString() },
            ],
          },
          {
            name: 'Abschreibungen auf Sachanlagen',
            soll: [{ text: 'TA und Maschinen', betrag: L.afa1.value.toString(), neu: true }],
            haben: [{ text: 'GuV', betrag: L.afa1.value.toString() }],
            untertitel: 'Aufwandskonto',
          },
        ],
      },
    },
    {
      typ: 'erkunden',
      titel: 'Der Buchwert sinkt',
      text: 'Buche die Abschreibungen der ersten drei Jahre. Auf welche Seite des Anlagekontos gehören sie?',
      erkunden: {
        art: 'tkonto-buchen',
        konto: 'Technische Anlagen und Maschinen',
        anfang: { seite: 'soll', text: 'Anschaffung', betrag: L.ak.value.toString() },
        vorgaenge: [
          {
            text: `Abschreibung Jahr 1 (${L.monate} Monate)`,
            betrag: L.afa1.value.toString(),
            seite: 'haben',
          },
          { text: 'Abschreibung Jahr 2', betrag: L.jahresAfa!.value.toString(), seite: 'haben' },
          { text: 'Abschreibung Jahr 3', betrag: L.jahresAfa!.value.toString(), seite: 'haben' },
        ],
      },
      fazit: `Der Saldo ist der Buchwert: ${e(L.ak.minus(L.afa1).minus(L.jahresAfa!).minus(L.jahresAfa!))} nach drei Jahren. Er geht als Schlussbestand ins Schlussbilanzkonto.`,
    },
    {
      typ: 'verstaendnis',
      frage: `Eine Abfülllinie für ${formatEuro(DEG.kaufpreis)} wird im ${MONATSNAMEN[DEG.monat - 1]} angeschafft und geometrisch-degressiv mit ${SATZ} vom Buchwert abgeschrieben. Abschreibung im ersten Jahr?`,
      figur: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Degressiv heißt: jedes Jahr derselbe Prozentsatz vom Buchwert. Am Anfang sind die Beträge groß, später kleiner.',
      },
      optionen: [
        {
          text: e(D.afa1),
          richtig: true,
          erklaerung: `${formatEuro(DEG.kaufpreis)} × ${SATZ} × ${D.monate}/12 = ${e(D.afa1)}. Auch degressiv wird im ersten Jahr zeitanteilig gerechnet.`,
        },
        {
          text: e(D_VOLL.afa1),
          erklaerung: 'Das wäre ein volles Jahr. Die Linie ist aber erst ab April da.',
        },
        {
          text: e(D_OHNE_MONAT.afa1),
          erklaerung: 'Hier fehlt der Anschaffungsmonat. Er zählt voll mit.',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Degressiv über zwei Jahre',
      text: `Anschaffungskosten ${formatEuro(DEG.kaufpreis)}, ${SATZ} vom Buchwert, Anschaffung im April.`,
      schritte: [
        {
          text: 'Jahr 1',
          rechnung: `${formatEuro(DEG.kaufpreis)} × ${SATZ} × ${D.monate}/12 = ${e(D.afa1)}; Buchwert ${e(D.bw1)}`,
          warum:
            'Im ersten Jahr ist der Buchwert noch der Anschaffungswert, aber nur für die Monate ab April.',
        },
        {
          text: 'Jahr 2',
          rechnung: `${e(D.bw1)} × ${SATZ} = ${e(D.afa2!)}; Buchwert ${e(D.bw2!)}`,
          warum:
            'Jetzt gilt der Satz für den Buchwert vom Jahresende. Deshalb sinken die Beträge Jahr für Jahr.',
        },
        {
          text: 'Buchung Jahr 1',
          rechnung: `Abschreibungen auf Sachanlagen an Technische Anlagen und Maschinen ${e(D.afa1)}`,
          warum: 'Gleiche Buchung wie linear, nur der Betrag ist anders gerechnet.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege rechnet degressiv',
      text: 'In einer Zeile steckt der Fehler.',
      zeilen: [
        `Anschaffungskosten ${formatEuro(DEG.kaufpreis)}`,
        `Jahr 1: ${formatEuro(DEG.kaufpreis)} × ${SATZ} × ${D.monate}/12 = ${e(D.afa1)}`,
        `Buchwert Ende Jahr 1: ${e(D.bw1)}`,
        `Jahr 2: ${formatEuro(DEG.kaufpreis)} × ${SATZ} = ${e(D_FALSCH.afa2!)}`,
      ],
      fehlerZeile: 3,
      gruende: [
        {
          text: 'Im zweiten Jahr gilt der Satz für den Buchwert, nicht für die Anschaffungskosten.',
          richtig: true,
        },
        { text: 'Im ersten Jahr hätte das volle Jahr abgeschrieben werden müssen.' },
        { text: 'Degressiv wird vom Restwert abgeschrieben.' },
      ],
      aufloesung: `Richtig: ${e(D.bw1)} × ${SATZ} = ${e(D.afa2!)}. Mit den Anschaffungskosten wäre es eine lineare Abschreibung mit falschem Satz.`,
    },
    {
      typ: 'wer-hat-recht',
      frage:
        'Der neue Auslieferungs-Lkw fährt im Sommer doppelt so viel wie im Winter. Wer hat recht?',
      a: {
        figur: 'frank',
        ausdruck: 'erklaert',
        text: 'Dann soll er auch nach Kilometern abgeschrieben werden. Wer viel fährt, verschleißt viel.',
      },
      b: {
        figur: 'tobias',
        ausdruck: 'neutral',
        text: 'Abschreibung ist immer gleich hoch. Kilometer spielen keine Rolle.',
      },
      richtig: 'a',
      begruendungen: [
        {
          text: 'Die Abschreibung nach Leistungseinheiten ist zulässig, die Kilometer werden mit dem Fahrtenbuch nachgewiesen.',
          richtig: true,
        },
        { text: 'Lkw dürfen nur degressiv abgeschrieben werden.' },
        { text: 'Kilometer zählen nur in der Kostenrechnung.' },
      ],
      aufloesung: `Satz je Kilometer = Anschaffungskosten ÷ geschätzte Gesamtleistung. Bei ${e(K.ak)} und ${formatPlain(LKW.gesamtLeistung!)} km sind das ${e(K.satzJeEinheit!)} je km; bei ${formatPlain(LKW.leistungJahr!)} km im ersten Jahr also ${e(K.afa1)}.`,
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Linear, Anschaffung im Juli. Ergänze die Monate, die Abschreibung im Anschaffungsjahr und den Buchwert.',
      skillId: 'E3-bilanz-afa',
      seed: 6,
      variant: 'linear',
      partId: 'afa',
      gefragt: ['monate', 'afa1', 'bw1'],
    },
    {
      typ: 'merksatz',
      id: 'E3-m1',
      frage: 'Wie berechnet und bucht man die bilanzielle Abschreibung im Anschaffungsjahr?',
      text: 'Basis: Anschaffungskosten einschließlich Nebenkosten. Linear: ÷ Nutzungsdauer; degressiv: Satz × Buchwert; nach Leistung: Satz je Einheit × Leistung. Im Anschaffungsjahr zeitanteilig, der Anschaffungsmonat zählt voll. Buchung: Abschreibungen auf Sachanlagen an Anlagekonto.',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe:
        'Ermitteln Sie die Abschreibungsbeträge und Buchwerte für das Anschaffungs- und das Folgejahr.',
      part: { skillId: 'E3-bilanz-afa', seed: 2, variant: 'degressiv', partId: 'afa' },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'ueberrascht',
        text: 'Die Inventur im Tanklager ist fertig, und die Tanks sind voller als im Januar. Leni behauptet, das erhöht unseren Gewinn.',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Anschaffungskosten 48.000 €, Nutzungsdauer 8 Jahre, linear, Anschaffung im Oktober. Abschreibung im ersten Jahr?',
      optionen: [{ text: '1.500 €', richtig: true }, { text: '6.000 €' }, { text: '1.000 €' }],
    },
    {
      frage: 'Welcher Buchungssatz gehört zur bilanziellen Abschreibung einer Maschine?',
      optionen: [
        {
          text: 'Abschreibungen auf Sachanlagen an Technische Anlagen und Maschinen',
          richtig: true,
        },
        { text: 'Technische Anlagen und Maschinen an Abschreibungen auf Sachanlagen' },
        { text: 'Abschreibungen auf Sachanlagen an Bank' },
      ],
    },
    {
      frage:
        'Degressiv 20 % vom Buchwert, Buchwert am Ende von Jahr 1: 90.000 €. Abschreibung in Jahr 2?',
      optionen: [{ text: '18.000 €', richtig: true }, { text: '20.000 €' }, { text: '72.000 €' }],
    },
  ],
  checkliste: {
    raetsel: true,
    alltagVorFachbegriff: true,
    kernAhaErreicht: true,
    figurImDialog: true,
    klausurbrueckeUndCliffhanger: true,
    fachlichGeprueft:
      'BA 2.3.5.1 S. 63–65 (Werteverzehr, AfA, linear auf Anschaffungskosten inkl. Nebenkosten, Buchung, pro rata temporis statt Halbjahresregel), BA 3.4.5 S. 113 (Leistungsabschreibung, Nachweis Fahrtenbuch); degressiv nach Lehrbuch-Übung mit vorgegebenem Satz; Zahlen aus der Engine; 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
