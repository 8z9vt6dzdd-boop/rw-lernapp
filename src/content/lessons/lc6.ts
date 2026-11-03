// Lektion C6 – Leihverpackung im Einkauf (eigene Formulierung; Buchungsregel nach 04-fachregeln.md,
// Abschnitt 2 Nr. 6, und docs/m7/c2.md, GC-C6). Alle Beträge werden von der Engine berechnet.
import { solveLeih, type LeihParams } from '../../engine/generators/c2/leihverpackung';
import { formatEuro, formatProzent, type Val } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: Val | string) => formatEuro(typeof v === 'string' ? v : v.value.toString());
const b = (v: Val) => v.value.toString();

// Beispiel der Lektion (= GC-C6): Dosen mit 20 Leihpaletten, 16 zurück, Gutschrift 75 %
const BEISPIEL: LeihParams = {
  variante: 'gesamt',
  stoff: 'Hilfsstoffe',
  gegenstand: 'Getränkedosen',
  verpackung: 'Mehrweg-Leihpaletten',
  partner: 'Dosenwerk Rüther KG (Bielefeld)',
  warenwert: '24000',
  anzahl: 20,
  preis: '15',
  zurueck: 16,
  gutschriftSatz: '0.75',
  ustSatz: '0.19',
  vorlage: 0,
};
const S = solveLeih(BEISPIEL);
const SATZ = formatProzent(BEISPIEL.gutschriftSatz);
const BEHALTEN = BEISPIEL.anzahl - BEISPIEL.zurueck;
const WERT_ZURUECK = S.leih.div(BEISPIEL.anzahl).times(BEISPIEL.zurueck);
const WERT_BEHALTEN = S.leih.minus(WERT_ZURUECK);
const ABSCHLAG = WERT_ZURUECK.minus(S.gutschriftNetto);
const VST_NUR_WARE = S.vorsteuer.minus(S.leih.times('0.19'));

export const lektionC6: Lektion = {
  id: 'C6',
  skillId: 'C6-leihverpackung',
  abschnitt: 'C',
  titel: 'Leihverpackung: Pfand für Paletten',
  kernAha:
    'Berechnete Leihverpackung ist zunächst Bezugskosten des Stoffes. Die Gutschrift bei Rückgabe mindert die Bezugskosten und die Vorsteuer; nur was nicht gutgeschrieben wird, erhöht am Ende die Anschaffungskosten.',
  dauerMin: 7,
  figuren: ['tobias', 'jana', 'leni'],
  ort: 'lager',
  quelle: 'BA 3.1.2 (Bezugskosten, Leihemballage); 04-fachregeln.md, Abschnitt 2 Nr. 6',
  teaser: {
    figur: 'tobias',
    ausdruck: 'ueberrascht',
    text: 'Der Dosenlieferant berechnet uns 20 Paletten extra. Die schicken wir doch sowieso zurück!',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'lager',
      visual: {
        typ: 'beleg',
        absender: BEISPIEL.partner,
        nummer: '2026-0311',
        datum: '11.03.',
        zeilen: [
          { text: 'Getränkedosen 0,33 l', betrag: BEISPIEL.warenwert },
          {
            text: `${BEISPIEL.anzahl} Mehrweg-Leihpaletten à ${e(BEISPIEL.preis)}`,
            betrag: b(S.leih),
          },
          { text: 'zzgl. 19 % Umsatzsteuer', betrag: b(S.vorsteuer) },
          { text: 'Rechnungsbetrag', betrag: b(S.rechnungBrutto), fett: true },
        ],
        fuss: `Leihpaletten schreiben wir bei Rückgabe mit ${SATZ} des berechneten Werts gut.`,
      },
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'ueberrascht',
          text: 'Wir bezahlen für Paletten, die wir zurückschicken? Das ist doch kein Einkauf!',
        },
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: 'Einkauf nicht – aber auch nicht geschenkt. Die Frage ist, wie viel davon zurückkommt.',
        },
      ],
      frage: `Die MBG zahlt ${e(S.leih)} für Paletten, die sie zurückgeben will. Was sind diese ${e(S.leih)} für die MBG?`,
    },
    {
      typ: 'dialog',
      ort: 'lager',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Kennst du vom Getränkemarkt: Auf die Pfandflasche zahlst du Pfand, bei der Rückgabe gibt es Geld zurück.',
        },
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: 'Beim Lieferanten heißt das Leihverpackung. Nur bekommt man dort oft nicht alles zurück.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Auf der Rechnung stehen ${e(BEISPIEL.warenwert)} für Dosen und ${e(S.leih)} für Paletten. Wie hoch ist die Vorsteuer?`,
      optionen: [
        { text: `${e(S.vorsteuer)} – 19 % auf Dosen und Paletten`, richtig: true },
        { text: `${e(VST_NUR_WARE)} – Pfand ist steuerfrei` },
        { text: 'Das hängt davon ab, wie viele Paletten zurückgehen.' },
      ],
      aufloesung: `Die berechnete Verpackung gehört zum Entgelt der Lieferung. Deshalb fallen 19 % auf ${e(S.leih.plus(BEISPIEL.warenwert))} an: ${e(S.vorsteuer)}. Wird später etwas gutgeschrieben, wird die Vorsteuer anteilig korrigiert.`,
    },
    {
      typ: 'konzept',
      titel: 'Leihverpackung sind Bezugskosten',
      text: 'Berechnete Leihverpackung gehört wie Fracht zu den Anschaffungsnebenkosten. Sie steht im Soll von Bezugskosten. Die Gutschrift bei Rückgabe steht im Haben. Was übrig bleibt, erhöht die Anschaffungskosten des Stoffes.',
      visual: {
        typ: 'tkonto',
        name: 'Bezugskosten für Hilfsstoffe',
        soll: [{ text: 'Leihpaletten berechnet', betrag: b(S.leih) }],
        haben: [{ text: 'Gutschrift Rückgabe', betrag: b(S.gutschriftNetto) }],
        saldo: true,
      },
    },
    {
      typ: 'erkunden',
      titel: 'Was bleibt auf dem Konto?',
      text: 'Buche Rechnung und Rückgabe auf das Unterkonto und sieh, welcher Saldo entsteht.',
      erkunden: {
        art: 'tkonto-buchen',
        konto: 'Bezugskosten für Hilfsstoffe',
        vorgaenge: [
          {
            text: `Eingangsrechnung: ${BEISPIEL.anzahl} Leihpaletten berechnet`,
            betrag: b(S.leih),
            seite: 'soll',
          },
          {
            text: `${BEISPIEL.zurueck} Paletten zurück, Gutschrift ${SATZ}`,
            betrag: b(S.gutschriftNetto),
            seite: 'haben',
          },
        ],
      },
      fazit: `Saldo ${e(S.restBezugskosten)}: ${e(WERT_BEHALTEN)} für die ${BEHALTEN} Paletten, die die MBG behält, und ${e(ABSCHLAG)} Abschlag auf die zurückgegebenen. Dieser Rest wird am Jahresende auf das Konto Hilfsstoffe umgebucht.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Rückgabe Schritt für Schritt',
      text: `${BEISPIEL.zurueck} von ${BEISPIEL.anzahl} Paletten gehen zurück, gutgeschrieben werden ${SATZ} des berechneten Werts.`,
      schritte: [
        {
          text: 'Gutschrift netto',
          rechnung: `${BEISPIEL.zurueck} × ${e(BEISPIEL.preis)} × ${SATZ} = ${e(S.gutschriftNetto)}`,
          warum: 'Gutgeschrieben wird nur, was zurückkommt – und nur zum vereinbarten Anteil.',
        },
        {
          text: 'Vorsteuerkorrektur',
          rechnung: `${e(S.gutschriftNetto)} × 19 % = ${e(S.vstKorrektur)}`,
          warum: 'Das Entgelt sinkt nachträglich, also war auch die Vorsteuer zu hoch.',
        },
        {
          text: 'Buchungssatz der Gutschrift',
          rechnung: `Verbindlichkeiten a. LL ${e(S.gutschriftBrutto)} an Bezugskosten für Hilfsstoffe ${e(S.gutschriftNetto)}, an Vorsteuer ${e(S.vstKorrektur)}`,
          warum:
            'Die Schuld beim Lieferanten sinkt um den Bruttobetrag. Die Bezugskosten und die Vorsteuer werden im Haben gemindert.',
        },
        {
          text: 'Umbuchung am Jahresende',
          rechnung: `Hilfsstoffe an Bezugskosten für Hilfsstoffe ${e(S.restBezugskosten)}`,
          warum:
            'Das Unterkonto wird über das Stoffkonto abgeschlossen. So erhöht der Rest die Anschaffungskosten der Dosen.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: `Wohin mit der Gutschrift über ${e(S.gutschriftNetto)}?`,
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Der Lieferant lässt uns etwas nach. Das gehört auf Nachlässe für Hilfsstoffe!',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Zurück kommt die Verpackung, nicht der Preis der Dosen. Also sinken die Bezugskosten.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Die Gutschrift macht berechnete Bezugskosten rückgängig – sie wird dort gebucht, wo die Paletten gebucht wurden.',
          richtig: true,
        },
        { text: 'Nachlässe dürfen nur für Skonto verwendet werden.' },
        { text: 'Gutschriften werden immer auf dem Stoffkonto gebucht.' },
      ],
      aufloesung:
        'Nachlässe mindern den Preis der Ware (Preisnachlass, Bonus, Skonto). Die Gutschrift für Leihverpackung mindert dagegen die Anschaffungsnebenkosten – also das Konto Bezugskosten, im Haben.',
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege hat die Eingangsrechnung gebucht',
      text: 'In einer Zeile steckt ein Fehler. Tippe sie an.',
      zeilen: [
        `Soll: Hilfsstoffe ${e(BEISPIEL.warenwert)}`,
        `Soll: Sonstige Forderungen ${e(S.leih)}`,
        `Soll: Vorsteuer ${e(S.vorsteuer)}`,
        `Haben: Verbindlichkeiten a. LL ${e(S.rechnungBrutto)}`,
      ],
      fehlerZeile: 1,
      gruende: [
        {
          text: 'Berechnete Leihverpackung gehört auf Bezugskosten für Hilfsstoffe, nicht auf Forderungen.',
          richtig: true,
        },
        { text: 'Die Vorsteuer dürfte nur vom Warenwert berechnet werden.' },
        { text: 'Die Verbindlichkeit müsste ohne Paletten gebucht werden.' },
      ],
      aufloesung:
        'Die Paletten sind nicht wie ein Darlehen an den Lieferanten. Sie gehören zu den Kosten der Beschaffung, bis eine Gutschrift einen Teil davon zurückholt.',
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Gasflaschen gehen an den Kohlensäure-Lieferanten zurück. Ergänze Gutschrift netto und Vorsteuerkorrektur.',
      skillId: 'C6-leihverpackung',
      seed: 5,
      variant: 'rueckgabe',
      partId: 'rechnung',
      gefragt: ['gutschrift-netto', 'vst-korrektur'],
    },
    {
      typ: 'merksatz',
      id: 'C6-m1',
      frage: 'Wie wird Leihverpackung beim Einkauf gebucht?',
      text: 'Berechnete Leihverpackung auf Bezugskosten des Stoffes (mit Vorsteuer). Die Gutschrift bei Rückgabe mindert Bezugskosten und Vorsteuer. Der Rest wird auf das Stoffkonto umgebucht und erhöht die Anschaffungskosten.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe:
        'Bilden Sie die Buchungssätze für die Eingangsrechnung und für die Gutschrift der zurückgesandten Leihverpackung.',
      part: { skillId: 'C6-leihverpackung', seed: 2, variant: 'gesamt', partId: 'buchung' },
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Bevor wir neue Aromen bestellen: Das zweite Angebot hat den höheren Listenpreis. Ob es trotzdem das günstigere ist?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Auf welches Konto bucht die MBG berechnete Leihpaletten beim Kauf von Rohstoffen?',
      optionen: [
        { text: 'Bezugskosten für Rohstoffe', richtig: true },
        { text: 'Sonstige Forderungen' },
        { text: 'Nachlässe für Rohstoffe' },
      ],
    },
    {
      frage:
        'Gutschrift für zurückgegebene Leihverpackung über 200 € netto (19 % USt). Wie lautet die Buchung?',
      optionen: [
        {
          text: 'Verbindlichkeiten a. LL 238 € an Bezugskosten 200 €, an Vorsteuer 38 €',
          richtig: true,
        },
        { text: 'Verbindlichkeiten a. LL 200 € an Bezugskosten 200 €' },
        { text: 'Verbindlichkeiten a. LL 238 € an Nachlässe 200 €, an Vorsteuer 38 €' },
      ],
    },
    {
      frage: 'Was passiert mit Leihverpackung, die nicht gutgeschrieben wird?',
      optionen: [
        {
          text: 'Sie bleibt als Bezugskosten stehen und erhöht über die Umbuchung die Anschaffungskosten.',
          richtig: true,
        },
        { text: 'Sie wird als Verlust direkt in die GuV gebucht.' },
        { text: 'Sie bleibt als Forderung gegen den Lieferanten stehen.' },
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
      'Gegen Lehrbrief BA 3.1.2 (Bezugskosten, Fußnote Leihemballage) und 04-fachregeln.md Abschnitt 2 Nr. 6 geprüft; Zahlen aus der Engine (GC-C6); 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
