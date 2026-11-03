// Lektion I2 – BAB: Verteilung der primären Gemeinkosten (eigene Formulierung; geprüft gegen
// K2 Kap. 1.3 und 1.4.1, S. 20–25). Alle Beträge werden von der Engine berechnet.
import { babVerteilung, solveBab, verteile, type BabParams } from '../../engine/generators/ij/bab';
import { Decimal, formatEuro, formatPlain, sum, type Val } from '../../engine/money';
import { createRng } from '../../engine/rng';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value.toString());
const STELLEN = ['Material', 'Fertigung', 'Verwaltung', 'Vertrieb'];

// Beispiel der Lektion (eigene Zahlen)
const P: BabParams = {
  variante: 'endkostenstellen',
  monat: 'März',
  stellen: STELLEN,
  vorkostenstellen: 0,
  zeilen: [
    {
      kostenart: 'Gehälter',
      betrag: '30000',
      verteilung: {
        art: 'direkt',
        grundlage: 'Gehaltsliste',
        werte: ['4000', '9000', '12000', '5000'],
      },
    },
    {
      kostenart: 'Raumkosten',
      betrag: '18000',
      verteilung: {
        art: 'schluessel',
        grundlage: 'Fläche in m²',
        schluessel: ['300', '900', '200', '400'],
      },
    },
    {
      kostenart: 'Freiwillige Sozialkosten',
      betrag: '6000',
      verteilung: {
        art: 'schluessel',
        grundlage: 'Zahl der Mitarbeiter',
        schluessel: ['6', '30', '10', '14'],
      },
    },
  ],
};
const S = solveBab(P);
const RAUM = P.zeilen[1]!;
const SOZ = P.zeilen[2]!;
const keys = (i: number) => {
  const v = P.zeilen[i]!.verteilung;
  return v.art === 'schluessel' ? v.schluessel : [];
};
const RAUM_K = keys(1);
const SOZ_K = keys(2);
// Typischer Fehler: Schlüsselsumme ohne die erste Stelle
const SOZ_FALSCH_SUMME = new Decimal(S.schluesselSumme[2]!).minus(SOZ_K[0]!);
const SOZ_FALSCH = verteile(SOZ.betrag, SOZ_K, SOZ_FALSCH_SUMME);
// Rundung: 10.000 € im Verhältnis 1 : 1 : 1 : 3
const RUND = verteile('10000', ['1', '1', '1', '3']);

// Lückenbeispiel: Schlüsselsummen einer neuen Aufgabe vom Generator
const L_SEED = 21;
const L_P = babVerteilung.generate(createRng(L_SEED), { variant: 'endkostenstellen' });
const L_TEIL = babVerteilung
  .parts(L_P, babVerteilung.solve(L_P))
  .find((x) => x.id === 'schluessel');
const L_GEFRAGT = L_TEIL?.typ === 'rechenkette' ? L_TEIL.felder.slice(0, 2).map((f) => f.id) : [];

// Klausurbrücke (eigene Zahlen)
const K: BabParams = {
  variante: 'endkostenstellen',
  monat: 'April',
  stellen: STELLEN,
  vorkostenstellen: 0,
  zeilen: [
    {
      kostenart: 'Hilfslöhne',
      betrag: '14000',
      verteilung: { art: 'direkt', grundlage: 'Lohnlisten', werte: ['3000', '8500', '0', '2500'] },
    },
    {
      kostenart: 'Raumkosten',
      betrag: '12000',
      verteilung: {
        art: 'schluessel',
        grundlage: 'Fläche in m²',
        schluessel: ['250', '600', '150', '200'],
      },
    },
    {
      kostenart: 'Energiekosten',
      betrag: '8000',
      verteilung: {
        art: 'schluessel',
        grundlage: 'Verbrauch in kWh',
        schluessel: ['2000', '9000', '1000', '4000'],
      },
    },
  ],
};
const K_TEIL = babVerteilung.parts(K, solveBab(K)).find((p) => p.id === 'bab') as TaskPart;

export const lektionI2: Lektion = {
  id: 'I2',
  skillId: 'I2-bab-verteilung',
  abschnitt: 'I',
  titel: 'Der BAB: Eine Rechnung, vier Kostenstellen',
  kernAha:
    'Im Betriebsabrechnungsbogen werden die Gemeinkosten auf die Kostenstellen verteilt: Was ein Beleg genau einer Stelle zuordnet, wird direkt übernommen; der Rest wird im Verhältnis eines passenden Schlüssels aufgeteilt. Einzelkosten gehören nicht in diese Verteilung.',
  dauerMin: 8,
  figuren: ['jana', 'leni', 'tobias'],
  ort: 'buero',
  quelle: 'K2 1.3, 1.4.1 (S. 20–25)',
  teaser: {
    figur: 'jana',
    ausdruck: 'gruebelt',
    text: `Die Raumkosten für das Werk kommen als eine einzige Rechnung: ${formatEuro(RAUM.betrag)}. Wer zahlt welchen Teil?`,
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      visual: {
        typ: 'beleg',
        absender: 'Gewerbepark Senne GmbH (Paderborn)',
        nummer: '2026-0311',
        datum: '01.03.',
        zeilen: [
          { text: 'Miete Werkshallen März', betrag: '15000' },
          { text: 'Heizung, Reinigung, Bewachung', betrag: '3000' },
          { text: 'Rechnungsbetrag', betrag: RAUM.betrag, fett: true },
        ],
        fuss: 'Fällig zum 5. des Monats.',
      },
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: 'Die Raumkosten für das ganze Werk kommen auf einer einzigen Rechnung.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Und jede Kostenstelle soll ihren fairen Anteil tragen.',
        },
      ],
      frage:
        'Wie teilt man eine Rechnung fair auf, wenn die Abteilungen unterschiedlich groß sind?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Wie bei der WG-Miete: Wer das größte Zimmer hat, zahlt mehr.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Den Maßstab nennt man Schlüssel – hier die Fläche in Quadratmetern. Die Tabelle dazu heißt Betriebsabrechnungsbogen, kurz BAB.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Die Fertigung belegt ${formatPlain(RAUM_K[1]!)} von ${formatPlain(S.schluesselSumme[1]!)} m². Welchen Anteil der ${formatEuro(RAUM.betrag)} trägt sie?`,
      optionen: [
        { text: e(S.anteile[1]![1]!), richtig: true },
        { text: formatEuro(new Decimal(RAUM.betrag).div(4).toString()) },
        { text: formatEuro(RAUM.betrag) },
      ],
      aufloesung: `${formatEuro(RAUM.betrag)} × ${formatPlain(RAUM_K[1]!)} ÷ ${formatPlain(S.schluesselSumme[1]!)} = ${e(S.anteile[1]![1]!)}. Die Fertigung hat die Hälfte der Fläche, also trägt sie die Hälfte der Raumkosten – nicht einfach ein Viertel.`,
    },
    {
      typ: 'konzept',
      titel: 'Direkt oder per Schlüssel',
      text: 'Kostenstelleneinzelkosten gehören laut Beleg genau einer Stelle, etwa Gehälter laut Gehaltsliste. Kostenstellengemeinkosten wie Raumkosten werden geschlüsselt: mit Mengenschlüsseln (Fläche, Mitarbeiter, kWh) oder Wertschlüsseln (Anlagenwerte, Löhne).',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Direkt per Beleg',
            text: 'Gehaltsliste, Lohnliste, Entnahmeschein',
            farbe: '#1c6670',
          },
          { titel: 'Mengenschlüssel', text: 'Fläche, Mitarbeiter, Stunden, kWh', farbe: '#8cbf3f' },
          { titel: 'Wertschlüssel', text: 'Anlagenwerte, Löhne und Gehälter', farbe: '#e2b13c' },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Direkt, per Schlüssel – oder gar nicht?',
      text: 'Wie kommen diese Kosten in den BAB?',
      kategorien: ['Direkt per Beleg', 'Per Schlüssel verteilen', 'Gehört nicht in den BAB'],
      elemente: [
        { text: 'Gehälter laut Gehaltsliste', kategorie: 'Direkt per Beleg' },
        { text: 'Hilfsstoffe laut Entnahmeschein', kategorie: 'Direkt per Beleg' },
        { text: 'Raumkosten des Werks', kategorie: 'Per Schlüssel verteilen' },
        { text: 'Gebäudeversicherung', kategorie: 'Per Schlüssel verteilen' },
        {
          text: 'Zucker für Senne Lemon (Fertigungsmaterial)',
          kategorie: 'Gehört nicht in den BAB',
          erklaerung:
            'Fertigungsmaterial ist Einzelkosten: Es wird dem Produkt direkt zugerechnet, nicht über Kostenstellen.',
        },
        {
          text: 'Fertigungslöhne der Abfüllung',
          kategorie: 'Gehört nicht in den BAB',
          erklaerung: 'Auch Fertigungslöhne sind Einzelkosten und laufen am BAB vorbei.',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Ein BAB Schritt für Schritt',
      schritte: [
        {
          text: 'Gehälter direkt übernehmen',
          rechnung: STELLEN.map((st, k) => `${st} ${e(S.anteile[0]![k]!)}`).join('; '),
          warum: 'Die Gehaltsliste sagt genau, wer in welcher Stelle arbeitet.',
        },
        {
          text: 'Raumkosten nach Fläche',
          rechnung: `${formatEuro(RAUM.betrag)} × ${formatPlain(RAUM_K[0]!)} ÷ ${formatPlain(S.schluesselSumme[1]!)} = ${e(S.anteile[1]![0]!)} für Material`,
          warum:
            'Anteil = Betrag × Schlüssel der Stelle ÷ Summe aller Schlüssel. Genauso für die übrigen Stellen.',
        },
        {
          text: 'Sozialkosten nach Mitarbeitern',
          rechnung: `${SOZ_K.map((k) => formatPlain(k)).join(' + ')} = ${formatPlain(S.schluesselSumme[2]!)} Mitarbeiter; ${formatEuro(SOZ.betrag)} × ${formatPlain(SOZ_K[0]!)} ÷ ${formatPlain(S.schluesselSumme[2]!)} = ${e(S.anteile[2]![0]!)} für Material`,
          warum: 'Erst die Schlüssel aller Stellen addieren, dann verteilen.',
        },
        {
          text: 'Summen bilden und kontrollieren',
          rechnung: `${STELLEN.map((st, k) => `${st} ${e(S.summen[k]!)}`).join('; ')}; zusammen ${e(sum(S.summen))}`,
          warum: `Kontrolle: ${formatEuro(P.zeilen[0]!.betrag)} + ${formatEuro(RAUM.betrag)} + ${formatEuro(SOZ.betrag)} = ${e(S.gesamt)}. Es wird nur verteilt, nichts kommt dazu.`,
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Tobias hilft bei den Sozialkosten',
      text: 'Eine Zeile ist falsch. Tippe sie an.',
      zeilen: [
        `Material: ${formatEuro(SOZ.betrag)} × ${formatPlain(SOZ_K[0]!)} ÷ ${formatPlain(S.schluesselSumme[2]!)} = ${e(S.anteile[2]![0]!)}`,
        `Fertigung: ${formatEuro(SOZ.betrag)} × ${formatPlain(SOZ_K[1]!)} ÷ ${formatPlain(SOZ_FALSCH_SUMME)} = ${e(SOZ_FALSCH[1]!)}`,
        `Verwaltung: ${formatEuro(SOZ.betrag)} × ${formatPlain(SOZ_K[2]!)} ÷ ${formatPlain(S.schluesselSumme[2]!)} = ${e(S.anteile[2]![2]!)}`,
      ],
      fehlerZeile: 1,
      gruende: [
        {
          text: `Er hat die ${formatPlain(SOZ_K[0]!)} Mitarbeiter des Materials in der Summe vergessen – geteilt wird durch alle ${formatPlain(S.schluesselSumme[2]!)}.`,
          richtig: true,
        },
        { text: 'Sozialkosten werden immer zu gleichen Teilen verteilt.' },
        { text: 'Die Fertigung bekommt keine Sozialkosten.' },
      ],
      aufloesung: `Richtig: ${formatEuro(SOZ.betrag)} × ${formatPlain(SOZ_K[1]!)} ÷ ${formatPlain(S.schluesselSumme[2]!)} = ${e(S.anteile[2]![1]!)}. Mit falscher Schlüsselsumme verteilt die Zeile mehr, als die Rechnung hergibt.`,
    },
    {
      typ: 'verstaendnis',
      frage: `Die Versicherung über ${formatEuro('10000')} wird im Verhältnis 1 : 1 : 1 : 3 verteilt. Drei Stellen bekommen je ${e(RUND[0]!)} – zusammen mit ${e(RUND[3]!)} geht die Zeile genau auf. Warum nicht ${formatEuro('5000')} für die vierte Stelle?`,
      optionen: [
        {
          text: 'Damit die Zeile genau die 10.000 € verteilt: Der übrige Rundungscent geht an die Stelle mit dem größten Anteil.',
          richtig: true,
          erklaerung: `Dreimal gerundete ${e(RUND[0]!)} plus ${formatEuro('5000')} wären einen Cent zu viel. In der App gilt beides als richtig, der Ausgleich ist der saubere Weg.`,
        },
        {
          text: 'Weil die vierte Stelle einen Rabatt bekommt.',
          erklaerung: 'Es geht nur um die Rundung auf ganze Cent, nicht um einen Nachlass.',
        },
        {
          text: 'Weil man immer abrundet.',
          erklaerung: 'Gerundet wird kaufmännisch; der Rest wird ausgeglichen.',
        },
      ],
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du: Schlüsselsummen bilden',
      text: 'Ein neuer Monat. Bilde für die ersten Schlüsselzeilen die Summe der Schlüsselgrößen – der erste Schritt jeder Verteilung.',
      skillId: 'I2-bab-verteilung',
      seed: L_SEED,
      variant: 'endkostenstellen',
      partId: 'schluessel',
      gefragt: L_GEFRAGT,
    },
    {
      typ: 'merksatz',
      id: 'I2-m1',
      frage: 'Wie werden die primären Gemeinkosten im BAB verteilt?',
      text: 'Kostenstelleneinzelkosten direkt laut Beleg übernehmen. Kostenstellengemeinkosten schlüsseln: Anteil = Betrag × Schlüssel der Stelle ÷ Summe aller Schlüssel. Einzelkosten (Fertigungsmaterial, Fertigungslöhne) bleiben draußen. Kontrolle: Alle Stellen zusammen = alle Gemeinkosten.',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe: `Verteilen Sie die Gemeinkosten im BAB auf die Kostenstellen Material, Fertigung, Verwaltung und Vertrieb: Hilfslöhne laut Lohnliste 3.000 / 8.500 / – / 2.500 €; Raumkosten ${formatEuro('12000')} nach Fläche 250 : 600 : 150 : 200 m²; Energiekosten ${formatEuro('8000')} nach Verbrauch 2.000 : 9.000 : 1.000 : 4.000 kWh. Ermitteln Sie die Summe je Kostenstelle.`,
      part: K_TEIL,
      cliffhanger: {
        figur: 'jana',
        ausdruck: 'gruebelt',
        text: 'Im echten BAB stehen auch Energie und Werkstatt – sie haben Kosten, verkaufen aber nichts. Wohin mit ihren Kosten?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Raumkosten von 9.000 € werden nach Fläche verteilt: 100, 200 und 300 m². Wie viel trägt die größte Stelle?',
      optionen: [{ text: '4.500 €', richtig: true }, { text: '3.000 €' }, { text: '2.700 €' }],
    },
    {
      frage: 'Welche Kosten gehören nicht in die Verteilung im BAB?',
      optionen: [
        { text: 'Fertigungsmaterial und Fertigungslöhne', richtig: true },
        { text: 'Gehälter und Hilfslöhne' },
        { text: 'Raumkosten und Versicherungen' },
      ],
    },
    {
      frage: 'Was ist ein Wertschlüssel?',
      optionen: [
        { text: 'Ein Schlüssel auf Basis einer Geldgröße, etwa der Anlagenwerte', richtig: true },
        { text: 'Ein Schlüssel nach der Fläche in m²' },
        { text: 'Die Summe aller Gemeinkosten' },
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
      'K2 Kap. 1.3 (BAB: Spalten Kostenstellen, Zeilen Kostenarten; Schritt 1 Verteilung der primären Gemeinkosten direkt oder über Schlüssel), 1.4.1 (Kostenstelleneinzelkosten über Belege, Kostenstellengemeinkosten über Mengen- und Wertschlüssel, Einzelkosten nicht relevant, Anteil = Betrag × Schlüssel ÷ Schlüsselsumme) abgeglichen am 03.11.2026; Rundungsausgleich nach 03-aufgabentypen.md (I2)',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
