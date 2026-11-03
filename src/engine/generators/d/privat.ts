// D6 – Privatentnahmen (Geld, Gegenstände, Leistungen), Privateinlagen und Abschluss des Kontos Privat
// (04-fachregeln.md, Konvention 7 und GC-08; BA 2.3.4 und 3.3). Spezifikation: docs/m7/d.md.
import { loesung, satz, zeile, type BuchungsLoesung } from '../../booking';
import { Val, dec, sum } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, GenOptions, SolutionStep, TaskPart } from '../../task';
import { betrag, defineGenerator, eur, feld, isKrumm, pct, plain, retry } from '../base';
import { FIRMA } from '../../../config';
import { ausNetto, erzeugnisse, handelswaren } from './gemeinsam';

const PRIVAT = 'Privat';
const ENTNAHME = 'Entnahme von Gegenständen und sonstigen Leistungen';
const EK = 'Eigenkapital';

export type PrivatFall =
  | 'geld'
  | 'steuer'
  | 'privatrechnung'
  | 'gegenstand'
  | 'leistung'
  | 'einlage-geld'
  | 'einlage-sache'
  | 'abschluss';

export interface PrivatPosten {
  text: string;
  betrag: string;
}

export interface PrivatParams {
  fall: PrivatFall;
  gesellschafter: string;
  /** Wert netto (Gegenstand, Leistung), Geldbetrag, Rechnungsbetrag brutto oder Zeitwert der Sacheinlage */
  betrag: string;
  /** Gegenstand: optional Menge × Stückwert */
  menge: number;
  stueckwert: string;
  konto: 'Bank' | 'Kasse';
  /** Beschreibung (Erzeugnis, Leistung, Rechnung, eingebrachter Gegenstand) */
  was: string;
  /** Sacheinlage: Anlagekonto */
  anlagekonto: string;
  /** Abschluss: Einträge im Konto Privat */
  soll: PrivatPosten[];
  haben: PrivatPosten[];
  ustSatz: string;
}

export interface PrivatSolution {
  netto: Val;
  ust: Val;
  brutto: Val;
  /** Abschluss */
  entnahmen: Val;
  einlagen: Val;
  saldo: Val;
  saldoSeite: 'Soll' | 'Haben';
  buchung: BuchungsLoesung;
}

interface Fehlweg {
  ohneUst?: boolean;
  entnahmeKonto?: string;
  steuerKonto?: string;
  geldMitUst?: boolean;
  aufwandKonto?: string;
  mitVorsteuer?: boolean;
  vertauscht?: boolean;
  abschlussKonto?: string;
}

function entnahmeWert(p: PrivatParams): Val {
  return p.menge > 0 ? new Val(p.stueckwert).times(p.menge).fix() : new Val(p.betrag);
}

function rechne(p: PrivatParams, f: Fehlweg = {}) {
  const leer = { entnahmen: new Val(0), einlagen: new Val(0), saldo: new Val(0) };
  if (p.fall === 'gegenstand' || p.fall === 'leistung') {
    const z = ausNetto(entnahmeWert(p), p.ustSatz);
    return f.ohneUst
      ? { ...leer, netto: z.netto, ust: new Val(0), brutto: z.netto }
      : { ...leer, ...z };
  }
  if (p.fall === 'abschluss') {
    const entnahmen = sum(p.soll.map((x) => x.betrag));
    const einlagen = sum(p.haben.map((x) => x.betrag));
    const saldo = entnahmen.minus(einlagen).abs();
    return { netto: saldo, ust: new Val(0), brutto: saldo, entnahmen, einlagen, saldo };
  }
  const b = new Val(p.betrag);
  return { ...leer, netto: b, ust: new Val(0), brutto: b };
}

type Werte = ReturnType<typeof rechne>;

function buchen(p: PrivatParams, v: Werte, f: Fehlweg = {}): BuchungsLoesung {
  const s = (() => {
    switch (p.fall) {
      case 'gegenstand':
      case 'leistung': {
        const haben = [zeile(f.entnahmeKonto ?? ENTNAHME, v.netto)];
        if (!v.ust.exact.isZero()) haben.push(zeile(f.steuerKonto ?? 'Umsatzsteuer', v.ust));
        return satz([zeile(PRIVAT, v.brutto)], haben, 'Privatentnahme');
      }
      case 'geld':
      case 'steuer': {
        if (f.geldMitUst) {
          const ust = v.brutto.times(p.ustSatz).fix();
          return satz(
            [zeile(PRIVAT, v.brutto.plus(ust))],
            [zeile(p.konto, v.brutto), zeile('Umsatzsteuer', ust)],
          );
        }
        return satz(
          [zeile(f.aufwandKonto ?? PRIVAT, v.brutto)],
          [zeile(p.konto, v.brutto)],
          'Privatentnahme',
        );
      }
      case 'privatrechnung': {
        if (f.mitVorsteuer) {
          const z = { netto: v.brutto.div(dec(1).plus(p.ustSatz)).fix() };
          return satz(
            [zeile(PRIVAT, z.netto), zeile('Vorsteuer', v.brutto.minus(z.netto))],
            [zeile(p.konto, v.brutto)],
          );
        }
        return satz([zeile(PRIVAT, v.brutto)], [zeile(p.konto, v.brutto)], 'Privatentnahme');
      }
      case 'einlage-geld':
        return f.vertauscht
          ? satz([zeile(PRIVAT, v.brutto)], [zeile(p.konto, v.brutto)])
          : satz([zeile(p.konto, v.brutto)], [zeile(PRIVAT, v.brutto)], 'Privateinlage');
      case 'einlage-sache': {
        if (f.mitVorsteuer) {
          const netto = v.brutto.div(dec(1).plus(p.ustSatz)).fix();
          return satz(
            [zeile(p.anlagekonto, netto), zeile('Vorsteuer', v.brutto.minus(netto))],
            [zeile(PRIVAT, v.brutto)],
          );
        }
        return satz([zeile(p.anlagekonto, v.brutto)], [zeile(PRIVAT, v.brutto)], 'Sacheinlage');
      }
      case 'abschluss': {
        const gegen = f.abschlussKonto ?? EK;
        const entnahmenUeberwiegen = v.entnahmen.cmp(v.einlagen) > 0;
        const normal = entnahmenUeberwiegen !== Boolean(f.vertauscht);
        return normal
          ? satz([zeile(gegen, v.saldo)], [zeile(PRIVAT, v.saldo)], 'Abschluss Privat')
          : satz([zeile(PRIVAT, v.saldo)], [zeile(gegen, v.saldo)], 'Abschluss Privat');
      }
    }
  })();
  return loesung([s]);
}

export function solvePrivat(p: PrivatParams): PrivatSolution {
  const v = rechne(p);
  return {
    ...v,
    saldoSeite: v.entnahmen.cmp(v.einlagen) > 0 ? 'Haben' : 'Soll',
    buchung: buchen(p, v),
  };
}

function parts(p: PrivatParams, s: PrivatSolution): TaskPart[] {
  const buchung: TaskPart = {
    typ: 'buchungssatz',
    id: 'buchung',
    titel: p.fall === 'abschluss' ? 'Abschlussbuchung' : 'Buchungssatz',
    loesung: s.buchung,
  };
  if (p.fall === 'gegenstand' || p.fall === 'leistung') {
    return [
      {
        typ: 'rechenkette',
        id: 'rechnung',
        titel: 'Entnahme bewerten',
        felder: [
          feld('netto', 'Wert der Entnahme (netto)', s.netto),
          feld('ust', 'Umsatzsteuer', s.ust),
          feld('brutto', 'Belastung des Kontos Privat', s.brutto),
        ],
      },
      buchung,
    ];
  }
  if (p.fall === 'abschluss') {
    return [
      {
        typ: 'tkonto',
        id: 'privat',
        titel: 'Konto Privat',
        konto: PRIVAT,
        soll: p.soll.map((x) => ({ text: x.text, betrag: x.betrag })),
        haben: p.haben.map((x) => ({ text: x.text, betrag: x.betrag })),
        felder: [
          feld('saldo', 'Saldo des Kontos Privat', s.saldo),
          {
            typ: 'auswahl',
            id: 'seite',
            label: 'Seite des Saldos',
            optionen: ['Soll', 'Haben'],
            soll: s.saldoSeite,
          },
          {
            typ: 'auswahl',
            id: 'gegenkonto',
            label: 'Gegenkonto',
            optionen: ['Eigenkapital', 'Gewinn- und Verlustkonto', 'Schlussbilanzkonto'],
            soll: 'Eigenkapital',
          },
        ],
      },
      buchung,
    ];
  }
  return [buchung];
}

function withBuchung(
  p: PrivatParams,
  fehlertyp: string,
  f: Fehlweg,
  felder?: Partial<PrivatSolution>,
) {
  const v = rechne(p, f);
  const s: PrivatSolution = {
    ...v,
    saldoSeite: v.entnahmen.cmp(v.einlagen) > 0 ? 'Haben' : 'Soll',
    buchung: buchen(p, v, f),
    ...felder,
  };
  return { fehlertyp, parts: parts(p, s) };
}

function variants(p: PrivatParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  switch (p.fall) {
    case 'gegenstand':
    case 'leistung':
      out.push(withBuchung(p, 'entnahme-ohne-ust', { ohneUst: true }));
      out.push(
        withBuchung(p, 'entnahme-als-erloes', {
          entnahmeKonto: 'Umsatzerlöse für eigene Erzeugnisse',
        }),
      );
      out.push(withBuchung(p, 'steuer-falsches-konto', { steuerKonto: 'Vorsteuer' }));
      break;
    case 'geld':
      out.push(withBuchung(p, 'geldentnahme-mit-ust', { geldMitUst: true }));
      out.push(
        withBuchung(p, 'privat-als-aufwand', {
          aufwandKonto: 'Sonstige betriebliche Aufwendungen',
        }),
      );
      break;
    case 'steuer':
      out.push(withBuchung(p, 'privat-als-aufwand', { aufwandKonto: 'Betriebssteuern' }));
      break;
    case 'privatrechnung':
      out.push(withBuchung(p, 'privat-mit-vorsteuer', { mitVorsteuer: true }));
      break;
    case 'einlage-geld':
      out.push(withBuchung(p, 'einlage-entnahme-verwechselt', { vertauscht: true }));
      break;
    case 'einlage-sache':
      out.push(withBuchung(p, 'sacheinlage-mit-vorsteuer', { mitVorsteuer: true }));
      break;
    case 'abschluss':
      out.push(
        withBuchung(p, 'privatabschluss-ueber-guv', { abschlussKonto: 'Gewinn- und Verlustkonto' }),
      );
      out.push(
        withBuchung(
          p,
          'privatabschluss-richtung',
          { vertauscht: true },
          { saldoSeite: solvePrivat(p).saldoSeite === 'Soll' ? 'Haben' : 'Soll' },
        ),
      );
      break;
  }
  return out;
}

function render(p: PrivatParams) {
  const u = pct(p.ustSatz);
  const g = p.gesellschafter;
  const kontoText = p.konto === 'Bank' ? 'vom Geschäftskonto (Bank)' : 'aus der Geschäftskasse';
  let sachverhalt: string[];
  switch (p.fall) {
    case 'geld':
      sachverhalt = [
        p.konto === 'Bank'
          ? `${g} überweist sich ${eur(p.betrag)} vom Geschäftskonto der MBG auf das private Girokonto.`
          : `${g} nimmt ${eur(p.betrag)} aus der Geschäftskasse für private Einkäufe.`,
      ];
      break;
    case 'steuer':
      sachverhalt = [
        `Die Einkommensteuer-Vorauszahlung von ${g} über ${eur(p.betrag)} wird vom Geschäftskonto der MBG überwiesen.`,
        'Die MBG ist eine OHG; die Einkommensteuer schulden die Gesellschafter privat.',
      ];
      break;
    case 'privatrechnung':
      sachverhalt = [
        `Die Rechnung eines Möbelhauses für ${p.was} in der Privatwohnung von ${g} über ${eur(p.betrag)} einschließlich ${u} Umsatzsteuer wird ${kontoText} bezahlt.`,
      ];
      break;
    case 'gegenstand':
      sachverhalt = [
        p.menge > 0
          ? `${g} entnimmt dem Lager ${plain(p.menge)} Kartons ${p.was} für eine private Feier. Der Wert der Entnahme beträgt ${eur(p.stueckwert)} netto je Karton.`
          : `${g} entnimmt dem Lager ${p.was} für private Zwecke. Der Wert der Entnahme beträgt ${eur(p.betrag)} netto.`,
        `Die Entnahme unterliegt der Umsatzsteuer (${u}).`,
      ];
      break;
    case 'leistung':
      sachverhalt = [
        `${p.was} Der Wert dieser Leistung beträgt ${eur(p.betrag)} netto.`,
        `Die private Nutzung unterliegt der Umsatzsteuer (${u}).`,
      ];
      break;
    case 'einlage-geld':
      sachverhalt = [
        p.konto === 'Bank'
          ? `${g} überweist ${eur(p.betrag)} aus privaten Ersparnissen auf das Geschäftskonto der MBG.`
          : `${g} legt ${eur(p.betrag)} aus privatem Geld in die Geschäftskasse ein.`,
      ];
      break;
    case 'einlage-sache':
      sachverhalt = [
        `${g} bringt ${p.was} aus dem Privatvermögen dauerhaft in die MBG ein. Der Zeitwert beträgt ${eur(p.betrag)}.`,
        'Für die Einlage gibt es keine Rechnung mit ausgewiesener Umsatzsteuer.',
      ];
      break;
    case 'abschluss':
      sachverhalt = [
        'Am 31.12. zeigt das Konto Privat der MBG folgende Einträge (Summen des Jahres):',
      ];
      break;
  }
  const daten =
    p.fall === 'abschluss'
      ? {
          spalten: ['Seite', 'Eintrag', 'Betrag'],
          zeilen: [
            ...p.soll.map((x) => ['Soll', x.text, eur(x.betrag)]),
            ...p.haben.map((x) => ['Haben', x.text, eur(x.betrag)]),
          ],
        }
      : undefined;
  return {
    titel:
      p.fall === 'abschluss'
        ? 'Abschluss des Kontos Privat'
        : p.fall.startsWith('einlage')
          ? 'Privateinlage'
          : 'Privatentnahme',
    kontext:
      p.fall === 'abschluss'
        ? '31. Dezember: Jahresabschluss'
        : 'Juni: Privates bei den Gesellschaftern',
    sachverhalt,
    ...(daten ? { daten } : {}),
    aufgabe:
      p.fall === 'abschluss'
        ? 'Ermittle Saldo, Seite und Gegenkonto und bilde die Abschlussbuchung.'
        : p.fall === 'gegenstand' || p.fall === 'leistung'
          ? 'Bewerte die Entnahme und bilde den Buchungssatz.'
          : 'Bilde den Buchungssatz.',
  };
}

function steps(p: PrivatParams, s: PrivatSolution): SolutionStep[] {
  const u = pct(p.ustSatz);
  switch (p.fall) {
    case 'gegenstand':
    case 'leistung':
      return [
        ...(p.menge > 0
          ? [
              {
                titel: 'Wert der Entnahme',
                rechnung: `${plain(p.menge)} × ${eur(p.stueckwert)} = ${eur(s.netto)}`,
              },
            ]
          : []),
        {
          titel: 'Umsatzsteuer',
          rechnung: `${eur(s.netto)} × ${u} = ${eur(s.ust)}; Privat ${eur(s.brutto)}`,
          erlaeuterung:
            'Wer Gegenstände oder Leistungen des Unternehmens privat verbraucht, wird umsatzsteuerlich wie ein Kunde behandelt.',
        },
        {
          titel: 'Buchung',
          rechnung: `Privat ${eur(s.brutto)} an Entnahme v. G. u. s. L. ${eur(s.netto)}, an Umsatzsteuer ${eur(s.ust)}`,
          erlaeuterung:
            'Die Entnahme ist ein Ertragskonto: Es gleicht den Aufwand aus, der für die entnommenen Dinge schon gebucht wurde.',
        },
      ];
    case 'geld':
    case 'steuer':
    case 'privatrechnung':
      return [
        {
          titel: 'Privat statt Aufwand',
          rechnung: `Privat an ${p.konto} ${eur(s.brutto)}`,
          erlaeuterung:
            p.fall === 'privatrechnung'
              ? 'Für private Ausgaben gibt es keinen Vorsteuerabzug. Das Konto Privat wird mit dem vollen Rechnungsbetrag belastet.'
              : p.fall === 'steuer'
                ? 'Die Einkommensteuer ist eine Personensteuer der Gesellschafter, kein Aufwand der OHG.'
                : 'Geld verlässt das Unternehmen für private Zwecke: Das Eigenkapital sinkt, ohne Aufwand und ohne Umsatzsteuer.',
        },
      ];
    case 'einlage-geld':
    case 'einlage-sache':
      return [
        {
          titel: 'Privateinlage',
          rechnung: `${p.fall === 'einlage-geld' ? p.konto : p.anlagekonto} an Privat ${eur(s.brutto)}`,
          erlaeuterung:
            'Einlagen erhöhen das Eigenkapital und stehen im Haben des Kontos Privat. Sie sind kein Ertrag.',
        },
      ];
    case 'abschluss':
      return [
        {
          titel: 'Summen vergleichen',
          rechnung: `Entnahmen (Soll) ${eur(s.entnahmen)} · Einlagen (Haben) ${eur(s.einlagen)} → Saldo ${eur(s.saldo)} auf der ${s.saldoSeite}seite`,
        },
        {
          titel: 'Abschluss über das Eigenkapital',
          rechnung:
            s.saldoSeite === 'Haben'
              ? `Eigenkapital an Privat ${eur(s.saldo)}`
              : `Privat an Eigenkapital ${eur(s.saldo)}`,
          erlaeuterung:
            'Privat ist ein Unterkonto des Eigenkapitals. Überwiegen die Entnahmen, sinkt das Eigenkapital; überwiegen die Einlagen, steigt es.',
        },
      ];
  }
}

const LEISTUNGEN: ((g: string) => string)[] = [
  (g) =>
    `Ein Auslieferungs-Lkw der MBG wird ein Wochenende lang für den privaten Umzug von ${g} genutzt.`,
  (g) => `Die Werkstatt der MBG wartet die private Gartenpumpe von ${g}.`,
  (g) =>
    `Ein Lagermitarbeiter der MBG hilft während seiner Arbeitszeit beim Aufbau der privaten Gartenparty von ${g}.`,
];

const MOEBEL = ['ein Sofa', 'eine Einbauküche', 'einen Esstisch mit Stühlen'];

const SACHEINLAGEN: [string, string][] = [
  ['den privaten Kombi', 'Fuhrpark'],
  ['einen privaten Laptop', 'Betriebs- und Geschäftsausstattung'],
  ['einen privaten Schreibtisch mit Bürostuhl', 'Betriebs- und Geschäftsausstattung'],
];

function abschlussPosten(r: Rng, krumm: boolean): { soll: PrivatPosten[]; haben: PrivatPosten[] } {
  const soll: PrivatPosten[] = [
    { text: 'Geldentnahmen', betrag: betrag(r, 12_000, 60_000, 100, krumm) },
    { text: 'Einkommensteuer', betrag: betrag(r, 4_000, 20_000, 100, krumm) },
    {
      text: 'Entnahme Erzeugnisse',
      betrag: ausNetto(String(r.step(200, 2_000, 100)), '0.19').brutto.value.toFixed(2),
    },
  ];
  const haben: PrivatPosten[] = [];
  const n = r.pick([0, 1, 1, 2]);
  if (n >= 1) haben.push({ text: 'Einlage Bank', betrag: betrag(r, 5_000, 100_000, 1_000, krumm) });
  if (n >= 2) haben.push({ text: 'Sacheinlage Pkw', betrag: betrag(r, 5_000, 30_000, 500, krumm) });
  return { soll, haben };
}

function generate(rng: Rng, opts: GenOptions = {}): PrivatParams {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const v = opts.variant;
  const fall: PrivatFall =
    v === 'geld'
      ? rng.pick(['geld', 'steuer'] as const)
      : v === 'gegenstand' || v === 'leistung' || v === 'privatrechnung' || v === 'abschluss'
        ? v
        : v === 'einlage'
          ? rng.pick(['einlage-geld', 'einlage-sache'] as const)
          : rng.pick([
              'geld',
              'steuer',
              'privatrechnung',
              'gegenstand',
              'gegenstand',
              'leistung',
              'einlage-geld',
              'einlage-sache',
              'abschluss',
            ] as const);
  const make = (r: Rng): PrivatParams => {
    const base: PrivatParams = {
      fall,
      gesellschafter: r.pick(FIRMA.gesellschafter),
      betrag: '0',
      menge: 0,
      stueckwert: '0',
      konto: 'Bank',
      was: '',
      anlagekonto: '',
      soll: [],
      haben: [],
      ustSatz: '0.19',
    };
    switch (fall) {
      case 'geld':
        return {
          ...base,
          konto: r.chance(0.6) ? 'Bank' : 'Kasse',
          betrag: betrag(r, 200, 8_000, 50, krumm),
        };
      case 'steuer':
        return { ...base, betrag: betrag(r, 1_000, 15_000, 100, krumm) };
      case 'privatrechnung':
        return { ...base, was: r.pick(MOEBEL), betrag: betrag(r, 500, 12_000, 1, true) };
      case 'gegenstand': {
        const ware = r.chance(0.7) ? r.pick(erzeugnisse()) : r.pick(handelswaren());
        if (r.chance(0.4)) {
          const stueck = krumm
            ? betrag(r, 3, 40, 1, true)
            : r.pick(['6', '7.5', '8', '12', '15', '18', '24']);
          return { ...base, was: ware, menge: r.step(10, 120, 10), stueckwert: stueck };
        }
        return { ...base, was: ware, betrag: betrag(r, 100, 3_000, 10, krumm) };
      }
      case 'leistung':
        return {
          ...base,
          was: r.pick(LEISTUNGEN)(base.gesellschafter),
          betrag: betrag(r, 80, 1_500, 10, krumm),
        };
      case 'einlage-geld':
        return {
          ...base,
          konto: r.chance(0.8) ? 'Bank' : 'Kasse',
          betrag: betrag(r, 2_000, 80_000, 500, krumm),
        };
      case 'einlage-sache': {
        const [was, konto] = r.pick(SACHEINLAGEN);
        return {
          ...base,
          was,
          anlagekonto: konto,
          betrag: betrag(
            r,
            konto === 'Fuhrpark' ? 4_000 : 300,
            konto === 'Fuhrpark' ? 25_000 : 2_500,
            100,
            krumm,
          ),
        };
      }
      case 'abschluss':
        return { ...base, ...abschlussPosten(r, krumm) };
    }
  };
  return retry(rng, make, (p) => {
    const w = rechne(p);
    if (p.fall === 'abschluss') return !w.saldo.exact.isZero();
    return krumm || w.ust.steps === 0;
  });
}

export const privat = defineGenerator<PrivatParams, PrivatSolution>({
  skillId: 'D6-privat',
  titel: 'Privatentnahmen und -einlagen',
  variants: ['geld', 'gegenstand', 'leistung', 'privatrechnung', 'einlage', 'abschluss'],
  points: 2,
  generate,
  render,
  solve: solvePrivat,
  parts,
  steps,
  hints: (p, s) => {
    switch (p.fall) {
      case 'gegenstand':
      case 'leistung':
        return [
          'Privatentnahmen buchst du im Soll des Kontos Privat.',
          `Gegenstände und Leistungen werden mit dem Nettowert als Entnahme v. G. u. s. L. erfasst, dazu ${pct(p.ustSatz)} Umsatzsteuer.`,
          `Privat ${eur(s.brutto)} an Entnahme v. G. u. s. L. ${eur(s.netto)}, an Umsatzsteuer ${eur(s.ust)}.`,
        ];
      case 'abschluss':
        return [
          'Im Soll stehen die Entnahmen, im Haben die Einlagen. Der Saldo steht auf der kleineren Seite.',
          'Privat ist ein Unterkonto des Eigenkapitals – nicht der GuV.',
          s.saldoSeite === 'Haben'
            ? `Eigenkapital an Privat ${eur(s.saldo)}.`
            : `Privat an Eigenkapital ${eur(s.saldo)}.`,
        ];
      case 'einlage-geld':
      case 'einlage-sache':
        return [
          'Einlagen erhöhen das Eigenkapital: Sie stehen im Haben des Kontos Privat.',
          p.fall === 'einlage-sache'
            ? `Der eingebrachte Gegenstand kommt mit dem Zeitwert auf das Konto ${p.anlagekonto} – ohne Vorsteuer.`
            : `Das Geld fließt auf das Konto ${p.konto}.`,
          `${p.fall === 'einlage-geld' ? p.konto : p.anlagekonto} an Privat ${eur(s.brutto)}.`,
        ];
      default:
        return [
          'Ist das betrieblich veranlasst oder privat? Privates gehört nicht in die GuV.',
          p.fall === 'privatrechnung'
            ? 'Für private Ausgaben darf keine Vorsteuer abgezogen werden.'
            : 'Geldentnahmen und private Steuern lösen keine Umsatzsteuer aus.',
          `Privat an ${p.konto} ${eur(s.brutto)}.`,
        ];
    }
  },
  errorVariants: variants,
  verfahren: (p) =>
    p.fall === 'abschluss'
      ? 'Konto Privat über das Eigenkapital abschließen'
      : p.fall === 'gegenstand' || p.fall === 'leistung'
        ? 'Privatentnahme von Gegenständen/Leistungen mit Umsatzsteuer'
        : p.fall.startsWith('einlage')
          ? 'Privateinlage: Haben auf dem Konto Privat'
          : p.fall === 'geld'
            ? 'Privatentnahme von Geld: Privat an Bank bzw. Kasse'
            : 'Private Ausgabe über das Geschäftskonto: Privat an Bank, ohne Vorsteuer',
});
