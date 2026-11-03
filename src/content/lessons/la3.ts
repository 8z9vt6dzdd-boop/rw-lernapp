// Lektion A3 – Kontenarten (eigene Formulierung; geprüft gegen BA 2.3.1.4 und 2.3.2.1)
import type { Lektion } from './types';

const ARTEN = ['Aktivkonto', 'Passivkonto', 'Aufwandskonto', 'Ertragskonto'];

export const lektionA3: Lektion = {
  id: 'A3',
  skillId: 'A3-kontenarten',
  abschnitt: 'A',
  titel: 'Vier Ordner im Regal: die Kontenarten',
  kernAha:
    'Es gibt vier Kontenarten: Aktivkonten (Vermögen) und Aufwandskonten wachsen im Soll, Passivkonten (Kapital, Schulden) und Ertragskonten im Haben. Aufwand und Ertrag sind Unterkonten des Eigenkapitals.',
  dauerMin: 6,
  figuren: ['tobias', 'jana', 'leni'],
  ort: 'buero',
  quelle: 'BA 2.3.1.4, 2.3.2.1',
  teaser: {
    figur: 'tobias',
    ausdruck: 'ueberrascht',
    text: 'Stromabschlag, Kundenrechnung, Kontoauszug – kommt das alles auf ein einziges Konto?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'ueberrascht',
          text: 'Hier liegen ein Stromabschlag, eine Kundenrechnung und ein Kontoauszug. Kommt das alles auf ein Konto?',
        },
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: 'Auf ein einziges Konto? Dann finden wir nie wieder etwas.',
        },
      ],
      frage:
        'Wie sortiert die Buchhaltung so verschiedene Dinge, damit man später noch durchblickt?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Stell dir vier Ordner im Regal vor: Was wir haben, was wir schulden, was uns etwas kostet und was uns etwas einbringt.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Die ersten beiden kennst du aus der Bilanz. Die anderen beiden zeigen, wie im Laufe des Jahres Gewinn entsteht.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage:
        'Die MBG überweist 4.000 € Miete für das Lager. Auf welcher Seite des Kontos Mietaufwendungen steht der Betrag?',
      optionen: [
        { text: 'Im Soll', richtig: true },
        { text: 'Im Haben' },
        { text: 'Gar nicht – Miete ist nur ein Abgang vom Bankkonto.' },
      ],
      aufloesung:
        'Aufwand verringert das Eigenkapital. Minderungen des Eigenkapitals stehen im Soll – deshalb wachsen Aufwandskonten im Soll. Auf dem Bankkonto steht die Miete zusätzlich als Abgang im Haben.',
    },
    {
      typ: 'konzept',
      titel: 'Vier Kontenarten',
      text: 'Bestandskonten (aktiv und passiv) zeigen, was am Stichtag da ist. Erfolgskonten (Aufwand und Ertrag) sammeln, was im Jahr verbraucht oder verdient wird – sie sind Unterkonten des Eigenkapitals.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Aktivkonten',
            text: 'Vermögen: Bank, Rohstoffe, Maschinen, Forderungen. Zugänge im Soll.',
            farbe: '#1c6670',
          },
          {
            titel: 'Passivkonten',
            text: 'Kapital und Schulden: Eigenkapital, Darlehen, Verbindlichkeiten. Zugänge im Haben.',
            farbe: '#e2b13c',
          },
          {
            titel: 'Aufwandskonten',
            text: 'Werteverzehr: Löhne, Miete, Rohstoffverbrauch. Zugänge im Soll.',
            farbe: '#e8792b',
          },
          {
            titel: 'Ertragskonten',
            text: 'Wertzuwachs: Umsatzerlöse, Zinserträge. Zugänge im Haben.',
            farbe: '#8cbf3f',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'In welchen Ordner gehört das Konto?',
      kategorien: ARTEN,
      elemente: [
        {
          text: 'Vorsteuer',
          kategorie: 'Aktivkonto',
          erklaerung: 'Die Vorsteuer bekommt die MBG vom Finanzamt zurück – eine Forderung.',
        },
        {
          text: 'Umsatzsteuer',
          kategorie: 'Passivkonto',
          erklaerung: 'Die Umsatzsteuer schuldet die MBG dem Finanzamt.',
        },
        { text: 'Löhne', kategorie: 'Aufwandskonto' },
        { text: 'Umsatzerlöse für eigene Erzeugnisse', kategorie: 'Ertragskonto' },
        { text: 'Fuhrpark', kategorie: 'Aktivkonto' },
        { text: 'Darlehensschulden', kategorie: 'Passivkonto' },
        { text: 'Mietaufwendungen', kategorie: 'Aufwandskonto' },
        { text: 'Zinserträge', kategorie: 'Ertragskonto' },
      ],
    },
    {
      typ: 'erkunden',
      titel: 'Ein Ertragskonto füllen',
      text: 'Buche die Verkäufe der Woche auf das Konto Umsatzerlöse. Ertragskonten starten ohne Anfangsbestand.',
      erkunden: {
        art: 'tkonto-buchen',
        konto: 'Umsatzerlöse für eigene Erzeugnisse',
        vorgaenge: [
          { text: 'Verkauf Senne Lemon an einen Getränkemarkt', betrag: '12000', seite: 'haben' },
          { text: 'Verkauf Paderquell Energy an ein Hotel', betrag: '8000', seite: 'haben' },
          { text: 'Rücksendung beschädigter Dosen (Storno)', betrag: '1000', seite: 'soll' },
        ],
      },
      fazit:
        'Erträge wachsen im Haben, Stornos mindern sie im Soll. Der Saldo steht im Soll – am Jahresende wird er in die Gewinn- und Verlustrechnung übertragen.',
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Ist die Vorsteuer ein Aufwand?',
      a: {
        figur: 'tobias',
        ausdruck: 'neutral',
        text: 'Vorsteuer ist eine Steuer. Also ist sie Aufwand.',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Die Vorsteuer holen wir uns vom Finanzamt zurück. Sie ist eine Forderung.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Die Vorsteuer ist ein Anspruch gegenüber dem Finanzamt – also Vermögen auf einem Aktivkonto.',
          richtig: true,
        },
        { text: 'Alle Steuern sind grundsätzlich Aufwand.' },
        { text: 'Die Vorsteuer ist eine Schuld gegenüber dem Lieferanten.' },
      ],
      aufloesung:
        'Die Vorsteuer kostet die MBG am Ende nichts, weil das Finanzamt sie erstattet. Deshalb steht sie als Forderung auf einem Aktivkonto und nicht in der Gewinn- und Verlustrechnung.',
    },
    {
      typ: 'verstaendnis',
      frage: 'Welche Aussage über Erfolgskonten stimmt?',
      optionen: [
        {
          text: 'Sie haben keinen Anfangsbestand und werden über die Gewinn- und Verlustrechnung abgeschlossen.',
          richtig: true,
          erklaerung:
            'Genau. Aufwands- und Ertragskonten beginnen jedes Jahr bei null und landen am Ende im GuV-Konto.',
        },
        {
          text: 'Sie werden direkt in das Schlussbilanzkonto abgeschlossen.',
          erklaerung:
            'Ins Schlussbilanzkonto gehen die Bestandskonten. Erfolgskonten laufen über die GuV.',
        },
        {
          text: 'Sie übernehmen ihren Anfangsbestand aus dem Vorjahr.',
          erklaerung:
            'Das gilt für Bestandskonten. Erfolgskonten starten jedes Jahr ohne Anfangsbestand.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'A3-m1',
      frage: 'Welche vier Kontenarten gibt es, und auf welcher Seite stehen jeweils die Zugänge?',
      text: 'Aktivkonten (Vermögen) und Aufwandskonten nehmen im Soll zu. Passivkonten (Kapital, Schulden) und Ertragskonten nehmen im Haben zu. Aufwand und Ertrag sind Unterkonten des Eigenkapitals.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe: 'Ordnen Sie die folgenden Konten der richtigen Kontenart zu.',
      part: {
        typ: 'rechenkette',
        id: 'kontenarten',
        titel: 'Kontenarten',
        felder: [
          {
            typ: 'auswahl',
            id: 'rohstoffe',
            label: 'Rohstoffe',
            optionen: ARTEN,
            soll: 'Aktivkonto',
          },
          {
            typ: 'auswahl',
            id: 'verbindlichkeiten',
            label: 'Verbindlichkeiten aus Lieferungen und Leistungen',
            optionen: ARTEN,
            soll: 'Passivkonto',
          },
          {
            typ: 'auswahl',
            id: 'gehaelter',
            label: 'Gehälter',
            optionen: ARTEN,
            soll: 'Aufwandskonto',
          },
          {
            typ: 'auswahl',
            id: 'provision',
            label: 'Provisionserträge',
            optionen: ARTEN,
            soll: 'Ertragskonto',
          },
        ],
      },
      cliffhanger: {
        figur: 'frank',
        ausdruck: 'gruebelt',
        text: 'Die Sparkasse bietet uns 50.000 € Kredit für eine neue Abfülllinie an. Was macht das mit unserer Bilanz?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Auf welcher Seite nimmt ein Passivkonto zu?',
      optionen: [
        { text: 'Im Haben', richtig: true },
        { text: 'Im Soll' },
        { text: 'Auf beiden Seiten' },
      ],
    },
    {
      frage: 'Welches Konto ist ein Aufwandskonto?',
      optionen: [{ text: 'Löhne', richtig: true }, { text: 'Vorsteuer' }, { text: 'Zinserträge' }],
    },
    {
      frage: 'Wovon sind Aufwands- und Ertragskonten Unterkonten?',
      optionen: [
        { text: 'Vom Eigenkapital', richtig: true },
        { text: 'Vom Bankkonto' },
        { text: 'Vom Schlussbilanzkonto' },
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
      'BA 2.3.1.4 (Aktiv-/Passivkonten), 2.3.2.1 (Aufwands-/Ertragskonten als Unterkonten des EK) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
