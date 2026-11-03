// H5 – Kalkulatorische Zinsen (K1 Kap. 2.4.2; 04-fachregeln.md, Konvention 9):
// Durchschnittswertverzinsung einer Anlage ((Anschaffungswert + Restwert) ÷ 2), Restwertverzinsung
// (vom kalkulatorischen Restwert zu Beginn des Jahres) und Zinsen auf das betriebsnotwendige Kapital
// (betriebsnotwendiges Vermögen − Abzugskapital).
import { Val, dec } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, SolutionStep, TaskPart, ZahlFeld } from '../../task';
import { defineGenerator, eur, feld, isKrumm, pct } from '../base';

export type ZinsVariante = 'durchschnitt' | 'restwert' | 'betriebsnotwendig';

export interface Position {
  name: string;
  /** voller Wert, Anschaffungswert (abnutzbar) oder Anfangsbestand (Umlaufvermögen) */
  wert: string;
  /** Umlaufvermögen: Endbestand für den Mittelwert */
  endwert?: string;
  art: 'grund' | 'abnutzbar' | 'uv' | 'nicht-betrieblich' | 'abzug' | 'verzinst';
}

export interface ZinsParams {
  variante: ZinsVariante;
  /** Zinssatz p. a. als Dezimal-String */
  zinssatz: string;
  anlage?: string;
  anschaffungswert?: string;
  restwert?: string;
  nd?: number;
  positionen?: Position[];
}

export interface ZinsSolution {
  kapitalbindung?: Val;
  afa?: Val;
  restwerte?: Val[];
  zinsenJahre?: Val[];
  bnAV?: Val;
  bnUV?: Val;
  bnV?: Val;
  abzug?: Val;
  bnK?: Val;
  zinsenJahr: Val;
  zinsenMonat: Val;
}

interface Rechenweg {
  vollerWert?: boolean;
  ohneRestwert?: boolean;
  jahresende?: boolean;
  nichtBetrieblichMit?: boolean;
  ohneAbzug?: boolean;
  darlehenAbzug?: boolean;
  endbestand?: boolean;
}

const mittel = (p: Position, w: Rechenweg) =>
  p.endwert === undefined
    ? new Val(p.wert)
    : w.endbestand
      ? new Val(p.endwert)
      : new Val(p.wert).plus(p.endwert).div(2);

export function solveZinsen(p: ZinsParams, w: Rechenweg = {}): ZinsSolution {
  const i = dec(p.zinssatz);
  if (p.variante === 'durchschnitt') {
    const a = new Val(p.anschaffungswert!);
    const kapitalbindung = w.vollerWert ? a : a.plus(w.ohneRestwert ? 0 : p.restwert!).div(2);
    const zinsenJahr = kapitalbindung.times(i).round();
    return { kapitalbindung, zinsenJahr, zinsenMonat: zinsenJahr.div(12).round() };
  }
  if (p.variante === 'restwert') {
    const a = new Val(p.anschaffungswert!);
    const afa = a.minus(p.restwert!).div(p.nd!).round();
    const restwerte = [0, 1, 2].map((k) => a.minus(afa.times(w.jahresende ? k + 1 : k)));
    const zinsenJahre = restwerte.map((r) => r.times(i).round());
    return {
      afa,
      restwerte,
      zinsenJahre,
      zinsenJahr: zinsenJahre[0]!,
      zinsenMonat: zinsenJahre[0]!.div(12).round(),
    };
  }
  const pos = p.positionen!;
  let bnAV = new Val(0);
  let bnUV = new Val(0);
  let abzug = new Val(0);
  for (const x of pos) {
    if (x.art === 'grund') bnAV = bnAV.plus(x.wert);
    if (x.art === 'abnutzbar')
      bnAV = bnAV.plus(w.vollerWert ? new Val(x.wert) : new Val(x.wert).div(2));
    if (x.art === 'nicht-betrieblich' && w.nichtBetrieblichMit) bnAV = bnAV.plus(x.wert);
    if (x.art === 'uv') bnUV = bnUV.plus(mittel(x, w));
    if (x.art === 'abzug' && !w.ohneAbzug) abzug = abzug.plus(mittel(x, {}));
    if (x.art === 'verzinst' && w.darlehenAbzug) abzug = abzug.plus(mittel(x, {}));
  }
  const bnV = bnAV.plus(bnUV);
  const bnK = bnV.minus(abzug);
  const zinsenJahr = bnK.times(i).round();
  return { bnAV, bnUV, bnV, abzug, bnK, zinsenJahr, zinsenMonat: zinsenJahr.div(12).round() };
}

function parts(p: ZinsParams, s: ZinsSolution): TaskPart[] {
  const felder: ZahlFeld[] = [];
  if (p.variante === 'durchschnitt') {
    felder.push(
      feld('bindung', 'Durchschnittlich gebundenes Kapital', s.kapitalbindung!),
      feld('jahr', 'Kalkulatorische Zinsen pro Jahr', s.zinsenJahr),
      feld('monat', 'Kalkulatorische Zinsen pro Monat', s.zinsenMonat),
    );
  } else if (p.variante === 'restwert') {
    felder.push(
      feld('afa', 'Lineare kalkulatorische Abschreibung pro Jahr', s.afa!),
      ...s.zinsenJahre!.map((z, k) =>
        feld(`z${k + 1}`, `Kalkulatorische Zinsen im ${k + 1}. Jahr`, z),
      ),
    );
  } else {
    felder.push(
      feld('bnav', 'Betriebsnotwendiges Anlagevermögen', s.bnAV!),
      feld('bnuv', 'Betriebsnotwendiges Umlaufvermögen', s.bnUV!),
      feld('bnv', 'Betriebsnotwendiges Vermögen', s.bnV!),
      feld('abzug', 'Abzugskapital', s.abzug!),
      feld('bnk', 'Betriebsnotwendiges Kapital', s.bnK!),
      feld('jahr', 'Kalkulatorische Zinsen pro Jahr', s.zinsenJahr),
      feld('monat', 'Kalkulatorische Zinsen pro Monat', s.zinsenMonat),
    );
  }
  return [{ typ: 'rechenkette', id: 'zinsen', titel: 'Kalkulatorische Zinsen', felder }];
}

function variants(p: ZinsParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Rechenweg) =>
    out.push({ fehlertyp, parts: parts(p, solveZinsen(p, w)) });
  if (p.variante === 'durchschnitt') {
    add('zinsen-vom-anschaffungswert', { vollerWert: true });
    if (!dec(p.restwert!).isZero())
      add('restwert-bei-durchschnitt-vergessen', { ohneRestwert: true });
  }
  if (p.variante === 'restwert') add('restwert-jahresende', { jahresende: true });
  if (p.variante === 'betriebsnotwendig') {
    add('nicht-betriebsnotwendig-einbezogen', { nichtBetrieblichMit: true });
    add('abzugskapital-vergessen', { ohneAbzug: true });
    add('darlehen-als-abzugskapital', { darlehenAbzug: true });
    add('zinsen-vom-anschaffungswert', { vollerWert: true });
    add('endbestand-statt-mittelwert', { endbestand: true });
  }
  return out;
}

const ANLAGEN = [
  'Abfüllanlage',
  'Sirupanlage',
  'Etikettiermaschine',
  'Palettieranlage',
  'Lagertankanlage',
];
const SAETZE = ['0.05', '0.06', '0.08', '0.1', '0.12'];

function tausend(rng: Rng, min: number, max: number, step = 10_000): string {
  return String(rng.step(min, max, step));
}

function bilanz(rng: Rng, krumm: boolean): Position[] {
  const s = krumm ? 1_000 : 10_000;
  const paarUV = (name: string, min: number, max: number): Position => {
    const a = rng.step(min, max, s * 2);
    const e = rng.step(min, max, s * 2);
    return { name, wert: String(a), endwert: String(e), art: 'uv' };
  };
  const nb = rng.pick([
    'An Privatleute vermietetes Wohnhaus in Bad Driburg',
    'Wertpapiere, als reine Geldanlage gekauft',
    'Stillgelegte alte Sirupanlage (soll verkauft werden)',
    'Unbebautes Grundstück als Reserve für spätere Jahre',
  ]);
  return [
    {
      name: 'Grundstück Werk Paderborn (voller Wert)',
      wert: tausend(rng, 200_000, 600_000, s * 10),
      art: 'grund',
    },
    {
      name: 'Gebäude Werk (Anschaffungswert)',
      wert: tausend(rng, 800_000, 2_000_000, s * 20),
      art: 'abnutzbar',
    },
    {
      name: 'Abfüllanlage und Tanks (Anschaffungswert)',
      wert: tausend(rng, 600_000, 1_600_000, s * 20),
      art: 'abnutzbar',
    },
    { name: nb, wert: tausend(rng, 100_000, 400_000, s * 10), art: 'nicht-betrieblich' },
    paarUV('Vorräte', 200_000, 500_000),
    paarUV('Forderungen a. LL', 100_000, 400_000),
    {
      name: 'Zahlungsmittel (Durchschnittsbestand)',
      wert: tausend(rng, 20_000, 120_000, s),
      art: 'uv',
    },
    {
      name: 'Erhaltene Anzahlungen von Kunden (Durchschnitt)',
      wert: tausend(rng, 20_000, 120_000, s),
      art: 'abzug',
    },
    {
      name: 'Verbindlichkeiten a. LL, zinslos (Durchschnitt)',
      wert: tausend(rng, 40_000, 200_000, s),
      art: 'abzug',
    },
    {
      name: 'Darlehen der Sparkasse Paderborn (verzinst)',
      wert: tausend(rng, 200_000, 800_000, s * 10),
      art: 'verzinst',
    },
  ];
}

export const kalkZinsen = defineGenerator<ZinsParams, ZinsSolution>({
  skillId: 'H5-kalk-zinsen',
  titel: 'Kalkulatorische Zinsen',
  variants: ['durchschnitt', 'restwert', 'betriebsnotwendig'],
  points: 5,
  generate: (rng, opts = {}) => {
    const variante =
      (opts.variant as ZinsVariante | undefined) ??
      rng.pick<ZinsVariante>([
        'durchschnitt',
        'durchschnitt',
        'restwert',
        'betriebsnotwendig',
        'betriebsnotwendig',
      ]);
    const krumm = isKrumm(rng, opts.krummAnteil);
    const zinssatz = rng.pick(SAETZE);
    if (variante === 'betriebsnotwendig')
      return { variante, zinssatz, positionen: bilanz(rng, krumm) };
    const nd = rng.pick([4, 5, 6, 8, 10]);
    const restwert =
      variante === 'durchschnitt' && rng.chance(0.4) ? '0' : String(rng.step(5_000, 40_000, 5_000));
    const afa = krumm ? rng.step(5_000, 60_000, 50) : rng.step(5_000, 60_000, 1_000);
    const anschaffungswert = dec(afa).times(nd).plus(restwert).toFixed(0);
    return { variante, zinssatz, anlage: rng.pick(ANLAGEN), anschaffungswert, restwert, nd };
  },
  render: (p) => {
    const sachverhalt: string[] = [];
    let daten: { spalten: string[]; zeilen: string[][] } | undefined;
    let aufgabe: string;
    if (p.variante === 'betriebsnotwendig') {
      sachverhalt.push(
        'Leni Brandt ermittelt die kalkulatorischen Zinsen der MBG. Aus Bilanz und Anlagenkartei liegen diese Werte vor:',
        `Abnutzbares Anlagevermögen wird mit dem Durchschnittswert (halber Anschaffungswert) angesetzt, Umlaufvermögen mit dem Mittelwert aus Anfangs- und Endbestand. Kalkulatorischer Zinssatz ${pct(p.zinssatz)} p. a.`,
      );
      daten = {
        spalten: ['Position', 'Wert bzw. Anfangsbestand', 'Endbestand'],
        zeilen: p.positionen!.map((x) => [x.name, eur(x.wert), x.endwert ? eur(x.endwert) : '–']),
      };
      aufgabe =
        'Ermittle betriebsnotwendiges Vermögen, Abzugskapital und betriebsnotwendiges Kapital sowie die kalkulatorischen Zinsen pro Jahr und pro Monat.';
    } else {
      sachverhalt.push(
        `Für die ${p.anlage} der MBG sollen kalkulatorische Zinsen angesetzt werden. Anschaffungswert ${eur(p.anschaffungswert!)}, Nutzungsdauer ${p.nd} Jahre, erwarteter Restwert ${eur(p.restwert!)}. Kalkulatorischer Zinssatz ${pct(p.zinssatz)} p. a.`,
      );
      aufgabe =
        p.variante === 'durchschnitt'
          ? 'Ermittle die kalkulatorischen Zinsen nach der Durchschnittswertverzinsung: durchschnittlich gebundenes Kapital = (Anschaffungswert + Restwert) ÷ 2. Gib die Zinsen pro Jahr und pro Monat an.'
          : 'Die Anlage wird linear abgeschrieben. Ermittle die kalkulatorischen Zinsen der ersten drei Jahre nach der Restwertverzinsung, jeweils vom kalkulatorischen Restwert zu Beginn des Jahres.';
    }
    const t = {
      titel: 'Kalkulatorische Zinsen',
      kontext: 'Januar Folgejahr: Controlling baut die Kostenrechnung auf',
      sachverhalt,
      aufgabe,
    };
    return daten ? { ...t, daten } : t;
  },
  solve: (p) => solveZinsen(p),
  parts,
  steps: (p, s) => {
    const i = pct(p.zinssatz);
    if (p.variante === 'durchschnitt')
      return [
        {
          titel: 'Durchschnittlich gebundenes Kapital',
          rechnung: `(${eur(p.anschaffungswert!)} + ${eur(p.restwert!)}) ÷ 2 = ${eur(s.kapitalbindung!)}`,
          erlaeuterung:
            'Über die Nutzungsdauer sinkt die Kapitalbindung vom Anschaffungswert auf den Restwert – im Mittel ist die Hälfte davon gebunden.',
        },
        {
          titel: 'Zinsen',
          rechnung: `${eur(s.kapitalbindung!)} × ${i} = ${eur(s.zinsenJahr)} pro Jahr; ÷ 12 = ${eur(s.zinsenMonat)} pro Monat`,
        },
      ];
    if (p.variante === 'restwert')
      return [
        {
          titel: 'Lineare Abschreibung',
          rechnung: `(${eur(p.anschaffungswert!)} − ${eur(p.restwert!)}) ÷ ${p.nd} = ${eur(s.afa!)}`,
        },
        {
          titel: 'Zinsen vom Restwert zu Jahresbeginn',
          rechnung: s
            .restwerte!.map(
              (r, k) => `Jahr ${k + 1}: ${eur(r)} × ${i} = ${eur(s.zinsenJahre![k]!)}`,
            )
            .join('; '),
          erlaeuterung: 'Weil der Restwert jedes Jahr sinkt, sinken auch die Zinsen.',
        },
      ];
    const pos = p.positionen!;
    const steps: SolutionStep[] = [
      {
        titel: 'Betriebsnotwendiges Anlagevermögen',
        rechnung:
          pos
            .filter((x) => x.art === 'grund' || x.art === 'abnutzbar')
            .map((x) => (x.art === 'abnutzbar' ? `${eur(x.wert)} ÷ 2` : eur(x.wert)))
            .join(' + ') + ` = ${eur(s.bnAV!)}`,
        erlaeuterung: `Nicht betriebsnotwendig und daher ohne Ansatz: ${pos.find((x) => x.art === 'nicht-betrieblich')!.name}.`,
      },
      {
        titel: 'Betriebsnotwendiges Umlaufvermögen',
        rechnung:
          pos
            .filter((x) => x.art === 'uv')
            .map((x) => (x.endwert ? `(${eur(x.wert)} + ${eur(x.endwert)}) ÷ 2` : eur(x.wert)))
            .join(' + ') + ` = ${eur(s.bnUV!)}`,
      },
      {
        titel: 'Betriebsnotwendiges Kapital',
        rechnung: `${eur(s.bnV!)} − Abzugskapital ${eur(s.abzug!)} = ${eur(s.bnK!)}`,
        erlaeuterung:
          'Abzugskapital: zinslos überlassenes Kapital (Kundenanzahlungen, Lieferantenkredite). Das verzinste Darlehen ist kein Abzugskapital.',
      },
      {
        titel: 'Zinsen',
        rechnung: `${eur(s.bnK!)} × ${i} = ${eur(s.zinsenJahr)} pro Jahr; ÷ 12 = ${eur(s.zinsenMonat)} pro Monat`,
      },
    ];
    return steps;
  },
  hints: (p) => {
    if (p.variante === 'durchschnitt')
      return [
        'Durchschnittswertverzinsung: Es zählt das im Mittel gebundene Kapital, nicht der volle Anschaffungswert.',
        'Gebundenes Kapital = (Anschaffungswert + Restwert) ÷ 2.',
        'Zinsen pro Jahr = gebundenes Kapital × Zinssatz; pro Monat ÷ 12.',
      ];
    if (p.variante === 'restwert')
      return [
        'Zuerst die lineare Abschreibung: (Anschaffungswert − Restwert) ÷ Nutzungsdauer.',
        'Restwert zu Beginn von Jahr k = Anschaffungswert − (k − 1) × Abschreibung.',
        'Zinsen = Restwert zu Jahresbeginn × Zinssatz.',
      ];
    return [
      'Nur betriebsnotwendige Positionen zählen. Was dient nicht dem Betriebszweck?',
      'Abnutzbares Anlagevermögen zur Hälfte, Umlaufvermögen mit dem Mittelwert aus Anfang und Ende.',
      'Abzugskapital ist zinslos (Kundenanzahlungen, Lieferantenkredite); ein Bankdarlehen gehört nicht dazu.',
    ];
  },
  errorVariants: variants,
  verfahren: (p) =>
    p.variante === 'durchschnitt'
      ? 'Kalkulatorische Zinsen (Durchschnittswertverzinsung)'
      : p.variante === 'restwert'
        ? 'Kalkulatorische Zinsen (Restwertverzinsung)'
        : 'Kalkulatorische Zinsen auf das betriebsnotwendige Kapital',
});
