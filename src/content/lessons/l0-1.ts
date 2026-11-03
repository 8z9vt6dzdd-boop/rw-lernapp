// Lektion 0.1 – Erster Tag bei der MBG: Wozu das alles? (eigene Formulierung; fachlich geprüft gegen BA 2.1)
import type { Lektion } from './types';

const ADRESSATEN = ['intern', 'extern'];

export const lektion01: Lektion = {
  id: '0.1',
  skillId: '0.1-wozu',
  abschnitt: '0',
  titel: 'Erster Tag bei der MBG: Wozu das alles?',
  kernAha:
    'Rechnungswesen beantwortet drei Fragen – Was haben wir? Was haben wir verdient? Was kostet uns etwas? – für Finanzamt, Bank, Gesellschafter und Geschäftsführung.',
  dauerMin: 4,
  figuren: ['jana', 'tobias', 'leni', 'frank'],
  ort: 'buero',
  quelle: 'BA 2.1',
  teaser: {
    figur: 'jana',
    ausdruck: 'freut',
    text: 'Willkommen bei der MBG! Auf meinem Zettel stehen schon drei Anrufe für dich.',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'freut',
          text: 'Willkommen im Rechnungswesen der MBG, ich bin Jana! Heute Morgen haben schon drei Leute angerufen.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Die Sparkasse, das Finanzamt und Frank Wessel, einer unserer Gesellschafter.',
        },
      ],
      frage: 'Alle drei wollen etwas von der Buchhaltung. Was könnten sie wissen wollen?',
    },
    {
      typ: 'erkunden',
      titel: 'Drei Anrufe, drei Fragen',
      text: 'Tippe auf jede Notiz und sieh dir an, was dahintersteckt.',
      erkunden: {
        art: 'aufdecken',
        karten: [
          {
            titel: 'Was haben wir?',
            text: 'Die Sparkasse überlegt, der MBG einen Kredit zu geben. Sie will sehen, welche Werte die MBG besitzt und welche Schulden sie schon hat.',
            farbe: '#1c6670',
          },
          {
            titel: 'Was haben wir verdient?',
            text: 'Das Finanzamt berechnet die Steuer auf den Gewinn. Und Frank möchte wissen, wie viel Gewinn er und Sabine sich auszahlen können.',
            farbe: '#e8792b',
          },
          {
            titel: 'Was kostet uns etwas?',
            text: 'Die Geschäftsführung fragt, was eine Dose Paderquell Energy in der Herstellung wirklich kostet – sonst lässt sich kein vernünftiger Preis festlegen.',
            farbe: '#e2b13c',
          },
        ],
      },
      fazit:
        'Hinter fast jeder Frage an die Buchhaltung steckt eine dieser drei Fragen. Rechnungswesen liefert die Antworten – mit Zahlen, die jemand nachprüfen kann.',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Ich dachte immer, Buchhaltung heißt: Rechnungen abheften.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Abheften ist der Anfang. Keine Buchung ohne Beleg – aber aus den Belegen machen wir Antworten.',
        },
        {
          figur: 'jana',
          ausdruck: 'neutral',
          text: 'Wie bei deinem Haushaltsbuch: Was ist auf dem Konto, was blieb im Monat übrig, was kostet dich das Auto wirklich?',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Wer fragt was?',
      text: 'Ordne jede Anfrage der passenden Frage zu.',
      kategorien: ['Was haben wir?', 'Was haben wir verdient?', 'Was kostet uns etwas?'],
      elemente: [
        {
          text: 'Die Sparkasse will vor einem Kredit wissen, welche Werte und Schulden die MBG hat.',
          kategorie: 'Was haben wir?',
        },
        {
          text: 'Das Finanzamt berechnet die Steuer auf den Jahresgewinn.',
          kategorie: 'Was haben wir verdient?',
        },
        {
          text: 'Frank und Sabine wollen wissen, wie viel sie sich auszahlen können.',
          kategorie: 'Was haben wir verdient?',
        },
        {
          text: 'Die Geschäftsführung fragt, was eine Flasche Senne Lemon in der Herstellung kostet.',
          kategorie: 'Was kostet uns etwas?',
        },
        {
          text: 'Ein Dosenlieferant prüft, ob die MBG ihre Rechnungen bezahlen kann.',
          kategorie: 'Was haben wir?',
          erklaerung: 'Ob jemand zahlen kann, zeigt der Blick auf Vermögen und Schulden.',
        },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Vom Beleg zur Antwort',
      text: 'Rechnungswesen heißt: alle Geld- und Güterbewegungen der MBG lückenlos erfassen, ordnen und auswerten. Jede Zahl beginnt mit einem Beleg, wird gebucht und landet in einem Bericht.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: '1. Beleg',
            text: 'Rechnung, Kontoauszug, Quittung – der Nachweis, dass etwas passiert ist.',
            farbe: '#1c6670',
          },
          {
            titel: '2. Buchung',
            text: 'Der Vorgang wird geordnet festgehalten.',
            farbe: '#8cbf3f',
          },
          {
            titel: '3. Bericht',
            text: 'Bilanz, Gewinn- und Verlustrechnung, Kalkulation – die Antworten.',
            farbe: '#e8792b',
          },
        ],
      },
    },
    {
      typ: 'vorhersage',
      frage:
        'Die MBG hat dieses Jahr so viele Dosen verkauft wie nie zuvor. Hat sie damit automatisch mehr Gewinn gemacht?',
      figur: {
        figur: 'tobias',
        ausdruck: 'feiert',
        text: 'Rekordumsatz! Das heißt doch Rekordgewinn, oder?',
      },
      optionen: [
        { text: 'Ja – mehr verkauft heißt mehr verdient.' },
        {
          text: 'Nicht unbedingt – es kommt darauf an, was die Dosen gekostet haben.',
          richtig: true,
        },
        { text: 'Ja – der Gewinn ist das Geld, das auf dem Bankkonto liegt.' },
      ],
      aufloesung:
        'Gewinn ist, was nach Abzug aller Aufwendungen übrig bleibt. Wenn Zucker, Dosen und Energie teurer geworden sind, kann trotz Rekordumsatz weniger hängen bleiben. Und Gewinn ist nicht dasselbe wie Geld auf dem Konto – dazu später mehr.',
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Für wen rechnet die Buchhaltung eigentlich?',
      a: {
        figur: 'tobias',
        ausdruck: 'neutral',
        text: 'Für Zahlen interessiert sich doch nur das Finanzamt.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Gerade wir im Haus brauchen die Zahlen. Sonst legen wir Preise blind fest.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Die Geschäftsführung braucht Zahlen für Entscheidungen wie Preise oder neue Anlagen.',
          richtig: true,
        },
        { text: 'Das Finanzamt bekommt die Zahlen gar nicht zu sehen.' },
        { text: 'Zahlen braucht man nur einmal am Jahresende.' },
      ],
      aufloesung:
        'Es gibt Adressaten außerhalb der MBG (Finanzamt, Bank, Lieferanten) und innerhalb (Geschäftsführung, Abteilungen). Leni denkt an die internen, Tobias nur an einen externen.',
    },
    {
      typ: 'verstaendnis',
      frage: 'Warum gilt in der Buchhaltung „Keine Buchung ohne Beleg“?',
      figur: {
        figur: 'jana',
        ausdruck: 'gruebelt',
        text: 'Mein Lieblingssatz. Weißt du schon, warum?',
      },
      optionen: [
        {
          text: 'Damit jede Zahl später nachgeprüft werden kann.',
          richtig: true,
          erklaerung:
            'Genau. Belege machen die Buchhaltung nachvollziehbar – für das Finanzamt genauso wie für die eigene Kontrolle.',
        },
        {
          text: 'Weil Belege die Steuerlast senken.',
          erklaerung:
            'Belege senken keine Steuern. Sie beweisen, dass ein Vorgang wirklich stattgefunden hat.',
        },
        {
          text: 'Weil nur unterschriebene Belege gelten.',
          erklaerung:
            'Eine Unterschrift ist nicht der Punkt. Entscheidend ist, dass jede Buchung auf einen Nachweis zurückgeht.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: '0.1-m1',
      frage: 'Welche drei Fragen beantwortet das Rechnungswesen – und für wen?',
      text: 'Rechnungswesen beantwortet drei Fragen: Was haben wir? Was haben wir verdient? Was kostet uns etwas? Die Antworten brauchen Externe (Finanzamt, Bank) und Interne (Geschäftsführung).',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe:
        'Ordnen Sie die folgenden Adressaten des Rechnungswesens als intern oder extern ein.',
      part: {
        typ: 'rechenkette',
        id: 'adressaten',
        titel: 'Adressaten',
        felder: [
          {
            typ: 'auswahl',
            id: 'finanzamt',
            label: 'Finanzamt',
            optionen: ADRESSATEN,
            soll: 'extern',
          },
          {
            typ: 'auswahl',
            id: 'geschaeftsfuehrung',
            label: 'Geschäftsführung',
            optionen: ADRESSATEN,
            soll: 'intern',
          },
          {
            typ: 'auswahl',
            id: 'bank',
            label: 'Kreditgebende Bank',
            optionen: ADRESSATEN,
            soll: 'extern',
          },
          {
            typ: 'auswahl',
            id: 'vertriebsleitung',
            label: 'Leitung Vertrieb',
            optionen: ADRESSATEN,
            soll: 'intern',
          },
        ],
      },
      cliffhanger: {
        figur: 'frank',
        ausdruck: 'gruebelt',
        text: 'Die Sparkasse will bis Freitag wissen, wie wir dastehen. Und Jana will ihr ein Foto schicken – ein Foto?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Welche Frage beantwortet das Rechnungswesen für die kreditgebende Bank vor allem?',
      optionen: [
        { text: 'Was hat die MBG an Werten und Schulden?', richtig: true },
        { text: 'Welche Werbung lohnt sich?' },
        { text: 'Wie heißen die Lieferanten?' },
      ],
    },
    {
      frage: 'Wer ist ein interner Adressat des Rechnungswesens?',
      optionen: [
        { text: 'Die Geschäftsführung', richtig: true },
        { text: 'Das Finanzamt' },
        { text: 'Ein Lieferant' },
      ],
    },
    {
      frage: 'Ist Umsatz dasselbe wie Gewinn?',
      optionen: [
        { text: 'Nein, vom Umsatz gehen noch die Aufwendungen ab.', richtig: true },
        { text: 'Ja, das sind zwei Wörter für dasselbe.' },
        { text: 'Ja, aber nur am Jahresende.' },
      ],
    },
  ],
  checkliste: {
    raetsel: true,
    alltagVorFachbegriff: true,
    kernAhaErreicht: true,
    figurImDialog: true,
    klausurbrueckeUndCliffhanger: true,
    fachlichGeprueft: 'BA 2.1 (Aufgaben, Adressaten, Teilbereiche) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
