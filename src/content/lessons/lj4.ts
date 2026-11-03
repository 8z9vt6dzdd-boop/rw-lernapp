// Lektion J4 – Zuschlagskalkulation (eigene Formulierung; geprüft gegen K2 Kap. 2.3, S. 67–69).
// Alle Beträge werden von der Engine berechnet.
import {
  solveZuschlag,
  zuschlag,
  type ZuschlagParams,
  type ZuschlagSolution,
} from '../../engine/generators/zuschlag';
import { formatEuro, formatProzent, sum, type Val } from '../../engine/money';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const BEISPIEL: ZuschlagParams = {
  variante: 'differenzierend',
  auftrag: '2.000 Kartons Senne Lemon 0,33 l',
  kunde: 'eine Hotelkette',
  fm: '20000',
  mgk: '0.1',
  fertigung: [{ name: 'Fertigung', fl: '8000', fgk: '1.5' }],
  vwgk: '0.1',
  vtgk: '0.05',
};
const S = solveZuschlag(BEISPIEL);
const w = (s: ZuschlagSolution, id: string): Val => s.werte.find((x) => x.id === id)!.wert;
const FL = BEISPIEL.fertigung![0]!.fl;
const FGK = BEISPIEL.fertigung![0]!.fgk;
const EK = sum([BEISPIEL.fm!, FL]);
// Typischer Fehler: Vertriebsgemeinkosten auf Herstellkosten + Verwaltungsgemeinkosten
const FALSCH = solveZuschlag(BEISPIEL, { vtAufHkPlusVw: true });
const ANGEBOT = '45000';
const LUECKE = w(S, 'sk').minus(ANGEBOT);

// Klausurbrücke (eigene Zahlen)
const K: ZuschlagParams = {
  variante: 'differenzierend',
  auftrag: '2.000 Kartons Senne Lemon 0,33 l',
  kunde: 'eine Hotelkette',
  fm: '15000',
  mgk: '0.12',
  fertigung: [{ name: 'Fertigung', fl: '6000', fgk: '2' }],
  vwgk: '0.1',
  vtgk: '0.05',
};
const K_TEIL = zuschlag.parts(K, solveZuschlag(K)).find((p) => p.id === 'schema') as TaskPart;

export const lektionJ4: Lektion = {
  id: 'J4',
  skillId: 'J4-zuschlag',
  abschnitt: 'J',
  titel: 'Zuschlagskalkulation: Ein Angebot für die Hotelkette',
  kernAha:
    'Gemeinkosten lassen sich keinem Auftrag direkt zuordnen. Sie werden stufenweise als Prozentzuschlag auf eine passende Basis verrechnet – vom Fertigungsmaterial bis zu den Selbstkosten.',
  dauerMin: 8,
  figuren: ['tobias', 'leni', 'jana'],
  ort: 'besprechung',
  quelle: 'K2 2.3 (S. 67–69); 04-fachregeln.md',
  teaser: {
    figur: 'tobias',
    ausdruck: 'freut',
    text: 'Die Hotelkette will 2.000 Kartons Senne Lemon. Den Preis hab ich schon im Kopf!',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: `Material ${formatEuro(BEISPIEL.fm!)}, Löhne ${formatEuro(FL)} – also biete ich der Hotelkette ${formatEuro(EK)} an.`,
        },
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: 'Und wer bezahlt die Miete der Halle, den Strom und die Buchhaltung?',
        },
      ],
      frage: 'Was kostet der Auftrag die MBG wirklich?',
    },
    {
      typ: 'dialog',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Ein Elektriker berechnet nicht nur Kabel und Arbeitszeit. In seinem Stundensatz stecken auch Werkstatt, Transporter und Büro.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Diese Kosten nennen wir Gemeinkosten. Man kann sie keinem Auftrag direkt zuordnen, also schlägt man sie prozentual auf.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Einzel- oder Gemeinkosten?',
      text: 'Lässt sich der Betrag dem Auftrag der Hotelkette direkt zuordnen?',
      kategorien: ['Einzelkosten', 'Gemeinkosten'],
      elemente: [
        {
          text: 'Dosen und Sirup für die 2.000 Kartons',
          kategorie: 'Einzelkosten',
          erklaerung: 'Fertigungsmaterial – direkt dem Auftrag zurechenbar.',
        },
        {
          text: 'Lohn für die Stunden an der Abfüllanlage für diesen Auftrag',
          kategorie: 'Einzelkosten',
          erklaerung: 'Fertigungslöhne werden je Auftrag erfasst.',
        },
        {
          text: 'Miete der Lagerhalle',
          kategorie: 'Gemeinkosten',
          erklaerung: 'Die Halle dient allen Aufträgen.',
        },
        {
          text: 'Gehalt der Buchhaltung',
          kategorie: 'Gemeinkosten',
          erklaerung: 'Verwaltung arbeitet für das ganze Unternehmen.',
        },
        {
          text: 'Werbekampagne für Senne Lemon',
          kategorie: 'Gemeinkosten',
          erklaerung: 'Vertriebskosten betreffen alle Kunden.',
        },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Die Kalkulationstreppe',
      text: 'Jede Gemeinkostenart bekommt ihre Basis: Material auf Fertigungsmaterial, Fertigung auf Fertigungslöhne, Verwaltung und Vertrieb auf die Herstellkosten. Stufe für Stufe entstehen so die Selbstkosten.',
      visual: {
        typ: 'treppe',
        stufen: [
          { label: 'Fertigungsmaterial', betrag: BEISPIEL.fm!, art: 'basis' },
          {
            label: `MGK ${formatProzent(BEISPIEL.mgk!)}`,
            betrag: w(S, 'mgk').value.toString(),
            art: 'zuschlag',
          },
          { label: 'Fertigungslöhne', betrag: FL, art: 'basis' },
          {
            label: `FGK ${formatProzent(FGK)}`,
            betrag: w(S, 'fgk-0').value.toString(),
            art: 'zuschlag',
          },
          { label: 'Herstellkosten', betrag: w(S, 'hk').value.toString(), art: 'summe' },
          {
            label: `VwGK ${formatProzent(BEISPIEL.vwgk!)}`,
            betrag: w(S, 'vwgk').value.toString(),
            art: 'zuschlag',
          },
          {
            label: `VtGK ${formatProzent(BEISPIEL.vtgk!)}`,
            betrag: w(S, 'vtgk').value.toString(),
            art: 'zuschlag',
          },
          { label: 'Selbstkosten', betrag: w(S, 'sk').value.toString(), art: 'summe' },
        ],
      },
    },
    {
      typ: 'vorhersage',
      frage: 'Worauf werden die Verwaltungsgemeinkosten bezogen?',
      optionen: [
        { text: 'Auf die Herstellkosten', richtig: true },
        { text: 'Auf die Fertigungslöhne' },
        { text: 'Auf das Fertigungsmaterial' },
      ],
      aufloesung: `Verwaltung und Vertrieb dienen dem ganzen Produkt, nicht nur Material oder Fertigung. Deshalb ist die Basis die Herstellkosten: ${formatProzent(BEISPIEL.vwgk!)} von ${formatEuro(w(S, 'hk'))} = ${formatEuro(w(S, 'vwgk'))}.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Schritt für Schritt',
      text: `Auftrag: ${BEISPIEL.auftrag} für ${BEISPIEL.kunde}.`,
      schritte: [
        {
          text: 'Materialkosten',
          rechnung: `${formatEuro(BEISPIEL.fm!)} + ${formatProzent(BEISPIEL.mgk!)} MGK ${formatEuro(w(S, 'mgk'))} = ${formatEuro(w(S, 'mk'))}`,
          warum: 'Der Materialzuschlag deckt Einkauf und Lager.',
        },
        {
          text: 'Fertigungskosten',
          rechnung: `${formatEuro(FL)} + ${formatProzent(FGK)} FGK ${formatEuro(w(S, 'fgk-0'))} = ${formatEuro(w(S, 'fk'))}`,
          warum: 'Basis sind die Fertigungslöhne, nicht das Material.',
        },
        {
          text: 'Herstellkosten',
          rechnung: `${formatEuro(w(S, 'mk'))} + ${formatEuro(w(S, 'fk'))} = ${formatEuro(w(S, 'hk'))}`,
          warum: 'So viel kostet die Herstellung der 2.000 Kartons.',
        },
        {
          text: 'Verwaltung und Vertrieb',
          rechnung: `VwGK ${formatProzent(BEISPIEL.vwgk!)} = ${formatEuro(w(S, 'vwgk'))}; VtGK ${formatProzent(BEISPIEL.vtgk!)} = ${formatEuro(w(S, 'vtgk'))}`,
          warum: 'Beide Zuschläge beziehen sich auf die Herstellkosten.',
        },
        {
          text: 'Selbstkosten',
          rechnung: `${formatEuro(w(S, 'hk'))} + ${formatEuro(w(S, 'vwgk'))} + ${formatEuro(w(S, 'vtgk'))} = ${formatEuro(w(S, 'sk'))}`,
          warum: `Tobias’ ${formatEuro(EK)} decken nur die Einzelkosten.`,
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege hat kalkuliert',
      text: 'Eine Zeile ist falsch. Tippe sie an.',
      zeilen: [
        `Herstellkosten: ${formatEuro(w(FALSCH, 'hk'))}`,
        `VwGK: ${formatProzent(BEISPIEL.vwgk!)} von ${formatEuro(w(FALSCH, 'hk'))} = ${formatEuro(w(FALSCH, 'vwgk'))}`,
        `VtGK: ${formatProzent(BEISPIEL.vtgk!)} von ${formatEuro(w(FALSCH, 'hk').plus(w(FALSCH, 'vwgk')))} = ${formatEuro(w(FALSCH, 'vtgk'))}`,
      ],
      fehlerZeile: 2,
      gruende: [
        {
          text: 'Auch die Vertriebsgemeinkosten beziehen sich nur auf die Herstellkosten.',
          richtig: true,
        },
        { text: 'Die Vertriebsgemeinkosten beziehen sich auf die Fertigungslöhne.' },
        { text: 'Vertriebsgemeinkosten werden gar nicht zugeschlagen.' },
      ],
      aufloesung: `Richtig: ${formatProzent(BEISPIEL.vtgk!)} von ${formatEuro(w(S, 'hk'))} = ${formatEuro(w(S, 'vtgk'))}. Verwaltungs- und Vertriebszuschlag stehen nebeneinander, nicht aufeinander.`,
    },
    {
      typ: 'entscheidung',
      frage: `Die Hotelkette bietet ${formatEuro(ANGEBOT)} für den Auftrag. Was empfiehlst du Tobias?`,
      figur: {
        figur: 'tobias',
        ausdruck: 'gruebelt',
        text: `Die Selbstkosten liegen bei ${formatEuro(w(S, 'sk'))}. Was nun?`,
      },
      optionen: [
        {
          text: 'Sofort zusagen – Umsatz ist Umsatz',
          folge: `Auf Vollkostenbasis fehlen ${formatEuro(LUECKE)}. Die Gemeinkosten wären nicht gedeckt.`,
          ausdruck: 'ueberrascht',
        },
        {
          text: 'Nachverhandeln und die Kalkulation offenlegen',
          folge:
            'Die Hotelkette sieht, wie der Preis zustande kommt. Vielleicht trifft man sich bei den Selbstkosten plus Gewinn.',
          ausdruck: 'freut',
          empfohlen: true,
        },
        {
          text: 'Den Auftrag ohne Gespräch ablehnen',
          folge: 'Damit ist der Kunde weg, bevor klar ist, ob es nicht doch einen Weg gibt.',
          ausdruck: 'gruebelt',
        },
      ],
      fazit:
        'Die Vollkostenrechnung sagt: Unter den Selbstkosten entsteht ein Verlust. Ob ein solcher Auftrag trotzdem sinnvoll sein kann, zeigt erst die Teilkostenrechnung.',
    },
    {
      typ: 'merksatz',
      id: 'J4-m1',
      frage: 'Wie lautet das Schema der differenzierenden Zuschlagskalkulation?',
      text: 'FM + MGK = Materialkosten; FL + FGK = Fertigungskosten; beides zusammen = Herstellkosten. Herstellkosten + VwGK + VtGK (beide auf die Herstellkosten) = Selbstkosten.',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe: `Für einen Auftrag über ${K.auftrag} liegen vor: Fertigungsmaterial ${formatEuro(K.fm!)}, Materialgemeinkosten ${formatProzent(K.mgk!)}, Fertigungslöhne ${formatEuro(K.fertigung![0]!.fl)}, Fertigungsgemeinkosten ${formatProzent(K.fertigung![0]!.fgk)}, Verwaltungsgemeinkosten ${formatProzent(K.vwgk!)}, Vertriebsgemeinkosten ${formatProzent(K.vtgk!)}. Ermitteln Sie die Selbstkosten nach der differenzierenden Zuschlagskalkulation.`,
      part: K_TEIL,
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'ueberrascht',
        text: 'Leni meint, kurzfristig lohnt sich sogar ein Auftrag unter den Selbstkosten – bei freier Kapazität und einem Preis über den variablen Kosten. Warum, zeigt die Teilkostenrechnung.',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Worauf werden die Fertigungsgemeinkosten bezogen?',
      optionen: [
        { text: 'Auf die Fertigungslöhne', richtig: true },
        { text: 'Auf das Fertigungsmaterial' },
        { text: 'Auf die Herstellkosten' },
      ],
    },
    {
      frage: 'Herstellkosten 10.000 €, VwGK 10 %, VtGK 5 %. Wie hoch sind die Selbstkosten?',
      optionen: [{ text: '11.500 €', richtig: true }, { text: '11.550 €' }, { text: '10.500 €' }],
    },
    {
      frage: 'Was sind Gemeinkosten?',
      optionen: [
        { text: 'Kosten, die sich einem Auftrag nicht direkt zuordnen lassen', richtig: true },
        { text: 'Kosten, die nur einmal im Jahr anfallen' },
        { text: 'Kosten, die der Kunde direkt bezahlt' },
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
      'K2 Kap. 2.3 (S. 67–69: Einzel- und Gemeinkosten, Schema der differenzierenden Zuschlagskalkulation, VwGK und VtGK auf Herstellkosten) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
