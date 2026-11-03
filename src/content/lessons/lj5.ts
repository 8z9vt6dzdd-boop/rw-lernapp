// Lektion J5 – Maschinenstundensatz (eigene Formulierung; geprüft gegen K2 Kap. 2.2.5, S. 73–76).
// Alle Beträge werden von der Engine berechnet.
import {
  maschinensatz,
  solveMaschinensatz,
  type MaschinenParams,
} from '../../engine/generators/j/maschinensatz';
import { dec, formatEuro, formatPlain, formatProzent } from '../../engine/money';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const BEISPIEL: MaschinenParams = {
  variante: 'stundensatz',
  anlage: 'neue Dosenabfüllanlage der Linie 3',
  wbw: '960000',
  nd: 8,
  zinssatz: '0.08',
  flaeche: 80,
  raumSatz: '15',
  raumJe: 'monat',
  energie: {
    art: 'leistung',
    kw: 60,
    leistungsgrad: '0.75',
    grundpreis: '12',
    arbeitspreis: '0.2',
  },
  instand: { art: 'faktor', faktor: '0.4' },
  laufzeit: 2_000,
};
const S = solveMaschinensatz(BEISPIEL).werte;
const FALSCH_ZINS = solveMaschinensatz(BEISPIEL, { zinsenVoll: true }).werte;
const E = BEISPIEL.energie as Extract<MaschinenParams['energie'], { art: 'leistung' }>;
const FAKTOR = (BEISPIEL.instand as { art: 'faktor'; faktor: string }).faktor;
const MEHR_STUNDEN = 2_500;
const SATZ_MEHR = S.get('summe').div(MEHR_STUNDEN);

// Kalkulation eines Auftrags mit diesem Satz
const AUFTRAG: MaschinenParams = {
  variante: 'kalkulation',
  anlage: BEISPIEL.anlage,
  auftrag: '1.200 Kartons Senne Lemon 0,33 l',
  fm: '4000',
  mgk: '0.1',
  fl: '1200',
  restFgk: '0.8',
  mss: S.get('mss').value.toString(),
  stunden: '6.5',
  vwgk: '0.1',
  vtgk: '0.05',
};
const A = solveMaschinensatz(AUFTRAG).werte;
const A_BASIS = solveMaschinensatz(AUFTRAG, { restFgkFalscheBasis: true }).werte;
const A_OHNE = solveMaschinensatz(AUFTRAG, { ohneMaschinenkosten: true }).werte;

// Klausurbrücke (eigene Zahlen)
const K: MaschinenParams = {
  variante: 'stundensatz',
  anlage: 'Glasflaschen-Abfüllanlage',
  wbw: '720000',
  nd: 6,
  zinssatz: '0.06',
  flaeche: 60,
  raumSatz: '180',
  raumJe: 'jahr',
  energie: { art: 'stunde', satz: '9' },
  instand: { art: 'betrag', betrag: '27000' },
  laufzeit: 1_800,
};
const K_TEIL = maschinensatz
  .parts(K, solveMaschinensatz(K))
  .find((p) => p.id === 'mss') as TaskPart;

export const lektionJ5: Lektion = {
  id: 'J5',
  skillId: 'J5-maschinensatz',
  abschnitt: 'J',
  titel: 'Maschinenstundensatz: Was kostet eine Stunde Abfüllanlage?',
  kernAha:
    'Treibt eine teure Anlage die Kosten, verrechnet man ihre Kosten nach Laufzeit statt nach Löhnen: maschinenbezogene Gemeinkosten eines Jahres ÷ Laufstunden = Maschinenstundensatz. Nur der Rest der Fertigungsgemeinkosten bleibt ein Zuschlag auf die Löhne.',
  dauerMin: 8,
  figuren: ['leni', 'tobias', 'jana'],
  ort: 'abfuellung',
  quelle: 'K2 2.2.5 (S. 73–76); 04-fachregeln.md',
  teaser: {
    figur: 'leni',
    ausdruck: 'gruebelt',
    text: 'Gleicher Lohn, aber sechsmal so viel Maschinenzeit. Und trotzdem gleiche Kosten?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: 'Zwei Aufträge mit gleich viel Lohn. Auftrag B blockiert die neue Abfüllanlage aber sechsmal so lange wie Auftrag A.',
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Laut Zuschlag auf die Löhne kosten beide gleich viel. Passt doch!',
        },
      ],
      frage: 'Sollten beide Aufträge wirklich dieselben Fertigungsgemeinkosten tragen?',
    },
    {
      typ: 'dialog',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Im Copyshop zahlt man den großen Plotter nach Minuten, egal wer ihn bedient. Teuer ist die Maschine, nicht der Mensch daneben.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Genau so rechnen wir die Abfüllanlage ab: mit einem Preis je Laufstunde. Fachleute sprechen von Bezugsgrößenkalkulation, die Laufzeit ist die Bezugsgröße.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Gehört das zur Maschine?',
      text: 'Welche Kosten hängen direkt an der Abfüllanlage?',
      kategorien: ['Maschinenbezogene Gemeinkosten', 'Restfertigungsgemeinkosten'],
      elemente: [
        {
          text: 'Kalkulatorische Abschreibung der Anlage',
          kategorie: 'Maschinenbezogene Gemeinkosten',
          erklaerung: 'Der Werteverzehr der Anlage selbst.',
        },
        {
          text: 'Kalkulatorische Zinsen auf das gebundene Kapital',
          kategorie: 'Maschinenbezogene Gemeinkosten',
          erklaerung: 'Das Kapital steckt in genau dieser Anlage.',
        },
        {
          text: 'Strom der Anlage',
          kategorie: 'Maschinenbezogene Gemeinkosten',
          erklaerung: 'Energiekosten lassen sich der Anlage zurechnen.',
        },
        {
          text: 'Raumkosten der Stellfläche',
          kategorie: 'Maschinenbezogene Gemeinkosten',
          erklaerung: 'Die Anlage belegt einen festen Platz in der Halle.',
        },
        {
          text: 'Gehalt der Schichtleitung der ganzen Abfüllung',
          kategorie: 'Restfertigungsgemeinkosten',
          erklaerung: 'Die Schichtleitung arbeitet für alle Plätze, nicht nur für diese Anlage.',
        },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Ein Preis je Laufstunde',
      text: 'Maschinenstundensatz = maschinenbezogene Gemeinkosten eines Jahres ÷ Laufzeit der Anlage in Stunden. Gezählt werden nur Stunden, in denen die Anlage tatsächlich produziert, keine Wartungs- oder Stillstandszeiten.',
      visual: {
        typ: 'karten',
        karten: [
          { titel: 'Abschreibung', text: formatEuro(S.get('afa')), farbe: '#1c6670' },
          { titel: 'Zinsen', text: formatEuro(S.get('zinsen')), farbe: '#1c6670' },
          { titel: 'Raum', text: formatEuro(S.get('raum')), farbe: '#8cbf3f' },
          {
            titel: 'Energie',
            text: formatEuro(S.get('energie-fix').plus(S.get('energie-var'))),
            farbe: '#e2b13c',
          },
          { titel: 'Instandhaltung', text: formatEuro(S.get('instand')), farbe: '#e8792b' },
          {
            titel: `÷ ${formatPlain(BEISPIEL.laufzeit!)} h`,
            text: `= ${formatEuro(S.get('mss'))} je Stunde`,
            farbe: '#e8792b',
          },
        ],
      },
    },
    {
      typ: 'vorhersage',
      frage: `Nächstes Jahr soll die Anlage ${formatPlain(MEHR_STUNDEN)} statt ${formatPlain(BEISPIEL.laufzeit!)} Stunden laufen. Angenommen, die maschinenbezogenen Kosten bleiben gleich: Was passiert mit dem Stundensatz?`,
      optionen: [
        { text: 'Er sinkt.', richtig: true },
        { text: 'Er steigt.' },
        { text: 'Er bleibt gleich.' },
      ],
      aufloesung: `Dieselben ${formatEuro(S.get('summe'))} verteilen sich auf mehr Stunden: ${formatEuro(SATZ_MEHR)} statt ${formatEuro(S.get('mss'))} je Stunde.`,
    },
    {
      typ: 'vorgerechnet',
      titel: `Stundensatz der ${BEISPIEL.anlage}`,
      text: `Wiederbeschaffungswert ${formatEuro(BEISPIEL.wbw!)}, ${BEISPIEL.nd} Jahre, ${formatPlain(BEISPIEL.laufzeit!)} Laufstunden im Jahr.`,
      schritte: [
        {
          text: 'Kalkulatorische Abschreibung',
          rechnung: `${formatEuro(BEISPIEL.wbw!)} ÷ ${BEISPIEL.nd} = ${formatEuro(S.get('afa'))}`,
          warum: 'Linear über die Nutzungsdauer.',
        },
        {
          text: 'Kalkulatorische Zinsen',
          rechnung: `${formatEuro(BEISPIEL.wbw!)} ÷ 2 × ${formatProzent(BEISPIEL.zinssatz!)} = ${formatEuro(S.get('zinsen'))}`,
          warum: 'Im Durchschnitt ist nur der halbe Wert gebunden.',
        },
        {
          text: 'Raumkosten',
          rechnung: `${formatPlain(BEISPIEL.flaeche!)} m² × ${formatEuro(BEISPIEL.raumSatz!)} × 12 = ${formatEuro(S.get('raum'))}`,
          warum: 'Der Satz gilt je Monat, gebraucht wird das Jahr.',
        },
        {
          text: 'Energie',
          rechnung: `Grundpreis ${formatPlain(E.kw)} kW × ${formatEuro(E.grundpreis)} × 12 = ${formatEuro(S.get('energie-fix'))}; Verbrauch ${formatPlain(E.kw)} kW × ${formatProzent(E.leistungsgrad)} × ${formatPlain(BEISPIEL.laufzeit!)} h × ${formatEuro(E.arbeitspreis)} = ${formatEuro(S.get('energie-var'))}`,
          warum: 'Im Mittel zieht die Anlage nur einen Teil ihrer installierten Leistung.',
        },
        {
          text: 'Instandhaltung',
          rechnung: `${formatPlain(dec(FAKTOR))} × ${formatEuro(BEISPIEL.wbw!)} ÷ ${BEISPIEL.nd} = ${formatEuro(S.get('instand'))}`,
          warum: 'Der Faktor gilt für die ganze Nutzungsdauer.',
        },
        {
          text: 'Maschinenstundensatz',
          rechnung: `${formatEuro(S.get('summe'))} ÷ ${formatPlain(BEISPIEL.laufzeit!)} h = ${formatEuro(S.get('mss'))}`,
          warum: 'Jahreskosten durch Jahreslaufzeit.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege hat gerechnet',
      text: 'Eine Zeile ist falsch. Tippe sie an.',
      zeilen: [
        `Abschreibung: ${formatEuro(BEISPIEL.wbw!)} ÷ ${BEISPIEL.nd} = ${formatEuro(S.get('afa'))}`,
        `Zinsen: ${formatEuro(BEISPIEL.wbw!)} × ${formatProzent(BEISPIEL.zinssatz!)} = ${formatEuro(FALSCH_ZINS.get('zinsen'))}`,
        `Raumkosten: ${formatPlain(BEISPIEL.flaeche!)} m² × ${formatEuro(BEISPIEL.raumSatz!)} × 12 = ${formatEuro(S.get('raum'))}`,
      ],
      fehlerZeile: 1,
      gruende: [
        {
          text: 'Die Zinsen gehören auf die durchschnittliche Kapitalbindung, also den halben Wert.',
          richtig: true,
        },
        { text: 'Zinsen gehören nicht in den Maschinenstundensatz.' },
        { text: 'Der Zinssatz muss noch durch die Nutzungsdauer geteilt werden.' },
      ],
      aufloesung: `Richtig sind ${formatEuro(BEISPIEL.wbw!)} ÷ 2 × ${formatProzent(BEISPIEL.zinssatz!)} = ${formatEuro(S.get('zinsen'))}. Mit dem vollen Wert wäre der Stundensatz zu hoch.`,
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Eine andere Anlage der MBG. Ergänze die Zinsen, die Summe der maschinenbezogenen Kosten und den Stundensatz.',
      skillId: 'J5-maschinensatz',
      seed: 6,
      variant: 'stundensatz',
      partId: 'mss',
      gefragt: ['zinsen', 'summe', 'mss'],
    },
    {
      typ: 'verstaendnis',
      frage: `Auftrag über ${AUFTRAG.auftrag}: Fertigungslöhne ${formatEuro(AUFTRAG.fl!)}, Restfertigungsgemeinkosten ${formatProzent(AUFTRAG.restFgk!)}, die Anlage läuft ${formatPlain(dec(AUFTRAG.stunden!))} h zu ${formatEuro(AUFTRAG.mss!)}. Wie hoch sind die Fertigungskosten?`,
      optionen: [
        {
          text: formatEuro(A.get('fk')),
          richtig: true,
          erklaerung: `${formatEuro(AUFTRAG.fl!)} + ${formatEuro(A.get('rest'))} + ${formatEuro(A.get('masch'))}: Löhne, Rest-Zuschlag auf die Löhne und Maschinenkosten.`,
        },
        {
          text: formatEuro(A_BASIS.get('fk')),
          erklaerung:
            'Hier wurde der Zuschlag auch auf die Maschinenkosten gerechnet. Die sind über den Stundensatz aber schon vollständig verrechnet.',
        },
        {
          text: formatEuro(A_OHNE.get('fk')),
          erklaerung: 'Hier fehlen die Maschinenkosten: Laufzeit × Maschinenstundensatz.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'J5-m1',
      frage: 'Wie ermittelt und verwendet man einen Maschinenstundensatz?',
      text: 'Maschinenstundensatz = maschinenbezogene Gemeinkosten je Jahr ÷ Laufstunden je Jahr. In der Kalkulation: Fertigungskosten = Fertigungslöhne + Restfertigungsgemeinkosten (Zuschlag auf die Löhne) + Laufzeit × Maschinenstundensatz.',
    },
    {
      typ: 'klausur',
      punkte: 8,
      aufgabe: `Für die ${K.anlage} der MBG liegen vor: Wiederbeschaffungswert ${formatEuro(K.wbw!)}, lineare Abschreibung über ${K.nd} Jahre, kalkulatorischer Zinssatz ${formatProzent(K.zinssatz!)} auf die durchschnittliche Kapitalbindung, Platzbedarf ${formatPlain(K.flaeche!)} m² zu ${formatEuro(K.raumSatz!)} je m² und Jahr, Energiekosten ${formatEuro('9')} je Laufstunde, Instandhaltung ${formatEuro('27000')} je Jahr, Laufzeit ${formatPlain(K.laufzeit!)} Stunden je Jahr. Ermitteln Sie die maschinenbezogenen Gemeinkosten und den Maschinenstundensatz.`,
      part: K_TEIL,
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'ueberrascht',
        text: 'In der neuen Zitruspresse entstehen Saft, Öl und Fasern in einem einzigen Arbeitsgang. Wem rechnen wir die Kosten der Presse zu?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Maschinenbezogene Kosten 180.000 € im Jahr, Laufzeit 2.400 Stunden. Wie hoch ist der Maschinenstundensatz?',
      optionen: [{ text: '75,00 €', richtig: true }, { text: '13,33 €' }, { text: '7,50 €' }],
    },
    {
      frage:
        'Wiederbeschaffungswert 500.000 €, Zinssatz 8 % auf die durchschnittliche Kapitalbindung. Kalkulatorische Zinsen?',
      optionen: [{ text: '20.000 €', richtig: true }, { text: '40.000 €' }, { text: '4.000 €' }],
    },
    {
      frage:
        'Worauf werden die Restfertigungsgemeinkosten in der Maschinensatzkalkulation bezogen?',
      optionen: [
        { text: 'Auf die Fertigungslöhne', richtig: true },
        { text: 'Auf Fertigungslöhne plus Maschinenkosten' },
        { text: 'Auf das Fertigungsmaterial' },
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
      'K2 Kap. 2.2.5 (S. 73–76: Bezugsgrößen-/Maschinensatzkalkulation, maschinenbezogene Gemeinkosten ÷ Laufzeit, nur Lastlaufzeit, Restfertigungsgemeinkosten als Zuschlag auf Fertigungslöhne, Zinsen auf halben Wiederbeschaffungswert, Instandhaltungsfaktor über die Nutzungsdauer) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
