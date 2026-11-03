// Lektion B3 – Umsatzsteuer-Abschluss: Zahllast oder Vorsteuerüberhang
// (eigene Formulierung; geprüft gegen BA 2.3.5.3; Buchungsregeln nach 04-fachregeln.md, GC-09/GC-10 und Abschnitt 6)
import { formatSatz } from '../../engine/booking';
import { solveUstAbschluss } from '../../engine/generators/ust-abschluss';
import { Val, formatEuro } from '../../engine/money';
import type { Lektion } from './types';

// Zahlen von der Engine
const e = (v: Val) => formatEuro(v.value);
const JAN = solveUstAbschluss({
  vorsteuer: '18000',
  umsatzsteuer: '26000',
  anlass: 'voranmeldung',
  monat: 'Januar',
});
const JAN_JAHR = solveUstAbschluss({
  vorsteuer: '18000',
  umsatzsteuer: '26000',
  anlass: 'jahresabschluss',
  monat: 'Dezember',
});
const UEB = solveUstAbschluss({
  vorsteuer: '48000',
  umsatzsteuer: '30000',
  anlass: 'jahresabschluss',
  monat: 'Dezember',
});
const VST_JAN = new Val('18000');
const UST_JAN = new Val('26000');
const satzText = (s: (typeof JAN.buchung.saetze)[number] | undefined) =>
  s ? formatSatz(s).replace(/\u00a0/g, ' ') : '';

export const lektionB3: Lektion = {
  id: 'B3',
  skillId: 'B3-ust-abschluss',
  abschnitt: 'B',
  titel: 'Abrechnung mit dem Finanzamt: Zahllast oder Überhang',
  kernAha:
    'Umsatzsteuer und Vorsteuer werden verrechnet – immer „Umsatzsteuer an Vorsteuer“ mit dem kleineren Betrag. Ist die Umsatzsteuer größer, bleibt eine Zahllast (Schuld), sonst ein Vorsteuerüberhang (Forderung).',
  dauerMin: 7,
  figuren: ['jana', 'tobias', 'leni'],
  ort: 'buero',
  quelle: 'BA 2.3.5.3; 04-fachregeln.md (GC-09, GC-10, Abschnitt 6)',
  teaser: {
    figur: 'jana',
    ausdruck: 'gruebelt',
    text: 'Ende Januar rechnen wir mit dem Finanzamt ab. Zahlen wir – oder bekommen wir etwas zurück?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      visual: {
        typ: 'tkonten',
        konten: [
          {
            name: 'Vorsteuer',
            soll: [{ text: 'Summe Januar', betrag: VST_JAN.value.toString() }],
            haben: [],
          },
          {
            name: 'Umsatzsteuer',
            soll: [],
            haben: [{ text: 'Summe Januar', betrag: UST_JAN.value.toString() }],
          },
        ],
      },
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Ende Januar: Wir haben Umsatzsteuer kassiert und Vorsteuer bezahlt. Jetzt rechnen wir mit dem Finanzamt ab.',
        },
        { figur: 'tobias', ausdruck: 'gruebelt', text: 'Und wer zahlt jetzt wem was?' },
      ],
      frage: 'Muss die MBG ans Finanzamt zahlen – oder bekommt sie Geld zurück?',
    },
    {
      typ: 'vorhersage',
      frage: `Vorsteuer ${e(VST_JAN)}, Umsatzsteuer ${e(UST_JAN)}. Was passiert?`,
      optionen: [
        { text: `Die MBG überweist ${e(JAN.saldo)} ans Finanzamt.`, richtig: true },
        { text: `Die MBG bekommt ${e(JAN.saldo)} vom Finanzamt.` },
        { text: `Die MBG überweist ${e(UST_JAN)} ans Finanzamt.` },
      ],
      aufloesung: `Die MBG schuldet ${e(UST_JAN)} und hat ${e(VST_JAN)} zugute. Verrechnet bleibt eine Zahllast von ${e(JAN.saldo)}.`,
    },
    {
      typ: 'konzept',
      titel: 'Verrechnen statt hin und her überweisen',
      text: 'Wie unter Freunden: Du schuldest mir 26 €, ich dir 18 € – am Ende zahlst du nur 8 €. Umsatzsteuer ist die Schuld der MBG beim Finanzamt, Vorsteuer ihre Forderung. Verrechnet wird beides.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Zahllast',
            text: 'Umsatzsteuer größer als Vorsteuer: Die MBG muss den Rest an das Finanzamt zahlen.',
            farbe: '#e8792b',
          },
          {
            titel: 'Vorsteuerüberhang',
            text: 'Vorsteuer größer als Umsatzsteuer: Das Finanzamt erstattet den Rest.',
            farbe: '#1c6670',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Zahllast oder Vorsteuerüberhang?',
      kategorien: ['Zahllast', 'Vorsteuerüberhang'],
      elemente: [
        {
          text: 'Februar: Großeinkauf von Dosen für die Saison – Vorsteuer 12.000 €, Umsatzsteuer 9.500 €',
          kategorie: 'Vorsteuerüberhang',
        },
        { text: 'April: Vorsteuer 7.000 €, Umsatzsteuer 21.000 €', kategorie: 'Zahllast' },
        {
          text: 'Juni: neue Abfülllinie gekauft – Vorsteuer 48.000 €, Umsatzsteuer 30.000 €',
          kategorie: 'Vorsteuerüberhang',
        },
        {
          text: 'Juli: Hochsaison – Vorsteuer 15.000 €, Umsatzsteuer 40.000 €',
          kategorie: 'Zahllast',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Abschluss bei einer Zahllast',
      text: `Vorsteuer ${e(VST_JAN)}, Umsatzsteuer ${e(UST_JAN)}.`,
      schritte: [
        {
          text: 'Vergleichen',
          rechnung: `${e(UST_JAN)} − ${e(VST_JAN)} = ${e(JAN.saldo)} Zahllast`,
          warum: 'Die Umsatzsteuer ist größer – es bleibt eine Schuld beim Finanzamt.',
        },
        {
          text: 'Verrechnen',
          rechnung: satzText(JAN.buchung.saetze[0]),
          warum:
            'Das kleinere Konto wird über das größere abgeschlossen: Umsatzsteuer an Vorsteuer mit dem kleineren Betrag.',
        },
        {
          text: 'Monatsende: überweisen',
          rechnung: satzText(JAN.buchung.saetze[1]),
          warum: 'Die Zahllast wird per Bank an das Finanzamt gezahlt.',
        },
        {
          text: 'Jahresende: passivieren',
          rechnung: satzText(JAN_JAHR.buchung.saetze[1]),
          warum:
            'Am 31.12. ist die Zahllast oft noch nicht bezahlt – sie steht dann als Schuld im Schlussbilanzkonto.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Wie lautet die Verrechnung bei einem Vorsteuerüberhang?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Bei einem Überhang ist alles umgekehrt: Vorsteuer an Umsatzsteuer.',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Auch dann heißt es Umsatzsteuer an Vorsteuer. Nur der Betrag ist ein anderer.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Verrechnet wird immer Umsatzsteuer an Vorsteuer – mit dem kleineren der beiden Beträge.',
          richtig: true,
        },
        { text: 'Bei einem Überhang wird gar nicht verrechnet.' },
        { text: 'Die Richtung hängt davon ab, welches Konto zuerst gebucht wurde.' },
      ],
      aufloesung:
        'Bei einem Überhang ist die Umsatzsteuer der kleinere Betrag. Sie wird mit „Umsatzsteuer an Vorsteuer“ auf das Vorsteuerkonto übertragen; übrig bleibt die Forderung.',
    },
    {
      typ: 'fehlerjagd',
      titel: 'Jahresabschluss mit Überhang',
      text: 'Vorsteuer 48.000 €, Umsatzsteuer 30.000 €. Eine der beiden Buchungen ist falsch. Tippe sie an.',
      zeilen: [satzText(UEB.buchung.saetze[0]), 'Vorsteuer 18.000,00 € an SBK 18.000,00 €'],
      fehlerZeile: 1,
      gruende: [
        {
          text: 'Ein Überhang ist eine Forderung und steht im SBK auf der Aktivseite: SBK an Vorsteuer.',
          richtig: true,
        },
        { text: 'Die Verrechnung müsste mit 48.000 € gebucht werden.' },
        { text: 'Ein Überhang wird über die GuV abgeschlossen.' },
      ],
      aufloesung: `Richtig ist ${satzText(UEB.buchung.saetze[1])}. Das Finanzamt schuldet der MBG Geld – eine Forderung gehört auf die Aktivseite.`,
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Im Jahresabschluss bleibt eine Zahllast als Schuld in der Bilanz stehen, ein Überhang als Forderung.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Beide Buchungen in einem Satz wären nicht falsch. In der Klausur schreibst du sie aber am besten getrennt auf.',
        },
      ],
    },
    {
      typ: 'verstaendnis',
      frage:
        'Die MBG hat am 31.12. einen Vorsteuerüberhang von 4.000 €. Wo steht er im Schlussbilanzkonto?',
      optionen: [
        {
          text: 'Auf der Aktivseite',
          richtig: true,
          erklaerung:
            'Ein Erstattungsanspruch gegenüber dem Finanzamt ist eine Forderung – Vermögen, also aktiv.',
        },
        {
          text: 'Auf der Passivseite',
          erklaerung: 'Auf der Passivseite stünde eine Zahllast, also eine Schuld.',
        },
        {
          text: 'Gar nicht – er wird sofort ausgezahlt.',
          erklaerung: 'Am Stichtag ist er noch nicht erstattet und muss deshalb in die Bilanz.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'B3-m1',
      frage: 'Wie wird die Umsatzsteuer am Monats- oder Jahresende abgeschlossen?',
      text: 'Verrechnung immer: Umsatzsteuer an Vorsteuer mit dem kleineren Betrag. Zahllast: Umsatzsteuer an Bank (Monat) bzw. Umsatzsteuer an SBK (Jahresende). Vorsteuerüberhang: SBK an Vorsteuer.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe:
        'Ermitteln Sie, ob eine Zahllast oder ein Vorsteuerüberhang vorliegt, und bilden Sie die Abschlussbuchungen.',
      part: { skillId: 'B3-ust-abschluss', seed: 10, partId: 'buchung' },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Der Aromenlieferant bietet 2 % Skonto, wenn wir schnell zahlen. Lohnt sich das eigentlich?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Vorsteuer 10.000 €, Umsatzsteuer 16.000 €. Was liegt vor?',
      optionen: [
        { text: 'Eine Zahllast von 6.000 €', richtig: true },
        { text: 'Ein Vorsteuerüberhang von 6.000 €' },
        { text: 'Eine Zahllast von 16.000 €' },
      ],
    },
    {
      frage: 'Wie lautet die Verrechnungsbuchung bei einem Vorsteuerüberhang?',
      optionen: [
        { text: 'Umsatzsteuer an Vorsteuer', richtig: true },
        { text: 'Vorsteuer an Umsatzsteuer' },
        { text: 'SBK an Umsatzsteuer' },
      ],
    },
    {
      frage: 'Wie wird eine Zahllast am Jahresende abgeschlossen?',
      optionen: [
        { text: 'Umsatzsteuer an SBK', richtig: true },
        { text: 'SBK an Umsatzsteuer' },
        { text: 'Umsatzsteuer an GuV' },
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
      'BA 2.3.5.3 (Zahllast, Vorsteuerüberhang, monatliche Verrechnung) abgeglichen am 03.11.2026; Abschlussbuchungen nach 04-fachregeln.md GC-09/GC-10 und Abschnitt 6',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
