// Lektion K1 – Kostenverlauf (eigene Formulierung; Themen nach den Lehrbuch-Übungen zur
// Teilkostenrechnung: Kostenfunktion, Beschäftigungsgrad, Fixkostendegression). Alle Beträge
// werden von der Engine berechnet.
import {
  gesamtkostenBei,
  kostenverlauf,
  solveKostenverlauf,
  type KostenverlaufParams,
  type VerlaufZeile,
} from '../../engine/generators/k1/kostenverlauf';
import { formatEuro, formatPlain, formatProzent } from '../../engine/money';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const eur = formatEuro;
const n = formatPlain;

const BEISPIEL: KostenverlaufParams = {
  produkt: 'Senne Lemon 0,33 l',
  einheit: 'Flaschen',
  sg: 'Flasche',
  variante: 'beschaeftigung',
  kf: '90000',
  kv: '0.3',
  kapazitaet: 500_000,
  grade: ['0.3', '0.6', '0.9'],
  istMenge: 400_000,
  monate: ['Oktober', 'November'],
  mengen: [200_000, 300_000],
  planMenge: 450_000,
};
const S = solveKostenverlauf(BEISPIEL);
const [FEB, MITTE, JULI] = S.zeilen as [VerlaufZeile, VerlaufZeile, VerlaufZeile];
const AUF = solveKostenverlauf({ ...BEISPIEL, variante: 'aufloesung' });
// Zusatzmenge im Juli: nur variable Kosten kommen dazu
const ZUSATZ = 50_000;
const MEHRKOSTEN = gesamtkostenBei(BEISPIEL, JULI.menge + ZUSATZ).minus(JULI.gesamt);
const FALSCH_MEHR = JULI.stueck.times(ZUSATZ);

// Klausurbrücke (eigene Zahlen)
const K: KostenverlaufParams = {
  produkt: 'Paderquell Energy 0,33 l',
  einheit: 'Dosen',
  sg: 'Dose',
  variante: 'beschaeftigung',
  kf: '72000',
  kv: '0.25',
  kapazitaet: 300_000,
  grade: ['0.5', '1'],
  istMenge: 240_000,
  monate: ['Mai', 'Juni'],
  mengen: [150_000, 300_000],
  planMenge: 240_000,
};
const K_TEIL = kostenverlauf
  .parts(K, solveKostenverlauf(K))
  .find((p) => p.id === 'verlauf') as TaskPart;

export const lektionK1: Lektion = {
  id: 'K1',
  skillId: 'K1-kostenverlauf',
  abschnitt: 'K',
  titel: 'Kostenverlauf: Warum die Flasche im Sommer billiger ist',
  kernAha:
    'Fixkosten bleiben gleich, variable Kosten wachsen mit der Menge. Steigt die Beschäftigung, verteilen sich die Fixkosten auf mehr Einheiten – die Stückkosten sinken (Fixkostendegression).',
  dauerMin: 7,
  figuren: ['leni', 'tobias', 'jana'],
  ort: 'abfuellung',
  quelle:
    'Lehrbuch-Übungen Teilkostenrechnung (Kostenverlauf, Kostenfunktion, Beschäftigungsgrad); 04-fachregeln.md',
  teaser: {
    figur: 'leni',
    ausdruck: 'gruebelt',
    text: 'Gleiche Flasche, gleiche Zutaten – und trotzdem andere Kosten je Flasche?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: `Im Februar hat uns eine Flasche Senne Lemon ${eur(FEB.stueck)} gekostet, im Juli nur ${eur(JULI.stueck)}. Dabei sind Zucker und Glas nicht billiger geworden.`,
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Dann war die Abfüllung im Juli einfach fleißiger?',
        },
      ],
      frage: 'Warum sinken die Kosten je Flasche, obwohl kein Einkaufspreis gesunken ist?',
    },
    {
      typ: 'dialog',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Denk an eine WG: Die Miete bleibt gleich, egal ob zwei oder vier Leute einziehen. Zu viert zahlt jeder nur halb so viel Miete wie zu zweit.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Den eigenen Einkauf zahlt aber jeder selbst. Genau so gibt es bei uns fixe und variable Kosten.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Fix oder variabel?',
      text: 'Ändert sich der Betrag, wenn im Monat mehr Flaschen abgefüllt werden?',
      kategorien: ['fixe Kosten', 'variable Kosten'],
      elemente: [
        {
          text: 'Miete für die Lagerhalle',
          kategorie: 'fixe Kosten',
          erklaerung: 'Die Miete ist jeden Monat gleich, egal wie viel abgefüllt wird.',
        },
        {
          text: 'Zucker und Aromen für den Sirup',
          kategorie: 'variable Kosten',
          erklaerung: 'Jede Flasche braucht ihren Sirup.',
        },
        {
          text: 'Glasflaschen und Kronkorken',
          kategorie: 'variable Kosten',
          erklaerung: 'Doppelte Menge, doppelt so viele Flaschen.',
        },
        {
          text: 'Gehalt im Controlling',
          kategorie: 'fixe Kosten',
          erklaerung: 'Das Gehalt hängt nicht von der Abfüllmenge ab.',
        },
        {
          text: 'Zeitabschreibung der Abfüllanlage',
          kategorie: 'fixe Kosten',
          erklaerung: 'Sie fällt auch an, wenn die Anlage stillsteht.',
        },
        {
          text: 'Etiketten',
          kategorie: 'variable Kosten',
          erklaerung: 'Jede Flasche bekommt ein Etikett.',
        },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Die Kostenfunktion',
      text: 'Fixkosten (K_f) bleiben jeden Monat gleich. Variable Kosten wachsen mit jeder Flasche (k_v je Stück). Zusammen ergeben sie die Kostenfunktion K(x) = K_f + k_v · x.',
      visual: {
        typ: 'karten',
        karten: [
          { titel: 'Fixkosten K_f', text: `${eur(BEISPIEL.kf)} je Monat`, farbe: '#1c6670' },
          {
            titel: 'variable Kosten k_v',
            text: `${eur(BEISPIEL.kv)} je Flasche`,
            farbe: '#e8792b',
          },
          {
            titel: `Gesamtkosten bei ${n(MITTE.menge)} Flaschen`,
            text: `${eur(BEISPIEL.kf)} + ${n(MITTE.menge)} × ${eur(BEISPIEL.kv)} = ${eur(MITTE.gesamt)}`,
            farbe: '#8cbf3f',
          },
        ],
      },
    },
    {
      typ: 'vorhersage',
      frage: `Statt ${n(FEB.menge)} werden ${n(MITTE.menge)} Flaschen abgefüllt. Was passiert mit den Fixkosten je Flasche?`,
      optionen: [
        { text: 'Sie halbieren sich.', richtig: true },
        { text: 'Sie bleiben gleich.' },
        { text: 'Sie verdoppeln sich.' },
      ],
      aufloesung: `${eur(BEISPIEL.kf)} ÷ ${n(FEB.menge)} = ${eur(FEB.fixJeStueck)}, aber ÷ ${n(MITTE.menge)} = ${eur(MITTE.fixJeStueck)}. Die Fixkosten insgesamt bleiben, sie verteilen sich nur auf doppelt so viele Flaschen.`,
    },
    {
      typ: 'erkunden',
      titel: 'Drei Monate an der Abfüllanlage',
      text: `Die Anlage schafft ${n(BEISPIEL.kapazitaet)} Flaschen im Monat. Der Beschäftigungsgrad zeigt die Auslastung: abgefüllte Menge ÷ Kapazität × 100. Decke auf, was eine Flasche jeweils kostet.`,
      erkunden: {
        art: 'aufdecken',
        karten: S.zeilen.map((z, i) => ({
          titel: `${formatProzent(z.grad)} Auslastung: ${n(z.menge)} Flaschen`,
          text: `Gesamtkosten ${eur(z.gesamt)}; Fixkosten je Flasche ${eur(z.fixJeStueck)}; Stückkosten ${eur(z.stueck)}`,
          farbe: ['#b8475a', '#e2b13c', '#8cbf3f'][i]!,
        })),
      },
      fazit:
        'Je höher der Beschäftigungsgrad, desto niedriger die Stückkosten. Die variablen Kosten je Flasche bleiben gleich – nur der Fixkostenanteil schrumpft. Das heißt Fixkostendegression.',
    },
    {
      typ: 'vorgerechnet',
      titel: 'Wenn nur die Gesamtkosten bekannt sind',
      text: `Leni kennt aus zwei Monaten nur die Gesamtkosten: ${BEISPIEL.monate[0]} ${n(BEISPIEL.mengen[0])} Flaschen für ${eur(AUF.kosten[0])}, ${BEISPIEL.monate[1]} ${n(BEISPIEL.mengen[1])} Flaschen für ${eur(AUF.kosten[1])}.`,
      schritte: [
        {
          text: 'Differenzen bilden',
          rechnung: `${eur(AUF.kosten[1])} − ${eur(AUF.kosten[0])} = ${eur(AUF.dK)}; ${n(BEISPIEL.mengen[1])} − ${n(BEISPIEL.mengen[0])} = ${n(AUF.dx.exact)} Flaschen`,
          warum:
            'Die Fixkosten sind in beiden Monaten gleich. Die Mehrkosten entstehen nur durch die zusätzlichen Flaschen.',
        },
        {
          text: 'Variable Kosten je Flasche',
          rechnung: `${eur(AUF.dK)} ÷ ${n(AUF.dx.exact)} = ${eur(AUF.kv)}`,
          warum: 'So viel kostet jede zusätzliche Flasche.',
        },
        {
          text: 'Fixkosten',
          rechnung: `${eur(AUF.kosten[0])} − ${n(BEISPIEL.mengen[0])} × ${eur(AUF.kv)} = ${eur(AUF.kf)}`,
          warum: 'Was nach Abzug der variablen Kosten übrig bleibt, ist fix.',
        },
        {
          text: 'Kostenfunktion',
          rechnung: `K(x) = ${eur(AUF.kf)} + ${eur(AUF.kv)} · x`,
          warum: 'Damit lassen sich die Kosten jeder Menge vorhersagen.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: `Im Juli kostet eine Flasche ${eur(JULI.stueck)}. Ein Kunde will zusätzlich ${n(ZUSATZ)} Flaschen, die Kapazität reicht. Um wie viel steigen die Kosten?`,
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: `${n(ZUSATZ)} mal ${eur(JULI.stueck)} macht ${eur(FALSCH_MEHR)} mehr Kosten.`,
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: `Es kommen nur die variablen Kosten dazu, also ${eur(MEHRKOSTEN)}.`,
      },
      richtig: 'b',
      begruendungen: [
        {
          text: `Die Fixkosten fallen ohnehin an; zusätzlich entstehen nur ${eur(BEISPIEL.kv)} je Flasche.`,
          richtig: true,
        },
        { text: `Die Stückkosten von ${eur(JULI.stueck)} gelten für jede beliebige Menge.` },
        { text: 'Für zusätzliche Flaschen entstehen gar keine Kosten.' },
      ],
      aufloesung: `In den ${eur(JULI.stueck)} stecken ${eur(JULI.fixJeStueck)} Fixkosten je Flasche, die nicht noch einmal anfallen. Gesamtkosten steigen von ${eur(JULI.gesamt)} auf ${eur(JULI.gesamt.plus(MEHRKOSTEN))}.`,
    },
    {
      typ: 'verstaendnis',
      frage: `Die Anlage schafft ${n(BEISPIEL.kapazitaet)} Flaschen im Monat, im März werden ${n(BEISPIEL.istMenge)} abgefüllt. Wie hoch ist der Beschäftigungsgrad?`,
      optionen: [
        {
          text: `${n(S.grad.value)} %`,
          richtig: true,
          erklaerung: `${n(BEISPIEL.istMenge)} ÷ ${n(BEISPIEL.kapazitaet)} × 100 = ${n(S.grad.value)} %.`,
        },
        {
          text: '125 %',
          erklaerung:
            'Umgekehrt geteilt: Die Ist-Menge gehört in den Zähler, die Kapazität in den Nenner.',
        },
        {
          text: '20 %',
          erklaerung: 'Das ist die freie Kapazität, nicht die Auslastung.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'K1-m1',
      frage:
        'Wie verhalten sich fixe Kosten, variable Kosten und Stückkosten, wenn die Beschäftigung steigt?',
      text: 'Kostenfunktion: K(x) = K_f + k_v · x. Die Fixkosten bleiben gleich, die variablen Kosten steigen mit der Menge. Je Stück bleiben die variablen Kosten gleich, die Fixkosten je Stück sinken (Fixkostendegression) – deshalb sinken die Stückkosten.',
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Zwei neue Monate, gleiches Muster. Ergänze die variablen Kosten je Einheit und die Fixkosten.',
      skillId: 'K1-kostenverlauf',
      seed: 4,
      variant: 'aufloesung',
      partId: 'aufloesung',
      gefragt: ['kv', 'kf'],
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe: `Die Abfüllanlage für ${K.produkt} hat eine Kapazität von ${n(K.kapazitaet)} Dosen im Monat. Die fixen Kosten betragen ${eur(K.kf)} je Monat, die variablen Kosten ${eur(K.kv)} je Dose. Ermitteln Sie für Beschäftigungsgrade von ${K.grade.map((g) => formatProzent(g)).join(' und ')} die Gesamtkosten, die fixen Kosten je Dose und die Stückkosten.`,
      part: K_TEIL,
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Gut zu wissen, was eine Flasche kostet. Aber was bleibt uns eigentlich vom Verkaufspreis übrig?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Fixkosten 60.000 € im Monat, 200.000 Flaschen. Wie hoch sind die Fixkosten je Flasche?',
      optionen: [{ text: '0,30 €', richtig: true }, { text: '3,33 €' }, { text: '0,60 €' }],
    },
    {
      frage:
        'Was passiert bei linearem Kostenverlauf mit den variablen Kosten je Stück, wenn die Menge steigt?',
      optionen: [
        { text: 'Sie bleiben gleich.', richtig: true },
        { text: 'Sie sinken.' },
        { text: 'Sie steigen.' },
      ],
    },
    {
      frage:
        'Oktober: 100.000 Stück, Gesamtkosten 50.000 €. November: 150.000 Stück, Gesamtkosten 60.000 €. Wie hoch sind die variablen Kosten je Stück?',
      optionen: [{ text: '0,20 €', richtig: true }, { text: '0,40 €' }, { text: '0,50 €' }],
    },
  ],
  checkliste: {
    raetsel: true,
    alltagVorFachbegriff: true,
    kernAhaErreicht: true,
    figurImDialog: true,
    klausurbrueckeUndCliffhanger: true,
    fachlichGeprueft:
      'Lehrbuch-Übungen Teilkostenrechnung (Gesamt- und Stückkosten bei verschiedenen Produktionsmengen, Kostenfunktion, Beschäftigungsgrad) inhaltlich abgeglichen am 03.11.2026; Differenzen-Quotienten-Verfahren als allgemeines Lehrbuchwissen [ANNAHME – bitte prüfen, docs/m7/k1.md]',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
