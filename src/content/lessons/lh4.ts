// Lektion H4 – Kalkulatorische Abschreibung (eigene Formulierung; geprüft gegen K1 Kap. 2.4.1, S. 69–74;
// geometrisch-degressiv nach 04-fachregeln.md, Abschnitt 6). Alle Beträge werden von der Engine berechnet.
import {
  geometrischerSatz,
  solveKalkAfa,
  type KalkAfaParams,
} from '../../engine/generators/kalk-afa';
import { Val, formatEuro, formatPlain, formatProzent } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value.toString());

// Beispiel der Lektion
const BASIS: Omit<KalkAfaParams, 'verfahren'> = {
  anlage: 'Etikettiermaschine',
  ak: '95000',
  nebenkosten: '5000',
  nebenkostenArt: 'Montagekosten',
  restwert: '10000',
  nd: 5,
  gesamtLeistung: 30000,
  leistungJahr1: 7500,
};
const LIN = solveKalkAfa({ ...BASIS, verfahren: 'linear' });
const ARI = solveKalkAfa({ ...BASIS, verfahren: 'arithmetisch' });
const LEI = solveKalkAfa({ ...BASIS, verfahren: 'leistung' });
const OHNE_RW = solveKalkAfa({ ...BASIS, verfahren: 'linear' }, { ohneRestwert: true });

// Geometrisch-degressiv: Satz aus Restwert (K1 Kap. 2.4, 04-fachregeln.md Abschnitt 6)
const GEO_A = '100000';
const GEO_RW = '32768';
const GEO_ND = 5;
const GEO_P = geometrischerSatz(new Val(GEO_A), GEO_RW, GEO_ND);
const GEO_P_FALSCH = geometrischerSatz(new Val(GEO_A), GEO_RW, GEO_ND, true);
const p = (v: Val) => formatProzent(v.valueDp(4).toString());

export const lektionH4: Lektion = {
  id: 'H4',
  skillId: 'H4-kalk-afa',
  abschnitt: 'H',
  titel: 'Kalkulatorische Abschreibung: Was kostet ein Jahr Maschine?',
  kernAha:
    'Die kalkulatorische Abschreibung verteilt den Wertverzehr einer Anlage auf ihre Nutzungsjahre. Basis: Anschaffungskosten einschließlich Nebenkosten minus Restwert – das Verfahren bestimmt, ob jedes Jahr gleich viel trägt oder die ersten Jahre mehr.',
  dauerMin: 8,
  figuren: ['leni', 'tobias', 'jana'],
  ort: 'abfuellung',
  quelle: 'K1 2.4.1 (S. 69–74); 04-fachregeln.md (GC-14, Abschnitt 6)',
  teaser: {
    figur: 'leni',
    ausdruck: 'gruebelt',
    text: 'Die neue Etikettiermaschine hat 100.000 € gekostet. Welchen Teil davon trägt ein einzelnes Jahr?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: `Die neue ${BASIS.anlage} hat mit Montage ${formatEuro('100000')} gekostet. Rechnen wir das alles den Dosen dieses Jahres an, wird jede Dose absurd teuer.`,
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Dann lassen wir die Maschine einfach ganz weg. Problem gelöst!',
        },
      ],
      frage: 'Wie viel von der Maschine „kostet“ eigentlich ein einzelnes Jahr?',
    },
    {
      typ: 'dialog',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Wie beim Auto: Du kaufst es neu, nach ein paar Jahren ist es nur noch einen Bruchteil wert. Jedes Jahr hat ein Stück des Werts verbraucht.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Diesen Wertverzehr verteilt die Abschreibung auf die Nutzungsjahre. In der Kostenrechnung heißt sie kalkulatorisch.',
        },
        {
          figur: 'leni',
          ausdruck: 'neutral',
          text: 'Sie darf von der Abschreibung in der Bilanz abweichen. Uns interessiert der tatsächliche Verzehr, nicht das Steuerrecht.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Anschaffungspreis ${formatEuro(BASIS.ak)}, Montage ${formatEuro(BASIS.nebenkosten)}, erwarteter Restwert nach ${BASIS.nd} Jahren ${formatEuro(BASIS.restwert)}. Wie viel wird über die ganze Nutzungsdauer abgeschrieben?`,
      optionen: [
        { text: formatEuro(BASIS.ak) },
        { text: e(LIN.basis), richtig: true },
        { text: e(new Val(BASIS.ak).plus(BASIS.nebenkosten)) },
      ],
      aufloesung: `Abgeschrieben wird, was tatsächlich verbraucht wird: Anschaffungspreis plus Nebenkosten (die Montage gehört zu den Anschaffungskosten), minus dem Restwert, den die Maschine am Ende noch bringt. Das ergibt ${e(LIN.basis)}.`,
    },
    {
      typ: 'erkunden',
      titel: 'Drei Wege, den Wert zu verteilen',
      text: 'Schalte die Verfahren ein und vergleiche, wie der Buchwert der Maschine über fünf Jahre sinkt.',
      erkunden: { art: 'afa-vergleich', basis: '100000', restwert: '10000', nd: 5 },
      fazit:
        'Linear: Jedes Jahr trägt gleich viel. Degressiv: Die ersten Jahre tragen mehr, später weniger – passend, wenn eine Anlage anfangs am stärksten an Wert verliert. Alle Verfahren landen am Ende beim Restwert.',
    },
    {
      typ: 'konzept',
      titel: 'Die Basis und zwei Rechenwege',
      text: 'Basis = Anschaffungskosten + Nebenkosten − Restwert. Linear: Basis ÷ Nutzungsdauer. Arithmetisch-degressiv: Basis ÷ Summe der Jahresziffern = Degressionsbetrag; im ersten Jahr mal n, dann mal n − 1 und so weiter.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Linear',
            text: `${e(LIN.basis)} ÷ ${BASIS.nd} = ${e(LIN.linear!)} pro Jahr`,
            farbe: '#1c6670',
          },
          {
            titel: 'Arithmetisch-degressiv',
            text: `Summe 1 + … + ${BASIS.nd} = ${ARI.summeZiffern}; ${e(ARI.basis)} ÷ ${ARI.summeZiffern} = ${e(ARI.degression!)}`,
            farbe: '#e8792b',
          },
          {
            titel: 'Leistungsbezogen',
            text: 'Basis ÷ Gesamtleistung = Satz je Stunde; mal tatsächliche Stunden im Jahr',
            farbe: '#8cbf3f',
          },
        ],
      },
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege rechnet linear',
      text: `Restwert ${formatEuro(BASIS.restwert)}, Nutzungsdauer ${BASIS.nd} Jahre. In einer Zeile steckt der Fehler.`,
      zeilen: [
        `Anschaffungspreis ${formatEuro(BASIS.ak)}`,
        `+ Montage ${formatEuro(BASIS.nebenkosten)}`,
        `= Abschreibungsbasis ${e(OHNE_RW.basis)}`,
        `÷ ${BASIS.nd} Jahre = ${e(OHNE_RW.linear!)} pro Jahr`,
      ],
      fehlerZeile: 2,
      gruende: [
        {
          text: `Der Restwert von ${formatEuro(BASIS.restwert)} wurde nicht abgezogen.`,
          richtig: true,
        },
        { text: 'Die Montagekosten gehören nicht zur Basis.' },
        { text: 'Linear wird durch die Summe der Jahresziffern geteilt.' },
      ],
      aufloesung: `Richtig wäre: ${e(LIN.basis)} Basis und damit ${e(LIN.linear!)} pro Jahr. Den Restwert bekommt die MBG am Ende zurück – er ist kein Wertverzehr.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Arithmetisch-degressiv Schritt für Schritt',
      text: `Basis ${e(ARI.basis)}, Nutzungsdauer ${BASIS.nd} Jahre.`,
      schritte: [
        {
          text: 'Summe der Jahresziffern',
          rechnung: `1 + 2 + 3 + 4 + 5 = ${ARI.summeZiffern}`,
          warum:
            'Jedes Jahr bekommt eine Ziffer. Die Summe sagt, in wie viele gleiche Teile die Basis zerlegt wird.',
        },
        {
          text: 'Degressionsbetrag',
          rechnung: `${e(ARI.basis)} ÷ ${ARI.summeZiffern} = ${e(ARI.degression!)}`,
          warum: 'Das ist ein „Teil“. Jedes Jahr bekommt so viele Teile, wie seine Ziffer angibt.',
        },
        {
          text: 'Jahr 1 bis 3',
          rechnung: ARI.jahre!.map(
            (j, i) => `Jahr ${i + 1}: ${BASIS.nd - i} × ${e(ARI.degression!)} = ${e(j)}`,
          ).join('; '),
          warum:
            'Im ersten Jahr mit der höchsten Ziffer multiplizieren – so sinken die Beträge jedes Jahr um denselben Betrag.',
        },
      ],
    },
    {
      typ: 'verstaendnis',
      frage: `Basis ${e(LEI.basis)}, die Maschine ist auf ${formatPlain(BASIS.gesamtLeistung!)} Betriebsstunden ausgelegt und läuft im ersten Jahr ${formatPlain(BASIS.leistungJahr1!)} Stunden. Wie hoch ist die leistungsbezogene Abschreibung im ersten Jahr?`,
      optionen: [
        {
          text: e(LEI.leistungJahr1!),
          richtig: true,
          erklaerung: `${e(LEI.basis)} ÷ ${formatPlain(BASIS.gesamtLeistung!)} h = ${formatEuro(LEI.satzJeEinheit!.value.toString())}/h; mal ${formatPlain(BASIS.leistungJahr1!)} h = ${e(LEI.leistungJahr1!)}.`,
        },
        {
          text: e(LIN.linear!),
          erklaerung:
            'Das ist der lineare Betrag. Leistungsbezogen zählt, wie viel die Maschine tatsächlich gelaufen ist.',
        },
        {
          text: e(ARI.jahre![0]!),
          erklaerung: 'Das ist der arithmetisch-degressive Betrag für Jahr 1.',
        },
      ],
    },
    {
      typ: 'verstaendnis',
      frage: `Geometrisch-degressiv: Anschaffungswert ${formatEuro(GEO_A)}, Restwert nach ${GEO_ND} Jahren ${formatEuro(GEO_RW)}. Welcher Abschreibungssatz gilt?`,
      figur: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Hier schrumpft der Buchwert jedes Jahr um denselben Prozentsatz. Der Satz muss genau beim Restwert landen.',
      },
      optionen: [
        {
          text: p(GEO_P),
          richtig: true,
          erklaerung: `p = 100 · (1 − ${GEO_ND}. Wurzel aus ${formatEuro(GEO_RW)} ÷ ${formatEuro(GEO_A)}) = ${p(GEO_P)}. Abschreibung Jahr 1: ${p(GEO_P)} von ${formatEuro(GEO_A)}, danach immer vom Restbuchwert des Vorjahres.`,
        },
        {
          text: p(GEO_P_FALSCH),
          erklaerung:
            'Hier wurde einfach durch die Nutzungsdauer geteilt. Weil der Satz auf den jeweils kleineren Restbuchwert angewendet wird, braucht man die n-te Wurzel.',
        },
        {
          text: formatProzent(new Val(GEO_RW).div(GEO_A).valueDp(4).toString()),
          erklaerung:
            'Das ist nur das Verhältnis von Restwert zu Anschaffungswert, kein jährlicher Satz.',
        },
      ],
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Arithmetisch-degressiv: Die Basis steht schon da. Ergänze Summe der Jahresziffern, Degressionsbetrag und die Abschreibung im ersten Jahr.',
      skillId: 'H4-kalk-afa',
      seed: 3,
      variant: 'arithmetisch',
      partId: 'afa',
      gefragt: ['summe', 'degression', 'j1'],
    },
    {
      typ: 'merksatz',
      id: 'H4-m1',
      frage:
        'Wie berechnet man die kalkulatorische Abschreibung (Basis, linear, arithmetisch-degressiv, leistungsbezogen)?',
      text: 'Basis = Anschaffungskosten + Nebenkosten − Restwert. Linear: Basis ÷ Nutzungsdauer. Arithmetisch-degressiv: Basis ÷ Summe der Jahresziffern, Jahr 1 mal n. Leistungsbezogen: Basis ÷ Gesamtleistung × Jahresleistung.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe:
        'Ermitteln Sie die Abschreibungsbasis und die jährliche kalkulatorische Abschreibung nach der linearen Methode.',
      part: { skillId: 'H4-kalk-afa', seed: 4, variant: 'linear', partId: 'afa' },
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Die Energieabteilung meldet Kosten von 30.000 € für den Monat. Aber wer hat den Strom eigentlich verbraucht?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Anschaffungspreis 50.000 €, Montage 2.000 €, Restwert 4.000 €, 4 Jahre. Lineare Abschreibung pro Jahr?',
      optionen: [{ text: '12.000 €', richtig: true }, { text: '13.000 €' }, { text: '12.500 €' }],
    },
    {
      frage:
        'Arithmetisch-degressiv, Basis 30.000 €, Nutzungsdauer 5 Jahre. Abschreibung im 1. Jahr?',
      optionen: [{ text: '10.000 €', richtig: true }, { text: '6.000 €' }, { text: '2.000 €' }],
    },
    {
      frage: 'Wodurch unterscheidet sich die kalkulatorische von der bilanziellen Abschreibung?',
      optionen: [
        {
          text: 'Sie richtet sich nach dem tatsächlichen Wertverzehr und kann in der Höhe abweichen.',
          richtig: true,
        },
        { text: 'Sie ist immer genau gleich hoch.' },
        { text: 'Sie wird nur bei Gebäuden angewendet.' },
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
      'K1 Kap. 2.4.1.1–2.4.1.3 (S. 69–74: kalkulatorisch ≠ bilanziell, Anschaffungskosten inkl. Montage, Restwert, linear/degressiv/Leistung) und 04-fachregeln.md Abschnitt 6 (geometrisch-degressiv) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
