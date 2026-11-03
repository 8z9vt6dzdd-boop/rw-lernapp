// K6 – Engpassplanung mit relativen Deckungsbeiträgen (Abfüllanlage der MBG im Sommer).
// Spezifikation und Golden Cases: docs/m7/k2.md (GC-23 aus docs/04-fachregeln.md).
import { Val, dec, sum } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, TabellenZeile, TaskPart } from '../../task';
import { defineGenerator, eur, feld, isExact, isKrumm, plain, retry } from '../base';
import { wahlPart, type WahlText } from './common';

export type EngpassVariante = 'db-gegeben' | 'preis-kv';

export interface EngpassProdukt {
  name: string;
  /** Kurzzeichen für Rangfolgen, z. B. „A“ */
  kurz: string;
  /** Stückdeckungsbeitrag (Variante db-gegeben) bzw. Preis und variable Kosten (preis-kv) */
  db?: string;
  preis?: string;
  kv?: string;
  /** Beanspruchung des Engpasses je Stück in Minuten */
  zeit: string;
  maxAbsatz: number;
}

export interface EngpassParams {
  variante: EngpassVariante;
  /** Kapazität des Engpasses in Minuten */
  kapazitaet: number;
  produkte: EngpassProdukt[];
  /** optional: Fixkosten des Monats für das Betriebsergebnis */
  fixkosten?: string;
}

export interface EngpassSolution {
  db: Val[];
  relDb: Val[];
  /** Indizes der Produkte in der Rangfolge */
  rang: number[];
  menge: number[];
  beanspruchung: Val[];
  dbGesamt: Val[];
  summeZeit: Val;
  summeDb: Val;
  betriebsergebnis?: Val;
}

export interface EngpassWeg {
  /** typischer Fehler: Rangfolge nach absolutem Stückdeckungsbeitrag */
  nachAbsolutemDb?: boolean;
}

export function stueckDb(pr: EngpassProdukt): Val {
  return pr.db !== undefined ? new Val(pr.db) : new Val(pr.preis!).minus(pr.kv!);
}

function rangfolge(werte: Val[]): number[] {
  return werte
    .map((v, i) => ({ v, i }))
    .sort((a, b) => b.v.exact.cmp(a.v.exact) || a.i - b.i)
    .map((x) => x.i);
}

export function solveEngpass(p: EngpassParams, w: EngpassWeg = {}): EngpassSolution {
  const db = p.produkte.map(stueckDb);
  const relDb = p.produkte.map((pr, i) => db[i]!.div(pr.zeit).round());
  const rang = rangfolge(w.nachAbsolutemDb ? db : relDb);
  const menge = p.produkte.map(() => 0);
  let rest = dec(p.kapazitaet);
  for (const i of rang) {
    const pr = p.produkte[i]!;
    // Produkte mit negativem Deckungsbeitrag werden nicht hergestellt.
    if (!db[i]!.exact.gt(0)) continue;
    const moeglich = rest.div(pr.zeit).floor().toNumber();
    const x = Math.max(0, Math.min(pr.maxAbsatz, moeglich));
    menge[i] = x;
    rest = rest.minus(dec(pr.zeit).times(x));
  }
  const beanspruchung = p.produkte.map((pr, i) => new Val(dec(pr.zeit).times(menge[i]!)));
  const dbGesamt = db.map((d, i) => d.times(menge[i]!).round());
  const summeDb = sum(dbGesamt);
  const s: EngpassSolution = {
    db,
    relDb,
    rang,
    menge,
    beanspruchung,
    dbGesamt,
    summeZeit: sum(beanspruchung),
    summeDb,
  };
  if (p.fixkosten !== undefined) s.betriebsergebnis = summeDb.minus(p.fixkosten);
  return s;
}

const kette = (p: EngpassParams, rang: number[]) =>
  rang.map((i) => p.produkte[i]!.kurz).join(' → ');

function rangOptionen(p: EngpassParams, s: EngpassSolution): { optionen: WahlText[]; abs: string } {
  const richtig = kette(p, s.rang);
  const abs = kette(p, rangfolge(s.db));
  const zeit = kette(
    p,
    p.produkte
      .map((pr, i) => ({ z: dec(pr.zeit), i }))
      .sort((a, b) => a.z.cmp(b.z) || a.i - b.i)
      .map((x) => x.i),
  );
  const absatz = kette(
    p,
    p.produkte
      .map((pr, i) => ({ m: pr.maxAbsatz, i }))
      .sort((a, b) => b.m - a.m || a.i - b.i)
      .map((x) => x.i),
  );
  const rueck = kette(p, [...s.rang].reverse());
  const texte: { text: string; erklaerung: string }[] = [
    { text: richtig, erklaerung: '' },
    {
      text: abs,
      erklaerung:
        'Das ist die Rangfolge nach dem Deckungsbeitrag je Stück. Bei einem Engpass zählt der Deckungsbeitrag je Engpassminute.',
    },
    {
      text: zeit,
      erklaerung:
        'Die kürzeste Abfüllzeit allein entscheidet nicht. Teile den Stückdeckungsbeitrag durch die Abfüllzeit.',
    },
    {
      text: absatz,
      erklaerung:
        'Der größte Absatz entscheidet nicht. Maßstab ist der Deckungsbeitrag je Engpassminute.',
    },
    {
      text: rueck,
      erklaerung:
        'Das ist die umgekehrte Rangfolge. Zuerst kommt der höchste relative Deckungsbeitrag.',
    },
  ];
  const gesehen = new Set<string>();
  const optionen: WahlText[] = [];
  for (const t of texte) {
    if (gesehen.has(t.text) || optionen.length >= 4) continue;
    gesehen.add(t.text);
    optionen.push({ id: `r${optionen.length}`, text: t.text, erklaerung: t.erklaerung });
  }
  return { optionen, abs };
}

function partsEngpass(p: EngpassParams, s: EngpassSolution, mitFehlwegen = true): TaskPart[] {
  // Optionen immer aus der richtigen Lösung, damit Fehlvarianten dieselben IDs tragen.
  const richtigeLoesung = solveEngpass(p);
  const { optionen } = rangOptionen(p, richtigeLoesung);
  const idVon = (text: string) => optionen.find((o) => o.text === text)?.id ?? 'r0';
  const gewaehlt = idVon(kette(p, s.rang));
  const fehlwege = mitFehlwegen
    ? [
        {
          fehlertyp: 'rangfolge-nach-absolutem-db',
          optionId: idVon(kette(p, rangfolge(richtigeLoesung.db))),
        },
      ]
    : [];
  const reldbFelder = p.produkte.flatMap((pr, i) => {
    const f = [
      feld(`rel-${i}`, `Relativer Deckungsbeitrag ${pr.name}`, s.relDb[i]!, 'betrag', '€/min'),
    ];
    if (p.variante === 'preis-kv')
      f.unshift(feld(`db-${i}`, `Stückdeckungsbeitrag ${pr.name}`, s.db[i]!, 'betrag', '€'));
    return f;
  });
  const zeilen: TabellenZeile[] = p.produkte.map((pr, i) => ({
    label: pr.name,
    zellen: [
      feld(`menge-${i}`, `Produktionsmenge ${pr.name}`, s.menge[i]!, 'menge', 'Stk.'),
      feld(`zeit-${i}`, `Beanspruchung ${pr.name}`, s.beanspruchung[i]!, 'zahl', 'min'),
      feld(`dbg-${i}`, `Deckungsbeitrag ${pr.name}`, s.dbGesamt[i]!),
    ],
  }));
  zeilen.push({
    label: 'Summe',
    summe: true,
    zellen: [
      { typ: 'leer' },
      { typ: 'fest', text: `${plain(p.kapazitaet)} min` },
      feld('dbg-summe', 'Gesamtdeckungsbeitrag', s.summeDb),
    ],
  });
  const ergebnis = [feld('gesamt-db', 'Gesamtdeckungsbeitrag', s.summeDb)];
  if (s.betriebsergebnis) ergebnis.push(feld('be', 'Betriebsergebnis', s.betriebsergebnis));
  return [
    {
      typ: 'rechenkette',
      id: 'reldb',
      titel: 'Relative Deckungsbeiträge',
      felder: reldbFelder,
    },
    wahlPart(
      'aufgabe-erkennen',
      'rangfolge',
      'In welcher Rangfolge wird die Abfüllanlage belegt?',
      optionen,
      gewaehlt,
      fehlwege,
      'Maßstab ist der relative Deckungsbeitrag: Stückdeckungsbeitrag ÷ Abfüllzeit je Stück.',
    ),
    {
      typ: 'tabelle',
      id: 'programm',
      titel: 'Optimales Produktionsprogramm',
      spalten: ['Menge', 'Abfüllminuten', 'Deckungsbeitrag'],
      zeilen,
      hinweis:
        'Belege die Anlage in der Rangfolge, jede Sorte höchstens bis zu ihrem maximalen Absatz.',
    },
    { typ: 'rechenkette', id: 'ergebnis', titel: 'Ergebnis', felder: ergebnis },
  ];
}

const NAMEN = [
  'Almeblick Tequila-Bier 0,33 l',
  'Senne Lemon 0,33 l',
  'Paderquell Energy 0,25 l',
  'Paderquell Energy 0,5 l',
];
const ZEITEN = ['0.02', '0.025', '0.04', '0.05', '0.06', '0.08', '0.1'];

function erzeuge(rng: Rng, variante: EngpassVariante, krumm: boolean): EngpassParams {
  const n = rng.chance(0.3) ? 4 : 3;
  const namen = rng.shuffle(NAMEN).slice(0, n);
  const produkte: EngpassProdukt[] = namen.map((name, i) => {
    const db = dec(rng.step(10, 60, krumm ? 1 : 5)).div(100);
    const pr: EngpassProdukt = {
      name,
      kurz: String.fromCharCode(65 + i),
      zeit: rng.pick(ZEITEN),
      maxAbsatz: rng.step(40_000, 250_000, 10_000),
    };
    if (variante === 'preis-kv') {
      const kv = dec(rng.step(25, 70, 5)).div(100);
      pr.kv = kv.toString();
      pr.preis = kv.plus(db).toString();
    } else pr.db = db.toString();
    return pr;
  });
  const p: EngpassParams = { variante, kapazitaet: 0, produkte };
  // Kapazität so wählen, dass mindestens eine Sorte nur teilweise oder gar nicht abgefüllt wird.
  const s = solveEngpass({ ...p, kapazitaet: 10_000_000 });
  const bedarf = s.beanspruchung.reduce((a, b) => a.plus(b.exact), dec(0));
  const hoch = bedarf.times(0.85).div(500).floor().times(500).toNumber();
  const tief = Math.max(500, bedarf.times(0.35).div(500).ceil().times(500).toNumber());
  p.kapazitaet = hoch > tief ? rng.step(tief, hoch, 500) : tief;
  if (rng.chance(0.35)) p.fixkosten = String(rng.step(10_000, 60_000, 1_000));
  return p;
}

export const engpass = defineGenerator<EngpassParams, EngpassSolution>({
  skillId: 'K6-engpass',
  titel: 'Engpassplanung mit relativem Deckungsbeitrag',
  variants: ['db-gegeben', 'preis-kv'],
  points: 8,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const variante =
      (opts.variant as EngpassVariante | undefined) ??
      (rng.chance(0.35) ? 'preis-kv' : 'db-gegeben');
    return retry(
      rng,
      (r) => erzeuge(r, variante, krumm),
      (p) => {
        const s = solveEngpass(p);
        const f = solveEngpass(p, { nachAbsolutemDb: true });
        const rel = s.relDb.map((v) => v.exact.toString());
        const abs = s.db.map((v) => v.exact.toString());
        if (new Set(rel).size !== rel.length || new Set(abs).size !== abs.length) return false;
        if (!s.relDb.every((v) => isExact(v.exact))) return false;
        if (kette(p, s.rang) === kette(p, f.rang)) return false;
        if (s.summeDb.exact.equals(f.summeDb.exact)) return false;
        // Kapazität wird voll genutzt (Teilmenge geht glatt auf), und sie ist wirklich ein Engpass.
        if (!s.summeZeit.exact.equals(p.kapazitaet)) return false;
        if (s.menge.every((m, i) => m === p.produkte[i]!.maxAbsatz)) return false;
        return rangOptionen(p, s).optionen.length >= 3;
      },
    );
  },
  render: (p) => {
    const sachverhalt = [
      `Im Juli ist die Abfüllanlage der MBG der Engpass: Es stehen ${plain(p.kapazitaet)} Abfüllminuten zur Verfügung. Alle Sorten laufen über dieselbe Anlage.`,
    ];
    if (p.fixkosten !== undefined)
      sachverhalt.push(`Die Fixkosten des Monats betragen ${eur(p.fixkosten)}.`);
    const spalten =
      p.variante === 'preis-kv'
        ? [
            'Sorte',
            'Preis je Stück',
            'variable Kosten je Stück',
            'Abfüllzeit je Stück',
            'max. Absatz',
          ]
        : ['Sorte', 'Stückdeckungsbeitrag', 'Abfüllzeit je Stück', 'max. Absatz'];
    return {
      titel: 'Engpass Abfüllanlage',
      kontext: 'Teilkostenrechnung: Sommer an der Abfüllanlage',
      sachverhalt,
      daten: {
        spalten,
        zeilen: p.produkte.map((pr) => [
          `${pr.kurz}: ${pr.name}`,
          ...(p.variante === 'preis-kv' ? [eur(pr.preis!), eur(pr.kv!)] : [eur(pr.db!)]),
          `${plain(pr.zeit)} min`,
          `${plain(pr.maxAbsatz)} Stk.`,
        ]),
      },
      aufgabe: `Ermittle ${p.variante === 'preis-kv' ? 'die Stückdeckungsbeiträge, ' : ''}die relativen Deckungsbeiträge, die Rangfolge, das optimale Produktionsprogramm und den Gesamtdeckungsbeitrag${p.fixkosten !== undefined ? ' sowie das Betriebsergebnis' : ''}.`,
    };
  },
  solve: (p) => solveEngpass(p),
  parts: (p, s) => partsEngpass(p, s),
  steps: (p, s) => {
    let rest = dec(p.kapazitaet);
    const belegung = s.rang.map((i) => {
      const pr = p.produkte[i]!;
      const vorher = rest;
      rest = rest.minus(s.beanspruchung[i]!.exact);
      return `${pr.kurz}: ${plain(s.menge[i]!)} Stk. × ${plain(pr.zeit)} min = ${plain(s.beanspruchung[i]!.exact)} min (frei vorher ${plain(vorher)} min)`;
    });
    const out = [
      ...(p.variante === 'preis-kv'
        ? [
            {
              titel: 'Stückdeckungsbeiträge',
              rechnung: p.produkte
                .map((pr, i) => `${pr.kurz}: ${eur(pr.preis!)} − ${eur(pr.kv!)} = ${eur(s.db[i]!)}`)
                .join('; '),
            },
          ]
        : []),
      {
        titel: 'Relative Deckungsbeiträge',
        rechnung: p.produkte
          .map(
            (pr, i) =>
              `${pr.kurz}: ${eur(s.db[i]!)} ÷ ${plain(pr.zeit)} min = ${eur(s.relDb[i]!)}/min`,
          )
          .join('; '),
        erlaeuterung: 'Deckungsbeitrag je Minute der knappen Abfüllanlage.',
      },
      { titel: 'Rangfolge', ergebnis: kette(p, s.rang) },
      {
        titel: 'Belegung der Anlage',
        rechnung: belegung.join('; '),
        erlaeuterung:
          'Jede Sorte bis zu ihrem maximalen Absatz, die letzte nur mit der restlichen Zeit.',
      },
      {
        titel: 'Gesamtdeckungsbeitrag',
        rechnung: s.rang.map((i) => eur(s.dbGesamt[i]!)).join(' + ') + ` = ${eur(s.summeDb)}`,
      },
    ];
    if (s.betriebsergebnis)
      out.push({
        titel: 'Betriebsergebnis',
        rechnung: `${eur(s.summeDb)} − ${eur(p.fixkosten!)} = ${eur(s.betriebsergebnis)}`,
      });
    return out;
  },
  hints: (p, s) => [
    'Bei einem Engpass zählt nicht der Deckungsbeitrag je Stück, sondern je Engpassminute.',
    `Relativer Deckungsbeitrag = Stückdeckungsbeitrag ÷ Abfüllzeit je Stück. Rangfolge: ${kette(p, s.rang)}.`,
    'Belege die Anlage in der Rangfolge bis zum maximalen Absatz; die letzte Sorte bekommt die restlichen Minuten.',
  ],
  errorVariants: (p): ErrorVariant[] => [
    {
      fehlertyp: 'rangfolge-nach-absolutem-db',
      parts: partsEngpass(p, solveEngpass(p, { nachAbsolutemDb: true }), false),
    },
  ],
  verfahren: () => 'Engpassplanung: Rangfolge nach relativem Deckungsbeitrag je Engpasseinheit',
});
