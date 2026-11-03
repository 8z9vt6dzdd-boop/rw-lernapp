// K4 – Mehrstufige Deckungsbeitragsrechnung (Fixkostendeckungsrechnung): erzeugnisfixe,
// erzeugnisgruppenfixe und unternehmensfixe Kosten; Sortimentsbereinigung.
import { Val, dec, sum } from '../../money';
import type { Rng } from '../../rng';
import type { TabellenZeile, TaskPart, WahlOption, Zelle } from '../../task';
import { defineGenerator, eur, feld, isKrumm, plain, retry } from '../base';

export type DbMehrstufigVariante = 'gesamt' | 'stueck';

export interface Erzeugnis {
  name: string;
  /** Index der Erzeugnisgruppe */
  gruppe: number;
  /** Variante „stueck“: Preis und variable Kosten je Einheit, Absatzmenge */
  preis?: string;
  kv?: string;
  menge?: number;
  einheit?: string;
  /** Variante „gesamt“: Umsatzerlöse und variable Kosten der Periode */
  umsatz?: string;
  kvGesamt?: string;
  erzeugnisfix: string;
}

export interface DbMehrstufigParams {
  variante: DbMehrstufigVariante;
  gruppen: { name: string; fix: string }[];
  erzeugnisse: Erzeugnis[];
  unternehmensfix: string;
  /** Reihenfolge der Antwortoptionen (Permutation von 0–2) */
  reihenfolge: number[];
}

export interface DbMehrstufigSolution {
  umsatz: Val[];
  kvGesamt: Val[];
  db1: Val[];
  db2: Val[];
  gruppeDb2: Val[];
  db3: Val[];
  summeDb3: Val;
  be: Val;
  /** Erzeugnis mit negativem DB II (−1, wenn keines) */
  sorgenkind: number;
  /** Sorgenkind ist einziges Erzeugnis seiner Gruppe */
  allein: boolean;
  /** Ergebnisverbesserung bei Einstellung, wenn die zurechenbaren Fixkosten abbaubar sind */
  verbesserung: Val;
}

interface Weg {
  /** Gruppenfixe Kosten jedem Erzeugnis der Gruppe voll abgezogen */
  gruppenfixEinzeln?: boolean;
}

export function solveDbMehrstufig(p: DbMehrstufigParams, w: Weg = {}): DbMehrstufigSolution {
  const umsatz = p.erzeugnisse.map((e) =>
    e.umsatz !== undefined ? new Val(e.umsatz) : new Val(e.preis!).times(e.menge!),
  );
  const kvGesamt = p.erzeugnisse.map((e) =>
    e.kvGesamt !== undefined ? new Val(e.kvGesamt) : new Val(e.kv!).times(e.menge!),
  );
  const db1 = umsatz.map((u, i) => u.minus(kvGesamt[i]!));
  const db2 = db1.map((d, i) => {
    const e = p.erzeugnisse[i]!;
    const x = d.minus(e.erzeugnisfix);
    return w.gruppenfixEinzeln ? x.minus(p.gruppen[e.gruppe]!.fix) : x;
  });
  const gruppeDb2 = p.gruppen.map((_, g) =>
    sum(db2.filter((_d, i) => p.erzeugnisse[i]!.gruppe === g)),
  );
  const db3 = gruppeDb2.map((d, g) => (w.gruppenfixEinzeln ? d : d.minus(p.gruppen[g]!.fix)));
  const summeDb3 = sum(db3);
  const be = summeDb3.minus(p.unternehmensfix);

  const sorgenkind = db2.findIndex((d) => d.isNegative());
  let allein = false;
  let verbesserung = new Val(0);
  if (sorgenkind >= 0) {
    const g = p.erzeugnisse[sorgenkind]!.gruppe;
    allein = p.erzeugnisse.filter((e) => e.gruppe === g).length === 1;
    verbesserung = allein ? db3[g]!.neg() : db2[sorgenkind]!.neg();
  }
  return {
    umsatz,
    kvGesamt,
    db1,
    db2,
    gruppeDb2,
    db3,
    summeDb3,
    be,
    sorgenkind,
    allein,
    verbesserung,
  };
}

function entscheidung(p: DbMehrstufigParams, s: DbMehrstufigSolution): WahlOption[] {
  const e = p.erzeugnisse[s.sorgenkind]!;
  const gf = p.gruppen[e.gruppe]!.fix;
  const falsch = s.allein ? s.db2[s.sorgenkind]!.neg() : s.db2[s.sorgenkind]!.neg().plus(gf);
  const optionen: WahlOption[] = [
    {
      id: 'einstellen',
      text: `${e.name} einstellen: Das Betriebsergebnis steigt um ${eur(s.verbesserung)}.`,
      richtig: true,
    },
    {
      id: 'betrag',
      text: `${e.name} einstellen: Das Betriebsergebnis steigt um ${eur(falsch)}.`,
      richtig: false,
      fehlertyp: s.allein ? 'gruppenfix-nicht-abgebaut' : 'gruppenfix-einzeln-zugerechnet',
      erklaerung: s.allein
        ? `${e.name} ist das einzige Erzeugnis der Gruppe ${p.gruppen[e.gruppe]!.name}. Mit ihm fallen auch die gruppenfixen Kosten von ${eur(gf)} weg.`
        : `Die gruppenfixen Kosten von ${eur(gf)} bleiben, solange die Gruppe ${p.gruppen[e.gruppe]!.name} weitere Erzeugnisse hat. Abbaubar sind nur die erzeugnisfixen Kosten.`,
    },
    {
      id: 'keins',
      text: 'Kein Erzeugnis einstellen: Alle Erzeugnisse haben einen positiven Deckungsbeitrag I.',
      richtig: false,
      fehlertyp: 'einstellung-nach-db-i',
      erklaerung: `Der DB I reicht nicht als Maßstab, wenn die erzeugnisfixen Kosten abbaubar sind. ${e.name} hat einen negativen DB II.`,
    },
  ];
  return p.reihenfolge.map((i) => optionen[i]!);
}

function parts(p: DbMehrstufigParams, s: DbMehrstufigSolution, wahlRichtig?: string): TaskPart[] {
  const fest = (v: Val | string): Zelle => ({ typ: 'fest', text: eur(v) });
  const stueck = p.variante === 'stueck';
  const z = (label: string, zellen: Zelle[], summe = false): TabellenZeile =>
    summe ? { label, zellen, summe } : { label, zellen };
  const erzeugnisse: TabellenZeile[] = [
    z(
      'Umsatzerlöse',
      p.erzeugnisse.map((e, i) =>
        stueck ? feld(`umsatz-${i}`, `Umsatzerlöse ${e.name}`, s.umsatz[i]!) : fest(s.umsatz[i]!),
      ),
    ),
    z(
      '− variable Kosten',
      p.erzeugnisse.map((e, i) =>
        stueck
          ? feld(`kv-${i}`, `variable Kosten ${e.name}`, s.kvGesamt[i]!)
          : fest(s.kvGesamt[i]!),
      ),
    ),
    z(
      '= Deckungsbeitrag I',
      p.erzeugnisse.map((e, i) => feld(`db1-${i}`, `DB I ${e.name}`, s.db1[i]!)),
      true,
    ),
    z(
      '− erzeugnisfixe Kosten',
      p.erzeugnisse.map((e) => fest(e.erzeugnisfix)),
    ),
    z(
      '= Deckungsbeitrag II',
      p.erzeugnisse.map((e, i) => feld(`db2-${i}`, `DB II ${e.name}`, s.db2[i]!)),
      true,
    ),
  ];
  const gruppen: TabellenZeile[] = [
    z(
      'Summe DB II',
      p.gruppen.map((g, j) => feld(`gdb2-${j}`, `Summe DB II ${g.name}`, s.gruppeDb2[j]!)),
    ),
    z(
      '− erzeugnisgruppenfixe Kosten',
      p.gruppen.map((g) => fest(g.fix)),
    ),
    z(
      '= Deckungsbeitrag III',
      p.gruppen.map((g, j) => feld(`db3-${j}`, `DB III ${g.name}`, s.db3[j]!)),
      true,
    ),
  ];
  const optionen = entscheidung(p, s).map((o) =>
    wahlRichtig === undefined ? o : { ...o, richtig: o.id === wahlRichtig },
  );
  return [
    {
      typ: 'tabelle',
      id: 'erzeugnisse',
      titel: 'Deckungsbeiträge I und II je Erzeugnis',
      spalten: p.erzeugnisse.map((e) => e.name),
      zeilen: erzeugnisse,
      hinweis: 'Negative Werte mit Minus eingeben.',
    },
    {
      typ: 'tabelle',
      id: 'gruppen',
      titel: 'Deckungsbeitrag III je Erzeugnisgruppe',
      spalten: p.gruppen.map(
        (g, j) =>
          `${g.name} (${p.erzeugnisse
            .filter((e) => e.gruppe === j)
            .map((e) => e.name)
            .join(', ')})`,
      ),
      zeilen: gruppen,
    },
    {
      typ: 'rechenkette',
      id: 'ergebnis',
      titel: 'Betriebsergebnis',
      felder: [
        feld('summeDb3', 'Summe DB III', s.summeDb3),
        feld('be', 'Betriebsergebnis (Verlust mit Minus)', s.be),
      ],
    },
    {
      typ: 'aufgabe-erkennen',
      id: 'entscheidung',
      frage:
        'Angenommen, die erzeugnisfixen und die gruppenfixen Kosten fallen weg, sobald ihr Bezugsobjekt aufgegeben wird. Welche Empfehlung ist richtig?',
      optionen,
      begruendung:
        'Maßstab ist der DB II: Ist er negativ, deckt das Erzeugnis nicht einmal die Fixkosten, die es selbst verursacht. Fällt mit ihm die ganze Gruppe weg, entfallen auch die gruppenfixen Kosten (DB III).',
    },
  ];
}

const GRUPPEN = [
  {
    name: 'Softdrinks',
    erzeugnisse: [
      { name: 'Paderquell Energy 0,33 l', einheit: 'Dosen', preis: [60, 110], menge: [200, 900] },
      { name: 'Paderquell Energy 0,5 l', einheit: 'Dosen', preis: [85, 150], menge: [100, 600] },
      { name: 'Senne Lemon 0,33 l', einheit: 'Flaschen', preis: [55, 100], menge: [150, 800] },
    ],
  },
  {
    name: 'Bier',
    erzeugnisse: [
      {
        name: 'Almeblick Tequila-Bier 0,33 l',
        einheit: 'Flaschen',
        preis: [70, 130],
        menge: [100, 600],
      },
      {
        name: 'Almeblick Tequila-Bier 5-l-Fass',
        einheit: 'Fässer',
        preis: [1500, 2500],
        menge: [5, 20],
      },
    ],
  },
] as const;

/** Auf ein Vielfaches von `step` abrunden (mindestens `step`). */
function abrundenAuf(x: Val, step: number): string {
  const v = x.exact.div(step).floor().times(step);
  return (v.lt(step) ? dec(step) : v).toString();
}

function erzeugeGrunddaten(r: Rng, variante: DbMehrstufigVariante, krumm: boolean) {
  const nSoft = r.int(2, 3);
  const nBier = r.int(1, 2);
  const auswahl = [
    ...r
      .shuffle(GRUPPEN[0].erzeugnisse)
      .slice(0, nSoft)
      .map((e) => ({ e, gruppe: 0 })),
    ...r
      .shuffle(GRUPPEN[1].erzeugnisse)
      .slice(0, nBier)
      .map((e) => ({ e, gruppe: 1 })),
  ];
  return auswahl.map(({ e, gruppe }): Erzeugnis & { db1: Val } => {
    if (variante === 'stueck') {
      const preis = dec(r.step(e.preis[0], e.preis[1], krumm ? 1 : 5)).div(100);
      const anteil = dec(r.int(40, 75)).div(100);
      const kv = preis.times(anteil).toDecimalPlaces(2);
      const menge = r.step(e.menge[0], e.menge[1], e.menge[0] >= 100 ? 10 : 1) * 1_000;
      return {
        name: e.name,
        gruppe,
        einheit: e.einheit,
        preis: preis.toString(),
        kv: kv.toString(),
        menge,
        erzeugnisfix: '0',
        db1: new Val(preis.minus(kv)).times(menge),
      };
    }
    const umsatz = r.step(100_000, 900_000, krumm ? 1_000 : 10_000);
    const kvGesamt = Math.round((umsatz * r.int(40, 80)) / 100 / 10_000) * 10_000;
    return {
      name: e.name,
      gruppe,
      umsatz: String(umsatz),
      kvGesamt: String(kvGesamt),
      erzeugnisfix: '0',
      db1: new Val(umsatz - kvGesamt),
    };
  });
}

export const dbMehrstufig = defineGenerator<DbMehrstufigParams, DbMehrstufigSolution>({
  skillId: 'K4-db-mehrstufig',
  titel: 'Mehrstufige Deckungsbeitragsrechnung',
  variants: ['gesamt', 'stueck'],
  points: 10,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const variante =
      (opts.variant as DbMehrstufigVariante | undefined) ?? (rng.chance(0.6) ? 'gesamt' : 'stueck');
    return retry(
      rng,
      (r) => {
        const roh = erzeugeGrunddaten(r, variante, krumm);
        const sorgenkind = r.int(0, roh.length - 1);
        const step = krumm ? 1_000 : 10_000;
        const erzeugnisse: Erzeugnis[] = roh.map(({ db1, ...e }, i) => {
          const fix =
            i === sorgenkind
              ? db1.exact
                  .div(step)
                  .ceil()
                  .times(step)
                  .plus(r.step(1, 5, 1) * step)
              : dec(abrundenAuf(db1.times(dec(r.int(20, 60)).div(100)), step));
          return { ...e, erzeugnisfix: fix.toDecimalPlaces(0, 3).toString() };
        });
        const db2 = erzeugnisse.map((e, i) => roh[i]!.db1.minus(e.erzeugnisfix));
        const gruppen = GRUPPEN.map((g, j) => {
          const andere = sum(
            db2.filter((_d, i) => erzeugnisse[i]!.gruppe === j && i !== sorgenkind),
          );
          const allein = erzeugnisse.filter((e) => e.gruppe === j).length === 1;
          const fix =
            allein && erzeugnisse[sorgenkind]!.gruppe === j
              ? String(r.step(1, 6, 1) * 10_000)
              : abrundenAuf(andere.times(dec(r.int(20, 70)).div(100)), step);
          return { name: g.name, fix };
        });
        const summeDb2 = sum(db2);
        const gf = gruppen.reduce((a, g) => a + Number(g.fix), 0);
        const rest = summeDb2.minus(gf);
        const uf = abrundenAuf(rest.abs().times(dec(r.int(50, 120)).div(100)), step);
        return {
          variante,
          gruppen,
          erzeugnisse,
          unternehmensfix: uf,
          reihenfolge: r.shuffle([0, 1, 2]),
        } satisfies DbMehrstufigParams;
      },
      (p) => {
        const s = solveDbMehrstufig(p);
        if (s.sorgenkind < 0 || s.db2.filter((d) => d.isNegative()).length !== 1) return false;
        if (!s.db1.every((d) => d.exact.gt(0))) return false;
        // Gruppe ohne das Sorgenkind trägt ihre gruppenfixen Kosten (eindeutige beste Entscheidung)
        const g = p.erzeugnisse[s.sorgenkind]!.gruppe;
        const ohne = sum(
          s.db2.filter((_d, i) => p.erzeugnisse[i]!.gruppe === g && i !== s.sorgenkind),
        );
        if (!s.allein && ohne.exact.lt(p.gruppen[g]!.fix)) return false;
        return p.gruppen.every((x) => dec(x.fix).gt(0)) && dec(p.unternehmensfix).gt(0);
      },
    );
  },
  render: (p) => {
    const stueck = p.variante === 'stueck';
    return {
      titel: 'Mehrstufige Deckungsbeitragsrechnung',
      kontext: 'Sortimentsentscheidung: Trägt sich jede Sorte?',
      sachverhalt: [
        `Die MBG teilt ihr Sortiment in die Erzeugnisgruppen ${p.gruppen.map((g) => g.name).join(' und ')}. Für das abgelaufene Quartal liegen folgende Zahlen vor.`,
        `Erzeugnisgruppenfixe Kosten: ${p.gruppen.map((g) => `${g.name} ${eur(g.fix)}`).join(', ')}. Unternehmensfixe Kosten: ${eur(p.unternehmensfix)}.`,
      ],
      daten: {
        spalten: stueck
          ? [
              'Erzeugnis',
              'Gruppe',
              'Preis je Einheit',
              'variable Kosten je Einheit',
              'Absatzmenge',
              'erzeugnisfixe Kosten',
            ]
          : ['Erzeugnis', 'Gruppe', 'Umsatzerlöse', 'variable Kosten', 'erzeugnisfixe Kosten'],
        zeilen: p.erzeugnisse.map((e) =>
          stueck
            ? [
                e.name,
                p.gruppen[e.gruppe]!.name,
                eur(e.preis!),
                eur(e.kv!),
                `${plain(e.menge!)} ${e.einheit ?? ''}`.trim(),
                eur(e.erzeugnisfix),
              ]
            : [
                e.name,
                p.gruppen[e.gruppe]!.name,
                eur(e.umsatz!),
                eur(e.kvGesamt!),
                eur(e.erzeugnisfix),
              ],
        ),
      },
      aufgabe:
        'Berechne je Erzeugnis DB I und DB II, je Gruppe den DB III und daraus das Betriebsergebnis. Entscheide dann, welches Erzeugnis eingestellt werden sollte.',
    };
  },
  solve: (p) => solveDbMehrstufig(p),
  parts: (p, s) => parts(p, s),
  steps: (p, s) => [
    ...p.erzeugnisse.map((e, i) => ({
      titel: e.name,
      rechnung: `DB I = ${eur(s.umsatz[i]!)} − ${eur(s.kvGesamt[i]!)} = ${eur(s.db1[i]!)}; DB II = ${eur(s.db1[i]!)} − ${eur(e.erzeugnisfix)} = ${eur(s.db2[i]!)}`,
    })),
    ...p.gruppen.map((g, j) => ({
      titel: `Gruppe ${g.name}`,
      rechnung: `DB III = ${eur(s.gruppeDb2[j]!)} − ${eur(g.fix)} = ${eur(s.db3[j]!)}`,
      erlaeuterung: 'Gruppenfixe Kosten werden erst von der Summe der DB II der Gruppe abgezogen.',
    })),
    {
      titel: 'Betriebsergebnis',
      rechnung: `${eur(s.summeDb3)} − ${eur(p.unternehmensfix)} = ${eur(s.be)}`,
    },
    {
      titel: 'Sortimentsentscheidung',
      erlaeuterung: `${p.erzeugnisse[s.sorgenkind]!.name} hat einen negativen DB II (${eur(s.db2[s.sorgenkind]!)}). Sind die zurechenbaren Fixkosten abbaubar, steigt das Betriebsergebnis bei Einstellung um ${eur(s.verbesserung)}${s.allein ? ' (mit dem Erzeugnis entfallen auch die gruppenfixen Kosten)' : ''}. Sind sie nicht abbaubar, bleibt der positive DB I ein Beitrag zur Fixkostendeckung.`,
    },
  ],
  hints: (p, s) => [
    'Reihenfolge: Umsatzerlöse − variable Kosten = DB I; − erzeugnisfixe Kosten = DB II; Summe DB II der Gruppe − gruppenfixe Kosten = DB III; Summe DB III − unternehmensfixe Kosten = Betriebsergebnis.',
    'Gruppenfixe Kosten nie einem einzelnen Erzeugnis abziehen, sondern erst der Summe der Gruppe.',
    `Achte auf das Erzeugnis mit negativem DB II: ${p.erzeugnisse[s.sorgenkind]!.name}.`,
  ],
  errorVariants: (p) => [
    {
      fehlertyp: 'gruppenfix-einzeln-zugerechnet',
      parts: parts(p, solveDbMehrstufig(p, { gruppenfixEinzeln: true })),
    },
    { fehlertyp: 'einstellung-nach-db-i', parts: parts(p, solveDbMehrstufig(p), 'keins') },
  ],
  verfahren: () => 'Mehrstufige Deckungsbeitragsrechnung (Fixkostendeckungsrechnung)',
});
