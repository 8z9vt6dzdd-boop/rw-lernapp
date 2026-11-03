// J5 – Maschinenstundensatz und Maschinensatzkalkulation (Bezugsgrößenkalkulation, K2 Kap. 2.2.5).
// Maschinenstundensatz = maschinenbezogene Gemeinkosten der Periode ÷ Laufzeit der Periode.
// Kalkulation: Restfertigungsgemeinkosten als Zuschlag auf die Fertigungslöhne, Maschinenkosten =
// Maschinenstunden × Maschinenstundensatz; Material, Verwaltung und Vertrieb weiter per Zuschlag.
import { Val, dec } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, TaskPart } from '../../task';
import { betrag, defineGenerator, eur, isExact, isKrumm, pct, plain, retry } from '../base';
import { Werte, felderAus } from './werte';

export type MaschinenVariante = 'stundensatz' | 'kalkulation';

export type Energie =
  | {
      art: 'leistung';
      /** installierte Leistung in kW */
      kw: number;
      /** durchschnittliche Auslastung der Leistung (Leistungsgrad), Dezimal-String */
      leistungsgrad: string;
      /** Grundpreis je installiertem kW und Monat */
      grundpreis: string;
      /** Arbeitspreis je kWh */
      arbeitspreis: string;
    }
  | { art: 'stunde'; satz: string };

export type Instandhaltung =
  | {
      art: 'faktor';
      /** Instandhaltung über die gesamte Nutzungsdauer im Verhältnis zum Wiederbeschaffungswert */
      faktor: string;
    }
  | { art: 'betrag'; betrag: string };

export interface MaschinenParams {
  variante: MaschinenVariante;
  anlage: string;
  // stundensatz
  wbw?: string;
  nd?: number;
  zinssatz?: string;
  flaeche?: number;
  raumSatz?: string;
  raumJe?: 'monat' | 'jahr';
  energie?: Energie;
  instand?: Instandhaltung;
  /** Laufzeit (Lastlaufzeit) in Stunden je Jahr */
  laufzeit?: number;
  // kalkulation
  auftrag?: string;
  fm?: string;
  mgk?: string;
  fl?: string;
  restFgk?: string;
  mss?: string;
  stunden?: string;
  vwgk?: string;
  vtgk?: string;
}

export interface MaschinenSolution {
  werte: Werte;
}

interface Weg {
  zinsenVoll?: boolean;
  monatVergessen?: boolean;
  faktorNichtVerteilt?: boolean;
  leistungsgradVergessen?: boolean;
  restFgkFalscheBasis?: boolean;
  ohneMaschinenkosten?: boolean;
}

export function solveMaschinensatz(p: MaschinenParams, w: Weg = {}): MaschinenSolution {
  const werte = new Werte();
  if (p.variante === 'stundensatz') {
    const wbw = new Val(p.wbw!);
    const afa = werte.put('afa', 'Kalkulatorische Abschreibung', wbw.div(p.nd!).round());
    const zinsen = werte.put(
      'zinsen',
      'Kalkulatorische Zinsen',
      (w.zinsenVoll ? wbw : wbw.div(2)).times(dec(p.zinssatz!)).round(),
    );
    const monate = w.monatVergessen ? 1 : 12;
    const raum = werte.put(
      'raum',
      'Raumkosten',
      new Val(p.raumSatz!).times(p.flaeche!).times(p.raumJe === 'monat' ? monate : 1),
    );
    let energie: Val;
    const e = p.energie!;
    if (e.art === 'leistung') {
      const fix = werte.put(
        'energie-fix',
        'Energiekosten (fix, Grundpreis)',
        new Val(e.grundpreis).times(e.kw).times(monate),
      );
      const variabel = werte.put(
        'energie-var',
        'Energiekosten (variabel, Arbeitspreis)',
        new Val(e.kw)
          .times(w.leistungsgradVergessen ? 1 : dec(e.leistungsgrad))
          .times(p.laufzeit!)
          .times(dec(e.arbeitspreis))
          .round(),
      );
      energie = fix.plus(variabel);
    } else {
      energie = werte.put('energie', 'Energiekosten', new Val(e.satz).times(p.laufzeit!));
    }
    const ih = p.instand!;
    const instand = werte.put(
      'instand',
      'Wartungs- und Instandhaltungskosten',
      ih.art === 'faktor'
        ? wbw
            .times(dec(ih.faktor))
            .div(w.faktorNichtVerteilt ? 1 : p.nd!)
            .round()
        : new Val(ih.betrag),
    );
    const summe = werte.put(
      'summe',
      'Maschinenbezogene Gemeinkosten je Jahr',
      afa.plus(zinsen).plus(raum).plus(energie).plus(instand),
    );
    werte.put('mss', 'Maschinenstundensatz', summe.div(p.laufzeit!).round(), 'satz', '€/h');
    return { werte };
  }
  const fm = new Val(p.fm!);
  const mgk = werte.put(
    'mgk',
    `Materialgemeinkosten (${pct(p.mgk!)})`,
    fm.times(dec(p.mgk!)).round(),
  );
  const mk = werte.put('mk', 'Materialkosten', fm.plus(mgk));
  const masch = werte.put(
    'masch',
    'Maschinenkosten',
    new Val(p.mss!).times(dec(p.stunden!)).round(),
  );
  const fl = new Val(p.fl!);
  const rest = werte.put(
    'rest',
    `Restfertigungsgemeinkosten (${pct(p.restFgk!)})`,
    (w.restFgkFalscheBasis ? fl.plus(masch) : fl).times(dec(p.restFgk!)).round(),
  );
  const fk = werte.put(
    'fk',
    'Fertigungskosten',
    fl.plus(rest).plus(w.ohneMaschinenkosten ? new Val(0) : masch),
  );
  const hk = werte.put('hk', 'Herstellkosten', mk.plus(fk));
  const vw = werte.put(
    'vwgk',
    `Verwaltungsgemeinkosten (${pct(p.vwgk!)})`,
    hk.times(dec(p.vwgk!)).round(),
  );
  const vt = werte.put(
    'vtgk',
    `Vertriebsgemeinkosten (${pct(p.vtgk!)})`,
    hk.times(dec(p.vtgk!)).round(),
  );
  werte.put('sk', 'Selbstkosten', hk.plus(vw).plus(vt));
  return { werte };
}

const IDS_SATZ = [
  'afa',
  'zinsen',
  'raum',
  'energie-fix',
  'energie-var',
  'energie',
  'instand',
  'summe',
  'mss',
];
const IDS_KALK = ['mgk', 'mk', 'rest', 'masch', 'fk', 'hk', 'vwgk', 'vtgk', 'sk'];

function parts(p: MaschinenParams, s: MaschinenSolution): TaskPart[] {
  return p.variante === 'stundensatz'
    ? [
        {
          typ: 'rechenkette',
          id: 'mss',
          titel: 'Maschinenstundensatz',
          felder: felderAus(s.werte, IDS_SATZ),
        },
      ]
    : [
        {
          typ: 'rechenkette',
          id: 'kalk',
          titel: 'Maschinensatzkalkulation',
          felder: felderAus(s.werte, IDS_KALK),
        },
      ];
}

const ANLAGEN = [
  'neue Dosenabfüllanlage der Linie 3',
  'Glasflaschen-Abfüllanlage',
  'Etikettiermaschine der Abfüllung',
  'Palettieranlage im Logistikzentrum',
];
const AUFTRAEGE = [
  '1.200 Kartons Senne Lemon 0,33 l für das Landhotel Kerkhoff',
  '2.500 Kartons Paderquell Energy 0,25 l für die Tankstellenkette Weskamp',
  '600 Kartons Almeblick Tequila-Bier für den Gastro-Großhandel Nolte',
  '3.000 Kartons Paderquell Energy 0,5 l als Aktionsware',
];

const nice = (r: Rng, min: number, max: number, step: number) =>
  dec(r.step(Math.round(min * 100), Math.round(max * 100), Math.round(step * 100))).div(100);

function genStundensatz(rng: Rng, krumm: boolean): MaschinenParams {
  return retry(
    rng,
    (r) => {
      const nd = r.int(4, 10);
      const wbw = krumm
        ? betrag(r, 300_000, 2_000_000, 1, true)
        : String(nd * r.step(40_000, 250_000, 5_000));
      const raumJe = r.chance(0.6) ? 'monat' : 'jahr';
      const p: MaschinenParams = {
        variante: 'stundensatz',
        anlage: r.pick(ANLAGEN),
        wbw,
        nd,
        zinssatz: r.pick(['0.05', '0.06', '0.07', '0.08', '0.1']),
        flaeche: r.step(40, 250, 10),
        raumJe,
        raumSatz: raumJe === 'monat' ? String(r.int(8, 30)) : String(r.step(100, 360, 5)),
        laufzeit: r.step(1_200, 4_000, 100),
        energie: r.chance(0.55)
          ? {
              art: 'leistung',
              kw: r.step(20, 150, 5),
              leistungsgrad: r.pick(['0.6', '0.65', '0.7', '0.75', '0.8', '0.85', '0.9']),
              grundpreis: String(r.int(5, 15)),
              arbeitspreis: nice(r, 0.12, 0.3, 0.01).toString(),
            }
          : { art: 'stunde', satz: nice(r, 4, 25, 0.5).toString() },
        instand: r.chance(0.5)
          ? { art: 'faktor', faktor: r.pick(['0.2', '0.25', '0.3', '0.4', '0.5', '0.6']) }
          : { art: 'betrag', betrag: String(r.step(10_000, 60_000, 500)) },
      };
      return p;
    },
    (p) => krumm || isExact(solveMaschinensatz(p).werte.get('mss').exact),
    300,
  );
}

function genKalkulation(rng: Rng, krumm: boolean): MaschinenParams {
  return retry(
    rng,
    (r) => ({
      variante: 'kalkulation' as const,
      anlage: r.pick(ANLAGEN),
      auftrag: r.pick(AUFTRAEGE),
      fm: krumm ? betrag(r, 2_000, 20_000, 1, true) : String(r.step(2_000, 20_000, 100)),
      mgk: r.pick(['0.05', '0.08', '0.1', '0.12', '0.15']),
      fl: String(r.step(400, 4_000, 50)),
      restFgk: r.pick(['0.5', '0.6', '0.75', '0.8', '1', '1.2', '1.5']),
      mss: nice(r, 80, 420, krumm ? 0.01 : 0.5).toString(),
      stunden: r.pick(['2', '2.5', '3', '4', '4.5', '5', '6', '7.5', '8']),
      vwgk: r.pick(['0.08', '0.1', '0.12', '0.15']),
      vtgk: r.pick(['0.04', '0.05', '0.06', '0.08']),
    }),
    (p) => {
      if (krumm) return true;
      const s = solveMaschinensatz(p).werte;
      return ['mgk', 'masch', 'rest', 'vwgk', 'vtgk'].every((id) => isExact(s.get(id).exact));
    },
  );
}

function datenStundensatz(p: MaschinenParams): string[][] {
  const z: string[][] = [
    ['Wiederbeschaffungswert', eur(p.wbw!)],
    ['Nutzungsdauer (lineare Abschreibung)', `${p.nd} Jahre`],
    ['Kalkulatorischer Zinssatz (auf die durchschnittliche Kapitalbindung)', pct(p.zinssatz!)],
    ['Platzbedarf', `${plain(p.flaeche!)} m²`],
    [
      p.raumJe === 'monat' ? 'Raumkosten je m² und Monat' : 'Raumkosten je m² und Jahr',
      eur(p.raumSatz!),
    ],
  ];
  const e = p.energie!;
  if (e.art === 'leistung')
    z.push(
      ['Installierte Leistung', `${plain(e.kw)} kW`],
      ['Durchschnittlicher Leistungsgrad', pct(e.leistungsgrad)],
      ['Grundpreis je kW und Monat', eur(e.grundpreis)],
      ['Arbeitspreis je kWh', eur(e.arbeitspreis)],
    );
  else z.push(['Energiekosten je Laufstunde', eur(e.satz)]);
  const ih = p.instand!;
  if (ih.art === 'faktor')
    z.push([
      'Wartung und Instandhaltung über die gesamte Nutzungsdauer',
      `${plain(dec(ih.faktor))} × Wiederbeschaffungswert`,
    ]);
  else z.push(['Wartung und Instandhaltung je Jahr', eur(ih.betrag)]);
  z.push(['Laufzeit der Anlage', `${plain(p.laufzeit!)} Stunden je Jahr`]);
  return z;
}

export const maschinensatz = defineGenerator<MaschinenParams, MaschinenSolution>({
  skillId: 'J5-maschinensatz',
  titel: 'Maschinenstundensatz',
  variants: ['stundensatz', 'kalkulation'],
  points: 8,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const variante =
      (opts.variant as MaschinenVariante | undefined) ??
      rng.pick<MaschinenVariante>(['stundensatz', 'stundensatz', 'kalkulation']);
    return variante === 'stundensatz' ? genStundensatz(rng, krumm) : genKalkulation(rng, krumm);
  },
  render: (p) => {
    if (p.variante === 'stundensatz') {
      return {
        titel: 'Maschinenstundensatz',
        kontext: 'Kalkulation der Abfüllung',
        sachverhalt: [
          `Leni Brandt möchte für die ${p.anlage} einen Maschinenstundensatz ermitteln. Durchschnittlich ist die Hälfte des Wiederbeschaffungswerts als Kapital gebunden.`,
        ],
        daten: { spalten: ['Angabe', 'Wert'], zeilen: datenStundensatz(p) },
        aufgabe:
          'Ermittle die maschinenbezogenen Gemeinkosten je Jahr und den Maschinenstundensatz.',
      };
    }
    return {
      titel: 'Maschinensatzkalkulation',
      kontext: 'Angebot der MBG',
      sachverhalt: [
        `Für einen Auftrag über ${p.auftrag} läuft die ${p.anlage} ${plain(dec(p.stunden!))} Stunden. Die Fertigungsgemeinkosten der Anlage werden über den Maschinenstundensatz verrechnet, der Rest über einen Zuschlag auf die Fertigungslöhne.`,
      ],
      daten: {
        spalten: ['Position', 'Wert'],
        zeilen: [
          ['Fertigungsmaterial', eur(p.fm!)],
          ['Materialgemeinkosten', pct(p.mgk!)],
          ['Fertigungslöhne', eur(p.fl!)],
          ['Restfertigungsgemeinkosten (auf Fertigungslöhne)', pct(p.restFgk!)],
          ['Maschinenstundensatz', `${eur(p.mss!)}/h`],
          ['Maschinenlaufzeit für den Auftrag', `${plain(dec(p.stunden!))} h`],
          ['Verwaltungsgemeinkosten', pct(p.vwgk!)],
          ['Vertriebsgemeinkosten', pct(p.vtgk!)],
        ],
      },
      aufgabe: 'Ermittle die Selbstkosten des Auftrags. Runde jeden Zwischenwert auf Cent.',
    };
  },
  solve: (p) => solveMaschinensatz(p),
  parts,
  steps: (p, s) => {
    const v = (id: string) => s.werte.get(id);
    if (p.variante === 'kalkulation') {
      return [
        {
          titel: 'Materialkosten',
          rechnung: `${eur(p.fm!)} + ${eur(v('mgk'))} = ${eur(v('mk'))}`,
        },
        {
          titel: 'Maschinenkosten',
          rechnung: `${plain(dec(p.stunden!))} h × ${eur(p.mss!)} = ${eur(v('masch'))}`,
          erlaeuterung: 'Die Anlage berechnet ihre Kosten nach Laufzeit, nicht nach Lohn.',
        },
        {
          titel: 'Fertigungskosten',
          rechnung: `${eur(p.fl!)} + ${eur(v('rest'))} + ${eur(v('masch'))} = ${eur(v('fk'))}`,
          erlaeuterung: 'Restfertigungsgemeinkosten nur auf die Fertigungslöhne.',
        },
        {
          titel: 'Herstellkosten',
          rechnung: `${eur(v('mk'))} + ${eur(v('fk'))} = ${eur(v('hk'))}`,
        },
        {
          titel: 'Selbstkosten',
          rechnung: `${eur(v('hk'))} + ${eur(v('vwgk'))} + ${eur(v('vtgk'))} = ${eur(v('sk'))}`,
        },
      ];
    }
    const e = p.energie!;
    const ih = p.instand!;
    const out = [
      {
        titel: 'Kalkulatorische Abschreibung',
        rechnung: `${eur(p.wbw!)} ÷ ${p.nd} = ${eur(v('afa'))}`,
      },
      {
        titel: 'Kalkulatorische Zinsen',
        rechnung: `${eur(p.wbw!)} ÷ 2 × ${pct(p.zinssatz!)} = ${eur(v('zinsen'))}`,
        erlaeuterung: 'Im Durchschnitt ist nur der halbe Wiederbeschaffungswert gebunden.',
      },
      {
        titel: 'Raumkosten',
        rechnung: `${plain(p.flaeche!)} m² × ${eur(p.raumSatz!)}${p.raumJe === 'monat' ? ' × 12' : ''} = ${eur(v('raum'))}`,
      },
    ];
    if (e.art === 'leistung')
      out.push(
        {
          titel: 'Energiekosten (fix)',
          rechnung: `${plain(e.kw)} kW × ${eur(e.grundpreis)} × 12 = ${eur(v('energie-fix'))}`,
        },
        {
          titel: 'Energiekosten (variabel)',
          rechnung: `${plain(e.kw)} kW × ${pct(e.leistungsgrad)} × ${plain(p.laufzeit!)} h × ${eur(e.arbeitspreis)} = ${eur(v('energie-var'))}`,
          erlaeuterung: 'Verbraucht wird nur der Leistungsgrad der installierten Leistung.',
        },
      );
    else
      out.push({
        titel: 'Energiekosten',
        rechnung: `${plain(p.laufzeit!)} h × ${eur(e.satz)} = ${eur(v('energie'))}`,
      });
    out.push(
      {
        titel: 'Wartung und Instandhaltung',
        rechnung:
          ih.art === 'faktor'
            ? `${plain(dec(ih.faktor))} × ${eur(p.wbw!)} ÷ ${p.nd} = ${eur(v('instand'))}`
            : eur(v('instand')),
        erlaeuterung:
          ih.art === 'faktor'
            ? 'Der Faktor gilt für die gesamte Nutzungsdauer, also auf die Jahre verteilen.'
            : 'Jahresbetrag laut Angabe.',
      },
      {
        titel: 'Maschinenstundensatz',
        rechnung: `${eur(v('summe'))} ÷ ${plain(p.laufzeit!)} h = ${eur(v('mss'))}/h`,
      },
    );
    return out;
  },
  hints: (p, s) =>
    p.variante === 'stundensatz'
      ? [
          'Maschinenstundensatz = maschinenbezogene Gemeinkosten je Jahr ÷ Laufzeit in Stunden je Jahr.',
          'Alle Angaben erst auf ein Jahr bringen: Monatswerte × 12, Zinsen auf den halben Wiederbeschaffungswert.',
          `Summe der maschinenbezogenen Kosten: ${eur(s.werte.get('summe'))}.`,
        ]
      : [
          'Wie die Zuschlagskalkulation, aber in der Fertigung zusätzlich Maschinenkosten = Laufzeit × Maschinenstundensatz.',
          'Die Restfertigungsgemeinkosten werden nur auf die Fertigungslöhne aufgeschlagen.',
          `Fertigungskosten = Fertigungslöhne + Restfertigungsgemeinkosten + Maschinenkosten = ${eur(s.werte.get('fk'))}.`,
        ],
  errorVariants: (p) => {
    const out: ErrorVariant[] = [];
    const add = (fehlertyp: string, w: Weg) =>
      out.push({ fehlertyp, parts: parts(p, solveMaschinensatz(p, w)) });
    if (p.variante === 'stundensatz') {
      add('zinsen-voller-wert', { zinsenVoll: true });
      if (p.raumJe === 'monat' || p.energie!.art === 'leistung')
        add('monatswert-nicht-hochgerechnet', { monatVergessen: true });
      if (p.instand!.art === 'faktor')
        add('instandhaltung-faktor-nicht-verteilt', { faktorNichtVerteilt: true });
      if (p.energie!.art === 'leistung')
        add('leistungsgrad-vergessen', { leistungsgradVergessen: true });
    } else {
      add('rest-fgk-falsche-basis', { restFgkFalscheBasis: true });
      add('maschinenkosten-vergessen', { ohneMaschinenkosten: true });
    }
    return out;
  },
  verfahren: (p) =>
    p.variante === 'stundensatz'
      ? 'Maschinenstundensatz: maschinenbezogene Kosten ÷ Laufzeit'
      : 'Maschinensatzkalkulation: Zuschlagskalkulation mit Maschinenkosten in der Fertigung',
});
