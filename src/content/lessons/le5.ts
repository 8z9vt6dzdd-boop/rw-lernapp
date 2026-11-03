// Lektion E5 – Kompletter Geschäftsgang (eigene Formulierung; Ablauf nach BA 2.3.2–2.3.3:
// Eröffnung, laufende Buchungen, Abschluss der Erfolgskonten über die GuV, Saldo ins Eigenkapital,
// Bestandskonten ins Schlussbilanzkonto; Bestandsveränderungen nach 04-fachregeln.md, Abschnitt 7).
// Alle Beträge stammen aus dem Geschäftsgang-Fall der Engine (src/engine/faelle/geschaeftsgang.ts).
import {
  generateGeschaeftsgang,
  geschaeftsgangFall,
  solveGeschaeftsgang,
} from '../../engine/faelle/geschaeftsgang';
import { dec, formatEuro, type Dec } from '../../engine/money';
import { createRng } from '../../engine/rng';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const e = (x: Dec | string) => formatEuro(x);

// Datenstand der Lektion: derselbe Fall wie im Fallmodus (Seed fest)
const SEED = 7;
const P = generateGeschaeftsgang(createRng(SEED));
const S = solveGeschaeftsgang(P);
const FALL = geschaeftsgangFall(SEED);
const KLAUSUR_TEIL = FALL.schritte
  .find((s) => s.id === 'abschluss')!
  .parts.find((p) => p.id === 'verbrauch') as TaskPart;

const SKONTO_NETTO = dec(P.einkauf).times('0.02');
const BANK_ENDE = S.bank.saldo;
const BANK_DELTA = BANK_ENDE.minus(P.ab.bank);
const EK_OHNE_PRIVAT = S.ekAnfang.plus(S.gewinn);
const EK_PRIVAT_PLUS = S.ekSchluss.plus(dec(P.privat).times(2));

const BANK_TEXT: Record<string, string> = {
  'Forderungen aus Lieferungen und Leistungen': 'Kunde zahlt',
  'Verbindlichkeiten aus Lieferungen und Leistungen': 'Zahlung an den Lieferanten',
  Löhne: 'Lohnzahlung',
  Privat: 'Privatentnahme',
};
const bankVorgaenge = [
  ...S.bank.soll
    .filter((x) => x.text !== 'Anfangsbestand (EBK)')
    .map((x) => ({
      text: BANK_TEXT[x.text] ?? x.text,
      betrag: x.betrag.toFixed(2),
      seite: 'soll' as const,
    })),
  ...S.bank.haben.map((x) => ({
    text: BANK_TEXT[x.text] ?? x.text,
    betrag: x.betrag.toFixed(2),
    seite: 'haben' as const,
  })),
];

export const lektionE5: Lektion = {
  id: 'E5',
  skillId: 'E5-geschaeftsgang',
  abschnitt: 'E',
  titel: 'Ein ganzes Geschäftsjahr am Stück',
  kernAha:
    'Ein Geschäftsgang folgt immer derselben Reihenfolge: eröffnen, laufend buchen, vorbereitende Abschlussbuchungen, Erfolgskonten über die GuV ins Eigenkapital, Bestandskonten ins Schlussbilanzkonto. Wer die Reihenfolge kennt, löst jeden Fall Schritt für Schritt.',
  dauerMin: 8,
  figuren: ['jana', 'tobias', 'frank'],
  ort: 'buero',
  quelle: 'BA 2.3.2–2.3.3 (Kontenabschluss); 04-fachregeln.md (Abschnitt 7); Fall E5 der Engine',
  teaser: {
    figur: 'jana',
    ausdruck: 'freut',
    text: 'Heute buchen wir ein ganzes Geschäftsjahr, vom ersten Januar bis zur Schlussbilanz.',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      visual: { typ: 'kreislauf' },
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'freut',
          text: 'Alle Bausteine hast du schon. Heute setzen wir ein ganzes Geschäftsjahr der MBG zusammen.',
        },
        {
          figur: 'tobias',
          ausdruck: 'entsetzt',
          text: 'Alles auf einmal? Da verliere ich doch nach drei Buchungen den Überblick.',
        },
      ],
      frage: 'Wie behält man bei einem ganzen Geschäftsjahr den Überblick?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Wie bei einem Umzug: erst Kartons packen, dann tragen, dann auspacken. Wer zuerst auspackt, sucht ewig.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Ein Geschäftsgang hat feste Etappen. Jede Buchung gehört in genau eine davon.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'In welche Etappe gehört das?',
      kategorien: ['Eröffnung', 'Laufende Buchung', 'Vorbereitende Abschlussbuchung', 'Abschluss'],
      elemente: [
        {
          text: 'Anfangsbestand Bank über das Eröffnungsbilanzkonto vortragen',
          kategorie: 'Eröffnung',
        },
        { text: 'Verkauf von Senne Lemon auf Ziel', kategorie: 'Laufende Buchung' },
        { text: 'Lohnzahlung per Bank', kategorie: 'Laufende Buchung' },
        {
          text: 'Rohstoffverbrauch laut Inventur buchen',
          kategorie: 'Vorbereitende Abschlussbuchung',
          erklaerung: 'Erst die Inventur am Jahresende zeigt, was verbraucht wurde.',
        },
        { text: 'Abschreibung auf die Maschinen', kategorie: 'Vorbereitende Abschlussbuchung' },
        {
          text: 'Vorsteuer mit Umsatzsteuer verrechnen',
          kategorie: 'Vorbereitende Abschlussbuchung',
        },
        { text: 'Gewinn vom GuV-Konto auf das Eigenkapital übertragen', kategorie: 'Abschluss' },
        { text: 'Bank über das Schlussbilanzkonto abschließen', kategorie: 'Abschluss' },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Vorbereitende Abschlussbuchungen',
      text: 'Bevor Konten abgeschlossen werden, kommen Inventurwerte und Korrekturen hinein: Unterkonten abschließen, Verbrauch und Bestandsveränderungen, Abschreibungen, Steuerverrechnung, Privatkonto ins Eigenkapital. Erst danach stimmen GuV und Schlussbilanz.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Unterkonten',
            text: `Nachlässe für Rohstoffe ${e(SKONTO_NETTO)} an Rohstoffe`,
            farbe: '#4a9fd8',
          },
          {
            titel: 'Inventur',
            text: 'Verbrauch der Rohstoffe, Bestandsveränderung der Erzeugnisse',
            farbe: '#1c6670',
          },
          { titel: 'Abschreibung', text: `${e(P.afa)} auf die Maschinen`, farbe: '#e8792b' },
          {
            titel: 'Steuern und Privat',
            text: 'Umsatzsteuer an Vorsteuer, Eigenkapital an Privat',
            farbe: '#8cbf3f',
          },
        ],
      },
    },
    {
      typ: 'erkunden',
      titel: 'Das Bankkonto durchs Jahr',
      text: 'Trage die Vorgänge des Jahres in das Konto Bank ein. Zugang oder Abgang?',
      erkunden: {
        art: 'tkonto-buchen',
        konto: 'Bank',
        anfang: { seite: 'soll', text: 'Anfangsbestand (EBK)', betrag: dec(P.ab.bank).toFixed(2) },
        vorgaenge: bankVorgaenge,
      },
      fazit: `Am Jahresende stehen ${e(BANK_ENDE)} auf dem Konto. Der Saldo steht im Haben und geht als Schlussbestand ins Schlussbilanzkonto: Schlussbilanzkonto an Bank.`,
    },
    {
      typ: 'vorhersage',
      frage: `Die MBG macht in diesem Jahr ${e(S.gewinn)} Gewinn. Wie hat sich das Bankkonto verändert?`,
      optionen: [
        {
          text: 'Anders als der Gewinn: Viele Erträge und Aufwendungen bewegen kein Geld.',
          richtig: true,
        },
        { text: `Es ist genau um ${e(S.gewinn)} gestiegen.` },
        { text: 'Um den Gewinn minus Privatentnahme gestiegen.' },
      ],
      aufloesung: `Die Bank hat sich um ${e(BANK_DELTA)} verändert, der Gewinn beträgt ${e(S.gewinn)}. Der Verkauf auf Ziel (${e(P.verkauf)} netto) ist noch nicht bezahlt, die Abschreibung von ${e(P.afa)} kostet kein Geld, und die Privatentnahme nimmt Geld weg, ohne Aufwand zu sein. Gewinn ist nicht gleich Geld auf dem Konto.`,
    },
    {
      typ: 'wer-hat-recht',
      frage: `Frank Wessel hat ${e(P.privat)} für private Zwecke entnommen. Wohin gehört das?`,
      a: {
        figur: 'tobias',
        ausdruck: 'neutral',
        text: 'Das Geld ist weg, also ist es Aufwand. Ab damit in die GuV.',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Privatentnahmen sind kein Aufwand. Sie laufen über das Privatkonto und mindern direkt das Eigenkapital.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Die Entnahme hat mit dem Betrieb nichts zu tun: Privat an Bank, im Abschluss Eigenkapital an Privat.',
          richtig: true,
        },
        { text: 'Entnahmen werden über die Rückstellungen gebucht.' },
        { text: 'Entnahmen erhöhen das Eigenkapital, weil der Gesellschafter Geld bekommt.' },
      ],
      aufloesung:
        'Als Aufwand gebucht, wäre der Gewinn zu niedrig ausgewiesen. Das Eigenkapital am Ende stimmt nur, wenn die Entnahme über das Privatkonto läuft.',
    },
    {
      typ: 'vorgerechnet',
      titel: 'Der Abschluss in vier Schritten',
      text: 'Alle vorbereitenden Abschlussbuchungen sind gebucht. Jetzt werden die Konten geschlossen.',
      visual: { typ: 'kreislauf', aktiv: 3 },
      schritte: [
        {
          text: 'Aufwandskonten schließen',
          rechnung: `Gewinn- und Verlustkonto an Löhne ${e(P.loehne)} (ebenso Rohstoffaufwand und Abschreibungen)`,
          warum: 'Aufwand steht im Soll und wandert auf die Sollseite der GuV.',
        },
        {
          text: 'Ertragskonten schließen',
          rechnung: `Umsatzerlöse an Gewinn- und Verlustkonto ${e(P.verkauf)}`,
          warum:
            'Erträge stehen im Haben und wandern auf die Habenseite der GuV. Ein Mehrbestand steht dort ebenfalls im Haben, ein Minderbestand im Soll.',
        },
        {
          text: 'GuV ins Eigenkapital',
          rechnung: `Erträge ${e(S.ertraege)} − Aufwendungen ${e(S.aufwendungen)} = Gewinn ${e(S.gewinn)}; Gewinn- und Verlustkonto an Eigenkapital`,
          warum: 'Der Gewinn gehört den Gesellschaftern und erhöht das Eigenkapital.',
        },
        {
          text: 'Bestandskonten ins Schlussbilanzkonto',
          rechnung: `Schlussbilanzkonto an Bank ${e(BANK_ENDE)}; Eigenkapital an Schlussbilanzkonto ${e(S.ekSchluss)}`,
          warum:
            'Aktivkonten schließen im Haben, Passivkonten im Soll. Die Schlussbilanz geht auf, Summe beider Seiten ' +
            e(S.bilanzsumme) +
            '.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege schließt ab',
      text: 'Eine der vier Abschlussbuchungen ist falsch. Tippe sie an.',
      zeilen: [
        `Gewinn- und Verlustkonto an Löhne ${e(P.loehne)}`,
        `Umsatzerlöse an Gewinn- und Verlustkonto ${e(P.verkauf)}`,
        `Gewinn- und Verlustkonto an Eigenkapital ${e(S.gewinn)}`,
        `Bank an Schlussbilanzkonto ${e(BANK_ENDE)}`,
      ],
      fehlerZeile: 3,
      gruende: [
        {
          text: 'Bank ist ein Aktivkonto: Der Schlussbestand steht im Haben, also Schlussbilanzkonto an Bank.',
          richtig: true,
        },
        { text: 'Löhne werden über das Schlussbilanzkonto abgeschlossen.' },
        { text: 'Ein Gewinn wird mit Eigenkapital an GuV gebucht.' },
      ],
      aufloesung:
        'Aktivkonten stehen im Schlussbilanzkonto links, deshalb Schlussbilanzkonto an Bank. Erfolgskonten wie Löhne laufen über die GuV.',
    },
    {
      typ: 'verstaendnis',
      frage: `Eigenkapital am Jahresanfang ${e(S.ekAnfang)}, Gewinn ${e(S.gewinn)}, Privatentnahme ${e(P.privat)}. Wie hoch ist das Eigenkapital am Jahresende?`,
      optionen: [
        {
          text: e(S.ekSchluss),
          richtig: true,
          erklaerung: `${e(S.ekAnfang)} + ${e(S.gewinn)} − ${e(P.privat)} = ${e(S.ekSchluss)}.`,
        },
        {
          text: e(EK_OHNE_PRIVAT),
          erklaerung: 'Die Privatentnahme fehlt. Sie mindert das Eigenkapital.',
        },
        { text: e(EK_PRIVAT_PLUS), erklaerung: 'Die Entnahme wurde addiert statt abgezogen.' },
      ],
    },
    {
      typ: 'merksatz',
      id: 'E5-m1',
      frage: 'In welcher Reihenfolge läuft ein kompletter Geschäftsgang ab?',
      text: '1. Eröffnen über das Eröffnungsbilanzkonto. 2. Laufend buchen. 3. Vorbereitende Abschlussbuchungen: Unterkonten, Inventurwerte, Abschreibungen, Steuern, Privat. 4. Erfolgskonten über die GuV, Saldo ins Eigenkapital. 5. Bestandskonten ins Schlussbilanzkonto.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe: `Rohstoffe: Anfangsbestand ${e(P.ab.rohstoffe)}, Zugang ${e(P.einkauf)} netto, das Konto Nachlässe für Rohstoffe (${e(SKONTO_NETTO)}) ist bereits über Rohstoffe abgeschlossen. Schlussbestand laut Inventur ${e(P.sbRohstoffe)}. Bilden Sie den Buchungssatz für den Rohstoffverbrauch (bestandsorientierte Erfassung).`,
      part: KLAUSUR_TEIL,
      cliffhanger: {
        figur: 'frank',
        ausdruck: 'gruebelt',
        text: 'Die Schlussbilanz steht, alles geht auf. Aber zeigt sie eigentlich, was die MBG wirklich wert ist?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Was kommt im Geschäftsgang direkt vor dem Abschluss der Erfolgskonten über die GuV?',
      optionen: [
        {
          text: 'Die vorbereitenden Abschlussbuchungen, zum Beispiel Abschreibungen und Inventurwerte',
          richtig: true,
        },
        { text: 'Die Eröffnung über das Eröffnungsbilanzkonto' },
        { text: 'Der Abschluss der Bestandskonten über das Schlussbilanzkonto' },
      ],
    },
    {
      frage: 'Wie wird ein Gewinn im GuV-Konto abgeschlossen?',
      optionen: [
        { text: 'Gewinn- und Verlustkonto an Eigenkapital', richtig: true },
        { text: 'Eigenkapital an Gewinn- und Verlustkonto' },
        { text: 'Gewinn- und Verlustkonto an Schlussbilanzkonto' },
      ],
    },
    {
      frage:
        'Eigenkapital Anfang 100.000 €, Gewinn 20.000 €, Privatentnahmen 5.000 €. Eigenkapital Ende?',
      optionen: [
        { text: '115.000 €', richtig: true },
        { text: '120.000 €' },
        { text: '125.000 €' },
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
      'Ablauf und Abschlussbuchungen nach BA 2.3.2–2.3.3 und 04-fachregeln.md (Abschnitt 7: Bestandsveränderungen im GuV-Konto); alle Beträge aus geschaeftsgangFall/solveGeschaeftsgang (Seed 7); 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
