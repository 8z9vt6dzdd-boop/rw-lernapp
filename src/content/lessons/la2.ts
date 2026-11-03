// Lektion A2 – Grundsätze ordnungsmäßiger Buchführung (eigene Formulierung; geprüft gegen BA 2.2.1, 2.2.2)
import type { Lektion } from './types';

const GRUNDSAETZE = [
  'Beleggrundsatz',
  'Vollständigkeit',
  'Bilanzidentität',
  'Klarheit und Übersichtlichkeit',
];

export const lektionA2: Lektion = {
  id: 'A2',
  skillId: 'A2-gob',
  abschnitt: 'A',
  titel: 'Grundsätze ordnungsmäßiger Buchführung',
  kernAha:
    'Kaufleute wie die MBG müssen Bücher führen – nach festen Spielregeln (GoB): keine Buchung ohne Beleg, vollständig und zeitlich geordnet, klar, nichts unkenntlich machen, alles aufbewahren.',
  dauerMin: 6,
  figuren: ['jana', 'tobias', 'leni', 'frank'],
  ort: 'buero',
  quelle: 'BA 2.2.1, 2.2.2',
  teaser: {
    figur: 'jana',
    ausdruck: 'entsetzt',
    text: 'Tobias hat mit Tipp-Ex einen Betrag auf einer Rechnung geändert. So geht das nicht.',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'entsetzt',
          text: 'Tobias, hast du gerade auf einer Rechnung einen Betrag mit Tipp-Ex geändert?',
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Da war ein Zahlendreher drin – jetzt stimmt es doch!',
        },
      ],
      frage: 'Tobias wollte nur helfen. Warum ist Jana trotzdem entsetzt?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Stell dir einen Schiedsrichter vor, der nachträglich Tore wegradiert. Danach vertraut niemand mehr dem Spielstand.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Darum gibt es feste Spielregeln für die Buchhaltung: die Grundsätze ordnungsmäßiger Buchführung, kurz GoB.',
        },
      ],
    },
    {
      typ: 'verstaendnis',
      frage: 'Muss die MBG überhaupt Bücher führen?',
      figur: {
        figur: 'frank',
        ausdruck: 'gruebelt',
        text: 'Wir sind doch nur eine Getränkefirma, kein Konzern.',
      },
      optionen: [
        {
          text: 'Ja – als OHG ist sie Kaufmann und damit buchführungspflichtig.',
          richtig: true,
          erklaerung:
            'Richtig: Jeder Kaufmann muss Bücher führen (§ 238 HGB). Eine OHG ist immer Kaufmann.',
        },
        {
          text: 'Nur wenn sie mehr als 600.000 € Umsatz im Jahr hat.',
          erklaerung:
            'Diese Grenze befreit nur Einzelkaufleute (§ 241a HGB). Für eine OHG gilt sie nicht.',
        },
        {
          text: 'Nein, Buchführung ist freiwillig.',
          erklaerung: 'Für Kaufleute ist die Buchführung gesetzlich vorgeschrieben.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Ordnungsgemäß oder nicht?',
      text: 'Was passiert in der Buchhaltung der MBG – und was verstößt gegen die Spielregeln?',
      kategorien: ['Ordnungsgemäß', 'Verstößt gegen die GoB'],
      elemente: [
        { text: 'Jede Buchung hat einen Beleg mit Nummer.', kategorie: 'Ordnungsgemäß' },
        {
          text: 'Ein Fehler wird mit Tipp-Ex überdeckt.',
          kategorie: 'Verstößt gegen die GoB',
          erklaerung:
            'Änderungen müssen erkennbar bleiben. Fehler werden durch eine Gegenbuchung (Storno) korrigiert.',
        },
        { text: 'Buchungen werden in zeitlicher Reihenfolge erfasst.', kategorie: 'Ordnungsgemäß' },
        {
          text: 'Belege werden direkt nach dem Buchen weggeworfen.',
          kategorie: 'Verstößt gegen die GoB',
          erklaerung:
            'Für Bücher, Inventare und Belege gelten gesetzliche Aufbewahrungsfristen – für Buchungsbelege acht Jahre.',
        },
        { text: 'Jedes Konto hat eine klare, eindeutige Bezeichnung.', kategorie: 'Ordnungsgemäß' },
        {
          text: 'Franks private Tankquittung wird als Firmenausgabe gebucht.',
          kategorie: 'Verstößt gegen die GoB',
          erklaerung:
            'Private Ausgaben der Gesellschafter gehören nicht als Aufwand in die Buchhaltung der Firma.',
        },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Die wichtigsten Spielregeln',
      text: 'Keine Buchung ohne Beleg. Alles vollständig und in zeitlicher Reihenfolge erfassen. Klar bezeichnen. Nichts unkenntlich machen – Fehler korrigiert eine Gegenbuchung. Unterlagen über die gesetzlichen Fristen aufbewahren.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Beleggrundsatz',
            text: 'Für jede Buchung gibt es einen Nachweis.',
            farbe: '#1c6670',
          },
          {
            titel: 'Vollständigkeit',
            text: 'Alle buchungspflichtigen Vorgänge werden erfasst.',
            farbe: '#8cbf3f',
          },
          {
            titel: 'Klarheit',
            text: 'Eindeutig bezeichnet, verständlich geordnet.',
            farbe: '#e2b13c',
          },
          {
            titel: 'Nichts unkenntlich',
            text: 'Korrekturen per Storno, nie per Radiergummi.',
            farbe: '#e8792b',
          },
          {
            titel: 'Aufbewahren',
            text: 'Bücher 10 Jahre, Belege 8 Jahre, Briefe 6 Jahre.',
            farbe: '#4a9fd8',
          },
        ],
      },
    },
    {
      typ: 'fehlerjagd',
      titel: 'Tobias’ Woche in der Buchhaltung',
      text: 'Tobias hat drei Vorgänge notiert. Einer verstößt gegen die GoB. Tippe ihn an.',
      zeilen: [
        '14.02.: Eingangsrechnung des Dosenwerks gebucht, Beleg Nr. 0451',
        '15.02.: Barverkauf auf dem Werksfest gebucht – ohne Beleg, war ja nur bar',
        '16.02.: Falschen Betrag per Gegenbuchung storniert und richtig neu gebucht',
      ],
      fehlerZeile: 1,
      gruende: [
        { text: 'Auch Bargeschäfte brauchen einen Beleg (Beleggrundsatz).', richtig: true },
        { text: 'Stornobuchungen sind verboten.' },
        { text: 'Belegnummern dürfen nicht notiert werden.' },
      ],
      aufloesung:
        'Keine Buchung ohne Beleg – auch nicht beim Bargeld. Zeile 3 ist übrigens genau richtig: Fehler werden per Storno korrigiert, damit jede Änderung sichtbar bleibt.',
    },
    {
      typ: 'verstaendnis',
      frage: 'Wie lange muss die MBG eine Eingangsrechnung aus dem Jahr 2025 aufbewahren?',
      figur: {
        figur: 'sabine',
        ausdruck: 'gruebelt',
        text: 'Der Keller ist voll mit Ordnern. Was davon darf weg?',
      },
      optionen: [
        {
          text: '8 Jahre, gerechnet ab dem Ende des Jahres 2025',
          richtig: true,
          erklaerung:
            'Richtig: Buchungsbelege wie Rechnungen, Quittungen und Kontoauszüge 8 Jahre. Handelsbücher, Inventare, Eröffnungsbilanzen, Jahresabschlüsse und Lageberichte 10 Jahre, Geschäftsbriefe 6 Jahre. Die Frist beginnt mit dem Schluss des Kalenderjahres.',
        },
        {
          text: '6 Jahre ab dem Rechnungsdatum',
          erklaerung:
            '6 Jahre gelten für Handels- und Geschäftsbriefe. Rechnungen sind Buchungsbelege: 8 Jahre, und die Frist beginnt erst mit dem Schluss des Kalenderjahres.',
        },
        {
          text: '10 Jahre, wie alle Unterlagen',
          erklaerung:
            'Für Buchungsbelege galten bis Ende 2024 zehn Jahre, seit 2025 sind es acht. Ältere Unterlagen – auch der Lehrbrief – nennen deshalb oft noch 10 Jahre. 10 Jahre gelten weiter für Bücher, Inventare und Jahresabschlüsse.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Gelten die GoB für eine Firma wie die MBG in voller Strenge?',
      a: {
        figur: 'frank',
        ausdruck: 'neutral',
        text: 'Wir sind klein. Für uns gelten die Regeln bestimmt etwas lockerer.',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Die GoB gelten für alle Kaufleute. Egal wie groß, egal welche Rechtsform.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Die GoB gelten unabhängig von Rechtsform und Größe für alle Kaufleute.',
          richtig: true,
        },
        { text: 'Die GoB gelten nur für Aktiengesellschaften.' },
        { text: 'Für kleine Firmen gibt es eigene, lockerere GoB.' },
      ],
      aufloesung:
        'Die Grundsätze ordnungsmäßiger Buchführung gelten für jeden Kaufmann. Sie sollen Eigentümer und Gläubiger vor falschen Zahlen schützen.',
    },
    {
      typ: 'vorhersage',
      frage:
        'Die Schlussbilanz zum 31.12. zeigt ein Bankguthaben von 48.000 €. Was steht in der Eröffnungsbilanz am 1.1. des neuen Jahres?',
      optionen: [
        { text: 'Ebenfalls 48.000 €.', richtig: true },
        { text: 'Ein am 1.1. neu ermittelter Wert.' },
        { text: '0 € – das neue Jahr beginnt bei null.' },
      ],
      aufloesung:
        'Schlussbilanz und Eröffnungsbilanz des Folgejahres müssen übereinstimmen. Dieser Grundsatz heißt Bilanzidentität – über Nacht verschwindet kein Euro.',
    },
    {
      typ: 'merksatz',
      id: 'A2-m1',
      frage: 'Was verlangen die Grundsätze ordnungsmäßiger Buchführung (GoB)?',
      text: 'Alle Kaufleute führen Bücher nach den GoB: keine Buchung ohne Beleg, vollständig und zeitlich geordnet, klar bezeichnet, nichts unkenntlich machen (Korrektur per Storno), Fristen einhalten (Bücher 10, Belege 8, Briefe 6 Jahre). Schlussbilanz = Eröffnungsbilanz des Folgejahres.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe:
        'Ordnen Sie den Beschreibungen den jeweiligen Grundsatz ordnungsmäßiger Buchführung zu.',
      part: {
        typ: 'rechenkette',
        id: 'gob',
        titel: 'Grundsätze ordnungsmäßiger Buchführung',
        felder: [
          {
            typ: 'auswahl',
            id: 'beleg',
            label: 'Für jede Buchung muss ein Nachweis vorliegen.',
            optionen: GRUNDSAETZE,
            soll: 'Beleggrundsatz',
          },
          {
            typ: 'auswahl',
            id: 'vollstaendig',
            label: 'Alle buchungspflichtigen Vorgänge werden erfasst.',
            optionen: GRUNDSAETZE,
            soll: 'Vollständigkeit',
          },
          {
            typ: 'auswahl',
            id: 'identitaet',
            label: 'Schlussbilanz und Eröffnungsbilanz des Folgejahres stimmen überein.',
            optionen: GRUNDSAETZE,
            soll: 'Bilanzidentität',
          },
          {
            typ: 'auswahl',
            id: 'klarheit',
            label: 'Posten sind eindeutig bezeichnet und verständlich geordnet.',
            optionen: GRUNDSAETZE,
            soll: 'Klarheit und Übersichtlichkeit',
          },
        ],
      },
      cliffhanger: {
        figur: 'jana',
        ausdruck: 'freut',
        text: 'Ordnung ist das halbe Leben – die andere Hälfte sind Konten. Morgen sortieren wir alle Konten der MBG in vier Schubladen.',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Wie wird ein Buchungsfehler ordnungsgemäß korrigiert?',
      optionen: [
        { text: 'Durch eine Gegenbuchung (Storno)', richtig: true },
        { text: 'Durch Überschreiben des Betrags' },
        { text: 'Durch Löschen des Belegs' },
      ],
    },
    {
      frage: 'Für wen gelten die Grundsätze ordnungsmäßiger Buchführung?',
      optionen: [
        { text: 'Für alle Kaufleute, unabhängig von der Rechtsform', richtig: true },
        { text: 'Nur für Aktiengesellschaften' },
        { text: 'Nur für Firmen mit mehr als 50 Beschäftigten' },
      ],
    },
    {
      frage: 'Was besagt die Bilanzidentität?',
      optionen: [
        {
          text: 'Schlussbilanz und Eröffnungsbilanz des Folgejahres stimmen überein.',
          richtig: true,
        },
        { text: 'Aktiva und Passiva sind immer gleich groß.' },
        { text: 'Jede Bilanz hat dieselben Posten.' },
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
      'BA 2.2.1 (Buchführungspflicht nach § 238 HGB, Befreiung von Einzelkaufleuten nach § 241a HGB), BA 2.2.2 (GoB gelten für alle Kaufleute; Beleggrundsatz, Vollständigkeit, chronologische und erkennbare Aufzeichnung, Klarheit, Aufbewahrung, Bilanzidentität) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
