// Lektion F1 – Statische und dynamische Bilanztheorie (eigene Formulierung; geprüft gegen BA 4.1–4.4)
import type { Lektion } from './types';

const STATISCH = 'Statische Bilanztheorie';
const DYNAMISCH = 'Dynamische Bilanztheorie';

export const lektionF1: Lektion = {
  id: 'F1',
  skillId: 'F1-bilanztheorien',
  abschnitt: 'F',
  titel: 'Zwei Blicke auf die Bilanz: statisch und dynamisch',
  kernAha:
    'Die statische Bilanztheorie (Simon) stellt die Bilanz in den Mittelpunkt und ermittelt das Reinvermögen zur Schuldendeckungskontrolle; die dynamische (Schmalenbach) stellt die GuV in den Mittelpunkt und will einen vergleichbaren Periodenerfolg – die Bilanz wird zum Kräftespeicher.',
  dauerMin: 7,
  figuren: ['frank', 'jana', 'leni', 'tobias'],
  ort: 'gesellschafter',
  quelle: 'BA 4.1–4.4, S. 115–122',
  teaser: {
    figur: 'frank',
    ausdruck: 'gruebelt',
    text: 'Zwei Millionen Euro Eigenkapital laut Bilanz. Ist die MBG dann genau so viel wert?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'gruebelt',
          text: 'Laut Bilanz hat die MBG zwei Millionen Euro Eigenkapital. Würde mir ein Käufer genau so viel für die Firma zahlen?',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Das hängt davon ab, was eine Bilanz überhaupt leisten soll. Darüber streiten Fachleute seit weit über hundert Jahren.',
        },
      ],
      frage:
        'Soll eine Bilanz zeigen, was die Firma besitzt – oder soll sie helfen zu zeigen, was die Firma verdient hat?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Es gibt zwei Arten, auf die eigenen Finanzen zu schauen. Beim Kassensturz zählst du, was du hast und was du schuldest.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Beim Haushaltsbuch willst du wissen, was im Monat übrig geblieben ist. Was schon gekauft, aber noch nicht verbraucht ist, schiebst du in den nächsten Monat.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage:
        'Ein Lieferant will der MBG große Mengen auf Ziel liefern und fragt sich: Kann die MBG ihre Schulden decken? Welche Sicht hilft ihm?',
      optionen: [
        {
          text: 'Die Kassensturz-Sicht: Welches Vermögen ist da, welche Schulden stehen dagegen?',
          richtig: true,
          erklaerung: 'Genau: Ihn interessiert, was zur Deckung seiner Forderung bereitsteht.',
        },
        {
          text: 'Die Haushaltsbuch-Sicht: Wie hoch war der Gewinn im Vergleich zum Vorjahr?',
          erklaerung:
            'Der Gewinn sagt ihm wenig darüber, ob am Stichtag genug Vermögen für die Schulden da ist.',
        },
        {
          text: 'Keine von beiden – dafür braucht man gar keine Bilanz.',
          erklaerung: 'Doch: Genau dafür wurde die Bilanz ursprünglich verstanden.',
        },
      ],
      aufloesung:
        'Der Kassensturz entspricht der statischen Bilanztheorie (Simon): Die Bilanz ermittelt das Reinvermögen und zeigt den Gläubigern ihr Haftungspotenzial. Die Haushaltsbuch-Sicht entspricht der dynamischen Bilanztheorie (Schmalenbach).',
    },
    {
      typ: 'konzept',
      titel: 'Zwei Bilanztheorien',
      text: 'Bilanztheorien fragen unabhängig vom Gesetz, wozu der Jahresabschluss dient. Statisch: Die Bilanz ermittelt das Reinvermögen am Stichtag. Dynamisch: Im Mittelpunkt steht ein vergleichbarer Periodenerfolg, die Bilanz hilft der GuV.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Statisch (Simon)',
            text: 'Bilanz im Mittelpunkt. Reinvermögen ermitteln, Schuldendeckung kontrollieren, Gläubiger schützen. GuV nur buchtechnisch angehängt.',
            farbe: '#1c6670',
          },
          {
            titel: 'Dynamisch (Schmalenbach)',
            text: 'GuV im Mittelpunkt. Vergleichbarer Periodenerfolg als Maßstab der Wirtschaftlichkeit. Bilanz als Kräftespeicher.',
            farbe: '#e8792b',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Statisch oder dynamisch?',
      kategorien: [STATISCH, DYNAMISCH],
      elemente: [
        { text: 'Ermittelt das Reinvermögen (Eigenkapital) zum Stichtag', kategorie: STATISCH },
        {
          text: 'Will einen vergleichbaren Periodenerfolg als Maßstab der Wirtschaftlichkeit',
          kategorie: DYNAMISCH,
        },
        { text: 'Dient der Kontrolle, ob die Schulden gedeckt sind', kategorie: STATISCH },
        {
          text: 'Versteht die Bilanz als Kräftespeicher der Unternehmung',
          kategorie: DYNAMISCH,
        },
        {
          text: 'Die GuV hängt nur buchtechnisch an der Bilanz',
          kategorie: STATISCH,
          erklaerung: 'Bei Simon dient die Erfolgsermittlung nur der Ermittlung des Reinvermögens.',
        },
        {
          text: 'Führt Aufwand und Ertrag ein, um Teilperiodenerfolge zu ermitteln',
          kategorie: DYNAMISCH,
        },
      ],
    },
    {
      typ: 'erkunden',
      titel: 'Wie Schmalenbach die Bilanz liest',
      text: 'Tippe auf die Karten.',
      erkunden: {
        art: 'aufdecken',
        karten: [
          {
            titel: 'Totalerfolg',
            text: 'Über die ganze Lebensdauer der Firma ist der Erfolg einfach: alle Einzahlungen minus alle Auszahlungen. Nur kennt niemand die Lebensdauer im Voraus.',
            farbe: '#1c6670',
          },
          {
            titel: 'Teilperioden',
            text: 'Deshalb wird jedes Jahr ein Erfolg ermittelt. Dafür braucht es Aufwand und Ertrag: Ausgaben und Einnahmen, die der richtigen Periode zugeordnet sind.',
            farbe: '#8cbf3f',
          },
          {
            titel: 'Aktivseite',
            text: 'Neben den Geldmitteln stehen hier die Vorleistungen: Einnahmen und Aufwendungen späterer Perioden.',
            farbe: '#e2b13c',
          },
          {
            titel: 'Passivseite',
            text: 'Neben dem Kapital stehen hier die Nachleistungen: Erträge und Ausgaben späterer Perioden.',
            farbe: '#e8792b',
          },
        ],
      },
      fazit:
        'Bei Schmalenbach zeigt die Bilanz keinen Zustand, sondern eine Bewegung: noch nicht erfolgswirksame Posten, die auf ihre Periode warten. Daher der Name dynamisch.',
    },
    {
      typ: 'verstaendnis',
      frage:
        'Die MBG kauft eine Abfüllanlage für 400.000 €, die zehn Jahre genutzt wird. Warum wird die Ausgabe nach dynamischer Sicht nicht komplett im Kaufjahr zu Aufwand?',
      figur: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Ein Jahr mit riesigem Verlust und neun Jahre ohne Anlagekosten? Das kann nicht stimmen.',
      },
      optionen: [
        {
          text: 'Weil die Anlage zehn Jahre lang Erträge bringt: Die Abschreibung verteilt die Ausgabe auf die Nutzungsjahre, hier 40.000 € je Jahr.',
          richtig: true,
          erklaerung:
            'Richtig: Nur so bleiben die Periodenerfolge der einzelnen Jahre vergleichbar.',
        },
        {
          text: 'Weil Anlagen nach Schmalenbach nie zu Aufwand werden.',
          erklaerung: 'Doch, sie werden zu Aufwand – nur verteilt über die Jahre der Nutzung.',
        },
        {
          text: 'Weil das Finanzamt es verbietet.',
          erklaerung:
            'Darum geht es der Theorie nicht. Sie fragt, welcher Aufwand zu welcher Periode gehört.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Gehört das selbst entwickelte Rezept für Senne Lemon nach Simon in die Bilanz?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Das Rezept ist unser größter Schatz. Natürlich gehört es in die Bilanz!',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Nach Simon nicht. Selbst entwickelte Rezepte, Know-how oder das Image bleiben draußen.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Unkörperliche Werte setzt Simon nur an, wenn für sie Ausgaben geleistet wurden – ein selbst entwickeltes Rezept gehört nicht dazu.',
          richtig: true,
        },
        { text: 'Simon lässt überhaupt keine Vermögensgegenstände in der Bilanz zu.' },
        { text: 'Rezepte gehören nach Simon auf die Passivseite.' },
      ],
      aufloesung:
        'In Simons Bilanz stehen körperliche Gegenstände, Forderungen und unkörperliche Gegenstände, für die Ausgaben geleistet wurden. Image, Know-how, die Qualität des Personals und selbst entwickelte Rezepte zählen nicht.',
    },
    {
      typ: 'fehlerjagd',
      titel: 'Erbstücke im heutigen HGB',
      text: 'Leni hat notiert, welche heutigen Regeln auf welche Bilanztheorie zurückgehen. Eine Zeile stimmt nicht.',
      zeilen: [
        'Bewertung unter der Annahme der Unternehmensfortführung (going concern) – statisch',
        'Grundsatz der Einzelbewertung – statisch',
        'Bildung von Rechnungsabgrenzungsposten – statisch',
        'Pflicht zur planmäßigen Abschreibung abnutzbarer Anlagen – dynamisch',
        'Angabe von Vorjahreszahlen für die Vergleichbarkeit – dynamisch',
      ],
      fehlerZeile: 2,
      gruende: [
        {
          text: 'Rechnungsabgrenzungsposten ordnen Aufwand und Ertrag unabhängig von der Zahlung der richtigen Periode zu – ein Erbe der dynamischen Theorie.',
          richtig: true,
        },
        {
          text: 'Rechnungsabgrenzungsposten stammen aus dem Steuerrecht, nicht aus einer Theorie.',
        },
        { text: 'Der Grundsatz der Einzelbewertung stammt von Schmalenbach.' },
      ],
      aufloesung:
        'Fortführung und Einzelbewertung gehen auf die statische Sicht zurück. Die periodengerechte Erfolgsermittlung – Rechnungsabgrenzung, planmäßige Abschreibung – und die Vergleichbarkeit über die Jahre zeigen das dynamische Erbe.',
    },
    {
      typ: 'merksatz',
      id: 'F1-m1',
      frage: 'Worin unterscheiden sich statische und dynamische Bilanztheorie?',
      text: 'Statisch (Simon): Die Bilanz steht im Mittelpunkt und ermittelt das Reinvermögen zum Stichtag – zur Schuldendeckungskontrolle. Dynamisch (Schmalenbach): Die GuV steht im Mittelpunkt, Ziel ist ein vergleichbarer Periodenerfolg; die Bilanz ist Hilfsmittel und Kräftespeicher.',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe:
        'Erläutern Sie den Unterschied zwischen der statischen und der dynamischen Bilanztheorie. Geben Sie an, welches Rechenwerk jeweils im Mittelpunkt steht.',
      part: {
        typ: 'kurzantwort',
        id: 'bilanztheorien',
        frage:
          'Erläutern Sie den Unterschied zwischen der statischen und der dynamischen Bilanztheorie. Geben Sie an, welches Rechenwerk jeweils im Mittelpunkt steht.',
        punkte: 4,
        checkliste: [
          {
            aussage:
              'Statische Theorie (Simon): Hauptaufgabe ist die Ermittlung des Reinvermögens (Eigenkapitals) zum Stichtag.',
            punkte: 1,
          },
          {
            aussage:
              'Zweck ist die Schuldendeckungskontrolle (Gläubigerschutz); die Bilanz steht im Mittelpunkt, die GuV ist nur buchtechnisch angebunden.',
            punkte: 1,
          },
          {
            aussage:
              'Dynamische Theorie (Schmalenbach): Ziel ist ein vergleichbarer Periodenerfolg als Maßstab der Wirtschaftlichkeit.',
            punkte: 1,
          },
          {
            aussage:
              'Die GuV steht im Mittelpunkt; die Bilanz ist Hilfsmittel der Erfolgsrechnung („Kräftespeicher“) und nimmt die schwebenden Posten auf.',
            punkte: 1,
          },
        ],
        muster:
          'Nach der statischen Bilanztheorie, die auf Simon zurückgeht, soll die Bilanz das Reinvermögen des Unternehmens zum Stichtag ermitteln. Sie dient vor allem der Kontrolle, ob die Schulden gedeckt sind, und damit den Gläubigern. Im Mittelpunkt steht die Bilanz; die GuV ist mit ihr nur buchtechnisch verbunden. Die dynamische Bilanztheorie, maßgeblich von Schmalenbach geprägt, will dagegen einen vergleichbaren Periodenerfolg als Maßstab der Wirtschaftlichkeit ermitteln. Hier steht die GuV im Mittelpunkt. Die Bilanz ist nur ihr Hilfsmittel: Sie nimmt als „Kräftespeicher“ die Posten auf, die noch nicht erfolgswirksam geworden sind.',
      },
      cliffhanger: {
        figur: 'sabine',
        ausdruck: 'gruebelt',
        text: 'Die Hausbank will unseren Jahresabschluss bis Ende März sehen. Gelten für eine OHG wie uns eigentlich dieselben Regeln wie für eine GmbH?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Welche Bilanztheorie stellt die Ermittlung des Reinvermögens in den Mittelpunkt?',
      optionen: [
        { text: 'Die statische Bilanztheorie', richtig: true },
        { text: 'Die dynamische Bilanztheorie' },
        { text: 'Beide gleichermaßen' },
      ],
    },
    {
      frage: 'Wer hat die dynamische Bilanztheorie maßgeblich geprägt?',
      optionen: [
        { text: 'Schmalenbach', richtig: true },
        { text: 'Simon' },
        { text: 'Das Reichsoberhandelsgericht' },
      ],
    },
    {
      frage: 'Welche heutige Regel geht auf die dynamische Bilanztheorie zurück?',
      optionen: [
        { text: 'Die Bildung von Rechnungsabgrenzungsposten', richtig: true },
        { text: 'Der Grundsatz der Einzelbewertung' },
        { text: 'Die Annahme der Unternehmensfortführung' },
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
      'BA 4.1 (Bedeutung), 4.2 (Simon: Reinvermögen, Schuldendeckungskontrolle, GuV nur buchtechnisch, Positionen, keine selbst entwickelten Rezepte), 4.3 (Schmalenbach: vergleichbarer Periodenerfolg, Kräftespeicher, Vor- und Nachleistungen, Maschinenbeispiel), 4.4 (Einflüsse heute) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
