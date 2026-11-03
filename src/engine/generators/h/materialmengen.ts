// H1 – Erfassung der Materialverbrauchsmengen (K1 Kap. 2.2.1): Inventurmethode (Befundrechnung),
// Skontrationsmethode (Materialentnahmescheine, rechnerischer Endbestand, Inventurdifferenz),
// retrograde Methode (Rückrechnung über Stücklisten) und der Vergleich aller drei (Lagerschwund, Mehrverbrauch).
import { Val, dec } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, SolutionStep, TaskPart, ZahlFeld } from '../../task';
import { defineGenerator, eur, feld, isKrumm, plain } from '../base';

export type MengenVariante = 'inventur' | 'skontration' | 'retrograd' | 'vergleich';

export interface Erzeugnis {
  name: string;
  /** hergestellte Menge (Flaschen bzw. Chargen) */
  menge: number;
  /** Materialbedarf je Einheit laut Stückliste/Rezeptur */
  bedarf: number;
}

export interface MengenParams {
  variante: MengenVariante;
  material: string;
  einheit: string;
  /** Einheit der Erzeugnisse, z. B. „Flaschen“ oder „Chargen“ */
  erzeugnisEinheit: string;
  /** Einstandspreis frei Lager je Einheit (Dezimal-String) */
  preis: string;
  ab: number;
  zugaenge: number[];
  /** Endbestand laut Inventur */
  eb: number;
  /** Mengen laut Materialentnahmescheinen */
  entnahmen: number[];
  erzeugnisse: Erzeugnis[];
}

export interface MengenSolution {
  zugang: number;
  inventur: number;
  skontration: number;
  sollEbSkontration: number;
  /** Inventurdifferenz = rechnerischer Endbestand − Inventurbestand (Lagerschwund) */
  schwund: number;
  retrograd: number;
  sollEbRetrograd: number;
  /** Mehrverbrauch in der Fertigung (Ausschuss) = Entnahmen − Sollverbrauch */
  mehrverbrauch: number;
  /** Materialkosten der jeweiligen Variante */
  kosten?: Val;
}

interface Rechenweg {
  ohneZugang?: boolean;
  festwert?: boolean;
  vorzeichen?: boolean;
  ohneStueckliste?: boolean;
  gesamtAlsSchwund?: boolean;
}

export function solveMengen(p: MengenParams, w: Rechenweg = {}): MengenSolution {
  const zugang = p.zugaenge.reduce((a, b) => a + b, 0);
  const inventur = w.festwert ? zugang : p.ab + (w.ohneZugang ? 0 : zugang) - p.eb;
  const skontration = p.entnahmen.reduce((a, b) => a + b, 0);
  const sollEbSkontration = p.ab + zugang - skontration;
  const schwundRichtig = sollEbSkontration - p.eb;
  const retrograd = w.ohneStueckliste
    ? p.erzeugnisse.reduce((a, e) => a + e.menge, 0)
    : p.erzeugnisse.reduce((a, e) => a + e.menge * e.bedarf, 0);
  const sollEbRetrograd = p.ab + zugang - retrograd;
  const inventurRichtig = p.ab + zugang - p.eb;
  let schwund = w.vorzeichen ? -schwundRichtig : schwundRichtig;
  if (w.gesamtAlsSchwund) schwund = inventurRichtig - retrograd;
  const mehrverbrauch = skontration - retrograd;
  const menge =
    p.variante === 'inventur' ? inventur : p.variante === 'skontration' ? skontration : retrograd;
  const s: MengenSolution = {
    zugang,
    inventur,
    skontration,
    sollEbSkontration,
    schwund,
    retrograd,
    sollEbRetrograd,
    mehrverbrauch,
  };
  if (p.variante !== 'vergleich') s.kosten = new Val(p.preis).times(menge);
  return s;
}

function parts(p: MengenParams, s: MengenSolution): TaskPart[] {
  const m = (id: string, label: string, v: number) => feld(id, label, v, 'menge', p.einheit);
  const felder: ZahlFeld[] = [];
  switch (p.variante) {
    case 'inventur':
      felder.push(
        m('zugang', 'Zugänge laut Lieferscheinen', s.zugang),
        m('verbrauch', 'Verbrauchsmenge (Inventurmethode)', s.inventur),
      );
      break;
    case 'skontration':
      felder.push(
        m('verbrauch', 'Verbrauchsmenge (Skontrationsmethode)', s.skontration),
        m('solleb', 'Rechnerischer Endbestand (Soll-Endbestand)', s.sollEbSkontration),
        m('schwund', 'Inventurdifferenz (Lagerschwund)', s.schwund),
      );
      break;
    case 'retrograd':
      felder.push(
        m('verbrauch', 'Sollverbrauch (retrograde Methode)', s.retrograd),
        m('solleb', 'Rechnerischer Endbestand (Soll-Endbestand)', s.sollEbRetrograd),
      );
      break;
    case 'vergleich':
      felder.push(
        m('inventur', 'Verbrauch nach der Inventurmethode', s.inventur),
        m('skontration', 'Verbrauch nach der Skontrationsmethode', s.skontration),
        m('retrograd', 'Verbrauch nach der retrograden Methode', s.retrograd),
        m('schwund', 'Lagerschwund (Skontration gegen Inventur)', s.schwund),
        m(
          'mehrverbrauch',
          'Mehrverbrauch in der Fertigung (Entnahmen gegen Stückliste)',
          s.mehrverbrauch,
        ),
      );
      break;
  }
  if (s.kosten)
    felder.push(feld('kosten', 'Materialkosten (Verbrauchsmenge × Einstandspreis)', s.kosten));
  return [{ typ: 'rechenkette', id: 'mengen', titel: 'Materialverbrauchsmengen', felder }];
}

function variants(p: MengenParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Rechenweg) =>
    out.push({ fehlertyp, parts: parts(p, solveMengen(p, w)) });
  if (p.variante === 'inventur') {
    add('mengen-zugang-vergessen', { ohneZugang: true });
    add('festwert-statt-inventur', { festwert: true });
  }
  if (p.variante === 'skontration') add('inventurdifferenz-vorzeichen', { vorzeichen: true });
  if (p.variante === 'retrograd' || p.variante === 'vergleich')
    add('stueckliste-nicht-angewendet', { ohneStueckliste: true });
  if (p.variante === 'vergleich') add('gesamtdifferenz-als-schwund', { gesamtAlsSchwund: true });
  return out;
}

interface Vorlage {
  material: string;
  einheit: string;
  erzeugnisEinheit: string;
  erzeugnisse: { name: string; bedarf: number; menge: [number, number]; step: number }[];
  /** Rundungsschritt der Mengen */
  step: number;
  preise: string[];
}

const VORLAGEN: Vorlage[] = [
  {
    material: 'Etiketten',
    einheit: 'Stk.',
    erzeugnisEinheit: 'Flaschen',
    erzeugnisse: [
      { name: 'Senne Lemon', bedarf: 2, menge: [20_000, 80_000], step: 1_000 },
      { name: 'Almeblick Tequila-Bier', bedarf: 3, menge: [10_000, 40_000], step: 1_000 },
    ],
    step: 500,
    preise: ['0.02', '0.025', '0.03', '0.04'],
  },
  {
    material: 'Zucker',
    einheit: 'kg',
    erzeugnisEinheit: 'Chargen',
    erzeugnisse: [
      { name: 'Senne Lemon', bedarf: 250, menge: [40, 120], step: 2 },
      { name: 'Paderquell Energy', bedarf: 400, menge: [30, 90], step: 2 },
    ],
    step: 100,
    preise: ['0.8', '0.85', '0.9', '0.95'],
  },
  {
    material: 'Aromakonzentrat',
    einheit: 'l',
    erzeugnisEinheit: 'Chargen',
    erzeugnisse: [
      { name: 'Senne Lemon', bedarf: 120, menge: [30, 90], step: 1 },
      { name: 'Paderquell Energy', bedarf: 60, menge: [20, 80], step: 1 },
    ],
    step: 20,
    preise: ['2.4', '2.6', '3.1', '3.5'],
  },
];

function aufteilen(rng: Rng, summe: number, teile: number, step: number): number[] {
  // Summe in `teile` positive Vielfache von `step` zerlegen
  const einheiten = summe / step;
  const schnitte = new Set<number>();
  while (schnitte.size < teile - 1) schnitte.add(rng.int(1, einheiten - 1));
  const s = [0, ...[...schnitte].sort((a, b) => a - b), einheiten];
  return s.slice(1).map((x, i) => (x - s[i]!) * step);
}

export const materialmengen = defineGenerator<MengenParams, MengenSolution>({
  skillId: 'H1-materialmengen',
  titel: 'Materialverbrauchsmengen',
  variants: ['inventur', 'skontration', 'retrograd', 'vergleich'],
  points: 4,
  generate: (rng, opts = {}) => {
    const variante =
      (opts.variant as MengenVariante | undefined) ??
      rng.pick<MengenVariante>([
        'inventur',
        'skontration',
        'skontration',
        'retrograd',
        'vergleich',
        'vergleich',
      ]);
    const krumm = isKrumm(rng, opts.krummAnteil);
    const t = rng.pick(VORLAGEN);
    const step = krumm ? Math.max(1, t.step / 10) : t.step;
    const erzeugnisse = t.erzeugnisse.map((e) => ({
      name: e.name,
      bedarf: e.bedarf,
      menge: rng.step(e.menge[0], e.menge[1], e.step),
    }));
    const retro = erzeugnisse.reduce((a, e) => a + e.menge * e.bedarf, 0);
    // Mehrverbrauch (Ausschuss) 1–5 %, Lagerschwund 1–4 % des Sollverbrauchs
    const runde = (x: number) => Math.max(step, Math.round(x / step) * step);
    const mehrverbrauch = runde((retro * rng.int(1, 5)) / 100);
    const schwund = runde((retro * rng.int(1, 4)) / 100);
    const skontration = retro + mehrverbrauch;
    const ab = runde((skontration * rng.int(25, 60)) / 100);
    const zugangGesamt = runde((skontration * rng.int(80, 120)) / 100);
    const sollEb = ab + zugangGesamt - skontration;
    let zug = zugangGesamt;
    if (sollEb - schwund < step) zug += skontration; // Endbestand muss positiv bleiben
    const zugaenge = aufteilen(rng, zug, rng.int(2, 3), step);
    const entnahmen = aufteilen(rng, skontration, rng.int(3, 4), step).filter((x) => x > 0);
    const eb = ab + zug - skontration - schwund;
    // Retrograde Mengen sind Vielfache des Bedarfs; Teilung in step-Vielfache nur, wenn möglich
    const ent = skontration % step === 0 ? entnahmen : [skontration];
    return {
      variante,
      material: t.material,
      einheit: t.einheit,
      erzeugnisEinheit: t.erzeugnisEinheit,
      preis: rng.pick(t.preise),
      ab,
      zugaenge: zug % step === 0 ? zugaenge : [zug],
      eb,
      entnahmen: ent,
      erzeugnisse,
    };
  },
  render: (p) => {
    const e = p.einheit;
    const zeilen: string[][] = [
      ['Anfangsbestand laut Inventur', `${plain(p.ab)} ${e}`],
      ...p.zugaenge.map((z, i) => [`Zugang laut Lieferschein ${i + 1}`, `${plain(z)} ${e}`]),
    ];
    if (p.variante !== 'retrograd')
      zeilen.push(['Endbestand laut Inventur', `${plain(p.eb)} ${e}`]);
    if (p.variante === 'skontration' || p.variante === 'vergleich')
      p.entnahmen.forEach((x, i) =>
        zeilen.push([`Materialentnahmeschein ${i + 1}`, `${plain(x)} ${e}`]),
      );
    if (p.variante === 'retrograd' || p.variante === 'vergleich')
      p.erzeugnisse.forEach((x) =>
        zeilen.push([
          `Hergestellt: ${x.name}`,
          `${plain(x.menge)} ${p.erzeugnisEinheit} à ${plain(x.bedarf)} ${e} laut Stückliste`,
        ]),
      );
    if (p.variante !== 'vergleich')
      zeilen.push([
        'Einstandspreis frei Lager',
        `${eur(p.preis, dec(p.preis).decimalPlaces() > 2 ? 3 : 2)} je ${e}`,
      ]);
    const aufgabe =
      p.variante === 'inventur'
        ? 'Ermittle die Verbrauchsmenge nach der Inventurmethode und bewerte sie mit dem Einstandspreis.'
        : p.variante === 'skontration'
          ? 'Ermittle die Verbrauchsmenge nach der Skontrationsmethode, den rechnerischen Endbestand und die Inventurdifferenz. Bewerte den Verbrauch mit dem Einstandspreis.'
          : p.variante === 'retrograd'
            ? 'Ermittle den Sollverbrauch nach der retrograden Methode und den rechnerischen Endbestand. Bewerte den Sollverbrauch mit dem Einstandspreis.'
            : 'Ermittle den Verbrauch nach Inventur-, Skontrations- und retrograder Methode. Wie viel ging im Lager verloren (Schwund), wie viel in der Fertigung (Mehrverbrauch gegenüber Stückliste)?';
    return {
      titel: 'Materialverbrauchsmengen',
      kontext: 'Januar Folgejahr: Controlling baut die Kostenrechnung auf',
      sachverhalt: [
        `Leni Brandt braucht für die Kostenrechnung den Monatsverbrauch an ${p.material}. Aus Lager und Fertigung liegen diese Angaben vor:`,
      ],
      daten: { spalten: ['Angabe', 'Menge'], zeilen },
      aufgabe,
    };
  },
  solve: (p) => solveMengen(p),
  parts,
  steps: (p, s) => {
    const e = p.einheit;
    const st: SolutionStep[] = [];
    const inv: SolutionStep = {
      titel: 'Inventurmethode',
      rechnung: `${plain(p.ab)} + ${plain(s.zugang)} − ${plain(p.eb)} = ${plain(s.inventur)} ${e}`,
      erlaeuterung:
        'Anfangsbestand + Zugänge − Endbestand laut Inventur. Schwund steckt unerkannt im Verbrauch.',
    };
    const sko: SolutionStep = {
      titel: 'Skontrationsmethode',
      rechnung: `Entnahmescheine: ${p.entnahmen.map(plain).join(' + ')} = ${plain(s.skontration)} ${e}; Soll-Endbestand ${plain(p.ab)} + ${plain(s.zugang)} − ${plain(s.skontration)} = ${plain(s.sollEbSkontration)} ${e}`,
      erlaeuterung: `Inventurdifferenz: ${plain(s.sollEbSkontration)} − ${plain(p.eb)} = ${plain(s.schwund)} ${e} sind im Lager verloren gegangen.`,
    };
    const ret: SolutionStep = {
      titel: 'Retrograde Methode',
      rechnung: `${p.erzeugnisse.map((x) => `${plain(x.menge)} × ${plain(x.bedarf)}`).join(' + ')} = ${plain(s.retrograd)} ${e}; Soll-Endbestand ${plain(p.ab)} + ${plain(s.zugang)} − ${plain(s.retrograd)} = ${plain(s.sollEbRetrograd)} ${e}`,
      erlaeuterung: 'Hergestellte Menge × Materialbedarf je Einheit laut Stückliste.',
    };
    if (p.variante === 'inventur') st.push(inv);
    if (p.variante === 'skontration') st.push(sko);
    if (p.variante === 'retrograd') st.push(ret);
    if (p.variante === 'vergleich')
      st.push(inv, sko, ret, {
        titel: 'Abweichungen erklären',
        rechnung: `Mehrverbrauch Fertigung ${plain(s.skontration)} − ${plain(s.retrograd)} = ${plain(s.mehrverbrauch)} ${e}; Lagerschwund ${plain(s.schwund)} ${e}`,
        erlaeuterung: `Zusammen ${plain(s.inventur - s.retrograd)} ${e} = Inventurverbrauch − Sollverbrauch.`,
      });
    if (s.kosten)
      st.push({
        titel: 'Bewertung',
        rechnung: `${plain(p.variante === 'inventur' ? s.inventur : p.variante === 'skontration' ? s.skontration : s.retrograd)} ${e} × ${plain(p.preis)} € = ${eur(s.kosten)}`,
      });
    return st;
  },
  hints: (p, s) => {
    switch (p.variante) {
      case 'inventur':
        return [
          'Inventurmethode: Der Verbrauch wird aus den Beständen zurückgerechnet.',
          'Verbrauch = Anfangsbestand + Zugänge − Endbestand laut Inventur.',
          `Zugänge zusammen: ${plain(s.zugang)} ${p.einheit}.`,
        ];
      case 'skontration':
        return [
          'Skontrationsmethode: Verbrauch = Summe der Materialentnahmescheine.',
          'Rechnerischer Endbestand = Anfangsbestand + Zugänge − Entnahmen.',
          'Inventurdifferenz = rechnerischer Endbestand − Endbestand laut Inventur.',
        ];
      case 'retrograd':
        return [
          'Retrograd: vom fertigen Erzeugnis zurück auf das Material schließen.',
          'Sollverbrauch = Σ hergestellte Menge × Bedarf je Einheit laut Stückliste.',
          'Rechnerischer Endbestand = Anfangsbestand + Zugänge − Sollverbrauch.',
        ];
      case 'vergleich':
        return [
          'Rechne alle drei Methoden nacheinander.',
          'Lagerschwund = rechnerischer Endbestand der Skontration − Inventurbestand.',
          'Mehrverbrauch in der Fertigung = Entnahmen − Sollverbrauch laut Stückliste.',
        ];
    }
  },
  errorVariants: variants,
  verfahren: (p) =>
    p.variante === 'inventur'
      ? 'Verbrauchsmenge nach der Inventurmethode'
      : p.variante === 'skontration'
        ? 'Verbrauchsmenge nach der Skontrationsmethode'
        : p.variante === 'retrograd'
          ? 'Verbrauchsmenge nach der retrograden Methode'
          : 'Vergleich der Verfahren zur Erfassung der Verbrauchsmengen',
});
