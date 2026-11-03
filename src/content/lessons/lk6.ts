// Lektion K6 – Engpass Abfüllanlage (eigene Formulierung; Inhalt nach den Lehrbuch-Übungen zum
// relativen Deckungsbeitrag, Golden Case GC-23 aus 04-fachregeln.md). Alle Beträge rechnet die Engine.
import { solveEngpass, type EngpassParams } from '../../engine/generators/k2/k6-engpass';
import { dec, formatEuro, formatPlain } from '../../engine/money';
import { FIRMA } from '../../config';
import type { Lektion } from './types';

// GC-23
const GC23: EngpassParams = {
  variante: 'db-gegeben',
  kapazitaet: 10_000,
  produkte: [
    { name: FIRMA.produkte.bier, kurz: 'A', db: '0.3', zeit: '0.05', maxAbsatz: 80_000 },
    { name: FIRMA.produkte.lemon, kurz: 'B', db: '0.4', zeit: '0.08', maxAbsatz: 100_000 },
    { name: FIRMA.produkte.energy, kurz: 'C', db: '0.2', zeit: '0.025', maxAbsatz: 200_000 },
  ],
};
const S = solveEngpass(GC23);
const F = solveEngpass(GC23, { nachAbsolutemDb: true });
const [A, B, C] = GC23.produkte as [
  EngpassParams['produkte'][number],
  EngpassParams['produkte'][number],
  EngpassParams['produkte'][number],
];
const bedarf = GC23.produkte.reduce((a, pr) => a.plus(dec(pr.zeit).times(pr.maxAbsatz)), dec(0));

const e = formatEuro;
const n = formatPlain;
const rel = (i: number) => `${e(S.relDb[i]!)} je Minute`;

export const lektionK6: Lektion = {
  id: 'K6',
  skillId: 'K6-engpass',
  abschnitt: 'K',
  titel: 'Engpass: Die Abfüllanlage im Sommer',
  kernAha:
    'Ist eine Anlage der Engpass, zählt nicht der Deckungsbeitrag je Stück, sondern je Engpassminute (relativer Deckungsbeitrag). In dieser Rangfolge wird die Anlage belegt, jede Sorte bis zu ihrem Absatz.',
  dauerMin: 8,
  figuren: ['leni', 'tobias', 'jana'],
  ort: 'abfuellung',
  quelle:
    'Lehrbuch-Übungen Deckungsbeitragsrechnung (Engpass, absoluter und relativer Deckungsbeitrag); 04-fachregeln.md GC-23',
  teaser: {
    figur: 'leni',
    ausdruck: 'gruebelt',
    text: 'Im Juli wollen alle Sorten gleichzeitig auf die Abfüllanlage. Wer kommt zuerst dran?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: `Im Juli hat die Anlage ${n(GC23.kapazitaet)} Abfüllminuten. Für alles, was wir verkaufen könnten, bräuchten wir ${n(bedarf)}.`,
        },
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: `Einfach: Senne Lemon zuerst, das bringt ${e(B.db!)} je Flasche – mehr als alle anderen!`,
        },
      ],
      frage: 'Ist die Sorte mit dem höchsten Deckungsbeitrag je Stück die beste Wahl?',
    },
    {
      typ: 'dialog',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Ein Imbisswagen auf dem Stadtfest hat nur einen Grill. Wichtig ist nicht, was ein Gericht bringt, sondern was es je Grillminute bringt.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Bei uns ist die Abfüllanlage der Grill. Wir teilen den Deckungsbeitrag je Stück durch die Abfüllzeit je Stück.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Abfüllzeit je Stück: ${A.name} ${n(A.zeit)} min, ${B.name} ${n(B.zeit)} min, ${C.name} ${n(C.zeit)} min. Welche Sorte bringt je Abfüllminute am meisten?`,
      optionen: [
        { text: C.name, richtig: true },
        { text: B.name, erklaerung: `Hoher Stückbeitrag, aber lange Abfüllzeit: nur ${rel(1)}.` },
        { text: A.name, erklaerung: `Gut, aber nicht die beste: ${rel(0)}.` },
      ],
      aufloesung: `${C.name}: ${e(C.db!)} ÷ ${n(C.zeit)} min = ${rel(2)}. ${A.name}: ${rel(0)}. ${B.name}: ${rel(1)}.`,
    },
    {
      typ: 'konzept',
      titel: 'Der relative Deckungsbeitrag',
      text: 'Relativer Deckungsbeitrag = Stückdeckungsbeitrag ÷ Beanspruchung des Engpasses je Stück. Die Sorte mit dem höchsten Wert bekommt die Anlage zuerst, bis ihr Absatz erreicht ist.',
      visual: {
        typ: 'karten',
        karten: S.rang.map((i, k) => ({
          titel: `${k + 1}. ${GC23.produkte[i]!.name}`,
          text: `${e(S.db[i]!)} ÷ ${n(GC23.produkte[i]!.zeit)} min = ${rel(i)}`,
          farbe: ['#8cbf3f', '#e2b13c', '#e8792b'][k]!,
        })),
      },
    },
    {
      typ: 'sortieren',
      titel: 'Was zählt beim Engpass?',
      text: 'Was brauchst du, um die Abfüllanlage richtig zu belegen?',
      kategorien: ['Brauche ich', 'Brauche ich nicht'],
      elemente: [
        {
          text: 'Deckungsbeitrag je Stück',
          kategorie: 'Brauche ich',
          erklaerung: 'Er ist der Zähler des relativen Deckungsbeitrags.',
        },
        {
          text: 'Abfüllzeit je Stück',
          kategorie: 'Brauche ich',
          erklaerung: 'Sie ist der Nenner: wie lange eine Einheit den Engpass belegt.',
        },
        {
          text: 'Maximaler Absatz je Sorte',
          kategorie: 'Brauche ich',
          erklaerung: 'Mehr als absetzbar ist, wird nicht abgefüllt.',
        },
        {
          text: 'Miete der Abfüllhalle',
          kategorie: 'Brauche ich nicht',
          erklaerung: 'Fixkosten fallen ohnehin an und ändern die Rangfolge nicht.',
        },
        {
          text: 'Selbstkosten je Flasche',
          kategorie: 'Brauche ich nicht',
          erklaerung: 'Darin stecken geschlüsselte Fixkosten. Sie verzerren die Rangfolge.',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Die Anlage belegen',
      text: `Kapazität: ${n(GC23.kapazitaet)} Minuten. Rangfolge: C, A, B.`,
      schritte: [
        {
          text: `C: ${C.name}`,
          rechnung: `${n(S.menge[2]!)} Stk. × ${n(C.zeit)} min = ${n(S.beanspruchung[2]!.exact)} min`,
          warum: `Höchster relativer Deckungsbeitrag, voller Absatz von ${n(C.maxAbsatz)} Stück.`,
        },
        {
          text: `A: ${A.name}`,
          rechnung: `${n(S.menge[0]!)} Stk. × ${n(A.zeit)} min = ${n(S.beanspruchung[0]!.exact)} min`,
          warum: `Auch hier der volle Absatz; danach sind noch ${n(S.beanspruchung[1]!.exact)} Minuten frei.`,
        },
        {
          text: `B: ${B.name}`,
          rechnung: `${n(S.beanspruchung[1]!.exact)} min ÷ ${n(B.zeit)} min = ${n(S.menge[1]!)} Stk.`,
          warum: 'Die letzte Sorte bekommt nur die restliche Zeit.',
        },
        {
          text: 'Gesamtdeckungsbeitrag',
          rechnung: `${e(S.dbGesamt[2]!)} + ${e(S.dbGesamt[0]!)} + ${e(S.dbGesamt[1]!)} = ${e(S.summeDb)}`,
          warum: 'Mehr ist mit diesen Minuten nicht zu holen.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Tobias hat geplant',
      text: 'Eine Zeile ist der Grund, warum sein Plan weniger bringt. Tippe sie an.',
      zeilen: [
        'Rangfolge nach Deckungsbeitrag je Stück: B, A, C',
        `B: ${n(F.menge[1]!)} Stk., ${n(F.beanspruchung[1]!.exact)} min, ${e(F.dbGesamt[1]!)}`,
        `A: ${n(F.menge[0]!)} Stk., ${n(F.beanspruchung[0]!.exact)} min, ${e(F.dbGesamt[0]!)}`,
        `Gesamtdeckungsbeitrag: ${e(F.summeDb)}`,
      ],
      fehlerZeile: 0,
      gruende: [
        {
          text: 'Beim Engpass zählt der Deckungsbeitrag je Abfüllminute, nicht je Stück.',
          richtig: true,
        },
        {
          text: 'Senne Lemon hätte gar nicht abgefüllt werden dürfen.',
          erklaerung:
            'Auch B hat einen positiven Deckungsbeitrag. Es kommt nur später an die Reihe.',
        },
        {
          text: 'Die Mengen sind falsch multipliziert.',
          erklaerung: 'Die Rechnung stimmt, nur die Reihenfolge nicht.',
        },
      ],
      aufloesung: `Mit der Rangfolge C, A, B bringt dieselbe Anlage ${e(S.summeDb)} statt ${e(F.summeDb)}: ${e(S.summeDb.minus(F.summeDb))} mehr.`,
    },
    {
      typ: 'verstaendnis',
      frage: 'Im Oktober ist die Anlage nicht ausgelastet. Was gilt dann?',
      optionen: [
        {
          text: 'Jede Sorte mit positivem Deckungsbeitrag wird bis zu ihrem Absatz abgefüllt; eine Rangfolge braucht es nicht.',
          richtig: true,
        },
        {
          text: 'Es wird nur die Sorte mit dem höchsten relativen Deckungsbeitrag abgefüllt.',
          erklaerung:
            'Ohne Engpass gibt es nichts zu verteilen. Jede Sorte mit positivem Beitrag lohnt sich.',
        },
        {
          text: 'Es wird nach den Selbstkosten je Stück entschieden.',
          erklaerung: 'Die Fixkosten fallen ohnehin an. Entscheidend bleibt der Deckungsbeitrag.',
        },
      ],
      figur: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Der relative Deckungsbeitrag ist ein Werkzeug für knappe Kapazität.',
      },
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Eine neue Juli-Planung. Berechne die relativen Deckungsbeiträge der ersten drei Sorten.',
      skillId: 'K6-engpass',
      seed: 2,
      variant: 'db-gegeben',
      partId: 'reldb',
      gefragt: ['rel-0', 'rel-1', 'rel-2'],
    },
    {
      typ: 'merksatz',
      id: 'K6-m1',
      frage: 'Wie bestimmt man das optimale Produktionsprogramm bei einem Engpass?',
      text: 'Relativer Deckungsbeitrag = Stückdeckungsbeitrag ÷ Engpassbeanspruchung je Stück. In dieser Rangfolge den Engpass belegen, jede Sorte bis zum maximalen Absatz, die letzte mit der Restkapazität.',
    },
    {
      typ: 'klausur',
      punkte: 6,
      aufgabe:
        'Ermitteln Sie das optimale Produktionsprogramm für den Engpass Abfüllanlage und den Gesamtdeckungsbeitrag.',
      part: { skillId: 'K6-engpass', seed: 3, variant: 'db-gegeben', partId: 'programm' },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'ueberrascht',
        text: 'Ein Lohnabfüller ruft an: Er würde für uns abfüllen. Sollen wir das abgeben oder selbst machen?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Wie berechnet man den relativen Deckungsbeitrag?',
      optionen: [
        { text: 'Stückdeckungsbeitrag ÷ Engpassbeanspruchung je Stück', richtig: true },
        { text: 'Stückdeckungsbeitrag × Absatzmenge' },
        { text: 'Preis ÷ variable Stückkosten' },
      ],
    },
    {
      frage:
        'Sorte X: Stück-DB 0,60 €, 0,10 min je Stück. Sorte Y: Stück-DB 0,30 €, 0,03 min je Stück. Welche Sorte kommt beim Engpass zuerst?',
      optionen: [
        { text: 'Y (10 € je Minute)', richtig: true },
        { text: 'X (6 € je Minute)' },
        { text: 'X, weil der Stück-DB höher ist' },
      ],
    },
    {
      frage: 'Wann braucht man den relativen Deckungsbeitrag?',
      optionen: [
        { text: 'Wenn eine Kapazität nicht für alle absetzbaren Mengen reicht', richtig: true },
        { text: 'Immer, wenn mehrere Sorten verkauft werden' },
        { text: 'Nur bei negativen Deckungsbeiträgen' },
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
      'Lehrbuch-Übungen Deckungsbeitragsrechnung (Engpassstufe, absoluter und relativer Deckungsbeitrag, optimales Produktionsprogramm) und GC-23 abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
