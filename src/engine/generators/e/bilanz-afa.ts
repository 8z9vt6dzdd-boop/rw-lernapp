// E3 – Bilanzielle Abschreibung auf Sachanlagen (BA 2.3.5.1 und 3.4.5): linear, geometrisch-degressiv
// (Satz vom Buchwert, vorgegeben) und nach Leistungseinheiten. Bemessungsgrundlage sind die
// Anschaffungskosten einschließlich Nebenkosten, ohne Restwert. Im Anschaffungsjahr zeitanteilig
// (pro rata temporis) monatsgenau; der Anschaffungsmonat zählt voll (siehe docs/m7/e.md, Annahme).
import { loesung, satz, zeile, type BuchungsLoesung } from '../../booking';
import { Val, dec } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, SolutionStep, TaskPart, ZahlFeld } from '../../task';
import { betrag, defineGenerator, eur, feld, isExact, isKrumm, pct, plain, retry } from '../base';

export type BilanzAfaVariante = 'linear' | 'degressiv' | 'leistung';

export const MONATSNAMEN = [
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
] as const;

export interface BilanzAfaParams {
  variante: BilanzAfaVariante;
  anlage: string;
  konto: string;
  kaufpreis: string;
  /** Anschaffungsnebenkosten netto („0“ = keine) */
  nebenkosten: string;
  nebenkostenArt: string;
  nd: number;
  /** Anschaffungsmonat 1–12 */
  monat: number;
  /** degressiv: Satz vom Buchwert als Dezimal-String */
  satz?: string;
  /** leistung: Gesamtleistung und Leistung im ersten Jahr */
  gesamtLeistung?: number;
  leistungJahr?: number;
  einheit?: 'km' | 'h';
}

export interface BilanzAfaSolution {
  ak: Val;
  jahresAfa?: Val;
  monate: number;
  afa1: Val;
  bw1: Val;
  afa2?: Val;
  bw2?: Val;
  satzJeEinheit?: Val;
  buchung: BuchungsLoesung;
}

const AFA_KONTO = 'Abschreibungen auf Sachanlagen';

interface Rechenweg {
  ohneNebenkosten?: boolean;
  volleJahresAfa?: boolean;
  monatVergessen?: boolean;
  degressivVomAk?: boolean;
}

export function solveBilanzAfa(p: BilanzAfaParams, w: Rechenweg = {}): BilanzAfaSolution {
  const ak = w.ohneNebenkosten ? new Val(p.kaufpreis) : new Val(p.kaufpreis).plus(p.nebenkosten);
  const monate = w.volleJahresAfa ? 12 : w.monatVergessen ? 12 - p.monat : 13 - p.monat;
  const out = (s: Omit<BilanzAfaSolution, 'buchung'>): BilanzAfaSolution => ({
    ...s,
    buchung: loesung([satz([zeile(AFA_KONTO, s.afa1)], [zeile(p.konto, s.afa1)])]),
  });
  switch (p.variante) {
    case 'linear': {
      const jahresAfa = ak.div(p.nd).round();
      const afa1 = jahresAfa.times(monate).div(12).round();
      const bw1 = ak.minus(afa1);
      const afa2 = jahresAfa;
      return out({ ak, jahresAfa, monate, afa1, bw1, afa2, bw2: bw1.minus(afa2) });
    }
    case 'degressiv': {
      const afa1 = ak.times(p.satz!).times(monate).div(12).round();
      const bw1 = ak.minus(afa1);
      const afa2 = (w.degressivVomAk ? ak : bw1).times(p.satz!).round();
      return out({ ak, monate, afa1, bw1, afa2, bw2: bw1.minus(afa2) });
    }
    case 'leistung': {
      const satzJeEinheit = ak.div(p.gesamtLeistung!).round();
      const afa1 = satzJeEinheit.times(p.leistungJahr!).round();
      return out({ ak, monate: 13 - p.monat, satzJeEinheit, afa1, bw1: ak.minus(afa1) });
    }
  }
}

function parts(p: BilanzAfaParams, s: BilanzAfaSolution): TaskPart[] {
  const felder: ZahlFeld[] = [];
  if (!dec(p.nebenkosten).isZero()) felder.push(feld('ak', 'Anschaffungskosten', s.ak));
  switch (p.variante) {
    case 'linear':
      felder.push(
        feld('jahr', 'Jährliche Abschreibung (volles Jahr)', s.jahresAfa!),
        feld('monate', 'Monate im Anschaffungsjahr', s.monate, 'menge', ''),
        feld('afa1', 'Abschreibung im Anschaffungsjahr', s.afa1),
        feld('bw1', 'Buchwert am 31.12. des Anschaffungsjahres', s.bw1),
        feld('bw2', 'Buchwert am 31.12. des Folgejahres', s.bw2!),
      );
      break;
    case 'degressiv':
      felder.push(
        feld('monate', 'Monate im Anschaffungsjahr', s.monate, 'menge', ''),
        feld('afa1', 'Abschreibung im Anschaffungsjahr', s.afa1),
        feld('bw1', 'Buchwert am 31.12. des Anschaffungsjahres', s.bw1),
        feld('afa2', 'Abschreibung im Folgejahr', s.afa2!),
        feld('bw2', 'Buchwert am 31.12. des Folgejahres', s.bw2!),
      );
      break;
    case 'leistung':
      felder.push(
        feld(
          'satz',
          p.einheit === 'km' ? 'Abschreibung je Kilometer' : 'Abschreibung je Betriebsstunde',
          s.satzJeEinheit!,
          'satz',
          p.einheit === 'km' ? '€/km' : '€/h',
        ),
        feld('afa1', 'Abschreibung im ersten Jahr', s.afa1),
        feld('bw1', 'Buchwert am 31.12.', s.bw1),
      );
      break;
  }
  return [
    { typ: 'rechenkette', id: 'afa', titel: 'Bilanzielle Abschreibung', felder },
    {
      typ: 'buchungssatz',
      id: 'buchung',
      titel: 'Buchungssatz für die Abschreibung am 31.12. des Anschaffungsjahres',
      loesung: s.buchung,
    },
  ];
}

function variants(p: BilanzAfaParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Rechenweg) =>
    out.push({ fehlertyp, parts: parts(p, solveBilanzAfa(p, w)) });
  if (!dec(p.nebenkosten).isZero()) add('nebenkosten-vergessen', { ohneNebenkosten: true });
  if (p.variante !== 'leistung') {
    if (p.monat > 1) add('volle-jahres-afa', { volleJahresAfa: true });
    if (p.monat < 12) add('anschaffungsmonat-vergessen', { monatVergessen: true });
  }
  if (p.variante === 'degressiv') add('degressiv-vom-ak', { degressivVomAk: true });
  return out;
}

interface Vorlage {
  anlage: string;
  konto: string;
  nebenkostenArt: string;
  nd: number[];
  einheit?: 'km' | 'h';
}

const VORLAGEN: Vorlage[] = [
  {
    anlage: 'eine neue Etikettiermaschine',
    konto: 'Technische Anlagen und Maschinen',
    nebenkostenArt: 'Montage',
    nd: [8, 10, 12],
    einheit: 'h',
  },
  {
    anlage: 'eine neue Abfülllinie für Glasflaschen',
    konto: 'Technische Anlagen und Maschinen',
    nebenkostenArt: 'Transport und Montage',
    nd: [10, 12, 15],
    einheit: 'h',
  },
  {
    anlage: 'einen neuen Auslieferungs-Lkw',
    konto: 'Fuhrpark',
    nebenkostenArt: 'Überführung',
    nd: [6, 8, 9],
    einheit: 'km',
  },
  {
    anlage: 'eine neue Büroeinrichtung für das Controlling',
    konto: 'Betriebs- und Geschäftsausstattung',
    nebenkostenArt: 'Lieferung und Aufbau',
    nd: [10, 12, 13],
  },
];

function generate(rng: Rng, variante: BilanzAfaVariante, krumm: boolean): BilanzAfaParams {
  const vorlagen = variante === 'leistung' ? VORLAGEN.filter((v) => v.einheit) : VORLAGEN;
  const v = rng.pick(vorlagen);
  const nd = rng.pick(v.nd);
  const monat = rng.chance(0.1) ? 1 : rng.int(2, 12);
  const mitNk = rng.chance(0.7);
  let ak: string;
  const p: Partial<BilanzAfaParams> = {
    variante,
    anlage: v.anlage,
    konto: v.konto,
    nd,
    monat,
    nebenkostenArt: v.nebenkostenArt,
  };
  switch (variante) {
    case 'linear':
      ak = krumm
        ? betrag(rng, 10_000, 300_000, 1, true)
        : String(rng.step(100, 2_500, 50) * nd * 12);
      break;
    case 'degressiv': {
      // Satz höchstens das Dreifache des linearen Satzes und höchstens 30 % (siehe docs/m7/e.md)
      const saetze = ['0.2', '0.25', '0.3'].filter((x) => dec(x).lte(dec(3).div(nd)));
      p.satz = rng.pick(saetze.length > 0 ? saetze : ['0.2']);
      ak = krumm ? betrag(rng, 10_000, 300_000, 1, true) : String(rng.step(10, 300, 10) * 1_000);
      break;
    }
    case 'leistung': {
      const einheit = v.einheit!;
      p.einheit = einheit;
      const gesamt =
        einheit === 'km' ? rng.step(200_000, 600_000, 10_000) : rng.step(10_000, 60_000, 1_000);
      p.gesamtLeistung = gesamt;
      const anteil = (13 - monat) / 12;
      const jahr = Math.max(
        einheit === 'km' ? 1_000 : 100,
        rng.step(
          Math.floor((gesamt / (nd + 2)) * anteil),
          Math.floor((gesamt / Math.max(nd - 2, 2)) * anteil),
          einheit === 'km' ? 1_000 : 100,
        ),
      );
      p.leistungJahr = jahr;
      const rate =
        einheit === 'km'
          ? rng.pick(['0.2', '0.25', '0.3', '0.4', '0.5', '0.6'])
          : rng.pick(['2', '2.5', '4', '5', '6', '8']);
      ak = krumm ? betrag(rng, 50_000, 400_000, 100, false) : dec(rate).times(gesamt).toFixed(2);
      break;
    }
  }
  const nk = mitNk ? String(rng.step(200, Math.max(500, Math.floor(Number(ak) * 0.05)), 100)) : '0';
  p.nebenkosten = nk;
  p.kaufpreis = dec(ak).minus(nk).toFixed(2);
  return p as BilanzAfaParams;
}

const EINHEIT_TEXT = { km: 'Kilometer', h: 'Betriebsstunden' } as const;

export const bilanzAfa = defineGenerator<BilanzAfaParams, BilanzAfaSolution>({
  skillId: 'E3-bilanz-afa',
  titel: 'Bilanzielle Abschreibung',
  variants: ['linear', 'degressiv', 'leistung'],
  points: 5,
  generate: (rng, opts = {}) => {
    const variante =
      (opts.variant as BilanzAfaVariante | undefined) ??
      rng.pick<BilanzAfaVariante>([
        'linear',
        'linear',
        'linear',
        'degressiv',
        'degressiv',
        'leistung',
      ]);
    const krumm = isKrumm(rng, opts.krummAnteil);
    return retry(
      rng,
      (r) => generate(r, variante, krumm),
      (p) => {
        if (Number(p.kaufpreis) <= 0) return false;
        if (krumm) return true;
        const s = solveBilanzAfa(p);
        return [s.afa1, s.afa2, s.satzJeEinheit, s.jahresAfa].every(
          (v) => v === undefined || isExact(v.exact),
        );
      },
    );
  },
  render: (p) => {
    const monat = MONATSNAMEN[p.monat - 1]!;
    const nk = dec(p.nebenkosten).isZero()
      ? ''
      : ` Für ${p.nebenkostenArt} kommen ${eur(p.nebenkosten)} netto hinzu.`;
    const sachverhalt = [
      `Die MBG hat im ${monat} ${p.anlage} angeschafft und sofort in Betrieb genommen. Kaufpreis ${eur(p.kaufpreis)} netto.${nk}`,
    ];
    if (p.variante === 'linear')
      sachverhalt.push(
        `Die betriebsgewöhnliche Nutzungsdauer beträgt ${p.nd} Jahre. Abgeschrieben wird linear.`,
      );
    if (p.variante === 'degressiv')
      sachverhalt.push(
        `Nutzungsdauer ${p.nd} Jahre. Die MBG schreibt geometrisch-degressiv mit ${pct(p.satz!)} vom jeweiligen Buchwert ab.`,
      );
    if (p.variante === 'leistung')
      sachverhalt.push(
        `Die Anlage ist auf ${plain(p.gesamtLeistung!)} ${EINHEIT_TEXT[p.einheit!]} ausgelegt. Abgeschrieben wird nach Leistungseinheiten; bis zum 31.12. kommen ${plain(p.leistungJahr!)} ${EINHEIT_TEXT[p.einheit!]} zusammen.`,
      );
    sachverhalt.push('Geschäftsjahr = Kalenderjahr.');
    return {
      titel: 'Bilanzielle Abschreibung',
      kontext: 'Dezember: Abschreibungen für den Jahresabschluss',
      sachverhalt,
      aufgabe:
        p.variante === 'leistung'
          ? 'Ermittle die Abschreibung je Leistungseinheit, die Abschreibung im ersten Jahr und den Buchwert. Bilde den Buchungssatz zum 31.12.'
          : 'Ermittle die Abschreibung im Anschaffungsjahr (zeitanteilig) und die Buchwerte am Ende des Anschaffungs- und des Folgejahres. Bilde den Buchungssatz zum 31.12. des Anschaffungsjahres.',
    };
  },
  solve: (p) => solveBilanzAfa(p),
  parts,
  steps: (p, s) => {
    const steps: SolutionStep[] = [];
    if (!dec(p.nebenkosten).isZero())
      steps.push({
        titel: 'Anschaffungskosten',
        rechnung: `${eur(p.kaufpreis)} + ${eur(p.nebenkosten)} = ${eur(s.ak)}`,
        erlaeuterung:
          'Die Nebenkosten gehören zu den Anschaffungskosten und werden mit abgeschrieben.',
      });
    const monat = MONATSNAMEN[p.monat - 1]!;
    if (p.variante === 'linear')
      steps.push(
        { titel: 'Jahresbetrag', rechnung: `${eur(s.ak)} ÷ ${p.nd} Jahre = ${eur(s.jahresAfa!)}` },
        {
          titel: 'Anschaffungsjahr',
          rechnung: `${eur(s.jahresAfa!)} × ${s.monate}/12 = ${eur(s.afa1)}`,
          erlaeuterung: `Von ${monat} bis Dezember sind es ${s.monate} Monate; der Anschaffungsmonat zählt voll.`,
        },
        {
          titel: 'Buchwerte',
          rechnung: `${eur(s.ak)} − ${eur(s.afa1)} = ${eur(s.bw1)}; ${eur(s.bw1)} − ${eur(s.afa2!)} = ${eur(s.bw2!)}`,
          erlaeuterung: 'Ab dem Folgejahr wird der volle Jahresbetrag abgeschrieben.',
        },
      );
    if (p.variante === 'degressiv')
      steps.push(
        {
          titel: 'Anschaffungsjahr',
          rechnung: `${eur(s.ak)} × ${pct(p.satz!)} × ${s.monate}/12 = ${eur(s.afa1)}; Buchwert ${eur(s.bw1)}`,
          erlaeuterung: `Zeitanteilig: ${s.monate} Monate von ${monat} bis Dezember.`,
        },
        {
          titel: 'Folgejahr',
          rechnung: `${eur(s.bw1)} × ${pct(p.satz!)} = ${eur(s.afa2!)}; Buchwert ${eur(s.bw2!)}`,
          erlaeuterung:
            'Der Satz gilt immer für den Buchwert des Vorjahres, nicht für die Anschaffungskosten.',
        },
      );
    if (p.variante === 'leistung')
      steps.push(
        {
          titel: 'Satz je Einheit',
          rechnung: `${eur(s.ak)} ÷ ${plain(p.gesamtLeistung!)} ${p.einheit} = ${plain(s.satzJeEinheit!.exact, 4)} €/${p.einheit}`,
        },
        {
          titel: 'Erstes Jahr',
          rechnung: `${plain(s.satzJeEinheit!.exact, 4)} €/${p.einheit} × ${plain(p.leistungJahr!)} ${p.einheit} = ${eur(s.afa1)}; Buchwert ${eur(s.bw1)}`,
          erlaeuterung:
            'Die tatsächliche Leistung bestimmt den Betrag, eine Zeitanteilsrechnung entfällt.',
        },
      );
    steps.push({
      titel: 'Buchung',
      rechnung: `Abschreibungen auf Sachanlagen an ${p.konto} ${eur(s.afa1)}`,
      erlaeuterung: 'Die Abschreibung ist Aufwand und mindert direkt das Anlagekonto.',
    });
    return steps;
  },
  hints: (p, s) => {
    const h1 =
      'Basis sind die Anschaffungskosten einschließlich Nebenkosten. Ein Restwert wird hier nicht abgezogen.';
    if (p.variante === 'leistung')
      return [
        h1,
        'Satz je Einheit = Anschaffungskosten ÷ Gesamtleistung.',
        `Erstes Jahr: Satz × ${plain(p.leistungJahr!)} ${p.einheit}.`,
      ];
    return [
      h1,
      `Zeitanteilig im Anschaffungsjahr: Der Anschaffungsmonat zählt mit, hier ${s.monate} Monate.`,
      p.variante === 'linear'
        ? `Jahresbetrag ${eur(s.ak)} ÷ ${p.nd}, davon ${s.monate}/12.`
        : `Jahr 1: ${eur(s.ak)} × ${pct(p.satz!)} × ${s.monate}/12; Jahr 2: Buchwert × ${pct(p.satz!)}.`,
    ];
  },
  errorVariants: variants,
  verfahren: (p) =>
    p.variante === 'linear'
      ? 'Bilanzielle Abschreibung linear, zeitanteilig im Anschaffungsjahr'
      : p.variante === 'degressiv'
        ? 'Bilanzielle Abschreibung geometrisch-degressiv vom Buchwert'
        : 'Bilanzielle Abschreibung nach Leistungseinheiten',
});
