// Lektion 0.4 – Vom Foto zum Film: Gewinn und Verlust (eigene Formulierung; geprüft gegen BA 2.3.2, 2.3.3)
import { formatEuro, sum } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: { value: { toString(): string } }) => formatEuro(v.value.toString());

// Konzept: GuV der MBG (Werte von der Engine summiert)
const ERLOESE = sum(['900000']);
const AUFWAND = sum(['350000', '300000', '70000', '100000']);
const GEWINN = ERLOESE.minus(AUFWAND);

// Verständnisfrage
const ERTRAEGE_FRAGE = sum(['1200000']);
const AUFWAND_FRAGE = sum(['1050000']);
const ERFOLG_FRAGE = ERTRAEGE_FRAGE.minus(AUFWAND_FRAGE);

// Klausurbrücke
const ERTRAEGE = sum(['640000', '4000']);
const AUFWENDUNGEN = sum(['260000', '190000', '48000', '56000']);
const ERFOLG = ERTRAEGE.minus(AUFWENDUNGEN);

export const lektion04: Lektion = {
  id: '0.4',
  skillId: '0.4-guv',
  abschnitt: '0',
  titel: 'Vom Foto zum Film: Gewinn und Verlust',
  kernAha:
    'Die Gewinn- und Verlustrechnung zeigt, was im Jahr verdient wurde: Erträge minus Aufwendungen. Gewinn ist nicht dasselbe wie Geld auf dem Konto.',
  dauerMin: 5,
  figuren: ['frank', 'sabine', 'jana', 'leni', 'tobias'],
  ort: 'gesellschafter',
  quelle: 'BA 2.3.2, 2.3.3',
  teaser: {
    figur: 'frank',
    ausdruck: 'gruebelt',
    text: 'Wir haben Gewinn gemacht, aber das Bankkonto ist fast leer. Wie kann das sein?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'gruebelt',
          text: `Laut Jana haben wir ${e(GEWINN)} Gewinn gemacht. Aber auf dem Bankkonto liegen nur 12.000 €.`,
        },
        {
          figur: 'sabine',
          ausdruck: 'ueberrascht',
          text: 'Hat jemand das Geld unter der Abfüllanlage versteckt?',
        },
      ],
      frage: 'Gewinn gemacht, aber kaum Geld auf dem Konto – wie kann das sein?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Die Bilanz ist das Foto vom 31.12. Die Gewinn- und Verlustrechnung ist der Film des ganzen Jahres.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Im Film sieht man, was das Jahr über dazukam und was verbraucht wurde. Nicht nur, was am Ende übrig ist.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Macht uns das reicher oder ärmer?',
      text: 'Ordne die Vorgänge des Jahres zu.',
      kategorien: ['Ertrag (macht reicher)', 'Aufwand (macht ärmer)'],
      elemente: [
        {
          text: 'Verkauf von Paderquell Energy an einen Großhändler',
          kategorie: 'Ertrag (macht reicher)',
        },
        { text: 'Löhne der Abfüllcrew', kategorie: 'Aufwand (macht ärmer)' },
        {
          text: 'Zucker wird in der Produktion verbraucht',
          kategorie: 'Aufwand (macht ärmer)',
          erklaerung: 'Verbrauchte Rohstoffe sind Werteverzehr – also Aufwand.',
        },
        { text: 'Zinsen auf das Festgeldkonto', kategorie: 'Ertrag (macht reicher)' },
        { text: 'Miete für das Logistikzentrum', kategorie: 'Aufwand (macht ärmer)' },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Gewinn = Erträge minus Aufwendungen',
      text: 'Erträge sind der Wertzuwachs des Jahres, Aufwendungen der Werteverzehr. Sind die Erträge größer, ist die Differenz Gewinn – er erhöht das Eigenkapital. Sind die Aufwendungen größer, entsteht ein Verlust.',
      visual: {
        typ: 'tkonto',
        name: 'Gewinn- und Verlustkonto',
        untertitel: 'MBG, Geschäftsjahr (vereinfacht)',
        soll: [
          { text: 'Rohstoffe', betrag: '350000' },
          { text: 'Löhne', betrag: '300000' },
          { text: 'Miete', betrag: '70000' },
          { text: 'Sonstiges', betrag: '100000' },
        ],
        haben: [{ text: 'Umsatzerlöse', betrag: '900000' }],
        saldo: true,
      },
    },
    {
      typ: 'vorhersage',
      frage:
        'Die MBG liefert im Dezember Getränke auf Rechnung. Der Kunde zahlt erst im Februar. Zählt der Verkauf zum Gewinn dieses Jahres?',
      optionen: [
        { text: 'Nein – erst wenn das Geld da ist.' },
        { text: 'Ja – der Ertrag entsteht mit der Lieferung.', richtig: true },
        { text: 'Nur zur Hälfte.' },
      ],
      aufloesung:
        'Der Ertrag gehört in das Jahr der Lieferung. Statt Geld hat die MBG am 31.12. eine Forderung gegen den Kunden. So entsteht Gewinn, ohne dass das Bankkonto wächst.',
    },
    {
      typ: 'erkunden',
      titel: 'Wo ist das Geld geblieben?',
      text: 'Drei Vorfälle aus dem Jahr der MBG (vereinfacht, ohne Steuern). Buche sie und beobachte Bank und Eigenkapital.',
      erkunden: {
        art: 'geschaeftsvorfall',
        start: {
          links: [
            { text: 'Maschinen', betrag: '300000' },
            { text: 'Forderungen', betrag: '20000' },
            { text: 'Bank', betrag: '72000' },
          ],
          rechts: [
            { text: 'Eigenkapital', betrag: '242000' },
            { text: 'Darlehen', betrag: '150000' },
          ],
        },
        vorfaelle: [
          {
            text: 'Verkauf auf Rechnung bringt 50.000 € Gewinn',
            aenderungen: [
              { seite: 'links', text: 'Forderungen', delta: '50000' },
              { seite: 'rechts', text: 'Eigenkapital', delta: '50000' },
            ],
          },
          {
            text: 'Neue Etikettiermaschine per Bank bezahlt (40.000 €)',
            aenderungen: [
              { seite: 'links', text: 'Maschinen', delta: '40000' },
              { seite: 'links', text: 'Bank', delta: '-40000' },
            ],
          },
          {
            text: 'Darlehen teilweise per Bank getilgt (20.000 €)',
            aenderungen: [
              { seite: 'links', text: 'Bank', delta: '-20000' },
              { seite: 'rechts', text: 'Darlehen', delta: '-20000' },
            ],
          },
        ],
      },
      fazit:
        'Das Eigenkapital ist durch den Gewinn gewachsen, die Bank aber von 72.000 € auf 12.000 € geschrumpft. Der Gewinn steckt in der Forderung, das Geld in der neuen Maschine und im getilgten Darlehen.',
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Können sich Frank und Sabine den Gewinn jetzt einfach auszahlen?',
      a: {
        figur: 'sabine',
        ausdruck: 'gruebelt',
        text: 'Dafür fehlt uns gerade das Geld auf dem Konto.',
      },
      b: { figur: 'tobias', ausdruck: 'feiert', text: 'Gewinn ist Gewinn. Einfach überweisen!' },
      richtig: 'a',
      begruendungen: [
        {
          text: 'Der Gewinn steckt zum Teil in Forderungen und Anlagen, nicht auf dem Bankkonto.',
          richtig: true,
        },
        { text: 'Gesellschafter dürfen sich nie etwas auszahlen.' },
        { text: 'Die Bank verbietet Auszahlungen im Dezember.' },
      ],
      aufloesung:
        'Gewinn ist eine Rechengröße: Erträge minus Aufwendungen. Ob dafür Geld auf dem Konto liegt, ist eine andere Frage – darum schauen Firmen immer auf beides.',
    },
    {
      typ: 'verstaendnis',
      frage: `Erträge ${e(ERTRAEGE_FRAGE)}, Aufwendungen ${e(AUFWAND_FRAGE)}. Was zeigt die GuV?`,
      optionen: [
        {
          text: `Gewinn von ${e(ERFOLG_FRAGE)}`,
          richtig: true,
          erklaerung: 'Richtig: Erträge minus Aufwendungen.',
        },
        {
          text: `Verlust von ${e(ERFOLG_FRAGE)}`,
          erklaerung: 'Die Erträge sind größer als die Aufwendungen – also Gewinn.',
        },
        {
          text: `Gewinn von ${e(ERTRAEGE_FRAGE)}`,
          erklaerung: 'Das sind nur die Erträge. Die Aufwendungen müssen noch abgezogen werden.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: '0.4-m1',
      frage: 'Was zeigt die Gewinn- und Verlustrechnung – und warum ist Gewinn nicht gleich Geld?',
      text: 'GuV = Film des Jahres: Erträge minus Aufwendungen ergibt Gewinn oder Verlust, der das Eigenkapital verändert. Gewinn ist nicht gleich Geld auf dem Konto – er kann in Forderungen oder Anlagen stecken.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe:
        'Aus der Buchführung der MBG: Umsatzerlöse 640.000,00 €, Zinserträge 4.000,00 €, Aufwendungen für Rohstoffe 260.000,00 €, Löhne 190.000,00 €, Mietaufwendungen 48.000,00 €, Abschreibungen auf Sachanlagen 56.000,00 €. Ermitteln Sie Erträge, Aufwendungen und den Erfolg.',
      part: {
        typ: 'rechenkette',
        id: 'guv',
        titel: 'Gewinn- und Verlustrechnung',
        felder: [
          {
            typ: 'zahl',
            id: 'ertraege',
            label: 'Summe der Erträge',
            kind: 'betrag',
            einheit: '€',
            soll: ERTRAEGE,
          },
          {
            typ: 'zahl',
            id: 'aufwendungen',
            label: 'Summe der Aufwendungen',
            kind: 'betrag',
            einheit: '€',
            soll: AUFWENDUNGEN,
          },
          {
            typ: 'zahl',
            id: 'erfolg',
            label: 'Erfolg',
            kind: 'betrag',
            einheit: '€',
            soll: ERFOLG,
          },
          {
            typ: 'auswahl',
            id: 'art',
            label: 'Der Erfolg ist ein …',
            optionen: ['Gewinn', 'Verlust'],
            soll: 'Gewinn',
          },
        ],
      },
      cliffhanger: {
        figur: 'jana',
        ausdruck: 'gruebelt',
        text: 'Morgen zeige ich dir, warum jeder Vorgang zwei Seiten hat. Tobias experimentiert nämlich gerade mit der Kasse.',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Wie ergibt sich der Gewinn in der GuV?',
      optionen: [
        { text: 'Erträge minus Aufwendungen', richtig: true },
        { text: 'Vermögen minus Schulden' },
        { text: 'Einzahlungen auf dem Bankkonto' },
      ],
    },
    {
      frage: 'Die MBG hat Gewinn gemacht. Muss dann auch das Bankkonto gestiegen sein?',
      optionen: [
        { text: 'Nein, der Gewinn kann etwa in Forderungen oder Anlagen stecken.', richtig: true },
        { text: 'Ja, immer um genau den Gewinn.' },
        { text: 'Ja, aber erst im Folgejahr.' },
      ],
    },
    {
      frage: 'Was verändert ein Gewinn in der Bilanz?',
      optionen: [
        { text: 'Er erhöht das Eigenkapital.', richtig: true },
        { text: 'Er erhöht die Schulden.' },
        { text: 'Gar nichts.' },
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
      'BA 2.3.2 (Aufwand und Ertrag, Erfolgskonten als Unterkonten des Eigenkapitals, Abschluss über GuV), BA 2.3.3 (Eigenkapital als Bindeglied) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
