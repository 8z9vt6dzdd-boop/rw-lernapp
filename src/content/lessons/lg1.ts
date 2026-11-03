// Lektion G1 – Auszahlung, Ausgabe, Aufwand, Kosten (eigene Formulierung; geprüft gegen K1 Kap. 1.2,
// S. 21–29). Alle Beträge und Zuordnungen kommen aus der Engine (generators/g/g1-grundbegriffe.ts).
import { FIRMA } from '../../config';
import {
  solveG1,
  stufenFelder,
  vorfallG1,
  vorfallText,
  type G1Params,
} from '../../engine/generators/g/g1-grundbegriffe';
import { formatEuro } from '../../engine/money';
import type { Val } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value.toString());

// Vorgerechnetes Beispiel: ein Januar mit vier Vorgängen (GC-G1-2 aus docs/m7/g.md)
const JANUAR: G1Params = {
  variante: 'betraege',
  vorfaelle: [
    { id: 'zielkauf-teilverbrauch', betrag: '20000', verbrauch: '12000' },
    { id: 'verbindlichkeit-bezahlt', betrag: '8000' },
    { id: 'spende', betrag: '1500' },
    { id: 'unternehmerlohn', betrag: '9000' },
  ],
};
const S = solveG1(JANUAR);
const [AUSZ, AUSG, AUFW, KOST] = S.summen as [Val, Val, Val, Val];
const T = JANUAR.vorfaelle.map((v) => vorfallText(v, FIRMA));

// Klausurbrücke: zwei Vorgänge aus dem Engine-Katalog
const K1 = vorfallG1('zielkauf-lager');
const K2 = vorfallG1('produktion-lager');

export const lektionG1: Lektion = {
  id: 'G1',
  skillId: 'G1-grundbegriffe',
  abschnitt: 'G',
  titel: 'Auszahlung, Ausgabe, Aufwand, Kosten: vier Wörter für Geld?',
  kernAha:
    'Die vier Begriffe messen Verschiedenes: Auszahlung = Geld fließt ab, Ausgabe = Geldvermögen sinkt (auch auf Ziel), Aufwand = Verbrauch der Periode, Kosten = betrieblicher, periodenbezogener und gewöhnlicher Verbrauch. Sie fallen auseinander bei Kreditvorgängen, bei Bestandsveränderungen (Lager, Anlagen) und bei neutralen oder kalkulatorischen Posten.',
  dauerMin: 8,
  figuren: ['leni', 'tobias', 'jana'],
  ort: 'besprechung',
  quelle: 'K1 1.2 (S. 21–29)',
  teaser: {
    figur: 'leni',
    ausdruck: 'gruebelt',
    text: 'Neues Jahr, neue Aufgabe: Die MBG bekommt eine Kostenrechnung. Aber was genau sind eigentlich Kosten?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Im Januar haben wir Aromen für 20.000 € gekauft. Also hatten wir 20.000 € Kosten, ganz einfach.',
        },
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: 'Bezahlt haben wir die Rechnung aber noch gar nicht. Und verbraucht ist bisher nur ein Teil.',
        },
      ],
      frage: 'Hat die MBG im Januar nun Geld ausgegeben, Aufwand gehabt oder Kosten verursacht?',
    },
    {
      typ: 'dialog',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Denk an den Wocheneinkauf mit Kreditkarte: Du kaufst heute, abgebucht wird nächsten Monat, gegessen wird nach und nach.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Kaufen, Bezahlen und Verbrauchen passieren zu verschiedenen Zeiten. Dafür hat das Rechnungswesen vier Begriffe.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Die MBG kauft Aromen auf Ziel und legt sie ins Lager; verarbeitet werden sie erst im März. Was liegt im Januar vor?`,
      optionen: [
        { text: 'Eine Auszahlung und Kosten' },
        { text: 'Eine Ausgabe – aber weder Auszahlung noch Aufwand', richtig: true },
        { text: 'Aufwand, weil die Rechnung gebucht wird' },
      ],
      aufloesung:
        'Auf Ziel gekauft: Die Verbindlichkeit steigt, das Geldvermögen sinkt – das ist eine Ausgabe. Geld fließt erst später (Auszahlung), verbraucht wird erst im März (Aufwand und Kosten).',
    },
    {
      typ: 'konzept',
      titel: 'Vier Stufen',
      text: 'Auszahlung: Geld verlässt Kasse oder Bank. Ausgabe: Das Geldvermögen sinkt. Aufwand: Güter werden in der Periode verbraucht. Kosten: Der Verbrauch dient der betrieblichen Leistung. Auf der Gegenseite: Einzahlung, Einnahme, Ertrag, Leistung.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Auszahlung',
            text: 'Abfluss von Bargeld und Bankguthaben',
            farbe: '#1c6670',
          },
          {
            titel: 'Ausgabe',
            text: 'Geldvermögen sinkt (Kasse + Forderungen − Verbindlichkeiten)',
            farbe: '#8cbf3f',
          },
          {
            titel: 'Aufwand',
            text: 'Verbrauch von Gütern und Dienstleistungen in der Periode (Buchhaltung)',
            farbe: '#e8792b',
          },
          {
            titel: 'Kosten',
            text: 'Verbrauch für Herstellung, Absatz und Betriebsbereitschaft (Kostenrechnung)',
            farbe: '#e2b13c',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Wo fallen die Stufen auseinander?',
      text: 'Ordne jeden Vorgang des Januars zu.',
      kategorien: [
        'Nur Auszahlung',
        'Nur Ausgabe',
        'Aufwand und Kosten, aber keine Ausgabe',
        'Nur Kosten',
      ],
      elemente: [
        {
          text: 'Überweisung an den Aromenlieferanten für die Dezember-Rechnung',
          kategorie: 'Nur Auszahlung',
          erklaerung: 'Das Geld geht, die Schuld sinkt genauso: Das Geldvermögen bleibt gleich.',
        },
        { text: 'Tilgungsrate für das Bankdarlehen', kategorie: 'Nur Auszahlung' },
        {
          text: 'Etiketten auf Ziel gekauft, sie liegen im Lager',
          kategorie: 'Nur Ausgabe',
        },
        {
          text: 'Zucker aus dem Dezember-Bestand wird zu Sirup verarbeitet',
          kategorie: 'Aufwand und Kosten, aber keine Ausgabe',
          erklaerung: 'Die Ausgabe lag schon im Dezember beim Kauf.',
        },
        {
          text: 'Kalkulatorischer Unternehmerlohn für Frank und Sabine Wessel',
          kategorie: 'Nur Kosten',
          erklaerung: 'Die Gesellschafter bekommen kein Gehalt; die Buchhaltung bucht nichts.',
        },
        { text: 'Kalkulatorische Zinsen auf das Eigenkapital', kategorie: 'Nur Kosten' },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage:
        'Aromen für 20.000 € auf Ziel gekauft, davon für 12.000 € im Januar verbraucht. Wie hoch sind die Kosten des Januars?',
      a: {
        figur: 'tobias',
        ausdruck: 'neutral',
        text: 'Gekauft ist gekauft: 20.000 € Kosten.',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Kosten sind nur die 12.000 €, die verbraucht wurden. Die 20.000 € sind eine Ausgabe.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Aufwand und Kosten entstehen erst mit dem Verbrauch; was im Lager liegt, ist nur eingekauft.',
          richtig: true,
        },
        { text: 'Kosten entstehen erst, wenn die Rechnung bezahlt ist.' },
        { text: 'Bei Zieleinkäufen gibt es nie Kosten.' },
      ],
      aufloesung:
        'Die Ausgabe beträgt 20.000 € (Verbindlichkeit), die Auszahlung kommt erst mit der Überweisung. Aufwand und Kosten: 12.000 € für den verbrauchten Teil.',
    },
    {
      typ: 'vorgerechnet',
      titel: 'Ein Januar, vier Summen',
      text: T.map((t, i) => `${i + 1}) ${t}`).join(' '),
      schritte: [
        {
          text: 'Auszahlungen',
          rechnung: `Überweisung ${formatEuro('8000')} + Spende ${formatEuro('1500')} = ${e(AUSZ)}`,
          warum:
            'Nur dort verlässt im Januar Geld das Bankkonto. Der Zieleinkauf wird später bezahlt.',
        },
        {
          text: 'Ausgaben',
          rechnung: `Zieleinkauf ${formatEuro('20000')} + Spende ${formatEuro('1500')} = ${e(AUSG)}`,
          warum:
            'Die Überweisung ist keine Ausgabe: Die Schuld sinkt im selben Umfang wie das Bankkonto.',
        },
        {
          text: 'Aufwand',
          rechnung: `Verbrauch ${formatEuro('12000')} + Spende ${formatEuro('1500')} = ${e(AUFW)}`,
          warum: 'Aufwand ist der Verbrauch der Periode. Die Spende zählt in der Buchhaltung dazu.',
        },
        {
          text: 'Kosten',
          rechnung: `Verbrauch ${formatEuro('12000')} + Unternehmerlohn ${formatEuro('9000')} = ${e(KOST)}`,
          warum:
            'Die Spende dient nicht dem Betrieb – keine Kosten. Der kalkulatorische Unternehmerlohn ist Kosten ohne Aufwand.',
        },
      ],
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Ein anderer Januar mit neuen Zahlen. Ermittle die Summe der Ausgaben und die Summe der Kosten.',
      skillId: 'G1-grundbegriffe',
      seed: 11,
      variant: 'betraege',
      partId: 'summen',
      gefragt: ['ausgaben', 'kosten'],
    },
    {
      typ: 'verstaendnis',
      frage: 'Die MBG spendet 2.000 € per Überweisung an einen Sportverein. Was liegt vor?',
      figur: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Gute Sache, keine Frage. Aber kostet sie uns etwas für die Getränke?',
      },
      optionen: [
        {
          text: 'Auszahlung, Ausgabe und Aufwand – aber keine Kosten',
          richtig: true,
          erklaerung:
            'Die Spende mindert den Gewinn der Buchhaltung (Aufwand). Mit Herstellung und Absatz von Getränken hat sie nichts zu tun: keine Kosten.',
        },
        {
          text: 'Alle vier Stufen',
          erklaerung: 'Kosten sind nur betrieblicher Verbrauch. Die Spende ist neutraler Aufwand.',
        },
        {
          text: 'Nur eine Auszahlung',
          erklaerung:
            'Anders als bei einer Tilgung sinkt hier keine Schuld: Das Geldvermögen nimmt ab, und die Buchhaltung bucht Aufwand.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'G1-m1',
      frage: 'Wie unterscheiden sich Auszahlung, Ausgabe, Aufwand und Kosten?',
      text: 'Auszahlung: Geld fließt ab. Ausgabe: Geldvermögen sinkt, auch beim Kauf auf Ziel. Aufwand: Verbrauch von Gütern in der Periode. Kosten: betrieblicher, periodenbezogener und gewöhnlicher Verbrauch. Kreditvorgänge trennen Auszahlung und Ausgabe, Bestandsveränderungen (Lager, Anlagen) trennen Ausgabe und Aufwand, neutrale und kalkulatorische Posten trennen Aufwand und Kosten.',
    },
    {
      typ: 'verstaendnis',
      frage:
        'Im Januar werden Dosen Paderquell Energy abgefüllt und eingelagert; verkauft werden sie erst im Februar. Was liegt im Januar vor?',
      optionen: [
        {
          text: 'Ertrag und Leistung, aber weder Einzahlung noch Einnahme',
          richtig: true,
          erklaerung:
            'Die Herstellung erhöht das Vermögen schon im Januar. Geld und Forderung kommen erst mit dem Verkauf im Februar.',
        },
        {
          text: 'Einnahme, weil die Dosen etwas wert sind',
          erklaerung: 'Eine Einnahme entsteht erst mit dem Verkauf, auch wenn er auf Ziel erfolgt.',
        },
        {
          text: 'Gar nichts, solange nichts verkauft ist',
          erklaerung:
            'Der Wertzuwachs durch die Herstellung zählt schon: Er ist Ertrag der Periode und betriebliche Leistung.',
        },
      ],
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe: `Prüfen Sie für die folgenden Vorgänge, ob im Januar eine Auszahlung, Ausgabe, ein Aufwand oder Kosten bzw. eine Einzahlung, Einnahme, ein Ertrag oder eine Leistung vorliegt. 1) ${K1.text('6000', FIRMA)} 2) ${K2.text('18000', FIRMA)}`,
      part: {
        typ: 'rechenkette',
        id: 'stufen',
        titel: 'Was liegt im Januar vor?',
        felder: [...stufenFelder(K1, 1), ...stufenFelder(K2, 2)],
      },
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Die Buchhaltung meldet für Januar 690.000 € Aufwand. Morgen sortieren wir aus, was davon wirklich Kosten sind.',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Die MBG bezahlt per Überweisung eine Lieferantenrechnung aus dem Vormonat. Was liegt vor?',
      optionen: [
        { text: 'Nur eine Auszahlung', richtig: true },
        { text: 'Auszahlung und Ausgabe' },
        { text: 'Auszahlung, Ausgabe und Aufwand' },
      ],
    },
    {
      frage: 'Zucker aus dem Lagerbestand des Vormonats wird verarbeitet. Was liegt vor?',
      optionen: [
        { text: 'Aufwand und Kosten, aber keine Ausgabe', richtig: true },
        { text: 'Ausgabe und Aufwand' },
        { text: 'Nur Kosten' },
      ],
    },
    {
      frage: 'Welcher Posten ist Kosten, aber kein Aufwand?',
      optionen: [
        { text: 'Kalkulatorischer Unternehmerlohn', richtig: true },
        { text: 'Spende an einen Verein' },
        { text: 'Gehälter der Verwaltung' },
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
      'K1 1.2 (S. 21–29: Strömungs- und Bestandsgrößen, Fälle 1–18, Geldvermögen = Kasse + Forderungen − Verbindlichkeiten, Kosten = betriebsbezogener Güterverzehr, Zusatzkosten, Zusatzleistung) abgeglichen am 03.11.2026; Zahlen aus der Engine (GC-G1-2)',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
