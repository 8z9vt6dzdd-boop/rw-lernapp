// C6 – Leihverpackung im Einkauf (04-fachregeln.md, Abschnitt 2 Nr. 6; Spezifikation docs/m7/c2.md).
// Berechnete Leihverpackung = Bezugskosten des Stoffes; eine Gutschrift bei Rückgabe mindert die
// Bezugskosten und anteilig die Vorsteuer. Der nicht gutgeschriebene Rest erhöht die Anschaffungskosten.
import { FIRMA } from '../../../config';
import { bezugskostenKonto, nachlassKonto, type Stoff } from '../../accounts';
import { loesung, satz, zeile, type BuchungsLoesung } from '../../booking';
import type { FirmaConfig } from '../../firma';
import { Val, dec } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, GenOptions, SolutionStep, TaskPart, TaskText } from '../../task';
import { defineGenerator, eur, feld, isExact, isKrumm, pct, retry } from '../base';

export type LeihVariante = 'berechnung' | 'rueckgabe' | 'gesamt';

export interface LeihParams {
  variante: LeihVariante;
  stoff: Stoff;
  /** z. B. „Getränkedosen“ */
  gegenstand: string;
  /** Plural, z. B. „Mehrweg-Leihpaletten“ */
  verpackung: string;
  partner: string;
  /** Warenwert netto in € */
  warenwert: string;
  /** Anzahl berechneter Leihverpackungen */
  anzahl: number;
  /** berechneter Preis je Leihverpackung, netto */
  preis: string;
  /** Anzahl zurückgegebener Leihverpackungen */
  zurueck: number;
  /** Anteil des berechneten Werts, der gutgeschrieben wird (z. B. „0.75“) */
  gutschriftSatz: string;
  ustSatz: string;
  vorlage: number;
}

export interface LeihSolution {
  leih: Val;
  vorsteuer: Val;
  rechnungBrutto: Val;
  gutschriftNetto: Val;
  vstKorrektur: Val;
  gutschriftBrutto: Val;
  restBezugskosten: Val;
  rechnung: BuchungsLoesung;
  gutschrift: BuchungsLoesung;
  umbuchung: BuchungsLoesung;
}

/** Denkfehler, aus denen sich fehlerhafte Lösungswege ergeben. */
interface Weg {
  leihKonto?: 'forderung' | 'stoff';
  vstOhneLeih?: boolean;
  gutschriftKonto?: 'stoff' | 'nachlass';
  gutschriftOhneVst?: boolean;
  gutschriftAlle?: boolean;
  gutschriftVoll?: boolean;
  steuerKonto?: 'Umsatzsteuer';
  umbuchungVertauscht?: boolean;
}

export function solveLeih(p: LeihParams, w: Weg = {}): LeihSolution {
  const u = dec(p.ustSatz);
  const stoffKonto = p.stoff;
  const bzk = bezugskostenKonto(p.stoff);
  const leih = new Val(p.preis).times(p.anzahl).fix();
  const vstBasis = w.vstOhneLeih ? new Val(p.warenwert) : leih.plus(p.warenwert);
  const vorsteuer = vstBasis.times(u).fix();
  const rechnungBrutto = leih.plus(p.warenwert).plus(vorsteuer);
  const steuer = w.steuerKonto ?? 'Vorsteuer';

  const soll =
    w.leihKonto === 'stoff'
      ? [zeile(stoffKonto, leih.plus(p.warenwert))]
      : [
          zeile(stoffKonto, p.warenwert),
          zeile(w.leihKonto === 'forderung' ? 'Sonstige Forderungen' : bzk, leih),
        ];
  const rechnung = loesung([
    satz(
      [...soll, zeile(steuer, vorsteuer)],
      [zeile('Verbindlichkeiten aus Lieferungen und Leistungen', rechnungBrutto)],
      'Eingangsrechnung',
    ),
  ]);

  const stueck = w.gutschriftAlle ? p.anzahl : p.zurueck;
  const gSatz = w.gutschriftVoll ? dec(1) : dec(p.gutschriftSatz);
  const gutschriftNetto = new Val(p.preis).times(stueck).times(gSatz).fix();
  const vstKorrektur = w.gutschriftOhneVst ? new Val(0) : gutschriftNetto.times(u).fix();
  const gutschriftBrutto = gutschriftNetto.plus(vstKorrektur);
  const gKonto =
    w.gutschriftKonto === 'stoff'
      ? stoffKonto
      : w.gutschriftKonto === 'nachlass'
        ? nachlassKonto(p.stoff)
        : bzk;
  const gutschrift = loesung([
    satz(
      [zeile('Verbindlichkeiten aus Lieferungen und Leistungen', gutschriftBrutto)],
      [
        zeile(gKonto, gutschriftNetto),
        ...(w.gutschriftOhneVst ? [] : [zeile(steuer, vstKorrektur)]),
      ],
      'Gutschrift für die Rückgabe',
    ),
  ]);

  // Was auf dem Bezugskostenkonto bleibt, wird auf das Stoffkonto umgebucht.
  const aufBzk = w.leihKonto ? new Val(0) : leih;
  const gutschriftAufBzk = w.gutschriftKonto ? new Val(0) : gutschriftNetto;
  const restBezugskosten = aufBzk.minus(gutschriftAufBzk);
  const umbuchung = loesung([
    w.umbuchungVertauscht
      ? satz([zeile(bzk, restBezugskosten)], [zeile(stoffKonto, restBezugskosten)], 'Umbuchung')
      : satz([zeile(stoffKonto, restBezugskosten)], [zeile(bzk, restBezugskosten)], 'Umbuchung'),
  ]);
  return {
    leih,
    vorsteuer,
    rechnungBrutto,
    gutschriftNetto,
    vstKorrektur,
    gutschriftBrutto,
    restBezugskosten,
    rechnung,
    gutschrift,
    umbuchung,
  };
}

export function leihParts(p: LeihParams, s: LeihSolution): TaskPart[] {
  if (p.variante === 'berechnung') {
    return [
      {
        typ: 'rechenkette',
        id: 'rechnung',
        titel: 'Eingangsrechnung prüfen',
        felder: [
          feld('leih', 'Berechnete Leihverpackung (netto)', s.leih),
          feld('vorsteuer', 'Vorsteuer', s.vorsteuer),
          feld('brutto', 'Rechnungsbetrag (brutto)', s.rechnungBrutto),
        ],
      },
      {
        typ: 'buchungssatz',
        id: 'buchung',
        titel: 'Buchungssatz für die Eingangsrechnung',
        loesung: s.rechnung,
      },
    ];
  }
  if (p.variante === 'rueckgabe') {
    return [
      {
        typ: 'rechenkette',
        id: 'rechnung',
        titel: 'Gutschrift zerlegen',
        felder: [
          feld('gutschrift-netto', 'Gutschrift netto', s.gutschriftNetto),
          feld('vst-korrektur', 'Vorsteuerkorrektur', s.vstKorrektur),
          feld('gutschrift-brutto', 'Gutschrift brutto', s.gutschriftBrutto),
        ],
      },
      {
        typ: 'buchungssatz',
        id: 'buchung',
        titel: 'Buchungssatz für die Gutschrift',
        loesung: s.gutschrift,
      },
    ];
  }
  return [
    {
      typ: 'rechenkette',
      id: 'rechnung',
      titel: 'Leihverpackung von der Rechnung bis zur Rückgabe',
      felder: [
        feld('leih', 'Berechnete Leihverpackung (netto)', s.leih),
        feld('gutschrift-netto', 'Gutschrift netto', s.gutschriftNetto),
        feld('vst-korrektur', 'Vorsteuerkorrektur', s.vstKorrektur),
        feld('rest', 'Verbleibende Bezugskosten', s.restBezugskosten),
      ],
    },
    {
      typ: 'buchungssatz',
      id: 'buchung',
      titel: 'Buchungssätze (Eingangsrechnung und Gutschrift)',
      loesung: loesung([...s.rechnung.saetze, ...s.gutschrift.saetze]),
    },
    {
      typ: 'buchungssatz',
      id: 'umbuchung',
      titel: `Umbuchung des Kontos ${bezugskostenKonto(p.stoff)} am Jahresende`,
      loesung: s.umbuchung,
    },
  ];
}

interface Vorlage {
  stoff: Stoff;
  gegenstand: string;
  verpackung: string;
  /** Singular für Texte wie „je Leihpalette“ */
  einzeln: string;
  preis: [number, number];
  anzahl: [number, number];
  partner: (f: FirmaConfig) => string;
}

const VORLAGEN: Vorlage[] = [
  {
    stoff: 'Hilfsstoffe',
    gegenstand: 'Getränkedosen',
    verpackung: 'Mehrweg-Leihpaletten',
    einzeln: 'Leihpalette',
    preis: [10, 25],
    anzahl: [20, 80],
    partner: (f) => f.lieferanten.hilfsstoffe[0]!,
  },
  {
    stoff: 'Rohstoffe',
    gegenstand: 'Aromakonzentrat',
    verpackung: 'Leihcontainer',
    einzeln: 'Leihcontainer',
    preis: [60, 150],
    anzahl: [4, 20],
    partner: (f) => f.lieferanten.rohstoffe[2]!,
  },
  {
    stoff: 'Rohstoffe',
    gegenstand: 'Aromen',
    verpackung: 'Leihkanister',
    einzeln: 'Leihkanister',
    preis: [8, 25],
    anzahl: [10, 60],
    partner: (f) => f.lieferanten.rohstoffe[0]!,
  },
  {
    stoff: 'Betriebsstoffe',
    gegenstand: 'Kohlensäure (CO₂)',
    verpackung: 'Leih-Gasflaschen',
    einzeln: 'Leih-Gasflasche',
    preis: [40, 120],
    anzahl: [4, 24],
    partner: (f) => f.lieferanten.betriebsstoffe[0]!,
  },
  {
    stoff: 'Handelswaren',
    gegenstand: 'Weißwein „Liboriwein“',
    verpackung: 'Leih-Gitterboxen',
    einzeln: 'Leih-Gitterbox',
    preis: [30, 90],
    anzahl: [4, 20],
    partner: (f) => f.lieferanten.handelswaren[0]!,
  },
];

function vorlageFuer(p: LeihParams): Vorlage {
  return VORLAGEN.find((v) => v.verpackung === p.verpackung) ?? VORLAGEN[0]!;
}

function generate(rng: Rng, opts: GenOptions = {}): LeihParams {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const variante =
    (opts.variant as LeihVariante | undefined) ??
    rng.pick<LeihVariante>(['berechnung', 'rueckgabe', 'gesamt']);
  const v = rng.pick(VORLAGEN);
  const make = (r: Rng): LeihParams => {
    const anzahl = r.int(v.anzahl[0], v.anzahl[1]);
    const preis = krumm
      ? (r.int(v.preis[0] * 100, v.preis[1] * 100) / 100).toFixed(2)
      : String(r.step(v.preis[0], v.preis[1], v.preis[1] >= 60 ? 5 : 0.5));
    const warenwert = krumm
      ? (r.int(200_000, 4_000_000) / 100).toFixed(2)
      : String(r.step(2_000, 40_000, 100));
    return {
      variante,
      stoff: v.stoff,
      gegenstand: v.gegenstand,
      verpackung: v.verpackung,
      partner: v.partner(FIRMA),
      warenwert,
      anzahl,
      preis,
      zurueck: r.int(Math.ceil(anzahl / 2), anzahl),
      gutschriftSatz: r.pick(['1', '1', '0.9', '0.8', '0.75', '0.5']),
      ustSatz: '0.19',
      vorlage: r.int(0, 1),
    };
  };
  return retry(rng, make, (p) => {
    if (krumm) return true;
    const u = dec(p.ustSatz);
    const leih = dec(p.preis).times(p.anzahl);
    const g = dec(p.preis).times(p.zurueck).times(p.gutschriftSatz);
    return isExact(leih.plus(p.warenwert).times(u)) && isExact(g) && isExact(g.times(u));
  });
}

function render(p: LeihParams): TaskText {
  const u = pct(p.ustSatz);
  const anteil = dec(p.gutschriftSatz).equals(1)
    ? 'zum vollen berechneten Wert'
    : `mit ${pct(p.gutschriftSatz)} des berechneten Werts`;
  const rechnungText =
    p.vorlage === 0
      ? `Die MBG erhält von ${p.partner} eine Lieferung ${p.gegenstand} auf Ziel. Die Eingangsrechnung weist einen Warenwert von ${eur(p.warenwert)} netto aus; zusätzlich berechnet der Lieferant ${p.anzahl} ${p.verpackung} zu je ${eur(p.preis)} netto. Auf alles kommen ${u} Umsatzsteuer.`
      : `Eingangsrechnung von ${p.partner}: ${p.gegenstand} für ${eur(p.warenwert)} netto, dazu ${p.anzahl} ${p.verpackung} à ${eur(p.preis)} netto, jeweils zuzüglich ${u} USt. Die MBG kauft auf Ziel.`;
  const rueckgabeText = `Die MBG schickt ${p.zurueck} der ${p.anzahl} ${p.verpackung} zurück. ${p.partner} schreibt die zurückgegebenen ${p.verpackung} ${anteil} gut (zuzüglich ${u} USt).`;
  const sachverhalt: string[] = [];
  let aufgabe: string;
  if (p.variante === 'berechnung') {
    sachverhalt.push(
      rechnungText,
      `Die ${p.verpackung} sind Leihverpackung: Der Lieferant nimmt sie später gegen Gutschrift zurück.`,
    );
    aufgabe =
      'Ermittle Vorsteuer und Rechnungsbetrag und bilde den Buchungssatz für die Eingangsrechnung.';
  } else if (p.variante === 'rueckgabe') {
    sachverhalt.push(
      `Mit einer früheren Lieferung ${p.gegenstand} hatte ${p.partner} der MBG ${p.anzahl} ${p.verpackung} zu je ${eur(p.preis)} netto als Leihverpackung berechnet. Die Rechnung ist noch nicht bezahlt.`,
      rueckgabeText,
    );
    aufgabe = 'Zerlege die Gutschrift und bilde den Buchungssatz.';
  } else {
    sachverhalt.push(
      rechnungText,
      `Einige Wochen später: ${rueckgabeText} Die übrigen ${p.verpackung} behält die MBG.`,
    );
    aufgabe = `Bilde die Buchungssätze für Eingangsrechnung und Gutschrift. Ermittle, was auf dem Konto ${bezugskostenKonto(p.stoff)} verbleibt, und buche es am Jahresende um. (Weitere Bezugskosten sind nicht angefallen.)`;
  }
  return {
    titel: 'Leihverpackung im Einkauf',
    kontext: 'März: Leihpaletten und Leihfässer der Lieferanten',
    sachverhalt,
    aufgabe,
  };
}

function steps(p: LeihParams, s: LeihSolution): SolutionStep[] {
  const v = vorlageFuer(p);
  const u = pct(p.ustSatz);
  const bzk = bezugskostenKonto(p.stoff);
  const out: SolutionStep[] = [];
  if (p.variante !== 'rueckgabe') {
    out.push(
      {
        titel: 'Berechnete Leihverpackung',
        rechnung: `${p.anzahl} × ${eur(p.preis)} = ${eur(s.leih)}`,
        erlaeuterung: `Die ${p.verpackung} gehören zu den Anschaffungsnebenkosten: Unterkonto ${bzk}.`,
      },
      {
        titel: 'Vorsteuer',
        rechnung: `(${eur(p.warenwert)} + ${eur(s.leih)}) × ${u} = ${eur(s.vorsteuer)}`,
        erlaeuterung: 'Auch die berechnete Verpackung ist umsatzsteuerpflichtig.',
      },
      {
        titel: 'Rechnungsbetrag',
        rechnung: `${eur(p.warenwert)} + ${eur(s.leih)} + ${eur(s.vorsteuer)} = ${eur(s.rechnungBrutto)}`,
      },
    );
  }
  if (p.variante !== 'berechnung') {
    out.push(
      {
        titel: 'Gutschrift netto',
        rechnung: `${p.zurueck} × ${eur(p.preis)}${dec(p.gutschriftSatz).equals(1) ? '' : ` × ${pct(p.gutschriftSatz)}`} = ${eur(s.gutschriftNetto)}`,
        erlaeuterung: `Gutgeschrieben werden nur die zurückgegebenen ${p.verpackung} je ${v.einzeln}.`,
      },
      {
        titel: 'Vorsteuerkorrektur',
        rechnung: `${eur(s.gutschriftNetto)} × ${u} = ${eur(s.vstKorrektur)}`,
        erlaeuterung: 'Die Gutschrift mindert das Entgelt, deshalb sinkt auch die Vorsteuer.',
      },
      {
        titel: 'Gutschrift brutto',
        rechnung: `${eur(s.gutschriftNetto)} + ${eur(s.vstKorrektur)} = ${eur(s.gutschriftBrutto)}`,
        erlaeuterung: `Um diesen Betrag sinkt die Verbindlichkeit; die Bezugskosten werden im Haben gemindert.`,
      },
    );
  }
  if (p.variante === 'gesamt') {
    out.push({
      titel: 'Verbleibende Bezugskosten',
      rechnung: `${eur(s.leih)} − ${eur(s.gutschriftNetto)} = ${eur(s.restBezugskosten)}`,
      erlaeuterung: `Dieser Rest erhöht die Anschaffungskosten: ${p.stoff} an ${bzk}.`,
    });
  }
  return out;
}

function hints(p: LeihParams): [string, string, string] {
  const bzk = bezugskostenKonto(p.stoff);
  if (p.variante === 'rueckgabe') {
    return [
      'Die Gutschrift macht einen Teil der berechneten Leihverpackung rückgängig.',
      `Gutschrift netto = zurückgegebene Stück × Preis${dec(p.gutschriftSatz).equals(1) ? '' : ' × Gutschriftsatz'}; darauf ${pct(p.ustSatz)} Vorsteuerkorrektur.`,
      `Verbindlichkeiten a. LL (brutto) an ${bzk} (netto), an Vorsteuer.`,
    ];
  }
  const basis: [string, string, string] = [
    `Leihverpackung ist ein Teil der Anschaffungsnebenkosten und wird auf ${bzk} gebucht – nicht als Forderung.`,
    'Die Vorsteuer wird vom Warenwert und von der berechneten Verpackung gerechnet.',
    `Soll: ${p.stoff}, ${bzk}, Vorsteuer. Haben: Verbindlichkeiten a. LL.`,
  ];
  if (p.variante === 'gesamt') {
    basis[2] = `Rechnung: ${p.stoff}, ${bzk}, Vorsteuer an Verbindlichkeiten a. LL. Gutschrift: Verbindlichkeiten a. LL an ${bzk}, an Vorsteuer. Der Rest auf ${bzk} geht ins Konto ${p.stoff}.`;
  }
  return basis;
}

function errorVariants(p: LeihParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Weg) =>
    out.push({ fehlertyp, parts: leihParts(p, solveLeih(p, w)) });
  if (p.variante !== 'rueckgabe') {
    add('leihverpackung-als-forderung', { leihKonto: 'forderung' });
    add('leihverpackung-im-stoffkonto', { leihKonto: 'stoff' });
    add('leihverpackung-ohne-vorsteuer', { vstOhneLeih: true });
  }
  if (p.variante !== 'berechnung') {
    add('leihverpackung-gutschrift-stoffkonto', { gutschriftKonto: 'stoff' });
    add('leihverpackung-gutschrift-nachlass', { gutschriftKonto: 'nachlass' });
    add('leihverpackung-gutschrift-ohne-vorsteuer', { gutschriftOhneVst: true });
    if (p.zurueck < p.anzahl) add('leihverpackung-gutschrift-alle', { gutschriftAlle: true });
    if (!dec(p.gutschriftSatz).equals(1))
      add('leihverpackung-gutschrift-voll', { gutschriftVoll: true });
  }
  add('steuer-falsches-konto', { steuerKonto: 'Umsatzsteuer' });
  if (p.variante === 'gesamt') add('soll-haben-vertauscht', { umbuchungVertauscht: true });
  return out;
}

export const leihverpackung = defineGenerator<LeihParams, LeihSolution>({
  skillId: 'C6-leihverpackung',
  titel: 'Leihverpackung',
  variants: ['berechnung', 'rueckgabe', 'gesamt'],
  points: 4,
  generate,
  render: (p) => render(p),
  solve: (p) => solveLeih(p),
  parts: leihParts,
  steps,
  hints: (p) => hints(p),
  errorVariants,
  verfahren: (p) =>
    p.variante === 'rueckgabe'
      ? 'Leihverpackung zurückgegeben: Gutschrift mindert Bezugskosten und Vorsteuer'
      : 'Leihverpackung berechnet: als Bezugskosten des Stoffes erfassen',
});
