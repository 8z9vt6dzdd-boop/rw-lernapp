// Lektion I6 – Zuschlagssätze, Normalzuschläge, Über-/Unterdeckung (eigene Formulierung; geprüft gegen
// K2 Kap. 1.4.3 und 1.4.4, S. 39–41). Alle Beträge werden von der Engine berechnet.
// Richtung der Über-/Unterdeckung: [ANNAHME – bitte prüfen], siehe docs/m7/ij.md.
import {
  solveZs,
  zuschlagssaetze,
  type ZsParams,
} from '../../engine/generators/ij/zuschlagssaetze';
import {
  dec,
  formatEuro,
  formatNumber,
  formatPlain,
  formatProzent,
  type Val,
} from '../../engine/money';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value.toString());
const p = (v: Val) => `${formatNumber(v.value)} %`;

// Beispiel der Lektion (eigene Zahlen)
const B: ZsParams = {
  variante: 'ist-saetze',
  monat: 'Mai',
  fm: '100000',
  fertigung: [{ name: 'Fertigung', fl: '60000' }],
  ist: { mgk: '15000', fgk: ['90000'], vwgk: '25000', vtgk: '12500' },
  bestand: [{ art: 'mehr', erzeugnis: 'fertige', betrag: '15000' }],
};
const S = solveZs(B);
const MEHR = B.bestand[0]!.betrag;
const FALSCH = solveZs(B, { bestandVorzeichenFalsch: true });
// Normalzuschlag Material 12 %: verrechnet vs. angefallen
const N: ZsParams = {
  ...B,
  variante: 'deckung',
  normal: { mgk: '0.12', fgk: ['1.6'], vwgk: '0.1', vtgk: '0.05' },
};
const SN = solveZs(N);
const D_MAT = SN.deckung!.find((d) => d.id === 'mgk')!;

// Klausurbrücke (eigene Zahlen)
const K: ZsParams = {
  variante: 'ist-saetze',
  monat: 'Juni',
  fm: '240000',
  fertigung: [{ name: 'Fertigung', fl: '150000' }],
  ist: { mgk: '24000', fgk: ['225000'], vwgk: '54600', vtgk: '31200' },
  bestand: [
    { art: 'minder', erzeugnis: 'unfertige', betrag: '8000' },
    { art: 'mehr', erzeugnis: 'fertige', betrag: '23000' },
  ],
};
const K_TEIL = zuschlagssaetze.parts(K, solveZs(K)).find((x) => x.id === 'ist') as TaskPart;

export const lektionI6: Lektion = {
  id: 'I6',
  skillId: 'I6-zuschlagssaetze',
  abschnitt: 'I',
  titel: 'Zuschlagssätze: Vom BAB zum Prozentsatz',
  kernAha:
    'Ein Zuschlagssatz setzt die Gemeinkosten einer Hauptkostenstelle ins Verhältnis zu ihrer Bezugsbasis – Verwaltung und Vertrieb zu den Herstellkosten des Umsatzes. Wer im Voraus mit Normalzuschlägen rechnet, vergleicht später: Normal mehr als Ist heißt Überdeckung, weniger heißt Unterdeckung.',
  dauerMin: 8,
  figuren: ['tobias', 'leni', 'jana'],
  ort: 'besprechung',
  quelle: 'K2 1.4.3, 1.4.4 (S. 39–41)',
  teaser: {
    figur: 'tobias',
    ausdruck: 'freut',
    text: 'Für mein Angebot brauche ich einen Prozentsatz für die Gemeinkosten. Bis morgen, bitte!',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Für das Angebot an die Hotelkette brauche ich einen Prozentsatz für die Gemeinkosten.',
        },
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: 'Der BAB liefert aber nur Eurobeträge je Kostenstelle.',
        },
      ],
      frage: `Wie wird aus ${formatEuro(B.ist.mgk)} Materialgemeinkosten ein Zuschlag, der zu jedem Auftrag passt?`,
    },
    {
      typ: 'dialog',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Wie beim Trinkgeld: Zehn Prozent passen zu jeder Rechnung, egal ob Kaffee oder Festessen.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Genauso legt man Gemeinkosten als Prozentsatz auf eine passende Basis. Das ist der Zuschlagssatz.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Material: ${formatEuro(B.ist.mgk)} Gemeinkosten bei ${formatEuro(B.fm)} Fertigungsmaterial. Wie hoch ist der Materialgemeinkostenzuschlag?`,
      optionen: [
        { text: p(S.satz.mgk), richtig: true },
        { text: `${formatNumber(dec(B.fm).div(B.ist.mgk))} %` },
        { text: `${formatNumber(S.satz.mgk.value.plus(100))} %` },
      ],
      aufloesung: `${formatEuro(B.ist.mgk)} ÷ ${formatEuro(B.fm)} × 100 = ${p(S.satz.mgk)}. Auf jeden Euro Fertigungsmaterial kommen also ${formatPlain(S.satz.mgk.value)} Cent Materialgemeinkosten.`,
    },
    {
      typ: 'konzept',
      titel: 'Welche Basis für welche Stelle?',
      text: 'Material auf Fertigungsmaterial, Fertigung auf Fertigungslöhne, Verwaltung und Vertrieb auf die Herstellkosten des Umsatzes – jeweils Gemeinkosten ÷ Basis × 100. Herstellkosten des Umsatzes = Herstellkosten der Periode − Mehrbestand + Minderbestand.',
      visual: {
        typ: 'treppe',
        stufen: [
          { label: 'Fertigungsmaterial', betrag: B.fm, art: 'basis' },
          { label: `MGK ${p(S.satz.mgk)}`, betrag: B.ist.mgk, art: 'zuschlag' },
          { label: 'Fertigungslöhne', betrag: B.fertigung[0]!.fl, art: 'basis' },
          { label: `FGK ${p(S.satz.fgk[0]!)}`, betrag: B.ist.fgk[0]!, art: 'zuschlag' },
          {
            label: 'Herstellkosten der Periode',
            betrag: S.hkPeriode.value.toString(),
            art: 'summe',
          },
          {
            label: 'Herstellkosten des Umsatzes',
            betrag: S.hkUmsatz.value.toString(),
            art: 'summe',
          },
        ],
      },
    },
    {
      typ: 'wer-hat-recht',
      frage: `Im Mai sind fertige Erzeugnisse für ${formatEuro(MEHR)} ins Lager gegangen. Worauf bezieht sich der Verwaltungszuschlag?`,
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: `Auf die Herstellkosten der Periode, also ${e(S.hkPeriode)} – produziert ist produziert.`,
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: `Auf die Herstellkosten des Umsatzes von ${e(S.hkUmsatz)}. Der Mehrbestand ist ja noch nicht verkauft.`,
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Verwaltung und Vertrieb beziehen sich auf die verkauften Erzeugnisse; ein Mehrbestand wird abgezogen.',
          richtig: true,
        },
        { text: 'Lagerbestände erhöhen immer die Bezugsbasis.' },
        { text: 'Der Verwaltungszuschlag bezieht sich auf das Fertigungsmaterial.' },
      ],
      aufloesung: `${e(S.hkPeriode)} − ${formatEuro(MEHR)} = ${e(S.hkUmsatz)}. Verwaltungszuschlag: ${formatEuro(B.ist.vwgk)} ÷ ${e(S.hkUmsatz)} × 100 = ${p(S.satz.vwgk)}.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Die vier Ist-Zuschlagssätze',
      schritte: [
        {
          text: 'Material und Fertigung',
          rechnung: `${formatEuro(B.ist.mgk)} ÷ ${formatEuro(B.fm)} × 100 = ${p(S.satz.mgk)}; ${formatEuro(B.ist.fgk[0]!)} ÷ ${formatEuro(B.fertigung[0]!.fl)} × 100 = ${p(S.satz.fgk[0]!)}`,
          warum: 'Die Einzelkosten sind die Basis: Material zum Material, Fertigung zu den Löhnen.',
        },
        {
          text: 'Herstellkosten der Periode',
          rechnung: `${formatEuro(B.fm)} + ${formatEuro(B.ist.mgk)} + ${formatEuro(B.fertigung[0]!.fl)} + ${formatEuro(B.ist.fgk[0]!)} = ${e(S.hkPeriode)}`,
          warum: 'Materialkosten plus Fertigungskosten dieses Monats.',
        },
        {
          text: 'Herstellkosten des Umsatzes',
          rechnung: `${e(S.hkPeriode)} − ${formatEuro(MEHR)} Mehrbestand = ${e(S.hkUmsatz)}`,
          warum: 'Was ins Lager geht, ist noch nicht verkauft. Ein Minderbestand würde addiert.',
        },
        {
          text: 'Verwaltung und Vertrieb',
          rechnung: `${formatEuro(B.ist.vwgk)} ÷ ${e(S.hkUmsatz)} × 100 = ${p(S.satz.vwgk)}; ${formatEuro(B.ist.vtgk)} ÷ ${e(S.hkUmsatz)} × 100 = ${p(S.satz.vtgk)}`,
          warum: 'Beide Zuschläge beziehen sich auf dieselbe Basis.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Tobias rechnet nach',
      text: 'Eine Zeile ist falsch. Tippe sie an.',
      zeilen: [
        `Materialgemeinkostenzuschlag: ${p(S.satz.mgk)}`,
        `Herstellkosten des Umsatzes: ${e(S.hkPeriode)} + ${formatEuro(MEHR)} = ${e(FALSCH.hkUmsatz)}`,
        `Fertigungsgemeinkostenzuschlag: ${p(S.satz.fgk[0]!)}`,
      ],
      fehlerZeile: 1,
      gruende: [
        {
          text: 'Ein Mehrbestand wird abgezogen, nicht addiert.',
          richtig: true,
        },
        { text: 'Bestandsveränderungen spielen für die Zuschläge keine Rolle.' },
        { text: 'Die Herstellkosten enthalten keine Gemeinkosten.' },
      ],
      aufloesung: `Richtig: ${e(S.hkPeriode)} − ${formatEuro(MEHR)} = ${e(S.hkUmsatz)}. Mit dem falschen Wert sänke der Verwaltungszuschlag auf ${p(FALSCH.satz.vwgk)}.`,
    },
    {
      typ: 'dialog',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Kennst du die Nebenkostenvorauszahlung für die Wohnung? Am Jahresende gibt es Guthaben oder Nachzahlung.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Mit Normalzuschlägen kalkulieren wir genauso im Voraus – aus dem Durchschnitt vergangener Monate. Am Monatsende vergleichen wir mit den Istgemeinkosten.',
        },
      ],
    },
    {
      typ: 'verstaendnis',
      frage: `Kalkuliert wurde mit einem Normalzuschlag von ${formatProzent(N.normal!.mgk)}: ${formatEuro(B.fm)} × ${formatProzent(N.normal!.mgk)} = ${e(D_MAT.normal)} verrechnet. Tatsächlich angefallen sind ${e(D_MAT.ist)}. Was liegt vor?`,
      optionen: [
        {
          text: `Eine Unterdeckung von ${e(D_MAT.differenz.abs())}`,
          richtig: true,
          erklaerung:
            'Verrechnet wurde weniger, als angefallen ist – wie eine Nachzahlung bei den Nebenkosten.',
        },
        {
          text: `Eine Überdeckung von ${e(D_MAT.differenz.abs())}`,
          erklaerung: 'Überdeckung hieße: mehr verrechnet als angefallen. Hier ist es umgekehrt.',
        },
        {
          text: 'Keine Abweichung, weil der Zuschlag fest vorgegeben war',
          erklaerung:
            'Gerade weil der Normalzuschlag fest ist, entstehen Abweichungen zu den Istkosten.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Über- oder Unterdeckung?',
      text: 'Vergleiche verrechnete Normalgemeinkosten mit den Istgemeinkosten.',
      kategorien: ['Überdeckung', 'Unterdeckung'],
      elemente: [
        { text: 'Verrechnet 45.000 €, angefallen 42.000 €', kategorie: 'Überdeckung' },
        { text: 'Verrechnet 30.000 €, angefallen 33.500 €', kategorie: 'Unterdeckung' },
        {
          text: 'Normalzuschlag 160 %, Istzuschlag 150 % (gleiche Basis)',
          kategorie: 'Überdeckung',
          erklaerung: 'Mit dem höheren Normalzuschlag wurde mehr verrechnet, als angefallen ist.',
        },
        { text: 'Normalzuschlag 8 %, Istzuschlag 10 % (gleiche Basis)', kategorie: 'Unterdeckung' },
      ],
    },
    {
      typ: 'merksatz',
      id: 'I6-m1',
      frage: 'Wie bildet man Zuschlagssätze, und was bedeuten Über- und Unterdeckung?',
      text: 'Zuschlagssatz = Gemeinkosten der Stelle ÷ Basis × 100: Material auf Fertigungsmaterial, Fertigung auf Fertigungslöhne, Verwaltung und Vertrieb auf die Herstellkosten des Umsatzes. Normalgemeinkosten größer als Istgemeinkosten: Überdeckung; kleiner: Unterdeckung.',
    },
    {
      typ: 'klausur',
      punkte: 6,
      aufgabe: `Aus dem BAB: Materialgemeinkosten ${formatEuro(K.ist.mgk)}, Fertigungsgemeinkosten ${formatEuro(K.ist.fgk[0]!)}, Verwaltungsgemeinkosten ${formatEuro(K.ist.vwgk)}, Vertriebsgemeinkosten ${formatEuro(K.ist.vtgk)}. Fertigungsmaterial ${formatEuro(K.fm)}, Fertigungslöhne ${formatEuro(K.fertigung[0]!.fl)}. Minderbestand an unfertigen Erzeugnissen ${formatEuro(K.bestand[0]!.betrag)}, Mehrbestand an fertigen Erzeugnissen ${formatEuro(K.bestand[1]!.betrag)}. Ermitteln Sie die Herstellkosten des Umsatzes und die Ist-Zuschlagssätze.`,
      part: K_TEIL,
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Mit Zuschlägen kalkulieren wir jeden Auftrag einzeln. Aber braucht man diesen Aufwand auch für Millionen gleicher Dosen?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Worauf bezieht sich der Vertriebsgemeinkostenzuschlag?',
      optionen: [
        { text: 'Auf die Herstellkosten des Umsatzes', richtig: true },
        { text: 'Auf die Fertigungslöhne' },
        { text: 'Auf die Selbstkosten' },
      ],
    },
    {
      frage:
        'Herstellkosten der Periode 400.000 €, Mehrbestand 20.000 €, Minderbestand 5.000 €. Herstellkosten des Umsatzes?',
      optionen: [
        { text: '385.000 €', richtig: true },
        { text: '415.000 €' },
        { text: '425.000 €' },
      ],
    },
    {
      frage:
        'Verrechnet wurden 52.000 € Normalgemeinkosten, angefallen sind 50.000 €. Was liegt vor?',
      optionen: [
        { text: 'Überdeckung von 2.000 €', richtig: true },
        { text: 'Unterdeckung von 2.000 €' },
        { text: 'Keine Abweichung' },
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
      'K2 Kap. 1.4.3 (Kalkulationssatz = Gemeinkosten der Endkostenstelle ÷ Bezugsbasis; typische Zuschlagssätze MGK/FM, FGK/FL, VwGK und VtGK auf Herstellkosten des Umsatzes; HK des Umsatzes = Perioden-HK − Bestandserhöhung + Bestandsminderung), 1.4.4 (Normalzuschlagssätze als Durchschnitt vergangener Werte, Vergleich verrechneter Normal- mit Istgemeinkosten) abgeglichen am 03.11.2026; Richtung Über-/Unterdeckung als [ANNAHME – bitte prüfen] in docs/m7/ij.md',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
