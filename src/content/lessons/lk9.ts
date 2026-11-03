// Lektion K9 – Flexible Plankostenrechnung (eigene Formulierung; Ziel und Kontrollaufgabe nach K1
// Kap. 1.1 und 1.6, S. 15 und 37; Formeln nach 03-aufgabentypen.md, Vorzeichenregel als Annahme in
// docs/m7/k2.md). Alle Beträge werden von der Engine berechnet.
import { solvePlan, type PlanParams } from '../../engine/generators/k2/k9-plankosten';
import { Val, formatEuro, formatPlain, formatProzent } from '../../engine/money';
import type { Lektion } from './types';

// Eigener Golden Case GC-K9 (docs/m7/k2.md)
const P: PlanParams = {
  variante: 'abweichungen',
  planB: 2_000,
  planKosten: '300000',
  planFix: '120000',
  istB: 1_800,
  istKosten: '290000',
};
const S = solvePlan(P);
const PROP = solvePlan(P, { sollProportional: true });
const gespart = new Val(P.planKosten).minus(P.istKosten!);

// Urlaubsbudget als Alltagsvergleich
const FLUG = 400;
const TAG = 60;
const urlaub = (tage: number) => FLUG + TAG * tage;

const e = formatEuro;
const n = formatPlain;

export const lektionK9: Lektion = {
  id: 'K9',
  skillId: 'K9-plankosten',
  abschnitt: 'K',
  titel: 'Plankosten: Das Budget der Abfüllung',
  kernAha:
    'Ob eine Kostenstelle gut gewirtschaftet hat, zeigt erst der Vergleich mit den Sollkosten: dem Budget, angepasst an die tatsächliche Beschäftigung. Fixkosten bleiben dabei voll, nur die variablen Kosten wachsen mit.',
  dauerMin: 8,
  figuren: ['leni', 'tobias', 'jana'],
  ort: 'buero',
  quelle:
    'K1 Kap. 1.1 (S. 15: Kontrollaufgabe, Sollkosten) und Kap. 1.6 (S. 37: Plankostenrechnung); Formeln nach 03-aufgabentypen.md',
  teaser: {
    figur: 'leni',
    ausdruck: 'neutral',
    text: 'Die Juni-Zahlen der Abfüllung sind da. Unter dem Budget – aber ist das wirklich gut?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'neutral',
          text: `Für Juni hatten wir der Abfüllung ${e(P.planKosten)} für ${n(P.planB)} Stunden zugestanden. Verbraucht hat sie ${e(P.istKosten!)} – gelaufen ist die Anlage aber nur ${n(P.istB)} Stunden.`,
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: `${e(gespart)} gespart, die Abfüllung hat super gewirtschaftet!`,
        },
      ],
      frage: 'Hat die Abfüllung wirklich sparsam gearbeitet?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: `Dein Urlaubsbudget: Flug ${e(FLUG)} fest, dazu ${e(TAG)} pro Tag. Bleibst du neun statt zehn Tage, liegt dein Budget bei ${e(urlaub(9))} – nicht bei ${e(urlaub(10))}.`,
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Dieses angepasste Budget heißt Sollkosten. Der feste Teil bleibt, nur der variable Teil schrumpft mit.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Von den ${e(P.planKosten)} sind ${e(P.planFix)} fix. Wie hoch sind die Sollkosten bei ${n(P.istB)} Stunden?`,
      optionen: [
        { text: e(S.sollkosten), richtig: true },
        {
          text: e(PROP.sollkosten),
          erklaerung:
            'Hier wurden auch die Fixkosten mit der Beschäftigung gekürzt. Die Fixkosten bleiben aber voll.',
        },
        {
          text: e(P.planKosten),
          erklaerung: 'Das ist das Budget für die geplanten Stunden, nicht für die tatsächlichen.',
        },
      ],
      aufloesung: `Variabler Satz: (${e(P.planKosten)} − ${e(P.planFix)}) ÷ ${n(P.planB)} h = ${e(S.satzVar)}/h. Sollkosten: ${e(P.planFix)} + ${e(S.satzVar)}/h × ${n(P.istB)} h = ${e(S.sollkosten)}.`,
    },
    {
      typ: 'konzept',
      titel: 'Drei Größen der Plankostenrechnung',
      text: 'Verrechnungssatz = Plankosten ÷ Planbeschäftigung. Sollkosten = fixe Plankosten + variabler Satz × Istbeschäftigung. Verrechnete Plankosten = Verrechnungssatz × Istbeschäftigung.',
      visual: {
        typ: 'karten',
        karten: [
          { titel: 'Verrechnungssatz', text: `${e(S.satz)} je Stunde`, farbe: '#4a9fd8' },
          { titel: 'Sollkosten', text: e(S.sollkosten), farbe: '#8cbf3f' },
          { titel: 'verrechnete Plankosten', text: e(S.verrechnet), farbe: '#e2b13c' },
        ],
      },
    },
    {
      typ: 'erkunden',
      titel: 'Woher kommen die Abweichungen?',
      text: 'Decke die beiden Abweichungen und ihre Summe auf.',
      erkunden: {
        art: 'aufdecken',
        karten: [
          {
            titel: 'Beschäftigungsabweichung',
            text: `${e(S.sollkosten)} − ${e(S.verrechnet)} = ${e(S.ba)}: Fixkosten, die bei nur ${formatProzent(S.beschGrad.exact)} Auslastung nicht verrechnet wurden.`,
            farbe: '#e2b13c',
          },
          {
            titel: 'Verbrauchsabweichung',
            text: `${e(P.istKosten!)} − ${e(S.sollkosten)} = ${e(S.va!)}: mehr verbraucht, als für ${n(P.istB)} Stunden vorgesehen.`,
            farbe: '#e8792b',
          },
          {
            titel: 'Gesamtabweichung',
            text: `${e(P.istKosten!)} − ${e(S.verrechnet)} = ${e(S.ga!)} = ${e(S.ba)} + ${e(S.va!)}`,
            farbe: '#b8475a',
          },
        ],
      },
      fazit:
        'Für die Beschäftigungsabweichung kann die Abfüllung meist nichts: Es kamen weniger Aufträge. Die Verbrauchsabweichung muss sie dagegen erklären.',
    },
    {
      typ: 'sortieren',
      titel: 'Welche Abweichung ist es?',
      text: 'Ordne die Ursachen zu.',
      kategorien: ['Verbrauchsabweichung', 'Beschäftigungsabweichung'],
      elemente: [
        {
          text: 'Eine undichte Leitung verbraucht mehr Kohlensäure',
          kategorie: 'Verbrauchsabweichung',
          erklaerung: 'Mehrverbrauch bei gleicher Leistung.',
        },
        {
          text: 'Mehr beschädigte Dosen als üblich',
          kategorie: 'Verbrauchsabweichung',
          erklaerung: 'Ausschuss erhöht den Verbrauch je Stunde.',
        },
        {
          text: 'Reinigungsmittel überdosiert',
          kategorie: 'Verbrauchsabweichung',
          erklaerung: 'Unwirtschaftlicher Einsatz in der Kostenstelle.',
        },
        {
          text: 'Weniger Aufträge, die Anlage stand zwei Tage still',
          kategorie: 'Beschäftigungsabweichung',
          erklaerung: 'Die Fixkosten verteilen sich auf weniger Stunden.',
        },
        {
          text: 'Hallenmiete wird über weniger Stunden verrechnet als geplant',
          kategorie: 'Beschäftigungsabweichung',
          erklaerung: 'Nicht verrechnete Fixkosten durch geringere Auslastung.',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Die ganze Rechnung',
      schritte: [
        {
          text: 'Plankostenverrechnungssatz',
          rechnung: `${e(P.planKosten)} ÷ ${n(P.planB)} h = ${e(S.satz)}/h`,
          warum: 'Mit diesem Satz werden die Kosten auf die Produkte verrechnet.',
        },
        {
          text: 'Sollkosten',
          rechnung: `${e(P.planFix)} + ${e(S.satzVar)}/h × ${n(P.istB)} h = ${e(S.sollkosten)}`,
          warum: 'Das Budget für die tatsächlich gelaufenen Stunden.',
        },
        {
          text: 'Verrechnete Plankosten',
          rechnung: `${e(S.satz)}/h × ${n(P.istB)} h = ${e(S.verrechnet)}`,
          warum: 'Der volle Satz verrechnet auch die Fixkosten so, als wären sie variabel.',
        },
        {
          text: 'Abweichungen',
          rechnung: `Beschäftigung ${e(S.ba)}, Verbrauch ${e(S.va!)}, gesamt ${e(S.ga!)}`,
          warum:
            'Zusammen erklären sie, warum die Istkosten über den verrechneten Plankosten liegen.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Wie hat die Abfüllung im Juni gewirtschaftet?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: `Sie lag ${e(gespart)} unter dem Plan. Das ist sparsam.`,
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: `Für ${n(P.istB)} Stunden hätte sie nur ${e(S.sollkosten)} gebraucht. Sie hat ${e(S.va!)} mehr verbraucht.`,
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Maßstab sind die Sollkosten der Istbeschäftigung, nicht die Plankosten der Planbeschäftigung.',
          richtig: true,
        },
        {
          text: 'Istkosten über den Plankosten sind immer schlecht, darunter immer gut.',
          erklaerung:
            'Bei geringerer Beschäftigung müssen auch die Kosten sinken. Der Vergleich mit dem Plan sagt allein nichts.',
        },
        {
          text: 'Die Fixkosten hätten mit der Beschäftigung sinken müssen.',
          erklaerung:
            'Fixkosten bleiben kurzfristig gleich. Nur die variablen Kosten passen sich an.',
        },
      ],
      aufloesung: `Tobias vergleicht mit dem Plan für ${n(P.planB)} Stunden. Richtig ist der Vergleich mit den Sollkosten: Die Verbrauchsabweichung beträgt ${e(S.va!)}.`,
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Ein neuer Monat. Verrechnungssätze sind vorgegeben. Ergänze Sollkosten, verrechnete Plankosten und die Beschäftigungsabweichung.',
      skillId: 'K9-plankosten',
      seed: 8,
      variant: 'sollkosten',
      partId: 'rechnung',
      gefragt: ['soll', 'verrechnet', 'ba'],
    },
    {
      typ: 'merksatz',
      id: 'K9-m1',
      frage:
        'Wie ermittelt man Sollkosten und die beiden Abweichungen der flexiblen Plankostenrechnung?',
      text: 'Sollkosten = fixe Plankosten + variabler Plankostensatz × Istbeschäftigung. Beschäftigungsabweichung = Sollkosten − verrechnete Plankosten. Verbrauchsabweichung = Istkosten − Sollkosten.',
    },
    {
      typ: 'klausur',
      punkte: 6,
      aufgabe:
        'Ermitteln Sie Plankostenverrechnungssatz, Sollkosten, verrechnete Plankosten sowie Beschäftigungs-, Verbrauchs- und Gesamtabweichung.',
      part: { skillId: 'K9-plankosten', seed: 9, variant: 'abweichungen', partId: 'rechnung' },
      cliffhanger: {
        figur: 'jana',
        ausdruck: 'feiert',
        text: 'Damit hast du alle Werkzeuge der Teilkostenrechnung beisammen. Zeit für eine Probeklausur – du bist bereit!',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Wie berechnet man die Sollkosten?',
      optionen: [
        { text: 'Fixe Plankosten + variabler Plankostensatz × Istbeschäftigung', richtig: true },
        { text: 'Plankostenverrechnungssatz × Istbeschäftigung' },
        { text: 'Plankosten ÷ Planbeschäftigung' },
      ],
    },
    {
      frage:
        'Plankosten 100.000 € (davon fix 40.000 €) bei 1.000 h. Ist: 800 h. Wie hoch ist die Beschäftigungsabweichung?',
      optionen: [{ text: '8.000 €', richtig: true }, { text: '20.000 €' }, { text: '12.000 €' }],
    },
    {
      frage: 'Was zeigt die Verbrauchsabweichung?',
      optionen: [
        { text: 'Den Unterschied zwischen Istkosten und Sollkosten', richtig: true },
        { text: 'Den Unterschied zwischen Sollkosten und verrechneten Plankosten' },
        { text: 'Den Unterschied zwischen Plan- und Istbeschäftigung in Stunden' },
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
      'K1 Kap. 1.1 (S. 15: Kontrolle durch Vergleich von Ist- und Sollkosten) und Kap. 1.6 (S. 37: Plankostenrechnung) abgeglichen am 03.11.2026; Formeln aus 03-aufgabentypen.md, Vorzeichen als [ANNAHME – bitte prüfen] in docs/m7/k2.md',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
