// Lektion A6 – Eröffnung und Abschluss der Konten (eigene Formulierung; geprüft gegen BA 2.3.2.2, 2.3.3)
import { loesung, satz, zeile } from '../../engine/booking';
import { Val, formatEuro, sum } from '../../engine/money';
import type { Lektion } from './types';

// Zahlen von der Engine
const e = (v: Val) => formatEuro(v.value);
const ERTRAEGE_V = new Val('80000');
const AUFWAND_V = new Val('65000');
const ERGEBNIS_V = ERTRAEGE_V.minus(AUFWAND_V);
const GUV_MIETE = new Val('12000');
const GUV_LOEHNE = new Val('40000');
const GUV_ERLOESE = new Val('70000');
const GUV_GEWINN = GUV_ERLOESE.minus(sum([GUV_MIETE, GUV_LOEHNE]));
const K_ERLOESE = new Val('90000');
const K_MIETE = new Val('20000');
const K_LOEHNE = new Val('50000');
const K_GEWINN = K_ERLOESE.minus(sum([K_MIETE, K_LOEHNE]));

const ABSCHLUSS = [
  'GuV an Aufwandskonto',
  'Ertragskonto an GuV',
  'SBK an Aktivkonto',
  'Passivkonto an SBK',
];

export const lektionA6: Lektion = {
  id: 'A6',
  skillId: 'A6-eroeffnung-abschluss',
  abschnitt: 'A',
  titel: 'Der Kontenkreislauf: vom ersten bis zum letzten Tag',
  kernAha:
    'Die Konten laufen im Kreis: Das Eröffnungsbilanzkonto eröffnet sie, Erfolgskonten gehen über die GuV ins Eigenkapital, Bestandskonten ins Schlussbilanzkonto – und das ist die Grundlage des nächsten Jahres.',
  dauerMin: 7,
  figuren: ['frank', 'jana', 'leni', 'tobias', 'sabine'],
  ort: 'buero',
  quelle: 'BA 2.3.2.2, 2.3.3',
  teaser: {
    figur: 'frank',
    ausdruck: 'gruebelt',
    text: 'Wir haben das ganze Jahr gebucht. Wie wird daraus eine einzige Bilanz?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'gruebelt',
          text: 'Wir haben das ganze Jahr auf Hunderten Konten gebucht. Wie wird daraus am 31.12. eine einzige Bilanz?',
        },
        { figur: 'jana', ausdruck: 'erklaert', text: 'Mit einem Kreislauf in fünf Stationen.' },
      ],
      frage: 'Welche Stationen könnte so ein Kreislauf haben?',
    },
    {
      typ: 'konzept',
      titel: 'Der Kontenkreislauf',
      text: 'Zu Jahresbeginn verteilt das Eröffnungsbilanzkonto die Anfangsbestände. Am Jahresende schließen erst die Erfolgskonten über die GuV ab, dann die GuV über das Eigenkapital und zuletzt die Bestandskonten über das Schlussbilanzkonto.',
      visual: { typ: 'kreislauf' },
    },
    {
      typ: 'vorhersage',
      frage: `Die GuV der MBG zeigt ${e(ERTRAEGE_V)} Erträge und ${e(AUFWAND_V)} Aufwendungen. Was passiert mit dem Eigenkapital?`,
      optionen: [
        { text: `Es steigt um ${e(ERGEBNIS_V)}.`, richtig: true },
        { text: `Es sinkt um ${e(ERGEBNIS_V)}.` },
        { text: 'Es bleibt gleich – der Gewinn steht nur in der GuV.' },
      ],
      aufloesung: `Die Erträge sind größer: ${e(ERGEBNIS_V)} Gewinn. Er gehört den Eigentümern und wird mit „GuV an Eigenkapital“ übertragen – das Eigenkapital wächst.`,
    },
    {
      typ: 'sortieren',
      titel: 'Welcher Abschlussbuchungssatz passt?',
      kategorien: ABSCHLUSS,
      elemente: [
        { text: 'Abschluss Mietaufwendungen', kategorie: 'GuV an Aufwandskonto' },
        { text: 'Abschluss Umsatzerlöse', kategorie: 'Ertragskonto an GuV' },
        {
          text: 'Abschluss Bank',
          kategorie: 'SBK an Aktivkonto',
          erklaerung: 'Der Schlussbestand eines Aktivkontos steht im Haben, im SBK also im Soll.',
        },
        { text: 'Abschluss Darlehensschulden', kategorie: 'Passivkonto an SBK' },
        { text: 'Abschluss Löhne', kategorie: 'GuV an Aufwandskonto' },
        { text: 'Abschluss Rohstoffe', kategorie: 'SBK an Aktivkonto' },
      ],
    },
    {
      typ: 'erkunden',
      titel: 'Die GuV füllt sich',
      text: 'Übertrage die Salden der Erfolgskonten in das Gewinn- und Verlustkonto.',
      erkunden: {
        art: 'tkonto-buchen',
        konto: 'Gewinn- und Verlustkonto',
        vorgaenge: [
          { text: 'Saldo Mietaufwendungen', betrag: GUV_MIETE.value.toString(), seite: 'soll' },
          { text: 'Saldo Löhne', betrag: GUV_LOEHNE.value.toString(), seite: 'soll' },
          { text: 'Saldo Umsatzerlöse', betrag: GUV_ERLOESE.value.toString(), seite: 'haben' },
        ],
      },
      fazit: `Aufwendungen stehen links, Erträge rechts. Der Saldo von ${e(GUV_GEWINN)} steht im Soll – das ist der Gewinn. Er wandert mit „GuV an Eigenkapital“ ins Eigenkapital.`,
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Wichtig ist die Reihenfolge: erst die Erfolgskonten, dann die GuV, dann die Bestandskonten.',
        },
        {
          figur: 'leni',
          ausdruck: 'freut',
          text: 'Und das Schlussbilanzkonto von heute ist die Eröffnung von morgen.',
        },
        {
          figur: 'jana',
          ausdruck: 'neutral',
          text: 'Manche Bücher schreiben bei der Eröffnung „Saldenvortrag“ statt EBK. Gemeint ist dasselbe.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Das Bankkonto wird mit „Bank an EBK“ eröffnet. Wo steht der Anfangsbestand der Bank?',
      a: { figur: 'tobias', ausdruck: 'neutral', text: 'Im Haben. Das EBK steht ja hinten.' },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Im Soll. Die Bank steht vorne, also links.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Aktivkonten haben ihren Anfangsbestand im Soll – das Gegenkonto EBK steht im Haben.',
          richtig: true,
        },
        { text: 'Anfangsbestände stehen immer im Haben.' },
        { text: 'Das EBK ist ein Aktivkonto.' },
      ],
      aufloesung:
        'Was vor „an“ steht, wird im Soll gebucht. Aktivkonten werden mit „Aktivkonto an EBK“ eröffnet, Passivkonten mit „EBK an Passivkonto“ – spiegelbildlich zur Bilanz.',
    },
    {
      typ: 'fehlerjagd',
      titel: 'Vier Abschlussbuchungen',
      text: 'Eine der Buchungen schließt das Konto falsch herum ab. Tippe sie an.',
      zeilen: [
        'Gewinn- und Verlustkonto an Löhne',
        'Umsatzerlöse für eigene Erzeugnisse an Gewinn- und Verlustkonto',
        'Bank an Schlussbilanzkonto',
        'Gewinn- und Verlustkonto an Eigenkapital (Gewinn)',
      ],
      fehlerZeile: 2,
      gruende: [
        {
          text: 'Die Bank ist ein Aktivkonto: Abschluss mit Schlussbilanzkonto an Bank.',
          richtig: true,
        },
        { text: 'Die Bank wird über die GuV abgeschlossen.' },
        { text: 'Bestandskonten werden gar nicht abgeschlossen.' },
      ],
      aufloesung:
        'Der Schlussbestand eines Aktivkontos steht auf dem Konto im Haben. Im Schlussbilanzkonto landet er deshalb im Soll: SBK an Bank.',
    },
    {
      typ: 'verstaendnis',
      frage: 'Die MBG macht in einem Jahr Verlust. Wie wird die GuV abgeschlossen?',
      optionen: [
        {
          text: 'Eigenkapital an Gewinn- und Verlustkonto',
          richtig: true,
          erklaerung:
            'Ein Verlust mindert das Eigenkapital – Minderungen stehen beim Eigenkapital im Soll.',
        },
        {
          text: 'Gewinn- und Verlustkonto an Eigenkapital',
          erklaerung: 'Das ist der Abschluss bei einem Gewinn.',
        },
        {
          text: 'Gewinn- und Verlustkonto an Schlussbilanzkonto',
          erklaerung:
            'Die GuV wird nie direkt ins SBK abgeschlossen, sondern immer über das Eigenkapital.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'A6-m1',
      frage: 'In welcher Reihenfolge und wie werden die Konten am Jahresende abgeschlossen?',
      text: 'Erst die Erfolgskonten über die GuV (GuV an Aufwandskonto, Ertragskonto an GuV), dann die GuV über das Eigenkapital (Gewinn: GuV an Eigenkapital), zuletzt die Bestandskonten über das SBK (SBK an Aktivkonto, Passivkonto an SBK).',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe: `Zum 31.12. weisen die Erfolgskonten folgende Salden aus: Umsatzerlöse ${e(K_ERLOESE)}, Mietaufwendungen ${e(K_MIETE)}, Löhne ${e(K_LOEHNE)}. Bilden Sie die Abschlussbuchungen der Erfolgskonten und der GuV.`,
      part: {
        typ: 'buchungssatz',
        id: 'buchung',
        titel: 'Abschlussbuchungen',
        loesung: loesung(
          [
            satz(
              [zeile('Gewinn- und Verlustkonto', K_MIETE)],
              [zeile('Mietaufwendungen', K_MIETE)],
              'Abschluss Mietaufwendungen',
            ),
            satz(
              [zeile('Gewinn- und Verlustkonto', K_LOEHNE)],
              [zeile('Löhne', K_LOEHNE)],
              'Abschluss Löhne',
            ),
            satz(
              [zeile('Umsatzerlöse für eigene Erzeugnisse', K_ERLOESE)],
              [zeile('Gewinn- und Verlustkonto', K_ERLOESE)],
              'Abschluss Umsatzerlöse',
            ),
            satz(
              [zeile('Gewinn- und Verlustkonto', K_GEWINN)],
              [zeile('Eigenkapital', K_GEWINN)],
              'Abschluss GuV',
            ),
          ],
          true,
        ),
      },
      cliffhanger: {
        figur: 'sabine',
        ausdruck: 'gruebelt',
        text: 'Frank und ich haben uns dieses Jahr jeden Monat etwas privat ausgezahlt. Verfälscht das nicht unseren Gewinn?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Wie wird ein Aufwandskonto abgeschlossen?',
      optionen: [
        { text: 'GuV an Aufwandskonto', richtig: true },
        { text: 'Aufwandskonto an GuV' },
        { text: 'SBK an Aufwandskonto' },
      ],
    },
    {
      frage: 'Wohin wird das Gewinn- und Verlustkonto abgeschlossen?',
      optionen: [
        { text: 'In das Eigenkapital', richtig: true },
        { text: 'In das Schlussbilanzkonto' },
        { text: 'In das Bankkonto' },
      ],
    },
    {
      frage: 'Wie wird ein Passivkonto wie Darlehensschulden abgeschlossen?',
      optionen: [
        { text: 'Darlehensschulden an SBK', richtig: true },
        { text: 'SBK an Darlehensschulden' },
        { text: 'GuV an Darlehensschulden' },
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
      'BA 2.3.2.2 (Abschluss der Erfolgskonten, GuV über Eigenkapital, Vorgehensweise Eröffnung/Abschluss), 2.3.3 (Bestands- und Erfolgskonten) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
