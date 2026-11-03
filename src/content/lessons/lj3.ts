// Lektion J3 – Äquivalenzziffernkalkulation (eigene Formulierung; geprüft gegen K2 Kap. 2.2.2, S. 59–60).
// Alle Beträge werden von der Engine berechnet.
import {
  aequivalenz,
  solveAequivalenz,
  type AequivalenzParams,
} from '../../engine/generators/aequivalenz';
import { dec, formatEuro, formatPlain, sum } from '../../engine/money';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const BEISPIEL: AequivalenzParams = {
  sorten: [
    { name: 'Paderquell Energy 0,25 l', menge: 2000, aez: '0.8' },
    { name: 'Paderquell Energy 0,33 l', menge: 5000, aez: '1' },
    { name: 'Paderquell Energy 0,5 l', menge: 1000, aez: '1.5' },
  ],
  basis: 1,
  gesamtkosten: '81000',
  variante: 'ziffern',
};
const S = solveAequivalenz(BEISPIEL);
const MENGE = sum(BEISPIEL.sorten.map((s) => s.menge));
// Tobias' Weg: alle Kartons gleich behandeln
const JE_KARTON = dec(BEISPIEL.gesamtkosten).div(MENGE.value);
const KURZ = ['0,25 l', '0,33 l', '0,5 l'];

// Klausurbrücke (eigene Zahlen)
const K: AequivalenzParams = {
  sorten: [
    { name: 'Paderquell Energy 0,33 l', menge: 3000, aez: '1' },
    { name: 'Paderquell Energy 0,5 l', menge: 2000, aez: '1.25' },
    { name: 'Paderquell Energy 1,0 l', menge: 1000, aez: '2' },
  ],
  basis: 0,
  gesamtkosten: '90000',
  variante: 'ziffern',
};
const K_TEIL = aequivalenz.parts(K, solveAequivalenz(K)).find((p) => p.id === 'stueck') as TaskPart;

export const lektionJ3: Lektion = {
  id: 'J3',
  skillId: 'J3-aequivalenz',
  abschnitt: 'J',
  titel: 'Äquivalenzziffern: Was kostet welche Dose?',
  kernAha:
    'Ähnliche Sorten werden über Äquivalenzziffern vergleichbar gemacht: Menge × Ziffer ergibt Rechnungseinheiten, und erst die Kosten je Rechnungseinheit × Ziffer liefern die Stückkosten.',
  dauerMin: 7,
  figuren: ['leni', 'tobias', 'jana'],
  ort: 'abfuellung',
  quelle: 'K2 2.2.2 (S. 59–60); 04-fachregeln.md',
  teaser: {
    figur: 'tobias',
    ausdruck: 'gruebelt',
    text: 'Drei Dosengrößen, eine Kostensumme. Wer bezahlt wie viel davon?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: `Die Abfüllung hat im Mai ${formatEuro(BEISPIEL.gesamtkosten)} gekostet – für drei Dosengrößen Paderquell Energy.`,
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: `Einfach durch alle ${formatPlain(MENGE.value)} Kartons teilen. Fertig!`,
        },
      ],
      frage: 'Kostet ein Karton kleiner Dosen wirklich so viel wie ein Karton großer?',
    },
    {
      typ: 'dialog',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Im Café kostet der große Kaffee mehr als der kleine. Es ist dasselbe Getränk, nur braucht der große mehr Bohnen und Milch.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Bei uns ist es genauso: Die Dosen sind ähnlich, verursachen aber unterschiedlich viel Kosten.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Tobias teilt ${formatEuro(BEISPIEL.gesamtkosten)} durch ${formatPlain(MENGE.value)} Kartons. Was passiert mit den Preisen?`,
      optionen: [
        { text: 'Kleine Dosen werden zu teuer, große zu billig kalkuliert.', richtig: true },
        { text: 'Alle Sorten werden richtig kalkuliert.' },
        { text: 'Kleine Dosen werden zu billig, große zu teuer kalkuliert.' },
      ],
      aufloesung: `Jeder Karton bekäme ${formatEuro(JE_KARTON, 3)}. Die kleinen Dosen tragen dann Kosten, die eigentlich die großen verursachen.`,
    },
    {
      typ: 'konzept',
      titel: 'Gleichnamig machen',
      text: 'Eine Sorte erhält die Ziffer 1. Die anderen Ziffern zeigen, wie viel Kosten ein Karton im Verhältnis dazu verursacht. Menge × Ziffer ergibt Rechnungseinheiten (RE), die man zusammenzählen darf.',
      visual: {
        typ: 'karten',
        karten: BEISPIEL.sorten.map((s, i) => ({
          titel: KURZ[i]!,
          text: `Ziffer ${formatPlain(s.aez)} → ${formatPlain(s.menge)} × ${formatPlain(s.aez)} = ${formatPlain(S.re[i]!.value)} RE`,
        })),
      },
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Was bedeutet die Ziffer 1,5 für die 0,5-l-Dose?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Ein Karton 0,5 l kostet 1,50 € mehr als ein Karton 0,33 l.',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Ein Karton 0,5 l kostet das 1,5-Fache eines Kartons 0,33 l.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Äquivalenzziffern sind Verhältniszahlen zur Einheitssorte, keine Eurobeträge.',
          richtig: true,
        },
        { text: 'Äquivalenzziffern geben den Verkaufspreis an.' },
        { text: 'Die Ziffer zeigt, wie viele Dosen in einem Karton sind.' },
      ],
      aufloesung: `Kostet ein Karton der Einheitssorte ${formatEuro(S.stueckkosten[1]!)}, dann kostet ein Karton 0,5 l ${formatEuro(S.stueckkosten[1]!)} × 1,5 = ${formatEuro(S.stueckkosten[2]!)}.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Schritt für Schritt',
      text: `Gesamtkosten ${formatEuro(BEISPIEL.gesamtkosten)}; Einheitssorte ist die 0,33-l-Dose.`,
      schritte: [
        {
          text: 'Rechnungseinheiten bilden',
          rechnung: BEISPIEL.sorten
            .map(
              (s, i) =>
                `${formatPlain(s.menge)} × ${formatPlain(s.aez)} = ${formatPlain(S.re[i]!.value)}`,
            )
            .join('; '),
          warum: 'So werden die Sorten vergleichbar gemacht.',
        },
        {
          text: 'Rechnungseinheiten addieren',
          rechnung: `${S.re.map((r) => formatPlain(r.value)).join(' + ')} = ${formatPlain(S.summeRe.value)} RE`,
          warum: 'Erst jetzt darf man zusammenzählen – alles ist in derselben Einheit.',
        },
        {
          text: 'Kosten je Rechnungseinheit',
          rechnung: `${formatEuro(BEISPIEL.gesamtkosten)} ÷ ${formatPlain(S.summeRe.value)} = ${formatEuro(S.kostenJeRe)}`,
          warum: 'Das sind die Kosten eines Kartons der Einheitssorte.',
        },
        {
          text: 'Stückkosten je Sorte',
          rechnung: BEISPIEL.sorten
            .map(
              (s, i) =>
                `${KURZ[i]}: ${formatEuro(S.kostenJeRe)} × ${formatPlain(s.aez)} = ${formatEuro(S.stueckkosten[i]!)}`,
            )
            .join('; '),
          warum: 'Jede Sorte zahlt entsprechend ihrer Ziffer.',
        },
        {
          text: 'Kontrolle',
          rechnung: `${S.kostenSorte.map((k) => formatEuro(k)).join(' + ')} = ${formatEuro(sum(S.kostenSorte))}`,
          warum: 'Die Kosten aller Sorten ergeben wieder die Gesamtkosten.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege hat gerechnet',
      text: 'Eine Zeile ist falsch. Tippe sie an.',
      zeilen: [
        `Rechnungseinheiten: ${formatPlain(S.summeRe.value)} RE`,
        `Kosten je RE: ${formatEuro(BEISPIEL.gesamtkosten)} ÷ ${formatPlain(MENGE.value)} = ${formatEuro(JE_KARTON, 3)}`,
        `Stückkosten 0,5 l: Kosten je RE × 1,5`,
      ],
      fehlerZeile: 1,
      gruende: [
        {
          text: 'Er hat durch die Kartons statt durch die Rechnungseinheiten geteilt.',
          richtig: true,
        },
        { text: 'Die Gesamtkosten müssen vorher durch 3 Sorten geteilt werden.' },
        { text: 'Kosten je RE werden nicht berechnet, sondern sind vorgegeben.' },
      ],
      aufloesung: `Richtig ist ${formatEuro(BEISPIEL.gesamtkosten)} ÷ ${formatPlain(S.summeRe.value)} RE = ${formatEuro(S.kostenJeRe)}. Wer durch Kartons teilt, macht die Ziffern wirkungslos.`,
    },
    {
      typ: 'verstaendnis',
      frage:
        'Eine neue Literdose verursacht je Karton 40 % mehr Kosten als die Einheitssorte. Welche Äquivalenzziffer bekommt sie?',
      optionen: [
        {
          text: '1,4',
          richtig: true,
          erklaerung: '100 % plus 40 % ergibt das 1,4-Fache der Einheitssorte.',
        },
        { text: '0,4', erklaerung: 'Das wäre nur der Aufschlag, nicht die ganze Ziffer.' },
        { text: '0,6', erklaerung: 'Das wäre eine Sorte mit 40 % weniger Kosten.' },
      ],
    },
    {
      typ: 'merksatz',
      id: 'J3-m1',
      frage: 'Wie geht die Äquivalenzziffernkalkulation?',
      text: 'Menge × Äquivalenzziffer = Rechnungseinheiten. Gesamtkosten ÷ Summe der RE = Kosten je RE. Kosten je RE × Ziffer = Stückkosten der Sorte.',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe: `Die MBG füllt Paderquell Energy in drei Größen ab; die Gesamtkosten betragen ${formatEuro(K.gesamtkosten)}. ${K.sorten
        .map(
          (s) =>
            `${s.name.replace('Paderquell Energy ', '')}: ${formatPlain(s.menge)} Kartons, Äquivalenzziffer ${formatPlain(s.aez)}`,
        )
        .join('; ')}. Ermitteln Sie die Stückkosten je Karton und die Kosten je Sorte.`,
      part: K_TEIL,
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'ueberrascht',
        text: 'Eine Hotelkette will 2.000 Kartons Senne Lemon. Was sag ich denen für einen Preis?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Sorte A: 1.000 Kartons, Ziffer 1. Sorte B: 500 Kartons, Ziffer 2. Wie viele Rechnungseinheiten sind es insgesamt?',
      optionen: [{ text: '2.000', richtig: true }, { text: '1.500' }, { text: '3.000' }],
    },
    {
      frage: 'Wie ermittelt man die Stückkosten einer Sorte?',
      optionen: [
        { text: 'Kosten je Rechnungseinheit × Äquivalenzziffer', richtig: true },
        { text: 'Gesamtkosten ÷ Anzahl aller Kartons' },
        { text: 'Kosten je Rechnungseinheit + Äquivalenzziffer' },
      ],
    },
    {
      frage:
        'Eine Sorte verursacht 20 % weniger Kosten als die Einheitssorte. Welche Ziffer hat sie?',
      optionen: [{ text: '0,8', richtig: true }, { text: '0,2' }, { text: '1,2' }],
    },
  ],
  checkliste: {
    raetsel: true,
    alltagVorFachbegriff: true,
    kernAhaErreicht: true,
    figurImDialog: true,
    klausurbrueckeUndCliffhanger: true,
    fachlichGeprueft:
      'K2 Kap. 2.2.2 (S. 59–60: einstufige Äquivalenzziffernkalkulation, Einheitssorte mit Ziffer 1, Rechnungseinheiten, Kosten je RE × Ziffer) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
