// Lektion A7 – Erfolgsermittlung durch Eigenkapitalvergleich (eigene Formulierung; geprüft gegen BA 2.3.4)
import { Val, formatEuro } from '../../engine/money';
import type { Lektion } from './types';

// Zahlen von der Engine: Gewinn = EK Ende − EK Anfang + Privatentnahmen − Privateinlagen
const e = (v: Val) => formatEuro(v.value);
const erfolg = (anfang: string, ende: string, entnahmen: string, einlagen: string) =>
  new Val(ende).minus(anfang).plus(entnahmen).minus(einlagen);

const R_ANFANG = '300000';
const R_ENDE = '320000';
const R_ENTNAHMEN = '36000';
const R_DIFF = new Val(R_ENDE).minus(R_ANFANG);
const R_GEWINN = erfolg(R_ANFANG, R_ENDE, R_ENTNAHMEN, '0');

const V_ANFANG = '380000';
const V_ENDE = '410000';
const V_ENTNAHMEN = '48000';
const V_EINLAGEN = '10000';
const V_DIFF = new Val(V_ENDE).minus(V_ANFANG);
const V_ZWISCHEN = V_DIFF.plus(V_ENTNAHMEN);
const V_GEWINN = erfolg(V_ANFANG, V_ENDE, V_ENTNAHMEN, V_EINLAGEN);

const K_ANFANG = '420000';
const K_ENDE = '455000';
const K_ENTNAHMEN = '42000';
const K_EINLAGEN = '12000';
const K_DIFF = new Val(K_ENDE).minus(K_ANFANG);
const K_GEWINN = erfolg(K_ANFANG, K_ENDE, K_ENTNAHMEN, K_EINLAGEN);

export const lektionA7: Lektion = {
  id: 'A7',
  skillId: 'A7-ek-vergleich',
  abschnitt: 'A',
  titel: 'Die Spardose der Gesellschafter: Eigenkapitalvergleich',
  kernAha:
    'Gewinn = Eigenkapital am Ende − Eigenkapital am Anfang + Privatentnahmen − Privateinlagen. Entnahmen sind ein Vorgriff auf den Gewinn, Einlagen sind kein erwirtschafteter Zuwachs.',
  dauerMin: 6,
  figuren: ['sabine', 'frank', 'jana', 'leni', 'tobias'],
  ort: 'gesellschafter',
  quelle: 'BA 2.3.4; 3.3 (Konto Privat)',
  teaser: {
    figur: 'sabine',
    ausdruck: 'gruebelt',
    text: 'Wir haben uns jeden Monat etwas ausgezahlt. Verfälscht das unseren Gewinn?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'sabine',
          ausdruck: 'gruebelt',
          text: `Unser Eigenkapital ist nur um ${e(R_DIFF)} gestiegen. Dabei lief das Jahr richtig gut?`,
        },
        {
          figur: 'frank',
          ausdruck: 'neutral',
          text: 'Vielleicht liegt es daran, dass wir uns jeden Monat 3.000 € ausgezahlt haben.',
        },
      ],
      frage: 'Wie misst man den Gewinn, wenn die Eigentümer zwischendurch Geld herausnehmen?',
    },
    {
      typ: 'dialog',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Stell dir eine Spardose vor: Was am Ende mehr drin ist, ist dein Plus. Was du zwischendurch herausgenommen hast, gehört aber auch dazu.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Und Geld, das du von außen hineingesteckt hast, ist kein Gewinn. Das ziehen wir wieder ab.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Eigenkapital am 1.1.: ${e(new Val(R_ANFANG))}, am 31.12.: ${e(new Val(R_ENDE))}. Frank und Sabine haben zusammen ${e(new Val(R_ENTNAHMEN))} entnommen. Wie hoch war der Gewinn?`,
      optionen: [
        { text: e(R_DIFF) },
        { text: e(R_GEWINN), richtig: true },
        { text: e(R_DIFF.minus(R_ENTNAHMEN)) },
      ],
      aufloesung: `Das Eigenkapital ist um ${e(R_DIFF)} gewachsen, obwohl ${e(new Val(R_ENTNAHMEN))} herausgenommen wurden. Erwirtschaftet hat die MBG also ${e(R_DIFF)} + ${e(new Val(R_ENTNAHMEN))} = ${e(R_GEWINN)}.`,
    },
    {
      typ: 'konzept',
      titel: 'Gewinn per Eigenkapitalvergleich',
      text: 'Man vergleicht das Eigenkapital zweier Stichtage. Privatentnahmen werden hinzugerechnet, weil sie das Eigenkapital gesenkt haben. Privateinlagen werden abgezogen, weil sie nicht erwirtschaftet wurden.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Eigenkapital Ende − Anfang',
            text: 'Um wie viel ist das Eigenkapital gewachsen oder geschrumpft?',
            farbe: '#1c6670',
          },
          {
            titel: '+ Privatentnahmen',
            text: 'Ein Vorgriff auf den Gewinn – er war schon da, nur nicht mehr in der Firma.',
            farbe: '#e8792b',
          },
          {
            titel: '− Privateinlagen',
            text: 'Zufluss von außen, etwa eine Erbschaft – kein erwirtschafteter Gewinn.',
            farbe: '#e2b13c',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Entnahme, Einlage oder gar nichts Privates?',
      kategorien: ['Privatentnahme', 'Privateinlage', 'Kein Privatvorgang'],
      elemente: [
        {
          text: 'Frank überweist sich 3.000 € für die Renovierung seines Hauses.',
          kategorie: 'Privatentnahme',
        },
        {
          text: 'Sabine bringt ihren privaten Kombi als Firmenwagen ein.',
          kategorie: 'Privateinlage',
          erklaerung: 'Ein Sachwert aus der Privatsphäre erhöht das Eigenkapital.',
        },
        {
          text: 'Sabine nimmt Getränke aus dem Lager für ihre Geburtstagsfeier mit.',
          kategorie: 'Privatentnahme',
          erklaerung: 'Auch Waren und Erzeugnisse können privat entnommen werden.',
        },
        { text: 'Frank zahlt eine Erbschaft auf das Firmenkonto ein.', kategorie: 'Privateinlage' },
        {
          text: 'Die MBG überweist die Löhne der Mitarbeiter.',
          kategorie: 'Kein Privatvorgang',
          erklaerung: 'Löhne sind betrieblicher Aufwand.',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Der Eigenkapitalvergleich der MBG',
      text: `Eigenkapital am 1.1.: ${e(new Val(V_ANFANG))}, am 31.12.: ${e(new Val(V_ENDE))}. Entnahmen: ${e(new Val(V_ENTNAHMEN))}, Einlage: ${e(new Val(V_EINLAGEN))}.`,
      schritte: [
        {
          text: 'Veränderung des Eigenkapitals',
          rechnung: `${e(new Val(V_ENDE))} − ${e(new Val(V_ANFANG))} = ${e(V_DIFF)}`,
          warum: 'So viel mehr steckt am Jahresende im Unternehmen.',
        },
        {
          text: 'Privatentnahmen hinzurechnen',
          rechnung: `${e(V_DIFF)} + ${e(new Val(V_ENTNAHMEN))} = ${e(V_ZWISCHEN)}`,
          warum: 'Die Entnahmen haben das Eigenkapital gesenkt, waren aber erwirtschaftet.',
        },
        {
          text: 'Privateinlagen abziehen',
          rechnung: `${e(V_ZWISCHEN)} − ${e(new Val(V_EINLAGEN))} = ${e(V_GEWINN)}`,
          warum:
            'Die Einlage hat das Eigenkapital erhöht, ohne dass die MBG dafür etwas geleistet hat.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Mindern Privatentnahmen den Gewinn?',
      a: {
        figur: 'tobias',
        ausdruck: 'neutral',
        text: 'Klar, Geld ist weg. Also ist eine Entnahme Aufwand.',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Entnahmen mindern das Eigenkapital, aber nicht den Gewinn. Sie laufen über das Konto Privat.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Entnahmen sind privat veranlasst – sie werden auf dem Konto Privat gebucht, nicht über die GuV.',
          richtig: true,
        },
        { text: 'Entnahmen sind Aufwand, weil Geld das Unternehmen verlässt.' },
        { text: 'Entnahmen erhöhen den Gewinn.' },
      ],
      aufloesung:
        'Aufwand ist Werteverzehr für den Betrieb. Eine Privatentnahme dient dem privaten Leben der Gesellschafter. Das Konto Privat ist ein Unterkonto des Eigenkapitals und wird am Jahresende direkt ins Eigenkapital abgeschlossen.',
    },
    {
      typ: 'fehlerjagd',
      titel: 'Tobias rechnet nach',
      text: 'In Tobias’ Rechnung steckt ein Fehler. Tippe die falsche Zeile an.',
      zeilen: [
        'Eigenkapital Ende 250.000 € − Eigenkapital Anfang 230.000 € = 20.000 €',
        '+ Privatentnahmen 24.000 € = 44.000 €',
        '+ Privateinlagen 5.000 € = 49.000 €',
      ],
      fehlerZeile: 2,
      gruende: [
        { text: 'Privateinlagen werden abgezogen, nicht hinzugerechnet.', richtig: true },
        { text: 'Privatentnahmen werden abgezogen.' },
        { text: 'Die Veränderung des Eigenkapitals ist falsch berechnet.' },
      ],
      aufloesung:
        'Einlagen haben das Eigenkapital erhöht, ohne erwirtschaftet zu sein. Richtig: 44.000 € − 5.000 € = 39.000 € Gewinn.',
    },
    {
      typ: 'verstaendnis',
      frage: 'Wohin wird das Konto Privat am Jahresende abgeschlossen?',
      optionen: [
        {
          text: 'Über das Eigenkapital',
          richtig: true,
          erklaerung:
            'Richtig. Privat ist ein Unterkonto des Eigenkapitals: Entnahmen im Soll, Einlagen im Haben.',
        },
        {
          text: 'Über die Gewinn- und Verlustrechnung',
          erklaerung:
            'Dann würden Privatvorgänge den Gewinn verfälschen. Privat geht direkt ins Eigenkapital.',
        },
        {
          text: 'Über das Schlussbilanzkonto',
          erklaerung:
            'Privat ist kein eigener Bilanzposten, sondern ein Unterkonto des Eigenkapitals.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'A7-m1',
      frage: 'Wie ermittelt man den Gewinn durch Eigenkapitalvergleich?',
      text: 'Gewinn = Eigenkapital am Ende − Eigenkapital am Anfang + Privatentnahmen − Privateinlagen. Das Konto Privat ist ein Unterkonto des Eigenkapitals: Entnahmen im Soll, Einlagen im Haben.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe: `Das Eigenkapital der MBG beträgt am 1.1. ${e(new Val(K_ANFANG))} und am 31.12. ${e(new Val(K_ENDE))}. Die Gesellschafter haben ${e(new Val(K_ENTNAHMEN))} entnommen und ${e(new Val(K_EINLAGEN))} eingelegt. Ermitteln Sie den Erfolg durch Eigenkapitalvergleich.`,
      part: {
        typ: 'rechenkette',
        id: 'ek-vergleich',
        titel: 'Eigenkapitalvergleich',
        felder: [
          {
            typ: 'zahl',
            id: 'diff',
            label: 'Veränderung des Eigenkapitals',
            kind: 'betrag',
            einheit: '€',
            soll: K_DIFF,
          },
          {
            typ: 'zahl',
            id: 'erfolg',
            label: 'Erfolg des Geschäftsjahres',
            kind: 'betrag',
            einheit: '€',
            soll: K_GEWINN,
          },
          {
            typ: 'auswahl',
            id: 'art',
            label: 'Ergebnis',
            optionen: ['Gewinn', 'Verlust'],
            soll: 'Gewinn',
          },
        ],
      },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'ueberrascht',
        text: 'Der Dosenlieferant hat eine Rechnung mit drei Beträgen geschickt. Was kosten uns die Dosen denn nun wirklich?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'EK Anfang 100.000 €, EK Ende 110.000 €, Entnahmen 15.000 €. Gewinn?',
      optionen: [{ text: '25.000 €', richtig: true }, { text: '10.000 €' }, { text: '−5.000 €' }],
    },
    {
      frage: 'Wie werden Privateinlagen beim Eigenkapitalvergleich behandelt?',
      optionen: [
        { text: 'Sie werden abgezogen.', richtig: true },
        { text: 'Sie werden hinzugerechnet.' },
        { text: 'Sie spielen keine Rolle.' },
      ],
    },
    {
      frage: 'Auf welcher Seite des Kontos Privat stehen Entnahmen?',
      optionen: [
        { text: 'Im Soll', richtig: true },
        { text: 'Im Haben' },
        { text: 'Auf keinem Konto' },
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
      'BA 2.3.4 (Eigenkapitalvergleich mit Privatentnahmen/-einlagen), BA 3.3 Fußnote 30 (Konto Privat als Unterkonto des EK) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
