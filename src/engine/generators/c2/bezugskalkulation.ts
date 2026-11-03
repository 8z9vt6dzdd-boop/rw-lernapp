// C7 – Bezugskalkulation: vom Listeneinkaufspreis zum Bezugspreis (Spezifikation docs/m7/c2.md).
// Schema: Listeneinkaufspreis − Liefererrabatt = Zieleinkaufspreis − Liefererskonto
//         = Bareinkaufspreis + Bezugskosten = Bezugspreis (Einstandspreis); danach je Einheit.
import { FIRMA } from '../../../config';
import type { FirmaConfig } from '../../firma';
import { Val, dec } from '../../money';
import type { Rng } from '../../rng';
import type {
  ErrorVariant,
  GenOptions,
  SolutionStep,
  TaskPart,
  TaskText,
  TabellenZeile,
  WahlOption,
  ZahlFeld,
} from '../../task';
import { defineGenerator, eur, feld, isExact, isKrumm, pct, plain, retry } from '../base';

export type BezugVariante = 'bezugspreis' | 'angebotsvergleich';
export type FrachtArt = 'pauschal' | 'je100' | 'frei';

export interface Angebot {
  lieferant: string;
  /** Listenpreis je Einheit, netto */
  preis: string;
  rabatt: string;
  skonto: string;
  frachtArt: FrachtArt;
  /** pauschal: Betrag in €; je100: € je 100 Einheiten; frei: „0“ */
  fracht: string;
  /** Transportversicherung pauschal (optional, „0“ = keine) */
  versicherung: string;
}

export interface BezugParams {
  variante: BezugVariante;
  gegenstand: string;
  /** Einheit im Plural/Singular für Texte, z. B. „kg“, „Liter“, „Flaschen“/„Flasche“ */
  einheit: string;
  einheitEinzeln: string;
  /** Listenpreis und Bezugspreis je `preisBasis` Einheiten (1 oder 100, z. B. „je 100 kg“) */
  preisBasis: number;
  menge: number;
  a: Angebot;
  b?: Angebot;
}

export interface Kalkulation {
  lep: Val;
  rabatt: Val;
  zep: Val;
  skonto: Val;
  bep: Val;
  bezugskosten: Val;
  bp: Val;
  bpEinheit: Val;
}

export interface BezugSolution {
  a: Kalkulation;
  b?: Kalkulation;
  /** Angebotsvergleich: günstigeres Angebot und Vorteil insgesamt */
  guenstiger?: 'a' | 'b';
  vorteil?: Val;
}

interface Weg {
  skontoVomListenpreis?: boolean;
  bezugskostenSkontiert?: boolean;
  ohneBezugskosten?: boolean;
  frachtBasisFalsch?: boolean;
}

function frachtBetrag(a: Angebot, menge: number, w: Weg): Val {
  if (a.frachtArt === 'frei') return new Val(0);
  if (a.frachtArt === 'pauschal') return new Val(a.fracht);
  return new Val(a.fracht).times(w.frachtBasisFalsch ? menge : dec(menge).div(100)).fix();
}

export function kalkuliere(a: Angebot, menge: number, w: Weg = {}, basis = 1): Kalkulation {
  const lep = new Val(a.preis).times(dec(menge).div(basis)).fix();
  const rabatt = lep.times(dec(a.rabatt)).fix();
  const zep = lep.minus(rabatt);
  const bezugskostenEcht = frachtBetrag(a, menge, w).plus(a.versicherung);
  const skontoBasis = w.skontoVomListenpreis
    ? lep
    : w.bezugskostenSkontiert
      ? zep.plus(bezugskostenEcht)
      : zep;
  const skonto = skontoBasis.times(dec(a.skonto)).fix();
  const bep = zep.minus(skonto);
  const bezugskosten = w.ohneBezugskosten ? new Val(0) : bezugskostenEcht;
  const bp = bep.plus(bezugskosten);
  const bpEinheit = bp.div(dec(menge).div(basis)).round();
  return { lep, rabatt, zep, skonto, bep, bezugskosten, bp, bpEinheit };
}

export function solveBezug(p: BezugParams, w: Weg = {}): BezugSolution {
  const a = kalkuliere(p.a, p.menge, w, p.preisBasis);
  if (p.variante !== 'angebotsvergleich' || !p.b) return { a };
  const b = kalkuliere(p.b, p.menge, w, p.preisBasis);
  const guenstiger = a.bp.cmp(b.bp) <= 0 ? 'a' : 'b';
  return { a, b, guenstiger, vorteil: a.bp.minus(b.bp).abs() };
}

function bezugskostenText(a: Angebot, p: BezugParams): string {
  const teile: string[] = [];
  if (a.frachtArt === 'pauschal') teile.push(`Fracht ${eur(a.fracht)}`);
  if (a.frachtArt === 'je100') teile.push(`Fracht ${eur(a.fracht)} je 100 ${p.einheit}`);
  if (!dec(a.versicherung).isZero()) teile.push(`Transportversicherung ${eur(a.versicherung)}`);
  return teile.length === 0 ? 'Lieferung frei Haus' : teile.join(', ');
}

const ZEILEN: { id: keyof Kalkulation; label: (a: Angebot, p: BezugParams) => string }[] = [
  { id: 'lep', label: () => 'Listeneinkaufspreis' },
  { id: 'rabatt', label: (a) => `− Liefererrabatt (${pct(a.rabatt)})` },
  { id: 'zep', label: () => '= Zieleinkaufspreis' },
  { id: 'skonto', label: (a) => `− Liefererskonto (${pct(a.skonto)})` },
  { id: 'bep', label: () => '= Bareinkaufspreis' },
  { id: 'bezugskosten', label: () => '+ Bezugskosten' },
  { id: 'bp', label: () => '= Bezugspreis (Einstandspreis)' },
  { id: 'bpEinheit', label: (_a, p) => `Bezugspreis je ${p.einheitEinzeln}` },
];

const FELD_ID: Record<keyof Kalkulation, string> = {
  lep: 'lep',
  rabatt: 'rabatt',
  zep: 'zep',
  skonto: 'skonto',
  bep: 'bep',
  bezugskosten: 'bezugskosten',
  bp: 'bp',
  bpEinheit: 'bp-einheit',
};

function kurzname(lieferant: string): string {
  return lieferant.replace(/\s*\(.*\)$/, '');
}

export function bezugParts(p: BezugParams, s: BezugSolution): TaskPart[] {
  if (p.variante !== 'angebotsvergleich' || !p.b || !s.b) {
    const felder: ZahlFeld[] = ZEILEN.map((z) =>
      feld(FELD_ID[z.id], z.label(p.a, p).replace(/^[−=+] /, ''), s.a[z.id]),
    );
    return [{ typ: 'rechenkette', id: 'schema', titel: 'Bezugskalkulation', felder }];
  }
  const b = p.b;
  const sb = s.b;
  const zeilen: TabellenZeile[] = ZEILEN.map((z) => ({
    label: z.label(p.a, p).replace(/ \(.*\)$/, ''),
    zellen: [
      feld(`a-${FELD_ID[z.id]}`, `Angebot A: ${z.label(p.a, p)}`, s.a[z.id]),
      feld(`b-${FELD_ID[z.id]}`, `Angebot B: ${z.label(b, p)}`, sb[z.id]),
    ],
    summe: z.id === 'bp',
  }));
  const listenFalle = dec(p.a.preis).cmp(b.preis) !== 0;
  const billigerListe = dec(p.a.preis).lt(b.preis) ? 'a' : 'b';
  const optionen: WahlOption[] = (['a', 'b'] as const).map((x) => {
    const name = kurzname((x === 'a' ? p.a : b).lieferant);
    const o: WahlOption = {
      id: x,
      text: `Angebot ${x.toUpperCase()} (${name})`,
      richtig: x === s.guenstiger,
    };
    if (x !== s.guenstiger) {
      o.erklaerung = `Entscheidend ist der Bezugspreis, nicht der Listenpreis: Angebot ${s.guenstiger!.toUpperCase()} ist insgesamt ${eur(s.vorteil!)} günstiger.`;
      if (listenFalle && x === billigerListe) o.fehlertyp = 'bezugskalk-listenpreis-verglichen';
    }
    return o;
  });
  return [
    {
      typ: 'tabelle',
      id: 'schema',
      titel: 'Bezugskalkulation im Vergleich',
      spalten: ['Angebot A', 'Angebot B'],
      zeilen,
    },
    {
      typ: 'mc',
      id: 'entscheidung',
      frage: 'Welches Angebot soll die MBG annehmen?',
      optionen,
      begruendung: `Verglichen werden die Bezugspreise: ${eur(s.a.bp)} gegenüber ${eur(sb.bp)}.`,
    },
  ];
}

interface Ware {
  gegenstand: string;
  einheit: string;
  einzeln: string;
  basis: number;
  menge: [number, number, number];
  preis: [number, number, number];
  frachtJe100: [number, number, number];
  frachtPauschal: [number, number, number];
  lieferanten: (f: FirmaConfig) => string[];
}

const WAREN: Ware[] = [
  {
    gegenstand: 'Zucker',
    einheit: 'kg',
    einzeln: '100 kg',
    basis: 100,
    menge: [5_000, 30_000, 1_000],
    preis: [60, 120, 0.5],
    frachtJe100: [1.5, 4, 0.1],
    frachtPauschal: [150, 600, 10],
    lieferanten: (f) => [f.lieferanten.rohstoffe[1]!],
  },
  {
    gegenstand: 'Zitronenaroma',
    einheit: 'kg',
    einzeln: 'kg',
    basis: 1,
    menge: [100, 1_000, 50],
    preis: [12, 40, 0.5],
    frachtJe100: [4, 12, 0.5],
    frachtPauschal: [80, 300, 10],
    lieferanten: (f) => [f.lieferanten.rohstoffe[0]!, f.lieferanten.rohstoffe[2]!],
  },
  {
    gegenstand: 'Aromakonzentrat',
    einheit: 'Liter',
    einzeln: 'Liter',
    basis: 1,
    menge: [1_000, 8_000, 500],
    preis: [3, 9, 0.1],
    frachtJe100: [2, 6, 0.1],
    frachtPauschal: [120, 480, 10],
    lieferanten: (f) => [f.lieferanten.rohstoffe[2]!, f.lieferanten.rohstoffe[0]!],
  },
  {
    gegenstand: 'Etikettenrollen',
    einheit: 'Rollen',
    einzeln: 'Rolle',
    basis: 1,
    menge: [100, 600, 50],
    preis: [20, 60, 0.5],
    frachtJe100: [30, 90, 5],
    frachtPauschal: [60, 240, 10],
    lieferanten: (f) => [f.lieferanten.hilfsstoffe[1]!],
  },
  {
    gegenstand: 'Weißwein „Liboriwein“ (Handelsware)',
    einheit: 'Flaschen',
    einzeln: 'Flasche',
    basis: 1,
    menge: [600, 3_000, 60],
    preis: [3, 8, 0.05],
    frachtJe100: [8, 20, 1],
    frachtPauschal: [90, 360, 10],
    lieferanten: (f) => [f.lieferanten.handelswaren[0]!, f.lieferanten.handelswaren[1]!],
  },
];

const RABATTE = ['0.05', '0.1', '0.1', '0.125', '0.15', '0.2', '0.25'];
const SKONTI = ['0.01', '0.015', '0.02', '0.02', '0.03'];

function wareFuer(p: BezugParams): Ware {
  return WAREN.find((w) => w.gegenstand === p.gegenstand) ?? WAREN[0]!;
}

function angebot(r: Rng, ware: Ware, lieferant: string, krumm: boolean): Angebot {
  const [pmin, pmax, pstep] = ware.preis;
  const frachtArt = r.pick<FrachtArt>(['pauschal', 'pauschal', 'je100', 'je100', 'frei']);
  const fr = frachtArt === 'je100' ? ware.frachtJe100 : ware.frachtPauschal;
  return {
    lieferant,
    preis: krumm
      ? (r.int(pmin * 100, pmax * 100) / 100).toFixed(2)
      : dec(r.int(Math.round(pmin / pstep), Math.round(pmax / pstep)))
          .times(pstep)
          .toFixed(2),
    rabatt: krumm ? r.pick([...RABATTE, '0.075', '0.12']) : r.pick(RABATTE),
    skonto: r.pick(SKONTI),
    frachtArt,
    fracht:
      frachtArt === 'frei'
        ? '0'
        : krumm && frachtArt === 'pauschal'
          ? (r.int(fr[0] * 100, fr[1] * 100) / 100).toFixed(2)
          : dec(r.int(Math.round(fr[0] / fr[2]), Math.round(fr[1] / fr[2])))
              .times(fr[2])
              .toFixed(2),
    versicherung: r.chance(0.3) ? String(r.step(20, 120, 5)) : '0',
  };
}

function glatt(a: Angebot, menge: number, basis: number): boolean {
  const lep = dec(a.preis).times(menge).div(basis);
  const rabatt = lep.times(a.rabatt);
  const zep = lep.minus(rabatt);
  const fr = a.frachtArt === 'je100' ? dec(a.fracht).times(menge).div(100) : dec(0);
  return isExact(lep) && isExact(rabatt) && isExact(zep.times(a.skonto)) && isExact(fr);
}

function generate(rng: Rng, opts: GenOptions = {}): BezugParams {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const variante =
    (opts.variant as BezugVariante | undefined) ??
    rng.pick<BezugVariante>(['bezugspreis', 'bezugspreis', 'angebotsvergleich']);
  // Partner nur aus config.ts: Im Vergleich nur Waren mit zwei passenden Lieferanten.
  const ware = rng.pick(
    variante === 'angebotsvergleich'
      ? WAREN.filter((w) => w.lieferanten(FIRMA).length >= 2)
      : WAREN,
  );
  const [l1, l2] = ware.lieferanten(FIRMA);
  // Im Vergleich soll oft das Angebot mit dem niedrigeren Listenpreis verlieren (typische Falle).
  const falle = rng.chance(0.6);
  const make = (r: Rng): BezugParams => {
    const menge = r.step(ware.menge[0], ware.menge[1], ware.menge[2]);
    const p: BezugParams = {
      variante,
      gegenstand: ware.gegenstand,
      einheit: ware.einheit,
      einheitEinzeln: ware.einzeln,
      preisBasis: ware.basis,
      menge,
      a: angebot(r, ware, l1!, krumm),
    };
    if (variante === 'angebotsvergleich') p.b = angebot(r, ware, l2 ?? l1!, krumm);
    return p;
  };
  return retry(rng, make, (p) => {
    if (!krumm && !glatt(p.a, p.menge, p.preisBasis)) return false;
    if (variante !== 'angebotsvergleich') return true;
    const b = p.b!;
    if (!krumm && !glatt(b, p.menge, p.preisBasis)) return false;
    const s = solveBezug(p);
    // Deutlicher Unterschied (mindestens 1 % des Bezugspreises) und unterschiedliche Listenpreise.
    if (s.vorteil!.exact.lt(s.a.bp.exact.times('0.01'))) return false;
    if (dec(p.a.preis).equals(b.preis)) return false;
    const billigerListe = dec(p.a.preis).lt(b.preis) ? 'a' : 'b';
    return falle ? billigerListe !== s.guenstiger : billigerListe === s.guenstiger;
  });
}

function render(p: BezugParams): TaskText {
  const angebotsText = (a: Angebot) =>
    `${plain(p.menge)} ${p.einheit} zu ${eur(a.preis)} je ${p.einheitEinzeln} (Listenpreis, netto), ${pct(a.rabatt)} Rabatt, bei Zahlung innerhalb von 10 Tagen ${pct(a.skonto)} Skonto; ${bezugskostenText(a, p)}`;
  if (p.variante === 'angebotsvergleich' && p.b) {
    const b = p.b;
    const zeile = (titel: string, f: (a: Angebot) => string) => [titel, f(p.a), f(b)];
    return {
      titel: 'Bezugskalkulation: Angebotsvergleich',
      kontext: 'Februar: Rohstoffeinkauf für die Sommersaison',
      sachverhalt: [
        `Für die Sommersaison braucht die MBG ${plain(p.menge)} ${p.einheit} ${p.gegenstand}. Zwei Lieferanten haben Angebote geschickt (alle Beträge netto).`,
        'Fracht- und Versicherungskosten werden gesondert berechnet und nicht skontiert.',
      ],
      daten: {
        spalten: ['', `A: ${kurzname(p.a.lieferant)}`, `B: ${kurzname(b.lieferant)}`],
        zeilen: [
          zeile(`Listenpreis je ${p.einheitEinzeln}`, (a) => eur(a.preis)),
          zeile('Liefererrabatt', (a) => pct(a.rabatt)),
          zeile('Liefererskonto', (a) => pct(a.skonto)),
          zeile('Bezugskosten', (a) => bezugskostenText(a, p)),
        ],
      },
      aufgabe: `Ermittle für beide Angebote den Bezugspreis insgesamt und je ${p.einheitEinzeln} und entscheide, welches Angebot günstiger ist. Runde jeden Zwischenwert auf Cent.`,
    };
  }
  return {
    titel: 'Bezugskalkulation',
    kontext: 'Februar: Rohstoffeinkauf für die Sommersaison',
    sachverhalt: [
      `${p.a.lieferant} bietet der MBG ${p.gegenstand} an: ${angebotsText(p.a)}.`,
      bezugskostenText(p.a, p) === 'Lieferung frei Haus'
        ? 'Weitere Bezugskosten fallen nicht an.'
        : 'Die Bezugskosten stellt eine Spedition gesondert in Rechnung; sie werden nicht skontiert.',
    ],
    aufgabe: `Ermittle den Bezugspreis (Einstandspreis) der Lieferung und je ${p.einheitEinzeln}. Runde jeden Zwischenwert auf Cent.`,
  };
}

function stepsFuer(a: Angebot, k: Kalkulation, p: BezugParams, titel = ''): SolutionStep[] {
  const t = (x: string) => (titel ? `${titel}: ${x}` : x);
  const fr =
    a.frachtArt === 'je100'
      ? `${eur(a.fracht)} × ${plain(p.menge)} ÷ 100`
      : a.frachtArt === 'pauschal'
        ? eur(a.fracht)
        : '0,00 €';
  return [
    {
      titel: t('Listeneinkaufspreis'),
      rechnung:
        p.preisBasis === 1
          ? `${plain(p.menge)} × ${eur(a.preis)} = ${eur(k.lep)}`
          : `${plain(p.menge)} ${p.einheit} ÷ ${plain(p.preisBasis)} × ${eur(a.preis)} = ${eur(k.lep)}`,
    },
    {
      titel: t('Liefererrabatt'),
      rechnung: `${eur(k.lep)} × ${pct(a.rabatt)} = ${eur(k.rabatt)}`,
      erlaeuterung: 'Der Rabatt wird vom Listeneinkaufspreis abgezogen.',
    },
    { titel: t('Zieleinkaufspreis'), rechnung: `${eur(k.lep)} − ${eur(k.rabatt)} = ${eur(k.zep)}` },
    {
      titel: t('Liefererskonto'),
      rechnung: `${eur(k.zep)} × ${pct(a.skonto)} = ${eur(k.skonto)}`,
      erlaeuterung: 'Skonto wird vom Zieleinkaufspreis gerechnet – also erst nach dem Rabatt.',
    },
    { titel: t('Bareinkaufspreis'), rechnung: `${eur(k.zep)} − ${eur(k.skonto)} = ${eur(k.bep)}` },
    {
      titel: t('Bezugskosten'),
      rechnung: dec(a.versicherung).isZero()
        ? `${fr} = ${eur(k.bezugskosten)}`
        : `${fr} + ${eur(a.versicherung)} = ${eur(k.bezugskosten)}`,
      erlaeuterung: 'Fracht und Versicherung kommen hinzu; sie sind Anschaffungsnebenkosten.',
    },
    { titel: t('Bezugspreis'), rechnung: `${eur(k.bep)} + ${eur(k.bezugskosten)} = ${eur(k.bp)}` },
    {
      titel: t(`Bezugspreis je ${p.einheitEinzeln}`),
      rechnung:
        p.preisBasis === 1
          ? `${eur(k.bp)} ÷ ${plain(p.menge)} = ${eur(k.bpEinheit)}`
          : `${eur(k.bp)} ÷ ${plain(dec(p.menge).div(p.preisBasis))} = ${eur(k.bpEinheit)}`,
    },
  ];
}

function steps(p: BezugParams, s: BezugSolution): SolutionStep[] {
  if (!p.b || !s.b) return stepsFuer(p.a, s.a, p);
  return [
    ...stepsFuer(p.a, s.a, p, 'A'),
    ...stepsFuer(p.b, s.b, p, 'B'),
    {
      titel: 'Entscheidung',
      rechnung: `|${eur(s.a.bp)} − ${eur(s.b.bp)}| = ${eur(s.vorteil!)}`,
      erlaeuterung: `Angebot ${s.guenstiger!.toUpperCase()} hat den niedrigeren Bezugspreis.`,
    },
  ];
}

function errorVariants(p: BezugParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Weg) => {
    const s = solveBezug(p, w);
    const parts = bezugParts(p, s);
    // Die Entscheidung bewertet sich selbst (Option mit Fehlertyp); hier nur die Rechnung.
    out.push({ fehlertyp, parts: parts.filter((x) => x.id === 'schema') });
  };
  const angebote = p.b ? [p.a, p.b] : [p.a];
  add('bezugskalk-skonto-vom-listenpreis', { skontoVomListenpreis: true });
  const mitBzk = angebote.some((a) => a.frachtArt !== 'frei' || !dec(a.versicherung).isZero());
  if (mitBzk) {
    add('bezugskalk-bezugskosten-skontiert', { bezugskostenSkontiert: true });
    add('bezugskalk-bezugskosten-vergessen', { ohneBezugskosten: true });
  }
  if (angebote.some((a) => a.frachtArt === 'je100'))
    add('bezugskalk-fracht-basis', { frachtBasisFalsch: true });
  return out;
}

export const bezugskalkulation = defineGenerator<BezugParams, BezugSolution>({
  skillId: 'C7-bezugskalkulation',
  titel: 'Bezugskalkulation',
  variants: ['bezugspreis', 'angebotsvergleich'],
  points: 6,
  generate,
  render: (p) => render(p),
  solve: (p) => solveBezug(p),
  parts: bezugParts,
  steps,
  hints: (p) => {
    const w = wareFuer(p);
    return [
      'Schema: Listeneinkaufspreis − Rabatt = Zieleinkaufspreis − Skonto = Bareinkaufspreis + Bezugskosten = Bezugspreis.',
      'Skonto wird vom Zieleinkaufspreis gerechnet, nicht vom Listenpreis. Bezugskosten einer Spedition werden nicht skontiert.',
      p.variante === 'angebotsvergleich'
        ? `Vergleiche am Ende die Bezugspreise, nicht die Listenpreise. Je ${w.einzeln}: Bezugspreis ÷ ${p.preisBasis === 1 ? 'Menge' : `(Menge ÷ ${p.preisBasis})`}.`
        : `Fracht „je 100 ${p.einheit}“: Satz × Menge ÷ 100. Bezugspreis je ${w.einzeln} = Bezugspreis ÷ ${p.preisBasis === 1 ? 'Menge' : `(Menge ÷ ${p.preisBasis})`}.`,
    ];
  },
  errorVariants,
  verfahren: (p) =>
    p.variante === 'angebotsvergleich'
      ? 'Bezugskalkulation: Angebote über den Bezugspreis vergleichen'
      : 'Bezugskalkulation: vom Listeneinkaufspreis zum Bezugspreis',
});
