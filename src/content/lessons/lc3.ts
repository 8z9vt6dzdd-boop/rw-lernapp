// Lektion C3 – Rücksendungen an den Lieferer als Stornobuchung
// (eigene Formulierung und eigene Zahlen; geprüft gegen BA 3.1.3 und 3.1.5; Buchungsregel nach
// 04-fachregeln.md, Konvention 5 und GC-06; docs/m7/c1.md GC-C3-02/04). Alle Beträge rechnet die Engine.
import { solveC1 } from '../../engine/generators/c1/c1-bestand-vs-aufwand';
import { solveC3, type C3Params } from '../../engine/generators/c1/c3-ruecksendung';
import { formatEuro, type Val } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value);
const BASIS: C3Params = {
  variante: 'anteil',
  erfassung: 'bestand',
  stoff: 'Hilfsstoffe',
  gegenstand: 'Etiketten',
  einheit: 'Rollen',
  partner: 'Etikettendruck Schlüter & Söhne (Detmold)',
  ustSatz: '0.19',
  netto: '800',
  brutto: '0',
  menge: 400,
  zurueck: 100,
  preis: '45',
  listenpreis: '0',
  rabatt: '0',
  grund: 'weil der Druck verschmiert ist',
  vorlage: 0,
};
const RS = solveC3(BASIS);
const EINKAUF = solveC1({
  variante: 'einkauf',
  erfassung: 'bestand',
  stoff: 'Hilfsstoffe',
  gegenstand: 'Etiketten',
  partner: BASIS.partner,
  ustSatz: '0.19',
  netto: String(BASIS.menge * Number(BASIS.preis)),
  ab: '0',
  zugaenge: [],
  entnahmen: [],
  sb: '0',
  vorlage: 0,
});
const JIT = solveC3({ ...BASIS, variante: 'aufwand', erfassung: 'aufwand' });

export const lektionC3: Lektion = {
  id: 'C3',
  skillId: 'C3-ruecksendung-einkauf',
  abschnitt: 'C',
  titel: 'Zurück an den Absender',
  kernAha:
    'Eine Rücksendung macht den Einkauf für die zurückgeschickte Ware ungeschehen: Die Einkaufsbuchung wird mit vertauschten Seiten wiederholt (Storno) – zurück auf das Stoffkonto und auf die Vorsteuer, nicht auf ein Nachlasskonto.',
  dauerMin: 7,
  figuren: ['jana', 'tobias', 'leni'],
  ort: 'lager',
  quelle:
    'BA 3.1.3 (Rückbuchung auf dem Bestandskonto, Vorsteuerkorrektur), 3.1.5; 04-fachregeln.md (Konvention 5, GC-06)',
  teaser: {
    figur: 'jana',
    ausdruck: 'entsetzt',
    text: 'Ein Viertel der neuen Etiketten ist verschmiert. Die gehen zurück – aber wie buchen wir das?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'lager',
      visual: {
        typ: 'beleg',
        absender: BASIS.partner,
        nummer: '2026-0447',
        datum: '06.02.',
        zeilen: [
          {
            text: `Etiketten Senne Lemon, ${BASIS.menge} Rollen à ${formatEuro(BASIS.preis)}`,
            betrag: EINKAUF.rechnung.minus(EINKAUF.vorsteuer).value.toString(),
          },
          { text: 'zzgl. 19 % Umsatzsteuer', betrag: EINKAUF.vorsteuer.value.toString() },
          { text: 'Rechnungsbetrag', betrag: EINKAUF.rechnung.value.toString(), fett: true },
        ],
        fuss: 'Gebucht: Hilfsstoffe an Verbindlichkeiten a. LL (mit Vorsteuer).',
      },
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'entsetzt',
          text: `${BASIS.zurueck} Rollen sind verschmiert, die schicken wir zurück.`,
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Kein Problem, dann buchen wir einfach einen Nachlass!',
        },
      ],
      frage: 'Ist eine Rücksendung ein Nachlass – oder etwas ganz anderes?',
    },
    {
      typ: 'dialog',
      ort: 'lager',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Schickst du einen Pullover an den Onlineshop zurück, ist dieser Kauf erledigt. Du bekommst den ganzen Preis zurück, die Mehrwertsteuer inklusive.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'In der Buchhaltung nennt man das Storno: Die Einkaufsbuchung läuft für die zurückgeschickte Menge rückwärts.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Von ${BASIS.menge} Rollen gehen ${BASIS.zurueck} zurück. Was passiert mit der Vorsteuer aus der Rechnung?`,
      optionen: [
        { text: 'Sie bleibt, die Rechnung ist ja schon gebucht.' },
        { text: `Sie sinkt um ${e(RS.vorsteuer)}.`, richtig: true },
        { text: `Sie sinkt um ${e(RS.netto)}.` },
      ],
      aufloesung: `Für die zurückgeschickten Rollen schuldet die MBG kein Entgelt mehr – also gibt es dafür auch keine Vorsteuer: ${e(RS.netto)} × 19 % = ${e(RS.vorsteuer)}.`,
    },
    {
      typ: 'konzept',
      titel: 'Die Buchung läuft rückwärts',
      text: 'Beim Einkauf standen Hilfsstoffe und Vorsteuer im Soll, die Verbindlichkeit im Haben. Bei der Rücksendung tauschen genau diese Konten die Seiten – nur mit dem Betrag der zurückgeschickten Ware.',
      visual: {
        typ: 'tkonten',
        konten: [
          {
            name: 'Hilfsstoffe',
            soll: [
              {
                text: 'Einkauf',
                betrag: EINKAUF.rechnung.minus(EINKAUF.vorsteuer).value.toString(),
              },
            ],
            haben: [{ text: 'Rücksendung', betrag: RS.netto.value.toString(), neu: true }],
          },
          {
            name: 'Vorsteuer',
            soll: [{ text: 'Einkauf', betrag: EINKAUF.vorsteuer.value.toString() }],
            haben: [{ text: 'Rücksendung', betrag: RS.vorsteuer.value.toString(), neu: true }],
          },
          {
            name: 'Verbindlichkeiten a. LL',
            soll: [{ text: 'Rücksendung', betrag: RS.gutschrift.value.toString(), neu: true }],
            haben: [{ text: 'Einkauf', betrag: EINKAUF.rechnung.value.toString() }],
          },
        ],
      },
    },
    {
      typ: 'erkunden',
      titel: 'Was bleibt auf dem Konto?',
      text: 'Buche Einkauf und Rücksendung auf das Konto Hilfsstoffe.',
      erkunden: {
        art: 'tkonto-buchen',
        konto: 'Hilfsstoffe',
        vorgaenge: [
          {
            text: `Einkauf ${BASIS.menge} Rollen Etiketten`,
            betrag: EINKAUF.rechnung.minus(EINKAUF.vorsteuer).value.toString(),
            seite: 'soll',
          },
          {
            text: `Rücksendung ${BASIS.zurueck} Rollen`,
            betrag: RS.netto.value.toString(),
            seite: 'haben',
          },
        ],
      },
      fazit: `Saldo ${e(EINKAUF.rechnung.minus(EINKAUF.vorsteuer).minus(RS.netto))}: Auf dem Konto stehen genau die ${BASIS.menge - BASIS.zurueck} Rollen, die wirklich im Lager liegen.`,
    },
    {
      typ: 'wer-hat-recht',
      frage: `Wohin mit den ${e(RS.netto)} netto?`,
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Auf „Nachlässe für Hilfsstoffe“. Wir bekommen ja Geld gutgeschrieben.',
      },
      b: {
        figur: 'jana',
        ausdruck: 'gruebelt',
        text: 'Direkt auf „Hilfsstoffe“ im Haben. Die Rollen sind ja nicht mehr da.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Die Ware verlässt das Lager – also wird der Bestand selbst korrigiert (Storno).',
          richtig: true,
        },
        { text: 'Nachlasskonten gibt es nur beim Verkauf.' },
        { text: 'Gutschriften werden immer auf das Stoffkonto gebucht.' },
      ],
      aufloesung:
        'Das Nachlasskonto ist für Fälle, in denen die Ware bleibt und nur der Preis sinkt. Bei einer Rücksendung geht die Ware weg – deshalb wird zurückgebucht, wo der Einkauf gebucht wurde.',
    },
    {
      typ: 'vorgerechnet',
      titel: 'Die Gutschrift Schritt für Schritt',
      text: `${BASIS.zurueck} Rollen à ${formatEuro(BASIS.preis)} netto gehen zurück.`,
      schritte: [
        {
          text: 'Warenwert der Rücksendung',
          rechnung: `${BASIS.zurueck} × ${formatEuro(BASIS.preis)} = ${e(RS.netto)}`,
          warum: 'Zurückgebucht wird der Wert, mit dem die Ware eingebucht wurde.',
        },
        {
          text: 'Vorsteuerkorrektur',
          rechnung: `${e(RS.netto)} × 19 % = ${e(RS.vorsteuer)}`,
          warum: 'Für Ware, die zurückgeht, gibt es keine Vorsteuer.',
        },
        {
          text: 'Gutschrift',
          rechnung: `${e(RS.netto)} + ${e(RS.vorsteuer)} = ${e(RS.gutschrift)}`,
          warum: 'Um diesen Betrag sinkt die Schuld beim Lieferer.',
        },
        {
          text: 'Stornobuchung',
          rechnung: `Verbindlichkeiten a. LL ${e(RS.gutschrift)} an Hilfsstoffe ${e(RS.netto)}, an Vorsteuer ${e(RS.vorsteuer)}`,
          warum: 'Die Einkaufsbuchung mit vertauschten Seiten.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Eine Just-in-time-Lieferung',
      text: `Diese Etiketten hatte die MBG aufwandsorientiert erfasst (direkt in die Produktion). Ware für ${e(JIT.netto)} netto geht zurück. Welche Zeile ist falsch?`,
      zeilen: [
        `Soll: Verbindlichkeiten a. LL ${e(JIT.gutschrift)}`,
        `Haben: Hilfsstoffe ${e(JIT.netto)}`,
        `Haben: Vorsteuer ${e(JIT.vorsteuer)}`,
      ],
      fehlerZeile: 1,
      gruende: [
        {
          text: 'Zurückgebucht wird dort, wo der Einkauf steht – hier auf Aufwendungen für Hilfsstoffe.',
          richtig: true,
        },
        { text: 'Die Vorsteuer darf bei Rücksendungen nicht korrigiert werden.' },
        { text: `Die Verbindlichkeit sinkt nur um ${e(JIT.netto)}.` },
      ],
      aufloesung: `Richtig: Verbindlichkeiten a. LL ${e(JIT.gutschrift)} an Aufwendungen für Hilfsstoffe ${e(JIT.netto)}, an Vorsteuer ${e(JIT.vorsteuer)}. Rücksendungen folgen immer dem Konto, auf dem eingekauft wurde.`,
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Diesmal kennst du nur die Gutschrift brutto. Zerlege sie in Warenwert und Vorsteuerkorrektur.',
      skillId: 'C3-ruecksendung-einkauf',
      seed: 2,
      variant: 'brutto',
      partId: 'rechnung',
      gefragt: ['netto', 'vorsteuer'],
    },
    {
      typ: 'merksatz',
      id: 'C3-m1',
      frage: 'Wie wird eine Rücksendung an den Lieferer gebucht?',
      text: 'Rücksendung = Storno: Verbindlichkeiten a. LL an Stoffkonto (netto) und an Vorsteuer. Zurückgebucht wird auf das Konto, auf dem der Einkauf steht – nie auf ein Nachlasskonto.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe: 'Bilden Sie den Buchungssatz für die Rücksendung an den Lieferer.',
      part: { skillId: 'C3-ruecksendung-einkauf', seed: 6, variant: 'netto', partId: 'buchung' },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Bei den Aromen hat Tewes auch gepatzt. Wir behalten sie aber, wenn er uns 10 % nachlässt – jetzt ist es doch ein Nachlass, oder?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Rücksendung von Rohstoffen, netto 2.000 € (19 % USt). Welcher Buchungssatz stimmt?',
      optionen: [
        {
          text: 'Verbindlichkeiten a. LL 2.380 € an Rohstoffe 2.000 €, an Vorsteuer 380 €',
          richtig: true,
        },
        {
          text: 'Verbindlichkeiten a. LL 2.380 € an Nachlässe für Rohstoffe 2.000 €, an Vorsteuer 380 €',
        },
        { text: 'Verbindlichkeiten a. LL 2.000 € an Rohstoffe 2.000 €' },
      ],
    },
    {
      frage:
        'Gutschrift für zurückgesandte Hilfsstoffe: 1.190 € brutto. Wie hoch ist die Vorsteuerkorrektur?',
      optionen: [{ text: '190,00 €', richtig: true }, { text: '226,10 €' }, { text: '0,00 €' }],
    },
    {
      frage:
        'Der Einkauf wurde aufwandsorientiert erfasst. Wo wird die Rücksendung im Haben gebucht?',
      optionen: [
        { text: 'Auf dem Aufwandskonto, z. B. Aufwendungen für Rohstoffe', richtig: true },
        { text: 'Auf dem Bestandskonto Rohstoffe' },
        { text: 'Auf Erlösberichtigungen' },
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
      'Gegen BA 3.1.3 (Rückbuchung auf dem Bestandskonto mit Vorsteuerkorrektur) und 3.1.5 (Rücksendungen bei verbrauchsorientierter Erfassung auf dem Aufwandskonto) geprüft; 04-fachregeln.md Konvention 5; Zahlen aus der Engine; 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
