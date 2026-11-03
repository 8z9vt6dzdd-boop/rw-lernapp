// Lektion G3 – Pagatorischer und wertmäßiger Kostenbegriff (eigene Formulierung; geprüft gegen
// K1 Kap. 1.3, S. 30, und K1 Kap. 1.2, S. 28–29 zu Wiederbeschaffungs- und Tageswerten).
import type { Lektion } from './types';

export const lektionG3: Lektion = {
  id: 'G3',
  skillId: 'G3-kostenbegriff',
  abschnitt: 'G',
  titel: 'Pagatorisch oder wertmäßig: Was ist eine Maschine wert?',
  kernAha:
    'Der pagatorische Kostenbegriff bewertet mit tatsächlich gezahlten, also vergangenen Preisen. Der wertmäßige Kostenbegriff bewertet den tatsächlichen Wertverzehr – auch mit Plan-, Tages- oder kalkulatorischen Werten – und hat drei Merkmale: Verbrauch von Produktionsfaktoren, Betrieblichkeit, Bewertung.',
  dauerMin: 6,
  figuren: ['jana', 'leni', 'tobias'],
  ort: 'abfuellung',
  quelle: 'K1 1.3 (S. 30); K1 1.2 (S. 28–29)',
  teaser: {
    figur: 'jana',
    ausdruck: 'gruebelt',
    text: 'Leni rechnet mit einem Preis, den nie jemand bezahlt hat. Darf sie das?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: 'Die Abfüllanlage hat vor sechs Jahren 400.000 € gekostet. Leni rechnet in der Kostenrechnung mit 520.000 €.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Genau so viel kostet eine neue heute. Mit dem alten Preis könnten wir sie nie ersetzen.',
        },
      ],
      frage: 'Darf die Kostenrechnung mit einem Wert rechnen, den nie jemand bezahlt hat?',
    },
    {
      typ: 'dialog',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Stell dir vor, dein Fahrrad hat vor zehn Jahren 500 € gekostet, das gleiche Rad kostet heute 800 €. Wenn du für ein neues sparst, rechnest du mit 800 €.',
        },
        {
          figur: 'jana',
          ausdruck: 'neutral',
          text: 'Die Buchhaltung bleibt bei den 500 €, weil sie bezahlt wurden. Beides hat seinen Zweck.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage:
        'Mit welchem Wert stellt die MBG am ehesten sicher, dass sie die Abfüllanlage am Ende ihrer Nutzung ersetzen kann?',
      optionen: [
        { text: 'Mit dem damals gezahlten Anschaffungspreis' },
        { text: 'Mit dem heutigen Wiederbeschaffungswert', richtig: true },
        { text: 'Mit dem Restwert' },
      ],
      aufloesung:
        'Wer nur den alten Preis über die Kosten zurückverdient, hat am Ende zu wenig für eine neue Anlage. Deshalb setzt die Kostenrechnung oft höhere Wiederbeschaffungs- oder Tageswerte an.',
    },
    {
      typ: 'konzept',
      titel: 'Zwei Kostenbegriffe',
      text: 'Pagatorisch heißt: Kosten orientieren sich an Auszahlungen, also an gezahlten Preisen der Vergangenheit. Wertmäßig heißt: Kosten bilden den tatsächlichen Wertverzehr ab – bewertet auch mit Planpreisen oder kalkulatorischen Werten.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Pagatorischer Kostenbegriff',
            text: 'Grundlage: Auszahlungen. Beispiel: Abschreibung vom gezahlten Anschaffungspreis.',
            farbe: '#1c6670',
          },
          {
            titel: 'Wertmäßiger Kostenbegriff',
            text: 'Grundlage: tatsächlicher Wertverzehr. Beispiel: Abschreibung vom Wiederbeschaffungswert.',
            farbe: '#e2b13c',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Welcher Kostenbegriff passt?',
      text: 'Ordne zu: Was ist auch pagatorisch möglich, was nur wertmäßig?',
      kategorien: ['Pagatorisch (gezahlte Preise)', 'Nur wertmäßig'],
      elemente: [
        {
          text: 'Abschreibung vom gezahlten Anschaffungspreis',
          kategorie: 'Pagatorisch (gezahlte Preise)',
        },
        { text: 'Abschreibung vom Wiederbeschaffungswert', kategorie: 'Nur wertmäßig' },
        {
          text: 'Zucker zum Preis der Lieferantenrechnung',
          kategorie: 'Pagatorisch (gezahlte Preise)',
        },
        {
          text: 'Zucker zu einem festen Planpreis für das ganze Jahr',
          kategorie: 'Nur wertmäßig',
          erklaerung: 'Ein Planpreis wurde so nie gezahlt.',
        },
        {
          text: 'Kalkulatorischer Unternehmerlohn',
          kategorie: 'Nur wertmäßig',
          erklaerung: 'Hier fließt überhaupt kein Geld.',
        },
        { text: 'Zinsen laut Kontoauszug der Bank', kategorie: 'Pagatorisch (gezahlte Preise)' },
      ],
    },
    {
      typ: 'erkunden',
      titel: 'Drei Merkmale wertmäßiger Kosten',
      text: 'Decke die drei Merkmale auf. Nur wenn alle drei zutreffen, liegen Kosten vor.',
      erkunden: {
        art: 'aufdecken',
        karten: [
          {
            titel: 'Verbrauch von Produktionsfaktoren',
            text: 'Etwas wird verzehrt: Zucker, Arbeitszeit, Nutzung der Abfüllanlage. Aromen, die nur im Lager liegen, sind noch nicht verbraucht.',
            farbe: '#1c6670',
          },
          {
            titel: 'Betrieblichkeit',
            text: 'Der Verbrauch dient der betrieblichen Leistung: Herstellung, Absatz, Betriebsbereitschaft. Eine Spende tut das nicht.',
            farbe: '#8cbf3f',
          },
          {
            titel: 'Bewertung',
            text: 'Der Verbrauch wird in Euro bewertet – mit gezahlten Preisen, Plan-, Tages- oder kalkulatorischen Werten.',
            farbe: '#e2b13c',
          },
        ],
      },
      fazit:
        'Verbrauch, Betrieblichkeit und Bewertung: Fehlt eines davon, sind es keine Kosten im wertmäßigen Sinn.',
    },
    {
      typ: 'wer-hat-recht',
      frage:
        'Die MBG lässt für 4.000 € das Dach eines Wohnhauses reparieren, das sie vermietet und betrieblich nicht nutzt. Sind das Kosten?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Klar, Material und Handwerker wurden verbraucht, und bewertet ist es auch.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Verbraucht und bewertet ja, aber das Wohnhaus dient nicht unseren Getränken. Ein Merkmal fehlt.',
      },
      richtig: 'b',
      begruendungen: [
        { text: 'Es fehlt die Betrieblichkeit der Leistungserstellung.', richtig: true },
        { text: 'Es fehlt die Bewertung, weil Spenden keinen Preis haben.' },
        { text: 'Reparaturen sind immer Zusatzkosten.' },
      ],
      aufloesung:
        'Kosten verlangen einen betrieblichen Zweck. Die Reparatur ist Aufwand der Buchhaltung (betriebsfremd), aber keine Kosten.',
    },
    {
      typ: 'verstaendnis',
      frage:
        'Die MBG kauft Aromen, die bis März im Lager bleiben. Welches Merkmal wertmäßiger Kosten fehlt im Januar?',
      optionen: [
        {
          text: 'Der Verbrauch von Produktionsfaktoren',
          richtig: true,
          erklaerung: 'Gekauft ist nicht verbraucht. Kosten entstehen erst mit der Verarbeitung.',
        },
        {
          text: 'Die Betrieblichkeit',
          erklaerung: 'Die Aromen sind für die Produktion bestimmt – betrieblich sind sie.',
        },
        {
          text: 'Die Bewertung',
          erklaerung: 'Der Rechnungsbetrag wäre eine Bewertung. Es fehlt etwas anderes.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'G3-m1',
      frage: 'Worin unterscheiden sich pagatorischer und wertmäßiger Kostenbegriff?',
      text: 'Pagatorisch: Kosten orientieren sich an Auszahlungen und gezahlten Preisen (vergangenheitsbezogen). Wertmäßig: Kosten sind der bewertete, betriebliche Verbrauch von Produktionsfaktoren – auch zu Plan-, Tages- oder kalkulatorischen Werten. Merkmale: Verbrauch, Betrieblichkeit, Bewertung.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe: 'Erläutern Sie die drei Merkmale, die den wertmäßigen Kostenbegriff bestimmen.',
      part: {
        typ: 'kurzantwort',
        id: 'merkmale',
        frage: 'Erläutern Sie die drei Merkmale, die den wertmäßigen Kostenbegriff bestimmen.',
        punkte: 3,
        checkliste: [
          {
            aussage:
              'Verbrauch von Produktionsfaktoren: Güter und Dienstleistungen werden verzehrt (nicht bloß beschafft).',
            punkte: 1,
          },
          {
            aussage:
              'Betrieblichkeit: Der Verbrauch dient der Erstellung und dem Absatz betrieblicher Leistungen bzw. der Betriebsbereitschaft.',
            punkte: 1,
          },
          {
            aussage:
              'Bewertung: Der Verbrauch wird in Geld bewertet, neben gezahlten Preisen auch mit Plan- oder kalkulatorischen Werten.',
            punkte: 1,
          },
        ],
        muster:
          'Kosten im wertmäßigen Sinn liegen nur vor, wenn drei Merkmale zusammentreffen. Erstens muss ein Verbrauch von Produktionsfaktoren stattfinden; ein bloßer Einkauf auf Lager genügt nicht. Zweitens muss der Verbrauch betrieblich sein, also der Herstellung und dem Absatz der Leistungen oder der Betriebsbereitschaft dienen; eine Spende erfüllt das nicht. Drittens wird der Verbrauch bewertet, wobei nicht nur gezahlte Preise, sondern auch Plan-, Tages- oder kalkulatorische Werte angesetzt werden dürfen.',
      },
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Im Sommer füllt die MBG fast doppelt so viel ab. Steigen die Kosten dann auch aufs Doppelte?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Woran orientiert sich der pagatorische Kostenbegriff?',
      optionen: [
        { text: 'An Auszahlungen bzw. gezahlten Preisen', richtig: true },
        { text: 'An Wiederbeschaffungswerten' },
        { text: 'An Planpreisen' },
      ],
    },
    {
      frage: 'Welcher Ansatz ist nur mit dem wertmäßigen Kostenbegriff vereinbar?',
      optionen: [
        { text: 'Abschreibung vom Wiederbeschaffungswert', richtig: true },
        { text: 'Abschreibung vom gezahlten Anschaffungspreis' },
        { text: 'Gehalt laut Gehaltsabrechnung' },
      ],
    },
    {
      frage: 'Welche drei Merkmale bestimmen den wertmäßigen Kostenbegriff?',
      optionen: [
        { text: 'Verbrauch, Betrieblichkeit, Bewertung', richtig: true },
        { text: 'Auszahlung, Ausgabe, Aufwand' },
        { text: 'Kauf, Lagerung, Verkauf' },
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
      'K1 1.3 (S. 30: pagatorisch = an Auszahlungen orientiert, vergangenheitsbezogen; wertmäßig = tatsächlicher Wertverzehr, auch Plan- oder kalkulatorische Werte; drei Bestimmungsmerkmale) und K1 1.2 (S. 28–29: Wiederbeschaffungs- und Tageswerte bei Anderskosten) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
