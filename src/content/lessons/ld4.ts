// Lektion D4 – Skonto beim Verkauf (eigene Formulierung; Buchungsregeln nach 04-fachregeln.md, GC-03 und Abschnitt 6).
// Alle Beträge werden von der Engine berechnet.
import { formatEuro, formatProzent, type Val } from '../../engine/money';
import { solveSkonto, type SkontoParams } from '../../engine/generators/skonto';
import type { Lektion } from './types';

const BEISPIEL: SkontoParams = {
  seite: 'verkauf',
  art: 'Erzeugnisse',
  methode: 'netto',
  gegeben: 'rechnung',
  betrag: '5950',
  skontoSatz: '0.03',
  ustSatz: '0.19',
  partner: 'Gastro-Großhandel Nolte KG (Bielefeld)',
  gegenstand: 'Senne Lemon',
  vorlage: 0,
};
const S = solveSkonto(BEISPIEL);
const e = (v: Val) => formatEuro(v.value.toString());
const SATZ = formatProzent(BEISPIEL.skontoSatz);

export const lektionD4: Lektion = {
  id: 'D4',
  skillId: 'D4-skonto-verkauf',
  abschnitt: 'D',
  titel: 'Skonto beim Verkauf',
  kernAha:
    'Zieht ein Kunde Skonto, sinkt unser Umsatz: Der Nettoanteil geht auf Erlösberichtigungen, der Steueranteil korrigiert die Umsatzsteuer – beides im Soll.',
  dauerMin: 7,
  figuren: ['tobias', 'jana', 'leni'],
  ort: 'buero',
  quelle: 'BA 3.2; 04-fachregeln.md (GC-03, Abschnitt 6)',
  teaser: {
    figur: 'tobias',
    ausdruck: 'ueberrascht',
    text: `Nolte hat bezahlt – aber ${e(S.skontoBrutto)} weniger als auf unserer Rechnung!`,
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      visual: {
        typ: 'beleg',
        art: 'kontoauszug',
        absender: 'Kontoauszug MBG, Sparkasse Paderborn',
        datum: '12.05.',
        zeilen: [
          {
            text: `Gutschrift ${BEISPIEL.partner}`,
            betrag: S.zahlbetrag.value.toString(),
            fett: true,
          },
          {
            text: `Verwendungszweck: Rechnung 2026-0507 über ${e(S.rechnung)}, abzgl. ${SATZ} Skonto`,
          },
        ],
      },
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'ueberrascht',
          text: `Der Bonus für den Großhändler ist gebucht. Aber jetzt hat Nolte ${e(S.skontoBrutto)} zu wenig überwiesen!`,
        },
        { figur: 'jana', ausdruck: 'freut', text: 'Zu wenig? Lies mal den Verwendungszweck.' },
      ],
      frage: 'Ist das Geld verloren – und wie bucht man den Zahlungseingang?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Erinnerst du dich an den Handwerker, der bei schneller Zahlung etwas nachlässt? Diesmal sind wir der Handwerker.',
        },
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: 'Für uns ist das ein Nachlass auf den Verkaufspreis. Er mindert unseren Umsatz.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage:
        'Beim Einkauf haben wir die Vorsteuer korrigiert. Welche Steuer wird beim Verkauf korrigiert?',
      optionen: [
        { text: 'Auch die Vorsteuer' },
        { text: 'Die Umsatzsteuer', richtig: true },
        { text: 'Gar keine – Skonto ist steuerfrei' },
      ],
      aufloesung:
        'Beim Verkauf hat die MBG Umsatzsteuer berechnet und schuldet sie dem Finanzamt. Weil der Kunde weniger zahlt, schulden wir auch weniger Umsatzsteuer: Das Konto Umsatzsteuer wird im Soll vermindert.',
    },
    {
      typ: 'konzept',
      titel: 'Das Spiegelbild zum Einkauf',
      text: `Der Kunde zieht ${SATZ} vom Rechnungsbetrag ab. Darin stecken ein Nettoanteil, der unseren Erlös mindert, und ein Steueranteil, den wir weniger an das Finanzamt abführen.`,
      visual: {
        typ: 'brutto-netto',
        brutto: BEISPIEL.betrag,
        ustSatz: BEISPIEL.ustSatz,
        skontoSatz: BEISPIEL.skontoSatz,
      },
    },
    {
      typ: 'wer-hat-recht',
      frage: `Wohin mit den ${e(S.skontoBrutto)}?`,
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: `Ganz einfach: ${e(S.skontoBrutto)} auf Erlösberichtigungen. Damit ist die Sache erledigt.`,
      },
      b: {
        figur: 'jana',
        ausdruck: 'gruebelt',
        text: 'Erledigt ist sie erst, wenn auch die Umsatzsteuer stimmt.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Umsatzsteuer schulden wir nur auf das Entgelt, das wir wirklich bekommen haben.',
          richtig: true,
        },
        { text: 'Erlösberichtigungen darf man nur für Rücksendungen verwenden.' },
        { text: 'Skonto muss immer auf das Konto Bank gebucht werden.' },
      ],
      aufloesung: `Tobias’ Weg ist die Bruttomethode – aber nur zur Hälfte. Wer den ganzen Skonto auf Erlösberichtigungen bucht, muss später noch „Umsatzsteuer an Erlösberichtigungen ${e(S.steuer)}“ nachholen. Bei der Nettomethode wird gleich richtig zerlegt.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Schritt für Schritt (Nettomethode)',
      text: `Rechnung ${e(S.rechnung)}, der Kunde zahlt mit ${SATZ} Skonto auf unser Bankkonto.`,
      schritte: [
        {
          text: 'Skonto brutto berechnen',
          rechnung: `${e(S.rechnung)} × ${SATZ} = ${e(S.skontoBrutto)}`,
          warum:
            'Der Kunde zieht den Skonto vom Betrag ab, den wir ihm in Rechnung gestellt haben.',
        },
        {
          text: 'Skonto netto herausrechnen',
          rechnung: `${e(S.skontoBrutto)} ÷ 1,19 = ${e(S.skontoNetto)}`,
          warum: 'Um diesen Betrag sinkt unser Umsatz – das zeigt das Konto Erlösberichtigungen.',
        },
        {
          text: 'Umsatzsteuerkorrektur',
          rechnung: `${e(S.skontoBrutto)} − ${e(S.skontoNetto)} = ${e(S.steuer)}`,
          warum: 'So viel Umsatzsteuer schulden wir dem Finanzamt jetzt weniger.',
        },
        {
          text: 'Zahlungseingang',
          rechnung: `${e(S.rechnung)} − ${e(S.skontoBrutto)} = ${e(S.zahlbetrag)}`,
          warum: 'Das ist der Betrag, der auf dem Kontoauszug steht.',
        },
        {
          text: 'Buchungssatz',
          rechnung: `Bank ${e(S.zahlbetrag)}, Erlösberichtigungen ${e(S.skontoNetto)}, Umsatzsteuer ${e(S.steuer)} an Forderungen a. LL ${e(S.rechnung)}`,
          warum:
            'Die Forderung ist in voller Höhe erledigt (Haben). Im Soll: das Geld, der Nachlass auf den Umsatz und die geringere Steuerschuld.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Soll oder Haben?',
      text: 'Ordne die Teile der Buchung (Nettomethode) der richtigen Seite zu.',
      kategorien: ['Soll', 'Haben'],
      elemente: [
        {
          text: `Bank ${e(S.zahlbetrag)}`,
          kategorie: 'Soll',
          erklaerung: 'Das Bankguthaben nimmt zu.',
        },
        {
          text: `Erlösberichtigungen ${e(S.skontoNetto)}`,
          kategorie: 'Soll',
          erklaerung: 'Erlösberichtigungen mindern die Umsatzerlöse – daher Soll.',
        },
        {
          text: `Umsatzsteuer ${e(S.steuer)}`,
          kategorie: 'Soll',
          erklaerung: 'Die Steuerschuld sinkt; ein Passivkonto nimmt im Soll ab.',
        },
        {
          text: `Forderungen a. LL ${e(S.rechnung)}`,
          kategorie: 'Haben',
          erklaerung: 'Die Forderung an den Kunden ist erledigt.',
        },
      ],
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Diesmal kennst du nur den Zahlungseingang. Rechnungsbetrag und Skonto brutto stehen schon da – ergänze Skonto netto und die Umsatzsteuerkorrektur.',
      skillId: 'D4-skonto-verkauf',
      seed: 6,
      variant: 'netto-methode',
      partId: 'rechnung',
      gefragt: ['skonto-netto', 'steuer'],
    },
    {
      typ: 'merksatz',
      id: 'D4-m1',
      frage: 'Wie wird Kundenskonto gebucht (Netto- und Bruttomethode)?',
      text: 'Kundenskonto mindert den Umsatz: Skonto netto auf Erlösberichtigungen, Steueranteil auf Umsatzsteuer – beides im Soll. Bruttomethode: erst brutto auf Erlösberichtigungen, später „Umsatzsteuer an Erlösberichtigungen“.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe:
        'Bilden Sie die Buchungssätze nach der Bruttomethode: Zahlungseingang und Steuerkorrektur am Monatsende.',
      part: {
        skillId: 'D4-skonto-verkauf',
        seed: 20,
        variant: 'brutto-methode',
        partId: 'buchung',
      },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Für das Landhotel hab ich übrigens „Lieferung frei Haus“ zugesagt. Wer bezahlt eigentlich die Spedition?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Ein Kunde zahlt eine Rechnung über 1.190 € (inkl. 19 % USt) mit 2 % Skonto. Wie viel wird auf Erlösberichtigungen gebucht (Nettomethode)?',
      optionen: [{ text: '20,00 €', richtig: true }, { text: '23,80 €' }, { text: '3,80 €' }],
    },
    {
      frage: 'Welches Steuerkonto korrigiert der Kundenskonto?',
      optionen: [
        { text: 'Umsatzsteuer, im Soll', richtig: true },
        { text: 'Vorsteuer, im Haben' },
        { text: 'Umsatzsteuer, im Haben' },
      ],
    },
    {
      frage: 'Bruttomethode: Wie lautet die Korrekturbuchung am Monatsende?',
      optionen: [
        { text: 'Umsatzsteuer an Erlösberichtigungen', richtig: true },
        { text: 'Erlösberichtigungen an Umsatzsteuer' },
        { text: 'Vorsteuer an Erlösberichtigungen' },
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
      'Buchung nach 04-fachregeln.md (GC-03, Abschnitt 6: Bruttomethode Kundenskonto); Zahlen aus der Engine; 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
