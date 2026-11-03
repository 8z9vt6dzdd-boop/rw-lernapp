// Lektion C4 – Nachträgliche Nachlässe vom Lieferer: Mängelrüge, Kulanz, Bonus
// (eigene Formulierung und eigene Zahlen; geprüft gegen BA 3.1.4.1 und 3.1.5; Buchungsregel nach
// 04-fachregeln.md, Konvention 4; docs/m7/c1.md GC-C4-01 bis 05). Alle Beträge rechnet die Engine.
import { solveC4, type C4Params } from '../../engine/generators/c1/c4-nachlaesse';
import { formatEuro, type Val } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value);
const BASIS: C4Params = {
  variante: 'netto-methode',
  erfassung: 'bestand',
  methode: 'netto',
  stoff: 'Rohstoffe',
  gegenstand: 'Aromen',
  partner: 'Aromahaus Tewes GmbH (Bielefeld)',
  ustSatz: '0.19',
  warenwert: '30000',
  satz: '0.1',
  anlass: 'maengel',
  jahresumsatz: '120000',
  bonusGegeben: 'satz',
  bonusBrutto: '0',
  haben: [],
  soll: [],
  vorlage: 0,
};
const NL = solveC4(BASIS);
const NL_BRUTTO = solveC4({ ...BASIS, variante: 'brutto-methode', methode: 'brutto' });
const BONUS = solveC4({ ...BASIS, variante: 'bonus', satz: '0.02' });
const SKONTO = '200';
const KONTO = [
  { text: 'Mängelrüge Aromen', betrag: NL.nachlassNetto.value.toString() },
  { text: 'Bonus Vorjahr', betrag: BONUS.nachlassNetto.value.toString() },
  { text: 'Skonto (netto)', betrag: SKONTO },
];
const UMB = solveC4({ ...BASIS, variante: 'umbuchung', haben: KONTO });
const SATZ = '10 %';

export const lektionC4: Lektion = {
  id: 'C4',
  skillId: 'C4-nachlaesse-einkauf',
  abschnitt: 'C',
  titel: 'Behalten, aber billiger',
  kernAha:
    'Bleibt die Ware bei der MBG und sinkt nur der Preis (Mängelrüge, Kulanz, Bonus), kommt der Nachlass netto auf das Unterkonto „Nachlässe für …“ und die Vorsteuer wird anteilig korrigiert. Am Periodenende mindert das Unterkonto die Anschaffungskosten.',
  dauerMin: 7,
  figuren: ['tobias', 'jana', 'leni'],
  ort: 'buero',
  quelle:
    'BA 3.1.4.1 (Mängelrüge, Boni, Kulanz; Netto- und Bruttomethode), 3.1.5; 04-fachregeln.md (Konvention 4)',
  teaser: {
    figur: 'tobias',
    ausdruck: 'freut',
    text: `Tewes lässt uns ${SATZ} nach und wir behalten die Aromen. Diesmal ist es wirklich ein Nachlass!`,
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      visual: {
        typ: 'beleg',
        absender: BASIS.partner,
        nummer: 'GS-2026-031',
        datum: '10.02.',
        zeilen: [
          {
            text: `Preisnachlass ${SATZ} auf Rechnung 2026-0288 (Aromen)`,
            betrag: NL.nachlassNetto.value.toString(),
          },
          { text: 'zzgl. 19 % Umsatzsteuer', betrag: NL.vorsteuer.value.toString() },
          { text: 'Gutschrift', betrag: NL.nachlassBrutto.value.toString(), fett: true },
        ],
        fuss: `Ursprüngliche Rechnung: ${formatEuro(BASIS.warenwert)} netto, ${e(NL.rechnung)} brutto, noch offen.`,
      },
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Siehst du, ein Nachlass! Diesmal habe ich recht.',
        },
        { figur: 'jana', ausdruck: 'gruebelt', text: 'Diesmal ja. Bleibt die Frage, wohin damit.' },
      ],
      frage: 'Die Aromen bleiben im Lager. Was hat sich geändert – die Menge oder der Preis?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Die neue Jacke hat einen kleinen Fleck, der Laden gibt dir 20 % Rabatt und du behältst sie. Zurückgeschickt hast du nichts.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Die Jacke ist nur billiger geworden. Genau das ist ein nachträglicher Preisnachlass.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Storno oder Nachlass?',
      kategorien: ['Rücksendung (Storno aufs Stoffkonto)', 'Nachlass (Unterkonto Nachlässe)'],
      elemente: [
        {
          text: 'Verbeulte Dosen gehen zurück an das Dosenwerk',
          kategorie: 'Rücksendung (Storno aufs Stoffkonto)',
          erklaerung: 'Die Ware verlässt die MBG.',
        },
        {
          text: 'Leicht zerkratzte Dosen bleiben, dafür 5 % Preisnachlass',
          kategorie: 'Nachlass (Unterkonto Nachlässe)',
          erklaerung: 'Ware bleibt, nur der Preis sinkt (Mängelrüge).',
        },
        {
          text: 'Jahresbonus vom Aromenlieferanten',
          kategorie: 'Nachlass (Unterkonto Nachlässe)',
          erklaerung: 'Ein Bonus mindert nachträglich den Einkaufspreis.',
        },
        {
          text: 'Falsche Etikettensorte wird abgeholt',
          kategorie: 'Rücksendung (Storno aufs Stoffkonto)',
          erklaerung: 'Ware geht zurück: Storno.',
        },
        {
          text: 'Kulanz-Nachlass wegen verspäteter Lieferung',
          kategorie: 'Nachlass (Unterkonto Nachlässe)',
          erklaerung: 'Aus Kulanz gewährter Preisnachlass, die Ware bleibt.',
        },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Die Gutschrift hat zwei Teile',
      text: `${SATZ} auf den Warenwert ergeben den Nachlass netto. Dazu gehört anteilig Umsatzsteuer – die MBG hat sie als Vorsteuer zu viel abgezogen und muss sie korrigieren.`,
      visual: { typ: 'brutto-netto', brutto: NL.nachlassBrutto.value.toString(), ustSatz: '0.19' },
    },
    {
      typ: 'vorhersage',
      frage: `Die Gutschrift über ${e(NL.nachlassBrutto)} kommt an. Um wie viel sinkt die Schuld beim Lieferer?`,
      optionen: [
        { text: e(NL.nachlassNetto) },
        { text: e(NL.nachlassBrutto), richtig: true },
        { text: e(NL.vorsteuer) },
      ],
      aufloesung: `Die MBG schuldet Tewes jetzt ${e(NL.rechnung.minus(NL.nachlassBrutto))} statt ${e(NL.rechnung)}: Die Verbindlichkeit sinkt um den vollen Gutschriftsbetrag. Davon sind ${e(NL.nachlassNetto)} Nachlass und ${e(NL.vorsteuer)} Vorsteuerkorrektur.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Zwei erlaubte Wege',
      text: `Preisnachlass ${SATZ} auf ${formatEuro(BASIS.warenwert)} netto.`,
      schritte: [
        {
          text: 'Nachlass netto und Steueranteil',
          rechnung: `${formatEuro(BASIS.warenwert)} × ${SATZ} = ${e(NL.nachlassNetto)}; × 19 % = ${e(NL.vorsteuer)}`,
          warum: 'Der Nachlass mindert das Entgelt und damit die Vorsteuer.',
        },
        {
          text: 'Nettomethode: alles in einem Satz',
          rechnung: `Verbindlichkeiten a. LL ${e(NL.nachlassBrutto)} an Nachlässe für Rohstoffe ${e(NL.nachlassNetto)}, an Vorsteuer ${e(NL.vorsteuer)}`,
          warum: 'Die Vorsteuer wird sofort korrigiert.',
        },
        {
          text: 'Bruttomethode: erst brutto, später korrigieren',
          rechnung: `Verbindlichkeiten a. LL an Nachlässe für Rohstoffe ${e(NL_BRUTTO.nachlassBrutto)}; am Ende des Voranmeldungszeitraums Nachlässe für Rohstoffe an Vorsteuer ${e(NL_BRUTTO.vorsteuer)}`,
          warum: 'Die Steuer wird gesammelt einmal korrigiert. Ergebnis wie bei der Nettomethode.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: `Das Aromahaus Tewes gewährt einen Bonus von 2 % auf ${formatEuro(BASIS.jahresumsatz)} Vorjahresumsatz. Wie bucht die MBG?`,
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Ein Bonus ist doch ein Geschenk. Also ein Ertrag, wie Erlösberichtigungen oder so.',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Der Bonus macht unsere Aromen nachträglich billiger. Also Nachlässe für Rohstoffe.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Ein Bonus vom Lieferer ist eine nachträgliche Minderung des Einkaufspreises.',
          richtig: true,
        },
        { text: 'Boni dürfen nie gebucht werden, sie stehen nur in der Statistik.' },
        { text: 'Erlösberichtigungen sind für alle Gutschriften zuständig.' },
      ],
      aufloesung: `Erlösberichtigungen gehören zum Verkauf. Richtig ist: Verbindlichkeiten a. LL ${e(BONUS.nachlassBrutto)} an Nachlässe für Rohstoffe ${e(BONUS.nachlassNetto)}, an Vorsteuer ${e(BONUS.vorsteuer)}.`,
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Neue Mängelrüge, gleiches Muster. Ergänze Nachlass netto und Vorsteuerkorrektur.',
      skillId: 'C4-nachlaesse-einkauf',
      seed: 3,
      variant: 'netto-methode',
      partId: 'rechnung',
      gefragt: ['netto', 'vorsteuer'],
    },
    {
      typ: 'erkunden',
      titel: 'Das Nachlasskonto am Quartalsende',
      text: 'Buche die Nachlässe des Quartals auf das Unterkonto.',
      erkunden: {
        art: 'tkonto-buchen',
        konto: 'Nachlässe für Rohstoffe',
        vorgaenge: KONTO.map((k) => ({ text: k.text, betrag: k.betrag, seite: 'haben' as const })),
      },
      fazit: `Habensaldo ${e(UMB.saldo)}. Umbuchung: Nachlässe für Rohstoffe an Rohstoffe ${e(UMB.saldo)} – die Anschaffungskosten der Rohstoffe sinken.`,
    },
    {
      typ: 'merksatz',
      id: 'C4-m1',
      frage: 'Wie bucht man einen nachträglichen Preisnachlass oder Bonus vom Lieferer?',
      text: 'Ware bleibt, Preis sinkt: Verbindlichkeiten a. LL an Nachlässe für … (netto) und an Vorsteuer (Nettomethode). Am Periodenende „Nachlässe an Stoffkonto“ umbuchen.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe: 'Bilden Sie den Buchungssatz für die Bonusgutschrift (Nettomethode).',
      part: { skillId: 'C4-nachlaesse-einkauf', seed: 6, variant: 'bonus', partId: 'buchung' },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Tewes bietet uns übrigens 2 % Skonto, wenn wir die nächste Rechnung schnell zahlen. Ich würde sie trotzdem liegen lassen.',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Lieferer gewährt nach Mängelrüge 5 % Nachlass auf Hilfsstoffe (Warenwert 4.000 € netto). Wie lautet die Buchung (Nettomethode)?',
      optionen: [
        {
          text: 'Verbindlichkeiten a. LL 238 € an Nachlässe für Hilfsstoffe 200 €, an Vorsteuer 38 €',
          richtig: true,
        },
        { text: 'Verbindlichkeiten a. LL 238 € an Hilfsstoffe 200 €, an Vorsteuer 38 €' },
        { text: 'Verbindlichkeiten a. LL 200 € an Erlösberichtigungen 200 €' },
      ],
    },
    {
      frage: 'Bruttomethode: Was wird am Ende des Voranmeldungszeitraums gebucht?',
      optionen: [
        { text: 'Nachlässe für … an Vorsteuer (Steueranteil)', richtig: true },
        { text: 'Vorsteuer an Nachlässe für … (Steueranteil)' },
        { text: 'Nichts, die Steuer bleibt unverändert' },
      ],
    },
    {
      frage: 'Wie wird das Konto „Nachlässe für Rohstoffe“ abgeschlossen?',
      optionen: [
        { text: 'Nachlässe für Rohstoffe an Rohstoffe', richtig: true },
        { text: 'Rohstoffe an Nachlässe für Rohstoffe' },
        { text: 'Nachlässe für Rohstoffe an GuV' },
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
      'Gegen BA 3.1.4.1 (Abb. 61/62: Netto- und Bruttobuchung, Umbuchung auf das Oberkonto) und 3.1.5 geprüft; Bonus auf Nachlasskonto nach 04-fachregeln.md Konvention 4; Zahlen aus der Engine; 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
