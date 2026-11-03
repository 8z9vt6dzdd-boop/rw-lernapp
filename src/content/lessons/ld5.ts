// Lektion D5 – Ausgangsfrachten (eigene Formulierung; Vertriebsaufwand mit Vorsteuer, Abgrenzung zu
// Bezugskosten und berechneter Fracht). Alle Beträge rechnet die Engine (Generator D5-ausgangsfrachten).
import { formatEuro, type Val } from '../../engine/money';
import {
  solveAusgangsfracht,
  type AusgangsfrachtParams,
} from '../../engine/generators/d/ausgangsfrachten';
import type { Lektion } from './types';

const SPEDITION: AusgangsfrachtParams = {
  fall: 'ausgang',
  gegeben: 'brutto',
  betrag: '1190',
  zahlung: 'kasse',
  stoff: 'Rohstoffe',
  gegenstand: 'Zucker',
  kunde: 'Landhotel Kerkhoff GmbH (Bad Driburg)',
  produkt: '„Senne Lemon“',
  warenwert: '0',
  frachtBerechnet: '0',
  erkennen: false,
  ustSatz: '0.19',
};
const S = solveAusgangsfracht(SPEDITION);
const WB: AusgangsfrachtParams = {
  ...SPEDITION,
  fall: 'weiterberechnet',
  gegeben: 'netto',
  betrag: '300',
  zahlung: 'ziel',
  kunde: 'Gastro-Großhandel Nolte KG (Bielefeld)',
  warenwert: '10000',
  frachtBerechnet: '250',
};
const W = solveAusgangsfracht(WB);
const e = (v: Val | string) => formatEuro(v);

export const lektionD5: Lektion = {
  id: 'D5',
  skillId: 'D5-ausgangsfrachten',
  abschnitt: 'D',
  titel: 'Frei Haus: Wer bezahlt die Spedition?',
  kernAha:
    'Fracht für die Auslieferung an Kunden, die die MBG selbst trägt, ist Vertriebsaufwand: Ausgangsfrachten (netto) und Vorsteuer. Fracht im Einkauf sind Bezugskosten, Fracht, die der Kunde bezahlt, ist Umsatzerlös.',
  dauerMin: 6,
  figuren: ['tobias', 'jana', 'leni', 'sabine'],
  ort: 'lager',
  quelle: 'BA 3.1 (Bezugskosten), 3.2; Kontenliste 04-fachregeln.md (Ausgangsfrachten)',
  teaser: {
    figur: 'tobias',
    ausdruck: 'freut',
    text: 'Ich hab dem Landhotel „frei Haus“ zugesagt. Klingt doch gut, oder?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'lager',
      visual: {
        typ: 'beleg',
        art: 'rechnung',
        absender: 'Spedition (Rechnung an die MBG)',
        nummer: 'SP-0618',
        datum: '18.06.',
        zeilen: [
          {
            text: 'Transport 8 Paletten Senne Lemon, Paderborn – Bad Driburg',
            betrag: S.netto.value.toString(),
          },
          { text: 'zzgl. 19 % Umsatzsteuer', betrag: S.vorsteuer.value.toString() },
          {
            text: 'Rechnungsbetrag, bar an den Fahrer',
            betrag: S.brutto.value.toString(),
            fett: true,
          },
        ],
        fuss: 'Lieferbedingung laut Auftrag: frei Haus.',
      },
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Ich hab dem Landhotel „frei Haus“ versprochen. Die lieben uns jetzt!',
        },
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: 'Schön. Dann liegt die Rechnung der Spedition jetzt bei uns.',
        },
      ],
      frage: 'Bezugskosten, Umsatz oder etwas ganz anderes – wohin gehört diese Frachtrechnung?',
    },
    {
      typ: 'dialog',
      ort: 'lager',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Wenn du ein Geschenk verschickst, zahlst du das Porto. Das Geschenk wird dadurch nicht wertvoller, es kostet dich einfach.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Genau so beim Verkauf: Versand an Kunden ist Aufwand. Das Konto heißt Ausgangsfrachten.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Drei Frachten, drei Konten',
      text: 'Frage dich: Einkauf oder Verkauf? Und wer bezahlt?',
      kategorien: ['Bezugskosten', 'Ausgangsfrachten', 'Umsatzerlöse'],
      elemente: [
        {
          text: 'Eine Spedition bringt Zucker vom Lieferanten ins Werk; die MBG zahlt.',
          kategorie: 'Bezugskosten',
          erklaerung: 'Fracht im Einkauf erhöht die Anschaffungskosten der Rohstoffe.',
        },
        {
          text: 'Die Spedition liefert frei Haus an einen Getränkemarkt; die MBG zahlt.',
          kategorie: 'Ausgangsfrachten',
        },
        {
          text: 'Die MBG stellt einem Kunden 250 € Frachtanteil in Rechnung.',
          kategorie: 'Umsatzerlöse',
          erklaerung: 'Der Kunde bezahlt die Fracht – das ist Teil des Verkaufserlöses.',
        },
        {
          text: 'Ein Paketdienst bringt neue Etiketten; die MBG zahlt bar.',
          kategorie: 'Bezugskosten',
        },
        {
          text: 'Der Fahrer bringt Paletten zum Bistro an der Pader und kassiert bar bei der MBG.',
          kategorie: 'Ausgangsfrachten',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Die Spedition verlangt ${e(S.brutto)} inklusive Umsatzsteuer. Wie viel davon ist Aufwand der MBG?`,
      optionen: [
        { text: e(S.brutto) },
        { text: e(S.netto), richtig: true },
        { text: e(S.vorsteuer) },
      ],
      aufloesung: `Die Spedition ist ein Lieferant der MBG. Die ${e(S.vorsteuer)} Umsatzsteuer auf ihrer Rechnung holt sich die MBG als Vorsteuer vom Finanzamt zurück. Aufwand sind nur ${e(S.netto)}.`,
    },
    {
      typ: 'konzept',
      titel: 'Die Frachtrechnung zerlegen',
      text: 'Ausgangsfrachten sind Vertriebskosten und stehen als Aufwand im Soll, und zwar netto. Die Umsatzsteuer der Spedition ist für die MBG Vorsteuer.',
      visual: { typ: 'brutto-netto', brutto: SPEDITION.betrag, ustSatz: SPEDITION.ustSatz },
    },
    {
      typ: 'erkunden',
      titel: 'Wer zahlt, wer kassiert?',
      text: 'Decke die drei Fälle auf.',
      erkunden: {
        art: 'aufdecken',
        karten: [
          {
            titel: 'Fracht im Einkauf',
            text: 'Die MBG zahlt den Transport von Zucker oder Dosen ins Werk: Bezugskosten für den Stoff, dazu Vorsteuer. Die Fracht gehört zu den Anschaffungskosten.',
            farbe: '#1c6670',
          },
          {
            titel: 'Fracht beim Verkauf, MBG zahlt',
            text: 'Lieferung frei Haus: Die MBG bezahlt die Spedition. Ausgangsfrachten (Aufwand) und Vorsteuer.',
            farbe: '#e8792b',
          },
          {
            titel: 'Fracht beim Verkauf, Kunde zahlt',
            text: 'Die MBG schreibt die Fracht auf die Ausgangsrechnung. Das ist Umsatzerlös, dazu Umsatzsteuer.',
            farbe: '#8cbf3f',
          },
        ],
      },
      fazit:
        'Gleiches Wort, drei Konten. Entscheidend ist, ob es um Einkauf oder Verkauf geht – und wer am Ende bezahlt.',
    },
    {
      typ: 'vorgerechnet',
      titel: 'Beides auf einmal: Nolte zahlt einen Frachtanteil',
      text: `Warenwert ${e(WB.warenwert)} netto, Nolte zahlt ${e(WB.frachtBerechnet)} netto Frachtanteil. Die Spedition berechnet der MBG ${e(W.netto)} netto.`,
      schritte: [
        {
          text: 'Ausgangsrechnung an Nolte',
          rechnung: `Forderungen a. LL ${e(W.erloesBrutto)} an Umsatzerlöse ${e(W.erloesNetto)}, an Umsatzsteuer ${e(W.erloesUst)}`,
          warum: 'Der berechnete Frachtanteil gehört zum Verkaufserlös.',
        },
        {
          text: 'Rechnung der Spedition',
          rechnung: `Ausgangsfrachten ${e(W.netto)}, Vorsteuer ${e(W.vorsteuer)} an Verbindlichkeiten a. LL ${e(W.brutto)}`,
          warum: 'Was die MBG selbst an die Spedition zahlt, ist Aufwand.',
        },
        {
          text: 'Nicht verrechnen',
          warum: `Erlös und Aufwand werden getrennt gebucht. Erst in der GuV sieht man, dass die MBG ${e(W.netto.minus(WB.frachtBerechnet))} der Fracht selbst getragen hat.`,
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Die Rechnung vom Landhotel-Transport',
      text: 'Ein Kollege hat die Speditionsrechnung so gebucht. Eine Zeile ist falsch.',
      zeilen: [
        `Soll: Bezugskosten für Rohstoffe ${e(S.netto)}`,
        `Soll: Vorsteuer ${e(S.vorsteuer)}`,
        `Haben: Kasse ${e(S.brutto)}`,
      ],
      fehlerZeile: 0,
      gruende: [
        {
          text: 'Fracht für eine Lieferung an Kunden ist Vertriebsaufwand, keine Bezugskosten.',
          richtig: true,
        },
        { text: 'Die Steuer müsste Umsatzsteuer heißen.' },
        { text: 'Die Kasse müsste im Soll stehen.' },
      ],
      aufloesung: `Bezugskosten gibt es nur im Einkauf. Richtig: Ausgangsfrachten ${e(S.netto)}, Vorsteuer ${e(S.vorsteuer)} an Kasse ${e(S.brutto)}.`,
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Eine neue Speditionsrechnung, brutto angegeben. Ergänze Fracht netto und Vorsteuer.',
      skillId: 'D5-ausgangsfrachten',
      seed: 3,
      variant: 'brutto',
      partId: 'rechnung',
      gefragt: ['netto', 'vst'],
    },
    {
      typ: 'merksatz',
      id: 'D5-m1',
      frage: 'Wie bucht man die Frachtrechnung für eine Lieferung frei Haus?',
      text: 'Fracht, die die MBG beim Verkauf selbst trägt: Ausgangsfrachten (netto) und Vorsteuer an Verbindlichkeiten, Bank oder Kasse. Fracht im Einkauf: Bezugskosten. Fracht, die der Kunde bezahlt: Umsatzerlöse.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe:
        'Bilden Sie die Buchungssätze für die Ausgangsrechnung und für die Rechnung der Spedition.',
      part: {
        skillId: 'D5-ausgangsfrachten',
        seed: 3,
        variant: 'weiterberechnet',
        partId: 'buchung',
      },
      cliffhanger: {
        figur: 'sabine',
        ausdruck: 'freut',
        text: 'Ich nehme mir zwei Kartons Senne Lemon für den Geburtstag meiner Mutter mit. Das ist doch in Ordnung, oder?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Die MBG liefert frei Haus und erhält die Speditionsrechnung über 595 € brutto (19 % USt). Buchung?',
      optionen: [
        {
          text: 'Ausgangsfrachten 500 €, Vorsteuer 95 € an Verbindlichkeiten a. LL 595 €',
          richtig: true,
        },
        {
          text: 'Bezugskosten für Rohstoffe 500 €, Vorsteuer 95 € an Verbindlichkeiten a. LL 595 €',
        },
        { text: 'Ausgangsfrachten 595 € an Verbindlichkeiten a. LL 595 €' },
      ],
    },
    {
      frage: 'Die MBG stellt einem Kunden die Fracht in Rechnung. Welches Konto?',
      optionen: [
        { text: 'Umsatzerlöse', richtig: true },
        { text: 'Ausgangsfrachten im Haben' },
        { text: 'Erlösberichtigungen' },
      ],
    },
    {
      frage: 'Fracht für eingekaufte Dosen – welches Konto?',
      optionen: [
        { text: 'Bezugskosten für Hilfsstoffe', richtig: true },
        { text: 'Ausgangsfrachten' },
        { text: 'Aufwendungen für Hilfsstoffe' },
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
      'Kontenliste 04-fachregeln.md (Ausgangsfrachten als Aufwand), BA 3.1 (Bezugskosten), Musterklausur-Aufbau (Spediteurrechnung mit Vorsteuer); [ANNAHME] siehe docs/m7/d.md; Zahlen aus der Engine; 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
