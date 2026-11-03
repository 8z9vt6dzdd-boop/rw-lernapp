// Lektion F10 – Grundzüge und Grundprinzipien der IFRS (eigene Formulierung; BA 8.1–8.2).
// Theorie-Skill ohne Rechenteil.
import type { Lektion } from './types';

export const lektionF10: Lektion = {
  id: 'F10',
  skillId: 'F10-ifrs',
  abschnitt: 'F',
  titel: 'IFRS: Bilanzieren für Investoren',
  kernAha:
    'Das HGB stellt den Schutz der Gläubiger in den Mittelpunkt, die IFRS die Information der Investoren über die Ertragskraft. Die IFRS bestehen aus Rahmenkonzept (Framework), Interpretationen und Einzelstandards; Basisannahmen sind Unternehmensfortführung und periodengerechte Erfolgsermittlung.',
  dauerMin: 6,
  figuren: ['sabine', 'frank', 'jana', 'leni', 'tobias'],
  ort: 'gesellschafter',
  quelle: 'BA 8.1–8.2',
  teaser: {
    figur: 'sabine',
    ausdruck: 'ueberrascht',
    text: 'Ein Investor aus London will unsere Zahlen nach IFRS. Was ist das denn?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'sabine',
          ausdruck: 'ueberrascht',
          text: 'Ein Investor aus London überlegt, bei einem Partner der MBG einzusteigen. Er fragt nach einem Abschluss nach IFRS.',
        },
        {
          figur: 'frank',
          ausdruck: 'gruebelt',
          text: 'Wir haben doch einen ordentlichen HGB-Abschluss. Reicht der nicht?',
        },
      ],
      frage:
        'Beide Abschlüsse beschreiben dieselbe Firma. Warum will der Investor trotzdem einen anderen?',
    },
    {
      typ: 'dialog',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Stell dir zwei Leute vor, die ein gebrauchtes Auto prüfen. Die Bank, die einen Kredit gibt, will wissen, was es im schlechtesten Fall noch wert ist.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Der Käufer will wissen, wie gut es künftig fährt. Das HGB denkt eher wie die Bank, die IFRS eher wie der Käufer.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Was unterscheidet HGB und IFRS im Kern?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Gleiche Regeln, nur auf Englisch. Das übersetzen wir schnell.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Anderer Blickwinkel. Die IFRS wollen vor allem Investoren informieren.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'IFRS gewichten die Ertragskraft stärker; das HGB legt den Schwerpunkt auf den Gläubigerschutz.',
          richtig: true,
        },
        { text: 'Die IFRS gelten nur in den USA.' },
        { text: 'Nach IFRS gibt es keine Bilanz, nur eine GuV.' },
      ],
      aufloesung:
        'Die IFRS weichen in vielen Punkten vom HGB ab. Sie stellen den Investor in den Mittelpunkt und sollen realitätsnah über die Ertragskraft informieren; das HGB betont den Schutz der Gläubiger.',
    },
    {
      typ: 'konzept',
      titel: 'Wer muss nach IFRS bilanzieren?',
      text: 'Die IFRS gibt das International Accounting Standards Board (IASB) mit Sitz in London heraus. Seit 2005 gelten sie in der EU für kapitalmarktorientierte Unternehmen. Andere Unternehmen können sie freiwillig anwenden.',
      visual: {
        typ: 'karten',
        karten: [
          { titel: 'IASB', text: 'Standardsetzer, Sitz in London', farbe: '#1c6670' },
          {
            titel: 'Pflicht seit 2005',
            text: 'kapitalmarktorientierte Unternehmen in der EU',
            farbe: '#c2410c',
          },
          {
            titel: 'Freiwillig',
            text: 'alle anderen, zum Beispiel für Investoren',
            farbe: '#65a30d',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'HGB oder IFRS?',
      text: 'Welches Regelwerk passt zur Aussage?',
      kategorien: ['HGB', 'IFRS'],
      elemente: [
        { text: 'Der Schutz der Gläubiger steht im Mittelpunkt.', kategorie: 'HGB' },
        { text: 'Der Investor steht im Mittelpunkt.', kategorie: 'IFRS' },
        { text: 'Die Ertragskraft wird stärker gewichtet.', kategorie: 'IFRS' },
        { text: 'Geregelt im Dritten Buch eines deutschen Gesetzes', kategorie: 'HGB' },
        { text: 'Herausgegeben von einem Gremium in London', kategorie: 'IFRS' },
        {
          text: 'Erleichtert den Zugang zu internationalen Kapitalmärkten',
          kategorie: 'IFRS',
          erklaerung: 'Das ist einer der wichtigsten Vorteile der IFRS.',
        },
      ],
    },
    {
      typ: 'erkunden',
      titel: 'Drei Stufen des Regelwerks',
      text: 'Decke die drei Stufen der IFRS auf.',
      erkunden: {
        art: 'aufdecken',
        karten: [
          {
            titel: '1. Rahmenkonzept (Framework)',
            text: 'Ziele und Anforderungen der Rechnungslegung, Definition von Aktiva, Passiva, Erträgen und Aufwendungen',
            farbe: '#1c6670',
          },
          {
            titel: '2. Interpretationen (IFRIC)',
            text: 'Lösungen für die einheitliche Anwendung der Standards in konkreten Fällen',
            farbe: '#ca8a04',
          },
          {
            titel: '3. Einzelstandards (IAS/IFRS)',
            text: 'Regeln zu Ausweis und Gliederung (IAS 1) und zu Einzelfragen der Bilanzierung',
            farbe: '#65a30d',
          },
        ],
      },
      fazit:
        'Das Rahmenkonzept ist das Fundament: Es sagt, wozu ein Abschluss da ist und was hineingehört.',
    },
    {
      typ: 'vorhersage',
      frage: 'Welche zwei Basisannahmen nennt das Rahmenkonzept der IFRS?',
      optionen: [
        {
          text: 'Unternehmensfortführung (Going Concern) und periodengerechte Erfolgsermittlung',
          richtig: true,
        },
        { text: 'Vorsichtsprinzip und Niederstwertprinzip' },
        { text: 'Gläubigerschutz und Kapitalerhaltung' },
      ],
      aufloesung:
        'Man geht davon aus, dass das Unternehmen weiter besteht, und ordnet Aufwand und Ertrag dem Jahr zu, zu dem sie wirtschaftlich gehören – wie bei der Rechnungsabgrenzung.',
      figur: {
        figur: 'jana',
        ausdruck: 'freut',
        text: 'Die zweite Annahme kennst du schon vom 31.12.',
      },
    },
    {
      typ: 'konzept',
      titel: 'Was eine gute Information ausmacht',
      text: 'Ergänzt werden die Basisannahmen durch qualitative Anforderungen: Die Angaben sollen verständlich, relevant, verlässlich und vergleichbar sein.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Verständlichkeit',
            text: 'Leser können die Angaben nachvollziehen',
            farbe: '#1c6670',
          },
          {
            titel: 'Relevanz',
            text: 'Angaben sind für Entscheidungen bedeutsam',
            farbe: '#65a30d',
          },
          {
            titel: 'Verlässlichkeit',
            text: 'man kann sich auf die Angaben verlassen',
            farbe: '#ca8a04',
          },
          { titel: 'Vergleichbarkeit', text: 'Angaben lassen sich vergleichen', farbe: '#c2410c' },
        ],
      },
    },
    {
      typ: 'verstaendnis',
      frage: 'Welche Aussage beschreibt einen Vorteil der IFRS?',
      optionen: [
        { text: 'Das Berichtswesen wird einheitlicher und transparenter.', richtig: true },
        { text: 'Die Steuerlast des Unternehmens sinkt.' },
        { text: 'Der Jahresabschluss muss nicht mehr geprüft werden.' },
      ],
      figur: {
        figur: 'tobias',
        ausdruck: 'gruebelt',
        text: 'Und was hätten wir davon?',
      },
    },
    {
      typ: 'merksatz',
      id: 'F10-m1',
      frage: 'Worin unterscheiden sich HGB und IFRS im Kern, und wie sind die IFRS aufgebaut?',
      text: 'HGB: Schwerpunkt Gläubigerschutz. IFRS: Information der Investoren über die Ertragskraft. Aufbau der IFRS: Rahmenkonzept, Interpretationen (IFRIC), Einzelstandards (IAS/IFRS); Basisannahmen Unternehmensfortführung und periodengerechte Erfolgsermittlung.',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe:
        'Erläutern Sie den wesentlichen Unterschied zwischen einer Bilanzierung nach HGB und nach IFRS und beschreiben Sie den Aufbau der IFRS.',
      part: {
        typ: 'kurzantwort',
        id: 'hgb-ifrs',
        frage:
          'Erläutern Sie den wesentlichen Unterschied zwischen einer Bilanzierung nach HGB und nach IFRS und beschreiben Sie den Aufbau der IFRS.',
        punkte: 4,
        checkliste: [
          {
            aussage:
              'Die IFRS stellen den Investor in den Mittelpunkt und gewichten die Ertragskraft stärker.',
            punkte: 1,
          },
          { aussage: 'Das HGB legt den Schwerpunkt auf den Schutz der Gläubiger.', punkte: 1 },
          {
            aussage:
              'Stufe 1: Rahmenkonzept (Framework) mit Zielen, Anforderungen und Definition der Abschlussposten.',
            punkte: 1,
          },
          {
            aussage:
              'Stufen 2 und 3: Interpretationen (IFRIC) für die einheitliche Anwendung und Einzelstandards (IAS/IFRS) für Ausweis und Einzelfragen.',
            punkte: 1,
          },
        ],
        muster:
          'Nach IFRS steht der Investor im Mittelpunkt: Der Abschluss soll möglichst realitätsnah über die Ertragskraft informieren. Das HGB betont dagegen den Gläubigerschutz. Die IFRS sind dreistufig aufgebaut: Das Rahmenkonzept (Framework) beschreibt Ziele und Anforderungen der Rechnungslegung und definiert die Abschlussposten. Die Interpretationen des IFRIC klären die einheitliche Anwendung in konkreten Fällen. Die Einzelstandards (IAS/IFRS) regeln Ausweis und Gliederung sowie Einzelfragen der Bilanzierung.',
      },
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'freut',
        text: 'Genug Außenwirkung, der Abschluss steht. Ab Januar baue ich die Kostenrechnung auf – dann wissen wir endlich, was eine Dose wirklich kostet.',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Wen stellen die IFRS in den Mittelpunkt?',
      optionen: [
        { text: 'Den Investor', richtig: true },
        { text: 'Den Gläubiger' },
        { text: 'Das Finanzamt' },
      ],
    },
    {
      frage:
        'Welche Stufe des IFRS-Regelwerks definiert Aktiva, Passiva, Erträge und Aufwendungen?',
      optionen: [
        { text: 'Das Rahmenkonzept (Framework)', richtig: true },
        { text: 'Die Interpretationen des IFRIC' },
        { text: 'IAS 1' },
      ],
    },
    {
      frage: 'Für wen sind die IFRS in der EU seit 2005 Pflicht?',
      optionen: [
        { text: 'Für kapitalmarktorientierte Unternehmen', richtig: true },
        { text: 'Für alle Kaufleute' },
        { text: 'Für alle Personengesellschaften' },
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
      'Gegen BA 8.1–8.2 geprüft (Investor- vs. Gläubigerorientierung, IASB, Geltung seit 2005, Vorteile, dreistufiger Aufbau, Basisannahmen und qualitative Anforderungen nach Lehrbrief-Stand); 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
