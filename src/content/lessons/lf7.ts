// Lektion F7 – Zeitliche Abgrenzung (eigene Formulierung; BA 6.1–6.3, 03-aufgabentypen.md F7, GC-13).
// Alle Beträge werden von der Engine berechnet.
import { Val, formatEuro } from '../../engine/money';
import { solveF7, type F7Params } from '../../engine/generators/f2/rechnungsabgrenzung';
import type { Lektion } from './types';

const e = (v: { value: { toString(): string } } | string) =>
  formatEuro(typeof v === 'string' ? v : v.value.toString());

// Messestand im Februar, bezahlt am 15. Dezember (netto auf Werbung gebucht)
const MESSE_P: F7Params = { fall: 'arap', vorlage: 3, betrag: '6000', start: 14, monate: 1 };
const MESSE = solveF7(MESSE_P);
// Außenlager: Miete November bis April am 1. November im Voraus bezahlt
const LAGER_P: F7Params = { fall: 'arap', vorlage: 0, betrag: '7200', start: 11, monate: 6 };
const LAGER = solveF7(LAGER_P);
const LAGER_ALT = new Val(LAGER_P.betrag).minus(LAGER.abgrenzung);
const MONATSMIETE = formatEuro(new Val(LAGER_P.betrag).div(LAGER_P.monate).fix().value.toString());
const MESSE_UST = new Val(MESSE_P.betrag).times('0.19').fix();
// Fehlerjagd: drei Fälle, ein Fehler
const KFZ = solveF7({ fall: 'arap', vorlage: 1, betrag: '600', start: 10, monate: 12 });
const SPEDITION = solveF7({ fall: 'prap', vorlage: 0, betrag: '3600', start: 13, monate: 3 });
const KONTOKORRENT = solveF7({
  fall: 'sonstige-verbindlichkeit',
  vorlage: 2,
  betrag: '900',
  start: 10,
  monate: 3,
});

export const lektionF7: Lektion = {
  id: 'F7',
  skillId: 'F7-rap',
  abschnitt: 'F',
  titel: 'Bezahlt ist nicht verbraucht',
  kernAha:
    'Zwei Fragen entscheiden: Wann fließt das Geld, und in welches Jahr gehört der Aufwand oder Ertrag? Geld vorher → aktive bzw. passive Rechnungsabgrenzung; Geld nachher → sonstige Forderung bzw. sonstige Verbindlichkeit. Abgegrenzt wird monatsgenau.',
  dauerMin: 8,
  figuren: ['tobias', 'jana', 'leni', 'frank'],
  ort: 'buero',
  quelle: 'BA 6.1–6.3; 03-aufgabentypen.md (F7); 04-fachregeln.md (GC-13)',
  teaser: {
    figur: 'tobias',
    ausdruck: 'freut',
    text: 'Messestand für Februar? Längst bezahlt. Ich bin meiner Zeit voraus!',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      visual: {
        typ: 'beleg',
        absender: 'Getränkefachmesse Senne GmbH (fiktiv)',
        nummer: 'M-0412',
        datum: '10.12.',
        zeilen: [
          { text: 'Standmiete Halle 2, Messe im Februar', betrag: MESSE_P.betrag },
          { text: 'zzgl. 19 % Umsatzsteuer', betrag: MESSE_UST.value.toString() },
          {
            text: 'Rechnungsbetrag',
            betrag: MESSE_UST.plus(MESSE_P.betrag).value.toString(),
            fett: true,
          },
        ],
        fuss: 'Überwiesen am 15.12.: netto auf Werbung, Steuer auf Vorsteuer gebucht.',
      },
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Erledigt und bezahlt. Die Werbekosten in diesem Jahr sind damit eben etwas höher.',
        },
        { figur: 'jana', ausdruck: 'gruebelt', text: 'Sind sie das wirklich?' },
      ],
      frage: `Die MBG hat im Dezember ${e(MESSE_P.betrag)} netto für eine Messe im Februar bezahlt. Ist das Aufwand des alten Jahres?`,
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Du zahlst im Dezember das Fitnessstudio für Januar bis März. Hast du deshalb im Dezember mehr trainiert?',
        },
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: 'Eben nicht. Gezahlt ist im alten Jahr, genutzt wird im neuen.',
        },
        {
          figur: 'jana',
          ausdruck: 'neutral',
          text: 'Und der Gewinn soll zeigen, was in einem Jahr wirklich verbraucht und verdient wurde.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: 'In welches Geschäftsjahr gehört der Aufwand für den Messestand?',
      optionen: [
        { text: 'Ins alte Jahr – da wurde bezahlt.' },
        { text: 'Ins neue Jahr – da findet die Messe statt.', richtig: true },
        { text: 'Halb und halb.' },
      ],
      aufloesung: `Maßgeblich ist, wann die Leistung genutzt wird. Zum 31.12. wird der Aufwand deshalb über eine aktive Rechnungsabgrenzung ins neue Jahr geschoben: ARAP an Werbung ${e(MESSE.abgrenzung)}.`,
    },
    {
      typ: 'konzept',
      titel: 'Zwei Fragen, vier Fälle',
      text: 'Frage 1: Fließt das Geld im alten oder im neuen Jahr? Frage 2: Geht es um Aufwand oder Ertrag? Geld vorher: Rechnungsabgrenzung. Geld nachher: sonstige Forderung oder Verbindlichkeit.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'ARAP',
            text: 'Im Voraus bezahlt, Aufwand im neuen Jahr',
            farbe: '#1c6670',
          },
          {
            titel: 'PRAP',
            text: 'Im Voraus erhalten, Ertrag im neuen Jahr',
            farbe: '#65a30d',
          },
          {
            titel: 'Sonstige Verbindlichkeit',
            text: 'Aufwand im alten Jahr, Zahlung erst im neuen',
            farbe: '#c2410c',
          },
          {
            titel: 'Sonstige Forderung',
            text: 'Ertrag im alten Jahr, Geld kommt erst im neuen',
            farbe: '#ca8a04',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Welcher Posten zum 31.12.?',
      text: 'Ordne jeden Vorgang der MBG einem der vier Fälle zu.',
      kategorien: ['ARAP', 'PRAP', 'Sonstige Forderung', 'Sonstige Verbindlichkeit'],
      elemente: [
        {
          text: 'Im Oktober wird die Kfz-Steuer für einen Lkw für zwölf Monate im Voraus abgebucht.',
          kategorie: 'ARAP',
        },
        {
          text: 'Eine Spedition überweist im Dezember die Hallenmiete für Januar bis März.',
          kategorie: 'PRAP',
          erklaerung:
            'Geld schon da, Leistung (Vermietung) schuldet die MBG noch: passiv abgrenzen.',
        },
        {
          text: 'Festgeldzinsen für August bis Januar werden erst Ende Januar gutgeschrieben.',
          kategorie: 'Sonstige Forderung',
          erklaerung: 'Ertrag gehört zum Großteil ins alte Jahr, das Geld kommt erst im neuen.',
        },
        {
          text: 'Die Dezembermiete für das Außenlager wird erst am 8. Januar überwiesen.',
          kategorie: 'Sonstige Verbindlichkeit',
        },
        {
          text: 'Die Sparkasse belastet die Kreditzinsen für Oktober bis Dezember erst am 2. Januar.',
          kategorie: 'Sonstige Verbindlichkeit',
        },
      ],
    },
    {
      typ: 'erkunden',
      titel: 'Miete über den Jahreswechsel',
      text: `Am 1. November zahlt die MBG ${e(LAGER_P.betrag)} Miete für November bis April. Buche ins Konto Mietaufwendungen und sieh, was für das alte Jahr übrig bleibt.`,
      erkunden: {
        art: 'tkonto-buchen',
        konto: 'Mietaufwendungen',
        vorgaenge: [
          { text: 'Zahlung am 1.11. (6 Monate)', betrag: LAGER_P.betrag, seite: 'soll' },
          {
            text: 'Abgrenzung Januar bis April (ARAP)',
            betrag: LAGER.abgrenzung.value.toString(),
            seite: 'haben',
          },
        ],
      },
      fazit: `Saldo ${e(LAGER_ALT)} – genau die Miete für November und Dezember. Nur das ist Aufwand des alten Jahres.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Monatsgenau abgrenzen',
      text: `Miete ${e(LAGER_P.betrag)} für November bis April, am 1.11. auf Mietaufwendungen gebucht.`,
      schritte: [
        {
          text: 'Monate zählen',
          rechnung: `6 Monate: ${LAGER.altMonate} im alten Jahr, ${LAGER.neuMonate} im neuen Jahr`,
          warum: 'Abgegrenzt wird der Teil, der das neue Jahr betrifft.',
        },
        {
          text: 'Betrag',
          rechnung: `${e(LAGER_P.betrag)} ÷ 6 × ${LAGER.neuMonate} = ${e(LAGER.abgrenzung)}`,
          warum: `Eine Monatsmiete beträgt ${MONATSMIETE}.`,
        },
        {
          text: 'Buchung zum 31.12.',
          rechnung: `Aktive Rechnungsabgrenzung an Mietaufwendungen ${e(LAGER.abgrenzung)}`,
          warum:
            'Der Aufwand wird gemindert, die ARAP steht als Posten auf der Aktivseite der Bilanz.',
        },
        {
          text: 'Im neuen Jahr',
          rechnung: `Mietaufwendungen an Aktive Rechnungsabgrenzung ${e(LAGER.abgrenzung)}`,
          warum: 'Der Posten wird aufgelöst: Jetzt landet der Aufwand im richtigen Jahr.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Drei Abschlussbuchungen, ein Fehler',
      text: 'Ein Kollege hat zum 31.12. gebucht. Welche Zeile ist falsch?',
      zeilen: [
        `Kfz-Steuer Oktober bis September im Voraus: ARAP an Betriebssteuern ${e(KFZ.abgrenzung)}`,
        `Hallenmiete Januar bis März im Dezember erhalten: Mieterträge an PRAP ${e(SPEDITION.abgrenzung)}`,
        `Kreditzinsen Oktober bis Dezember, belastet am 2.1.: Zinsaufwendungen an ARAP ${e(KONTOKORRENT.abgrenzung)}`,
      ],
      fehlerZeile: 2,
      gruende: [
        {
          text: 'Das Geld fließt erst im neuen Jahr: Gegenkonto ist Sonstige Verbindlichkeiten.',
          richtig: true,
        },
        { text: 'Die Zinsen gehören ins neue Jahr und dürfen gar nicht gebucht werden.' },
        { text: 'Es müsste PRAP statt ARAP heißen.' },
      ],
      aufloesung:
        'Eine Rechnungsabgrenzung setzt voraus, dass schon gezahlt wurde. Hier ist der Aufwand entstanden, das Geld fließt aber erst später: sonstige Verbindlichkeit.',
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Festgeldzinsen, die erst im neuen Jahr gutgeschrieben werden. Ergänze die Monate und den Betrag.',
      skillId: 'F7-rap',
      seed: 14,
      variant: 'sonstige-forderung',
      partId: 'betrag',
      gefragt: ['monate', 'abgrenzung'],
    },
    {
      typ: 'merksatz',
      id: 'F7-m1',
      frage: 'Wann bildet man ARAP, PRAP, sonstige Forderungen und sonstige Verbindlichkeiten?',
      text: 'Geld im alten Jahr, Erfolg im neuen: ARAP (Aufwand) bzw. PRAP (Ertrag). Erfolg im alten Jahr, Geld im neuen: sonstige Verbindlichkeit (Aufwand) bzw. sonstige Forderung (Ertrag). Immer monatsgenau abgrenzen.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe: 'Bilden Sie die Abschlussbuchung zum 31.12.',
      part: { skillId: 'F7-rap', seed: 6, variant: 'arap', partId: 'buchung' },
      cliffhanger: {
        figur: 'frank',
        ausdruck: 'entsetzt',
        text: 'Ein Gastronom hat uns verklagt, angeblich war das Fassbier verdorben. Was uns das kostet, weiß noch niemand.',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Am 1.10. zahlt die MBG 1.200 € Miete für Oktober bis März. Wie hoch ist die ARAP zum 31.12.?',
      optionen: [{ text: '600,00 €', richtig: true }, { text: '1.200,00 €' }, { text: '300,00 €' }],
    },
    {
      frage: 'Zinserträge für das alte Jahr gehen erst im Januar ein. Welcher Posten entsteht?',
      optionen: [
        { text: 'Sonstige Forderung', richtig: true },
        { text: 'Passive Rechnungsabgrenzung' },
        { text: 'Aktive Rechnungsabgrenzung' },
      ],
    },
    {
      frage: 'Die MBG erhält im Dezember Miete für Januar. Wie lautet die Buchung zum 31.12.?',
      optionen: [
        { text: 'Mieterträge an PRAP', richtig: true },
        { text: 'ARAP an Mieterträge' },
        { text: 'Sonstige Forderungen an Mieterträge' },
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
      'Gegen BA 6.1–6.3 geprüft (transitorische und antizipative Posten, Auflösung im neuen Jahr); Entscheidungslogik nach 03-aufgabentypen.md; Zahlen aus der Engine (solveF7); 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
