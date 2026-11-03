// Lektion C5 – Skonto beim Einkauf (eigene Formulierung; Buchungsregeln nach 04-fachregeln.md, GC-01).
// Alle Beträge werden von der Engine berechnet.
import { formatEuro, formatProzent } from '../../engine/money';
import { solveSkonto, type SkontoParams } from '../../engine/generators/skonto';
import type { Lektion } from './types';

const BEISPIEL: SkontoParams = {
  seite: 'einkauf',
  art: 'Rohstoffe',
  methode: 'netto',
  gegeben: 'rechnung',
  betrag: '11900',
  skontoSatz: '0.02',
  ustSatz: '0.19',
  partner: 'Aromahaus Tewes GmbH (Bielefeld)',
  gegenstand: 'Aromen',
  vorlage: 0,
};
const S = solveSkonto(BEISPIEL);
const e = (v: { value: { toString(): string } } | string) =>
  formatEuro(typeof v === 'string' ? v : v.value.toString());
const NETTO_RECHNUNG = S.rechnung.div('1.19').fix();
const UST_RECHNUNG = S.rechnung.minus(NETTO_RECHNUNG);
const SATZ = formatProzent(BEISPIEL.skontoSatz);

export const lektionC5: Lektion = {
  id: 'C5',
  skillId: 'C5-skonto-einkauf',
  abschnitt: 'C',
  titel: 'Skonto beim Einkauf',
  kernAha:
    'Skonto wird vom Rechnungsbetrag gerechnet und dann zerlegt: Der Nettoanteil mindert den Einkaufspreis (Nachlässe), der Steueranteil korrigiert die Vorsteuer.',
  dauerMin: 7,
  figuren: ['tobias', 'jana', 'leni'],
  ort: 'buero',
  quelle: 'BA 3.1; 04-fachregeln.md (GC-01)',
  teaser: {
    figur: 'tobias',
    ausdruck: 'freut',
    text: 'Der Aromenlieferant gibt uns 2 % Skonto, wenn wir schnell zahlen. Lohnt sich das?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      visual: {
        typ: 'beleg',
        absender: BEISPIEL.partner,
        nummer: '2026-0214',
        datum: '14.02.',
        zeilen: [
          { text: 'Aromen Zitrone/Limette, 400 kg', betrag: NETTO_RECHNUNG.value.toString() },
          { text: 'zzgl. 19 % Umsatzsteuer', betrag: UST_RECHNUNG.value.toString() },
          { text: 'Rechnungsbetrag', betrag: S.rechnung.value.toString(), fett: true },
        ],
        fuss: `Zahlbar innerhalb von 30 Tagen ohne Abzug oder innerhalb von 10 Tagen mit ${SATZ} Skonto.`,
      },
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Die Rechnung kann doch liegen bleiben. Zeit ist Geld!',
        },
        { figur: 'jana', ausdruck: 'gruebelt', text: 'Eben.' },
      ],
      frage: 'Jana und Tobias sagen fast dasselbe – und meinen das Gegenteil. Worum geht es?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Kennst du den Handwerker, der sagt: „Wenn Sie gleich zahlen, lasse ich etwas nach“? Genau das ist Skonto.',
        },
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: 'Ein Nachlass für schnelles Zahlen. Bleibt die Frage: Lohnt sich das?',
        },
      ],
    },
    {
      typ: 'erkunden',
      titel: 'Was bringt der Skonto?',
      text: `Rechnung über ${e(S.rechnung)}. Verändere den Skontosatz und sieh, was die MBG spart.`,
      erkunden: {
        art: 'skonto-regler',
        brutto: BEISPIEL.betrag,
        ustSatz: BEISPIEL.ustSatz,
        zieltage: 30,
        skontotage: 10,
      },
      fazit: `Schon ${SATZ} für 20 Tage früheres Zahlen entsprechen aufs Jahr gerechnet einem Zins von weit über 30 %. Kein Sparbuch kommt da mit.`,
    },
    {
      typ: 'entscheidung',
      frage: 'Auf dem Bankkonto der MBG ist genug Geld. Was machst du?',
      figur: {
        figur: 'tobias',
        ausdruck: 'neutral',
        text: 'Ich würde warten. Dann haben wir länger was auf dem Konto.',
      },
      optionen: [
        {
          text: 'Innerhalb von 10 Tagen mit Skonto zahlen',
          empfohlen: true,
          folge: `Die MBG überweist ${e(S.zahlbetrag)} statt ${e(S.rechnung)} und spart ${e(S.skontoBrutto)}.`,
        },
        {
          text: 'Bis zum 30. Tag warten',
          folge: `Das Geld lag 20 Tage länger auf dem Konto und hat dort fast nichts gebracht. Die ${e(S.skontoBrutto)} sind verschenkt.`,
        },
      ],
      fazit:
        'Wenn das Geld da ist, lohnt sich Skonto fast immer: Der Nachlass ist viel höher als jeder Zins auf dem Konto.',
    },
    {
      typ: 'konzept',
      titel: 'Wo steckt die Steuer?',
      text: `Der Rechnungsbetrag besteht aus dem Warenwert (netto) und 19 % Umsatzsteuer. Für die MBG ist diese Steuer Vorsteuer: Sie holt sie sich vom Finanzamt zurück.`,
      visual: { typ: 'brutto-netto', brutto: BEISPIEL.betrag, ustSatz: BEISPIEL.ustSatz },
    },
    {
      typ: 'vorhersage',
      frage: `Die MBG spart ${e(S.skontoBrutto)}. Um wie viel werden die Aromen dadurch wirklich billiger?`,
      optionen: [
        { text: e(S.skontoBrutto) },
        { text: e(S.skontoNetto), richtig: true },
        { text: e(S.steuer) },
      ],
      aufloesung: `Im Skonto steckt anteilig Steuer. ${e(S.skontoNetto)} mindern den Preis der Aromen, ${e(S.steuer)} waren Vorsteuer, die die MBG beim Einkauf zu hoch angesetzt hat.`,
      aufloesungVisual: {
        typ: 'brutto-netto',
        brutto: BEISPIEL.betrag,
        ustSatz: BEISPIEL.ustSatz,
        skontoSatz: BEISPIEL.skontoSatz,
      },
    },
    {
      typ: 'vorgerechnet',
      titel: 'Schritt für Schritt zur Buchung',
      text: `Rechnung ${e(S.rechnung)}, Zahlung mit ${SATZ} Skonto per Bank, Nettomethode.`,
      schritte: [
        {
          text: 'Skonto brutto berechnen',
          rechnung: `${e(S.rechnung)} × ${SATZ} = ${e(S.skontoBrutto)}`,
          warum:
            'Der Lieferant gewährt den Skonto auf den Betrag, den er in Rechnung stellt – also auf den Bruttobetrag.',
        },
        {
          text: 'Skonto netto herausrechnen',
          rechnung: `${e(S.skontoBrutto)} ÷ 1,19 = ${e(S.skontoNetto)}`,
          warum: 'Brutto sind 119 %, netto 100 %. Teilen durch 1,19 holt den Nettoanteil heraus.',
        },
        {
          text: 'Steuerkorrektur bestimmen',
          rechnung: `${e(S.skontoBrutto)} − ${e(S.skontoNetto)} = ${e(S.steuer)}`,
          warum: 'Um diesen Betrag war die gebuchte Vorsteuer zu hoch – sie wird jetzt verringert.',
        },
        {
          text: 'Zahlbetrag',
          rechnung: `${e(S.rechnung)} − ${e(S.skontoBrutto)} = ${e(S.zahlbetrag)}`,
          warum: 'Überwiesen wird die Rechnung abzüglich des gesamten Skontos.',
        },
        {
          text: 'Buchungssatz',
          rechnung: `Verbindlichkeiten a. LL ${e(S.rechnung)} an Bank ${e(S.zahlbetrag)}, an Nachlässe für Rohstoffe ${e(S.skontoNetto)}, an Vorsteuer ${e(S.steuer)}`,
          warum:
            'Die Schuld ist in voller Höhe erledigt (Soll). Im Haben: das Geld von der Bank, der Nachlass auf den Rohstoffpreis und die Korrektur der Vorsteuer.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege hat gebucht',
      text: 'In einer Zeile steckt ein Fehler. Tippe sie an.',
      zeilen: [
        `Soll: Verbindlichkeiten a. LL ${e(S.rechnung)}`,
        `Haben: Bank ${e(S.zahlbetrag)}`,
        `Haben: Nachlässe für Rohstoffe ${e(S.skontoNetto)}`,
        `Haben: Umsatzsteuer ${e(S.steuer)}`,
      ],
      fehlerZeile: 3,
      gruende: [
        {
          text: 'Beim Einkauf wird die Vorsteuer korrigiert, nicht die Umsatzsteuer.',
          richtig: true,
        },
        { text: `Der Skonto müsste ${e(S.skontoBrutto)} betragen.` },
        { text: `Die Bank müsste ${e(S.rechnung)} zeigen.` },
      ],
      aufloesung:
        'Umsatzsteuer entsteht beim Verkaufen. Beim Einkauf zahlt die MBG Vorsteuer – und genau die war um den Steueranteil im Skonto zu hoch.',
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Neue Rechnung, gleiches Muster. Ergänze Skonto netto und die Vorsteuerkorrektur.',
      skillId: 'C5-skonto-einkauf',
      seed: 6,
      variant: 'netto-methode',
      partId: 'rechnung',
      gefragt: ['skonto-netto', 'steuer'],
    },
    {
      typ: 'merksatz',
      id: 'C5-m1',
      frage: 'Wie wird Lieferantenskonto berechnet und gebucht?',
      text: 'Skonto vom Bruttobetrag berechnen, dann zerlegen: Der Nettoanteil mindert den Einkaufspreis (Nachlässe), der Steueranteil korrigiert die Vorsteuer im Haben.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe: 'Bilden Sie den Buchungssatz für den Zahlungsausgleich (Nettomethode).',
      part: { skillId: 'C5-skonto-einkauf', seed: 1, variant: 'netto-methode', partId: 'buchung' },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Auf der Dosenrechnung stehen 20 Leihpaletten extra. Bezahlen wir jetzt etwa auch die Paletten?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Rechnung 2.380 € brutto, 2 % Skonto. Wie hoch ist der Skonto netto (19 % USt)?',
      optionen: [{ text: '40,00 €', richtig: true }, { text: '47,60 €' }, { text: '7,60 €' }],
    },
    {
      frage: 'Welches Konto wird beim Lieferantenskonto für die Steuerkorrektur gebucht?',
      optionen: [
        { text: 'Vorsteuer (im Haben)', richtig: true },
        { text: 'Umsatzsteuer (im Soll)' },
        { text: 'Erlösberichtigungen' },
      ],
    },
    {
      frage: 'Wovon wird Skonto berechnet?',
      optionen: [
        { text: 'Vom Rechnungsbetrag (brutto)', richtig: true },
        { text: 'Vom Nettobetrag' },
        { text: 'Vom Zahlbetrag' },
      ],
    },
    {
      frage: 'Skonto auf eine neue Maschine: Wo wird der Nettoskonto gebucht?',
      optionen: [
        { text: 'Direkt auf dem Anlagekonto (mindert die Anschaffungskosten)', richtig: true },
        { text: 'Auf Nachlässe für Rohstoffe' },
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
      'Buchung nach 04-fachregeln.md (GC-01, Nettomethode); Zahlen aus der Engine; 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
