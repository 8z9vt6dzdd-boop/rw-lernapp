// H6 – Kalkulatorische Wagnisse (K1 Kap. 2.4.3) sowie kalkulatorischer Unternehmerlohn und
// kalkulatorische Miete als Zusatzkosten (K1 Kap. 2.3 und Kap. 1). Wagnissatz = Schäden der
// Vergangenheit ÷ Bezugsbasis der Vergangenheit; Wagniskosten = Wagnissatz × aktuelle Bezugsbasis.
import { Val, dec } from '../../money';
import type { ErrorVariant, SolutionStep, TaskPart, WahlPart } from '../../task';
import { defineGenerator, eur, feld, isKrumm, pct, plain } from '../base';

export type WagnisArt = 'bestaende' | 'gewaehrleistung' | 'vertrieb' | 'fertigung';
export type WagnisVariante = WagnisArt | 'zusatzkosten';

export interface WagnisParams {
  variante: WagnisVariante;
  /** Wagnisvarianten: Bezugsbasis der Vorjahre und Schäden insgesamt */
  basisJahre?: string[];
  schaeden?: string;
  /** Bezugsbasis des laufenden Jahres */
  basisAktuell?: string;
  /** Zusatzkosten: vergleichbares Monatsgehalt je mitarbeitendem Gesellschafter */
  gehaelter?: string[];
  flaeche?: number;
  /** ortsübliche Monatsmiete je m² */
  mieteQm?: string;
}

export interface WagnisSolution {
  summeBasis?: Val;
  satz?: Val;
  wagnis?: Val;
  lohnMonat?: Val;
  lohnJahr?: Val;
  mieteMonat?: Val;
  mieteJahr?: Val;
  zusatzJahr?: Val;
}

interface Rechenweg {
  ungewichtet?: boolean;
  nurEiner?: boolean;
  ohneZwoelf?: boolean;
}

export function solveWagnis(p: WagnisParams, w: Rechenweg = {}): WagnisSolution {
  if (p.variante === 'zusatzkosten') {
    const g = w.nurEiner ? p.gehaelter!.slice(0, 1) : p.gehaelter!;
    const lohnMonat = g.reduce((a, x) => a.plus(x), new Val(0));
    const mieteMonat = new Val(p.mieteQm!).times(p.flaeche!);
    const f = w.ohneZwoelf ? 1 : 12;
    const lohnJahr = lohnMonat.times(f);
    const mieteJahr = mieteMonat.times(f);
    return { lohnMonat, lohnJahr, mieteMonat, mieteJahr, zusatzJahr: lohnJahr.plus(mieteJahr) };
  }
  const summeBasis = p.basisJahre!.reduce((a, x) => a.plus(x), new Val(0));
  // Fehler „ungewichtet“: Schäden durch den Durchschnitt statt durch die Summe der Basis geteilt
  const nenner = w.ungewichtet ? summeBasis.div(p.basisJahre!.length) : summeBasis;
  const satz = new Val(p.schaeden!).div(nenner).round(4);
  return { summeBasis, satz, wagnis: satz.times(p.basisAktuell!).round() };
}

const ART: Record<
  WagnisArt,
  { name: string; basis: string; spalte: string; schaden: string; einheitBasis: string }
> = {
  bestaende: {
    name: 'Beständewagnis',
    basis: 'der durchschnittliche Lagerbestand',
    spalte: 'Durchschnittlicher Lagerbestand',
    schaden: 'Verluste durch Schwund, Verderb und abgelaufenes Mindesthaltbarkeitsdatum',
    einheitBasis: 'Lagerbestand',
  },
  gewaehrleistung: {
    name: 'Gewährleistungswagnis',
    basis: 'die Umsatzerlöse',
    spalte: 'Umsatzerlöse',
    schaden:
      'Kosten für Ersatzlieferungen wegen undichter Dosen und Gutschriften aus Reklamationen',
    einheitBasis: 'Umsatz',
  },
  vertrieb: {
    name: 'Vertriebswagnis',
    basis: 'die Umsatzerlöse auf Ziel',
    spalte: 'Umsatzerlöse auf Ziel',
    schaden: 'Forderungsausfälle bei Gastronomiekunden',
    einheitBasis: 'Zielumsatz',
  },
  fertigung: {
    name: 'Fertigungswagnis',
    basis: 'die Herstellkosten',
    spalte: 'Herstellkosten',
    schaden: 'Kosten für Ausschuss (falsch befüllte und beschädigte Gebinde)',
    einheitBasis: 'Herstellkosten',
  },
};

const einordnung = (p: WagnisParams): WahlPart => {
  const zusatz = p.variante === 'zusatzkosten';
  return {
    typ: 'aufgabe-erkennen',
    id: 'einordnung',
    frage: zusatz
      ? 'Wie sind kalkulatorischer Unternehmerlohn und kalkulatorische Miete einzuordnen?'
      : 'Wie sind die kalkulatorischen Wagniskosten einzuordnen?',
    optionen: [
      {
        id: 'zusatz',
        text: 'Zusatzkosten: In der Finanzbuchhaltung steht ihnen kein Aufwand gegenüber.',
        richtig: zusatz,
        ...(zusatz
          ? {}
          : {
              fehlertyp: 'wagnis-als-zusatzkosten',
              erklaerung:
                'Den Wagniskosten stehen in der Finanzbuchhaltung die tatsächlichen Schadensfälle als Aufwand gegenüber – nur in anderer Höhe. Deshalb sind sie Anderskosten.',
            }),
      },
      {
        id: 'anders',
        text: 'Anderskosten: Dem Aufwand der Finanzbuchhaltung steht ein Kostenansatz in anderer Höhe gegenüber.',
        richtig: !zusatz,
        ...(zusatz
          ? {
              fehlertyp: 'zusatzkosten-als-anderskosten',
              erklaerung:
                'Für Unternehmerlohn und Miete der eigenen Räume der Gesellschafter wird in der Personengesellschaft gar kein Aufwand gebucht. Kosten ohne Aufwand sind Zusatzkosten.',
            }
          : {}),
      },
      {
        id: 'grund',
        text: 'Grundkosten: Aufwand und Kosten sind gleich hoch.',
        richtig: false,
        erklaerung:
          'Grundkosten übernehmen den Aufwand unverändert. Kalkulatorische Kosten entstehen gerade, weil der Kostenansatz abweicht oder ganz fehlt.',
      },
      {
        id: 'neutral',
        text: 'Neutraler Aufwand: Er gehört nicht in die Kostenrechnung.',
        richtig: false,
        erklaerung:
          'Neutraler Aufwand ist betriebsfremd, periodenfremd oder außerordentlich. Kalkulatorische Kosten sollen dagegen gerade in die Kostenrechnung.',
      },
    ],
  };
};

function parts(p: WagnisParams, s: WagnisSolution): TaskPart[] {
  if (p.variante === 'zusatzkosten')
    return [
      {
        typ: 'rechenkette',
        id: 'zusatz',
        titel: 'Zusatzkosten',
        felder: [
          feld('lohnmonat', 'Kalkulatorischer Unternehmerlohn pro Monat', s.lohnMonat!),
          feld('lohnjahr', 'Kalkulatorischer Unternehmerlohn pro Jahr', s.lohnJahr!),
          feld('mietemonat', 'Kalkulatorische Miete pro Monat', s.mieteMonat!),
          feld('mietejahr', 'Kalkulatorische Miete pro Jahr', s.mieteJahr!),
          feld('summe', 'Zusatzkosten pro Jahr', s.zusatzJahr!),
        ],
      },
      einordnung(p),
    ];
  const a = ART[p.variante];
  return [
    {
      typ: 'rechenkette',
      id: 'wagnis',
      titel: a.name,
      felder: [
        feld('summe', `Summe ${a.einheitBasis} der Vorjahre`, s.summeBasis!),
        feld('satz', 'Wagnissatz', s.satz!.times(100), 'prozent'),
        feld('wagnis', `Kalkulatorisches ${a.name} für das laufende Jahr`, s.wagnis!),
      ],
    },
    einordnung(p),
  ];
}

function variants(p: WagnisParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Rechenweg) =>
    out.push({ fehlertyp, parts: parts(p, solveWagnis(p, w)) });
  if (p.variante === 'zusatzkosten') {
    add('unternehmerlohn-nur-ein-gesellschafter', { nurEiner: true });
    add('zusatzkosten-monat-statt-jahr', { ohneZwoelf: true });
  } else add('wagnissatz-vom-durchschnitt', { ungewichtet: true });
  return out;
}

// Klausurfreundliche Wagnissätze (Dezimal) und Spannen der Bezugsbasis (in 1.000 €)
const SATZ: Record<WagnisArt, string[]> = {
  bestaende: ['0.012', '0.015', '0.018', '0.02', '0.025'],
  gewaehrleistung: ['0.004', '0.005', '0.006', '0.008'],
  vertrieb: ['0.003', '0.005', '0.006', '0.01'],
  fertigung: ['0.01', '0.012', '0.015', '0.02'],
};
const SPANNE: Record<WagnisArt, [number, number, number]> = {
  bestaende: [150, 400, 5],
  gewaehrleistung: [8_000, 14_000, 100],
  vertrieb: [3_000, 6_000, 50],
  fertigung: [5_000, 9_000, 100],
};

export const wagnisse = defineGenerator<WagnisParams, WagnisSolution>({
  skillId: 'H6-wagnisse',
  titel: 'Kalkulatorische Wagnisse und Zusatzkosten',
  variants: ['bestaende', 'gewaehrleistung', 'vertrieb', 'fertigung', 'zusatzkosten'],
  points: 4,
  generate: (rng, opts = {}) => {
    const variante =
      (opts.variant as WagnisVariante | undefined) ??
      rng.pick<WagnisVariante>([
        'bestaende',
        'bestaende',
        'gewaehrleistung',
        'vertrieb',
        'fertigung',
        'zusatzkosten',
        'zusatzkosten',
      ]);
    const krumm = isKrumm(rng, opts.krummAnteil);
    if (variante === 'zusatzkosten') {
      return {
        variante,
        gehaelter: [rng.step(6_000, 10_000, 250), rng.step(5_500, 9_500, 250)].map(String),
        flaeche: rng.step(200, 1_200, 50),
        mieteQm: rng.pick(['4.5', '5', '5.5', '6', '6.5', '7', '8']),
      };
    }
    const [min, max, step] = SPANNE[variante];
    const n = rng.int(4, 6);
    const basisJahre = Array.from({ length: n }, () => String(rng.step(min, max, step) * 1_000));
    const summe = basisJahre.reduce((a, x) => a.plus(x), dec(0));
    const satz = rng.pick(SATZ[variante]);
    const schaeden = krumm
      ? summe
          .times(satz)
          .times(dec(rng.int(90, 110)).div(100))
          .toDecimalPlaces(0)
          .toFixed(0)
      : summe.times(satz).toDecimalPlaces(0).toFixed(0);
    const basisAktuell = String(rng.step(min, max, step) * 1_000);
    return { variante, basisJahre, schaeden, basisAktuell };
  },
  render: (p, firma) => {
    if (p.variante === 'zusatzkosten') {
      const [f, s] = firma.gesellschafter;
      return {
        titel: 'Kalkulatorischer Unternehmerlohn und kalkulatorische Miete',
        kontext: 'Januar Folgejahr: Controlling baut die Kostenrechnung auf',
        sachverhalt: [
          `${f} und ${s} arbeiten beide voll in der MBG mit, beziehen als Gesellschafter der OHG aber kein Gehalt. Für vergleichbare Positionen in der Getränkebranche wären monatlich ${eur(p.gehaelter![0]!)} (${f}) und ${eur(p.gehaelter![1]!)} (${s}) zu zahlen.`,
          `Außerdem nutzt die MBG eine Lagerhalle mit ${plain(p.flaeche!)} m², die den Gesellschaftern privat gehört und unentgeltlich überlassen wird. Die ortsübliche Miete beträgt ${eur(p.mieteQm!)} je m² und Monat.`,
        ],
        aufgabe:
          'Ermittle kalkulatorischen Unternehmerlohn und kalkulatorische Miete pro Monat und pro Jahr sowie die Zusatzkosten pro Jahr. Ordne die Kosten anschließend ein.',
      };
    }
    const a = ART[p.variante];
    return {
      titel: a.name,
      kontext: 'Januar Folgejahr: Controlling baut die Kostenrechnung auf',
      sachverhalt: [
        `Das Controlling der MBG will das ${a.name} aus Erfahrungswerten ansetzen. Bezugsbasis ist ${a.basis}.`,
        `In den letzten ${p.basisJahre!.length} Jahren entstanden ${a.schaden} von insgesamt ${eur(p.schaeden!)}. Für das laufende Jahr rechnet die MBG mit ${eur(p.basisAktuell!)} (${a.spalte}).`,
      ],
      daten: {
        spalten: ['Jahr', a.spalte],
        zeilen: p.basisJahre!.map((x, i) => [`Vorjahr ${p.basisJahre!.length - i}`, eur(x)]),
      },
      aufgabe:
        'Ermittle den Wagnissatz (in Prozent auf 2 Nachkommastellen) und das kalkulatorische Wagnis für das laufende Jahr. Ordne die Wagniskosten anschließend ein.',
    };
  },
  solve: (p) => solveWagnis(p),
  parts,
  steps: (p, s) => {
    if (p.variante === 'zusatzkosten')
      return [
        {
          titel: 'Kalkulatorischer Unternehmerlohn',
          rechnung: `${p.gehaelter!.map((g) => eur(g)).join(' + ')} = ${eur(s.lohnMonat!)} pro Monat; × 12 = ${eur(s.lohnJahr!)}`,
          erlaeuterung: 'Beide Gesellschafter arbeiten mit, also zählen beide Vergleichsgehälter.',
        },
        {
          titel: 'Kalkulatorische Miete',
          rechnung: `${plain(p.flaeche!)} m² × ${eur(p.mieteQm!)} = ${eur(s.mieteMonat!)} pro Monat; × 12 = ${eur(s.mieteJahr!)}`,
        },
        {
          titel: 'Zusatzkosten pro Jahr',
          rechnung: `${eur(s.lohnJahr!)} + ${eur(s.mieteJahr!)} = ${eur(s.zusatzJahr!)}`,
          erlaeuterung:
            'Kein Aufwand in der Finanzbuchhaltung, aber echter Werteverzehr (Opportunitätskosten): Zusatzkosten.',
        },
      ];
    const steps: SolutionStep[] = [
      {
        titel: 'Bezugsbasis der Vorjahre',
        rechnung: `${p.basisJahre!.map((x) => eur(x)).join(' + ')} = ${eur(s.summeBasis!)}`,
      },
      {
        titel: 'Wagnissatz',
        rechnung: `${eur(p.schaeden!)} ÷ ${eur(s.summeBasis!)} = ${pct(s.satz!.valueDp(4))}`,
        erlaeuterung:
          'Schäden insgesamt durch die Bezugsbasis insgesamt – beide über denselben Zeitraum.',
      },
      {
        titel: 'Wagnis für das laufende Jahr',
        rechnung: `${eur(p.basisAktuell!)} × ${pct(s.satz!.stepped)} = ${eur(s.wagnis!)}`,
        erlaeuterung: 'Wagniskosten sind Anderskosten und Gemeinkosten.',
      },
    ];
    return steps;
  },
  hints: (p) =>
    p.variante === 'zusatzkosten'
      ? [
          'In einer Personengesellschaft wird für die Mitarbeit der Gesellschafter kein Gehalt als Aufwand gebucht.',
          'Unternehmerlohn = Summe der vergleichbaren Monatsgehälter; Miete = Fläche × ortsübliche Miete je m².',
          'Jahreswerte: Monatswerte × 12.',
        ]
      : [
          'Wagnissatz = Schäden der Vergangenheit ÷ Bezugsbasis desselben Zeitraums.',
          'Erst alle Vorjahreswerte der Bezugsbasis addieren, dann teilen.',
          'Wagnis = Wagnissatz × Bezugsbasis des laufenden Jahres.',
        ],
  errorVariants: variants,
  verfahren: (p) =>
    p.variante === 'zusatzkosten'
      ? 'Kalkulatorischer Unternehmerlohn und kalkulatorische Miete (Zusatzkosten)'
      : `Kalkulatorisches Wagnis (${ART[p.variante].name})`,
});
