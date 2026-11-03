// I4 – Stufenleiterverfahren, I5 – Simultanverfahren (innerbetriebliche Leistungsverrechnung).
import { FIRMA } from '../../config';
import { Fraction, fracToDec, solveLinear } from '../linear';
import { Val, dec, formatNumber, sum } from '../money';
import type { Rng } from '../rng';
import type {
  ErrorVariant,
  GleichungsTerm,
  TabellenZeile,
  TaskPart,
  TaskText,
  Zelle,
} from '../task';
import { betrag, defineGenerator, eur, feld, isKrumm, plain, retry } from './base';

export interface LvStelle {
  name: string;
  primaer: string;
  /** Nur Hilfskostenstellen: Leistungseinheit, z. B. „kWh“ oder „Std.“ */
  einheit?: string;
}

export interface LvParams {
  hilfs: LvStelle[];
  haupt: LvStelle[];
  /** mengen[i][j]: Leistung der Hilfsstelle i an Stelle j (j über [...hilfs, ...haupt]). */
  mengen: number[][];
}

const ALLE = (p: LvParams) => [...p.hilfs, ...p.haupt];

export function gesamtLeistung(p: LvParams, i: number): number {
  return (p.mengen[i] ?? []).reduce((a, b) => a + b, 0);
}

function m(p: LvParams, i: number, j: number): number {
  return p.mengen[i]?.[j] ?? 0;
}

function satzEinheit(s: LvStelle): string {
  return `€/${s.einheit ?? 'LE'}`;
}

// ---------- Stufenleiter ----------

export interface StufenleiterSolution {
  /** Wert der Lieferung von Hilfsstelle i an die andere Hilfsstelle. */
  werte: [Val, Val];
  erste: number;
  zweite: number;
  saetze: [Val, Val];
  /** Von der zweiten Stelle empfangene Kosten der ersten. */
  empfangen: Val;
  /** umlage[h][k]: Umlage der Hilfsstelle h auf Hauptstelle k */
  umlage: [Val[], Val[]];
  summen: Val[];
  primaerGesamt: Val;
}

interface StufenWeg {
  reihenfolgeUmgekehrt?: boolean;
  ohneRueckflussAbzug?: boolean;
  nurPrimaer?: boolean;
}

export function reihenfolgeWerte(p: LvParams): [Val, Val] {
  const w = (i: number, k: number) =>
    new Val(p.hilfs[i]!.primaer)
      .div(gesamtLeistung(p, i))
      .times(m(p, i, k))
      .round();
  return [w(0, 1), w(1, 0)];
}

export function solveStufenleiter(p: LvParams, w: StufenWeg = {}): StufenleiterSolution {
  if (p.hilfs.length !== 2) throw new Error('Stufenleiter: genau zwei Hilfskostenstellen erwartet');
  const werte = reihenfolgeWerte(p);
  let erste = werte[0].cmp(werte[1]) >= 0 ? 0 : 1;
  if (w.reihenfolgeUmgekehrt) erste = 1 - erste;
  const zweite = 1 - erste;
  const P = (i: number) => new Val(p.hilfs[i]!.primaer);
  const qErste = P(erste).div(gesamtLeistung(p, erste)).round();
  const empfangen = qErste.times(m(p, erste, zweite)).round();
  const zaehler = w.nurPrimaer ? P(zweite) : P(zweite).plus(empfangen);
  const nenner = gesamtLeistung(p, zweite) - (w.ohneRueckflussAbzug ? 0 : m(p, zweite, erste));
  const qZweite = zaehler.div(nenner).round();
  const saetze: [Val, Val] = erste === 0 ? [qErste, qZweite] : [qZweite, qErste];
  const h = p.hilfs.length;
  const umlage: [Val[], Val[]] = [
    p.haupt.map((_, k) => saetze[0].times(m(p, 0, h + k)).round()),
    p.haupt.map((_, k) => saetze[1].times(m(p, 1, h + k)).round()),
  ];
  const summen = p.haupt.map((s, k) => new Val(s.primaer).plus(umlage[0][k]!).plus(umlage[1][k]!));
  const primaerGesamt = sum(ALLE(p).map((s) => s.primaer));
  return { werte, erste, zweite, saetze, empfangen, umlage, summen, primaerGesamt };
}

function datenTabelle(p: LvParams): TaskText['daten'] {
  const alle = ALLE(p);
  return {
    spalten: ['', ...alle.map((s) => s.name)],
    zeilen: [
      ['Primäre Gemeinkosten (€)', ...alle.map((s) => formatNumber(s.primaer))],
      ...p.hilfs.map((hs, i) => [
        `Leistung ${hs.name} (${hs.einheit})`,
        ...alle.map((_, j) => (j === i && m(p, i, j) === 0 ? '–' : plain(m(p, i, j)))),
      ]),
    ],
  };
}

function stufenParts(p: LvParams, s: StufenleiterSolution): TaskPart[] {
  const h0 = p.hilfs[0]!;
  const h1 = p.hilfs[1]!;
  const leer: Zelle = { typ: 'leer' };
  const fest = (t: string): Zelle => ({ typ: 'fest', text: t });
  const ersteName = p.hilfs[s.erste]!.name;
  const zweiteName = p.hilfs[s.zweite]!.name;
  const hauptZellen = (prefix: string, label: string, werte: Val[]) =>
    werte.map((v, k) => feld(`${prefix}-${k}`, `${label} ${p.haupt[k]!.name}`, v));
  // Spalten: erste Hilfsstelle, zweite Hilfsstelle, Hauptstellen
  const zeilen: TabellenZeile[] = [
    {
      label: 'Primäre Gemeinkosten',
      zellen: [
        fest(formatNumber(p.hilfs[s.erste]!.primaer)),
        fest(formatNumber(p.hilfs[s.zweite]!.primaer)),
        ...p.haupt.map((x) => fest(formatNumber(x.primaer))),
      ],
    },
    {
      label: `Umlage ${ersteName}`,
      zellen: [
        leer,
        feld(`empfang-${s.zweite}`, `Umlage ${ersteName} an ${zweiteName}`, s.empfangen),
        ...hauptZellen(`u${s.erste}`, `Umlage ${ersteName} an`, s.umlage[s.erste as 0 | 1]),
      ],
    },
    {
      label: `Umlage ${zweiteName}`,
      zellen: [
        leer,
        leer,
        ...hauptZellen(`u${s.zweite}`, `Umlage ${zweiteName} an`, s.umlage[s.zweite as 0 | 1]),
      ],
    },
    {
      label: 'Summe',
      summe: true,
      zellen: [leer, leer, ...hauptZellen('summe', 'Summe', s.summen)],
    },
  ];
  return [
    {
      typ: 'rechenkette',
      id: 'reihenfolge',
      titel: 'Reihenfolge und Verrechnungssätze',
      felder: [
        feld('wert-0', `Wert der Lieferung ${h0.name} → ${h1.name}`, s.werte[0]),
        feld('wert-1', `Wert der Lieferung ${h1.name} → ${h0.name}`, s.werte[1]),
        {
          typ: 'auswahl',
          id: 'erste',
          label: 'Zuerst abzurechnen',
          optionen: [h0.name, h1.name],
          soll: ersteName,
        },
        feld(
          `q-${s.erste}`,
          `Verrechnungssatz ${ersteName}`,
          s.saetze[s.erste as 0 | 1],
          'satz',
          satzEinheit(p.hilfs[s.erste]!),
        ),
        feld(
          `q-${s.zweite}`,
          `Verrechnungssatz ${zweiteName}`,
          s.saetze[s.zweite as 0 | 1],
          'satz',
          satzEinheit(p.hilfs[s.zweite]!),
        ),
      ],
    },
    {
      typ: 'tabelle',
      id: 'bab',
      titel: 'Betriebsabrechnungsbogen (Stufenleiter)',
      spalten: [ersteName, zweiteName, ...p.haupt.map((x) => x.name)],
      zeilen,
      hinweis: `Kontrolle: Die Summe der Hauptkostenstellen muss den gesamten primären Gemeinkosten entsprechen (${eur(s.primaerGesamt)}).`,
    },
  ];
}

// ---------- Generierung ----------

const ENERGIE_SAETZE = [
  '0.2',
  '0.25',
  '0.3',
  '0.4',
  '0.5',
  '0.6',
  '0.8',
  '1',
  '1.2',
  '1.5',
  '2',
  '2.5',
  '3',
  '4',
];
const STUNDEN_SAETZE = [
  '30',
  '35',
  '40',
  '45',
  '50',
  '55',
  '60',
  '65',
  '70',
  '75',
  '80',
  '90',
  '100',
  '120',
];

/** Zerlegt `total` in `n` positive Vielfache von `unit`. */
function zerlege(rng: Rng, total: number, n: number, unit: number): number[] {
  const units = Math.round(total / unit);
  const cuts = new Set<number>();
  while (cuts.size < n - 1) cuts.add(rng.int(1, units - 1));
  const sorted = [0, ...[...cuts].sort((a, b) => a - b), units];
  return sorted.slice(1).map((c, i) => (c - (sorted[i] ?? 0)) * unit);
}

function grundgeruest(rng: Rng, eigenverbrauch: boolean): LvParams {
  const k = FIRMA.kostenstellen;
  const hauptAuswahl = [k.material, k.fertigung1, k.fertigung2, k.verwaltung, k.vertrieb];
  const anzahl = rng.int(2, 4);
  const indizes = rng
    .shuffle([0, 1, 2, 3, 4])
    .slice(0, anzahl)
    .sort((a, b) => a - b);
  const haupt = indizes.map((i) => ({
    name: hauptAuswahl[i]!,
    primaer: String(rng.step(10_000, 150_000, 1_000)),
  }));
  const hilfs: LvStelle[] = [
    { name: k.energie, primaer: '0', einheit: 'kWh' },
    { name: k.instandhaltung, primaer: '0', einheit: 'Std.' },
  ];
  const L = [rng.step(5_000, 40_000, 1_000), rng.step(200, 1_000, 10)];
  const unit = [100, 10];
  const mengen = hilfs.map((_, i) => {
    const Li = L[i]!;
    const u = unit[i]!;
    const self = eigenverbrauch && rng.chance(0.6) ? rng.step(Li * 0.02, Li * 0.08, u) : 0;
    const anderer = rng.step(Li * 0.05, Li * 0.25, u);
    const rest = zerlege(rng, Li - self - anderer, haupt.length, u);
    const row = [0, 0, ...rest];
    row[i] = self;
    row[1 - i] = anderer;
    return row;
  });
  return { hilfs, haupt, mengen };
}

function generateStufenleiter(rng: Rng, krumm: boolean): LvParams {
  return retry(
    rng,
    (r) => {
      const p = grundgeruest(r, false);
      const erste = r.int(0, 1);
      const zweite = 1 - erste;
      if (krumm) {
        p.hilfs[erste]!.primaer = betrag(r, 10_000, 80_000, 1, true);
        p.hilfs[zweite]!.primaer = betrag(r, 8_000, 60_000, 1, true);
        return p;
      }
      const qListe = (i: number) => (i === 0 ? ENERGIE_SAETZE : STUNDEN_SAETZE);
      const qE = dec(r.pick(qListe(erste)));
      const qZ = dec(r.pick(qListe(zweite)));
      p.hilfs[erste]!.primaer = qE.times(gesamtLeistung(p, erste)).toFixed(2);
      const pz = qZ
        .times(gesamtLeistung(p, zweite) - m(p, zweite, erste))
        .minus(qE.times(m(p, erste, zweite)));
      p.hilfs[zweite]!.primaer = pz.toFixed(2);
      return p;
    },
    (p) => {
      const P = p.hilfs.map((h) => dec(h.primaer));
      if (P.some((x) => x.lte(3_000))) return false;
      const [w0, w1] = reihenfolgeWerte(p);
      if (w0.value.equals(w1.value)) return false;
      if (!krumm) {
        const s = solveStufenleiter(p);
        // Die erzeugte Reihenfolge muss zur Regel passen und alle Werte glatt sein.
        return [...s.saetze, s.empfangen].every((v) => v.exact.equals(v.value));
      }
      return true;
    },
  );
}

function renderLv(p: LvParams, verfahren: 'stufenleiter' | 'simultan'): TaskText {
  const k = FIRMA.kostenstellen;
  return {
    titel: verfahren === 'stufenleiter' ? 'Stufenleiterverfahren' : 'Simultanverfahren',
    kontext: 'BAB der MBG: Leistungsverrechnung Energie und Instandhaltung',
    sachverhalt: [
      `Im Werk Paderborn erbringen die Vorkostenstellen ${k.energie} (Strom, Dampf, Druckluft) und ${k.instandhaltung} (Werkstatt) Leistungen füreinander und für die Hauptkostenstellen.`,
      'Die primären Gemeinkosten und die Leistungsabgaben des Monats:',
    ],
    daten: datenTabelle(p),
    aufgabe:
      verfahren === 'stufenleiter'
        ? 'Bestimme die Reihenfolge der Vorkostenstellen, die Verrechnungssätze und verteile die Kosten nach dem Stufenleiterverfahren. Runde Verrechnungssätze auf 2 Nachkommastellen.'
        : 'Stelle das Gleichungssystem auf, ermittle die Verrechnungssätze (auf 2 Nachkommastellen gerundet) und verteile die Kosten der Vorkostenstellen auf die Hauptkostenstellen.',
  };
}

function stufenVariants(p: LvParams): ErrorVariant[] {
  return [
    {
      fehlertyp: 'reihenfolge-falsch',
      parts: stufenParts(p, solveStufenleiter(p, { reihenfolgeUmgekehrt: true })),
    },
    {
      fehlertyp: 'rueckfluss-nicht-abgezogen',
      parts: stufenParts(p, solveStufenleiter(p, { ohneRueckflussAbzug: true })),
    },
    {
      fehlertyp: 'primaerkosten-statt-gesamt',
      parts: stufenParts(p, solveStufenleiter(p, { nurPrimaer: true })),
    },
  ];
}

export const stufenleiter = defineGenerator<LvParams, StufenleiterSolution>({
  skillId: 'I4-stufenleiter',
  titel: 'Stufenleiterverfahren',
  variants: ['zwei-vorkostenstellen'],
  points: 15,
  generate: (rng, opts = {}) => generateStufenleiter(rng, isKrumm(rng, opts.krummAnteil)),
  render: (p) => renderLv(p, 'stufenleiter'),
  solve: (p) => solveStufenleiter(p),
  parts: stufenParts,
  steps: (p, s) => {
    const e = p.hilfs[s.erste]!;
    const z = p.hilfs[s.zweite]!;
    return [
      {
        titel: 'Reihenfolge',
        rechnung: `${p.hilfs[0]!.name} → ${p.hilfs[1]!.name}: ${eur(s.werte[0])}; ${p.hilfs[1]!.name} → ${p.hilfs[0]!.name}: ${eur(s.werte[1])}`,
        erlaeuterung: `Wert = primäre Kosten ÷ Gesamtleistung × an die andere Stelle abgegebene Menge. ${e.name} liefert wertmäßig mehr und wird zuerst abgerechnet.`,
      },
      {
        titel: `Verrechnungssatz ${e.name}`,
        rechnung: `${eur(e.primaer)} ÷ ${plain(gesamtLeistung(p, s.erste))} ${e.einheit} = ${formatNumber(s.saetze[s.erste as 0 | 1])} ${satzEinheit(e)}`,
      },
      {
        titel: `Verrechnungssatz ${z.name}`,
        rechnung: `(${eur(z.primaer)} + ${eur(s.empfangen)}) ÷ (${plain(gesamtLeistung(p, s.zweite))} − ${plain(m(p, s.zweite, s.erste))}) ${z.einheit} = ${formatNumber(s.saetze[s.zweite as 0 | 1])} ${satzEinheit(z)}`,
        erlaeuterung: `Die Leistung an ${e.name} wird abgezogen, weil nicht zurückverrechnet wird.`,
      },
      {
        titel: 'Kontrolle',
        rechnung: `Summe Hauptkostenstellen ${eur(sum(s.summen))} = primäre Gemeinkosten ${eur(s.primaerGesamt)}`,
      },
    ];
  },
  hints: (p, s) => [
    'Stufenleiter: erst Reihenfolge bestimmen (Wertvergleich der gegenseitigen Lieferungen), dann Satz der ersten Stelle, dann Satz der zweiten Stelle, dann verteilen.',
    `Wert ${p.hilfs[0]!.name} → ${p.hilfs[1]!.name} = ${eur(p.hilfs[0]!.primaer)} ÷ ${plain(gesamtLeistung(p, 0))} × ${plain(m(p, 0, 1))}. Analog für die Gegenrichtung.`,
    `Zuerst ${p.hilfs[s.erste]!.name} mit ${formatNumber(s.saetze[s.erste as 0 | 1])} ${satzEinheit(p.hilfs[s.erste]!)}; die zweite Stelle teilt durch ihre Leistung ohne die Lieferung an die erste.`,
  ],
  errorVariants: stufenVariants,
  verfahren: () => 'Stufenleiterverfahren: Reihenfolge per Wertvergleich, ohne Rückverrechnung',
});

// ---------- Simultan ----------

export interface SimultanSolution {
  /** Koeffizienten je Gleichung: primäre Kosten + Σ empfangen·q = Leistung·q */
  gleichungen: { primaer: string; empfangen: number[]; leistung: number }[];
  saetze: Val[];
  saetzeBruch: Fraction[];
  umlage: Val[][];
  summen: Val[];
  primaerGesamt: Val;
}

interface SimultanWeg {
  zeileSpalte?: boolean;
  ohneEigenEmpfang?: boolean;
  eigenDoppelt?: boolean;
}

/** Löst P_i + Σ_j m_ji·q_j = L_i·q_i exakt. */
export function simultanSaetze(p: LvParams, w: SimultanWeg = {}): Fraction[] {
  const n = p.hilfs.length;
  const A: Fraction[][] = [];
  const b: Fraction[] = [];
  for (let i = 0; i < n; i++) {
    const row: Fraction[] = [];
    for (let j = 0; j < n; j++) {
      let empf = w.zeileSpalte ? m(p, i, j) : m(p, j, i);
      if (i === j && w.ohneEigenEmpfang) empf = 0;
      let coef = new Fraction(-empf);
      if (i === j) {
        const L = gesamtLeistung(p, i) - (w.eigenDoppelt ? m(p, i, i) : 0);
        coef = coef.add(L);
      }
      row.push(coef);
    }
    A.push(row);
    b.push(new Fraction(p.hilfs[i]!.primaer));
  }
  return solveLinear(A, b);
}

export function solveSimultan(p: LvParams, w: SimultanWeg = {}): SimultanSolution {
  const saetzeBruch = simultanSaetze(p, w);
  const saetze = saetzeBruch.map((f) => new Val(fracToDec(f)).round());
  const h = p.hilfs.length;
  const umlage = saetze.map((q, i) => p.haupt.map((_, k) => q.times(m(p, i, h + k)).round()));
  const summen = p.haupt.map((s, k) =>
    umlage.reduce((acc, row) => acc.plus(row[k]!), new Val(s.primaer)),
  );
  const gleichungen = p.hilfs.map((hs, k) => ({
    primaer: hs.primaer,
    empfangen: p.hilfs.map((_, l) =>
      k === l && w.ohneEigenEmpfang ? 0 : w.zeileSpalte ? m(p, k, l) : m(p, l, k),
    ),
    leistung: gesamtLeistung(p, k) - (w.eigenDoppelt ? m(p, k, k) : 0),
  }));
  return {
    saetze,
    saetzeBruch,
    umlage,
    summen,
    primaerGesamt: sum(ALLE(p).map((s) => s.primaer)),
    gleichungen,
  };
}

function simultanParts(p: LvParams, s: SimultanSolution): TaskPart[] {
  const zeilen: TabellenZeile[] = [
    {
      label: 'Primäre Gemeinkosten',
      zellen: p.haupt.map((x) => ({ typ: 'fest', text: formatNumber(x.primaer) })),
    },
    ...p.hilfs.map((hs, i) => ({
      label: `Umlage ${hs.name}`,
      zellen: s.umlage[i]!.map((v, k) =>
        feld(`u${i}-${k}`, `Umlage ${hs.name} an ${p.haupt[k]!.name}`, v),
      ),
    })),
    {
      label: 'Summe',
      summe: true,
      zellen: s.summen.map((v, k) => feld(`summe-${k}`, `Summe ${p.haupt[k]!.name}`, v)),
    },
  ];
  const gleichung: TaskPart = {
    typ: 'gleichungssystem',
    id: 'gleichungen',
    titel: 'Gleichungen aufstellen',
    zeilen: p.hilfs.map((hs, i) => {
      const g = s.gleichungen[i]!;
      const terme: GleichungsTerm[] = [
        { typ: 'feld', feld: feld(`g-p-${i}`, `Primäre Kosten ${hs.name}`, g.primaer) },
      ];
      p.hilfs.forEach((von, j) => {
        terme.push({ typ: 'text', text: '+' });
        terme.push({
          typ: 'feld',
          feld: feld(
            `g-m-${j}-${i}`,
            `Menge von ${von.name} an ${hs.name}`,
            g.empfangen[j]!,
            'menge',
            von.einheit,
          ),
        });
        terme.push({ typ: 'text', text: `· q${j + 1}` });
      });
      terme.push({ typ: 'text', text: '=' });
      terme.push({
        typ: 'feld',
        feld: feld(`g-l-${i}`, `Gesamtleistung ${hs.name}`, g.leistung, 'menge', hs.einheit),
      });
      terme.push({ typ: 'text', text: `· q${i + 1}` });
      return { label: `Gleichung ${hs.name} (q${i + 1})`, terme };
    }),
  };
  return [
    gleichung,
    {
      typ: 'rechenkette',
      id: 'saetze',
      titel: 'Verrechnungssätze aus dem Gleichungssystem',
      felder: p.hilfs.map((hs, i) =>
        feld(`q-${i}`, `Verrechnungssatz ${hs.name}`, s.saetze[i]!, 'satz', satzEinheit(hs)),
      ),
    },
    {
      typ: 'tabelle',
      id: 'bab',
      titel: 'Verteilung auf die Hauptkostenstellen',
      spalten: p.haupt.map((x) => x.name),
      zeilen,
      hinweis: `Kontrolle: Summe der Hauptkostenstellen ≈ primäre Gemeinkosten insgesamt (${eur(s.primaerGesamt)}); kleine Abweichungen entstehen durch gerundete Sätze.`,
    },
  ];
}

export function gleichungText(p: LvParams, i: number): string {
  const hs = p.hilfs[i]!;
  const links = [formatNumber(hs.primaer)];
  p.hilfs.forEach((_, j) => {
    const menge = m(p, j, i);
    if (menge > 0) links.push(`${plain(menge)} q${j + 1}`);
  });
  return `${links.join(' + ')} = ${plain(gesamtLeistung(p, i))} q${i + 1}`;
}

export const simultan = defineGenerator<LvParams, SimultanSolution>({
  skillId: 'I5-simultan',
  titel: 'Simultanverfahren',
  variants: ['ohne-eigenverbrauch', 'eigenverbrauch'],
  points: 15,
  generate: (rng, opts = {}) => {
    const eigen =
      opts.variant === 'eigenverbrauch' || (opts.variant === undefined && rng.chance(0.3));
    return retry(
      rng,
      (r) => {
        const p = grundgeruest(r, eigen);
        p.hilfs[0]!.primaer = String(r.step(10_000, 80_000, 100));
        p.hilfs[1]!.primaer = String(r.step(8_000, 60_000, 100));
        return p;
      },
      (p) => p.mengen.every((row) => row.slice(p.hilfs.length).every((x) => x > 0)),
    );
  },
  render: (p) => renderLv(p, 'simultan'),
  solve: (p) => solveSimultan(p),
  parts: simultanParts,
  steps: (p, s) => [
    {
      titel: 'Gleichungssystem',
      rechnung: p.hilfs.map((_, i) => gleichungText(p, i)).join('   |   '),
      erlaeuterung:
        'Je Vorkostenstelle: primäre Kosten + empfangene Leistungen × Verrechnungssatz der liefernden Stelle = Gesamtleistung × eigener Verrechnungssatz.',
    },
    {
      titel: 'Lösung',
      rechnung: s.saetzeBruch
        .map(
          (f, i) =>
            `q${i + 1} = ${f.toFraction()} ≈ ${formatNumber(s.saetze[i]!)} ${satzEinheit(p.hilfs[i]!)}`,
        )
        .join('; '),
      erlaeuterung: 'Am einfachsten: eine Gleichung nach q auflösen und in die andere einsetzen.',
    },
    {
      titel: 'Verteilung',
      erlaeuterung: 'Umlage = Verrechnungssatz × an die Hauptkostenstelle abgegebene Menge.',
      rechnung: `Summe Hauptkostenstellen ${eur(sum(s.summen))} (primär gesamt ${eur(s.primaerGesamt)})`,
    },
  ],
  hints: (p) => [
    'Simultanverfahren: Für jede Vorkostenstelle eine Gleichung aufstellen und das System lösen.',
    `Erste Gleichung: ${gleichungText(p, 0)}.`,
    `Zweite Gleichung: ${gleichungText(p, 1)}. Löse die erste nach q1 auf und setze ein.`,
  ],
  errorVariants: (p) => {
    const out: ErrorVariant[] = [
      {
        fehlertyp: 'zeile-spalte-vertauscht',
        parts: simultanParts(p, solveSimultan(p, { zeileSpalte: true })),
      },
    ];
    if (p.hilfs.some((_, i) => m(p, i, i) > 0)) {
      out.push(
        {
          fehlertyp: 'eigenverbrauch-falsch',
          parts: simultanParts(p, solveSimultan(p, { ohneEigenEmpfang: true })),
        },
        {
          fehlertyp: 'gesamtleistung-ohne-eigenverbrauch',
          parts: simultanParts(p, solveSimultan(p, { eigenDoppelt: true })),
        },
      );
    }
    return out;
  },
  verfahren: () => 'Simultanverfahren: Gleichungssystem mit gegenseitiger Verrechnung',
});
