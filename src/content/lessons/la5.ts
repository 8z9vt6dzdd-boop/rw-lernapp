// Lektion A5 – Einfache und zusammengesetzte Buchungssätze (eigene Formulierung; geprüft gegen BA 2.3.1.5)
import { loesung, satz, zeile } from '../../engine/booking';
import { Val, formatEuro } from '../../engine/money';
import type { Lektion } from './types';

// Zahlen von der Engine
const e = (v: Val) => formatEuro(v.value);
const RECHNUNG = new Val('7500');
const BAR = new Val('500');
const BANK = RECHNUNG.minus(BAR);
const FORDERUNG = new Val('6000');
const KUNDE_BAR = new Val('1500');
const KUNDE_BANK = FORDERUNG.minus(KUNDE_BAR);

export const lektionA5: Lektion = {
  id: 'A5',
  skillId: 'A5-buchungssatz-basis',
  abschnitt: 'A',
  titel: 'Ein Satz, ein Wort in der Mitte: der Buchungssatz',
  kernAha:
    'Ein Buchungssatz nennt zuerst das Konto im Soll, dann nach „an“ das Konto im Haben. Zusammengesetzte Sätze haben mehrere Konten – die Summen im Soll und im Haben sind immer gleich.',
  dauerMin: 6,
  figuren: ['tobias', 'jana', 'leni'],
  ort: 'buero',
  quelle: 'BA 2.3.1.5',
  teaser: {
    figur: 'tobias',
    ausdruck: 'ueberrascht',
    text: 'Fünf Belege bis Feierabend? Dann muss ich mich kurz fassen.',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'gruebelt',
          text: 'Ich habe zu jedem Beleg einen ganzen Absatz geschrieben, wer was wann bezahlt hat.',
        },
        {
          figur: 'jana',
          ausdruck: 'freut',
          text: 'In der Buchhaltung reicht ein einziger Satz. Mit nur einem kleinen Wort in der Mitte.',
        },
      ],
      frage: 'Welches Wort ist das – und wie sieht so ein Satz aus?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Ein Buchungssatz ist eine Kurznachricht: zuerst das Konto im Soll, dann das Konto im Haben.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Dazwischen steht nur das Wort „an“. Es bedeutet nichts, es trennt nur die beiden Seiten.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: 'Die MBG kauft Zucker für 6.000 € auf Ziel. Welcher Buchungssatz passt?',
      optionen: [
        { text: 'Rohstoffe an Verbindlichkeiten aus Lieferungen und Leistungen', richtig: true },
        { text: 'Verbindlichkeiten aus Lieferungen und Leistungen an Rohstoffe' },
        { text: 'Rohstoffe an Bank' },
      ],
      aufloesung:
        'Der Rohstoffbestand nimmt zu (Aktivkonto, Soll), die Schuld beim Lieferanten auch (Passivkonto, Haben). Bezahlt ist noch nichts – deshalb taucht die Bank gar nicht auf.',
    },
    {
      typ: 'vorgerechnet',
      titel: 'In vier Schritten zum Buchungssatz',
      text: 'Beleg: Die MBG überweist die Lagermiete von 3.000 € per Bank.',
      schritte: [
        {
          text: 'Welche Konten sind berührt?',
          rechnung: 'Mietaufwendungen und Bank',
          warum:
            'Jeder Vorfall berührt mindestens zwei Konten: hier den Aufwand für die Miete und das Bankkonto.',
        },
        {
          text: 'Welche Kontenarten sind das?',
          rechnung: 'Aufwandskonto und Aktivkonto',
          warum: 'Die Kontenart verrät, auf welcher Seite ein Zugang steht.',
        },
        {
          text: 'Zugang oder Abgang?',
          rechnung: 'Aufwand nimmt zu (Soll), Bank nimmt ab (Haben)',
          warum: 'Aufwandskonten wachsen im Soll, Aktivkonten verlieren im Haben.',
        },
        {
          text: 'Buchungssatz bilden',
          rechnung: 'Mietaufwendungen 3.000,00 € an Bank 3.000,00 €',
          warum: 'Erst Soll, dann „an“, dann Haben – beide Seiten gleich hoch.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Welches Konto steht im Soll?',
      text: 'Lies den Vorfall und wähle das Konto, das im Buchungssatz vorne steht.',
      kategorien: ['Bank', 'Kasse', 'Rohstoffe', 'Löhne'],
      elemente: [
        {
          text: 'Ein Kunde überweist eine offene Rechnung.',
          kategorie: 'Bank',
          erklaerung: 'Bank an Forderungen aus Lieferungen und Leistungen.',
        },
        {
          text: 'Bargeld wird vom Bankkonto abgehoben.',
          kategorie: 'Kasse',
          erklaerung: 'Kasse an Bank.',
        },
        {
          text: 'Zucker wird auf Ziel geliefert.',
          kategorie: 'Rohstoffe',
          erklaerung: 'Rohstoffe an Verbindlichkeiten aus Lieferungen und Leistungen.',
        },
        { text: 'Die Löhne werden überwiesen.', kategorie: 'Löhne', erklaerung: 'Löhne an Bank.' },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage:
        'Ein Lieferant wird teils bar, teils per Bank bezahlt. Wie viele Buchungssätze braucht man?',
      a: {
        figur: 'tobias',
        ausdruck: 'gruebelt',
        text: 'Zwei Zahlungswege, also brauche ich zwei Buchungssätze.',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Ein Satz reicht: einmal Soll, zweimal Haben.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Ein zusammengesetzter Buchungssatz darf mehrere Konten haben, solange Soll und Haben gleich hoch sind.',
          richtig: true,
        },
        { text: 'Pro Buchungssatz sind höchstens zwei Konten erlaubt.' },
        { text: 'Kasse und Bank sind ein und dasselbe Konto.' },
      ],
      aufloesung:
        'Verbindlichkeiten an Kasse und an Bank – ein zusammengesetzter Buchungssatz. Zwei getrennte Sätze wären übrigens auch nicht falsch, nötig sind sie aber nicht.',
    },
    {
      typ: 'fehlerjagd',
      titel: 'Drei Buchungssätze, ein Fehler',
      text: 'Tippe den Buchungssatz an, der so nicht stimmen kann.',
      zeilen: [
        'Verbindlichkeiten aus Lieferungen und Leistungen 5.000,00 € an Kasse 2.000,00 €, an Bank 3.000,00 €',
        'Bank 4.000,00 € an Forderungen aus Lieferungen und Leistungen 4.000,00 €',
        'Löhne 12.000,00 € an Bank 21.000,00 €',
      ],
      fehlerZeile: 2,
      gruende: [
        { text: 'Soll und Haben sind nicht gleich hoch.', richtig: true },
        { text: 'Löhne müssen im Haben stehen.' },
        { text: 'Löhne werden immer bar ausgezahlt.' },
      ],
      aufloesung:
        'In jedem Buchungssatz müssen die Beträge im Soll und im Haben übereinstimmen. Hier sind zwei Ziffern vertauscht – ein klassischer Tippfehler.',
    },
    {
      typ: 'verstaendnis',
      frage: `Die MBG bezahlt eine Lieferantenrechnung über ${e(RECHNUNG)}: ${e(BAR)} bar, den Rest per Bank. Welcher Betrag steht beim Konto Bank?`,
      optionen: [
        {
          text: e(BANK),
          richtig: true,
          erklaerung: `Genau: ${e(RECHNUNG)} − ${e(BAR)} = ${e(BANK)}. Im Soll stehen die Verbindlichkeiten mit dem vollen Betrag.`,
        },
        {
          text: e(RECHNUNG),
          erklaerung:
            'Ein Teil wurde bar bezahlt. Bank und Kasse zusammen ergeben die Rechnungssumme.',
        },
        { text: e(BAR), erklaerung: 'Das ist der Barteil. Der Rest läuft über die Bank.' },
      ],
    },
    {
      typ: 'merksatz',
      id: 'A5-m1',
      frage: 'Wie ist ein Buchungssatz aufgebaut?',
      text: 'Zuerst das Konto im Soll, dann „an“ und das Konto im Haben. Ein zusammengesetzter Buchungssatz hat mehrere Soll- oder Haben-Konten – die Summen beider Seiten sind immer gleich.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe: `Bilden Sie die Buchungssätze (ohne Umsatzsteuer): 1. Barabhebung vom Bankkonto 800,00 €. 2. Kauf von Betriebsstoffen auf Ziel 2.400,00 €. 3. Ein Kunde begleicht eine Rechnung über ${e(FORDERUNG)}: ${e(KUNDE_BAR)} bar, der Rest wird überwiesen.`,
      part: {
        typ: 'buchungssatz',
        id: 'buchung',
        titel: 'Buchungssätze',
        loesung: loesung([
          satz([zeile('Kasse', '800')], [zeile('Bank', '800')], 'Vorfall 1'),
          satz(
            [zeile('Betriebsstoffe', '2400')],
            [zeile('Verbindlichkeiten aus Lieferungen und Leistungen', '2400')],
            'Vorfall 2',
          ),
          satz(
            [zeile('Kasse', KUNDE_BAR), zeile('Bank', KUNDE_BANK)],
            [zeile('Forderungen aus Lieferungen und Leistungen', FORDERUNG)],
            'Vorfall 3',
          ),
        ]),
      },
      cliffhanger: {
        figur: 'frank',
        ausdruck: 'gruebelt',
        text: 'Das Jahr ist bald um. Wie werden aus all diesen Buchungen eigentlich Bilanz und Gewinn?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Was steht in einem Buchungssatz vor dem Wort „an“?',
      optionen: [
        { text: 'Das Konto im Soll', richtig: true },
        { text: 'Das Konto im Haben' },
        { text: 'Der Betrag' },
      ],
    },
    {
      frage: 'Die Löhne werden per Bank überwiesen. Buchungssatz?',
      optionen: [
        { text: 'Löhne an Bank', richtig: true },
        { text: 'Bank an Löhne' },
        { text: 'Löhne an Kasse' },
      ],
    },
    {
      frage: 'Was muss bei einem zusammengesetzten Buchungssatz immer gelten?',
      optionen: [
        { text: 'Summe Soll = Summe Haben', richtig: true },
        { text: 'Genau zwei Konten auf jeder Seite' },
        { text: 'Die Bank steht immer im Haben' },
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
      'BA 2.3.1.5 (einfache und zusammengesetzte Buchungssätze, „an“ als Verknüpfung) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
