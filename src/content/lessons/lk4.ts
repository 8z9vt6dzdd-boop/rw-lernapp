// Lektion K4 – Mehrstufige Deckungsbeitragsrechnung (eigene Formulierung; Themen nach den
// Lehrbuch-Übungen zur Teilkostenrechnung: DB I bis III, Betriebsergebnis, Sortimentsbereinigung).
// Zahlen aus GC-25 (04-fachregeln.md), alle Beträge werden von der Engine berechnet.
import {
  dbMehrstufig,
  solveDbMehrstufig,
  type DbMehrstufigParams,
} from '../../engine/generators/k1/db-mehrstufig';
import { formatEuro } from '../../engine/money';
import type { TaskPart } from '../../engine/task';
import type { Lektion } from './types';

const eur = formatEuro;

// GC-25
const GC25: DbMehrstufigParams = {
  variante: 'gesamt',
  gruppen: [
    { name: 'Softdrinks', fix: '90000' },
    { name: 'Bier', fix: '20000' },
  ],
  erzeugnisse: [
    {
      name: 'Paderquell Energy',
      gruppe: 0,
      umsatz: '600000',
      kvGesamt: '360000',
      erzeugnisfix: '80000',
    },
    { name: 'Senne Lemon', gruppe: 0, umsatz: '300000', kvGesamt: '180000', erzeugnisfix: '40000' },
    {
      name: 'Almeblick Tequila-Bier',
      gruppe: 1,
      umsatz: '200000',
      kvGesamt: '150000',
      erzeugnisfix: '60000',
    },
  ],
  unternehmensfix: '70000',
  reihenfolge: [0, 1, 2],
};
const S = solveDbMehrstufig(GC25);
const [ENERGY, LEMON, BIER] = GC25.erzeugnisse as [
  (typeof GC25.erzeugnisse)[number],
  (typeof GC25.erzeugnisse)[number],
  (typeof GC25.erzeugnisse)[number],
];
const [SOFT, GBIER] = GC25.gruppen as [
  (typeof GC25.gruppen)[number],
  (typeof GC25.gruppen)[number],
];
// typischer Fehler: gruppenfixe Kosten der Softdrinks bei Senne Lemon abgezogen
const FALSCH = solveDbMehrstufig(GC25, { gruppenfixEinzeln: true });
const BE_OHNE = S.be.plus(S.verbesserung);

// Klausurbrücke (eigene Zahlen)
const K: DbMehrstufigParams = {
  variante: 'gesamt',
  gruppen: [
    { name: 'Softdrinks', fix: '80000' },
    { name: 'Bier', fix: '10000' },
  ],
  erzeugnisse: [
    {
      name: 'Paderquell Energy 0,33 l',
      gruppe: 0,
      umsatz: '500000',
      kvGesamt: '300000',
      erzeugnisfix: '70000',
    },
    {
      name: 'Senne Lemon 0,33 l',
      gruppe: 0,
      umsatz: '250000',
      kvGesamt: '150000',
      erzeugnisfix: '30000',
    },
    {
      name: 'Almeblick Tequila-Bier 0,33 l',
      gruppe: 1,
      umsatz: '180000',
      kvGesamt: '120000',
      erzeugnisfix: '40000',
    },
    {
      name: 'Almeblick Tequila-Bier 5-l-Fass',
      gruppe: 1,
      umsatz: '120000',
      kvGesamt: '90000',
      erzeugnisfix: '50000',
    },
  ],
  unternehmensfix: '60000',
  reihenfolge: [0, 1, 2],
};
const K_TEIL = dbMehrstufig
  .parts(K, solveDbMehrstufig(K))
  .find((p) => p.id === 'erzeugnisse') as TaskPart;

export const lektionK4: Lektion = {
  id: 'K4',
  skillId: 'K4-db-mehrstufig',
  abschnitt: 'K',
  titel: 'Mehrstufige Deckungsbeitragsrechnung: Trägt sich das Tequila-Bier?',
  kernAha:
    'Fixkosten werden stufenweise dort abgezogen, wo sie entstehen: erzeugnisfix (DB II), gruppenfix (DB III), unternehmensfix (Betriebsergebnis). Ein positiver DB I reicht nicht – ist der DB II negativ und sind die Fixkosten abbaubar, verbessert die Einstellung das Ergebnis.',
  dauerMin: 8,
  figuren: ['frank', 'sabine', 'leni', 'jana'],
  ort: 'gesellschafter',
  quelle:
    'Lehrbuch-Übungen Teilkostenrechnung (Deckungsbeiträge I bis III, Betriebsergebnis, Verbesserungsvorschläge); GC-25 aus 04-fachregeln.md',
  teaser: {
    figur: 'frank',
    ausdruck: 'gruebelt',
    text: 'Das Tequila-Bier bringt Deckungsbeitrag. Warum schaut Leni dann so kritisch?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'freut',
          text: `Das Tequila-Bier bringt ${eur(S.db1[2]!)} Deckungsbeitrag. Also bleibt es im Sortiment, oder?`,
        },
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: 'Für das Bier bezahlen wir aber eigene Werbung und einen gemieteten Gärtank.',
        },
      ],
      frage: 'Reicht ein positiver Deckungsbeitrag, um eine Sorte zu behalten?',
    },
    {
      typ: 'dialog',
      ort: 'gesellschafter',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Im Sportverein bezahlt jede Abteilung ihren Trainer selbst. Die Halle teilen sich Handball und Volleyball, das Vereinsheim gehört allen.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Genauso stufen wir die Fixkosten: je Erzeugnis, je Erzeugnisgruppe und für das ganze Unternehmen.',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Wem gehören diese Fixkosten?',
      text: 'Welches Bezugsobjekt verursacht die Kosten?',
      kategorien: ['erzeugnisfix', 'erzeugnisgruppenfix', 'unternehmensfix'],
      elemente: [
        {
          text: 'Werbekampagne nur für Paderquell Energy',
          kategorie: 'erzeugnisfix',
          erklaerung: 'Sie fällt nur wegen dieses einen Erzeugnisses an.',
        },
        {
          text: 'Miete für den Gärtank des Tequila-Biers',
          kategorie: 'erzeugnisfix',
          erklaerung: 'Der Tank dient nur dem Tequila-Bier.',
        },
        {
          text: 'Abschreibung der Sirupanlage für alle Softdrinks',
          kategorie: 'erzeugnisgruppenfix',
          erklaerung: 'Energy und Lemon nutzen die Anlage gemeinsam.',
        },
        {
          text: 'Gehalt des Braumeisters für die Gruppe Bier',
          kategorie: 'erzeugnisgruppenfix',
          erklaerung: 'Er arbeitet für alle Biere, aber nicht für die Softdrinks.',
        },
        {
          text: 'Gehalt der Geschäftsführung',
          kategorie: 'unternehmensfix',
          erklaerung: 'Es lässt sich keinem Erzeugnis und keiner Gruppe zurechnen.',
        },
        {
          text: 'Jahresabschluss durch die Buchhaltung',
          kategorie: 'unternehmensfix',
          erklaerung: 'Er betrifft das ganze Unternehmen.',
        },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Fixkosten Stufe für Stufe',
      text: 'Umsatz minus variable Kosten ergibt den DB I. Minus erzeugnisfixe Kosten: DB II. Summe der Gruppe minus gruppenfixe Kosten: DB III. Minus unternehmensfixe Kosten: Betriebsergebnis.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'DB I',
            text: `${BIER.name}: ${eur(BIER.umsatz!)} − ${eur(BIER.kvGesamt!)} = ${eur(S.db1[2]!)}`,
            farbe: '#8cbf3f',
          },
          {
            titel: 'DB II',
            text: `− erzeugnisfixe Kosten ${eur(BIER.erzeugnisfix)}`,
            farbe: '#e2b13c',
          },
          {
            titel: 'DB III',
            text: `Gruppe ${GBIER.name}: − gruppenfixe Kosten ${eur(GBIER.fix)}`,
            farbe: '#e8792b',
          },
          {
            titel: 'Betriebsergebnis',
            text: `Summe DB III − unternehmensfixe Kosten ${eur(GC25.unternehmensfix)}`,
            farbe: '#1c6670',
          },
        ],
      },
    },
    {
      typ: 'vorhersage',
      frage: `Tequila-Bier: DB I ${eur(S.db1[2]!)}, erzeugnisfixe Kosten ${eur(BIER.erzeugnisfix)}. Wie hoch ist der DB II?`,
      optionen: [
        { text: eur(S.db2[2]!), richtig: true },
        { text: eur(S.db1[2]!) },
        { text: eur(S.db3[1]!) },
      ],
      aufloesung: `DB II = ${eur(S.db1[2]!)} − ${eur(BIER.erzeugnisfix)} = ${eur(S.db2[2]!)}. Das Bier deckt nicht einmal die Fixkosten, die es selbst verursacht.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Die ganze Rechnung',
      text: `Unternehmensfixe Kosten: ${eur(GC25.unternehmensfix)}.`,
      schritte: [
        {
          text: 'DB I je Erzeugnis',
          rechnung: GC25.erzeugnisse.map((e, i) => `${e.name} ${eur(S.db1[i]!)}`).join('; '),
          warum:
            'Umsatzerlöse minus variable Kosten: Was jedes Erzeugnis an Fixkosten tragen kann.',
        },
        {
          text: 'DB II je Erzeugnis',
          rechnung: GC25.erzeugnisse.map((e, i) => `${e.name} ${eur(S.db2[i]!)}`).join('; '),
          warum: 'Die eigenen Fixkosten (Werbung, Spezialtank) jedes Erzeugnisses sind abgezogen.',
        },
        {
          text: 'DB III je Gruppe',
          rechnung: `${SOFT.name}: ${eur(S.gruppeDb2[0]!)} − ${eur(SOFT.fix)} = ${eur(S.db3[0]!)}; ${GBIER.name}: ${eur(S.gruppeDb2[1]!)} − ${eur(GBIER.fix)} = ${eur(S.db3[1]!)}`,
          warum: 'Gruppenfixe Kosten werden erst von der Summe der DB II einer Gruppe abgezogen.',
        },
        {
          text: 'Betriebsergebnis',
          rechnung: `${eur(S.summeDb3)} − ${eur(GC25.unternehmensfix)} = ${eur(S.be)}`,
          warum: 'Unternehmensfixe Kosten trägt das ganze Sortiment gemeinsam.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage:
        'Soll das Tequila-Bier bleiben? Werbung, Gärtank und Braumeister lassen sich kündigen.',
      a: {
        figur: 'frank',
        ausdruck: 'freut',
        text: 'Der DB I ist positiv, also trägt das Bier zur Deckung bei.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Entscheidend ist hier der DB II, und der ist negativ.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Fallen die zurechenbaren Fixkosten mit dem Bier weg, spart die MBG mehr, als sie an DB I verliert.',
          richtig: true,
        },
        { text: 'Der DB I ist immer der richtige Maßstab.' },
        { text: 'Hohe Umsätze sind wichtiger als Deckungsbeiträge.' },
      ],
      aufloesung: `Ohne das Bier fehlen ${eur(S.db1[2]!)} DB I, dafür entfallen ${eur(BIER.erzeugnisfix)} erzeugnisfixe und – weil es das einzige Bier ist – ${eur(GBIER.fix)} gruppenfixe Kosten. Unterm Strich: ${eur(S.verbesserung)} mehr Ergebnis.`,
    },
    {
      typ: 'entscheidung',
      frage: 'Was empfiehlst du Frank und Sabine?',
      figur: {
        figur: 'sabine',
        ausdruck: 'gruebelt',
        text: 'Wir wollen das Ergebnis verbessern. Aber was ist, wenn der Gärtank noch zwei Jahre gemietet ist?',
      },
      optionen: [
        {
          text: 'Tequila-Bier einstellen, Werbung, Gärtank und Braumeister fallen weg',
          folge: `Das Betriebsergebnis steigt von ${eur(S.be)} auf ${eur(BE_OHNE)}.`,
          ausdruck: 'feiert',
          empfohlen: true,
        },
        {
          text: 'Tequila-Bier behalten, obwohl alle Fixkosten abbaubar wären',
          folge: `Das Bier kostet die MBG weiterhin ${eur(S.verbesserung)} Ergebnis.`,
          ausdruck: 'gruebelt',
        },
        {
          text: 'Erst einstellen, wenn der Mietvertrag ausläuft',
          folge: `Solange die Fixkosten ohnehin anfallen, ist der positive DB I von ${eur(S.db1[2]!)} besser als nichts. Danach entscheidet der DB III der Gruppe.`,
          ausdruck: 'freut',
        },
      ],
      fazit:
        'Sind die zurechenbaren Fixkosten abbaubar, entscheidet der DB II (fällt die ganze Gruppe weg, der DB III). Bleiben die Fixkosten kurzfristig bestehen, zählt nur ein positiver DB I.',
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege rechnet die Softdrinks',
      text: 'Eine Zeile ist falsch. Tippe sie an.',
      zeilen: [
        `DB I ${LEMON.name}: ${eur(LEMON.umsatz!)} − ${eur(LEMON.kvGesamt!)} = ${eur(S.db1[1]!)}`,
        `DB II ${LEMON.name}: ${eur(S.db1[1]!)} − ${eur(LEMON.erzeugnisfix)} − ${eur(SOFT.fix)} = ${eur(FALSCH.db2[1]!)}`,
        `Folgerung: ${LEMON.name} einstellen`,
      ],
      fehlerZeile: 1,
      gruende: [
        {
          text: `Die gruppenfixen ${eur(SOFT.fix)} gehören erst in den DB III der Gruppe ${SOFT.name}.`,
          richtig: true,
        },
        { text: 'Die erzeugnisfixen Kosten dürfen nicht abgezogen werden.' },
        { text: 'Der DB I ist falsch berechnet.' },
      ],
      aufloesung: `DB II ${LEMON.name} = ${eur(S.db1[1]!)} − ${eur(LEMON.erzeugnisfix)} = ${eur(S.db2[1]!)}. Die Sirupanlage bleibt, solange ${ENERGY.name} abgefüllt wird – sie wird von der Summe der Gruppe abgezogen.`,
    },
    {
      typ: 'verstaendnis',
      frage: 'Welche Größe zeigt, ob eine ganze Erzeugnisgruppe ihre eigenen Fixkosten trägt?',
      optionen: [
        { text: 'Der DB III', richtig: true },
        { text: 'Der DB I', erklaerung: 'Der DB I enthält noch gar keine Fixkosten.' },
        {
          text: 'Der DB II',
          erklaerung: 'Der DB II zeigt nur, ob ein Erzeugnis seine eigenen Fixkosten deckt.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'K4-m1',
      frage:
        'Wie ist die mehrstufige Deckungsbeitragsrechnung aufgebaut, und welcher Deckungsbeitrag entscheidet über die Einstellung eines Erzeugnisses?',
      text: 'Umsatzerlöse − variable Kosten = DB I; − erzeugnisfixe Kosten = DB II; Summe der Gruppe − erzeugnisgruppenfixe Kosten = DB III; Summe − unternehmensfixe Kosten = Betriebsergebnis. Ist der DB II negativ und sind die erzeugnisfixen Kosten abbaubar, verbessert die Einstellung das Ergebnis.',
    },
    {
      typ: 'klausur',
      punkte: 5,
      aufgabe:
        'Die MBG führt die Erzeugnisgruppen Softdrinks und Bier. Ermitteln Sie aus den angegebenen Umsatzerlösen, variablen Kosten und erzeugnisfixen Kosten die Deckungsbeiträge I und II je Erzeugnis.',
      part: K_TEIL,
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Ein Discounter will 200.000 Dosen Paderquell Energy als Eigenmarke, für 0,55 € je Dose. Das liegt unter unseren Selbstkosten – lohnt sich das trotzdem?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'DB I 80.000 €, erzeugnisfixe Kosten 95.000 €. Wie hoch ist der DB II?',
      optionen: [{ text: '−15.000 €', richtig: true }, { text: '15.000 €' }, { text: '175.000 €' }],
    },
    {
      frage: 'Wovon werden erzeugnisgruppenfixe Kosten abgezogen?',
      optionen: [
        { text: 'Von der Summe der DB II aller Erzeugnisse der Gruppe', richtig: true },
        { text: 'Vom DB I jedes einzelnen Erzeugnisses' },
        { text: 'Vom Betriebsergebnis' },
      ],
    },
    {
      frage:
        'Ein Erzeugnis hat einen negativen DB II, seine erzeugnisfixen Kosten sind abbaubar. Was verbessert das Ergebnis?',
      optionen: [
        { text: 'Das Erzeugnis einstellen', richtig: true },
        { text: 'Das Erzeugnis behalten, weil der DB I positiv ist' },
        { text: 'Die unternehmensfixen Kosten auf die Erzeugnisse verteilen' },
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
      'GC-25 (04-fachregeln.md) und Lehrbuch-Übungen Teilkostenrechnung (Deckungsbeiträge I bis III, erzeugnis-, erzeugnisgruppen- und unternehmensfixe Kosten, Verbesserungsvorschläge) inhaltlich abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
