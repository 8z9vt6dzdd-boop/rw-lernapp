// Lektion A1 – Aufgaben und Teilbereiche des Rechnungswesens (eigene Formulierung; geprüft gegen BA 2.1.1, 2.1.2)
import type { Lektion } from './types';

const TEILBEREICHE = [
  'Buchführung',
  'Kosten- und Leistungsrechnung',
  'Statistik',
  'Planungsrechnung',
];

export const lektionA1: Lektion = {
  id: 'A1',
  skillId: 'A1-rw-aufbau',
  abschnitt: 'A',
  titel: 'Aufgaben und Teilbereiche des Rechnungswesens',
  kernAha:
    'Das Rechnungswesen dokumentiert, kontrolliert und liefert Zahlen für Entscheidungen – verteilt auf vier Teilbereiche: Buchführung, Kosten- und Leistungsrechnung, Statistik und Planungsrechnung.',
  dauerMin: 5,
  figuren: ['sabine', 'jana', 'leni'],
  ort: 'buero',
  quelle: 'BA 2.1.1, 2.1.2',
  teaser: {
    figur: 'sabine',
    ausdruck: 'gruebelt',
    text: 'Soll die MBG eine zweite Abfülllinie kaufen? Ich brauche Zahlen dafür.',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      sprecher: [
        {
          figur: 'sabine',
          ausdruck: 'gruebelt',
          text: 'Ich überlege, ob wir nächstes Jahr eine zweite Abfülllinie kaufen. Was brauche ich dafür an Zahlen?',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Da brauchen wir alle vier Bereiche des Rechnungswesens – auch die, von denen du noch nie gehört hast.',
        },
      ],
      frage: 'Welche Bereiche des Rechnungswesens braucht Sabine für ihre Entscheidung?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Denk an deine Urlaubsplanung: Die Kontoauszüge zeigen, was war, und deine Liste, wofür das Geld ging. Der Vergleich mit dem Vorjahr zeigt Trends – und dann planst du das Budget.',
        },
        {
          figur: 'leni',
          ausdruck: 'freut',
          text: 'In der Firma heißen diese vier Schritte Buchführung, Kostenrechnung, Statistik und Planungsrechnung.',
        },
      ],
    },
    {
      typ: 'erkunden',
      titel: 'Die vier Teilbereiche',
      text: 'Tippe auf jede Karte und sieh dir an, was der Bereich bei der MBG macht.',
      erkunden: {
        art: 'aufdecken',
        karten: [
          {
            titel: 'Buchführung',
            text: 'Hält jeden Geschäftsvorfall lückenlos anhand von Belegen fest. Daraus entstehen Bilanz und GuV.',
            farbe: '#1c6670',
          },
          {
            titel: 'Kosten- und Leistungsrechnung',
            text: 'Ermittelt, was die Herstellung kostet und was eine Dose bringt. Grundlage für Preise und Wirtschaftlichkeit.',
            farbe: '#e2b13c',
          },
          {
            titel: 'Statistik',
            text: 'Wertet Zahlen aus und vergleicht sie: mit dem Vorjahr, mit der Branche, als Kennzahl.',
            farbe: '#8cbf3f',
          },
          {
            titel: 'Planungsrechnung',
            text: 'Schaut nach vorn: Investitions-, Beschaffungs- oder Kostenpläne bereiten Entscheidungen vor.',
            farbe: '#e8792b',
          },
        ],
      },
      fazit:
        'Buchführung, Kostenrechnung und Statistik blicken zurück. Die Planungsrechnung nutzt diese Zahlen, um die Zukunft vorzubereiten – genau das braucht Sabine.',
    },
    {
      typ: 'sortieren',
      titel: 'Welcher Teilbereich ist gefragt?',
      kategorien: TEILBEREICHE,
      elemente: [
        { text: 'Die Eingangsrechnung des Dosenwerks erfassen', kategorie: 'Buchführung' },
        {
          text: 'Ermitteln, was eine Dose Paderquell Energy kostet',
          kategorie: 'Kosten- und Leistungsrechnung',
        },
        { text: 'Den Umsatz je Monat mit dem Vorjahr vergleichen', kategorie: 'Statistik' },
        {
          text: 'Lohnt sich eine zweite Abfülllinie in den nächsten Jahren?',
          kategorie: 'Planungsrechnung',
        },
        {
          text: 'Selbstkosten für ein Angebot an eine Hotelkette berechnen',
          kategorie: 'Kosten- und Leistungsrechnung',
        },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Wofür das alles?',
      text: 'Das Rechnungswesen dokumentiert, was passiert ist, kontrolliert, ob alles wie geplant läuft, und liefert Zahlen für Entscheidungen. Nach außen legt es außerdem Rechenschaft ab – gegenüber Finanzamt, Bank und Gesellschaftern.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Dokumentation',
            text: 'Alle Vorgänge geordnet und belegt festhalten.',
            farbe: '#1c6670',
          },
          {
            titel: 'Kontrolle',
            text: 'Tatsächliche Werte (Ist) mit geplanten (Soll) vergleichen.',
            farbe: '#e8792b',
          },
          {
            titel: 'Disposition und Steuerung',
            text: 'Zahlen als Grundlage für Planung und Entscheidungen.',
            farbe: '#8cbf3f',
          },
        ],
      },
    },
    {
      typ: 'verstaendnis',
      frage:
        'Leni vergleicht die geplanten Energiekosten des Monats mit den tatsächlichen. Welche Aufgabe des Rechnungswesens ist das?',
      optionen: [
        {
          text: 'Kontrolle',
          richtig: true,
          erklaerung:
            'Richtig: Ist-Werte werden mit Soll-Werten verglichen, Abweichungen werden untersucht.',
        },
        {
          text: 'Dokumentation',
          erklaerung:
            'Dokumentation hält fest, was passiert ist. Der Vergleich mit dem Plan ist Kontrolle.',
        },
        {
          text: 'Rechenschaft',
          erklaerung:
            'Rechenschaft richtet sich nach außen. Lenis Vergleich dient der internen Kontrolle.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Der Spickzettel der Praktikantin',
      text: 'Eine Praktikantin hat sich die vier Teilbereiche notiert. Eine Zeile stimmt nicht.',
      zeilen: [
        'Buchführung: erfasst Geschäftsvorfälle anhand von Belegen',
        'Kostenrechnung: ist für alle Kaufleute gesetzlich vorgeschrieben',
        'Statistik: vergleicht Zahlen über mehrere Jahre',
        'Planungsrechnung: bereitet Entscheidungen für die Zukunft vor',
      ],
      fehlerZeile: 1,
      gruende: [
        {
          text: 'Vorgeschrieben ist die Buchführung; die Kostenrechnung ist bis auf Ausnahmen freiwillig.',
          richtig: true,
        },
        { text: 'Die Kostenrechnung gibt es nur in Handelsbetrieben.' },
        { text: 'Die Kostenrechnung wird ausschließlich vom Finanzamt erstellt.' },
      ],
      aufloesung:
        'Die Buchführung ist für Kaufleute Pflicht. Eine Kosten- und Leistungsrechnung richtet ein Unternehmen ein, weil es sie für die Steuerung braucht – gesetzlich verlangt wird sie nur in Ausnahmefällen.',
    },
    {
      typ: 'merksatz',
      id: 'A1-m1',
      frage: 'Welche Aufgaben und welche vier Teilbereiche hat das Rechnungswesen?',
      text: 'Aufgaben: dokumentieren, kontrollieren, Zahlen für Entscheidungen liefern (Disposition und Steuerung), nach außen Rechenschaft ablegen. Teilbereiche: Buchführung, Kosten- und Leistungsrechnung, Statistik, Planungsrechnung.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe: 'Ordnen Sie die Tätigkeiten dem zuständigen Teilbereich des Rechnungswesens zu.',
      part: {
        typ: 'rechenkette',
        id: 'teilbereiche',
        titel: 'Teilbereiche des Rechnungswesens',
        felder: [
          {
            typ: 'auswahl',
            id: 'stueckkosten',
            label: 'Ermittlung der Stückkosten eines Erzeugnisses',
            optionen: TEILBEREICHE,
            soll: 'Kosten- und Leistungsrechnung',
          },
          {
            typ: 'auswahl',
            id: 'aufzeichnung',
            label: 'Lückenlose Aufzeichnung aller Geschäftsvorfälle',
            optionen: TEILBEREICHE,
            soll: 'Buchführung',
          },
          {
            typ: 'auswahl',
            id: 'investition',
            label: 'Aufstellung eines Investitionsplans',
            optionen: TEILBEREICHE,
            soll: 'Planungsrechnung',
          },
          {
            typ: 'auswahl',
            id: 'umsatz',
            label: 'Auswertung der Umsatzentwicklung der letzten fünf Jahre',
            optionen: TEILBEREICHE,
            soll: 'Statistik',
          },
        ],
      },
      cliffhanger: {
        figur: 'jana',
        ausdruck: 'entsetzt',
        text: 'Tobias hat gerade mit Tipp-Ex einen Betrag auf einer Rechnung geändert. Morgen reden wir über die Regeln, die genau das verbieten.',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Welcher Teilbereich ermittelt, was die Herstellung einer Dose kostet?',
      optionen: [
        { text: 'Kosten- und Leistungsrechnung', richtig: true },
        { text: 'Statistik' },
        { text: 'Buchführung' },
      ],
    },
    {
      frage: 'Ist mit Soll vergleichen – welche Aufgabe ist das?',
      optionen: [
        { text: 'Kontrolle', richtig: true },
        { text: 'Dokumentation' },
        { text: 'Rechenschaft' },
      ],
    },
    {
      frage: 'Welcher Teilbereich ist auf die Zukunft gerichtet?',
      optionen: [
        { text: 'Planungsrechnung', richtig: true },
        { text: 'Buchführung' },
        { text: 'Statistik' },
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
      'BA 2.1.1 (Aufgaben: Dokumentation, Kontrolle, Disposition/Steuerung; Adressaten), BA 2.1.2 (Teilbereiche Buchführung, Kostenrechnung, Statistik, Planungsrechnung; Kostenrechnung ohne gesetzliche Pflicht) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
