// K2 – Einstufige Deckungsbeitragsrechnung: Stückdeckungsbeitrag, Deckungsbeitrag, Betriebsergebnis.
import { Val, sum } from '../../money';
import type { ErrorVariant, TabellenZeile, TaskPart } from '../../task';
import { defineGenerator, eur, feld, isKrumm, plain, retry } from '../base';
import { MONATE, SORTEN_K, cent } from './common';

export type DbEinstufigVariante = 'ein-produkt' | 'mehrere' | 'rueckwaerts';

export interface DbProdukt {
  name: string;
  einheit: string;
  sg: string;
  /** Nettoverkaufspreis je Einheit in € */
  preis: string;
  /** variable Kosten je Einheit in € (bei „rueckwaerts“ gesucht) */
  kv: string;
  menge: number;
}

export interface DbEinstufigParams {
  variante: DbEinstufigVariante;
  monat: string;
  produkte: DbProdukt[];
  /** Fixkosten (Block) je Monat in € */
  kf: string;
}

export interface DbEinstufigSolution {
  db: Val[];
  dbGesamt: Val[];
  umsatz: Val[];
  dbSumme: Val;
  be: Val;
  /** rueckwaerts: ermittelte variable Kosten je Einheit */
  kv: Val;
}

interface Weg {
  /** Fixkostenanteil je Stück vom Deckungsbeitrag abgezogen (Stückgewinn statt db) */
  fixJeStueck?: boolean;
  /** Betriebsergebnis = Deckungsbeitrag (Fixkosten nicht abgezogen) */
  ohneFix?: boolean;
  /** rueckwaerts: Deckungsbeitrag = Betriebsergebnis (Fixkosten nicht addiert) */
  rueckOhneFix?: boolean;
}

/** Betriebsergebnis aus den Grunddaten (für den Sachverhalt der Variante „rueckwaerts“). */
export function betriebsergebnis(p: DbEinstufigParams): Val {
  return sum(p.produkte.map((x) => new Val(x.preis).minus(x.kv).times(x.menge))).minus(p.kf);
}

export function solveDbEinstufig(p: DbEinstufigParams, w: Weg = {}): DbEinstufigSolution {
  const mengeGesamt = p.produkte.reduce((a, x) => a + x.menge, 0);
  const fixJeStueck = new Val(p.kf).div(mengeGesamt).round();
  const db = p.produkte.map((x) => {
    const d = new Val(x.preis).minus(x.kv);
    return w.fixJeStueck ? d.minus(fixJeStueck) : d;
  });
  const dbGesamt = db.map((d, i) => d.times(p.produkte[i]!.menge).round());
  const umsatz = p.produkte.map((x) => new Val(x.preis).times(x.menge));
  const dbSumme = sum(dbGesamt);
  const be = w.ohneFix ? dbSumme : dbSumme.minus(p.kf);

  // Rückwärtsrechnung (nur ein Produkt): Betriebsergebnis gegeben, variable Kosten gesucht
  const x = p.produkte[0]!;
  const beGegeben = betriebsergebnis(p);
  const dbRueck = w.rueckOhneFix ? beGegeben : beGegeben.plus(p.kf);
  const dbStueckRueck = dbRueck.div(x.menge).round();
  if (p.variante === 'rueckwaerts') {
    return {
      db: [dbStueckRueck],
      dbGesamt: [dbRueck],
      umsatz,
      dbSumme: dbRueck,
      be: beGegeben,
      kv: new Val(x.preis).minus(dbStueckRueck),
    };
  }
  return { db, dbGesamt, umsatz, dbSumme, be, kv: new Val(x.kv) };
}

function parts(p: DbEinstufigParams, s: DbEinstufigSolution): TaskPart[] {
  const x = p.produkte[0]!;
  if (p.variante === 'ein-produkt') {
    return [
      {
        typ: 'rechenkette',
        id: 'db',
        titel: 'Deckungsbeitrag und Betriebsergebnis',
        felder: [
          feld('db', `Stückdeckungsbeitrag je ${x.sg}`, s.db[0]!),
          feld('dbGesamt', 'Deckungsbeitrag gesamt', s.dbGesamt[0]!),
          feld('be', 'Betriebsergebnis (Verlust mit Minus)', s.be),
        ],
      },
    ];
  }
  if (p.variante === 'rueckwaerts') {
    return [
      {
        typ: 'rechenkette',
        id: 'rueck',
        titel: 'Vom Betriebsergebnis zu den variablen Kosten',
        felder: [
          feld('dbGesamt', 'Deckungsbeitrag gesamt', s.dbGesamt[0]!),
          feld('db', `Stückdeckungsbeitrag je ${x.sg}`, s.db[0]!),
          feld('kv', `variable Kosten je ${x.sg}`, s.kv),
        ],
      },
    ];
  }
  const zeilen: TabellenZeile[] = [
    {
      label: 'Stückdeckungsbeitrag',
      zellen: [
        ...p.produkte.map((pr, i) => feld(`db-${i}`, `Stückdeckungsbeitrag ${pr.name}`, s.db[i]!)),
        { typ: 'leer' as const },
      ],
    },
    {
      label: 'Absatzmenge',
      zellen: [
        ...p.produkte.map((pr) => ({ typ: 'fest' as const, text: plain(pr.menge) })),
        { typ: 'leer' as const },
      ],
    },
    {
      label: 'Deckungsbeitrag',
      summe: true,
      zellen: [
        ...p.produkte.map((pr, i) =>
          feld(`dbg-${i}`, `Deckungsbeitrag ${pr.name}`, s.dbGesamt[i]!),
        ),
        feld('dbSumme', 'Deckungsbeitrag gesamt', s.dbSumme),
      ],
    },
  ];
  return [
    {
      typ: 'tabelle',
      id: 'tabelle',
      titel: 'Deckungsbeiträge je Sorte',
      spalten: [...p.produkte.map((pr) => pr.name), 'Gesamt'],
      zeilen,
    },
    {
      typ: 'rechenkette',
      id: 'ergebnis',
      titel: 'Betriebsergebnis',
      felder: [feld('be', 'Betriebsergebnis (Verlust mit Minus)', s.be)],
    },
  ];
}

/** Preisrahmen je Sorte in Cent (netto ab Werk) */
const PREIS: Record<string, [number, number]> = {
  'Senne Lemon 0,33 l': [55, 110],
  'Paderquell Energy 0,33 l': [60, 120],
  'Paderquell Energy 0,5 l': [80, 150],
  'Almeblick Tequila-Bier 0,33 l': [70, 130],
};

export const dbEinstufig = defineGenerator<DbEinstufigParams, DbEinstufigSolution>({
  skillId: 'K2-db-einstufig',
  titel: 'Deckungsbeitrag und Betriebsergebnis',
  variants: ['ein-produkt', 'mehrere', 'rueckwaerts'],
  points: 5,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const variante =
      (opts.variant as DbEinstufigVariante | undefined) ??
      rng.pick<DbEinstufigVariante>(['ein-produkt', 'ein-produkt', 'mehrere', 'rueckwaerts']);
    return retry(
      rng,
      (r) => {
        const anzahl = variante === 'mehrere' ? 3 : 1;
        const sorten = r.shuffle(SORTEN_K).slice(0, anzahl);
        const produkte: DbProdukt[] = sorten.map((so) => {
          const [lo, hi] = PREIS[so.produkt]!;
          const preis = cent(r, lo, hi, krumm ? 1 : 5);
          const dbCent = r.step(10, Math.max(10, Math.round(lo * 0.6)), krumm ? 1 : 5);
          const kv = new Val(preis).minus(new Val(dbCent).div(100)).exact.toString();
          return {
            name: so.produkt,
            einheit: so.einheit,
            sg: so.sg,
            preis,
            kv,
            menge: krumm ? r.step(50_000, 900_000, 1_000) : r.step(50_000, 900_000, 10_000),
          };
        });
        const dbSumme = sum(
          produkte.map((x) => new Val(x.preis).minus(x.kv).times(x.menge)),
        ).value.toNumber();
        // Fixkosten zwischen 60 % und 130 % des Deckungsbeitrags: Gewinn und Verlust kommen vor.
        const kf = String(
          Math.max(5_000, Math.round((dbSumme * r.int(60, 130)) / 100 / 5_000) * 5_000),
        );
        return {
          variante,
          monat: r.pick(MONATE),
          produkte,
          kf,
        } satisfies DbEinstufigParams;
      },
      (p) =>
        p.produkte.every((x) => new Val(x.kv).cmp('0.1') >= 0) &&
        !betriebsergebnis(p).exact.isZero(),
    );
  },
  render: (p) => {
    const x = p.produkte[0]!;
    if (p.variante === 'rueckwaerts') {
      const be = betriebsergebnis(p);
      return {
        titel: 'Variable Kosten aus dem Betriebsergebnis',
        kontext: 'Teilkostenrechnung: Ergebnis einer Sorte',
        sachverhalt: [
          `Im ${p.monat} hat die MBG ${plain(x.menge)} ${x.einheit} ${x.name} zu ${eur(x.preis)} je ${x.sg} verkauft. Die Fixkosten der Abfüllung betrugen ${eur(p.kf)}.`,
          be.isNegative()
            ? `Das Betriebsergebnis war ein Verlust von ${eur(be.abs())}.`
            : `Das Betriebsergebnis war ein Gewinn von ${eur(be)}.`,
        ],
        aufgabe: `Ermittle den Deckungsbeitrag gesamt, den Stückdeckungsbeitrag und die variablen Kosten je ${x.sg}.`,
      };
    }
    if (p.variante === 'ein-produkt') {
      return {
        titel: 'Deckungsbeitrag einer Sorte',
        kontext: 'Teilkostenrechnung: Lohnt sich die Sorte?',
        sachverhalt: [
          `Im ${p.monat} hat die MBG ${plain(x.menge)} ${x.einheit} ${x.name} verkauft. Nettoverkaufspreis ${eur(x.preis)} je ${x.sg}, variable Kosten ${eur(x.kv)} je ${x.sg}.`,
          `Die Fixkosten der Abfüllung betragen ${eur(p.kf)} im Monat.`,
        ],
        aufgabe: 'Ermittle Stückdeckungsbeitrag, Deckungsbeitrag gesamt und Betriebsergebnis.',
      };
    }
    return {
      titel: 'Deckungsbeiträge mehrerer Sorten',
      kontext: 'Teilkostenrechnung: Betriebsergebnis des Monats',
      sachverhalt: [
        `Die Kostenrechnung liefert für den ${p.monat} folgende Zahlen. Die Fixkosten betragen insgesamt ${eur(p.kf)}.`,
      ],
      daten: {
        spalten: ['Sorte', 'Preis je Einheit', 'variable Kosten je Einheit', 'Absatzmenge'],
        zeilen: p.produkte.map((pr) => [
          pr.name,
          eur(pr.preis),
          eur(pr.kv),
          `${plain(pr.menge)} ${pr.einheit}`,
        ]),
      },
      aufgabe:
        'Ermittle die Stückdeckungsbeiträge, die Deckungsbeiträge je Sorte und gesamt sowie das Betriebsergebnis.',
    };
  },
  solve: (p) => solveDbEinstufig(p),
  parts,
  steps: (p, s) => {
    const x = p.produkte[0]!;
    if (p.variante === 'rueckwaerts') {
      return [
        {
          titel: 'Deckungsbeitrag gesamt',
          rechnung: `Betriebsergebnis ${eur(s.be)} + Fixkosten ${eur(p.kf)} = ${eur(s.dbGesamt[0]!)}`,
          erlaeuterung: 'Betriebsergebnis = Deckungsbeitrag − Fixkosten, also rückwärts addieren.',
        },
        {
          titel: 'Stückdeckungsbeitrag',
          rechnung: `${eur(s.dbGesamt[0]!)} ÷ ${plain(x.menge)} = ${eur(s.db[0]!)}`,
        },
        {
          titel: 'Variable Kosten je Einheit',
          rechnung: `${eur(x.preis)} − ${eur(s.db[0]!)} = ${eur(s.kv)}`,
        },
      ];
    }
    return [
      ...p.produkte.map((pr, i) => ({
        titel: `Deckungsbeitrag ${pr.name}`,
        rechnung: `(${eur(pr.preis)} − ${eur(pr.kv)}) × ${plain(pr.menge)} = ${eur(s.db[i]!)} × ${plain(pr.menge)} = ${eur(s.dbGesamt[i]!)}`,
      })),
      {
        titel: 'Betriebsergebnis',
        rechnung: `${eur(s.dbSumme)} − ${eur(p.kf)} = ${eur(s.be)}`,
        erlaeuterung: s.be.isNegative()
          ? 'Der Deckungsbeitrag reicht nicht, um alle Fixkosten zu decken: Verlust.'
          : 'Der Deckungsbeitrag deckt alle Fixkosten, der Rest ist Gewinn.',
      },
    ];
  },
  hints: (p, s) =>
    p.variante === 'rueckwaerts'
      ? [
          'Betriebsergebnis = Deckungsbeitrag − Fixkosten. Stelle die Formel um.',
          `Deckungsbeitrag = ${eur(s.be)} + ${eur(p.kf)}.`,
          'Variable Kosten je Einheit = Preis − Stückdeckungsbeitrag.',
        ]
      : [
          'Stückdeckungsbeitrag = Preis − variable Kosten je Einheit. Fixkosten gehören nicht hinein.',
          'Deckungsbeitrag = Stückdeckungsbeitrag × Absatzmenge.',
          `Betriebsergebnis = Summe der Deckungsbeiträge − ${eur(p.kf)} Fixkosten.`,
        ],
  errorVariants: (p) => {
    if (p.variante === 'rueckwaerts') {
      return [
        {
          fehlertyp: 'fixkosten-nicht-addiert',
          parts: parts(p, solveDbEinstufig(p, { rueckOhneFix: true })),
        },
      ];
    }
    const out: ErrorVariant[] = [
      {
        fehlertyp: 'fixkosten-je-stueck-im-db',
        parts: parts(p, solveDbEinstufig(p, { fixJeStueck: true })),
      },
      {
        fehlertyp: 'fixkosten-nicht-abgezogen',
        parts: parts(p, solveDbEinstufig(p, { ohneFix: true })),
      },
    ];
    return out;
  },
  verfahren: () => 'Einstufige Deckungsbeitragsrechnung',
});
