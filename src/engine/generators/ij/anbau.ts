// I3 – Anbauverfahren (Blockumlageverfahren), K2 Kap. 1.4.2.2.
// Leistungen zwischen den Vorkostenstellen werden ignoriert. Verrechnungssatz =
// primäre Gemeinkosten der Vorkostenstelle ÷ an die Hauptkostenstellen (Endkostenstellen) abgegebene Leistung.
import { FIRMA } from '../../../config';
import { Val, dec, formatNumber, sum } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, TabellenZeile, TaskPart, TaskText } from '../../task';
import type { LvParams, LvStelle } from '../leistungsverrechnung';
import { betrag, defineGenerator, eur, feld, isKrumm, plain, retry } from '../base';

export type AnbauParams = LvParams;

export interface AnbauSolution {
  /** an die Hauptkostenstellen abgegebene Leistung je Vorkostenstelle */
  anHaupt: number[];
  saetze: Val[];
  /** umlage[h][k]: Umlage der Vorkostenstelle h auf Hauptkostenstelle k */
  umlage: Val[][];
  summen: Val[];
  primaerGesamt: Val;
}

interface AnbauWeg {
  /** durch die gesamte Leistung (einschließlich Lieferungen an andere Vorkostenstellen) geteilt */
  durchGesamtleistung?: boolean;
  /** Summe nur aus den sekundären Kosten gebildet */
  ohnePrimaer?: boolean;
}

const m = (p: AnbauParams, i: number, j: number): number => p.mengen[i]?.[j] ?? 0;

export function gesamtleistungAnbau(p: AnbauParams, i: number): number {
  return (p.mengen[i] ?? []).reduce((a, b) => a + b, 0);
}

export function anHauptkostenstellen(p: AnbauParams, i: number): number {
  const h = p.hilfs.length;
  return p.haupt.reduce((a, _, k) => a + m(p, i, h + k), 0);
}

function einheit(s: LvStelle): string {
  return `€/${s.einheit ?? 'LE'}`;
}

export function solveAnbau(p: AnbauParams, w: AnbauWeg = {}): AnbauSolution {
  const h = p.hilfs.length;
  const anHaupt = p.hilfs.map((_, i) =>
    w.durchGesamtleistung ? gesamtleistungAnbau(p, i) : anHauptkostenstellen(p, i),
  );
  // Satz im zweiten Pfad auf 2 Nachkommastellen gerundet (wie im Lehrbrief vorgerechnet)
  const saetze = p.hilfs.map((hs, i) => new Val(hs.primaer).div(anHaupt[i]!).round());
  const umlage = saetze.map((q, i) => p.haupt.map((_, k) => q.times(m(p, i, h + k)).round()));
  const summen = p.haupt.map((s, k) =>
    umlage.reduce((acc, row) => acc.plus(row[k]!), new Val(w.ohnePrimaer ? 0 : s.primaer)),
  );
  const primaerGesamt = sum([...p.hilfs, ...p.haupt].map((s) => s.primaer));
  return { anHaupt, saetze, umlage, summen, primaerGesamt };
}

export function anbauParts(p: AnbauParams, s: AnbauSolution): TaskPart[] {
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
      label: 'Summe Gemeinkosten',
      summe: true,
      zellen: s.summen.map((v, k) => feld(`summe-${k}`, `Summe ${p.haupt[k]!.name}`, v)),
    },
  ];
  return [
    {
      typ: 'rechenkette',
      id: 'saetze',
      titel: 'Verrechnungssätze nach dem Anbauverfahren',
      felder: p.hilfs.flatMap((hs, i) => [
        feld(
          `l-${i}`,
          `Leistung ${hs.name} an die Hauptkostenstellen`,
          s.anHaupt[i]!,
          'menge',
          hs.einheit,
        ),
        feld(`q-${i}`, `Verrechnungssatz ${hs.name}`, s.saetze[i]!, 'satz', einheit(hs)),
      ]),
    },
    {
      typ: 'tabelle',
      id: 'bab',
      titel: 'Betriebsabrechnungsbogen (Anbauverfahren)',
      spalten: p.haupt.map((x) => x.name),
      zeilen,
      hinweis: `Kontrolle: Zusammen tragen die Hauptkostenstellen alle primären Gemeinkosten (${eur(s.primaerGesamt)}); kleine Abweichungen entstehen nur durch gerundete Verrechnungssätze.`,
    },
  ];
}

// ---------- Generierung ----------

const SAETZE_KWH = ['0.2', '0.25', '0.3', '0.4', '0.5', '0.6', '0.8', '1', '1.2', '1.5', '2'];
const SAETZE_STD = ['30', '35', '40', '45', '50', '55', '60', '65', '70', '75', '80', '90'];

/** Zerlegt `total` in `n` positive Vielfache von `unit`. */
function zerlege(rng: Rng, total: number, n: number, unit: number): number[] {
  const units = Math.round(total / unit);
  const cuts = new Set<number>();
  while (cuts.size < n - 1) cuts.add(rng.int(1, units - 1));
  const sorted = [0, ...[...cuts].sort((a, b) => a - b), units];
  return sorted.slice(1).map((c, i) => (c - (sorted[i] ?? 0)) * unit);
}

function generateAnbau(rng: Rng, krumm: boolean): AnbauParams {
  const k = FIRMA.kostenstellen;
  const auswahl = [k.material, k.fertigung1, k.fertigung2, k.verwaltung, k.vertrieb];
  const anzahl = rng.int(2, 4);
  const idx = rng
    .shuffle([0, 1, 2, 3, 4])
    .slice(0, anzahl)
    .sort((a, b) => a - b);
  const haupt: LvStelle[] = idx.map((i) => ({
    name: auswahl[i]!,
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
    const anderer = rng.step(Li * 0.05, Li * 0.25, u);
    const row = [0, 0, ...zerlege(rng, Li - anderer, haupt.length, u)];
    row[1 - i] = anderer;
    return row;
  });
  const p: AnbauParams = { hilfs, haupt, mengen };
  p.hilfs.forEach((hs, i) => {
    hs.primaer = krumm
      ? betrag(rng, i === 0 ? 8_000 : 6_000, i === 0 ? 80_000 : 60_000, 1, true)
      : dec(rng.pick(i === 0 ? SAETZE_KWH : SAETZE_STD))
          .times(anHauptkostenstellen(p, i))
          .toFixed(2);
  });
  return p;
}

function datenTabelle(p: AnbauParams): TaskText['daten'] {
  const alle = [...p.hilfs, ...p.haupt];
  return {
    spalten: ['', ...alle.map((s) => s.name)],
    zeilen: [
      ['Primäre Gemeinkosten (€)', ...alle.map((s) => formatNumber(s.primaer))],
      ...p.hilfs.map((hs, i) => [
        `Leistung ${hs.name} (${hs.einheit})`,
        ...alle.map((_, j) => (j === i ? '–' : plain(m(p, i, j)))),
      ]),
    ],
  };
}

export function renderAnbau(p: AnbauParams): TaskText {
  const k = FIRMA.kostenstellen;
  return {
    titel: 'Anbauverfahren',
    kontext: 'BAB der MBG: Leistungsverrechnung Energie und Instandhaltung',
    sachverhalt: [
      `Im Werk ${FIRMA.ort} erbringen die Vorkostenstellen (Hilfskostenstellen) ${k.energie} und ${k.instandhaltung} Leistungen füreinander und für die Hauptkostenstellen, auch Endkostenstellen genannt.`,
      'Für eine schnelle Monatsübersicht wird das Anbauverfahren angewendet. Die primären Gemeinkosten und die Leistungsabgaben des Monats:',
    ],
    daten: datenTabelle(p),
    aufgabe:
      'Ermittle die Verrechnungssätze nach dem Anbauverfahren (auf 2 Nachkommastellen) und verteile die Kosten der Vorkostenstellen auf die Hauptkostenstellen. Bilde die Summe der Gemeinkosten je Hauptkostenstelle.',
  };
}

function anbauVariants(p: AnbauParams): ErrorVariant[] {
  return [
    {
      fehlertyp: 'anbau-gesamtleistung',
      parts: anbauParts(p, solveAnbau(p, { durchGesamtleistung: true })),
    },
    {
      fehlertyp: 'summe-ohne-primaerkosten',
      parts: anbauParts(p, solveAnbau(p, { ohnePrimaer: true })),
    },
  ];
}

export const anbau = defineGenerator<AnbauParams, AnbauSolution>({
  skillId: 'I3-anbau',
  titel: 'Anbauverfahren',
  variants: ['zwei-vorkostenstellen'],
  points: 10,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    return retry(
      rng,
      (r) => generateAnbau(r, krumm),
      (p) => p.hilfs.every((h) => dec(h.primaer).gt(3_000)),
    );
  },
  render: (p) => renderAnbau(p),
  solve: (p) => solveAnbau(p),
  parts: anbauParts,
  steps: (p, s) => [
    {
      titel: 'Leistungen an die Hauptkostenstellen',
      rechnung: p.hilfs
        .map(
          (hs, i) =>
            `${hs.name}: ${plain(gesamtleistungAnbau(p, i))} − ${plain(m(p, i, 1 - i))} = ${plain(s.anHaupt[i]!)} ${hs.einheit}`,
        )
        .join('; '),
      erlaeuterung:
        'Lieferungen zwischen den Vorkostenstellen bleiben beim Anbauverfahren unberücksichtigt. Geteilt wird nur durch die Leistung an die Hauptkostenstellen.',
    },
    ...p.hilfs.map((hs, i) => ({
      titel: `Verrechnungssatz ${hs.name}`,
      rechnung: `${eur(hs.primaer)} ÷ ${plain(s.anHaupt[i]!)} ${hs.einheit} = ${formatNumber(s.saetze[i]!)} ${einheit(hs)}`,
    })),
    {
      titel: 'Verteilen und kontrollieren',
      rechnung: p.haupt.map((x, k) => `${x.name} ${eur(s.summen[k]!)}`).join('; '),
      erlaeuterung: `Umlage = Verrechnungssatz × an die Hauptkostenstelle abgegebene Menge. Zusammen ${eur(sum(s.summen))} = primäre Gemeinkosten aller Stellen (${eur(s.primaerGesamt)}).`,
    },
  ],
  hints: (p, s) => [
    'Anbauverfahren: Die Vorkostenstellen geben ihre Kosten direkt und nur an die Hauptkostenstellen ab. Was sie sich gegenseitig liefern, wird ignoriert.',
    `${p.hilfs[0]!.name}: Von ${plain(gesamtleistungAnbau(p, 0))} ${p.hilfs[0]!.einheit} gehen ${plain(m(p, 0, 1))} an die ${p.hilfs[1]!.name}. Teile ${eur(p.hilfs[0]!.primaer)} nur durch den Rest.`,
    `Verrechnungssätze: ${p.hilfs.map((hs, i) => `${hs.name} ${formatNumber(s.saetze[i]!)} ${einheit(hs)}`).join(', ')} – jeweils mit der Menge der Hauptkostenstelle malnehmen`,
  ],
  errorVariants: anbauVariants,
  verfahren: () => 'Anbauverfahren: nur Leistungen an Hauptkostenstellen verrechnen',
});
