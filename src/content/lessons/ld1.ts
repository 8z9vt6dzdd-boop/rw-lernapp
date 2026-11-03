// Lektion D1 – Verkauf eigener Erzeugnisse (eigene Formulierung; Buchungsregeln nach BA 3.2 und
// 04-fachregeln.md). Alle Beträge rechnet die Engine (Generator D1-verkauf).
import { formatEuro, formatProzent, type Val } from '../../engine/money';
import { solveVerkauf, type VerkaufParams } from '../../engine/generators/d/verkauf';
import type { Lektion } from './types';

const BEISPIEL: VerkaufParams = {
  art: 'erzeugnisse',
  produkt: '„Senne Lemon“',
  kunde: 'Gastro-Großhandel Nolte KG (Bielefeld)',
  listenpreis: '30000',
  rabattSatz: '0.15',
  verpackung: { betrag: '200', brutto: false },
  fracht: { betrag: '400', brutto: false },
  ustSatz: '0.19',
  zahlung: 'ziel',
  vorlage: 0,
};
const S = solveVerkauf(BEISPIEL);
const e = (v: Val | string) => formatEuro(v);
const RABATT = formatProzent(BEISPIEL.rabattSatz);

const VODKA: VerkaufParams = {
  ...BEISPIEL,
  art: 'handelswaren',
  produkt: '„Domkreuz Vodka“',
  listenpreis: '2000',
  rabattSatz: '0',
};
delete VODKA.verpackung;
delete VODKA.fracht;
const SV = solveVerkauf(VODKA);

export const lektionD1: Lektion = {
  id: 'D1',
  skillId: 'D1-verkauf',
  abschnitt: 'D',
  titel: 'Die erste große Ausgangsrechnung',
  kernAha:
    'Auf Umsatzerlöse kommt alles, was der Kunde netto bezahlt: Warenwert nach Rabatt plus berechnete Verpackung und Fracht. Der Sofortrabatt wird nicht gebucht, die Umsatzsteuer ist eine Schuld beim Finanzamt.',
  dauerMin: 7,
  figuren: ['tobias', 'jana', 'leni'],
  ort: 'buero',
  quelle: 'BA 2.3.5.3 und 3.2; 04-fachregeln.md (Konten, Konvention 5)',
  teaser: {
    figur: 'tobias',
    ausdruck: 'feiert',
    text: 'Die Saison geht los! Die erste große Lieferung an Nolte ist raus.',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      visual: {
        typ: 'beleg',
        art: 'rechnung',
        absender: 'MBG Getränke OHG (Lernversion), Paderborn',
        nummer: 'AR 2026-0412',
        datum: '12.04.',
        zeilen: [
          { text: `Senne Lemon, 50 Paletten, Listenpreis`, betrag: BEISPIEL.listenpreis },
          { text: `abzüglich ${RABATT} Wiederverkäuferrabatt`, betrag: S.rabatt.value.toString() },
          { text: 'Mehrwegverpackung', betrag: S.verpackungNetto.value.toString() },
          { text: 'Fracht', betrag: S.frachtNetto.value.toString() },
          { text: 'Nettobetrag', betrag: S.netto.value.toString() },
          { text: 'zzgl. 19 % Umsatzsteuer', betrag: S.ust.value.toString() },
          { text: 'Rechnungsbetrag', betrag: S.brutto.value.toString(), fett: true },
        ],
        fuss: `Empfänger: ${BEISPIEL.kunde}. Zahlbar innerhalb von 30 Tagen.`,
      },
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'feiert',
          text: `Erste Saisonlieferung an Nolte: ${e(BEISPIEL.listenpreis)} Listenpreis! Das ist unser Umsatz, oder?`,
        },
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: 'Schau mal genauer auf die Rechnung. Da stehen sieben Beträge.',
        },
      ],
      frage: 'Welcher dieser Beträge ist der Umsatz der MBG – und was passiert mit dem Rest?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Denk an den Pizzadienst: Pizza plus Liefergebühr, beides zahlst du, beides ist sein Umsatz. Die Mehrwertsteuer darauf gibt er ans Finanzamt weiter.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Und den Stammkundenrabatt zieht er gleich auf dem Bon ab. Den sieht seine Buchhaltung nie.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Nolte bekommt ${RABATT} Rabatt, direkt in der Rechnung abgezogen. Wie wird dieser Rabatt gebucht?`,
      optionen: [
        { text: 'Auf Erlösberichtigungen im Soll' },
        { text: 'Gar nicht – Umsatzerlöse nur mit dem Betrag nach Rabatt', richtig: true },
        { text: 'Als Aufwand für Werbung' },
      ],
      aufloesung: `Ein Sofortrabatt, der schon in der Rechnung steht, wird nicht gebucht. Verkauft hat die MBG die Ware für ${e(S.warenwert)}, nicht für ${e(BEISPIEL.listenpreis)}. Erlösberichtigungen sind für Nachlässe, die erst nachträglich gewährt werden.`,
    },
    {
      typ: 'konzept',
      titel: 'Was ist Umsatz?',
      text: 'Umsatzerlöse sind alles, was der Kunde netto für die Lieferung bezahlt: Warenwert nach Rabatt plus berechnete Verpackung und Fracht. Die Umsatzsteuer gehört dem Finanzamt.',
      visual: {
        typ: 'karten',
        karten: [
          { titel: 'Warenwert nach Rabatt', text: e(S.warenwert), farbe: '#1c6670' },
          { titel: '+ Verpackung und Fracht', text: e(S.nebenkosten), farbe: '#8cbf3f' },
          { titel: '= Umsatzerlöse (Haben)', text: e(S.netto), farbe: '#e2b13c' },
          { titel: 'Umsatzsteuer (Haben)', text: e(S.ust), farbe: '#e8792b' },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Wohin gehört welcher Betrag?',
      text: 'Ordne die Beträge der Rechnung an Nolte zu.',
      kategorien: ['Umsatzerlöse', 'Umsatzsteuer', 'Wird nicht gebucht'],
      elemente: [
        {
          text: `Warenwert nach Rabatt ${e(S.warenwert)}`,
          kategorie: 'Umsatzerlöse',
        },
        {
          text: `Rabatt ${e(S.rabatt)}`,
          kategorie: 'Wird nicht gebucht',
          erklaerung:
            'Der Sofortrabatt ist schon abgezogen und erscheint nicht als eigene Buchung.',
        },
        {
          text: `Berechnete Verpackung ${e(S.verpackungNetto)}`,
          kategorie: 'Umsatzerlöse',
          erklaerung: 'Der Kunde bezahlt sie – also Umsatz der MBG.',
        },
        {
          text: `Berechnete Fracht ${e(S.frachtNetto)}`,
          kategorie: 'Umsatzerlöse',
        },
        {
          text: `19 % auf ${e(S.netto)} = ${e(S.ust)}`,
          kategorie: 'Umsatzsteuer',
          erklaerung: 'Eine Schuld gegenüber dem Finanzamt, also Passivkonto im Haben.',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Die Rechnung an Nolte, Schritt für Schritt',
      schritte: [
        {
          text: 'Rabatt abziehen',
          rechnung: `${e(BEISPIEL.listenpreis)} − ${RABATT} = ${e(S.warenwert)}`,
          warum: 'Der Rabatt gilt nur für die Ware, nicht für Verpackung und Fracht.',
        },
        {
          text: 'Nebenkosten addieren',
          rechnung: `${e(S.warenwert)} + ${e(S.verpackungNetto)} + ${e(S.frachtNetto)} = ${e(S.netto)}`,
          warum: 'Was die MBG dem Kunden berechnet, ist Teil des Verkaufspreises.',
        },
        {
          text: 'Umsatzsteuer',
          rechnung: `${e(S.netto)} × 19 % = ${e(S.ust)}`,
          warum: 'Die Steuer wird auf den gesamten Nettobetrag erhoben.',
        },
        {
          text: 'Buchungssatz',
          rechnung: `Forderungen a. LL ${e(S.brutto)} an Umsatzerlöse ${e(S.netto)}, an Umsatzsteuer ${e(S.ust)}`,
          warum:
            'Nolte schuldet der MBG den Bruttobetrag (Forderung im Soll). Erlös und Steuerschuld stehen im Haben.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: `Die MBG verkauft „Domkreuz Vodka“ für ${e(SV.netto)} netto. Welches Erlöskonto?`,
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Umsatz ist Umsatz. Also Umsatzerlöse für eigene Erzeugnisse, wie immer.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Den Vodka brennen wir aber nicht selbst. Den kaufen wir zu und verkaufen ihn weiter.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Zugekaufte Ware ist Handelsware – sie hat ein eigenes Erlöskonto.',
          richtig: true,
        },
        { text: 'Vodka ist steuerfrei und wird gar nicht gebucht.' },
        { text: 'Handelswaren werden über das Konto Handelswaren im Haben verkauft.' },
      ],
      aufloesung: `Richtig: Bank bzw. Forderungen ${e(SV.brutto)} an Umsatzerlöse für Handelswaren ${e(SV.netto)}, an Umsatzsteuer ${e(SV.ust)}. So sieht die MBG getrennt, was sie mit eigenen Getränken und was sie mit Handelsware verdient.`,
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege hat die Fracht „verrechnet“',
      text: 'In dieser Buchung der Rechnung an Nolte gehört eine Zeile so nicht hierher. Tippe sie an.',
      zeilen: [
        `Soll: Forderungen a. LL ${e(S.brutto)}`,
        `Haben: Umsatzerlöse ${e(S.warenwert)}`,
        `Haben: Ausgangsfrachten ${e(S.nebenkosten)}`,
        `Haben: Umsatzsteuer ${e(S.ust)}`,
      ],
      fehlerZeile: 2,
      gruende: [
        {
          text: 'Was der Kunde für Verpackung und Fracht bezahlt, ist Umsatzerlös, keine Minderung von Aufwand.',
          richtig: true,
        },
        { text: 'Die Umsatzsteuer gehört ins Soll.' },
        { text: 'Die Forderung muss netto gebucht werden.' },
      ],
      aufloesung: `Verpackung und Fracht gehören zu den Umsatzerlösen. Richtig sind Umsatzerlöse ${e(S.netto)} in einer Zeile. Das Konto Ausgangsfrachten brauchst du erst, wenn die MBG selbst eine Speditionsrechnung bezahlt.`,
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Neue Lieferung, kein Rabatt, aber mit Verpackung und Fracht. Ergänze die Umsatzerlöse und die Umsatzsteuer.',
      skillId: 'D1-verkauf',
      seed: 2,
      variant: 'nebenkosten',
      partId: 'rechnung',
      gefragt: ['netto', 'ust'],
    },
    {
      typ: 'merksatz',
      id: 'D1-m1',
      frage: 'Was wird beim Verkauf auf Umsatzerlöse gebucht?',
      text: 'Verkauf: Forderungen a. LL (brutto) an Umsatzerlöse (netto) und an Umsatzsteuer. Zu den Umsatzerlösen gehören Warenwert nach Sofortrabatt sowie dem Kunden berechnete Verpackung und Fracht. Der Sofortrabatt selbst wird nicht gebucht.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe: 'Bilden Sie den Buchungssatz für die Ausgangsrechnung.',
      part: { skillId: 'D1-verkauf', seed: 4, partId: 'buchung' },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'entsetzt',
        text: 'Nolte hat angerufen: Ein Teil der Dosen kommt zurück. Muss ich jetzt die ganze Rechnung neu schreiben?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Listenpreis 10.000 €, 10 % Sofortrabatt, berechnete Fracht 200 € netto. Wie hoch sind die Umsatzerlöse?',
      optionen: [
        { text: '9.200,00 €', richtig: true },
        { text: '9.180,00 €' },
        { text: '10.200,00 €' },
      ],
    },
    {
      frage: 'Wie wird ein in der Rechnung abgezogener Wiederverkäuferrabatt gebucht?',
      optionen: [
        { text: 'Gar nicht', richtig: true },
        { text: 'Auf Erlösberichtigungen im Soll' },
        { text: 'Auf Umsatzerlöse im Soll' },
      ],
    },
    {
      frage: 'Die MBG verkauft zugekauften Weißwein. Welches Erlöskonto?',
      optionen: [
        { text: 'Umsatzerlöse für Handelswaren', richtig: true },
        { text: 'Umsatzerlöse für eigene Erzeugnisse' },
        { text: 'Handelswaren' },
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
      'BA 3.2.1 (Ausgangsrechnung mit Wiederverkäuferrabatt), Musterklausur-Aufbau (berechnete Verpackung/Fracht auf Umsatzerlöse); Zahlen aus der Engine; 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
