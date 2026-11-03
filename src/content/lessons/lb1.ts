// Lektion B1 – Brutto, Netto, Steuer (eigene Formulierung; geprüft gegen BA 2.3.5.3)
import { Val, formatEuro } from '../../engine/money';
import type { Lektion } from './types';

// Zahlen von der Engine
const e = (v: Val) => formatEuro(v.value);
const UST = '0.19';
const nettoAusBrutto = (b: string) => new Val(b).div('1.19').fix();

const R_NETTO = new Val('800');
const R_STEUER = R_NETTO.times(UST).fix();
const R_BRUTTO = R_NETTO.plus(R_STEUER);

const BON = '23.80';
const BON_NETTO = nettoAusBrutto(BON);
const BON_FALSCH = new Val(BON).minus(new Val(BON).times(UST)).fix();
const BON_STEUER = new Val(BON).minus(BON_NETTO);

const FJ_NETTO = new Val('2500');
const FJ_STEUER_RICHTIG = FJ_NETTO.times(UST).fix();

const BM = '119';
const BM_NETTO = nettoAusBrutto(BM);
const BM_VST = new Val(BM).minus(BM_NETTO);
const BM_FALSCH = new Val(BM).times(UST).fix();

const K_BRUTTO = '3570';
const K_NETTO = nettoAusBrutto(K_BRUTTO);
const K_VST = new Val(K_BRUTTO).minus(K_NETTO);

export const lektionB1: Lektion = {
  id: 'B1',
  skillId: 'B1-ust-rechnen',
  abschnitt: 'B',
  titel: 'Drei Beträge auf einer Rechnung: Brutto, Netto, Steuer',
  kernAha:
    'Netto × 1,19 = Brutto. Aus dem Bruttobetrag holt man das Netto mit ÷ 1,19 heraus – niemals 19 % vom Brutto abziehen.',
  dauerMin: 6,
  figuren: ['tobias', 'jana', 'leni'],
  ort: 'buero',
  quelle: 'BA 2.3.5.3',
  teaser: {
    figur: 'tobias',
    ausdruck: 'ueberrascht',
    text: 'Drei Beträge auf einer Rechnung – was kosten uns die Dosen denn nun wirklich?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      visual: {
        typ: 'beleg',
        absender: 'Dosenwerk Rüther KG (Bielefeld)',
        nummer: '2026-0118',
        datum: '12.01.',
        zeilen: [
          { text: 'Getränkedosen 0,33 l, 8.000 Stück', betrag: R_NETTO.value.toString() },
          { text: 'zzgl. 19 % Umsatzsteuer', betrag: R_STEUER.value.toString() },
          { text: 'Rechnungsbetrag', betrag: R_BRUTTO.value.toString(), fett: true },
        ],
        fuss: 'Zahlbar innerhalb von 14 Tagen ohne Abzug.',
      },
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'ueberrascht',
          text: 'Drei Beträge auf einer einzigen Rechnung. Welchen davon kosten uns die Dosen eigentlich?',
        },
        { figur: 'jana', ausdruck: 'gruebelt', text: 'Weniger, als du denkst.' },
      ],
      frage:
        'Die MBG überweist den ganzen Rechnungsbetrag. Welcher Teil davon ist der echte Preis für die Dosen?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Kennst du deine Gehaltsabrechnung? Oben steht brutto, auf dem Konto landet netto.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Bei Rechnungen ist es andersherum: Der Lieferant nennt seinen Nettopreis und schlägt die Steuer obendrauf. Die Steuer holen wir uns vom Finanzamt zurück.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Ein Kassenbon zeigt ${e(new Val(BON))} einschließlich 19 % Umsatzsteuer. Wie viel ist das netto?`,
      optionen: [
        { text: e(BON_FALSCH) },
        { text: e(BON_NETTO), richtig: true },
        { text: e(BON_STEUER) },
      ],
      aufloesung: `Der Bon zeigt 119 % – Ware plus Steuer. ${e(new Val(BON))} ÷ 1,19 = ${e(BON_NETTO)}. Wer 19 % vom Bruttobetrag abzieht, landet bei ${e(BON_FALSCH)} und rechnet zu wenig.`,
    },
    {
      typ: 'konzept',
      titel: '100 % + 19 % = 119 %',
      text: 'Netto ist 100 %, die Umsatzsteuer kommt mit 19 % obendrauf: brutto = 119 %. Also netto × 1,19 = brutto, brutto ÷ 1,19 = netto. In allen Aufgaben gilt 19 % Umsatzsteuer, sofern nichts anderes angegeben ist.',
      visual: { typ: 'brutto-netto', brutto: R_BRUTTO.value.toString(), ustSatz: UST },
    },
    {
      typ: 'sortieren',
      titel: 'Wem gehört die Steuer auf dem Beleg?',
      kategorien: ['Umsatzsteuer (die MBG schuldet sie)', 'Vorsteuer (die MBG bekommt sie zurück)'],
      elemente: [
        {
          text: 'Steuer auf der Rechnung der MBG an einen Getränkemarkt',
          kategorie: 'Umsatzsteuer (die MBG schuldet sie)',
        },
        {
          text: 'Steuer auf der Rechnung des Aromenlieferanten',
          kategorie: 'Vorsteuer (die MBG bekommt sie zurück)',
        },
        {
          text: 'Steuer auf der Werkstattrechnung für den Gabelstapler',
          kategorie: 'Vorsteuer (die MBG bekommt sie zurück)',
        },
        {
          text: 'Steuer auf dem Verkauf von Liboriwein an ein Hotel',
          kategorie: 'Umsatzsteuer (die MBG schuldet sie)',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Rechnen in beide Richtungen',
      text: `Die Dosenrechnung: ${e(R_NETTO)} netto.`,
      schritte: [
        {
          text: 'Steuer vom Nettobetrag',
          rechnung: `${e(R_NETTO)} × 19 % = ${e(R_STEUER)}`,
          warum: 'Der Steuersatz bezieht sich immer auf den Nettobetrag.',
        },
        {
          text: 'Bruttobetrag',
          rechnung: `${e(R_NETTO)} + ${e(R_STEUER)} = ${e(R_BRUTTO)}`,
          warum: 'Das überweist die MBG insgesamt an den Lieferanten.',
        },
        {
          text: 'Zurück zum Nettobetrag',
          rechnung: `${e(R_BRUTTO)} ÷ 1,19 = ${e(R_NETTO)}`,
          warum: 'Brutto sind 119 %. Teilen durch 1,19 führt zurück auf 100 %.',
        },
        {
          text: 'Steuer aus dem Bruttobetrag',
          rechnung: `${e(R_BRUTTO)} − ${e(R_NETTO)} = ${e(R_STEUER)}`,
          warum: 'Die Steuer ist einfach die Differenz zwischen brutto und netto.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Wie kommt man vom Brutto- zum Nettobetrag?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Ganz einfach: 19 % vom Bruttobetrag abziehen.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Die 19 % beziehen sich auf das Netto. Vom Brutto aus musst du durch 1,19 teilen.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Der Bruttobetrag entspricht 119 %, nicht 100 % – also durch 1,19 teilen.',
          richtig: true,
        },
        { text: 'Weil die Steuer erst nach der Zahlung berechnet wird.' },
        { text: 'Weil 19 % vom Brutto immer zu viel Steuer ergeben.' },
      ],
      aufloesung:
        'Tobias’ Weg zieht 19 % von 119 % ab und trifft deshalb nie ganz. Leni rechnet sauber: brutto ÷ 1,19 = netto.',
    },
    {
      typ: 'fehlerjagd',
      titel: 'Eine Rechnung mit Rechenfehler',
      text: 'Ein Lieferant hat sich verrechnet. Tippe die falsche Zeile an.',
      zeilen: [
        `Warenwert netto ${e(FJ_NETTO)}`,
        'zzgl. 19 % Umsatzsteuer 400,00 €',
        `Rechnungsbetrag ${e(FJ_NETTO.plus('400'))}`,
      ],
      fehlerZeile: 1,
      gruende: [
        {
          text: `19 % von ${e(FJ_NETTO)} sind ${e(FJ_STEUER_RICHTIG)}, nicht 400,00 €.`,
          richtig: true,
        },
        { text: 'Die Steuer müsste vom Rechnungsbetrag berechnet werden.' },
        { text: 'Auf Getränkezutaten fällt keine Umsatzsteuer an.' },
      ],
      aufloesung: `Mit der falschen Steuer stimmt auch der Rechnungsbetrag nicht. Richtig wären ${e(FJ_STEUER_RICHTIG)} Steuer und ${e(FJ_NETTO.plus(FJ_STEUER_RICHTIG))} insgesamt – so eine Rechnung lässt Jana korrigieren.`,
    },
    {
      typ: 'verstaendnis',
      frage: `Die MBG kauft Büromaterial für ${e(new Val(BM))} brutto (19 %). Wie hoch ist die Vorsteuer?`,
      optionen: [
        {
          text: e(BM_VST),
          richtig: true,
          erklaerung: `${e(new Val(BM))} ÷ 1,19 = ${e(BM_NETTO)} netto; die Differenz ${e(BM_VST)} ist die Vorsteuer.`,
        },
        {
          text: e(BM_FALSCH),
          erklaerung: 'Das sind 19 % vom Bruttobetrag – zu viel. Erst netto herausrechnen.',
        },
        { text: e(BM_NETTO), erklaerung: 'Das ist der Nettobetrag, nicht die Steuer.' },
      ],
    },
    {
      typ: 'merksatz',
      id: 'B1-m1',
      frage: 'Wie rechnet man zwischen Netto, Umsatzsteuer und Brutto?',
      text: 'Netto × 1,19 = Brutto. Brutto ÷ 1,19 = Netto. Die Steuer ist die Differenz. Nie 19 % vom Bruttobetrag abziehen.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe: `Eine Eingangsrechnung über Etiketten lautet auf ${e(new Val(K_BRUTTO))} einschließlich 19 % Umsatzsteuer. Ermitteln Sie den Nettobetrag und die Vorsteuer.`,
      part: {
        typ: 'rechenkette',
        id: 'ust',
        titel: 'Nettobetrag und Vorsteuer',
        felder: [
          {
            typ: 'zahl',
            id: 'netto',
            label: 'Nettobetrag',
            kind: 'betrag',
            einheit: '€',
            soll: K_NETTO,
          },
          { typ: 'zahl', id: 'vst', label: 'Vorsteuer', kind: 'betrag', einheit: '€', soll: K_VST },
        ],
      },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'gruebelt',
        text: 'Morgen kommen zwölf Kanister Zitrusaroma mit Rechnung. Und wo trage ich da die Steuer ein?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Ein Betrag von 595,00 € enthält 19 % Umsatzsteuer. Wie hoch ist der Nettobetrag?',
      optionen: [{ text: '500,00 €', richtig: true }, { text: '481,95 €' }, { text: '95,00 €' }],
    },
    {
      frage: 'Wovon wird die Umsatzsteuer berechnet?',
      optionen: [
        { text: 'Vom Nettobetrag', richtig: true },
        { text: 'Vom Bruttobetrag' },
        { text: 'Vom Zahlbetrag nach Skonto' },
      ],
    },
    {
      frage: 'Die Steuer auf einer Eingangsrechnung ist für die MBG …',
      optionen: [
        { text: 'Vorsteuer – eine Forderung gegenüber dem Finanzamt', richtig: true },
        { text: 'Umsatzsteuer – eine Schuld' },
        { text: 'Aufwand' },
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
      'BA 2.3.5.3 (Steuersätze, Nettoprinzip, Herausrechnen aus dem Bruttobetrag, Vorsteuer als Forderung) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
