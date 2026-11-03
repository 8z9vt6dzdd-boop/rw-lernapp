// I2 – Betriebsabrechnungsbogen: Verteilung der primären Gemeinkosten (K2 Kap. 1.4.1).
// Kostenstelleneinzelkosten werden direkt nach Belegen zugeordnet, Kostenstellengemeinkosten
// über Mengen- oder Wertschlüssel: Anteil = Betrag × Schlüssel der Stelle ÷ Summe der Schlüssel.
// Rundungsdifferenzen einer Zeile werden in der Stelle mit dem größten Schlüssel ausgeglichen
// (03-aufgabentypen.md, I2), damit jede Zeile genau ihren Betrag verteilt.
import { FIRMA } from '../../../config';
import { Decimal, Val, dec, formatNumber, round, sum, type Dec } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, TabellenZeile, TaskPart, TaskText, Zelle } from '../../task';
import { betrag, defineGenerator, eur, feld, isKrumm, plain, retry } from '../base';

export type BabVariante = 'endkostenstellen' | 'mit-vorkostenstellen';

export type Verteilung =
  | { art: 'direkt'; grundlage: string; werte: string[] }
  | { art: 'schluessel'; grundlage: string; schluessel: string[] };

export interface BabZeile {
  kostenart: string;
  /** zu verteilender Betrag in € (Dezimal-String) */
  betrag: string;
  verteilung: Verteilung;
}

export interface BabParams {
  variante: BabVariante;
  monat: string;
  stellen: string[];
  /** Anzahl der Vorkostenstellen am Anfang von `stellen` (für den Text) */
  vorkostenstellen: number;
  zeilen: BabZeile[];
}

export interface BabSolution {
  /** Summe der Schlüsselgrößen je Zeile (null bei direkter Zuordnung) */
  schluesselSumme: (Dec | null)[];
  /** anteile[zeile][stelle] */
  anteile: Val[][];
  summen: Val[];
  gesamt: Val;
}

interface BabWeg {
  /** Schlüsselsumme ohne die erste Kostenstelle (bzw. ohne die Vorkostenstellen) */
  summeOhneErste?: boolean;
  /** Schlüssel der ersten beiden Schlüsselzeilen vertauscht */
  zeilenVertauscht?: boolean;
}

/**
 * Verteilt `betrag` im Verhältnis der Schlüssel. Exakter Pfad = auf Cent gerundete Anteile mit
 * Rundungsausgleich in der Stelle mit dem größten Schlüssel (dokumentierte Lösung); zweiter Pfad =
 * ungerundeter Anteil, damit auch einfach kaufmännisch gerundete Werte als richtig gelten.
 */
export function verteile(betragEuro: string, schluessel: readonly string[], nenner?: Dec): Val[] {
  const b = dec(betragEuro);
  const ks = schluessel.map((k) => dec(k));
  const summe = nenner ?? ks.reduce((a, k) => a.plus(k), new Decimal(0));
  const exakt = ks.map((k) => (summe.isZero() ? new Decimal(0) : b.times(k).div(summe)));
  const gerundet = exakt.map((x) => round(x, 2));
  if (!nenner) {
    const diff = b.minus(gerundet.reduce((a, x) => a.plus(x), new Decimal(0)));
    if (!diff.isZero()) {
      let gross = 0;
      ks.forEach((k, i) => {
        if (k.gt(ks[gross]!)) gross = i;
      });
      gerundet[gross] = gerundet[gross]!.plus(diff);
    }
  }
  return exakt.map((x, i) => {
    const r = gerundet[i]!;
    const steps = x.equals(round(x, 2)) && r.equals(x) ? 0 : 1;
    return new Val(r, x, steps);
  });
}

export function solveBab(p: BabParams, w: BabWeg = {}): BabSolution {
  const schluesselZeilen = p.zeilen
    .map((z, i) => ({ z, i }))
    .filter(({ z }) => z.verteilung.art === 'schluessel');
  const keysVon = (i: number): string[] => {
    const v = p.zeilen[i]!.verteilung;
    if (v.art !== 'schluessel') return [];
    if (w.zeilenVertauscht && schluesselZeilen.length >= 2) {
      const [a, b] = schluesselZeilen;
      const tausch = i === a!.i ? b!.z : i === b!.i ? a!.z : null;
      if (tausch && tausch.verteilung.art === 'schluessel') return tausch.verteilung.schluessel;
    }
    return v.schluessel;
  };
  const ohne = Math.max(1, p.vorkostenstellen);
  const schluesselSumme: (Dec | null)[] = p.zeilen.map((z, i) => {
    if (z.verteilung.art !== 'schluessel') return null;
    const ks = keysVon(i).map((k) => dec(k));
    const teil = w.summeOhneErste ? ks.slice(ohne) : ks;
    return teil.reduce((a, k) => a.plus(k), new Decimal(0));
  });
  const anteile = p.zeilen.map((z, i) => {
    if (z.verteilung.art === 'direkt') return z.verteilung.werte.map((x) => new Val(x));
    return verteile(z.betrag, keysVon(i), w.summeOhneErste ? schluesselSumme[i]! : undefined);
  });
  const summen = p.stellen.map((_, k) => sum(anteile.map((row) => row[k]!)));
  const gesamt = sum(p.zeilen.map((z) => z.betrag));
  return { schluesselSumme, anteile, summen, gesamt };
}

function nachkommastellen(xs: readonly string[]): number {
  return Math.max(0, ...xs.map((x) => (x.includes('.') ? x.split('.')[1]!.length : 0)));
}

function zeilenLabel(z: BabZeile): string {
  return `${z.kostenart} (${eur(z.betrag)})`;
}

export function babParts(p: BabParams, s: BabSolution): TaskPart[] {
  const felder = p.zeilen.flatMap((z, i) =>
    z.verteilung.art === 'schluessel'
      ? [
          feld(
            `ks-${i}`,
            `Summe der Schlüsselgrößen ${z.kostenart} (${z.verteilung.grundlage})`,
            s.schluesselSumme[i]!,
            'zahl',
            undefined,
            { dp: nachkommastellen(z.verteilung.schluessel) },
          ),
        ]
      : [],
  );
  const zeilen: TabellenZeile[] = p.zeilen.map((z, i) => ({
    label: zeilenLabel(z),
    zellen: p.stellen.map((st, k): Zelle =>
      z.verteilung.art === 'direkt'
        ? { typ: 'fest', text: formatNumber(z.verteilung.werte[k]!) }
        : feld(`a-${i}-${k}`, `${z.kostenart} ${st}`, s.anteile[i]![k]!),
    ),
  }));
  zeilen.push({
    label: 'Summe primäre Gemeinkosten',
    summe: true,
    zellen: p.stellen.map((st, k) => feld(`summe-${k}`, `Summe ${st}`, s.summen[k]!)),
  });
  return [
    { typ: 'rechenkette', id: 'schluessel', titel: 'Schlüsselsummen', felder },
    {
      typ: 'tabelle',
      id: 'bab',
      titel: 'Betriebsabrechnungsbogen: Verteilung der primären Gemeinkosten',
      spalten: p.stellen,
      zeilen,
      hinweis: `Kontrolle: Die Summenzeile ergibt zusammen alle primären Gemeinkosten (${eur(s.gesamt)}). Rundungsdifferenzen einer Zeile gleicht die Stelle mit dem größten Schlüssel aus.`,
    },
  ];
}

// ---------- Generierung ----------

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni'];

interface DirektVorlage {
  kostenart: string;
  grundlage: string;
  /** Spanne je Stelle in € */
  min: number;
  max: number;
  /** Die vorletzte Stelle (meist Verwaltung) darf leer ausgehen */
  nullErlaubt?: boolean;
}

interface SchluesselVorlage {
  kostenart: string;
  grundlage: string;
  /** zieht einen Schlüsselwert */
  wert: (rng: Rng) => string;
  /** Beträge je Schlüsseleinheit für glatte Aufgaben */
  saetze: string[];
}

const DIREKT: DirektVorlage[] = [
  { kostenart: 'Hilfsstoffe', grundlage: 'Materialentnahmescheine', min: 300, max: 9_000 },
  { kostenart: 'Hilfslöhne', grundlage: 'Lohnlisten', min: 1_000, max: 25_000, nullErlaubt: true },
  { kostenart: 'Gehälter', grundlage: 'Gehaltsliste', min: 3_000, max: 30_000 },
  { kostenart: 'Betriebsstoffe', grundlage: 'Materialentnahmescheine', min: 200, max: 6_000 },
];

const SCHLUESSEL: SchluesselVorlage[] = [
  {
    kostenart: 'Raumkosten',
    grundlage: 'Fläche in m²',
    wert: (r) => String(r.step(100, 1_500, 50)),
    saetze: ['5', '6', '8', '10', '12', '15', '20'],
  },
  {
    kostenart: 'Freiwillige Sozialkosten',
    grundlage: 'Zahl der Mitarbeiter',
    wert: (r) => String(r.int(3, 60)),
    saetze: ['50', '80', '100', '120', '150', '200'],
  },
  {
    kostenart: 'Kalkulatorische Abschreibungen',
    grundlage: 'Anlagenwerte in €',
    wert: (r) => String(r.step(20_000, 600_000, 10_000)),
    saetze: ['0.02', '0.025', '0.04', '0.05', '0.08', '0.1'],
  },
  {
    kostenart: 'Kalkulatorische Zinsen',
    grundlage: 'Schlüsselzahlen',
    wert: (r) => r.pick(['1', '1.5', '2', '2.5', '3', '4', '5', '6', '8']),
    saetze: ['400', '500', '600', '800', '1000', '1200', '1500'],
  },
  {
    kostenart: 'Versicherungen',
    grundlage: 'Schlüsselzahlen',
    wert: (r) => String(r.int(1, 9)),
    saetze: ['100', '150', '200', '250', '300', '400'],
  },
  {
    kostenart: 'Energiekosten',
    grundlage: 'Verbrauch in kWh',
    wert: (r) => String(r.step(500, 20_000, 500)),
    saetze: ['0.2', '0.25', '0.3', '0.4'],
  },
];

function stellenFuer(rng: Rng, variante: BabVariante): { stellen: string[]; vor: number } {
  const k = FIRMA.kostenstellen;
  if (variante === 'mit-vorkostenstellen') {
    return {
      stellen: [k.energie, k.instandhaltung, k.material, k.fertigung1, k.verwaltung, k.vertrieb],
      vor: 2,
    };
  }
  return rng.chance(0.5)
    ? { stellen: [k.material, k.fertigung1, k.verwaltung, k.vertrieb], vor: 0 }
    : { stellen: [k.material, k.fertigung1, k.fertigung2, k.verwaltung, k.vertrieb], vor: 0 };
}

function generateBab(rng: Rng, variante: BabVariante, krumm: boolean): BabParams {
  const { stellen, vor } = stellenFuer(rng, variante);
  const n = stellen.length;
  const direkt = rng.shuffle(DIREKT).slice(0, rng.int(1, 2));
  // Energiekosten als Kostenart nur ohne eigene Energie-Kostenstelle
  const pool = SCHLUESSEL.filter(
    (v) => variante === 'endkostenstellen' || v.kostenart !== 'Energiekosten',
  );
  const schl = rng.shuffle(pool).slice(0, rng.int(3, 4));
  const zeilen: BabZeile[] = [];
  for (const d of direkt) {
    const werte = stellen.map((_, k) =>
      d.nullErlaubt && k === n - 2 && rng.chance(0.4) ? '0' : betrag(rng, d.min, d.max, 100, krumm),
    );
    zeilen.push({
      kostenart: d.kostenart,
      betrag: sum(werte).value.toFixed(2),
      verteilung: { art: 'direkt', grundlage: d.grundlage, werte },
    });
  }
  for (const v of schl) {
    const schluessel = stellen.map(() => v.wert(rng));
    const summe = schluessel.reduce((a, k) => a.plus(k), new Decimal(0));
    const b = krumm
      ? betrag(rng, 3_000, 60_000, 1, true)
      : summe.times(rng.pick(v.saetze)).toFixed(2);
    zeilen.push({
      kostenart: v.kostenart,
      betrag: b,
      verteilung: { art: 'schluessel', grundlage: v.grundlage, schluessel },
    });
  }
  return { variante, monat: rng.pick(MONATE), stellen, vorkostenstellen: vor, zeilen };
}

function babVariants(p: BabParams): ErrorVariant[] {
  const out: ErrorVariant[] = [
    {
      fehlertyp: 'schluessel-falsch-summiert',
      parts: babParts(p, solveBab(p, { summeOhneErste: true })),
    },
  ];
  if (p.zeilen.filter((z) => z.verteilung.art === 'schluessel').length >= 2) {
    out.push({
      fehlertyp: 'zeile-vertauscht',
      parts: babParts(p, solveBab(p, { zeilenVertauscht: true })),
    });
  }
  return out;
}

function renderBab(p: BabParams): TaskText {
  const vor = p.stellen.slice(0, p.vorkostenstellen);
  const end = p.stellen.slice(p.vorkostenstellen);
  const stellenSatz =
    vor.length > 0
      ? `Die MBG führt die Vorkostenstellen (Hilfskostenstellen) ${vor.join(' und ')} sowie die Endkostenstellen (Hauptkostenstellen) ${end.join(', ')}.`
      : `Die MBG führt in diesem Monat nur Endkostenstellen (Hauptkostenstellen): ${end.join(', ')}.`;
  return {
    titel: 'BAB: primäre Gemeinkosten verteilen',
    kontext: `${p.monat}: Betriebsabrechnungsbogen der MBG im Werk ${FIRMA.ort}`,
    sachverhalt: [
      `Dr. Leni Brandt aus dem Controlling stellt den Betriebsabrechnungsbogen für den ${p.monat} auf. ${stellenSatz}`,
      'Fertigungsmaterial und Fertigungslöhne sind Einzelkosten und gehören nicht in diese Verteilung. Einige Gemeinkosten sind laut Beleg bereits einzelnen Stellen zugeordnet, die übrigen werden nach den angegebenen Schlüsseln verteilt:',
    ],
    daten: {
      spalten: ['Kostenart', 'Betrag (€)', 'Verteilungsgrundlage', ...p.stellen],
      zeilen: p.zeilen.map((z) => [
        z.kostenart,
        formatNumber(z.betrag),
        z.verteilung.grundlage,
        ...(z.verteilung.art === 'direkt'
          ? z.verteilung.werte.map((x) => (dec(x).isZero() ? '–' : formatNumber(x)))
          : z.verteilung.schluessel.map((x) => plain(x))),
      ]),
    },
    aufgabe:
      'Bilde für jede Schlüsselzeile die Summe der Schlüsselgrößen, verteile die Gemeinkosten auf die Kostenstellen (auf Cent gerundet) und ermittle die Summe der primären Gemeinkosten je Kostenstelle.',
  };
}

export const babVerteilung = defineGenerator<BabParams, BabSolution>({
  skillId: 'I2-bab-verteilung',
  titel: 'BAB: primäre Gemeinkosten verteilen',
  variants: ['endkostenstellen', 'mit-vorkostenstellen'],
  points: 10,
  generate: (rng, opts = {}) => {
    const variante: BabVariante =
      opts.variant === 'mit-vorkostenstellen' || opts.variant === 'endkostenstellen'
        ? opts.variant
        : rng.chance(0.5)
          ? 'mit-vorkostenstellen'
          : 'endkostenstellen';
    const krumm = isKrumm(rng, opts.krummAnteil);
    return retry(
      rng,
      (r) => generateBab(r, variante, krumm),
      (p) => {
        // Zwei Schlüsselzeilen dürfen nicht dieselbe Verteilung ergeben (sonst ist „vertauscht“ unsichtbar)
        const s = solveBab(p);
        const v = solveBab(p, { zeilenVertauscht: true });
        return s.summen.some((x, k) => !x.value.equals(v.summen[k]!.value));
      },
    );
  },
  render: (p) => renderBab(p),
  solve: (p) => solveBab(p),
  parts: babParts,
  steps: (p, s) => {
    const beispiel = p.zeilen.findIndex((z) => z.verteilung.art === 'schluessel');
    const z = p.zeilen[beispiel]!;
    const keys = z.verteilung.art === 'schluessel' ? z.verteilung.schluessel : [];
    return [
      {
        titel: 'Einzelkosten heraushalten',
        erlaeuterung:
          'Fertigungsmaterial und Fertigungslöhne werden den Kostenträgern direkt zugerechnet. Im BAB werden nur Gemeinkosten verteilt.',
      },
      {
        titel: 'Kostenstelleneinzelkosten übernehmen',
        erlaeuterung:
          'Gemeinkosten, die laut Beleg (Entnahmeschein, Lohn- oder Gehaltsliste) genau einer Stelle gehören, werden direkt eingetragen.',
      },
      {
        titel: `Schlüssel anwenden: ${z.kostenart}`,
        rechnung: `${eur(z.betrag)} × ${plain(keys[0]!)} ÷ ${plain(s.schluesselSumme[beispiel]!)} = ${eur(s.anteile[beispiel]![0]!)} für ${p.stellen[0]}`,
        erlaeuterung:
          'Anteil = Betrag × Schlüssel der Stelle ÷ Summe aller Schlüssel. Bleibt durch das Runden ein Cent übrig, bekommt ihn die Stelle mit dem größten Schlüssel.',
      },
      {
        titel: 'Summen bilden und kontrollieren',
        rechnung: p.stellen.map((st, k) => `${st} ${eur(s.summen[k]!)}`).join('; '),
        erlaeuterung: `Zusammen ${eur(sum(s.summen))} = alle primären Gemeinkosten (${eur(s.gesamt)}).`,
      },
    ];
  },
  hints: (p, s) => {
    const i = p.zeilen.findIndex((z) => z.verteilung.art === 'schluessel');
    const z = p.zeilen[i]!;
    return [
      'Direkt zugeordnete Gemeinkosten übernimmst du unverändert. Die übrigen verteilst du im Verhältnis der Schlüssel.',
      `Beispiel ${z.kostenart}: zuerst alle Schlüsselgrößen addieren (${plain(s.schluesselSumme[i]!)}), dann ${eur(z.betrag)} durch diese Summe teilen und mit dem Schlüssel jeder Stelle malnehmen.`,
      `Kontrolle: Jede Zeile verteilt genau ihren Betrag, alle Stellen zusammen ergeben ${eur(s.gesamt)}.`,
    ];
  },
  errorVariants: babVariants,
  verfahren: () =>
    'BAB: primäre Gemeinkosten direkt oder über Schlüssel auf die Kostenstellen verteilen',
});
