// H2 – Materialbewertung (K1 Kap. 2.2.2): Durchschnittsbewertung periodisch/permanent und
// Verbrauchsfolgeverfahren Fifo, Lifo, Hifo, Lofo jeweils periodisch und permanent.
// Rundung wie im Lehrbrief: Durchschnittspreise kaufmännisch auf 2 Nachkommastellen; permanent wird
// der Bestand nach jedem Zugang mit Menge × gerundetem Durchschnittspreis weitergeführt (schrittweiser Pfad).
import { Val, dec } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, SolutionStep, TaskPart, ZahlFeld } from '../../task';
import { defineGenerator, eur, feld, isExact, isKrumm, plain } from '../base';

export type BewVerfahren = 'durchschnitt' | 'fifo' | 'lifo' | 'hifo' | 'lofo';
export type BewArt = 'periodisch' | 'permanent';

/** Lagerbewegung: mit Preis = Zugang, ohne Preis = Abgang. */
export interface Bewegung {
  tag: number;
  menge: number;
  preis?: string;
}

export interface MatBewParams {
  verfahren: BewVerfahren;
  art: BewArt;
  material: string;
  einheit: string;
  monat: number;
  ab: { menge: number; preis: string };
  bewegungen: Bewegung[];
}

export interface Entnahme {
  menge: number;
  preis: string;
}

export interface AbgangWert {
  tag: number;
  menge: number;
  /** permanente Durchschnittsbewertung: Preis zum Zeitpunkt des Abgangs */
  preis?: Val;
  wert: Val;
  /** Verbrauchsfolge: aus welchen Partien entnommen wurde */
  aus: Entnahme[];
}

export interface MatBewSolution {
  gesamtMenge: number;
  gesamtWert: Val;
  verbrauchMenge: number;
  ebMenge: number;
  durchschnittspreis?: Val;
  /** periodische Verbrauchsfolge: entnommene Partien */
  entnahmen?: Entnahme[];
  abgaenge?: AbgangWert[];
  verbrauch: Val;
  endbestand: Val;
}

export interface BewRechenweg {
  verfahren?: BewVerfahren;
  ungewichtet?: boolean;
  ohneAnfangsbestand?: boolean;
  tausch?: boolean;
  periodisch?: boolean;
}

const istZugang = (b: Bewegung): b is Bewegung & { preis: string } => b.preis !== undefined;

/** Reihenfolge der Entnahme: Fifo älteste, Lifo jüngste, Hifo teuerste, Lofo billigste Partie zuerst. */
function ordne<T extends { preis: string }>(
  lose: readonly T[],
  v: Exclude<BewVerfahren, 'durchschnitt'>,
): T[] {
  const idx = lose.map((l, i) => ({ l, i }));
  const cmp = (a: { l: T; i: number }, b: { l: T; i: number }): number => {
    if (v === 'fifo') return a.i - b.i;
    if (v === 'lifo') return b.i - a.i;
    const d = dec(a.l.preis).cmp(dec(b.l.preis));
    if (d !== 0) return v === 'hifo' ? -d : d;
    return a.i - b.i;
  };
  return idx.sort(cmp).map((x) => x.l);
}

function entnimm(
  lose: { menge: number; preis: string }[],
  menge: number,
  v: Exclude<BewVerfahren, 'durchschnitt'>,
): Entnahme[] {
  let rest = menge;
  const aus: Entnahme[] = [];
  for (const l of ordne(lose, v)) {
    if (rest <= 0) break;
    const m = Math.min(rest, l.menge);
    if (m <= 0) continue;
    aus.push({ menge: m, preis: l.preis });
    l.menge -= m;
    rest -= m;
  }
  if (rest > 0) throw new Error('Abgang größer als Lagerbestand');
  return aus;
}

const wertVon = (aus: readonly Entnahme[]): Val =>
  aus.reduce((a, e) => a.plus(new Val(e.preis).times(e.menge)), new Val(0));

/**
 * Durchschnittsbewertung: Der Lehrbrief rundet jeden Durchschnittspreis auf 2 Nachkommastellen und rechnet
 * damit weiter (so verlangt es auch die Aufgabe). Dieser Weg wird deshalb als Hauptlösung angezeigt;
 * der ungerundete Weg bleibt als zweiter Pfad gültig (Bewertung „Rundung“).
 */
const tausche = (v: Val) => new Val(v.stepped, v.exact, v.steps);

function lehrbriefPfad(s: MatBewSolution): MatBewSolution {
  const out: MatBewSolution = {
    ...s,
    verbrauch: tausche(s.verbrauch),
    endbestand: tausche(s.endbestand),
  };
  if (s.durchschnittspreis) out.durchschnittspreis = tausche(s.durchschnittspreis);
  if (s.abgaenge)
    out.abgaenge = s.abgaenge.map((a) => ({
      ...a,
      wert: tausche(a.wert),
      ...(a.preis ? { preis: tausche(a.preis) } : {}),
    }));
  return out;
}

export function solveMatBew(p: MatBewParams, w: BewRechenweg = {}): MatBewSolution {
  const v = w.verfahren ?? p.verfahren;
  const zugaenge = p.bewegungen.filter(istZugang);
  const abgaenge = p.bewegungen.filter((b) => !istZugang(b));
  const gesamtMenge = p.ab.menge + zugaenge.reduce((a, z) => a + z.menge, 0);
  const gesamtWert = zugaenge.reduce(
    (a, z) => a.plus(new Val(z.preis).times(z.menge)),
    new Val(p.ab.preis).times(p.ab.menge),
  );
  const verbrauchMenge = abgaenge.reduce((a, b) => a + b.menge, 0);
  const ebMenge = gesamtMenge - verbrauchMenge;
  let s: MatBewSolution;

  if (p.art === 'periodisch' || w.periodisch) {
    if (v === 'durchschnitt') {
      let preis: Val;
      const basis = w.ohneAnfangsbestand
        ? zugaenge
        : [{ menge: p.ab.menge, preis: p.ab.preis }, ...zugaenge];
      if (w.ungewichtet) {
        preis = basis
          .reduce((a, z) => a.plus(z.preis), new Val(0))
          .div(basis.length)
          .round();
      } else {
        const m = basis.reduce((a, z) => a + z.menge, 0);
        preis = basis
          .reduce((a, z) => a.plus(new Val(z.preis).times(z.menge)), new Val(0))
          .div(m)
          .round();
      }
      s = {
        gesamtMenge,
        gesamtWert,
        verbrauchMenge,
        ebMenge,
        durchschnittspreis: preis,
        verbrauch: preis.times(verbrauchMenge).round(),
        endbestand: preis.times(ebMenge).round(),
      };
    } else {
      const lose = [
        { menge: p.ab.menge, preis: p.ab.preis },
        ...zugaenge.map((z) => ({ menge: z.menge, preis: z.preis })),
      ];
      const entnahmen = entnimm(lose, verbrauchMenge, v);
      const verbrauch = wertVon(entnahmen);
      s = {
        gesamtMenge,
        gesamtWert,
        verbrauchMenge,
        ebMenge,
        entnahmen,
        verbrauch,
        endbestand: gesamtWert.minus(verbrauch),
      };
    }
  } else if (v === 'durchschnitt') {
    let menge = p.ab.menge;
    let preis = new Val(p.ab.preis);
    const out: AbgangWert[] = [];
    for (const b of p.bewegungen) {
      if (istZugang(b)) {
        preis = w.ungewichtet
          ? preis.plus(b.preis).div(2).round()
          : preis
              .times(menge)
              .plus(new Val(b.preis).times(b.menge))
              .div(menge + b.menge)
              .round();
        menge += b.menge;
      } else {
        out.push({
          tag: b.tag,
          menge: b.menge,
          preis,
          wert: preis.times(b.menge).round(),
          aus: [],
        });
        menge -= b.menge;
      }
    }
    const verbrauch = out.reduce((a, x) => a.plus(x.wert), new Val(0));
    s = {
      gesamtMenge,
      gesamtWert,
      verbrauchMenge,
      ebMenge,
      abgaenge: out,
      verbrauch,
      endbestand: gesamtWert.minus(verbrauch),
    };
  } else {
    const lose: { menge: number; preis: string }[] = [{ menge: p.ab.menge, preis: p.ab.preis }];
    const out: AbgangWert[] = [];
    for (const b of p.bewegungen) {
      if (istZugang(b)) lose.push({ menge: b.menge, preis: b.preis });
      else {
        const aus = entnimm(lose, b.menge, v);
        out.push({ tag: b.tag, menge: b.menge, wert: wertVon(aus), aus });
      }
    }
    const verbrauch = out.reduce((a, x) => a.plus(x.wert), new Val(0));
    s = {
      gesamtMenge,
      gesamtWert,
      verbrauchMenge,
      ebMenge,
      abgaenge: out,
      verbrauch,
      endbestand: gesamtWert.minus(verbrauch),
    };
  }
  if (v === 'durchschnitt') s = lehrbriefPfad(s);
  if (w.tausch) s = { ...s, verbrauch: s.endbestand, endbestand: s.verbrauch };
  return s;
}

const NAME: Record<BewVerfahren, string> = {
  durchschnitt: 'Durchschnittsbewertung',
  fifo: 'Fifo-Verfahren',
  lifo: 'Lifo-Verfahren',
  hifo: 'Hifo-Verfahren',
  lofo: 'Lofo-Verfahren',
};

const datum = (tag: number, monat: number) => `${tag}.${monat}.`;

function parts(p: MatBewParams, s: MatBewSolution): TaskPart[] {
  const felder: ZahlFeld[] = [];
  const ek = `€/${p.einheit}`;
  if (p.art === 'periodisch') {
    felder.push(feld('menge', 'Verbrauchsmenge der Periode', s.verbrauchMenge, 'menge', p.einheit));
    if (p.verfahren === 'durchschnitt')
      felder.push(feld('preis', 'Durchschnittspreis', s.durchschnittspreis!, 'satz', ek));
    felder.push(feld('verbrauch', 'Materialverbrauchskosten', s.verbrauch));
    felder.push(
      feld(
        'eb',
        p.verfahren === 'durchschnitt'
          ? 'Wert des Endbestands (Endbestandsmenge × Durchschnittspreis)'
          : 'Wert des Endbestands',
        s.endbestand,
      ),
    );
  } else {
    s.abgaenge!.forEach((a, i) => {
      if (p.verfahren === 'durchschnitt')
        felder.push(
          feld(
            `preis-${i}`,
            `Durchschnittspreis beim Abgang am ${datum(a.tag, p.monat)}`,
            a.preis!,
            'satz',
            ek,
          ),
        );
      felder.push(feld(`wert-${i}`, `Wert des Abgangs am ${datum(a.tag, p.monat)}`, a.wert));
    });
    felder.push(feld('verbrauch', 'Materialverbrauchskosten gesamt', s.verbrauch));
    if (p.verfahren !== 'durchschnitt')
      felder.push(feld('eb', 'Wert des Endbestands', s.endbestand));
  }
  return [
    { typ: 'rechenkette', id: 'bewertung', titel: `${NAME[p.verfahren]} (${p.art})`, felder },
  ];
}

function variants(p: MatBewParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const richtig = solveMatBew(p);
  const add = (fehlertyp: string, s: MatBewSolution) => out.push({ fehlertyp, parts: parts(p, s) });
  if (p.verfahren === 'durchschnitt') {
    add('ungewichteter-durchschnitt', solveMatBew(p, { ungewichtet: true }));
    if (p.art === 'periodisch')
      add('durchschnitt-ohne-anfangsbestand', solveMatBew(p, { ohneAnfangsbestand: true }));
  } else {
    const tausch: Record<string, BewVerfahren> = {
      fifo: 'lifo',
      lifo: 'fifo',
      hifo: 'lofo',
      lofo: 'hifo',
    };
    add(
      p.verfahren === 'fifo' || p.verfahren === 'lifo'
        ? 'fifo-lifo-vertauscht'
        : 'hifo-lofo-vertauscht',
      solveMatBew(p, { verfahren: tausch[p.verfahren] }),
    );
  }
  if (p.art === 'periodisch' || p.verfahren !== 'durchschnitt')
    add('endbestand-statt-verbrauch', solveMatBew(p, { tausch: true }));
  if (p.art === 'permanent') {
    // Gesamtverbrauch periodisch gerechnet, obwohl permanent verlangt ist
    const per = solveMatBew(p, { periodisch: true });
    add('periodisch-statt-permanent', {
      ...richtig,
      verbrauch: per.verbrauch,
      endbestand: per.endbestand,
    });
  }
  return out;
}

interface Vorlage {
  material: string;
  einheit: string;
  menge: [number, number];
  step: number;
  /** Preisspanne in Cent */
  preis: [number, number];
}

const VORLAGEN: Vorlage[] = [
  { material: 'Zitronenaroma', einheit: 'kg', menge: [40, 160], step: 10, preis: [2_600, 4_200] },
  {
    material: 'Zucker (Säcke à 25 kg)',
    einheit: 'Sack',
    menge: [100, 400],
    step: 10,
    preis: [1_600, 2_600],
  },
  {
    material: 'Aromakonzentrat',
    einheit: 'Fass',
    menge: [20, 80],
    step: 5,
    preis: [11_000, 18_000],
  },
  {
    material: 'Braumalz (Big Bags)',
    einheit: 'Bag',
    menge: [30, 120],
    step: 5,
    preis: [42_000, 58_000],
  },
];

const MONATE = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

function centsToString(c: number): string {
  return dec(c).div(100).toFixed(2);
}

function erzeuge(rng: Rng, verfahren: BewVerfahren, art: BewArt, krumm: boolean): MatBewParams {
  const t = rng.pick(VORLAGEN);
  const step = krumm ? 1 : t.step;
  const preisStep = krumm ? 1 : 10;
  const preise = new Set<number>();
  const neuerPreis = (): number => {
    for (let i = 0; i < 50; i++) {
      const c = rng.step(t.preis[0], t.preis[1], preisStep);
      if (!preise.has(c)) {
        preise.add(c);
        return c;
      }
    }
    const c = Math.max(...preise) + preisStep;
    preise.add(c);
    return c;
  };
  const nz = rng.pick([2, 3, 3]);
  const mitAbgangZuerst = rng.chance(0.5);
  const abMenge = rng.step(t.menge[0], t.menge[1], step);
  const ab = { menge: abMenge, preis: centsToString(neuerPreis()) };
  const folge: ('Z' | 'A')[] = [];
  if (mitAbgangZuerst) folge.push('A');
  for (let i = 0; i < nz; i++) folge.push('Z', 'A');
  const tage = rng
    .shuffle(Array.from({ length: 27 }, (_, i) => i + 2))
    .slice(0, folge.length)
    .sort((a, b) => a - b);
  let bestand = abMenge;
  const bewegungen: Bewegung[] = folge.map((f, i) => {
    const tag = tage[i]!;
    if (f === 'Z') {
      const menge = rng.step(t.menge[0], Math.round(t.menge[1] * 1.5), step);
      bestand += menge;
      return { tag, menge, preis: centsToString(neuerPreis()) };
    }
    const letzter = i === folge.length - 1;
    const anteil = rng.int(letzter ? 50 : 40, letzter ? 85 : 80);
    let menge = Math.max(step, Math.floor((bestand * anteil) / 100 / step) * step);
    if (menge >= bestand) menge = bestand - step;
    bestand -= menge;
    return { tag, menge };
  });
  return {
    verfahren,
    art,
    material: t.material,
    einheit: t.einheit,
    monat: rng.int(1, 12),
    ab,
    bewegungen,
  };
}

/** Klausurfreundlich: Durchschnittspreis ohne Rundung, Abgänge nicht leer, Endbestand > 0. */
function ok(p: MatBewParams, krumm: boolean): boolean {
  if (p.bewegungen.some((b) => b.menge <= 0)) return false;
  const s = solveMatBew(p);
  if (s.ebMenge <= 0) return false;
  if (krumm || p.verfahren !== 'durchschnitt' || p.art !== 'periodisch') return true;
  return isExact(s.gesamtWert.div(s.gesamtMenge));
}

export const VARIANTEN_H2 = [
  'durchschnitt-periodisch',
  'durchschnitt-permanent',
  'fifo-periodisch',
  'fifo-permanent',
  'lifo-periodisch',
  'lifo-permanent',
  'hifo-periodisch',
  'hifo-permanent',
  'lofo-periodisch',
  'lofo-permanent',
] as const;

const GEWICHTE: (typeof VARIANTEN_H2)[number][] = [
  'durchschnitt-periodisch',
  'durchschnitt-periodisch',
  'durchschnitt-periodisch',
  'durchschnitt-permanent',
  'durchschnitt-permanent',
  'fifo-periodisch',
  'fifo-periodisch',
  'fifo-permanent',
  'lifo-periodisch',
  'lifo-periodisch',
  'lifo-permanent',
  'lifo-permanent',
  'hifo-periodisch',
  'hifo-permanent',
  'lofo-periodisch',
  'lofo-permanent',
];

function lagerkartei(p: MatBewParams): string[][] {
  const zeilen: string[][] = [
    [datum(1, p.monat), 'Anfangsbestand', `${plain(p.ab.menge)} ${p.einheit}`, eur(p.ab.preis)],
  ];
  for (const b of p.bewegungen)
    zeilen.push([
      datum(b.tag, p.monat),
      istZugang(b) ? 'Zugang' : 'Abgang',
      `${plain(b.menge)} ${p.einheit}`,
      istZugang(b) ? eur(b.preis) : '–',
    ]);
  return zeilen;
}

const entnahmeText = (aus: readonly Entnahme[], einheit: string) =>
  aus.map((e) => `${plain(e.menge)} ${einheit} × ${eur(e.preis)}`).join(' + ');

export const materialbewertung = defineGenerator<MatBewParams, MatBewSolution>({
  skillId: 'H2-materialbewertung',
  titel: 'Materialbewertung',
  variants: [...VARIANTEN_H2],
  points: 6,
  generate: (rng, opts = {}) => {
    const v = (opts.variant as (typeof VARIANTEN_H2)[number] | undefined) ?? rng.pick(GEWICHTE);
    const [verfahren, art] = v.split('-') as [BewVerfahren, BewArt];
    const krumm = isKrumm(rng, opts.krummAnteil);
    let p = erzeuge(rng, verfahren, art, krumm);
    for (let i = 0; i < 800 && !ok(p, krumm); i++) p = erzeuge(rng, verfahren, art, krumm);
    return p;
  },
  render: (p) => {
    const monat = MONATE[p.monat - 1]!;
    const sachverhalt = [
      `In der Lagerkartei der MBG stehen für ${p.material} im ${monat} folgende Bewegungen (Einstandspreise frei Lager, ohne Umsatzsteuer):`,
    ];
    let aufgabe: string;
    if (p.art === 'periodisch') {
      aufgabe =
        p.verfahren === 'durchschnitt'
          ? `Bewerte den Verbrauch im ${monat} mit der periodischen Durchschnittsbewertung (Anfangsbestand einbeziehen, Durchschnittspreis kaufmännisch auf 2 Nachkommastellen). Ermittle Verbrauchsmenge, Durchschnittspreis, Materialverbrauchskosten und den Wert des Endbestands.`
          : `Ermittle die Materialverbrauchskosten im ${monat} nach dem ${NAME[p.verfahren]} (periodisch) sowie den Wert des Endbestands.`;
    } else {
      aufgabe =
        p.verfahren === 'durchschnitt'
          ? 'Bewerte jeden Abgang mit der permanenten Durchschnittsbewertung: nach jedem Zugang neuer Durchschnittspreis (kaufmännisch auf 2 Nachkommastellen), Bestand mit Menge × Durchschnittspreis weiterführen. Ermittle die Preise und Werte der Abgänge und die Materialverbrauchskosten.'
          : `Bewerte jeden Abgang nach dem ${NAME[p.verfahren]} (permanent, also zum Zeitpunkt des Abgangs). Ermittle die Werte der Abgänge, die Materialverbrauchskosten und den Wert des Endbestands.`;
    }
    return {
      titel: 'Materialbewertung',
      kontext: 'Januar Folgejahr: Controlling baut die Kostenrechnung auf',
      sachverhalt,
      daten: { spalten: ['Datum', 'Vorgang', 'Menge', 'Preis je Einheit'], zeilen: lagerkartei(p) },
      aufgabe,
    };
  },
  solve: (p) => solveMatBew(p),
  parts,
  steps: (p, s) => {
    const steps: SolutionStep[] = [];
    if (p.art === 'periodisch') {
      steps.push({
        titel: 'Verbrauchsmenge',
        rechnung: `Summe der Abgänge: ${p.bewegungen
          .filter((b) => !istZugang(b))
          .map((b) => plain(b.menge))
          .join(' + ')} = ${plain(s.verbrauchMenge)} ${p.einheit}`,
        erlaeuterung:
          'Periodisch wird nur der Gesamtverbrauch des Monats bewertet, nicht jeder einzelne Abgang.',
      });
      if (p.verfahren === 'durchschnitt') {
        steps.push(
          {
            titel: 'Durchschnittspreis',
            rechnung: `Wert von Anfangsbestand und Zugängen ${eur(s.gesamtWert)} ÷ ${plain(s.gesamtMenge)} ${p.einheit} = ${eur(s.durchschnittspreis!)}`,
            erlaeuterung: 'Gewogener Durchschnitt: Jeder Preis zählt mit seiner Menge.',
          },
          {
            titel: 'Verbrauch und Endbestand',
            rechnung: `${plain(s.verbrauchMenge)} × ${eur(s.durchschnittspreis!)} = ${eur(s.verbrauch)}; Endbestand ${plain(s.ebMenge)} × ${eur(s.durchschnittspreis!)} = ${eur(s.endbestand)}`,
          },
        );
      } else {
        steps.push(
          {
            titel: 'Verbrauchsfolge',
            rechnung: `${entnahmeText(s.entnahmen!, p.einheit)} = ${eur(s.verbrauch)}`,
            erlaeuterung:
              p.verfahren === 'fifo'
                ? 'Fifo: Anfangsbestand und frühe Zugänge gelten als zuerst verbraucht.'
                : p.verfahren === 'lifo'
                  ? 'Lifo periodisch: vom letzten Zugang des Monats rückwärts, egal wann die Abgänge waren.'
                  : p.verfahren === 'hifo'
                    ? 'Hifo: die teuersten Partien gelten als zuerst verbraucht.'
                    : 'Lofo: die billigsten Partien gelten als zuerst verbraucht.',
          },
          {
            titel: 'Endbestand',
            rechnung: `${eur(s.gesamtWert)} − ${eur(s.verbrauch)} = ${eur(s.endbestand)}`,
            erlaeuterung: 'Wert von Anfangsbestand und Zugängen minus Verbrauch.',
          },
        );
      }
    } else {
      for (const a of s.abgaenge!) {
        steps.push(
          p.verfahren === 'durchschnitt'
            ? {
                titel: `Abgang am ${datum(a.tag, p.monat)}`,
                rechnung: `${plain(a.menge)} ${p.einheit} × ${eur(a.preis!)} = ${eur(a.wert)}`,
                erlaeuterung: 'Preis = aktueller Durchschnittspreis nach dem letzten Zugang.',
              }
            : {
                titel: `Abgang am ${datum(a.tag, p.monat)}`,
                rechnung: `${entnahmeText(a.aus, p.einheit)} = ${eur(a.wert)}`,
              },
        );
      }
      steps.push({
        titel: 'Materialverbrauchskosten',
        rechnung: `${s.abgaenge!.map((a) => eur(a.wert)).join(' + ')} = ${eur(s.verbrauch)}`,
        erlaeuterung:
          p.verfahren === 'durchschnitt'
            ? 'Nach jedem Zugang: (Restmenge × alter Preis + Zugangsmenge × Zugangspreis) ÷ neue Menge.'
            : `Endbestand: ${eur(s.gesamtWert)} − ${eur(s.verbrauch)} = ${eur(s.endbestand)}`,
      });
    }
    return steps;
  },
  hints: (p, s) => {
    if (p.verfahren === 'durchschnitt' && p.art === 'periodisch')
      return [
        'Zuerst alle Abgänge zur Verbrauchsmenge addieren.',
        'Durchschnittspreis = (Wert Anfangsbestand + Wert aller Zugänge) ÷ (Menge Anfangsbestand + Menge aller Zugänge).',
        `Hier: ${eur(s.gesamtWert)} ÷ ${plain(s.gesamtMenge)} ${p.einheit}.`,
      ];
    if (p.verfahren === 'durchschnitt')
      return [
        'Gehe die Lagerkartei Zeile für Zeile durch und führe Menge und Preis mit.',
        'Nach jedem Zugang: neuer Preis = (Restmenge × bisheriger Preis + Zugangsmenge × Zugangspreis) ÷ (Restmenge + Zugangsmenge).',
        'Jeden Abgang mit dem Preis bewerten, der in diesem Moment gilt.',
      ];
    const reihen =
      p.verfahren === 'fifo'
        ? 'die ältesten Partien'
        : p.verfahren === 'lifo'
          ? 'die jüngsten Partien'
          : p.verfahren === 'hifo'
            ? 'die teuersten Partien'
            : 'die billigsten Partien';
    return [
      `${NAME[p.verfahren]}: Es gelten ${reihen} als zuerst verbraucht.`,
      p.art === 'periodisch'
        ? `Periodisch: Gesamtverbrauch ${plain(s.verbrauchMenge)} ${p.einheit} auf einmal aus allen Partien des Monats entnehmen.`
        : 'Permanent: Bei jedem Abgang nur die Partien betrachten, die zu diesem Zeitpunkt auf Lager sind.',
      'Endbestand = Wert von Anfangsbestand und Zugängen − Materialverbrauchskosten.',
    ];
  },
  errorVariants: variants,
  verfahren: (p) => `Materialbewertung (${NAME[p.verfahren]}, ${p.art})`,
});
