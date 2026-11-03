// J7 – Kostenträgerzeitrechnung: Gesamtkostenverfahren und Umsatzkostenverfahren (K2 Kap. 2.3).
// GKV: Umsatzerlöse ± Bestandsveränderungen (zu Herstellkosten) = Gesamtleistung; − alle Kosten der
// Periode nach Kostenarten = Betriebsergebnis.
// UKV: Umsatzerlöse − Selbstkosten der abgesetzten Produkte (Herstellkosten je Stück × Absatzmenge +
// Verwaltungs- und Vertriebskosten) = Betriebsergebnis, zusätzlich je Produktart.
import { Val } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, TabellenZeile, TaskPart, WahlPart } from '../../task';
import { defineGenerator, eur, feld, isExact, isKrumm, plain, retry } from '../base';

export type GkvUkvVariante = 'gkv' | 'ukv' | 'vergleich';

export interface BeProdukt {
  name: string;
  produziert: number;
  abgesetzt: number;
  preis: string;
  material: string;
  fertigung: string;
  /** Verwaltungs- und Vertriebskosten der Produktart */
  vv: string;
}

export interface GkvUkvParams {
  variante: GkvUkvVariante;
  monat: string;
  produkte: BeProdukt[];
}

export interface GkvUkvSolution {
  kh: Val[];
  dx: number[];
  bv: Val[];
  umsatz: Val[];
  umsatzSumme: Val;
  bvSumme: Val;
  gesamtleistung: Val;
  kosten: Val;
  beGkv: Val;
  skUmsatz: Val[];
  erfolg: Val[];
  beUkv: Val;
}

interface Weg {
  bvVorzeichen?: boolean;
  bvZuSk?: boolean;
  ukvProduktion?: boolean;
  ohneBv?: boolean;
}

export function solveGkvUkv(p: GkvUkvParams, w: Weg = {}): GkvUkvSolution {
  const kh = p.produkte.map((x) => {
    let k = new Val(x.material).plus(x.fertigung);
    if (w.bvZuSk) k = k.plus(x.vv);
    return k.div(x.produziert).round();
  });
  const dx = p.produkte.map((x) => x.produziert - x.abgesetzt);
  const bv = kh.map((k, i) => k.times(w.bvVorzeichen ? Math.abs(dx[i]!) : dx[i]!).round());
  const umsatz = p.produkte.map((x) => new Val(x.preis).times(x.abgesetzt));
  const umsatzSumme = umsatz.reduce((a, b) => a.plus(b), new Val(0));
  const bvSumme = bv.reduce((a, b) => a.plus(b), new Val(0));
  const gesamtleistung = w.ohneBv ? umsatzSumme : umsatzSumme.plus(bvSumme);
  const kosten = p.produkte.reduce(
    (a, x) => a.plus(x.material).plus(x.fertigung).plus(x.vv),
    new Val(0),
  );
  const beGkv = gesamtleistung.minus(kosten);
  const skUmsatz = p.produkte.map((x, i) =>
    (w.ukvProduktion
      ? new Val(x.material).plus(x.fertigung)
      : kh[i]!.times(x.abgesetzt).round()
    ).plus(x.vv),
  );
  const erfolg = umsatz.map((u, i) => u.minus(skUmsatz[i]!));
  const beUkv = erfolg.reduce((a, b) => a.plus(b), new Val(0));
  return {
    kh,
    dx,
    bv,
    umsatz,
    umsatzSumme,
    bvSumme,
    gesamtleistung,
    kosten,
    beGkv,
    skUmsatz,
    erfolg,
    beUkv,
  };
}

function erkennen(): WahlPart {
  return {
    typ: 'aufgabe-erkennen',
    id: 'erkennen',
    frage:
      'Welches Verfahren zeigt unmittelbar, wie viel jede Produktart zum Betriebsergebnis beiträgt?',
    optionen: [
      { id: 'ukv', text: 'Umsatzkostenverfahren', richtig: true },
      {
        id: 'gkv',
        text: 'Gesamtkostenverfahren',
        richtig: false,
        fehlertyp: 'verfahren-verwechselt',
        erklaerung:
          'Das Gesamtkostenverfahren zeigt die Kosten nach Kostenarten für das ganze Programm, nicht je Produkt.',
      },
      {
        id: 'beide',
        text: 'Beide gleichermaßen',
        richtig: false,
        fehlertyp: 'verfahren-verwechselt',
        erklaerung:
          'Beide liefern dasselbe Betriebsergebnis, aber nur das Umsatzkostenverfahren stellt Erlöse und Selbstkosten je Produktart gegenüber.',
      },
    ],
    begruendung:
      'Das Umsatzkostenverfahren stellt jeder Produktart die Selbstkosten ihrer abgesetzten Menge gegenüber; dafür braucht es eine Kostenträgerstückrechnung.',
  };
}

function parts(p: GkvUkvParams, s: GkvUkvSolution): TaskPart[] {
  const out: TaskPart[] = [];
  const gkv = p.variante !== 'ukv';
  const ukv = p.variante !== 'gkv';
  const zeilenHk: TabellenZeile[] = p.produkte.map((x, i) => ({
    label: x.name,
    zellen: [
      feld(`kh-${i}`, `Herstellkosten je Karton ${x.name}`, s.kh[i]!, 'satz', '€/Karton'),
      ...(gkv
        ? [
            feld(
              `dx-${i}`,
              `Bestandsveränderung ${x.name} in Kartons`,
              s.dx[i]!,
              'menge',
              'Kartons',
            ),
            feld(`bv-${i}`, `Bestandsveränderung ${x.name} zu Herstellkosten`, s.bv[i]!),
          ]
        : []),
    ],
  }));
  const hkTabelle: TaskPart = {
    typ: 'tabelle',
    id: 'hk',
    titel: gkv ? 'Herstellkosten und Bestandsveränderungen' : 'Herstellkosten je Karton',
    spalten: gkv
      ? ['Herstellkosten je Karton', 'Bestandsveränderung (Kartons)', 'Bestandsveränderung (€)']
      : ['Herstellkosten je Karton'],
    zeilen: zeilenHk,
  };
  if (gkv) hkTabelle.hinweis = 'Mehrung mit Plus, Minderung mit Minus eintragen.';
  out.push(hkTabelle);
  if (gkv) {
    out.push({
      typ: 'rechenkette',
      id: 'gkv',
      titel: 'Gesamtkostenverfahren (Staffelform)',
      felder: [
        feld('umsatz', 'Umsatzerlöse', s.umsatzSumme),
        feld('bv', 'Bestandsveränderungen (Mehrung +, Minderung −)', s.bvSumme),
        feld('gl', 'Gesamtleistung', s.gesamtleistung),
        feld(
          'kosten',
          'Kosten der Periode (Material, Fertigung, Verwaltung und Vertrieb)',
          s.kosten,
        ),
        feld('be-gkv', 'Betriebsergebnis', s.beGkv),
      ],
    });
  }
  if (ukv) {
    out.push({
      typ: 'tabelle',
      id: 'ukv',
      titel: 'Umsatzkostenverfahren',
      spalten: ['Umsatzerlöse', 'Selbstkosten des Umsatzes', 'Ergebnis der Produktart'],
      zeilen: p.produkte.map((x, i) => ({
        label: x.name,
        zellen: [
          feld(`u-${i}`, `Umsatzerlöse ${x.name}`, s.umsatz[i]!),
          feld(`sku-${i}`, `Selbstkosten des Umsatzes ${x.name}`, s.skUmsatz[i]!),
          feld(`erg-${i}`, `Ergebnis ${x.name}`, s.erfolg[i]!),
        ],
      })),
    });
    out.push({
      typ: 'rechenkette',
      id: 'be-ukv',
      titel: 'Betriebsergebnis nach dem Umsatzkostenverfahren',
      felder: [feld('be-ukv', 'Betriebsergebnis', s.beUkv)],
    });
  }
  if (p.variante === 'vergleich') out.push(erkennen());
  return out;
}

const MONATE = ['April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober'];
const PRODUKTE = [
  { name: 'Paderquell Energy', preis: [12, 20] },
  { name: 'Senne Lemon', preis: [9, 15] },
  { name: 'Almeblick Tequila-Bier', preis: [16, 26] },
] as const;

function generate(rng: Rng, variante: GkvUkvVariante, krumm: boolean): GkvUkvParams {
  return retry(
    rng,
    (r) => {
      const anzahl = r.chance(0.35) ? 3 : 2;
      const produkte: BeProdukt[] = PRODUKTE.slice(0, anzahl).map((v) => {
        const produziert = r.step(5_000, 40_000, 500);
        const delta = r.step(500, Math.min(5_000, produziert / 4), 500) * (r.chance(0.5) ? 1 : -1);
        const abgesetzt = produziert - delta;
        const preis = r.step(v.preis[0] * 2, v.preis[1] * 2, 1) / 2;
        // Herstellkosten je Karton glatt (Vielfaches von 0,05 €), bei „krumm“ mit Restcent
        const khCent = r.step(Math.round(preis * 40), Math.round(preis * 70), 5);
        let hkCent = khCent * produziert;
        if (krumm) hkCent += r.int(1, produziert - 1);
        const materialCent = Math.round((hkCent * r.int(40, 70)) / 100 / 100) * 100;
        const fertigungCent = hkCent - materialCent;
        const vvJeCent = r.step(30, Math.round(preis * 12), 5);
        return {
          name: v.name,
          produziert,
          abgesetzt,
          preis: preis.toFixed(2),
          material: (materialCent / 100).toFixed(2),
          fertigung: (fertigungCent / 100).toFixed(2),
          vv: ((vvJeCent * abgesetzt) / 100).toFixed(2),
        };
      });
      return { variante, monat: r.pick(MONATE), produkte };
    },
    (p) => {
      const s = solveGkvUkv(p);
      if (s.beGkv.isNegative()) return false;
      return krumm || s.kh.every((k) => isExact(k.exact));
    },
  );
}

export const gkvUkv = defineGenerator<GkvUkvParams, GkvUkvSolution>({
  skillId: 'J7-gkv-ukv',
  titel: 'Gesamt- und Umsatzkostenverfahren',
  variants: ['gkv', 'ukv', 'vergleich'],
  points: 8,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const variante =
      (opts.variant as GkvUkvVariante | undefined) ??
      rng.pick<GkvUkvVariante>(['gkv', 'ukv', 'vergleich']);
    return generate(rng, variante, krumm);
  },
  render: (p) => ({
    titel:
      p.variante === 'gkv'
        ? 'Betriebsergebnis nach dem Gesamtkostenverfahren'
        : p.variante === 'ukv'
          ? 'Betriebsergebnis nach dem Umsatzkostenverfahren'
          : 'Gesamt- und Umsatzkostenverfahren im Vergleich',
    kontext: 'Monatsergebnis der MBG',
    sachverhalt: [
      `Frank Wessel möchte wissen, wie der ${p.monat} gelaufen ist. Für die Betriebsergebnisrechnung liegen je Produktart folgende Monatswerte vor (Mengen in Kartons).`,
      'Bestände werden zu den Herstellkosten des Monats bewertet. Verwaltungs- und Vertriebskosten entfallen vollständig auf die abgesetzte Menge.',
    ],
    daten: {
      spalten: ['Angabe', ...p.produkte.map((x) => x.name)],
      zeilen: [
        ['Produktionsmenge', ...p.produkte.map((x) => plain(x.produziert))],
        ['Absatzmenge', ...p.produkte.map((x) => plain(x.abgesetzt))],
        ['Verkaufspreis je Karton', ...p.produkte.map((x) => eur(x.preis))],
        ['Materialkosten', ...p.produkte.map((x) => eur(x.material))],
        ['Fertigungskosten', ...p.produkte.map((x) => eur(x.fertigung))],
        ['Verwaltungs- und Vertriebskosten', ...p.produkte.map((x) => eur(x.vv))],
      ],
    },
    aufgabe:
      p.variante === 'gkv'
        ? 'Ermittle das Betriebsergebnis nach dem Gesamtkostenverfahren.'
        : p.variante === 'ukv'
          ? 'Ermittle das Betriebsergebnis nach dem Umsatzkostenverfahren, auch je Produktart.'
          : 'Ermittle das Betriebsergebnis nach beiden Verfahren und vergleiche.',
  }),
  solve: (p) => solveGkvUkv(p),
  parts,
  steps: (p, s) => {
    const out = [
      {
        titel: 'Herstellkosten je Karton',
        rechnung: p.produkte
          .map(
            (x, i) =>
              `${x.name}: (${eur(x.material)} + ${eur(x.fertigung)}) ÷ ${plain(x.produziert)} = ${eur(s.kh[i]!)}`,
          )
          .join('; '),
        erlaeuterung: 'Nur Material und Fertigung, bezogen auf die produzierte Menge.',
      },
    ];
    if (p.variante !== 'ukv') {
      out.push(
        {
          titel: 'Bestandsveränderungen',
          rechnung: p.produkte
            .map(
              (x, i) =>
                `${x.name}: (${plain(x.produziert)} − ${plain(x.abgesetzt)}) × ${eur(s.kh[i]!)} = ${eur(s.bv[i]!)}`,
            )
            .join('; '),
          erlaeuterung: 'Mehrung erhöht die Gesamtleistung, Minderung senkt sie.',
        },
        {
          titel: 'Gesamtkostenverfahren',
          rechnung: `${eur(s.umsatzSumme)} + (${eur(s.bvSumme)}) = ${eur(s.gesamtleistung)}; − ${eur(s.kosten)} = ${eur(s.beGkv)}`,
          erlaeuterung: 'Gesamtleistung − alle Kosten der Periode = Betriebsergebnis.',
        },
      );
    }
    if (p.variante !== 'gkv') {
      out.push({
        titel: 'Umsatzkostenverfahren',
        rechnung: p.produkte
          .map(
            (x, i) =>
              `${x.name}: ${eur(s.umsatz[i]!)} − (${eur(s.kh[i]!)} × ${plain(x.abgesetzt)} + ${eur(x.vv)}) = ${eur(s.erfolg[i]!)}`,
          )
          .join('; '),
        erlaeuterung: `Summe ${eur(s.beUkv)}. Nur die abgesetzte Menge zählt, Bestandsveränderungen braucht es nicht.`,
      });
    }
    return out;
  },
  hints: (p, s) =>
    p.variante === 'ukv'
      ? [
          'Umsatzkostenverfahren: Umsatzerlöse − Selbstkosten der abgesetzten Menge.',
          'Selbstkosten des Umsatzes = Herstellkosten je Karton × Absatzmenge + Verwaltungs- und Vertriebskosten.',
          `Herstellkosten je Karton ${p.produkte[0]!.name}: ${eur(s.kh[0]!)}.`,
        ]
      : [
          'Gesamtkostenverfahren: Umsatzerlöse ± Bestandsveränderungen − alle Kosten der Periode.',
          'Bestandsveränderung = (Produktion − Absatz) × Herstellkosten je Karton; Minderungen sind negativ.',
          `Gesamtleistung: ${eur(s.gesamtleistung)}.`,
        ],
  errorVariants: (p) => {
    const out: ErrorVariant[] = [];
    const add = (fehlertyp: string, w: Weg) =>
      out.push({ fehlertyp, parts: parts(p, solveGkvUkv(p, w)) });
    if (p.variante !== 'ukv') {
      if (p.produkte.some((x) => x.abgesetzt > x.produziert))
        add('bv-vorzeichen-falsch', { bvVorzeichen: true });
      add('bestand-zu-selbstkosten', { bvZuSk: true });
      add('gkv-ohne-bv', { ohneBv: true });
    }
    if (p.variante !== 'gkv') add('ukv-produktionsmenge', { ukvProduktion: true });
    return out;
  },
  verfahren: (p) =>
    p.variante === 'ukv'
      ? 'Kostenträgerzeitrechnung: Umsatzkostenverfahren'
      : p.variante === 'gkv'
        ? 'Kostenträgerzeitrechnung: Gesamtkostenverfahren'
        : 'Kostenträgerzeitrechnung: Gesamt- und Umsatzkostenverfahren',
});
