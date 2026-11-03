// Lektion D2 – Rücksendungen von Kunden (eigene Formulierung; Stornobuchung nach BA 3.2.1 und
// 04-fachregeln.md, Konvention 5). Alle Beträge rechnet die Engine.
import { formatEuro, formatProzent, type Val } from '../../engine/money';
import {
  solveRuecksendung,
  type RuecksendungParams,
} from '../../engine/generators/d/ruecksendung-verkauf';
import { solveVerkauf } from '../../engine/generators/d/verkauf';
import type { Lektion } from './types';

const RABATT = '0.2';
// Ursprüngliche Lieferung an Nolte (eigene Zahlen)
const VERKAUF = solveVerkauf({
  art: 'erzeugnisse',
  produkt: '„Paderquell Energy“',
  kunde: 'Gastro-Großhandel Nolte KG (Bielefeld)',
  listenpreis: '25000',
  rabattSatz: RABATT,
  ustSatz: '0.19',
  zahlung: 'ziel',
  vorlage: 0,
});
const RUECK: RuecksendungParams = {
  art: 'erzeugnisse',
  produkt: '„Paderquell Energy“',
  kunde: 'Gastro-Großhandel Nolte KG (Bielefeld)',
  gegeben: 'liste',
  betrag: '6000',
  rabattSatz: RABATT,
  anteil: '1',
  grund: 0,
  ustSatz: '0.19',
  ausgleich: 'forderung',
  vorlage: 0,
};
const S = solveRuecksendung(RUECK);
const SB = solveRuecksendung({ ...RUECK, ausgleich: 'bank' });
const e = (v: Val | string) => formatEuro(v);
const R = formatProzent(RABATT);

export const lektionD2: Lektion = {
  id: 'D2',
  skillId: 'D2-ruecksendung-verkauf',
  abschnitt: 'D',
  titel: 'Zurück an Absender: Rücksendungen von Kunden',
  kernAha:
    'Eine Rücksendung macht den Verkauf rückgängig: Man bucht ihn mit vertauschten Seiten – Umsatzerlöse und Umsatzsteuer im Soll, Forderungen (oder Bank) im Haben. Erlösberichtigungen sind hier fehl am Platz.',
  dauerMin: 6,
  figuren: ['tobias', 'jana', 'leni'],
  ort: 'lager',
  quelle: 'BA 3.2.1; 04-fachregeln.md (Konvention 5)',
  teaser: {
    figur: 'tobias',
    ausdruck: 'entsetzt',
    text: 'Nolte schickt verbeulte Dosen zurück. Was mache ich jetzt mit der Rechnung?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'lager',
      visual: {
        typ: 'lager',
        titel: 'Wareneingang: Rücksendung von Nolte',
        regal: [
          { name: 'Paderquell Energy (zurück)', paletten: 3, farbe: '#e8792b' },
          { name: 'Paderquell Energy (Lager)', paletten: 6, farbe: '#1c6670' },
        ],
      },
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'entsetzt',
          text: `Nolte schickt Dosen für ${e(RUECK.betrag)} Listenpreis zurück. Die Rechnung ist doch längst gebucht!`,
        },
        {
          figur: 'jana',
          ausdruck: 'freut',
          text: 'Kein Drama. Wir drehen die Buchung für diesen Teil einfach um.',
        },
      ],
      frage: 'Was heißt „die Buchung umdrehen“ – und mit welchem Betrag?',
    },
    {
      typ: 'dialog',
      ort: 'lager',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Kennst du vom Onlineshop: Du schickst die Schuhe zurück und bekommst den Kaufpreis gutgeschrieben. Als hätte es diesen Kauf nie gegeben.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Für die MBG heißt das: Dieser Teil des Umsatzes ist nie entstanden. Man nennt das Storno.',
        },
      ],
    },
    {
      typ: 'erkunden',
      titel: 'Das Konto Umsatzerlöse',
      text: 'Trage beide Vorgänge auf der richtigen Seite ein.',
      erkunden: {
        art: 'tkonto-buchen',
        konto: 'Umsatzerlöse für eigene Erzeugnisse',
        vorgaenge: [
          {
            text: `Verkauf an Nolte (nach ${R} Rabatt)`,
            betrag: VERKAUF.netto.value.toString(),
            seite: 'haben',
          },
          {
            text: 'Rücksendung der verbeulten Dosen',
            betrag: S.netto.value.toString(),
            seite: 'soll',
          },
        ],
      },
      fazit: `Der Erlös steht im Haben, die Rücksendung im Soll. Übrig bleibt ein Umsatz von ${e(VERKAUF.netto.minus(S.netto))} – genau das, was Nolte wirklich behalten hat.`,
    },
    {
      typ: 'vorhersage',
      frage: `Die zurückgeschickten Dosen haben einen Listenpreis von ${e(RUECK.betrag)}. Nolte hatte ${R} Rabatt bekommen. Wie hoch ist die Gutschrift netto?`,
      optionen: [
        { text: e(RUECK.betrag) },
        { text: e(S.netto), richtig: true },
        { text: e(S.brutto) },
      ],
      aufloesung: `Gutgeschrieben wird, was Nolte für diese Dosen tatsächlich berechnet wurde: ${e(RUECK.betrag)} − ${R} = ${e(S.netto)}. Dazu kommt die Umsatzsteuer: ${e(S.ust)}.`,
    },
    {
      typ: 'konzept',
      titel: 'Storno ist ein Spiegelbild',
      text: 'Beim Verkauf: Forderungen an Umsatzerlöse und Umsatzsteuer. Bei der Rücksendung dieselben Konten mit vertauschten Seiten, nur mit dem Wert der zurückgeschickten Ware.',
      visual: {
        typ: 'tkonten',
        konten: [
          {
            name: 'Forderungen a. LL',
            soll: [{ text: 'Verkauf', betrag: VERKAUF.brutto.value.toString() }],
            haben: [{ text: 'Rücksendung', betrag: S.brutto.value.toString(), neu: true }],
          },
          {
            name: 'Umsatzerlöse',
            soll: [{ text: 'Rücksendung', betrag: S.netto.value.toString(), neu: true }],
            haben: [{ text: 'Verkauf', betrag: VERKAUF.netto.value.toString() }],
          },
          {
            name: 'Umsatzsteuer',
            soll: [{ text: 'Rücksendung', betrag: S.ust.value.toString(), neu: true }],
            haben: [{ text: 'Verkauf', betrag: VERKAUF.ust.value.toString() }],
          },
        ],
      },
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Welches Konto nimmt den Nettobetrag der Rücksendung auf?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Erlösberichtigungen! Der Umsatz wird doch berichtigt.',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Umsatzerlöse im Soll. Die Ware ist zurück, also wird der Verkauf storniert.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Erlösberichtigungen sind für Nachlässe, bei denen der Kunde die Ware behält – nicht für Rücksendungen.',
          richtig: true,
        },
        { text: 'Erlösberichtigungen gibt es nur bei Handelswaren.' },
        { text: 'Rücksendungen werden auf dem Konto Fertige Erzeugnisse gebucht.' },
      ],
      aufloesung:
        'Der Lehrbrief trennt sauber: Rücksendung = Storno auf Umsatzerlöse. Nachlass (Mängelrüge, Bonus, Kulanz) = Erlösberichtigungen. Auch Musterlösungen vermischen das manchmal – in der Klausur zählt die saubere Trennung.',
    },
    {
      typ: 'vorgerechnet',
      titel: 'Die Gutschrift für Nolte',
      schritte: [
        {
          text: 'Wert nach Rabatt',
          rechnung: `${e(RUECK.betrag)} − ${R} = ${e(S.netto)}`,
          warum: 'So viel hatte Nolte für diese Dosen netto bezahlen sollen.',
        },
        {
          text: 'Umsatzsteuerkorrektur',
          rechnung: `${e(S.netto)} × 19 % = ${e(S.ust)}`,
          warum: 'Für den stornierten Umsatz schuldet die MBG auch keine Steuer.',
        },
        {
          text: 'Buchungssatz',
          rechnung: `Umsatzerlöse ${e(S.netto)}, Umsatzsteuer ${e(S.ust)} an Forderungen a. LL ${e(S.brutto)}`,
          warum: 'Spiegelbild des Verkaufs: Die Forderung an Nolte sinkt um den Bruttobetrag.',
        },
      ],
    },
    {
      typ: 'verstaendnis',
      frage:
        'Nolte hatte die Rechnung schon bezahlt. Die MBG überweist die Gutschrift zurück. Was steht jetzt im Haben?',
      optionen: [
        {
          text: `Bank ${e(SB.brutto)}`,
          richtig: true,
          erklaerung:
            'Richtig. Die Forderung gibt es nicht mehr, also fließt das Geld vom Bankkonto zurück.',
        },
        {
          text: `Forderungen a. LL ${e(SB.brutto)}`,
          erklaerung:
            'Die Forderung wurde durch die Zahlung schon ausgeglichen. Jetzt verlässt Geld die Bank.',
        },
        {
          text: `Umsatzerlöse ${e(SB.netto)}`,
          erklaerung: 'Umsatzerlöse stehen bei der Rücksendung im Soll, nicht im Haben.',
        },
      ],
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Eine neue Rücksendung, wieder mit Rabatt. Ergänze den Nettowert und die Umsatzsteuerkorrektur.',
      skillId: 'D2-ruecksendung-verkauf',
      seed: 3,
      variant: 'rabatt',
      partId: 'rechnung',
      gefragt: ['netto', 'ust'],
    },
    {
      typ: 'merksatz',
      id: 'D2-m1',
      frage: 'Wie wird eine Rücksendung von Kunden gebucht?',
      text: 'Rücksendung = Storno: Umsatzerlöse (netto) und Umsatzsteuer an Forderungen a. LL (bzw. Bank). Gutgeschrieben wird der Wert nach Rabatt. Erlösberichtigungen nur für Nachlässe, bei denen die Ware beim Kunden bleibt.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe: 'Bilden Sie den Buchungssatz für die Rücksendung.',
      part: { skillId: 'D2-ruecksendung-verkauf', seed: 4, variant: 'brutto', partId: 'buchung' },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'gruebelt',
        text: 'Das Landhotel will seine verbeulten Dosen lieber behalten – gegen einen Preisnachlass. Ich hab schon Ja gesagt.',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Ein Kunde schickt Erzeugnisse im Nettowert von 1.000 € zurück (19 % USt). Wie lautet die Buchung?',
      optionen: [
        {
          text: 'Umsatzerlöse 1.000 €, Umsatzsteuer 190 € an Forderungen a. LL 1.190 €',
          richtig: true,
        },
        { text: 'Erlösberichtigungen 1.000 €, Umsatzsteuer 190 € an Forderungen a. LL 1.190 €' },
        { text: 'Fertige Erzeugnisse 1.000 €, Vorsteuer 190 € an Forderungen a. LL 1.190 €' },
      ],
    },
    {
      frage: 'Listenpreis der Rücksendung 2.000 €, ursprünglich 10 % Rabatt. Gutschrift netto?',
      optionen: [
        { text: '1.800,00 €', richtig: true },
        { text: '2.000,00 €' },
        { text: '2.142,00 €' },
      ],
    },
    {
      frage: 'Auf welcher Seite steht das Konto Umsatzsteuer bei einer Rücksendung vom Kunden?',
      optionen: [{ text: 'Soll', richtig: true }, { text: 'Haben' }, { text: 'Gar nicht' }],
    },
  ],
  checkliste: {
    raetsel: true,
    alltagVorFachbegriff: true,
    kernAhaErreicht: true,
    figurImDialog: true,
    klausurbrueckeUndCliffhanger: true,
    fachlichGeprueft:
      'BA 3.2.1 (Stornobuchung, Abb. 68) und 3.2.2 (Abgrenzung zu Nachlässen), 04-fachregeln.md Konvention 5; Zahlen aus der Engine; 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
