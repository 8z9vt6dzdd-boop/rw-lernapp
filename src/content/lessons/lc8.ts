// Lektion C8 – Handelswaren, Wareneinsatz und Rohgewinn (eigene Formulierung; Buchungen nach
// Lehrbrief BA 3.1.1 und docs/m7/c2.md, GC-C8). Alle Beträge werden von der Engine berechnet.
import { solveHw, type HwParams } from '../../engine/generators/c2/handelswaren';
import { formatEuro, type Val } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: Val | string) => formatEuro(typeof v === 'string' ? v : v.value.toString());
const b = (v: Val) => v.value.toString();

// Beispiel der Lektion: GC-C8 ohne Unterkonten
const BEISPIEL: HwParams = {
  variante: 'bestandsorientiert',
  ware: 'Weißwein „Liboriwein“',
  lieferant: 'Weinkellerei Lindemeier (Detmold)',
  kunde: 'Landhotel Kerkhoff GmbH (Bad Driburg)',
  ab: '18000',
  einkauf: '64000',
  bezugskosten: '0',
  nachlaesse: '0',
  sb: '21000',
  umsatz: '92000',
  ustSatz: '0.19',
};
const S = solveHw(BEISPIEL);
const NAIV = S.rohgewinn.plus(S.wareneinsatz).minus(BEISPIEL.einkauf);
const VERTAUSCHT = S.wareneinsatz
  .plus(BEISPIEL.sb)
  .plus(BEISPIEL.sb)
  .minus(BEISPIEL.ab)
  .minus(BEISPIEL.ab);
const VERKAUF: HwParams = {
  ...BEISPIEL,
  variante: 'laufende-buchungen',
  einkauf: '4800',
  umsatz: '6600',
};
const SV = solveHw(VERKAUF);

export const lektionC8: Lektion = {
  id: 'C8',
  skillId: 'C8-handelswaren',
  abschnitt: 'C',
  titel: 'Handelswaren: kaufen, lagern, weiterverkaufen',
  kernAha:
    'Handelswaren werden unverändert weiterverkauft. Was die verkaufte Ware gekostet hat, zeigt erst die Inventur: Wareneinsatz = Anfangsbestand + Einkäufe − Schlussbestand. Umsatzerlöse für Handelswaren minus Wareneinsatz ergibt den Rohgewinn.',
  dauerMin: 7,
  figuren: ['tobias', 'jana', 'leni'],
  ort: 'lager',
  quelle: 'BA 3.1.1 (Buchung von Handelswaren), BA 3.1.5; Lehrbuch-Übungen (Rohgewinn)',
  teaser: {
    figur: 'tobias',
    ausdruck: 'freut',
    text: 'Wein eingekauft, Wein verkauft – und 28.000 € verdient. Oder?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'lager',
      visual: {
        typ: 'lager',
        titel: 'Weinlager der MBG',
        regal: [
          { name: 'Liboriwein am 1.1.', paletten: 3, farbe: '#e2b13c' },
          { name: 'Liboriwein am 31.12.', paletten: 4, farbe: '#e2b13c' },
        ],
      },
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: `Für ${e(BEISPIEL.einkauf)} Liboriwein eingekauft, für ${e(BEISPIEL.umsatz)} verkauft. Macht ${e(NAIV)} Gewinn!`,
        },
        { figur: 'jana', ausdruck: 'gruebelt', text: 'Hast du schon ins Weinlager geschaut?' },
      ],
      frage: 'Warum ist Tobias’ Rechnung zu einfach?',
    },
    {
      typ: 'dialog',
      ort: 'lager',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Denk an einen Kiosk: Er kauft Getränke ein und verkauft sie unverändert weiter. Was er verdient hat, weiß er erst, wenn er abends in den Kühlschrank schaut.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Solche zugekauften Güter heißen Handelswaren. Sie werden ohne Be- oder Verarbeitung weiterverkauft.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Handelsware oder nicht?',
      kategorien: ['Handelsware', 'Eigenes Erzeugnis', 'Rohstoff'],
      elemente: [
        {
          text: 'Liboriwein, zugekauft und unverändert an Hotels verkauft',
          kategorie: 'Handelsware',
        },
        {
          text: 'Domkreuz Vodka, zugekauft und nur in Geschenkkartons verpackt',
          kategorie: 'Handelsware',
          erklaerung: 'Abpacken oder Etikettieren gilt nicht als Bearbeitung.',
        },
        { text: 'Senne Lemon aus der eigenen Abfüllung', kategorie: 'Eigenes Erzeugnis' },
        {
          text: 'Zucker für den Sirup',
          kategorie: 'Rohstoff',
          erklaerung: 'Er geht in die eigene Produktion ein.',
        },
        { text: 'Paderquell Energy in Dosen', kategorie: 'Eigenes Erzeugnis' },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Was fehlt, wurde verkauft',
      text: 'Anfangsbestand und Einkäufe stehen im Soll des Kontos Handelswaren. Die Inventur liefert den Schlussbestand. Die Differenz ist der Wareneinsatz: so viel hat die verkaufte Ware gekostet.',
      visual: {
        typ: 'tkonto',
        name: 'Handelswaren',
        soll: [
          { text: 'Anfangsbestand', betrag: BEISPIEL.ab },
          { text: 'Einkäufe', betrag: BEISPIEL.einkauf },
        ],
        haben: [
          { text: 'Schlussbestand lt. Inventur', betrag: BEISPIEL.sb },
          { text: 'Wareneinsatz', betrag: b(S.wareneinsatz), neu: true },
        ],
      },
    },
    {
      typ: 'vorhersage',
      frage: `Anfangsbestand ${e(BEISPIEL.ab)}, Einkäufe ${e(BEISPIEL.einkauf)}, Schlussbestand ${e(BEISPIEL.sb)}. Wie hoch ist der Wareneinsatz?`,
      optionen: [
        { text: e(S.wareneinsatz), richtig: true },
        { text: e(BEISPIEL.einkauf) },
        { text: e(VERTAUSCHT) },
      ],
      aufloesung: `${e(BEISPIEL.ab)} + ${e(BEISPIEL.einkauf)} − ${e(BEISPIEL.sb)} = ${e(S.wareneinsatz)}. Im Lager liegt am Jahresende mehr als am Anfang – ein Teil der Einkäufe wurde also noch gar nicht verkauft.`,
    },
    {
      typ: 'erkunden',
      titel: 'Das Warenkonto abschließen',
      text: 'Buche die Positionen auf das Konto Handelswaren. Was am Ende fehlt, ist der Wareneinsatz.',
      erkunden: {
        art: 'tkonto-buchen',
        konto: 'Handelswaren',
        anfang: { seite: 'soll', text: 'Anfangsbestand', betrag: BEISPIEL.ab },
        vorgaenge: [
          { text: 'Einkäufe des Jahres', betrag: BEISPIEL.einkauf, seite: 'soll' },
          {
            text: 'Schlussbestand lt. Inventur (an SBK)',
            betrag: BEISPIEL.sb,
            seite: 'haben',
          },
          {
            text: 'Wareneinsatz (an Aufwendungen für Handelswaren)',
            betrag: b(S.wareneinsatz),
            seite: 'haben',
          },
        ],
      },
      fazit: `Beide Seiten sind gleich groß. Gebucht wird „Schlussbilanzkonto an Handelswaren ${e(BEISPIEL.sb)}“ und „Aufwendungen für Handelswaren an Handelswaren ${e(S.wareneinsatz)}“.`,
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Wie viel hat die MBG am Liboriwein verdient?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: `Verkauf minus Einkauf: ${e(NAIV)}. Ganz einfach.`,
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: `Umsatzerlöse minus Wareneinsatz: ${e(S.rohgewinn)}. Das ist der Rohgewinn.`,
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Ein Teil der Einkäufe liegt noch im Lager. Abgezogen wird nur, was die verkaufte Ware gekostet hat.',
          richtig: true,
        },
        { text: 'Vom Umsatz muss man immer den Schlussbestand abziehen.' },
        { text: 'Tobias hat die Umsatzsteuer vergessen.' },
      ],
      aufloesung: `Rohgewinn = Umsatzerlöse für Handelswaren − Wareneinsatz = ${e(BEISPIEL.umsatz)} − ${e(S.wareneinsatz)} = ${e(S.rohgewinn)}. Davon müssen noch Lager, Personal und Verwaltung bezahlt werden – deshalb „roh“.`,
    },
    {
      typ: 'verstaendnis',
      frage: `Die MBG verkauft Liboriwein für ${e(VERKAUF.umsatz)} netto auf Ziel. Wohin gehört der Erlös?`,
      figur: {
        figur: 'jana',
        ausdruck: 'gruebelt',
        text: 'Achtung, hier verwechseln viele das Konto.',
      },
      optionen: [
        {
          text: `Umsatzerlöse für Handelswaren ${e(VERKAUF.umsatz)} und Umsatzsteuer ${e(SV.ustVerkauf)}`,
          richtig: true,
          erklaerung: 'Richtig: Handelswaren haben ein eigenes Erlöskonto.',
        },
        {
          text: `Umsatzerlöse für eigene Erzeugnisse ${e(VERKAUF.umsatz)} und Umsatzsteuer ${e(SV.ustVerkauf)}`,
          erklaerung:
            'Den Wein hat die MBG nicht selbst hergestellt – das Konto ist für eigene Getränke.',
        },
        {
          text: `Handelswaren (Haben) ${e(VERKAUF.umsatz)} und Umsatzsteuer ${e(SV.ustVerkauf)}`,
          erklaerung:
            'Das Warenkonto wird beim Verkauf nicht berührt. Den Abgang zeigt die Inventur am Jahresende.',
        },
      ],
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Ein neues Jahr im Weinlager, diesmal mit Nachlässen des Lieferanten. Ergänze Wareneinsatz und Rohgewinn.',
      skillId: 'C8-handelswaren',
      seed: 2,
      variant: 'bestandsorientiert',
      partId: 'rechnung',
      gefragt: ['wareneinsatz', 'rohgewinn'],
    },
    {
      typ: 'merksatz',
      id: 'C8-m1',
      frage: 'Wie ermittelt man Wareneinsatz und Rohgewinn bei Handelswaren?',
      text: 'Wareneinsatz = Anfangsbestand + Einkäufe (+ Bezugskosten − Nachlässe) − Schlussbestand lt. Inventur. Rohgewinn = Umsatzerlöse für Handelswaren − Wareneinsatz. Verkäufe stehen auf einem eigenen Erlöskonto.',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe:
        'Bilden Sie die Abschlussbuchungen für das Konto Handelswaren einschließlich der Umbuchung der Unterkonten (bestandsorientierte Erfassung).',
      part: {
        skillId: 'C8-handelswaren',
        seed: 6,
        variant: 'bestandsorientiert',
        partId: 'abschluss',
      },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'feiert',
        text: 'Jetzt startet die Saison: Die erste große Lieferung Senne Lemon geht an die Gastronomie, Fracht und Verpackung stehen mit auf der Rechnung. Wie bucht man eigentlich das Verkaufen?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Anfangsbestand Handelswaren 10.000 €, Einkäufe 50.000 €, Schlussbestand 15.000 €. Wie hoch ist der Wareneinsatz?',
      optionen: [{ text: '45.000 €', richtig: true }, { text: '50.000 €' }, { text: '55.000 €' }],
    },
    {
      frage: 'Wie wird der Wareneinsatz bei bestandsorientierter Erfassung gebucht?',
      optionen: [
        { text: 'Aufwendungen für Handelswaren an Handelswaren', richtig: true },
        { text: 'Handelswaren an Aufwendungen für Handelswaren' },
        { text: 'Handelswaren an Umsatzerlöse für Handelswaren' },
      ],
    },
    {
      frage:
        'Umsatzerlöse für Handelswaren 80.000 €, Wareneinsatz 52.000 €. Wie hoch ist der Rohgewinn?',
      optionen: [{ text: '28.000 €', richtig: true }, { text: '132.000 €' }, { text: '52.000 €' }],
    },
  ],
  checkliste: {
    raetsel: true,
    alltagVorFachbegriff: true,
    kernAhaErreicht: true,
    figurImDialog: true,
    klausurbrueckeUndCliffhanger: true,
    fachlichGeprueft:
      'Gegen Lehrbrief BA 3.1.1 (Inventurmethode, eigene Erlöskonten) und BA 3.1.5 geprüft; Rohgewinn nach Lehrbuch-Übungen; Zahlen aus der Engine (GC-C8); 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
