// J6 – Kuppelproduktkalkulation: Verteilungsmethode und Restwertmethode (K2 Kap. 2.2.6).
// Verteilungsmethode: Gesamtkosten − Einzelkosten der Sorten = Kosten des Kuppelprozesses; Verteilung nach
// Marktpreisen als Äquivalenzziffern (Kosten je € Erlös × Marktpreis), plus Einzelkosten je Einheit.
// Restwertmethode: Kosten des Kuppelprozesses − (Erlös − Weiterverarbeitungskosten) × Menge je
// Nebenprodukt = Restkosten des Hauptprodukts; ÷ Menge des Hauptprodukts = Herstellkosten je Einheit.
import { Val, dec, type Dec } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, TabellenZeile, TaskPart } from '../../task';
import { betrag, defineGenerator, eur, feld, isExact, isKrumm, plain, retry } from '../base';

export type KuppelVariante = 'verteilung' | 'restwert';

export interface KuppelProdukt {
  name: string;
  einheit: string;
  menge: number;
  /** Marktpreis (Verteilung) bzw. Erlös je Einheit (Nebenprodukt, Restwert) */
  preis?: string;
  /** Verteilung: Einzelkosten der Sorte (Weiterverarbeitung) für die gesamte Menge */
  einzelkosten?: string;
  /** Restwert: Weiterverarbeitungskosten je Einheit des Nebenprodukts */
  wvk?: string;
}

export interface KuppelParams {
  variante: KuppelVariante;
  monat: string;
  /** Verteilung: Gesamtkosten einschließlich Einzelkosten; Restwert: Kosten des Kuppelprozesses */
  gesamtkosten: string;
  /** Restwert: Index 0 ist das Hauptprodukt, die übrigen sind Nebenprodukte */
  produkte: KuppelProdukt[];
}

export interface KuppelSolution {
  kuppelkosten?: Val;
  erloese?: Val[];
  summeErloese?: Val;
  kostenJeEuro?: Val;
  stueckKuppel?: Val[];
  stueckEinzel?: Val[];
  stueckSelbst?: Val[];
  selbstSorte?: Val[];
  /** Restwert: Nettoerlös je Nebenprodukt, Restkosten und Herstellkosten je Einheit des Hauptprodukts */
  nettoerloese?: Val[];
  restkosten?: Val;
  hkHaupt?: Val;
}

interface Weg {
  einzelkostenNichtAbgezogen?: boolean;
  einzelkostenVergessen?: boolean;
  wvkNichtAbgezogen?: boolean;
  nebenerloesAddiert?: boolean;
}

export function solveKuppel(p: KuppelParams, w: Weg = {}): KuppelSolution {
  if (p.variante === 'verteilung') {
    const summeEk = p.produkte.reduce((a, x) => a.plus(x.einzelkosten!), new Val(0));
    const kuppelkosten = w.einzelkostenNichtAbgezogen
      ? new Val(p.gesamtkosten)
      : new Val(p.gesamtkosten).minus(summeEk);
    const erloese = p.produkte.map((x) => new Val(x.preis!).times(x.menge));
    const summeErloese = erloese.reduce((a, b) => a.plus(b), new Val(0));
    const kostenJeEuro = kuppelkosten.div(summeErloese).round();
    const stueckKuppel = p.produkte.map((x) => kostenJeEuro.times(dec(x.preis!)).round());
    const stueckEinzel = p.produkte.map((x) => new Val(x.einzelkosten!).div(x.menge).round());
    const stueckSelbst = stueckKuppel.map((k, i) =>
      w.einzelkostenVergessen ? k : k.plus(stueckEinzel[i]!),
    );
    const selbstSorte = stueckSelbst.map((k, i) => k.times(p.produkte[i]!.menge).round());
    return {
      kuppelkosten,
      erloese,
      summeErloese,
      kostenJeEuro,
      stueckKuppel,
      stueckEinzel,
      stueckSelbst,
      selbstSorte,
    };
  }
  const [haupt, ...neben] = p.produkte;
  const nettoerloese = neben.map((x) =>
    (w.wvkNichtAbgezogen ? new Val(x.preis!) : new Val(x.preis!).minus(x.wvk!)).times(x.menge),
  );
  const summe = nettoerloese.reduce((a, b) => a.plus(b), new Val(0));
  const restkosten = w.nebenerloesAddiert
    ? new Val(p.gesamtkosten).plus(summe)
    : new Val(p.gesamtkosten).minus(summe);
  return { nettoerloese, restkosten, hkHaupt: restkosten.div(haupt!.menge).round() };
}

function parts(p: KuppelParams, s: KuppelSolution): TaskPart[] {
  if (p.variante === 'restwert') {
    const neben = p.produkte.slice(1);
    return [
      {
        typ: 'rechenkette',
        id: 'restwert',
        titel: 'Restwertmethode',
        felder: [
          ...neben.map((x, i) =>
            feld(
              `nb-${i}`,
              `Abzug für ${x.name} ((Erlös − Weiterverarbeitung) × Menge)`,
              s.nettoerloese![i]!,
            ),
          ),
          feld('rest', `Restkosten des Hauptprodukts`, s.restkosten!),
          feld(
            'kh',
            `Herstellkosten je ${p.produkte[0]!.einheit} ${p.produkte[0]!.name}`,
            s.hkHaupt!,
            'satz',
            `€/${p.produkte[0]!.einheit}`,
          ),
        ],
      },
    ];
  }
  const zeilenE: TabellenZeile[] = p.produkte.map((x, i) => ({
    label: x.name,
    zellen: [
      { typ: 'fest', text: `${plain(x.menge)} ${x.einheit}` },
      { typ: 'fest', text: eur(x.preis!) },
      feld(`erloes-${i}`, `Erlös ${x.name}`, s.erloese![i]!),
    ],
  }));
  zeilenE.push({
    label: 'Summe',
    summe: true,
    zellen: [
      { typ: 'leer' },
      { typ: 'leer' },
      feld('erloes-summe', 'Summe der Erlöse', s.summeErloese!),
    ],
  });
  const zeilenS: TabellenZeile[] = p.produkte.map((x, i) => ({
    label: `${x.name} (je ${x.einheit})`,
    zellen: [
      feld(`kp-${i}`, `Stückkosten Kuppelprozess ${x.name}`, s.stueckKuppel![i]!),
      feld(`ek-${i}`, `Einzelkosten je Einheit ${x.name}`, s.stueckEinzel![i]!),
      feld(`sk-${i}`, `Selbstkosten je Einheit ${x.name}`, s.stueckSelbst![i]!),
      feld(`sks-${i}`, `Selbstkosten der Sorte ${x.name}`, s.selbstSorte![i]!),
    ],
  }));
  return [
    {
      typ: 'rechenkette',
      id: 'kuppel',
      titel: 'Kosten des Kuppelprozesses',
      felder: [feld('kuppel', 'Kosten des eigentlichen Kuppelprozesses', s.kuppelkosten!)],
    },
    {
      typ: 'tabelle',
      id: 'erloese',
      titel: 'Erlöse als Verteilungsbasis',
      spalten: ['Menge', 'Marktpreis', 'Erlös'],
      zeilen: zeilenE,
    },
    {
      typ: 'rechenkette',
      id: 'satz',
      titel: 'Kosten je € Erlös',
      felder: [
        feld('k', 'Kosten des Kuppelprozesses je € Erlös', s.kostenJeEuro!, 'satz', '€ je € Erlös'),
      ],
    },
    {
      typ: 'tabelle',
      id: 'stueck',
      titel: 'Stück- und Sortenkosten',
      spalten: [
        'Stückkosten Kuppelprozess',
        'Einzelkosten je Einheit',
        'Selbstkosten je Einheit',
        'Selbstkosten der Sorte',
      ],
      zeilen: zeilenS,
      hinweis: `Kontrolle: Die Selbstkosten aller Sorten ergeben zusammen ${eur(p.gesamtkosten)}.`,
    },
  ];
}

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August'];

interface Vorlage {
  name: string;
  einheit: string;
  menge: [number, number, number];
  preis: [number, number, number];
  /** Verteilung: Einzelkosten je Einheit (Weiterverarbeitung); Restwert: Weiterverarbeitungskosten */
  wvk: [number, number, number];
}

const ZITRUS: Vorlage[] = [
  {
    name: 'Zitronensaft',
    einheit: 'hl',
    menge: [800, 3_000, 50],
    preis: [80, 160, 1],
    wvk: [8, 20, 0.5],
  },
  {
    name: 'Zitronenöl',
    einheit: 'kg',
    menge: [200, 1_200, 10],
    preis: [20, 60, 0.5],
    wvk: [2, 8, 0.25],
  },
  {
    name: 'Fruchtfasern',
    einheit: 't',
    menge: [20, 120, 1],
    preis: [300, 900, 10],
    wvk: [30, 90, 5],
  },
  {
    name: 'Zitrustrester',
    einheit: 't',
    menge: [100, 400, 5],
    preis: [20, 60, 1],
    wvk: [2, 8, 0.5],
  },
];
const BRAUEREI: Vorlage[] = [
  {
    name: 'Biertreber',
    einheit: 't',
    menge: [300, 1_500, 10],
    preis: [25, 60, 0.5],
    wvk: [5, 20, 0.5],
  },
  {
    name: 'Überschusshefe',
    einheit: 'kg',
    menge: [2_000, 10_000, 100],
    preis: [1.5, 6, 0.1],
    wvk: [0.3, 1.2, 0.1],
  },
  {
    name: 'Rückgewonnene Kohlensäure',
    einheit: 't',
    menge: [50, 300, 5],
    preis: [80, 200, 1],
    wvk: [20, 60, 1],
  },
];

const nice = (r: Rng, [min, max, step]: [number, number, number]): Dec =>
  dec(r.step(Math.round(min * 100), Math.round(max * 100), Math.round(step * 100))).div(100);
const ganz = (r: Rng, [min, max, step]: [number, number, number]) => r.step(min, max, step);

function genVerteilung(rng: Rng, krumm: boolean, monat: string): KuppelParams {
  return retry(
    rng,
    (r) => {
      const vorlagen = r.chance(0.5) ? ZITRUS.slice(0, 3) : ZITRUS;
      const k = dec(r.pick(['0.5', '0.55', '0.6', '0.64', '0.65', '0.7', '0.72', '0.75', '0.8']));
      let summeE = dec(0);
      let summeEk = dec(0);
      const produkte: KuppelProdukt[] = vorlagen.map((v) => {
        const menge = ganz(r, v.menge);
        const preis = nice(r, v.preis);
        const ek = krumm ? dec(betrag(r, 500, 40_000, 1, true)) : nice(r, v.wvk).times(menge);
        summeE = summeE.plus(preis.times(menge));
        summeEk = summeEk.plus(ek);
        return {
          name: v.name,
          einheit: v.einheit,
          menge,
          preis: preis.toString(),
          einzelkosten: ek.toFixed(2),
        };
      });
      return {
        variante: 'verteilung' as const,
        monat,
        gesamtkosten: k.times(summeE).plus(summeEk).toFixed(2),
        produkte,
      };
    },
    (p) => {
      const s = solveKuppel(p);
      if (!isExact(s.kostenJeEuro!.exact)) return false;
      return krumm || [...s.stueckKuppel!, ...s.stueckEinzel!].every((x) => isExact(x.exact));
    },
  );
}

function genRestwert(rng: Rng, krumm: boolean, monat: string): KuppelParams {
  return retry(
    rng,
    (r) => {
      const hp: KuppelProdukt = {
        name: 'Almeblick Tequila-Bier',
        einheit: 'hl',
        menge: r.step(4_000, 15_000, 100),
      };
      const neben: KuppelProdukt[] = (r.chance(0.5) ? BRAUEREI.slice(0, 2) : BRAUEREI).map((v) => {
        const preis = nice(r, v.preis);
        let wvk = nice(r, v.wvk);
        if (wvk.gte(preis)) wvk = preis.div(2).toDecimalPlaces(2);
        return {
          name: v.name,
          einheit: v.einheit,
          menge: ganz(r, v.menge),
          preis: preis.toString(),
          wvk: wvk.toString(),
        };
      });
      const summe = neben.reduce(
        (a, x) => a.plus(dec(x.preis!).minus(x.wvk!).times(x.menge)),
        dec(0),
      );
      const gesamt = krumm
        ? summe.plus(betrag(r, 150_000, 900_000, 1, true))
        : nice(r, [25, 70, 0.5]).times(hp.menge).plus(summe);
      return {
        variante: 'restwert' as const,
        monat,
        gesamtkosten: gesamt.toFixed(2),
        produkte: [hp, ...neben],
      };
    },
    (p) => krumm || isExact(solveKuppel(p).hkHaupt!.exact),
  );
}

export const kuppel = defineGenerator<KuppelParams, KuppelSolution>({
  skillId: 'J6-kuppel',
  titel: 'Kuppelproduktkalkulation',
  variants: ['verteilung', 'restwert'],
  points: 6,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const variante =
      (opts.variant as KuppelVariante | undefined) ??
      rng.pick<KuppelVariante>(['verteilung', 'restwert']);
    const monat = rng.pick(MONATE);
    return variante === 'verteilung'
      ? genVerteilung(rng, krumm, monat)
      : genRestwert(rng, krumm, monat);
  },
  render: (p) => {
    if (p.variante === 'verteilung') {
      return {
        titel: 'Kuppelkalkulation: Verteilungsmethode',
        kontext: 'Zitrusverarbeitung für Senne Lemon',
        sachverhalt: [
          `Beim Pressen der Zitronen für Senne Lemon entstehen zwangsläufig mehrere Produkte zugleich. Keines davon ist eindeutig das Haupt- oder ein Nebenprodukt. Im ${p.monat} betragen die Gesamtkosten ${eur(p.gesamtkosten)}.`,
          'Darin enthalten sind die Einzelkosten der Weiterverarbeitung je Sorte. Die Kosten des eigentlichen Kuppelprozesses werden nach den Marktpreisen verteilt.',
        ],
        daten: {
          spalten: ['Produkt', 'Menge', 'Marktpreis je Einheit', 'Einzelkosten der Sorte'],
          zeilen: p.produkte.map((x) => [
            x.name,
            `${plain(x.menge)} ${x.einheit}`,
            eur(x.preis!),
            eur(x.einzelkosten!),
          ]),
        },
        aufgabe:
          'Ermittle die Kosten des Kuppelprozesses, die Kosten je € Erlös sowie Stück- und Sortenselbstkosten.',
      };
    }
    const [hp, ...neben] = p.produkte;
    return {
      titel: 'Kuppelkalkulation: Restwertmethode',
      kontext: 'Brauerei der MBG',
      sachverhalt: [
        `Beim Brauen von ${hp!.name} fallen zwangsläufig Nebenprodukte an. Hauptprodukt ist das Bier: ${plain(hp!.menge)} ${hp!.einheit} im ${p.monat}. Die Kosten des Kuppelprozesses betragen ${eur(p.gesamtkosten)}.`,
        'Die Nebenprodukte werden nach einer Aufbereitung verkauft:',
      ],
      daten: {
        spalten: ['Nebenprodukt', 'Menge', 'Erlös je Einheit', 'Weiterverarbeitung je Einheit'],
        zeilen: neben.map((x) => [
          x.name,
          `${plain(x.menge)} ${x.einheit}`,
          eur(x.preis!),
          eur(x.wvk!),
        ]),
      },
      aufgabe: `Ermittle nach der Restwertmethode die Herstellkosten je ${hp!.einheit} des Hauptprodukts.`,
    };
  },
  solve: (p) => solveKuppel(p),
  parts,
  steps: (p, s) => {
    if (p.variante === 'restwert') {
      const [hp, ...neben] = p.produkte;
      return [
        ...neben.map((x, i) => ({
          titel: x.name,
          rechnung: `(${eur(x.preis!)} − ${eur(x.wvk!)}) × ${plain(x.menge)} = ${eur(s.nettoerloese![i]!)}`,
          erlaeuterung:
            'Nur was nach der Weiterverarbeitung übrig bleibt, entlastet das Hauptprodukt.',
        })),
        {
          titel: 'Restkosten des Hauptprodukts',
          rechnung: `${eur(p.gesamtkosten)} − ${s.nettoerloese!.map((x) => eur(x)).join(' − ')} = ${eur(s.restkosten!)}`,
        },
        {
          titel: 'Herstellkosten je Einheit',
          rechnung: `${eur(s.restkosten!)} ÷ ${plain(hp!.menge)} ${hp!.einheit} = ${eur(s.hkHaupt!)}`,
        },
      ];
    }
    return [
      {
        titel: 'Kosten des Kuppelprozesses',
        rechnung: `${eur(p.gesamtkosten)} − ${p.produkte.map((x) => eur(x.einzelkosten!)).join(' − ')} = ${eur(s.kuppelkosten!)}`,
        erlaeuterung: 'Die Einzelkosten der Sorten gehören nicht zum gemeinsamen Prozess.',
      },
      {
        titel: 'Kosten je € Erlös',
        rechnung: `${eur(s.kuppelkosten!)} ÷ ${eur(s.summeErloese!)} = ${plain(s.kostenJeEuro!.value)}`,
        erlaeuterung: 'Die Marktpreise wirken wie Äquivalenzziffern.',
      },
      {
        titel: 'Selbstkosten je Einheit',
        rechnung: p.produkte
          .map(
            (x, i) =>
              `${x.name}: ${plain(s.kostenJeEuro!.value)} × ${eur(x.preis!)} + ${eur(s.stueckEinzel![i]!)} = ${eur(s.stueckSelbst![i]!)}`,
          )
          .join('; '),
      },
    ];
  },
  hints: (p, s) =>
    p.variante === 'verteilung'
      ? [
          'Verteilungsmethode: wie Äquivalenzziffern, die Marktpreise sind die Ziffern.',
          `Zuerst die Einzelkosten abziehen: Kosten des Kuppelprozesses ${eur(s.kuppelkosten!)}.`,
          `Kosten je € Erlös = Kosten des Kuppelprozesses ÷ Summe der Erlöse (${eur(s.summeErloese!)}).`,
        ]
      : [
          'Restwertmethode: Die Nebenprodukte entlasten das Hauptprodukt um ihren Nettoerlös.',
          'Nettoerlös je Nebenprodukt = (Erlös − Weiterverarbeitungskosten je Einheit) × Menge.',
          `Restkosten ${eur(s.restkosten!)} ÷ Menge des Hauptprodukts.`,
        ],
  errorVariants: (p) => {
    const out: ErrorVariant[] = [];
    const add = (fehlertyp: string, w: Weg) =>
      out.push({ fehlertyp, parts: parts(p, solveKuppel(p, w)) });
    if (p.variante === 'verteilung') {
      add('einzelkosten-nicht-abgezogen', { einzelkostenNichtAbgezogen: true });
      add('einzelkosten-vergessen', { einzelkostenVergessen: true });
    } else {
      add('weiterverarbeitung-nicht-abgezogen', { wvkNichtAbgezogen: true });
      add('nebenerloes-addiert', { nebenerloesAddiert: true });
    }
    return out;
  },
  verfahren: (p) =>
    p.variante === 'verteilung'
      ? 'Kuppelkalkulation nach der Verteilungsmethode (Marktpreise als Äquivalenzziffern)'
      : 'Kuppelkalkulation nach der Restwertmethode (Haupt- und Nebenprodukte)',
});
