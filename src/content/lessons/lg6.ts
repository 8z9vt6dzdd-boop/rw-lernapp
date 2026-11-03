// Lektion G6 – Prinzipien der Kostenverrechnung und Systematik der Kostenrechnung
// (eigene Formulierung; geprüft gegen K1 Kap. 1.5, S. 34–35, und Kap. 1.6, S. 35–40).
import type { Lektion } from './types';

const VU = 'Verursachungsprinzip';
const DU = 'Durchschnittsprinzip';
const TR = 'Tragfähigkeitsprinzip';
const PRINZIPIEN = [VU, DU, TR];

export const lektionG6: Lektion = {
  id: 'G6',
  skillId: 'G6-prinzipien',
  abschnitt: 'G',
  titel: 'Prinzipien und Systeme: Nach welchen Regeln verteilt Leni?',
  kernAha:
    'Kosten werden nach dem Verursachungsprinzip (in reiner Form nur für variable bzw. Einzelkosten), dem Durchschnittsprinzip (Gemeinkosten über Schlüssel) oder dem Tragfähigkeitsprinzip (nach Belastbarkeit) verrechnet. Die Kostenrechnung fragt in drei Stufen: Welche Kosten (Kostenarten)? Wo (Kostenstellen)? Wofür (Kostenträger)?',
  dauerMin: 7,
  figuren: ['frank', 'tobias', 'leni', 'jana'],
  ort: 'gesellschafter',
  quelle: 'K1 1.5 (S. 34–35), 1.6 (S. 35–40)',
  teaser: {
    figur: 'frank',
    ausdruck: 'gruebelt',
    text: 'Das Gehalt der Werkleiterin zahlen alle Sorten. Aber wer wie viel?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'gruebelt',
          text: 'Die Werkleiterin arbeitet für Senne Lemon, Paderquell Energy und das Tequila-Bier. Wer bezahlt wie viel von ihrem Gehalt?',
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Das Bier läuft gerade schlecht. Das soll erst mal gar nichts tragen!',
        },
      ],
      frage: 'Nach welcher Regel sollen gemeinsame Kosten auf die Sorten verteilt werden?',
    },
    {
      typ: 'dialog',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Beim Essen mit Freunden zahlt jeder sein Gericht, die Flasche Wein teilt ihr durch alle. Und wer gerade knapp ist, zahlt beim Nachtisch etwas weniger.',
        },
        {
          figur: 'jana',
          ausdruck: 'freut',
          text: 'Das sind die drei Prinzipien der Kostenverrechnung. Nur dass wir sie nicht im Restaurant brauchen.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Welches Prinzip steckt dahinter?',
      kategorien: PRINZIPIEN,
      elemente: [
        {
          text: 'Konzentrat laut Entnahmeschein geht genau auf die Charge, die es verbraucht hat',
          kategorie: VU,
        },
        { text: 'Akkordlohn je Palette geht auf die abgefüllte Sorte', kategorie: VU },
        {
          text: 'Die Miete der Lagerhalle wird nach belegten Palettenstellplätzen verteilt',
          kategorie: DU,
          erklaerung: 'Ein Schlüssel (Mengengröße) verteilt Gemeinkosten anteilig.',
        },
        {
          text: 'Die Feuerversicherung wird nach der Fläche der Abteilungen verteilt',
          kategorie: DU,
        },
        {
          text: 'Das neue Tequila-Bier trägt vorerst nur so viel Gemeinkosten, wie sein Deckungsbeitrag zulässt',
          kategorie: TR,
        },
        {
          text: 'Eine Sorte auf einem hart umkämpften Markt wird entlastet, damit die MBG dort präsent bleibt',
          kategorie: TR,
          erklaerung: 'Belastet wird nach dem, was das Produkt tragen kann.',
        },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Prinzipien der Kostenverrechnung',
      text: 'Verursachung: Jeder Kostenträger trägt, was er verursacht hat. Durchschnitt: Gemeinkosten werden über einen Schlüssel verteilt. Tragfähigkeit: Jeder trägt, was er tragen kann. Daneben gibt es das Identitätsprinzip.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: VU,
            text: 'Wichtigstes Prinzip; in reiner Form nur für variable Kosten bzw. Einzelkosten',
            farbe: '#1c6670',
          },
          {
            titel: DU,
            text: 'Schlüssel: Mengengrößen (Fläche, Stückzahl) oder Wertgrößen (Personalkosten)',
            farbe: '#8cbf3f',
          },
          {
            titel: TR,
            text: 'So viel Kosten, wie der Deckungsbeitrag zulässt – entlastet schwache Produkte',
            farbe: '#e8792b',
          },
          {
            titel: 'Identitätsprinzip',
            text: 'Nur Kosten, die durch die Entscheidung für genau dieses Objekt entstehen',
            farbe: '#e2b13c',
          },
        ],
      },
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Wie verteilt die MBG das Gehalt der Werkleiterin auf die Sorten?',
      a: {
        figur: 'tobias',
        ausdruck: 'neutral',
        text: 'Nach dem Verursachungsprinzip, das ist doch das wichtigste.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Keine einzelne Dose verursacht ihr Gehalt. Dafür brauchen wir einen Schlüssel.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Gemeinkosten ohne direkte Ursache-Wirkungs-Beziehung werden nach dem Durchschnittsprinzip über Schlüssel verteilt.',
          richtig: true,
        },
        { text: 'Gehälter dürfen überhaupt nicht verteilt werden.' },
        { text: 'Das Verursachungsprinzip gilt für alle Kosten in gleicher Weise.' },
      ],
      aufloesung:
        'Das Verursachungsprinzip ist das wichtigste Prinzip, lässt sich aber exakt nur für variable bzw. Einzelkosten durchhalten. Für Gemeinkosten wie das Gehalt hilft das Durchschnittsprinzip.',
    },
    {
      typ: 'erkunden',
      titel: 'Drei Fragen, drei Stufen',
      text: 'Die Kostenrechnung arbeitet sich in drei Schritten vor. Decke sie auf.',
      erkunden: {
        art: 'aufdecken',
        karten: [
          {
            titel: 'Kostenartenrechnung: Welche Kosten sind angefallen?',
            text: 'Alle Kosten erfassen und ordnen: Material, Löhne, Abschreibungen … Einzelkosten können danach direkt zu den Produkten.',
            farbe: '#1c6670',
          },
          {
            titel: 'Kostenstellenrechnung: Wo sind sie angefallen?',
            text: 'Gemeinkosten auf Bereiche wie Energie, Abfüllung oder Vertrieb verteilen; Vorkostenstellen geben ihre Kosten weiter.',
            farbe: '#8cbf3f',
          },
          {
            titel: 'Kostenträgerrechnung: Wofür sind sie angefallen?',
            text: 'Einzel- und Gemeinkosten auf die Produkte bringen: je Stück (Kalkulation) oder je Periode (Betriebsergebnisrechnung).',
            farbe: '#e2b13c',
          },
        ],
      },
      fazit:
        'Abschnitt H ist die Kostenartenrechnung, I die Kostenstellenrechnung, J die Kostenträgerrechnung.',
    },
    {
      typ: 'verstaendnis',
      frage: 'Welche Frage beantwortet die Kostenstellenrechnung?',
      optionen: [
        {
          text: 'Wo sind die Kosten angefallen?',
          richtig: true,
          erklaerung:
            'Sie verteilt vor allem die Gemeinkosten auf die Bereiche, in denen sie entstanden sind.',
        },
        {
          text: 'Welche Kosten sind angefallen?',
          erklaerung: 'Das ist die Frage der Kostenartenrechnung.',
        },
        {
          text: 'Wofür sind die Kosten angefallen?',
          erklaerung: 'Das ist die Frage der Kostenträgerrechnung.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Ist, Normal oder Plan?',
      text: 'Kostenrechnungssysteme nach dem Zeitbezug der Kosten.',
      kategorien: ['Istkostenrechnung', 'Normalkostenrechnung', 'Plankostenrechnung'],
      elemente: [
        {
          text: 'Tatsächliche Preise und Verbrauchsmengen des abgelaufenen Januars',
          kategorie: 'Istkostenrechnung',
        },
        {
          text: 'Durchschnittspreise der Vergangenheit als feste Verrechnungspreise',
          kategorie: 'Normalkostenrechnung',
        },
        {
          text: 'Kostenvorgaben mit geplanten Preisen und Mengen für das nächste Jahr',
          kategorie: 'Plankostenrechnung',
        },
        {
          text: 'Nachkalkulation eines abgeschlossenen Sonderauftrags zur Kostenkontrolle',
          kategorie: 'Istkostenrechnung',
          erklaerung: 'Die Istkostenrechnung eignet sich besonders für die Nachkalkulation.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: 'In einer Teilkostenrechnung: Was passiert mit den fixen Kosten?',
      optionen: [
        { text: 'Sie werden über Schlüssel auf die Produkte verteilt.' },
        {
          text: 'Sie werden nicht auf die Produkte verteilt, sondern als Block im Betriebsergebnis verrechnet.',
          richtig: true,
        },
        { text: 'Sie werden weggelassen.' },
      ],
      aufloesung:
        'Die Vollkostenrechnung verteilt alle Kosten auf die Kostenträger, Gemeinkosten über Schlüssel oder Zuschläge. Die Teilkostenrechnung rechnet den Produkten nur die variablen Kosten zu; die Fixkosten kommen en bloc ins Betriebsergebnis.',
    },
    {
      typ: 'merksatz',
      id: 'G6-m1',
      frage:
        'Welche Prinzipien der Kostenverrechnung gibt es, und wie ist die Kostenrechnung gegliedert?',
      text: 'Verursachungsprinzip (rein nur für variable bzw. Einzelkosten), Durchschnittsprinzip (Gemeinkosten über Schlüssel), Tragfähigkeitsprinzip (nach Belastbarkeit), dazu das Identitätsprinzip. Stufen: Kostenarten (welche?), Kostenstellen (wo?), Kostenträger (wofür?). Systeme: Ist-, Normal-, Plankosten; Voll- oder Teilkosten.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe:
        'Ordnen Sie jeder Verrechnung das zugrunde liegende Prinzip der Kostenverrechnung zu.',
      part: {
        typ: 'rechenkette',
        id: 'prinzipien',
        titel: 'Prinzipien der Kostenverrechnung',
        felder: [
          {
            typ: 'auswahl',
            id: 'material',
            label: 'Braumalz wird laut Entnahmeschein dem Sud zugerechnet',
            optionen: PRINZIPIEN,
            soll: VU,
          },
          {
            typ: 'auswahl',
            id: 'heizung',
            label: 'Heizkosten des Werks werden nach Quadratmetern verteilt',
            optionen: PRINZIPIEN,
            soll: DU,
          },
          {
            typ: 'auswahl',
            id: 'neueinfuehrung',
            label:
              'Eine neu eingeführte Sorte wird nur so weit belastet, wie ihr Deckungsbeitrag reicht',
            optionen: PRINZIPIEN,
            soll: TR,
          },
          {
            typ: 'auswahl',
            id: 'verwaltung',
            label: 'Gehälter der Verwaltung werden nach Köpfen auf die Abteilungen umgelegt',
            optionen: PRINZIPIEN,
            soll: DU,
          },
        ],
      },
      cliffhanger: {
        figur: 'jana',
        ausdruck: 'ueberrascht',
        text: 'Jetzt wird es konkret: Wie viel Zucker hat die MBG im Januar eigentlich verbraucht? Im Lager fehlen ein paar Entnahmescheine.',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Für welche Kosten lässt sich das Verursachungsprinzip in reiner Form anwenden?',
      optionen: [
        { text: 'Für variable Kosten bzw. Einzelkosten', richtig: true },
        { text: 'Für alle Gemeinkosten' },
        { text: 'Nur für fixe Kosten' },
      ],
    },
    {
      frage: 'Wonach richtet sich das Tragfähigkeitsprinzip?',
      optionen: [
        { text: 'Nach der Belastbarkeit des Produkts, etwa seinem Deckungsbeitrag', richtig: true },
        { text: 'Nach einem Mengenschlüssel wie der Fläche' },
        { text: 'Nach dem Materialverbrauch laut Entnahmeschein' },
      ],
    },
    {
      frage: 'Welche Frage stellt die Kostenträgerrechnung?',
      optionen: [
        { text: 'Wofür sind die Kosten angefallen?', richtig: true },
        { text: 'Wo sind die Kosten angefallen?' },
        { text: 'Welche Kosten sind angefallen?' },
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
      'K1 1.5 (S. 34–35: Verursachungs-, Durchschnitts-, Tragfähigkeits- und Identitätsprinzip, Schlüsselgrößen, Verursachung rein nur bei variablen/Einzelkosten) und K1 1.6 (S. 35–40: Ist-, Normal-, Plankostenrechnung, Voll- und Teilkostenrechnung, Vor- und Nachkalkulation, Kostenarten-, Kostenstellen-, Kostenträgerrechnung) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
