// Lektion B2 – Ein- und Verkauf mit Vorsteuer und Umsatzsteuer buchen
// (eigene Formulierung; geprüft gegen BA 2.3.5.3; bestandsorientierte Erfassung nach 04-fachregeln.md)
import { loesung, satz, zeile } from '../../engine/booking';
import { Val, formatEuro } from '../../engine/money';
import type { Lektion } from './types';

// Zahlen von der Engine
const e = (v: Val) => formatEuro(v.value);
const UST = '0.19';
const steuer = (netto: string) => new Val(netto).times(UST).fix();

const Z_NETTO = new Val('6000');
const Z_VST = steuer('6000');
const Z_BRUTTO = Z_NETTO.plus(Z_VST);

const D_VST = steuer('4000');
const RS_VST = steuer('400');

const FJ_NETTO = new Val('5000');
const FJ_UST = steuer('5000');
const FJ_BRUTTO = FJ_NETTO.plus(FJ_UST);

const M_NETTO = new Val('20000');
const M_VST = steuer('20000');
const M_BRUTTO = M_NETTO.plus(M_VST);

const K1_NETTO = new Val('4000');
const K1_VST = steuer('4000');
const K2_NETTO = new Val('12000');
const K2_UST = steuer('12000');

export const lektionB2: Lektion = {
  id: 'B2',
  skillId: 'B2-ust-buchen',
  abschnitt: 'B',
  titel: 'Die Steuer läuft nur durch: Ein- und Verkauf buchen',
  kernAha:
    'Beim Einkauf kommt die Steuer auf das Konto Vorsteuer (Soll), beim Verkauf auf das Konto Umsatzsteuer (Haben). Waren, Rohstoffe und Erlöse stehen immer mit dem Nettobetrag in den Büchern.',
  dauerMin: 7,
  figuren: ['tobias', 'jana', 'leni'],
  ort: 'lager',
  quelle: 'BA 2.3.5.3',
  teaser: {
    figur: 'tobias',
    ausdruck: 'gruebelt',
    text: 'Morgen kommen 20 Paletten Zucker. Und wo trage ich die Steuer ein?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'lager',
      visual: {
        typ: 'beleg',
        absender: 'Zuckerkontor Hellwegland KG (Lippstadt)',
        nummer: '2026-0207',
        datum: '20.01.',
        zeilen: [
          { text: 'Kristallzucker, 20 Paletten', betrag: Z_NETTO.value.toString() },
          { text: 'zzgl. 19 % Umsatzsteuer', betrag: Z_VST.value.toString() },
          { text: 'Rechnungsbetrag', betrag: Z_BRUTTO.value.toString(), fett: true },
        ],
        fuss: 'Zahlbar innerhalb von 30 Tagen ohne Abzug.',
      },
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: `Ich buche einfach ${e(Z_BRUTTO)} auf Rohstoffe, oder?`,
        },
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: `Dann wäre unser Zucker ${e(Z_VST)} teurer, als er ist.`,
        },
      ],
      frage: 'Wohin gehört die Steuer auf der Rechnung?',
    },
    {
      typ: 'vorhersage',
      frage: `Wo bucht die MBG die ${e(Z_VST)} Steuer aus der Zuckerrechnung?`,
      optionen: [
        { text: 'Auf dem Konto Vorsteuer im Soll', richtig: true },
        { text: 'Auf dem Konto Umsatzsteuer im Haben' },
        { text: 'Zusammen mit dem Zucker auf Rohstoffe' },
      ],
      aufloesung: `Die MBG holt sich diese Steuer vom Finanzamt zurück. Sie ist eine Forderung – Konto Vorsteuer, Zugang im Soll. Auf Rohstoffe kommen nur die ${e(Z_NETTO)} netto.`,
    },
    {
      typ: 'konzept',
      titel: 'Ein Durchlaufposten',
      text: 'Die MBG kassiert Umsatzsteuer für das Finanzamt und bekommt gezahlte Vorsteuer zurück. Für ihren Gewinn spielt die Steuer deshalb keine Rolle – sie läuft nur durch.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Einkauf',
            text: 'Rohstoffe (netto) und Vorsteuer an Verbindlichkeiten a. LL (brutto).',
            farbe: '#1c6670',
          },
          {
            titel: 'Verkauf',
            text: 'Forderungen a. LL (brutto) an Umsatzerlöse (netto) und Umsatzsteuer.',
            farbe: '#e8792b',
          },
        ],
      },
    },
    {
      typ: 'erkunden',
      titel: 'Das Vorsteuerkonto im Januar',
      text: 'Buche die Steueranteile aus drei Belegen auf das Konto Vorsteuer.',
      erkunden: {
        art: 'tkonto-buchen',
        konto: 'Vorsteuer',
        vorgaenge: [
          { text: 'Steuer aus der Zuckerrechnung', betrag: Z_VST.value.toString(), seite: 'soll' },
          { text: 'Steuer aus der Dosenrechnung', betrag: D_VST.value.toString(), seite: 'soll' },
          {
            text: 'Rücksendung beschädigter Dosen: Steuerkorrektur',
            betrag: RS_VST.value.toString(),
            seite: 'haben',
          },
        ],
      },
      fazit:
        'Gezahlte Vorsteuer wächst im Soll. Wird ein Einkauf rückgängig gemacht, sinkt auch die Vorsteuer – im Haben. Der Saldo ist das, was die MBG vom Finanzamt zurückfordern kann.',
    },
    {
      typ: 'sortieren',
      titel: 'Vorsteuer oder Umsatzsteuer?',
      kategorien: ['Vorsteuer', 'Umsatzsteuer'],
      elemente: [
        { text: 'Kauf von Etiketten auf Ziel', kategorie: 'Vorsteuer' },
        { text: 'Verkauf von Paderquell Energy an eine Tankstelle', kategorie: 'Umsatzsteuer' },
        { text: 'Rechnung einer Werbeagentur für Plakate', kategorie: 'Vorsteuer' },
        { text: 'Verkauf von Domkreuz Vodka an ein Restaurant', kategorie: 'Umsatzsteuer' },
        { text: 'Reparatur der Abfüllanlage durch eine Fremdfirma', kategorie: 'Vorsteuer' },
      ],
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Für die Gewinnrechnung ist die Steuer unsichtbar. Rohstoffe und Umsatzerlöse stehen immer netto in den Büchern.',
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Dann rechne ich meine Verkaufszahlen ab sofort auch nur noch netto. Klingt bescheidener.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Eine Verkaufsbuchung',
      text: 'Die MBG verkauft Senne Lemon auf Ziel. Eine Zeile der Buchung ist falsch. Tippe sie an.',
      zeilen: [
        `Soll: Forderungen aus Lieferungen und Leistungen ${e(FJ_BRUTTO)}`,
        `Haben: Umsatzerlöse für eigene Erzeugnisse ${e(FJ_NETTO)}`,
        `Haben: Vorsteuer ${e(FJ_UST)}`,
      ],
      fehlerZeile: 2,
      gruende: [
        { text: 'Beim Verkauf entsteht Umsatzsteuer, nicht Vorsteuer.', richtig: true },
        { text: 'Die Umsatzerlöse müssten brutto gebucht werden.' },
        { text: 'Die Forderung müsste netto gebucht werden.' },
      ],
      aufloesung:
        'Die Steuer auf eine Ausgangsrechnung schuldet die MBG dem Finanzamt. Sie gehört auf das Passivkonto Umsatzsteuer, Zugang im Haben.',
    },
    {
      typ: 'verstaendnis',
      frage: `Die MBG kauft eine Etikettiermaschine für ${e(M_NETTO)} netto auf Ziel. Welche Buchung stimmt?`,
      optionen: [
        {
          text: `TA und Maschinen ${e(M_NETTO)}, Vorsteuer ${e(M_VST)} an Verbindlichkeiten a. LL ${e(M_BRUTTO)}`,
          richtig: true,
          erklaerung: 'Die Maschine kommt netto ins Anlagevermögen, die Steuer auf Vorsteuer.',
        },
        {
          text: `TA und Maschinen ${e(M_BRUTTO)} an Verbindlichkeiten a. LL ${e(M_BRUTTO)}`,
          erklaerung: 'So wäre die Maschine um die Vorsteuer zu teuer bewertet.',
        },
        {
          text: `TA und Maschinen ${e(M_NETTO)}, Umsatzsteuer ${e(M_VST)} an Verbindlichkeiten a. LL ${e(M_BRUTTO)}`,
          erklaerung: 'Beim Einkauf geht es um Vorsteuer, nicht um Umsatzsteuer.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'B2-m1',
      frage: 'Wie wird die Umsatzsteuer beim Einkauf und beim Verkauf gebucht?',
      text: 'Einkauf: netto auf das Bestands- oder Aufwandskonto, Steuer auf Vorsteuer (Soll). Verkauf: netto auf Umsatzerlöse, Steuer auf Umsatzsteuer (Haben). Vorsteuer ist eine Forderung, Umsatzsteuer eine Schuld gegenüber dem Finanzamt.',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe: `Bilden Sie die Buchungssätze (bestandsorientierte Erfassung, 19 % USt): 1. Kauf von Verschlüssen (Hilfsstoffe) auf Ziel, netto ${e(K1_NETTO)}. 2. Verkauf eigener Erzeugnisse auf Ziel, netto ${e(K2_NETTO)}.`,
      part: {
        typ: 'buchungssatz',
        id: 'buchung',
        titel: 'Buchungssätze',
        loesung: loesung([
          satz(
            [zeile('Hilfsstoffe', K1_NETTO), zeile('Vorsteuer', K1_VST)],
            [zeile('Verbindlichkeiten aus Lieferungen und Leistungen', K1_NETTO.plus(K1_VST))],
            'Einkauf',
          ),
          satz(
            [zeile('Forderungen aus Lieferungen und Leistungen', K2_NETTO.plus(K2_UST))],
            [zeile('Umsatzerlöse für eigene Erzeugnisse', K2_NETTO), zeile('Umsatzsteuer', K2_UST)],
            'Verkauf',
          ),
        ]),
      },
      cliffhanger: {
        figur: 'jana',
        ausdruck: 'gruebelt',
        text: 'Ende Januar rechnen wir mit dem Finanzamt ab. Spannend wird, ob wir zahlen müssen oder Geld zurückbekommen.',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Die MBG kauft Rohstoffe auf Ziel. Wo wird die Steuer gebucht?',
      optionen: [
        { text: 'Vorsteuer im Soll', richtig: true },
        { text: 'Umsatzsteuer im Haben' },
        { text: 'Rohstoffe im Soll' },
      ],
    },
    {
      frage: 'Mit welchem Betrag stehen Umsatzerlöse in den Büchern?',
      optionen: [{ text: 'Netto', richtig: true }, { text: 'Brutto' }, { text: 'Nur die Steuer' }],
    },
    {
      frage: 'Verkauf auf Ziel, netto 1.000 €, 19 % USt. Wie hoch ist die Forderung?',
      optionen: [
        { text: '1.190,00 €', richtig: true },
        { text: '1.000,00 €' },
        { text: '190,00 €' },
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
      'BA 2.3.5.3 (Buchung der Umsatzsteuer bei Ausgangsrechnung, Vorsteuer als Aktivkonto, durchlaufender Posten) abgeglichen am 03.11.2026; Rücksendung nach 04-fachregeln.md (GC-06)',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
