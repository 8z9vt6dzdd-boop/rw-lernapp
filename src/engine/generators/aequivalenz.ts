// J3 – Einstufige Äquivalenzziffernkalkulation (Dosengrößen der MBG).
import { Val, dec, formatPlain } from '../money';
import type { ErrorVariant, TabellenZeile, TaskPart } from '../task';
import { defineGenerator, eur, feld, isExact, isKrumm, plain, retry } from './base';

export interface Sorte {
  name: string;
  menge: number;
  aez: string;
  /** Variante „prozent“: Abweichung zur Einheitssorte, z. B. „0.5“ = 50 % höher, „-0.2“ = 20 % niedriger */
  abweichung?: string;
}

export interface AequivalenzParams {
  sorten: Sorte[];
  /** Index der Einheitssorte (Ziffer 1) */
  basis: number;
  gesamtkosten: string;
  variante: 'ziffern' | 'prozent';
}

export interface AequivalenzSolution {
  aez: Val[];
  re: Val[];
  summeRe: Val;
  kostenJeRe: Val;
  stueckkosten: Val[];
  kostenSorte: Val[];
}

interface Weg {
  mengeStattRe?: boolean;
  aezNurProzent?: boolean;
  aezVorzeichen?: boolean;
}

function aezVon(s: Sorte, w: Weg): Val {
  if (s.abweichung === undefined) return new Val(s.aez);
  const a = dec(s.abweichung);
  if (w.aezNurProzent) return new Val(a.abs());
  if (w.aezVorzeichen) return new Val(dec(1).minus(a));
  return new Val(dec(1).plus(a));
}

export function solveAequivalenz(p: AequivalenzParams, w: Weg = {}): AequivalenzSolution {
  const aez = p.sorten.map((s) => aezVon(s, w));
  const re = p.sorten.map((s, i) => aez[i]!.times(s.menge));
  const summeRe = re.reduce((a, b) => a.plus(b), new Val(0));
  const summeMenge = p.sorten.reduce((a, s) => a + s.menge, 0);
  const kostenJeRe = new Val(p.gesamtkosten).div(w.mengeStattRe ? summeMenge : summeRe).round();
  const stueckkosten = aez.map((z) => kostenJeRe.times(z).round());
  const kostenSorte = stueckkosten.map((k, i) => k.times(p.sorten[i]!.menge).round());
  return { aez, re, summeRe, kostenJeRe, stueckkosten, kostenSorte };
}

function parts(p: AequivalenzParams, s: AequivalenzSolution): TaskPart[] {
  const zeilen1: TabellenZeile[] = p.sorten.map((so, i) => ({
    label: so.name,
    zellen: [
      { typ: 'fest', text: plain(so.menge) },
      p.variante === 'prozent'
        ? feld(`aez-${i}`, `Äquivalenzziffer ${so.name}`, s.aez[i]!, 'zahl', '')
        : { typ: 'fest', text: formatPlain(so.aez) },
      feld(`re-${i}`, `Rechnungseinheiten ${so.name}`, s.re[i]!, 'zahl', ''),
    ],
  }));
  zeilen1.push({
    label: 'Summe',
    summe: true,
    zellen: [
      { typ: 'leer' },
      { typ: 'leer' },
      feld('re-summe', 'Summe Rechnungseinheiten', s.summeRe, 'zahl', ''),
    ],
  });
  const zeilen2: TabellenZeile[] = p.sorten.map((so, i) => ({
    label: so.name,
    zellen: [
      feld(`stueck-${i}`, `Stückkosten ${so.name}`, s.stueckkosten[i]!),
      feld(`kosten-${i}`, `Kosten ${so.name}`, s.kostenSorte[i]!),
    ],
  }));
  return [
    {
      typ: 'tabelle',
      id: 're',
      titel: 'Rechnungseinheiten',
      spalten: ['Menge (Kartons)', 'Äquivalenzziffer', 'Rechnungseinheiten'],
      zeilen: zeilen1,
    },
    {
      typ: 'rechenkette',
      id: 'kosten-je-re',
      titel: 'Kosten je Rechnungseinheit',
      felder: [feld('k', 'Kosten je Rechnungseinheit', s.kostenJeRe)],
    },
    {
      typ: 'tabelle',
      id: 'stueck',
      titel: 'Stückkosten und Kosten je Sorte',
      spalten: ['Stückkosten je Karton', 'Kosten der Sorte'],
      zeilen: zeilen2,
      hinweis: `Kontrolle: Die Kosten aller Sorten ergeben zusammen ${eur(p.gesamtkosten)}.`,
    },
  ];
}

const SORTEN = [
  'Paderquell Energy 0,25 l',
  'Paderquell Energy 0,33 l',
  'Paderquell Energy 0,5 l',
  'Paderquell Energy 0,75 l',
  'Paderquell Energy 1,0 l',
];
const ZIFFERN = ['0.6', '0.75', '0.8', '1.2', '1.25', '1.4', '1.5', '1.6', '1.8', '2'];

export const aequivalenz = defineGenerator<AequivalenzParams, AequivalenzSolution>({
  skillId: 'J3-aequivalenz',
  titel: 'Äquivalenzziffernkalkulation',
  variants: ['ziffern', 'prozent'],
  points: 8,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const variante =
      (opts.variant as 'ziffern' | 'prozent' | undefined) ??
      (rng.chance(0.35) ? 'prozent' : 'ziffern');
    return retry(
      rng,
      (r) => {
        const anzahl = r.int(3, 4);
        const start = r.int(0, SORTEN.length - anzahl);
        const namen = SORTEN.slice(start, start + anzahl);
        const basis = r.int(0, anzahl - 1);
        // Größere Dosen tragen tendenziell höhere Ziffern.
        const kleinere = r
          .shuffle(ZIFFERN.filter((z) => dec(z).lt(1)))
          .slice(0, basis)
          .sort((a, b) => dec(a).cmp(b));
        const groessere = r
          .shuffle(ZIFFERN.filter((z) => dec(z).gt(1)))
          .slice(0, anzahl - basis - 1)
          .sort((a, b) => dec(a).cmp(b));
        const ziffern = [...kleinere, '1', ...groessere];
        const sorten: Sorte[] = namen.map((name, i) => {
          const s: Sorte = { name, menge: r.step(500, 20_000, 100), aez: ziffern[i]! };
          if (variante === 'prozent' && i !== basis)
            s.abweichung = dec(ziffern[i]!).minus(1).toString();
          return s;
        });
        const re = sorten.reduce((a, s) => a.plus(dec(s.aez).times(s.menge)), dec(0));
        const kJeRe = krumm
          ? null
          : dec(r.pick(['4', '4.5', '5', '6', '7.5', '8', '9', '10', '12', '12.5', '15']));
        const gesamtkosten = kJeRe
          ? kJeRe.times(re).toFixed(2)
          : re.times(r.int(400, 1500)).div(100).toFixed(2);
        return { sorten, basis, gesamtkosten, variante } satisfies AequivalenzParams;
      },
      (p) => {
        if (krumm) return true;
        const s = solveAequivalenz(p);
        return isExact(s.kostenJeRe.exact) && s.stueckkosten.every((x) => isExact(x.exact));
      },
    );
  },
  render: (p) => {
    const b = p.sorten[p.basis]!;
    const sachverhalt = [
      `Die MBG füllt ${p.sorten.length} Dosengrößen der Sorte Paderquell Energy ab. Im Monat entstehen Gesamtkosten von ${eur(p.gesamtkosten)}.`,
    ];
    if (p.variante === 'prozent') {
      sachverhalt.push(
        `Einheitssorte ist ${b.name}. Die übrigen Sorten verursachen je Karton:`,
        ...p.sorten
          .filter((s) => s.abweichung !== undefined)
          .map((s) => {
            const a = dec(s.abweichung!);
            return `• ${s.name}: ${formatPlain(a.abs().times(100))} % ${a.isNegative() ? 'weniger' : 'mehr'} Kosten als die Einheitssorte`;
          }),
      );
    }
    return {
      titel: 'Äquivalenzziffernkalkulation',
      kontext: 'Kalkulation der Dosengrößen',
      sachverhalt,
      daten: {
        spalten:
          p.variante === 'prozent'
            ? ['Sorte', 'Menge (Kartons)']
            : ['Sorte', 'Menge (Kartons)', 'Äquivalenzziffer'],
        zeilen: p.sorten.map((s) =>
          p.variante === 'prozent'
            ? [s.name, plain(s.menge)]
            : [s.name, plain(s.menge), formatPlain(s.aez)],
        ),
      },
      aufgabe:
        p.variante === 'prozent'
          ? 'Leite die Äquivalenzziffern ab und ermittle Rechnungseinheiten, Kosten je Rechnungseinheit, Stückkosten je Karton und die Kosten je Sorte.'
          : 'Ermittle Rechnungseinheiten, Kosten je Rechnungseinheit, Stückkosten je Karton und die Kosten je Sorte.',
    };
  },
  solve: (p) => solveAequivalenz(p),
  parts,
  steps: (p, s) => [
    {
      titel: 'Rechnungseinheiten',
      rechnung: p.sorten
        .map((so, i) => `${plain(so.menge)} × ${plain(s.aez[i]!.exact)} = ${plain(s.re[i]!.exact)}`)
        .join('; '),
      erlaeuterung: `Summe: ${plain(s.summeRe.exact)} RE`,
    },
    {
      titel: 'Kosten je Rechnungseinheit',
      rechnung: `${eur(p.gesamtkosten)} ÷ ${plain(s.summeRe.exact)} = ${eur(s.kostenJeRe)}`,
    },
    {
      titel: 'Stückkosten',
      rechnung: p.sorten
        .map(
          (so, i) =>
            `${so.name}: ${eur(s.kostenJeRe)} × ${plain(s.aez[i]!.exact)} = ${eur(s.stueckkosten[i]!)}`,
        )
        .join('; '),
    },
  ],
  hints: (p, s) => [
    'Schema: Menge × Äquivalenzziffer = Rechnungseinheiten; Gesamtkosten ÷ Summe RE = Kosten je RE; × Ziffer = Stückkosten.',
    p.variante === 'prozent'
      ? '„30 % mehr Kosten“ ergibt die Ziffer 1,3; „20 % weniger“ ergibt 0,8.'
      : `Summe der Rechnungseinheiten: ${plain(s.summeRe.exact)}.`,
    `Kosten je RE: ${eur(p.gesamtkosten)} ÷ ${plain(s.summeRe.exact)} = ${eur(s.kostenJeRe)}.`,
  ],
  errorVariants: (p) => {
    const out: ErrorVariant[] = [
      { fehlertyp: 'menge-statt-re', parts: parts(p, solveAequivalenz(p, { mengeStattRe: true })) },
    ];
    if (p.variante === 'prozent') {
      out.push(
        {
          fehlertyp: 'aez-relativ-falsch',
          parts: parts(p, solveAequivalenz(p, { aezNurProzent: true })),
        },
        {
          fehlertyp: 'aez-relativ-falsch',
          parts: parts(p, solveAequivalenz(p, { aezVorzeichen: true })),
        },
      );
    }
    return out;
  },
  verfahren: () => 'Äquivalenzziffernkalkulation (Sortenfertigung)',
});
