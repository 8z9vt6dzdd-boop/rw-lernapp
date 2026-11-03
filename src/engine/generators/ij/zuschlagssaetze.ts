// I6 – Zuschlagssätze für die Hauptkostenstellen, Normalzuschläge, Über-/Unterdeckung
// (K2 Kap. 1.4.3 und 1.4.4).
// Ist-Zuschlagssatz = Istgemeinkosten der Stelle ÷ Bezugsbasis × 100:
//   Material auf Fertigungsmaterial, Fertigung auf Fertigungslöhne,
//   Verwaltung und Vertrieb auf die Herstellkosten des Umsatzes
//   (Herstellkosten der Periode − Bestandserhöhungen + Bestandsminderungen).
// Normalgemeinkosten = Normalzuschlagssatz × Bezugsbasis; Verwaltung und Vertrieb auf die
// Normal-Herstellkosten des Umsatzes [ANNAHME – bitte prüfen, docs/m7/ij.md].
// Über-/Unterdeckung = Normalgemeinkosten − Istgemeinkosten; positiv = Überdeckung
// [ANNAHME – bitte prüfen, docs/m7/ij.md].
import { FIRMA } from '../../../config';
import { Val, dec, formatNumber, sum } from '../../money';
import type { Rng } from '../../rng';
import type { AuswahlFeld, ErrorVariant, Feld, TaskPart, TaskText } from '../../task';
import { defineGenerator, eur, feld, isKrumm, pct, retry } from '../base';

export type ZsVariante = 'ist-saetze' | 'deckung';

export interface Bestandsveraenderung {
  art: 'mehr' | 'minder';
  erzeugnis: 'unfertige' | 'fertige';
  betrag: string;
}

export interface GkSaetze {
  mgk: string;
  /** je Fertigungsstelle */
  fgk: string[];
  vwgk: string;
  vtgk: string;
}

export interface ZsParams {
  variante: ZsVariante;
  monat: string;
  fm: string;
  fertigung: { name: string; fl: string }[];
  /** Istgemeinkosten der Hauptkostenstellen aus dem BAB (€) */
  ist: GkSaetze;
  bestand: Bestandsveraenderung[];
  /** Normalzuschlagssätze als Dezimal-Strings (nur Variante „deckung“) */
  normal?: GkSaetze;
}

export interface DeckungsZeile {
  id: string;
  stelle: string;
  ist: Val;
  normal: Val;
  /** Normal − Ist (positiv = Überdeckung) */
  differenz: Val;
}

export interface ZsSolution {
  hkPeriode: Val;
  hkUmsatz: Val;
  /** Ist-Zuschlagssätze in Prozentpunkten */
  satz: { mgk: Val; fgk: Val[]; vwgk: Val; vtgk: Val };
  normal?: {
    mgk: Val;
    fgk: Val[];
    hkPeriode: Val;
    hkUmsatz: Val;
    vwgk: Val;
    vtgk: Val;
  };
  deckung?: DeckungsZeile[];
  deckungGesamt?: Val;
}

interface ZsWeg {
  bestandVorzeichenFalsch?: boolean;
  ohneBestand?: boolean;
  vtAufHkPlusVw?: boolean;
  normalAufIstBasis?: boolean;
  deckungVertauscht?: boolean;
}

function bestandSaldo(p: ZsParams, w: ZsWeg): Val {
  if (w.ohneBestand) return new Val(0);
  // Herstellkosten des Umsatzes = HK der Periode − Mehrbestand + Minderbestand
  return sum(
    p.bestand.map((b) => {
      const v = new Val(b.betrag);
      const abziehen = (b.art === 'mehr') !== Boolean(w.bestandVorzeichenFalsch);
      return abziehen ? v.neg() : v;
    }),
  );
}

const prozent = (gk: Val, basis: Val) => gk.div(basis).times(100).round();

export function solveZs(p: ZsParams, w: ZsWeg = {}): ZsSolution {
  const fm = new Val(p.fm);
  const fl = p.fertigung.map((f) => new Val(f.fl));
  const mgk = new Val(p.ist.mgk);
  const fgk = p.ist.fgk.map((x) => new Val(x));
  const hkPeriode = sum([fm, mgk, ...fl, ...fgk]);
  const hkUmsatz = hkPeriode.plus(bestandSaldo(p, w));
  const vwgk = new Val(p.ist.vwgk);
  const vtgk = new Val(p.ist.vtgk);
  const satz = {
    mgk: prozent(mgk, fm),
    fgk: fgk.map((g, i) => prozent(g, fl[i]!)),
    vwgk: prozent(vwgk, hkUmsatz),
    vtgk: prozent(vtgk, w.vtAufHkPlusVw ? hkUmsatz.plus(vwgk) : hkUmsatz),
  };
  const out: ZsSolution = { hkPeriode, hkUmsatz, satz };
  if (p.normal) {
    const n = p.normal;
    const nMgk = fm.times(dec(n.mgk)).round();
    const nFgk = fl.map((x, i) => x.times(dec(n.fgk[i]!)).round());
    const nHkPeriode = sum([fm, nMgk, ...fl, ...nFgk]);
    const nHkUmsatz = nHkPeriode.plus(bestandSaldo(p, w));
    const basis = w.normalAufIstBasis ? hkUmsatz : nHkUmsatz;
    const nVwgk = basis.times(dec(n.vwgk)).round();
    const nVtgk = basis.times(dec(n.vtgk)).round();
    out.normal = {
      mgk: nMgk,
      fgk: nFgk,
      hkPeriode: nHkPeriode,
      hkUmsatz: nHkUmsatz,
      vwgk: nVwgk,
      vtgk: nVtgk,
    };
    const k = FIRMA.kostenstellen;
    const zeile = (id: string, stelle: string, ist: Val, normal: Val): DeckungsZeile => ({
      id,
      stelle,
      ist,
      normal,
      differenz: w.deckungVertauscht ? ist.minus(normal) : normal.minus(ist),
    });
    out.deckung = [
      zeile('mgk', k.material, mgk, nMgk),
      ...p.fertigung.map((f, i) => zeile(`fgk-${i}`, f.name, fgk[i]!, nFgk[i]!)),
      zeile('vwgk', k.verwaltung, vwgk, nVwgk),
      zeile('vtgk', k.vertrieb, vtgk, nVtgk),
    ];
    out.deckungGesamt = sum(out.deckung.map((d) => d.differenz));
  }
  return out;
}

const UEBER = 'Überdeckung';
const UNTER = 'Unterdeckung';

function artFeld(id: string, label: string, d: Val): AuswahlFeld {
  return {
    typ: 'auswahl',
    id,
    label,
    optionen: [UEBER, UNTER],
    soll: d.isNegative() ? UNTER : UEBER,
  };
}

function fgkLabel(p: ZsParams, i: number): string {
  return p.fertigung.length > 1 ? ` ${p.fertigung[i]!.name}` : '';
}

export function zsParts(p: ZsParams, s: ZsSolution): TaskPart[] {
  if (p.variante === 'ist-saetze') {
    return [
      {
        typ: 'rechenkette',
        id: 'ist',
        titel: 'Ist-Zuschlagssätze',
        felder: [
          feld('mgk', 'Materialgemeinkostenzuschlag', s.satz.mgk, 'prozent'),
          ...p.fertigung.map((_, i) =>
            feld(
              `fgk-${i}`,
              `Fertigungsgemeinkostenzuschlag${fgkLabel(p, i)}`,
              s.satz.fgk[i]!,
              'prozent',
            ),
          ),
          feld('hk-periode', 'Herstellkosten der Periode', s.hkPeriode),
          feld('hk-umsatz', 'Herstellkosten des Umsatzes', s.hkUmsatz),
          feld('vwgk', 'Verwaltungsgemeinkostenzuschlag', s.satz.vwgk, 'prozent'),
          feld('vtgk', 'Vertriebsgemeinkostenzuschlag', s.satz.vtgk, 'prozent'),
        ],
      },
    ];
  }
  const n = s.normal!;
  const normalFelder: Feld[] = [
    feld('n-mgk', 'Normal-Materialgemeinkosten', n.mgk),
    ...p.fertigung.map((_, i) =>
      feld(`n-fgk-${i}`, `Normal-Fertigungsgemeinkosten${fgkLabel(p, i)}`, n.fgk[i]!),
    ),
    feld('n-hk-umsatz', 'Herstellkosten des Umsatzes (auf Normalkostenbasis)', n.hkUmsatz),
    feld('n-vwgk', 'Normal-Verwaltungsgemeinkosten', n.vwgk),
    feld('n-vtgk', 'Normal-Vertriebsgemeinkosten', n.vtgk),
  ];
  const deckungFelder: Feld[] = [
    ...s.deckung!.flatMap((d) => [
      feld(`d-${d.id}`, `Betrag ${d.stelle}`, d.differenz.abs()),
      artFeld(`d-${d.id}-art`, `Über- oder Unterdeckung ${d.stelle}`, d.differenz),
    ]),
    feld('d-gesamt', 'Betrag insgesamt', s.deckungGesamt!.abs()),
    artFeld('d-gesamt-art', 'Über- oder Unterdeckung insgesamt', s.deckungGesamt!),
  ];
  return [
    {
      typ: 'rechenkette',
      id: 'normal',
      titel: 'Verrechnete Normalgemeinkosten',
      felder: normalFelder,
    },
    {
      typ: 'rechenkette',
      id: 'deckung',
      titel: 'Über- und Unterdeckung (Normal − Ist)',
      felder: deckungFelder,
    },
  ];
}

// ---------- Generierung ----------

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni'];
const MGK = ['0.05', '0.08', '0.1', '0.12', '0.15', '0.2', '0.25'];
const FGK = ['0.8', '0.9', '1', '1.2', '1.25', '1.5', '1.6', '1.8', '2', '2.2', '2.5'];
const VWGK = ['0.06', '0.08', '0.1', '0.12', '0.15'];
const VTGK = ['0.03', '0.04', '0.05', '0.06', '0.08', '0.1'];

function bestaende(rng: Rng): Bestandsveraenderung[] {
  const n = rng.pick([0, 1, 1, 2, 2]);
  const erz = rng.shuffle(['unfertige', 'fertige'] as const).slice(0, n);
  return erz.map((erzeugnis) => ({
    art: rng.chance(0.5) ? 'mehr' : 'minder',
    erzeugnis,
    betrag: String(rng.step(2_000, 40_000, 1_000)),
  }));
}

function grund(rng: Rng, variante: ZsVariante) {
  const k = FIRMA.kostenstellen;
  const fertigung = rng.chance(0.35)
    ? [
        { name: k.fertigung1, fl: String(rng.step(40_000, 200_000, 1_000)) },
        { name: k.fertigung2, fl: String(rng.step(30_000, 150_000, 1_000)) },
      ]
    : [{ name: k.fertigung1, fl: String(rng.step(40_000, 300_000, 1_000)) }];
  return {
    variante,
    monat: rng.pick(MONATE),
    fm: String(rng.step(80_000, 600_000, 10_000)),
    fertigung,
    bestand: bestaende(rng),
  };
}

/** Einzelkosten + Gemeinkosten von Material und Fertigung ± Bestandsveränderungen */
function hkUmsatzAus(
  fm: string,
  mgk: string,
  fl: string[],
  fgk: string[],
  best: Bestandsveraenderung[],
) {
  const hk = sum([fm, mgk, ...fl, ...fgk]);
  return best.reduce((a, b) => (b.art === 'mehr' ? a.minus(b.betrag) : a.plus(b.betrag)), hk);
}

function generateIst(rng: Rng, krumm: boolean): ZsParams {
  const g = grund(rng, 'ist-saetze');
  const fl = g.fertigung.map((f) => f.fl);
  const gk = (basis: string | Val, satz: string) => {
    const glatt = Val.of(basis).times(dec(satz)).value;
    if (!krumm) return glatt.toFixed(2);
    // „krumm“: Istgemeinkosten weichen um bis zu ±3 % vom glatten Wert ab (auf Cent)
    const faktor = dec(1).plus(dec(rng.int(-300, 300)).div(10_000));
    return glatt.times(faktor).toDecimalPlaces(2).toFixed(2);
  };
  const mgk = gk(g.fm, rng.pick(MGK));
  const fgk = fl.map((x) => gk(x, rng.pick(FGK)));
  const hku = hkUmsatzAus(g.fm, mgk, fl, fgk, g.bestand);
  return {
    ...g,
    ist: { mgk, fgk, vwgk: gk(hku, rng.pick(VWGK)), vtgk: gk(hku, rng.pick(VTGK)) },
  };
}

function generateDeckung(rng: Rng, krumm: boolean): ZsParams {
  const g = grund(rng, 'deckung');
  const normal: GkSaetze = {
    mgk: rng.pick(MGK),
    fgk: g.fertigung.map(() => rng.pick(FGK)),
    vwgk: rng.pick(VWGK),
    vtgk: rng.pick(VTGK),
  };
  const p: ZsParams = {
    ...g,
    ist: { mgk: '0', fgk: g.fertigung.map(() => '0'), vwgk: '0', vtgk: '0' },
    normal,
  };
  const s = solveZs(p);
  const ab = (v: Val): string => {
    // Istgemeinkosten = Normal ± 1–10 %, glatt auf 10 € (krumm: auf Cent)
    const prozentAbw = rng.int(1, 10) * (rng.chance(0.5) ? 1 : -1);
    const roh = v.value.times(dec(100 + prozentAbw).div(100));
    return krumm
      ? roh
          .plus(dec(rng.int(1, 99)).div(100))
          .toDecimalPlaces(2)
          .toFixed(2)
      : roh.div(10).toDecimalPlaces(0).times(10).toFixed(2);
  };
  const n = s.normal!;
  p.ist = { mgk: ab(n.mgk), fgk: n.fgk.map(ab), vwgk: ab(n.vwgk), vtgk: ab(n.vtgk) };
  return p;
}

function bestandText(b: Bestandsveraenderung): string {
  return `${b.art === 'mehr' ? 'Mehrbestand' : 'Minderbestand'} an ${b.erzeugnis === 'fertige' ? 'fertigen' : 'unfertigen'} Erzeugnissen ${eur(b.betrag)}`;
}

export function renderZs(p: ZsParams): TaskText {
  const k = FIRMA.kostenstellen;
  const stellen = [k.material, ...p.fertigung.map((f) => f.name), k.verwaltung, k.vertrieb];
  const istWerte = [p.ist.mgk, ...p.ist.fgk, p.ist.vwgk, p.ist.vtgk];
  const einzel = [
    `Fertigungsmaterial ${eur(p.fm)}`,
    ...p.fertigung.map(
      (f) => `Fertigungslöhne${p.fertigung.length > 1 ? ` ${f.name}` : ''} ${eur(f.fl)}`,
    ),
  ].join(', ');
  const best =
    p.bestand.length === 0
      ? 'Bestandsveränderungen gab es in diesem Monat nicht.'
      : `Laut Inventur: ${p.bestand.map(bestandText).join('; ')}.`;
  const zeilen = stellen.map((st, i) => {
    const row = [st, formatNumber(istWerte[i]!)];
    if (p.normal) {
      const n = [p.normal.mgk, ...p.normal.fgk, p.normal.vwgk, p.normal.vtgk][i]!;
      row.push(pct(n));
    }
    return row;
  });
  return {
    titel: p.variante === 'ist-saetze' ? 'Ist-Zuschlagssätze bilden' : 'Über- und Unterdeckung',
    kontext: `${p.monat}: Zuschlagssätze aus dem BAB der MBG`,
    sachverhalt: [
      `Der BAB für den ${p.monat} ist fertig: Die Hauptkostenstellen (Endkostenstellen) tragen nach der Leistungsverrechnung die folgenden Istgemeinkosten.`,
      `Einzelkosten des Monats: ${einzel}. ${best}`,
      ...(p.normal
        ? [
            'Kalkuliert hat die MBG im laufenden Jahr mit Normalzuschlagssätzen (Durchschnitt der letzten zwölf Monate). Verwaltung und Vertrieb beziehen sich auf die Herstellkosten des Umsatzes, die mit den Normalgemeinkosten berechnet werden.',
          ]
        : []),
    ],
    daten: {
      spalten: p.normal
        ? ['Hauptkostenstelle', 'Istgemeinkosten (€)', 'Normalzuschlag']
        : ['Hauptkostenstelle', 'Istgemeinkosten (€)'],
      zeilen,
    },
    aufgabe:
      p.variante === 'ist-saetze'
        ? 'Ermittle die Ist-Zuschlagssätze in Prozent (auf 2 Nachkommastellen) sowie die Herstellkosten der Periode und des Umsatzes.'
        : 'Ermittle die verrechneten Normalgemeinkosten je Hauptkostenstelle und die Über- bzw. Unterdeckung je Stelle und insgesamt.',
  };
}

function zsVariants(p: ZsParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: ZsWeg) =>
    out.push({ fehlertyp, parts: zsParts(p, solveZs(p, w)) });
  if (p.bestand.length > 0) {
    add('bestandsveraenderung-vorzeichen', { bestandVorzeichenFalsch: true });
    add('hk-periode-statt-umsatz', { ohneBestand: true });
  }
  if (p.variante === 'ist-saetze') add('zuschlagsbasis-falsch', { vtAufHkPlusVw: true });
  else {
    add('ueber-unterdeckung-vertauscht', { deckungVertauscht: true });
    add('normal-auf-ist-basis', { normalAufIstBasis: true });
  }
  return out;
}

export const zuschlagssaetze = defineGenerator<ZsParams, ZsSolution>({
  skillId: 'I6-zuschlagssaetze',
  titel: 'Zuschlagssätze, Über- und Unterdeckung',
  variants: ['ist-saetze', 'deckung'],
  points: 8,
  generate: (rng, opts = {}) => {
    const variante: ZsVariante =
      opts.variant === 'ist-saetze' || opts.variant === 'deckung'
        ? opts.variant
        : rng.chance(0.5)
          ? 'ist-saetze'
          : 'deckung';
    const krumm = isKrumm(rng, opts.krummAnteil);
    return retry(
      rng,
      (r) => (variante === 'ist-saetze' ? generateIst(r, krumm) : generateDeckung(r, krumm)),
      (p) => {
        const s = solveZs(p);
        if (s.hkUmsatz.cmp(0) <= 0) return false;
        if (p.variante === 'deckung') {
          // keine Differenz von null (sonst ist Über/Unter nicht entscheidbar)
          return [...s.deckung!.map((d) => d.differenz), s.deckungGesamt!].every(
            (d) => !d.value.isZero(),
          );
        }
        return true;
      },
    );
  },
  render: (p) => renderZs(p),
  solve: (p) => solveZs(p),
  parts: zsParts,
  steps: (p, s) => {
    const best = p.bestand.map((b) => `${b.art === 'mehr' ? '−' : '+'} ${eur(b.betrag)}`).join(' ');
    const hkSchritt = {
      titel: 'Herstellkosten des Umsatzes',
      rechnung: `${eur(s.hkPeriode)}${best ? ` ${best}` : ''} = ${eur(s.hkUmsatz)}`,
      erlaeuterung:
        'Herstellkosten der Periode = Fertigungsmaterial + Materialgemeinkosten + Fertigungslöhne + Fertigungsgemeinkosten. Mehrbestände abziehen (noch nicht verkauft), Minderbestände addieren (aus dem Lager verkauft).',
    };
    if (p.variante === 'ist-saetze') {
      return [
        {
          titel: 'Material und Fertigung',
          rechnung: [
            `MGK: ${eur(p.ist.mgk)} ÷ ${eur(p.fm)} × 100 = ${formatNumber(s.satz.mgk)} %`,
            ...p.fertigung.map(
              (f, i) =>
                `FGK${fgkLabel(p, i)}: ${eur(p.ist.fgk[i]!)} ÷ ${eur(f.fl)} × 100 = ${formatNumber(s.satz.fgk[i]!)} %`,
            ),
          ].join('; '),
          erlaeuterung: 'Zuschlagssatz = Gemeinkosten der Stelle ÷ Zuschlagsbasis × 100.',
        },
        hkSchritt,
        {
          titel: 'Verwaltung und Vertrieb',
          rechnung: `VwGK: ${eur(p.ist.vwgk)} ÷ ${eur(s.hkUmsatz)} × 100 = ${formatNumber(s.satz.vwgk)} %; VtGK: ${eur(p.ist.vtgk)} ÷ ${eur(s.hkUmsatz)} × 100 = ${formatNumber(s.satz.vtgk)} %`,
          erlaeuterung: 'Beide beziehen sich auf die Herstellkosten des Umsatzes.',
        },
      ];
    }
    const n = s.normal!;
    return [
      {
        titel: 'Normalgemeinkosten Material und Fertigung',
        rechnung: [
          `${eur(p.fm)} × ${pct(p.normal!.mgk)} = ${eur(n.mgk)}`,
          ...p.fertigung.map(
            (f, i) => `${eur(f.fl)} × ${pct(p.normal!.fgk[i]!)} = ${eur(n.fgk[i]!)}`,
          ),
        ].join('; '),
        erlaeuterung:
          'Verrechnet wird mit den Normalzuschlagssätzen auf die tatsächlichen Einzelkosten.',
      },
      {
        ...hkSchritt,
        rechnung: `${eur(n.hkPeriode)}${best ? ` ${best}` : ''} = ${eur(n.hkUmsatz)}`,
        titel: 'Herstellkosten des Umsatzes (Normal)',
      },
      {
        titel: 'Normalgemeinkosten Verwaltung und Vertrieb',
        rechnung: `${eur(n.hkUmsatz)} × ${pct(p.normal!.vwgk)} = ${eur(n.vwgk)}; ${eur(n.hkUmsatz)} × ${pct(p.normal!.vtgk)} = ${eur(n.vtgk)}`,
      },
      {
        titel: 'Über- und Unterdeckung',
        rechnung: s
          .deckung!.map(
            (d) => `${d.stelle}: ${eur(d.normal)} − ${eur(d.ist)} = ${eur(d.differenz)}`,
          )
          .join('; '),
        erlaeuterung: `Normal größer als Ist: Überdeckung (zu viel verrechnet). Normal kleiner als Ist: Unterdeckung (zu wenig verrechnet). Insgesamt ${eur(s.deckungGesamt!.abs())} ${s.deckungGesamt!.isNegative() ? UNTER : UEBER}.`,
      },
    ];
  },
  hints: (p, s) =>
    p.variante === 'ist-saetze'
      ? [
          'Zuschlagssatz = Istgemeinkosten der Stelle ÷ Zuschlagsbasis × 100.',
          'Material auf Fertigungsmaterial, Fertigung auf Fertigungslöhne, Verwaltung und Vertrieb auf die Herstellkosten des Umsatzes.',
          `Herstellkosten der Periode ${eur(s.hkPeriode)}; davon Mehrbestände abziehen, Minderbestände addieren.`,
        ]
      : [
          'Normalgemeinkosten = Normalzuschlagssatz × tatsächliche Zuschlagsbasis. Danach mit den Istgemeinkosten vergleichen.',
          'Für Verwaltung und Vertrieb brauchst du die Herstellkosten des Umsatzes – gerechnet mit den Normalgemeinkosten von Material und Fertigung.',
          `Normal − Ist: positiv heißt Überdeckung, negativ Unterdeckung. Material: ${eur(s.normal!.mgk)} − ${eur(p.ist.mgk)}.`,
        ],
  errorVariants: zsVariants,
  verfahren: (p) =>
    p.variante === 'ist-saetze'
      ? 'Ist-Zuschlagssätze aus dem BAB bilden (Basis Herstellkosten des Umsatzes)'
      : 'Normalgemeinkosten verrechnen und Über-/Unterdeckung ermitteln',
});
