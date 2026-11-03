// Lektion 0.7 – Zwei Brillen: Buchhaltung und Kostenrechnung
// (eigene Formulierung; geprüft gegen BA 2.1.2 und K1 1.1)
import type { Lektion } from './types';

const BEREICH = ['extern', 'intern'];

export const lektion07: Lektion = {
  id: '0.7',
  skillId: '0.7-zwei-brillen',
  abschnitt: '0',
  titel: 'Zwei Brillen: Buchhaltung und Kostenrechnung',
  kernAha:
    'Die Buchhaltung (externes Rechnungswesen) berichtet nach außen und ist Pflicht. Die Kostenrechnung (internes Rechnungswesen) liefert Zahlen für Entscheidungen im Haus – etwa, was eine Dose wirklich kostet.',
  dauerMin: 5,
  figuren: ['leni', 'frank', 'jana', 'tobias'],
  ort: 'besprechung',
  quelle: 'BA 2.1.2; K1 1.1',
  teaser: {
    figur: 'leni',
    ausdruck: 'gruebelt',
    text: 'Bilanz und GuV sind fertig. Aber welche unserer Sorten bringt eigentlich Geld?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: 'Die GuV sagt, die MBG hat Gewinn gemacht. Aber welche Sorte bringt Geld – und welche kostet uns nur?',
        },
        { figur: 'frank', ausdruck: 'ueberrascht', text: 'Steht das denn nicht in der Bilanz?' },
      ],
      frage: 'Bilanz und GuV sind fertig – warum reicht das Leni nicht?',
    },
    {
      typ: 'dialog',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Stell dir zwei Brillen vor. Mit der einen schaust du von außen auf die ganze Firma, mit der anderen von innen auf jede einzelne Dose.',
        },
        {
          figur: 'jana',
          ausdruck: 'freut',
          text: 'Meine ist die Außenbrille: Bilanz und GuV für Finanzamt, Bank und Gesellschafter.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Welche Brille braucht man dafür?',
      kategorien: [
        'Externes Rechnungswesen (Buchhaltung)',
        'Internes Rechnungswesen (Kostenrechnung)',
      ],
      elemente: [
        { text: 'Bilanz für die Sparkasse', kategorie: 'Externes Rechnungswesen (Buchhaltung)' },
        {
          text: 'Preis für ein Angebot an eine Hotelkette kalkulieren',
          kategorie: 'Internes Rechnungswesen (Kostenrechnung)',
        },
        {
          text: 'Gewinn für das Finanzamt ermitteln',
          kategorie: 'Externes Rechnungswesen (Buchhaltung)',
        },
        {
          text: 'Ist Senne Lemon im Glas oder in der Dose günstiger herzustellen?',
          kategorie: 'Internes Rechnungswesen (Kostenrechnung)',
        },
        {
          text: 'Gewinn- und Verlustrechnung für Frank und Sabine',
          kategorie: 'Externes Rechnungswesen (Buchhaltung)',
        },
        {
          text: 'Monatliche Kontrolle der Energiekosten der Abfüllanlage',
          kategorie: 'Internes Rechnungswesen (Kostenrechnung)',
          erklaerung: 'Kostenkontrolle für die eigene Steuerung – das ist die Innenbrille.',
        },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Außenbrille und Innenbrille',
      text: 'Die Buchhaltung berichtet nach außen, nach Gesetz, meist jährlich. Die Kosten- und Leistungsrechnung liefert Zahlen für Entscheidungen im Haus – frei gestaltet, oft monatlich.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Außenbrille: Buchhaltung',
            text: 'Aufwand und Ertrag, Bilanz und GuV. Für Finanzamt, Bank, Gesellschafter. Vom Gesetz vorgeschrieben.',
            farbe: '#1c6670',
          },
          {
            titel: 'Innenbrille: Kostenrechnung',
            text: 'Kosten und Leistungen, Kalkulation, Wirtschaftlichkeit. Für die Geschäftsführung und das Controlling.',
            farbe: '#e2b13c',
          },
        ],
      },
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Muss die MBG eine Kostenrechnung führen?',
      a: {
        figur: 'tobias',
        ausdruck: 'neutral',
        text: 'Klar, die Kostenrechnung ist genauso Pflicht wie die Buchhaltung.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Die machen wir freiwillig. Weil wir ohne sie keine guten Entscheidungen treffen.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Das Gesetz schreibt die Buchführung vor, die Kostenrechnung nur in Ausnahmen (etwa bei öffentlichen Aufträgen).',
          richtig: true,
        },
        { text: 'Die Kostenrechnung ist verboten, weil sie Betriebsgeheimnisse enthält.' },
        { text: 'Beide sind freiwillig.' },
      ],
      aufloesung:
        'Kaufleute müssen Bücher führen. Die Kostenrechnung gestaltet jedes Unternehmen selbst – sie lohnt sich, weil sie zeigt, wie der Betrieb tatsächlich gearbeitet hat.',
    },
    {
      typ: 'vorhersage',
      frage:
        'Die MBG spendet 2.000 € an den Sportverein in Paderborn. Wie sehen die beiden Brillen das?',
      optionen: [
        { text: 'Beide zählen die Spende ganz normal mit.' },
        {
          text: 'Die Buchhaltung bucht Aufwand, die Kostenrechnung sieht darin keine Kosten der Getränkeherstellung.',
          richtig: true,
        },
        { text: 'Beide ignorieren die Spende.' },
      ],
      aufloesung:
        'Die Spende mindert den Gewinn, also ist sie in der Buchhaltung Aufwand. Mit der Herstellung von Getränken hat sie aber nichts zu tun – deshalb sind es keine Kosten. Genau diese Abgrenzung übst du später in Abschnitt G.',
    },
    {
      typ: 'entscheidung',
      frage: 'Frank will wissen, ob sich eine neue Sorte lohnt. Wo suchst du die Antwort?',
      figur: {
        figur: 'frank',
        ausdruck: 'gruebelt',
        text: 'Ich will keine Sorte, die uns am Ende Geld kostet.',
      },
      optionen: [
        {
          text: 'In der Bilanz',
          folge:
            'Die Bilanz zeigt das gesamte Vermögen und Kapital am Stichtag. Über einzelne Sorten sagt sie nichts.',
        },
        {
          text: 'In der Kostenrechnung',
          empfohlen: true,
          folge:
            'Die Kostenrechnung ermittelt, was eine Dose der neuen Sorte kostet, und vergleicht es mit dem erzielbaren Preis.',
        },
      ],
      fazit:
        'Für Entscheidungen im Haus brauchst du die Innenbrille. Ab Abschnitt G schaust du damit auf die MBG.',
    },
    {
      typ: 'verstaendnis',
      frage: 'Welcher Erfolgsbegriff gehört zur Kostenrechnung?',
      optionen: [
        {
          text: 'Leistungen minus Kosten (Betriebserfolg)',
          richtig: true,
          erklaerung: 'Richtig: Die Innenbrille misst, wie gut der Betrieb gearbeitet hat.',
        },
        {
          text: 'Erträge minus Aufwendungen',
          erklaerung: 'Das ist der Erfolg der Buchhaltung (Außenbrille), den die GuV zeigt.',
        },
        {
          text: 'Einzahlungen minus Auszahlungen',
          erklaerung: 'Das beschreibt Geldbewegungen, nicht den Erfolg des Betriebs.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: '0.7-m1',
      frage: 'Worin unterscheiden sich externes und internes Rechnungswesen?',
      text: 'Externes Rechnungswesen (Buchhaltung): Bilanz und GuV für Außenstehende, gesetzlich vorgeschrieben, Erfolg = Ertrag − Aufwand. Internes Rechnungswesen (Kosten- und Leistungsrechnung): Zahlen für Entscheidungen im Haus, frei gestaltbar, Erfolg = Leistung − Kosten.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe:
        'Ordnen Sie die folgenden Merkmale dem externen oder dem internen Rechnungswesen zu.',
      part: {
        typ: 'rechenkette',
        id: 'brillen',
        titel: 'Externes oder internes Rechnungswesen',
        felder: [
          {
            typ: 'auswahl',
            id: 'hgb',
            label: 'Gesetzlich vorgeschrieben (Handelsgesetzbuch)',
            optionen: BEREICH,
            soll: 'extern',
          },
          {
            typ: 'auswahl',
            id: 'kalkulation',
            label: 'Kalkulation der Verkaufspreise',
            optionen: BEREICH,
            soll: 'intern',
          },
          {
            typ: 'auswahl',
            id: 'finanzamt',
            label: 'Adressat Finanzamt',
            optionen: BEREICH,
            soll: 'extern',
          },
          {
            typ: 'auswahl',
            id: 'monatlich',
            label: 'Monatliche Kontrolle der Wirtschaftlichkeit',
            optionen: BEREICH,
            soll: 'intern',
          },
        ],
      },
      cliffhanger: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Bevor wir mit Leni in die Kostenrechnung gehen, räumen wir die Buchhaltung auf. Morgen geht es um alle Aufgaben und Bereiche des Rechnungswesens.',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Für wen ist das externe Rechnungswesen vor allem gedacht?',
      optionen: [
        { text: 'Für Außenstehende wie Finanzamt, Bank und Gesellschafter', richtig: true },
        { text: 'Nur für die Abteilungsleitungen' },
        { text: 'Nur für die Kunden' },
      ],
    },
    {
      frage: 'Ist die Kosten- und Leistungsrechnung gesetzlich vorgeschrieben?',
      optionen: [
        { text: 'In der Regel nein – sie dient internen Entscheidungen.', richtig: true },
        { text: 'Ja, für alle Kaufleute.' },
        { text: 'Ja, aber nur für Personengesellschaften.' },
      ],
    },
    {
      frage: 'Welche Frage beantwortet die Kostenrechnung?',
      optionen: [
        { text: 'Was kostet die Herstellung einer Dose?', richtig: true },
        { text: 'Wie hoch ist das Eigenkapital am 31.12.?' },
        { text: 'Wie viel Steuern zahlt die MBG?' },
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
      'BA 2.1.2 (externes und internes Rechnungswesen, Kostenrechnung ohne gesetzliche Pflicht), K1 1.1 (Aufgaben, Adressaten, interner Erfolg = Leistung − Kosten, externer Erfolg = Ertrag − Aufwand) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
