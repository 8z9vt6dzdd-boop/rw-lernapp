// Lektion G4 – Fixe und variable Kosten (eigene Formulierung; geprüft gegen K1 Kap. 1.4.1, S. 30–32).
// Alle Beträge kommen aus der Engine (generators/g/g4-fix-variabel.ts, GC-G4-1).
import { solveG4, type G4Params } from '../../engine/generators/g/g4-fix-variabel';
import { formatEuro, formatPlain, type Val } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value.toString());

const BASIS: G4Params = {
  variante: 'kostenfunktion',
  kf: '140000',
  kv: '40',
  x1: 4000,
  x2: 6000,
  x3: 5000,
};
const S = solveG4(BASIS);
const bei = (x: number) => solveG4({ ...BASIS, x3: x });
const [K2000, K4000, K8000] = [bei(2000), bei(4000), bei(8000)];
const FALSCH = solveG4(BASIS, 'durchschnitt');
const hl = (x: number) => `${formatPlain(x)} hl`;

export const lektionG4: Lektion = {
  id: 'G4',
  skillId: 'G4-fix-variabel',
  abschnitt: 'G',
  titel: 'Fixe und variable Kosten: Warum der Sirup im Sommer billiger wird',
  kernAha:
    'Fixe Kosten bleiben bei jeder Menge gleich, variable Kosten steigen mit der Menge; bei linearem Verlauf gilt K = Kf + kv · x. Je mehr produziert wird (innerhalb der Kapazität), desto kleiner wird der Fixkostenanteil je Einheit – die Stückkosten sinken. Aus zwei Beschäftigungen ergibt sich kv als Kostendifferenz ÷ Mengendifferenz.',
  dauerMin: 8,
  figuren: ['leni', 'tobias', 'jana'],
  ort: 'abfuellung',
  quelle: 'K1 1.4.1 (S. 30–32)',
  teaser: {
    figur: 'tobias',
    ausdruck: 'ueberrascht',
    text: 'Doppelte Menge, aber nicht doppelte Kosten. Wie geht das?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: `Im Februar haben wir ${hl(4000)} Sirup angesetzt, im Juli ${hl(8000)}. Die Kosten stiegen aber nur von ${e(K4000.k3gesamt!)} auf ${e(K8000.k3gesamt!)}.`,
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Dann ist Sirup im Sommer einfach billiger. Lass uns nur noch im Juli produzieren!',
        },
      ],
      frage: 'Wie kann die doppelte Menge weniger als das Doppelte kosten?',
    },
    {
      typ: 'dialog',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Denk an deinen Handyvertrag: Die Grundgebühr zahlst du jeden Monat, die Extra-Minuten nur, wenn du telefonierst.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'In der Kostenrechnung heißt die Grundgebühr fixe Kosten. Was mit der Menge mitwächst, sind variable Kosten.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Fix oder variabel?',
      text: 'Was passiert mit dem Betrag, wenn die MBG doppelt so viel Sirup ansetzt?',
      kategorien: ['Fixe Kosten', 'Variable Kosten'],
      elemente: [
        { text: 'Zucker für den Sirup', kategorie: 'Variable Kosten' },
        {
          text: 'Miete der Lagerhalle',
          kategorie: 'Fixe Kosten',
          erklaerung: 'Die Miete ist pro Monat vereinbart, nicht pro Hektoliter.',
        },
        { text: 'Akkordlohn je Palette', kategorie: 'Variable Kosten' },
        { text: 'Gehalt der Werkleiterin', kategorie: 'Fixe Kosten' },
        {
          text: 'Zeitabhängige Abschreibung der Sirupanlage',
          kategorie: 'Fixe Kosten',
          erklaerung: 'Jeden Monat gleich viel, auch wenn die Anlage steht.',
        },
        { text: 'Kohlensäure für die Abfüllung', kategorie: 'Variable Kosten' },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Die Kostenfunktion',
      text: 'Bei linearem Verlauf gilt K = Kf + kv · x: Fixkosten plus variable Stückkosten mal Menge. Die Stückkosten k = K ÷ x bestehen aus kv und dem Fixkostenanteil Kf ÷ x.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Fixkosten Kf',
            text: `${e(S.kf!)} je Monat, bei jeder Menge`,
            farbe: '#1c6670',
          },
          {
            titel: 'Variable Stückkosten kv',
            text: `${e(S.kv!)} je Hektoliter`,
            farbe: '#e8792b',
          },
          {
            titel: `Bei ${hl(5000)}`,
            text: `K = ${e(S.kf!)} + ${e(S.kv!)} × 5.000 = ${e(S.k3gesamt!)}`,
            farbe: '#e2b13c',
          },
        ],
      },
    },
    {
      typ: 'erkunden',
      titel: 'Die Fixkosten verteilen sich',
      text: 'Decke auf, was ein Hektoliter Sirup bei verschiedenen Mengen kostet.',
      erkunden: {
        art: 'aufdecken',
        karten: [
          {
            titel: hl(2000),
            text: `Fixkostenanteil ${e(K2000.kf3!)} + variabel ${e(S.kv!)} = ${e(K2000.k3!)} je hl`,
            farbe: '#e8792b',
          },
          {
            titel: hl(4000),
            text: `Fixkostenanteil ${e(K4000.kf3!)} + variabel ${e(S.kv!)} = ${e(K4000.k3!)} je hl`,
            farbe: '#e2b13c',
          },
          {
            titel: hl(8000),
            text: `Fixkostenanteil ${e(K8000.kf3!)} + variabel ${e(S.kv!)} = ${e(K8000.k3!)} je hl`,
            farbe: '#8cbf3f',
          },
        ],
      },
      fazit:
        'Die variablen Stückkosten bleiben gleich; nur der Fixkostenanteil je Hektoliter schrumpft. Deshalb sinken die Stückkosten mit steigender Menge.',
    },
    {
      typ: 'vorhersage',
      frage: `Wenn die Menge von ${hl(4000)} auf ${hl(8000)} steigt: Was passiert mit den Stückkosten?`,
      optionen: [
        { text: 'Sie halbieren sich.' },
        { text: `Sie sinken von ${e(K4000.k3!)} auf ${e(K8000.k3!)} je hl.`, richtig: true },
        { text: 'Sie bleiben gleich, weil alles mitwächst.' },
      ],
      aufloesung: `Nur der Fixkostenanteil halbiert sich (von ${e(K4000.kf3!)} auf ${e(K8000.kf3!)}). Die ${e(S.kv!)} variable Kosten je Hektoliter bleiben. Tobias hat also halb recht: Sirup wird im Sommer je Hektoliter billiger – aber nur, weil sich die Fixkosten auf mehr Menge verteilen.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Kostenfunktion aus zwei Monaten',
      text: `Monat A: ${hl(4000)}, ${e(S.k1!)}. Monat B: ${hl(6000)}, ${e(S.k2!)}.`,
      schritte: [
        {
          text: 'Variable Stückkosten',
          rechnung: `(${e(S.k2!)} − ${e(S.k1!)}) ÷ (6.000 − 4.000) hl = ${e(S.kv!)} je hl`,
          warum:
            'Die Fixkosten sind in beiden Monaten gleich. Die Differenz entsteht nur durch die zusätzlichen Hektoliter.',
        },
        {
          text: 'Fixkosten',
          rechnung: `${e(S.k1!)} − ${e(S.kv!)} × 4.000 = ${e(S.kf!)}`,
          warum: 'Was nach Abzug der variablen Kosten übrig bleibt, fällt bei jeder Menge an.',
        },
        {
          text: 'Kostenfunktion',
          rechnung: `K = ${e(S.kf!)} + ${e(S.kv!)} · x`,
          warum: 'Damit lassen sich die Kosten für jede andere Menge vorhersagen.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege bestimmt die Kostenfunktion',
      text: `Gegeben: ${hl(4000)} kosten ${e(S.k1!)}, ${hl(6000)} kosten ${e(S.k2!)}. In einer Zeile steckt der Fehler.`,
      zeilen: [
        'Annahme: linearer Kostenverlauf K = Kf + kv · x',
        `kv = ${e(S.k1!)} ÷ 4.000 hl = ${e(FALSCH.kv!)} je hl`,
        `Kf = ${e(S.k1!)} − ${e(FALSCH.kv!)} × 4.000 = ${e(FALSCH.kf!)}`,
      ],
      fehlerZeile: 1,
      gruende: [
        {
          text: 'Gesamtkosten ÷ Menge enthält auch die Fixkosten; kv ist Kostendifferenz ÷ Mengendifferenz.',
          richtig: true,
        },
        { text: 'Ein linearer Kostenverlauf darf nicht angenommen werden.' },
        { text: 'Die Fixkosten sind immer null.' },
      ],
      aufloesung: `Richtig: kv = (${e(S.k2!)} − ${e(S.k1!)}) ÷ 2.000 hl = ${e(S.kv!)}, Kf = ${e(S.kf!)}. Mit ${e(FALSCH.kv!)} je hl würde der Kollege für ${hl(6000)} schon ${e(FALSCH.kv!.times(6000))} vorhersagen.`,
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Neue Monate, neue Zahlen: Ermittle die variablen Stückkosten und die Fixkosten.',
      skillId: 'G4-fix-variabel',
      seed: 6,
      variant: 'kostenfunktion',
      partId: 'funktion',
      gefragt: ['kv', 'kf'],
    },
    {
      typ: 'merksatz',
      id: 'G4-m1',
      frage:
        'Wie verhalten sich fixe und variable Kosten, und wie bestimmt man die Kostenfunktion?',
      text: 'Fixe Kosten fallen unabhängig von der Menge an, variable Kosten ändern sich mit ihr. Bei linearem Verlauf: K = Kf + kv · x; kv = Kostendifferenz ÷ Mengendifferenz. Steigt die Menge, sinken die Stückkosten, weil sich die Fixkosten auf mehr Einheiten verteilen.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe:
        'Ermitteln Sie die gesamten variablen Kosten, die Fixkosten und die Gesamtkosten bei der angegebenen Beschäftigung.',
      part: { skillId: 'G4-fix-variabel', seed: 2, variant: 'beschaeftigungsgrad', partId: 'grad' },
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Die Fixkosten tragen alle Sorten gemeinsam. Aber welche Kosten gehören eindeutig zu einer einzigen Charge?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Welche Kosten sind fix?',
      optionen: [
        { text: 'Miete der Lagerhalle', richtig: true },
        { text: 'Zucker für den Sirup' },
        { text: 'Akkordlohn je Palette' },
      ],
    },
    {
      frage:
        '2.000 Stück kosten 50.000 €, 3.000 Stück kosten 60.000 €. Wie hoch sind die variablen Stückkosten?',
      optionen: [{ text: '10 €', richtig: true }, { text: '20 €' }, { text: '25 €' }],
    },
    {
      frage: 'Was passiert mit den Stückkosten, wenn die Menge steigt (Fixkosten vorhanden)?',
      optionen: [
        { text: 'Sie sinken, weil der Fixkostenanteil je Stück kleiner wird.', richtig: true },
        { text: 'Sie steigen.' },
        { text: 'Sie bleiben gleich.' },
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
      'K1 1.4.1 (S. 30–32: fixe Kosten unabhängig von der Menge, variable Kosten mit der Menge, lineare Kostenfunktion K = kv · x + Kf, Stückkosten und fixe Stückkosten, intervallfixe Kosten) abgeglichen am 03.11.2026; Zahlen aus der Engine (GC-G4-1)',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
