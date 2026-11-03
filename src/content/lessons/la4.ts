// Lektion A4 – Bilanzveränderungen und ihr Buchungsmuster (eigene Formulierung; geprüft gegen BA 2.3.1.3–2.3.1.5)
import { loesung, satz, zeile } from '../../engine/booking';
import type { Lektion } from './types';

const MUSTER = [
  'Aktivkonto an Aktivkonto',
  'Passivkonto an Passivkonto',
  'Aktivkonto an Passivkonto',
  'Passivkonto an Aktivkonto',
];

export const lektionA4: Lektion = {
  id: 'A4',
  skillId: 'A4-bilanzveraenderung',
  abschnitt: 'A',
  titel: 'Länger, aber nicht reicher: Bilanzveränderungen buchen',
  kernAha:
    'Jede der vier Bilanzveränderungen hat ein festes Buchungsmuster: Aktivtausch Aktiv an Aktiv, Passivtausch Passiv an Passiv, Mehrung Aktiv an Passiv, Minderung Passiv an Aktiv.',
  dauerMin: 6,
  figuren: ['frank', 'jana', 'tobias'],
  ort: 'gesellschafter',
  quelle: 'BA 2.3.1.3, 2.3.1.5',
  teaser: {
    figur: 'frank',
    ausdruck: 'gruebelt',
    text: 'Die Sparkasse bietet uns 50.000 € Kredit an. Was macht das mit unserer Bilanz?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'freut',
          text: 'Die Sparkasse überweist uns 50.000 € Kredit für die neue Abfülllinie.',
        },
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: 'Dann wird unsere Bilanz länger. Reicher werden wir dadurch aber nicht.',
        },
      ],
      frage: 'Länger, aber nicht reicher – wie passt das zusammen?',
    },
    {
      typ: 'vorhersage',
      frage: 'Der Kredit über 50.000 € kommt auf das Bankkonto. Welche Bilanzveränderung ist das?',
      optionen: [
        { text: 'Aktiv-Passiv-Mehrung', richtig: true },
        { text: 'Aktivtausch' },
        { text: 'Passivtausch' },
      ],
      aufloesung:
        'Bank (aktiv) und Darlehensschulden (passiv) wachsen beide um 50.000 € – die Bilanz wird länger. Das Eigenkapital bleibt aber gleich: Das Geld gehört der MBG nicht, sie hat es nur geliehen.',
    },
    {
      typ: 'konzept',
      titel: 'Vom Muster zum Buchungssatz',
      text: 'Aktivkonten nehmen im Soll zu, Passivkonten im Haben. Daraus folgt für jede der vier Bilanzveränderungen ein festes Muster für den Buchungssatz.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Aktivtausch',
            text: 'Aktivkonto an Aktivkonto – Bilanzsumme bleibt gleich.',
            farbe: '#1c6670',
          },
          {
            titel: 'Passivtausch',
            text: 'Passivkonto an Passivkonto – Bilanzsumme bleibt gleich.',
            farbe: '#e2b13c',
          },
          {
            titel: 'Aktiv-Passiv-Mehrung',
            text: 'Aktivkonto an Passivkonto – die Bilanz wird länger.',
            farbe: '#8cbf3f',
          },
          {
            titel: 'Aktiv-Passiv-Minderung',
            text: 'Passivkonto an Aktivkonto – die Bilanz wird kürzer.',
            farbe: '#e8792b',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Welches Muster passt?',
      kategorien: MUSTER,
      elemente: [
        {
          text: 'Kauf eines Gabelstaplers gegen Banküberweisung',
          kategorie: 'Aktivkonto an Aktivkonto',
          erklaerung: 'Fuhrpark an Bank.',
        },
        {
          text: 'Kauf von Dosen auf Ziel',
          kategorie: 'Aktivkonto an Passivkonto',
          erklaerung: 'Hilfsstoffe an Verbindlichkeiten.',
        },
        {
          text: 'Tilgung eines Darlehens per Bank',
          kategorie: 'Passivkonto an Aktivkonto',
          erklaerung: 'Darlehensschulden an Bank.',
        },
        {
          text: 'Eine Lieferantenschuld wird in ein Darlehen umgewandelt',
          kategorie: 'Passivkonto an Passivkonto',
          erklaerung: 'Verbindlichkeiten an Darlehensschulden.',
        },
        {
          text: 'Bargeld wird auf das Bankkonto eingezahlt',
          kategorie: 'Aktivkonto an Aktivkonto',
          erklaerung: 'Bank an Kasse.',
        },
      ],
    },
    {
      typ: 'erkunden',
      titel: 'Vier Vorfälle für die neue Abfülllinie',
      text: 'Buche die Vorfälle und achte darauf, wann die Bilanz länger, kürzer oder gleich lang wird.',
      erkunden: {
        art: 'geschaeftsvorfall',
        start: {
          links: [
            { text: 'TA und Maschinen', betrag: '300000' },
            { text: 'Rohstoffe', betrag: '40000' },
            { text: 'Bank', betrag: '60000' },
          ],
          rechts: [
            { text: 'Eigenkapital', betrag: '250000' },
            { text: 'Darlehensschulden', betrag: '100000' },
            { text: 'Verbindlichkeiten', betrag: '50000' },
          ],
        },
        vorfaelle: [
          {
            text: 'Kredit der Sparkasse geht ein (50.000 €)',
            aenderungen: [
              { seite: 'links', text: 'Bank', delta: '50000' },
              { seite: 'rechts', text: 'Darlehensschulden', delta: '50000' },
            ],
          },
          {
            text: 'Abfülllinie per Bank bezahlt (80.000 €)',
            aenderungen: [
              { seite: 'links', text: 'TA und Maschinen', delta: '80000' },
              { seite: 'links', text: 'Bank', delta: '-80000' },
            ],
          },
          {
            text: 'Lieferant per Bank bezahlt (20.000 €)',
            aenderungen: [
              { seite: 'links', text: 'Bank', delta: '-20000' },
              { seite: 'rechts', text: 'Verbindlichkeiten', delta: '-20000' },
            ],
          },
          {
            text: 'Lieferantenschuld wird Darlehen (10.000 €)',
            aenderungen: [
              { seite: 'rechts', text: 'Verbindlichkeiten', delta: '-10000' },
              { seite: 'rechts', text: 'Darlehensschulden', delta: '10000' },
            ],
          },
        ],
      },
      fazit:
        'Der Kredit hat die Bilanz verlängert, die Lieferantenzahlung hat sie verkürzt, die beiden Tauschvorgänge haben die Summe nicht verändert. Im Gleichgewicht bleibt sie immer.',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Merk dir die Richtung: Was zunimmt, steht bei Aktivkonten im Soll und bei Passivkonten im Haben.',
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Dann ist der Buchungssatz ja nur noch Übersetzen. Fast schon langweilig.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Tobias übersetzt',
      text: 'Tobias hat drei Vorfälle in Buchungssätze übersetzt. Einer ist falsch herum. Tippe ihn an.',
      zeilen: [
        'Kauf von Rohstoffen auf Ziel: Rohstoffe an Verbindlichkeiten aus Lieferungen und Leistungen',
        'Tilgung eines Darlehens per Bank: Bank an Darlehensschulden',
        'Barabhebung vom Bankkonto: Kasse an Bank',
      ],
      fehlerZeile: 1,
      gruende: [
        {
          text: 'Bei einer Tilgung nehmen Darlehen und Bank ab – richtig wäre Darlehensschulden an Bank.',
          richtig: true,
        },
        { text: 'Darlehensschulden sind ein Aktivkonto.' },
        { text: 'Bei einer Tilgung ändert sich nur das Bankkonto.' },
      ],
      aufloesung:
        'Eine Tilgung ist eine Aktiv-Passiv-Minderung: Das Passivkonto Darlehensschulden nimmt im Soll ab, das Aktivkonto Bank im Haben. Muster: Passivkonto an Aktivkonto.',
    },
    {
      typ: 'verstaendnis',
      frage: 'Welche Buchung gehört zu einer Aktiv-Passiv-Minderung?',
      optionen: [
        {
          text: 'Verbindlichkeiten aus Lieferungen und Leistungen an Bank',
          richtig: true,
          erklaerung:
            'Eine Schuld wird bezahlt: Passivkonto an Aktivkonto, beide Seiten werden kleiner.',
        },
        {
          text: 'Bank an Darlehensschulden',
          erklaerung: 'Das ist eine Aktiv-Passiv-Mehrung: Ein Kredit kommt herein.',
        },
        {
          text: 'Fuhrpark an Bank',
          erklaerung: 'Das ist ein Aktivtausch: Geld wird in einen Gabelstapler getauscht.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'A4-m1',
      frage: 'Welches Buchungsmuster gehört zu welcher Bilanzveränderung?',
      text: 'Aktivtausch: Aktivkonto an Aktivkonto. Passivtausch: Passivkonto an Passivkonto. Aktiv-Passiv-Mehrung: Aktivkonto an Passivkonto. Aktiv-Passiv-Minderung: Passivkonto an Aktivkonto.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe:
        'Bilden Sie die Buchungssätze (ohne Umsatzsteuer): 1. Die MBG tilgt ein Darlehen über 15.000,00 € per Banküberweisung. 2. Die MBG kauft eine Etikettiermaschine für 24.000,00 € auf Ziel.',
      part: {
        typ: 'buchungssatz',
        id: 'buchung',
        titel: 'Buchungssätze',
        loesung: loesung([
          satz([zeile('Darlehensschulden', '15000')], [zeile('Bank', '15000')], 'Vorfall 1'),
          satz(
            [zeile('Technische Anlagen und Maschinen', '24000')],
            [zeile('Verbindlichkeiten aus Lieferungen und Leistungen', '24000')],
            'Vorfall 2',
          ),
        ]),
      },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'ueberrascht',
        text: 'Auf meinem Tisch liegen schon fünf neue Belege. Schaffe ich die bis Feierabend?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Kauf einer Maschine auf Ziel – welches Buchungsmuster?',
      optionen: [
        { text: 'Aktivkonto an Passivkonto', richtig: true },
        { text: 'Aktivkonto an Aktivkonto' },
        { text: 'Passivkonto an Aktivkonto' },
      ],
    },
    {
      frage: 'Was passiert bei einem Passivtausch mit der Bilanzsumme?',
      optionen: [
        { text: 'Sie bleibt gleich.', richtig: true },
        { text: 'Sie steigt.' },
        { text: 'Sie sinkt.' },
      ],
    },
    {
      frage: 'Eine Lieferantenrechnung wird per Bank bezahlt. Welche Bilanzveränderung?',
      optionen: [
        { text: 'Aktiv-Passiv-Minderung', richtig: true },
        { text: 'Aktivtausch' },
        { text: 'Aktiv-Passiv-Mehrung' },
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
      'BA 2.3.1.3 (vier Bilanzveränderungen, Bilanzverlängerung/-verkürzung), 2.3.1.5 (Buchungssätze) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
