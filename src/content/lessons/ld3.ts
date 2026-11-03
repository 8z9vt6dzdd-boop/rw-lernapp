// Lektion D3 – Erlösberichtigungen: Mängelrüge, Bonus, Kulanz (eigene Formulierung; BA 3.2.2,
// 04-fachregeln.md Konventionen 4 und 5). Alle Beträge rechnet die Engine.
import { formatEuro, formatProzent, type Val } from '../../engine/money';
import {
  solveErloesberichtigung,
  type ErloesberichtigungParams,
} from '../../engine/generators/d/erloesberichtigung';
import { ausNetto } from '../../engine/generators/d/gemeinsam';
import type { Lektion } from './types';

const MAENGEL: ErloesberichtigungParams = {
  fall: 'nachlass',
  anlass: 'maengelruege',
  gegeben: 'prozent-netto',
  betrag: '8000',
  satz: '0.1',
  methode: 'netto',
  ausgleich: 'forderung',
  umsatzerloese: '0',
  erloesberichtigungen: '0',
  ustSatz: '0.19',
  kunde: 'Landhotel Kerkhoff GmbH (Bad Driburg)',
  produkt: '„Paderquell Energy“',
};
const S = solveErloesberichtigung(MAENGEL);
const BONUS = solveErloesberichtigung({
  ...MAENGEL,
  anlass: 'bonus',
  betrag: '150000',
  satz: '0.03',
  ausgleich: 'bank',
});
const VERKAUF = ausNetto(MAENGEL.betrag, MAENGEL.ustSatz);
const e = (v: Val | string) => formatEuro(v);
const P = formatProzent(MAENGEL.satz);

export const lektionD3: Lektion = {
  id: 'D3',
  skillId: 'D3-erloesberichtigung',
  abschnitt: 'D',
  titel: 'Die Ware bleibt, der Preis sinkt: Erlösberichtigungen',
  kernAha:
    'Behält der Kunde die Ware und zahlt trotzdem weniger (Mängelrüge, Bonus, Kulanz), kommt der Nachlass netto auf Erlösberichtigungen und die Umsatzsteuer wird korrigiert. Erlösberichtigungen werden über die Umsatzerlöse abgeschlossen.',
  dauerMin: 7,
  figuren: ['tobias', 'jana', 'leni'],
  ort: 'buero',
  quelle: 'BA 3.2.2 (Abb. 69/70), 3.2.3; 04-fachregeln.md (Konventionen 4 und 5)',
  teaser: {
    figur: 'tobias',
    ausdruck: 'freut',
    text: 'Ich hab dem Landhotel 10 % Nachlass versprochen. Und Nolte bekommt seinen Jahresbonus.',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: `Das Landhotel behält die Dosen mit Dellen. Ich hab ${P} Nachlass auf die ${e(MAENGEL.betrag)} versprochen.`,
        },
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: 'Und Nolte wartet auf seinen Jahresbonus. Zwei Gutschriften, aber keine Rücksendung.',
        },
      ],
      frage: 'Die Ware bleibt beim Kunden, nur der Preis wird kleiner. Wie bucht man das?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Wie beim Pullover mit kleinem Fleck: Du behältst ihn, und der Laden gibt dir zehn Prozent zurück.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Der Verkauf bleibt also bestehen. Nur der Preis wird nachträglich gesenkt.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Rücksendung oder Nachlass?',
      kategorien: ['Rücksendung (Storno)', 'Nachlass (Erlösberichtigungen)'],
      elemente: [
        {
          text: 'Ein Kunde schickt eine falsch gelieferte Sorte zurück.',
          kategorie: 'Rücksendung (Storno)',
        },
        {
          text: 'Mängelrüge: Der Kunde behält die verbeulten Dosen und bekommt 10 % gutgeschrieben.',
          kategorie: 'Nachlass (Erlösberichtigungen)',
        },
        {
          text: 'Ein Großhändler erhält 3 % Bonus auf seinen Jahresumsatz.',
          kategorie: 'Nachlass (Erlösberichtigungen)',
          erklaerung: 'Ein Bonus ist ein nachträglicher Preisnachlass für bereits gelieferte Ware.',
        },
        {
          text: 'Wegen einer Überlieferung gehen zwei Paletten an die MBG zurück.',
          kategorie: 'Rücksendung (Storno)',
        },
        {
          text: 'Aus Kulanz wegen verspäteter Lieferung gibt es 200 € Gutschrift.',
          kategorie: 'Nachlass (Erlösberichtigungen)',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Nachlass ${P} auf ${e(MAENGEL.betrag)} netto. Wie hoch ist die Gutschrift, die das Landhotel bekommt?`,
      optionen: [
        { text: e(S.netto) },
        { text: e(S.brutto), richtig: true },
        { text: e(S.netto.minus(S.ust)) },
      ],
      aufloesung: `Das Hotel hat brutto bezahlt bzw. schuldet brutto, also bekommt es auch brutto gutgeschrieben: ${e(S.netto)} Nachlass plus ${e(S.ust)} Umsatzsteuer = ${e(S.brutto)}. Die MBG schuldet dem Finanzamt dafür ${e(S.ust)} weniger.`,
    },
    {
      typ: 'konzept',
      titel: 'Ein Unterkonto für Nachlässe',
      text: 'Erlösberichtigungen sind ein Unterkonto der Umsatzerlöse und stehen im Soll. So bleibt sichtbar, was verkauft und was nachträglich nachgelassen wurde.',
      visual: {
        typ: 'tkonten',
        konten: [
          {
            name: 'Erlösberichtigungen',
            soll: [{ text: 'Mängelrüge', betrag: S.netto.value.toString(), neu: true }],
            haben: [],
          },
          {
            name: 'Umsatzsteuer',
            soll: [{ text: 'Mängelrüge', betrag: S.ust.value.toString(), neu: true }],
            haben: [{ text: 'Verkauf', betrag: VERKAUF.ust.value.toString() }],
          },
          {
            name: 'Forderungen a. LL',
            soll: [{ text: 'Verkauf', betrag: VERKAUF.brutto.value.toString() }],
            haben: [{ text: 'Gutschrift', betrag: S.brutto.value.toString(), neu: true }],
          },
        ],
      },
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Ist diese Buchung vollständig?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: `Erlösberichtigungen ${e(S.brutto)} an Forderungen ${e(S.brutto)}. Fertig!`,
      },
      b: {
        figur: 'jana',
        ausdruck: 'gruebelt',
        text: 'So darf man anfangen. Aber die Umsatzsteuer muss danach noch korrigiert werden.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: `Bei der Bruttomethode folgt später „Umsatzsteuer an Erlösberichtigungen ${e(S.ust)}“.`,
          richtig: true,
        },
        { text: 'Nachlässe dürfen nie brutto gebucht werden.' },
        { text: 'Die Steuer wird bei Nachlässen über Vorsteuer korrigiert.' },
      ],
      aufloesung: `Tobias’ Satz ist der erste Schritt der Bruttomethode. Bei der Nettomethode zerlegt man sofort: Erlösberichtigungen ${e(S.netto)}, Umsatzsteuer ${e(S.ust)} an Forderungen ${e(S.brutto)}. Beide Wege führen zum selben Ergebnis.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Beide Methoden nebeneinander',
      schritte: [
        {
          text: 'Nachlass netto',
          rechnung: `${e(MAENGEL.betrag)} × ${P} = ${e(S.netto)}`,
          warum: 'Der Prozentsatz bezieht sich hier auf den Nettowert der Lieferung.',
        },
        {
          text: 'Umsatzsteuer und Gutschrift',
          rechnung: `${e(S.netto)} × 19 % = ${e(S.ust)}; Gutschrift ${e(S.brutto)}`,
          warum: 'Mit dem Entgelt sinkt auch die geschuldete Umsatzsteuer.',
        },
        {
          text: 'Nettomethode',
          rechnung: `Erlösberichtigungen ${e(S.netto)}, Umsatzsteuer ${e(S.ust)} an Forderungen a. LL ${e(S.brutto)}`,
          warum: 'Die Steuer wird sofort korrigiert.',
        },
        {
          text: 'Bruttomethode',
          rechnung: `1. Erlösberichtigungen ${e(S.brutto)} an Forderungen a. LL ${e(S.brutto)}; 2. Umsatzsteuer an Erlösberichtigungen ${e(S.ust)}`,
          warum:
            'Erst brutto erfassen, die Steuer später gesammelt herausrechnen. Die beiden Sätze bleiben getrennt.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Der Jahresbonus für Nolte',
      text: `Nolte bekommt 3 % Bonus auf 150.000 € Jahresumsatz, die MBG überweist ihn. Eine Zeile ist falsch.`,
      zeilen: [
        `Soll: Erlösberichtigungen ${e(BONUS.netto)}`,
        `Soll: Vorsteuer ${e(BONUS.ust)}`,
        `Haben: Bank ${e(BONUS.brutto)}`,
      ],
      fehlerZeile: 1,
      gruende: [
        {
          text: 'Beim Verkauf wird immer die Umsatzsteuer korrigiert, nicht die Vorsteuer.',
          richtig: true,
        },
        { text: 'Ein Bonus wird auf Umsatzerlöse gebucht.' },
        { text: 'Die Bank müsste im Soll stehen.' },
      ],
      aufloesung: `Die MBG hat Umsatzsteuer berechnet und schuldet jetzt weniger davon: Umsatzsteuer ${e(BONUS.ust)} im Soll. Vorsteuer betrifft nur Einkäufe.`,
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Eine neue Mängelrüge mit Prozentsatz. Ergänze den Nettonachlass und die Umsatzsteuerkorrektur.',
      skillId: 'D3-erloesberichtigung',
      seed: 4,
      variant: 'maengelruege',
      partId: 'rechnung',
      gefragt: ['netto', 'ust'],
    },
    {
      typ: 'verstaendnis',
      frage:
        'Am 31.12. stehen auf Erlösberichtigungen 18.500 € im Soll. Wie wird das Konto abgeschlossen?',
      optionen: [
        {
          text: 'Umsatzerlöse an Erlösberichtigungen',
          richtig: true,
          erklaerung:
            'Richtig. Das Unterkonto wird über sein Hauptkonto abgeschlossen; in die GuV gehen nur die Umsatzerlöse nach Abzug der Nachlässe.',
        },
        {
          text: 'GuV an Erlösberichtigungen',
          erklaerung:
            'Dann stünden Nachlässe als eigener Posten in der GuV. Erlösberichtigungen werden über Umsatzerlöse abgeschlossen.',
        },
        {
          text: 'Erlösberichtigungen an Umsatzerlöse',
          erklaerung: 'Der Saldo steht im Soll; zum Abschluss wird er im Haben ausgeglichen.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'D3-m1',
      frage: 'Wie bucht man einen nachträglichen Nachlass an einen Kunden?',
      text: 'Mängelrüge, Bonus, Kulanz: Erlösberichtigungen (netto) und Umsatzsteuer an Forderungen a. LL bzw. Bank. Bruttomethode: erst brutto, später Umsatzsteuer an Erlösberichtigungen. Abschluss: Umsatzerlöse an Erlösberichtigungen.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe: 'Bilden Sie den Buchungssatz für die Bonusgutschrift.',
      part: { skillId: 'D3-erloesberichtigung', seed: 3, variant: 'bonus', partId: 'buchung' },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'ueberrascht',
        text: 'Moment, Nolte hat gerade überwiesen – aber weniger, als auf unserer Rechnung steht!',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Mängelrüge: 5 % Nachlass auf 4.000 € netto (19 % USt). Buchung nach der Nettomethode?',
      optionen: [
        {
          text: 'Erlösberichtigungen 200 €, Umsatzsteuer 38 € an Forderungen a. LL 238 €',
          richtig: true,
        },
        { text: 'Umsatzerlöse 200 €, Umsatzsteuer 38 € an Forderungen a. LL 238 €' },
        { text: 'Erlösberichtigungen 238 € an Umsatzsteuer 238 €' },
      ],
    },
    {
      frage: 'Wohin wird das Konto Erlösberichtigungen abgeschlossen?',
      optionen: [
        { text: 'Über Umsatzerlöse', richtig: true },
        { text: 'Über die GuV' },
        { text: 'Über das Schlussbilanzkonto' },
      ],
    },
    {
      frage: 'Ein Kunde behält mangelhafte Ware und bekommt 10 % gutgeschrieben. Was liegt vor?',
      optionen: [
        { text: 'Ein Nachlass – Erlösberichtigungen', richtig: true },
        { text: 'Eine Rücksendung – Storno auf Umsatzerlöse' },
        { text: 'Ein Skontoabzug' },
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
      'BA 3.2.2 (Netto-/Bruttomethode, Abschluss über Umsatzerlöse), Abb. 73 (Korrektur Umsatzsteuer); Zahlen aus der Engine; 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
