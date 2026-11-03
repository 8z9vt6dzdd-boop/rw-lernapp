// Lektion F2 – Das Dritte Buch des HGB (eigene Formulierung; geprüft gegen BA 5.1)
import type { Lektion } from './types';

const ALLE = 'Für alle Kaufleute (§§ 238 ff.)';
const KAPG = 'Ergänzend für Kapitalgesellschaften (§§ 264 ff.)';

export const lektionF2: Lektion = {
  id: 'F2',
  skillId: 'F2-hgb-grundlagen',
  abschnitt: 'F',
  titel: 'Das Dritte Buch des HGB: Wer muss was?',
  kernAha:
    'Das Dritte Buch des HGB ist wie ein Haus gebaut: Die §§ 238 ff. gelten für alle Kaufleute, also auch für die MBG als OHG; die §§ 264 ff. kommen nur für Kapitalgesellschaften und bestimmte Personengesellschaften hinzu – je nach Größenklasse mit mehr Pflichten.',
  dauerMin: 6,
  figuren: ['sabine', 'jana', 'frank'],
  ort: 'gesellschafter',
  quelle: 'BA 5.1, S. 124–130',
  teaser: {
    figur: 'sabine',
    ausdruck: 'gruebelt',
    text: 'Der Großhändler nebenan muss seinen Abschluss veröffentlichen. Wir etwa auch?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'sabine',
          ausdruck: 'gruebelt',
          text: 'Der Getränkegroßhandel nebenan ist eine GmbH und muss seinen Jahresabschluss sogar veröffentlichen. Müssen wir als OHG das auch?',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Das regelt das Dritte Buch des HGB. Es ist aufgebaut wie ein Haus mit mehreren Stockwerken.',
        },
      ],
      frage:
        'Welche Vorschriften gelten für die MBG als OHG – und welche nur für bestimmte Unternehmen?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Denk an den Straßenverkehr: Die Grundregeln gelten für alle, vom Fahrrad bis zum Lastwagen.',
        },
        {
          figur: 'frank',
          ausdruck: 'freut',
          text: 'Und für Lastwagen kommen Extraregeln dazu, je schwerer, desto mehr. Dann sind wir hoffentlich das Fahrrad.',
        },
      ],
    },
    {
      typ: 'erkunden',
      titel: 'Die Stockwerke des Dritten Buches',
      text: 'Tippe auf jedes Stockwerk.',
      erkunden: {
        art: 'aufdecken',
        karten: [
          {
            titel: '§§ 238 ff.: alle Kaufleute',
            text: 'Buchführung und Inventar, Eröffnungsbilanz und Jahresabschluss mit Ansatz- und Bewertungsvorschriften, Aufbewahrung von Unterlagen.',
            farbe: '#1c6670',
          },
          {
            titel: '§§ 264 ff.: Kapitalgesellschaften',
            text: 'Ergänzend für AG, KGaA und GmbH sowie bestimmte Personengesellschaften: Anhang und Lagebericht, Konzernabschluss, Prüfung, Offenlegung, Straf- und Bußgeldvorschriften.',
            farbe: '#e8792b',
          },
          {
            titel: '§§ 336 ff.: Genossenschaften',
            text: 'Ergänzende Vorschriften für eingetragene Genossenschaften.',
            farbe: '#8cbf3f',
          },
          {
            titel: '§§ 340 ff.: bestimmte Geschäftszweige',
            text: 'Sonderregeln für Kredit- und Finanzdienstleistungsinstitute, Versicherungsunternehmen und Pensionsfonds.',
            farbe: '#e2b13c',
          },
        ],
      },
      fazit:
        'Die MBG ist als OHG Kaufmann. Für sie gilt das Erdgeschoss, die §§ 238 ff. – die Stockwerke darüber betreffen sie nicht.',
    },
    {
      typ: 'sortieren',
      titel: 'Erdgeschoss oder Zusatzstockwerk?',
      kategorien: [ALLE, KAPG],
      elemente: [
        { text: 'Bücher führen und ein Inventar aufstellen', kategorie: ALLE },
        { text: 'Jedes Jahr einen Jahresabschluss aufstellen', kategorie: ALLE },
        { text: 'Unterlagen aufbewahren', kategorie: ALLE },
        { text: 'Einen Anhang zum Jahresabschluss erstellen', kategorie: KAPG },
        { text: 'Einen Lagebericht aufstellen', kategorie: KAPG },
        {
          text: 'Den Jahresabschluss offenlegen (beim Register einreichen)',
          kategorie: KAPG,
        },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Größenklassen nach § 267 HGB',
      text: 'Kapitalgesellschaften werden nach Bilanzsumme, Umsatzerlösen und Zahl der Arbeitnehmer in kleine, mittelgroße und große eingeteilt. Je größer, desto mehr müssen sie offenlegen und desto kürzer ist die Frist zur Aufstellung.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Klein',
            text: 'Arbeitnehmergrenze: bis 50. Offenlegung: Bilanz und Anhang verkürzt, keine GuV, kein Lagebericht. Aufstellung innerhalb von 6 Monaten.',
            farbe: '#8cbf3f',
          },
          {
            titel: 'Mittelgroß',
            text: 'Arbeitnehmergrenze: über 50 bis 250. Offenlegung: Bilanz verkürzt mit Zusatzangaben, GuV und Anhang verkürzt, Lagebericht. Aufstellung innerhalb von 3 Monaten.',
            farbe: '#e2b13c',
          },
          {
            titel: 'Groß',
            text: 'Arbeitnehmergrenze: über 250. Offenlegung: Bilanz, GuV, Anhang und Lagebericht vollständig. Aufstellung innerhalb von 3 Monaten.',
            farbe: '#e8792b',
          },
        ],
      },
    },
    {
      typ: 'vorhersage',
      frage:
        'Angenommen, die Wessels machen aus der MBG eine GmbH & Co. KG – eine Personengesellschaft, in der eine GmbH voll haftet. Gelten dann die Zusatzregeln für Kapitalgesellschaften?',
      optionen: [
        {
          text: 'Ja, solche &-Co-Gesellschaften werden wie Kapitalgesellschaften behandelt.',
          richtig: true,
        },
        {
          text: 'Nein, eine KG ist eine Personengesellschaft – es bleibt bei den §§ 238 ff.',
          erklaerung: 'Die Rechtsform allein entscheidet hier nicht, sondern wer voll haftet.',
        },
        {
          text: 'Nur, wenn sie mehr als 250 Arbeitnehmer hat.',
          erklaerung: 'Die Größe bestimmt nur den Umfang der Pflichten, nicht ob sie gelten.',
        },
      ],
      aufloesung:
        'Durch das KapCoRiLiG gelten die ergänzenden Vorschriften auch für Personengesellschaften, bei denen eine Kapitalgesellschaft Vollhafter ist, etwa die GmbH & Co. KG. Sie sind wie Kapitalgesellschaften zu behandeln.',
    },
    {
      typ: 'verstaendnis',
      frage: 'Was gehört bei einer Kapitalgesellschaft zum Jahresabschluss?',
      figur: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Bei der OHG reichen Bilanz und GuV. Bei der GmbH wird es mehr.',
      },
      optionen: [
        {
          text: 'Bilanz, GuV und Anhang – der Lagebericht kommt als eigenes Informationsinstrument hinzu.',
          richtig: true,
          erklaerung:
            'Richtig: Der Anhang ergänzt, korrigiert und entlastet Bilanz und GuV; der Lagebericht verdichtet und ergänzt sie.',
        },
        {
          text: 'Nur Bilanz und GuV, genau wie bei der OHG.',
          erklaerung: 'Kapitalgesellschaften müssen den Jahresabschluss um einen Anhang erweitern.',
        },
        {
          text: 'Nur die Bilanz – die GuV ist freiwillig.',
          erklaerung: 'Die GuV gehört bei allen Kaufleuten zum Jahresabschluss.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Sabines Spickzettel',
      text: 'Sabine hat sich Fristen und Pflichten für Kapitalgesellschaften notiert. Eine Zeile ist falsch.',
      zeilen: [
        'Kleine Kapitalgesellschaft: Jahresabschluss innerhalb von 6 Monaten aufstellen',
        'Mittelgroße und große: innerhalb von 3 Monaten aufstellen',
        'Offenlegung: innerhalb von 12 Monaten',
        'Der Anhang muss einer gesetzlich vorgeschriebenen Gliederung folgen',
      ],
      fehlerZeile: 3,
      gruende: [
        {
          text: 'Für den Anhang schreibt das Gesetz keine Gliederung vor; geregelt ist sein Inhalt (§§ 284–288 HGB).',
          richtig: true,
        },
        { text: 'Die Offenlegungsfrist beträgt nur 3 Monate.' },
        { text: 'Kleine Kapitalgesellschaften müssen gar keinen Jahresabschluss aufstellen.' },
      ],
      aufloesung:
        'Die Fristen stimmen (§ 264 und § 325 HGB). Der Anhang hat keine vorgeschriebene Gliederung. Er soll Bilanz und GuV ergänzen, korrigieren und entlasten und so ihre Auswertung erleichtern.',
    },
    {
      typ: 'merksatz',
      id: 'F2-m1',
      frage: 'Wie ist das Dritte Buch des HGB aufgebaut?',
      text: '§§ 238 ff.: Vorschriften für alle Kaufleute (Buchführung, Inventar, Jahresabschluss, Aufbewahrung). §§ 264 ff.: ergänzend für Kapitalgesellschaften und bestimmte Personengesellschaften, abgestuft nach Größenklassen (§ 267). Dazu Sonderregeln für Genossenschaften (§§ 336 ff.) und bestimmte Geschäftszweige (§§ 340 ff.).',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe:
        'Erläutern Sie den Aufbau des Dritten Buches des HGB und geben Sie an, welche Vorschriften für eine OHG gelten.',
      part: {
        typ: 'kurzantwort',
        id: 'drittes-buch',
        frage:
          'Erläutern Sie den Aufbau des Dritten Buches des HGB und geben Sie an, welche Vorschriften für eine OHG gelten.',
        punkte: 4,
        checkliste: [
          {
            aussage:
              'Vorschriften für alle Kaufleute (§§ 238 ff. HGB): Buchführung, Inventar, Eröffnungsbilanz und Jahresabschluss, Aufbewahrung.',
            punkte: 1,
          },
          {
            aussage:
              'Ergänzende Vorschriften für Kapitalgesellschaften und bestimmte Personengesellschaften (§§ 264 ff. HGB), etwa Anhang, Lagebericht, Prüfung, Offenlegung; abgestuft nach Größenklassen (§ 267 HGB).',
            punkte: 1,
          },
          {
            aussage:
              'Ergänzende Vorschriften für eingetragene Genossenschaften (§§ 336 ff. HGB) und für bestimmte Geschäftszweige wie Kreditinstitute und Versicherungen (§§ 340 ff. HGB).',
            punkte: 1,
          },
          {
            aussage:
              'Für eine OHG, deren Gesellschafter natürliche Personen sind, gelten nur die Vorschriften für alle Kaufleute.',
            punkte: 1,
          },
        ],
        muster:
          'Das Dritte Buch des HGB enthält die handelsrechtlichen Rechnungslegungsvorschriften. Die §§ 238 ff. gelten für alle Kaufleute: Sie regeln Buchführung und Inventar, Eröffnungsbilanz und Jahresabschluss einschließlich Ansatz und Bewertung sowie die Aufbewahrung. Die §§ 264 ff. ergänzen diese Regeln für Kapitalgesellschaften und bestimmte Personengesellschaften (etwa die GmbH & Co. KG), zum Beispiel um Anhang, Lagebericht, Prüfung und Offenlegung; der Umfang hängt von der Größenklasse nach § 267 ab. Weitere ergänzende Vorschriften gibt es für eingetragene Genossenschaften (§§ 336 ff.) und für Kreditinstitute, Versicherungen und Pensionsfonds (§§ 340 ff.). Eine OHG mit natürlichen Personen als Gesellschaftern unterliegt nur den Vorschriften für alle Kaufleute.',
      },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Ein Händler würde für unsere Etikettiermaschine mehr zahlen, als wir bezahlt haben. Dann schreiben wir den höheren Wert einfach in die Bilanz, oder?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Wo stehen die Rechnungslegungsvorschriften, die für alle Kaufleute gelten?',
      optionen: [
        { text: 'In den §§ 238 ff. HGB', richtig: true },
        { text: 'In den §§ 264 ff. HGB' },
        { text: 'In den §§ 340 ff. HGB' },
      ],
    },
    {
      frage: 'Nach welchen Merkmalen teilt § 267 HGB Kapitalgesellschaften in Größenklassen ein?',
      optionen: [
        { text: 'Bilanzsumme, Umsatzerlöse, Zahl der Arbeitnehmer', richtig: true },
        { text: 'Rechtsform, Gründungsjahr, Branche' },
        { text: 'Gewinn, Eigenkapital, Standort' },
      ],
    },
    {
      frage: 'Welche Unterlagen muss eine kleine Kapitalgesellschaft nicht offenlegen?',
      optionen: [
        { text: 'GuV und Lagebericht', richtig: true },
        { text: 'Die Bilanz' },
        { text: 'Den Anhang' },
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
      'BA 5.1 (Gliederung des Dritten Buches §§ 238 ff., 264 ff., 336 ff., 340 ff.; KapCoRiLiG; Größenklassen § 267 nur Merkmale und Arbeitnehmergrenzen; Tabellen 3 und 4: Offenlegungsumfang und Fristen; § 264 Abs. 1 Anhang, Lagebericht; §§ 284–288 ohne vorgeschriebene Gliederung) und Lösungshinweis Übungsaufgabe 20 abgeglichen am 03.11.2026; Schwellenwerte für Bilanzsumme und Umsatz bewusst weggelassen (siehe docs/m7/f1.md)',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
