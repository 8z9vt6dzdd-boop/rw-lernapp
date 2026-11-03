// F3 – Wertmaßstäbe (BA 5.2, 5.3.1): Herstellungskosten (Wertunter- und -obergrenze),
// Niederstwertprinzip im Umlauf- und Anlagevermögen, Höchstwertprinzip bei Schulden.
import { Val, dec } from '../../money';
import type { ErrorVariant, Feld, TaskPart, TaskText } from '../../task';
import type { FirmaConfig } from '../../firma';
import type { Rng } from '../../rng';
import { defineGenerator, eur, feld, isKrumm, num, pct, plain, retry } from '../base';

export type F3Variante =
  'herstellungskosten' | 'niederstwert-uv' | 'niederstwert-av' | 'hoechstwert';

export interface HkParams {
  variante: 'herstellungskosten';
  anlage: string;
  /** Materialeinzelkosten */
  mek: string;
  /** Fertigungslöhne (Fertigungseinzelkosten) */
  fl: string;
  mgkSatz: string;
  fgkSatz: string;
  /** Sondereinzelkosten der Fertigung */
  sekf: string;
  /** Verwaltungsgemeinkosten in Prozent der Wertuntergrenze */
  vwgkSatz: string;
  /** Sondereinzelkosten des Vertriebs (dürfen nicht einbezogen werden) */
  sekv: string;
  vtgkSatz: string;
  /** auf den Herstellungszeitraum entfallende Fremdkapitalzinsen (Wahlbestandteil) */
  fkZinsen: string;
}

export interface UvParams {
  variante: 'niederstwert-uv';
  stueck: number;
  /** Anschaffungskosten je Aktie */
  akJeStueck: string;
  /** Börsenkurs am Bilanzstichtag */
  kurs: string;
  /** Kurserholung im neuen Jahr erwartet (ändert am strengen Niederstwertprinzip nichts) */
  erholungErwartet: boolean;
}

export interface AvParams {
  variante: 'niederstwert-av';
  anlage: string;
  ak: string;
  nd: number;
  /** abgelaufene Nutzungsjahre bis zum Bilanzstichtag (einschließlich laufendem Jahr) */
  jahre: number;
  /** beizulegender Wert am Bilanzstichtag */
  beizulegend: string;
  dauernd: boolean;
}

export interface HwParams {
  variante: 'hoechstwert';
  lieferant: string;
  ware: string;
  /** Rechnungsbetrag in US-Dollar */
  usd: string;
  /** Kurs bei Einbuchung: US-Dollar je 1 € */
  kursEin: string;
  /** Kurs am Bilanzstichtag: US-Dollar je 1 € */
  kursStichtag: string;
}

export type F3Params = HkParams | UvParams | AvParams | HwParams;

export interface F3Solution {
  // Herstellungskosten
  mgk?: Val;
  fgk?: Val;
  untergrenze?: Val;
  vwgk?: Val;
  obergrenze?: Val;
  // Niederstwertprinzip (UV/AV)
  ausgangswert?: Val;
  vergleichswert?: Val;
  planmaessig?: Val;
  abschreibung?: Val;
  // Höchstwertprinzip
  wertEin?: Val;
  wertStichtag?: Val;
  erhoehung?: Val;
  ansatz?: Val;
  prinzip?: string;
}

export const PRINZIPIEN = [
  'Strenges Niederstwertprinzip',
  'Gemildertes Niederstwertprinzip',
  'Höchstwertprinzip',
] as const;
const [STRENG, GEMILDERT, HOECHST] = PRINZIPIEN;
const EINBEZUG = ['Pflicht', 'Wahlrecht', 'Verbot'];

interface Rechenweg {
  /** Untergrenze nur aus Einzelkosten (veraltete Sicht) */
  nurEinzelkosten?: boolean;
  /** Vertriebskosten in die Obergrenze einbezogen */
  mitVertrieb?: boolean;
  /** Verwaltungsgemeinkosten schon in der Untergrenze */
  verwaltungInUntergrenze?: boolean;
  /** UV: Anschaffungskosten trotz niedrigerem Kurs */
  akBehalten?: boolean;
  /** höherer Tageswert angesetzt (Anschaffungskosten als Obergrenze missachtet) */
  hoehererWert?: boolean;
  /** UV: gemildertes statt strenges Niederstwertprinzip */
  gemildert?: boolean;
  /** AV: Abschreibung trotz nur vorübergehender Wertminderung */
  ohneDauer?: boolean;
  /** AV: mit den ursprünglichen statt den fortgeführten Anschaffungskosten verglichen */
  ohneFortfuehrung?: boolean;
  /** Fremdwährung: Dollarbetrag mit dem Kurs multipliziert statt geteilt */
  multipliziert?: boolean;
  /** Fremdwährung: Kursanstieg der Schuld nicht berücksichtigt */
  keineErhoehung?: boolean;
}

function min(a: Val, b: Val): Val {
  return a.cmp(b) <= 0 ? a : b;
}

export function solveWertmassstab(p: F3Params, w: Rechenweg = {}): F3Solution {
  switch (p.variante) {
    case 'herstellungskosten': {
      const mgk = new Val(p.mek).times(p.mgkSatz).round();
      const fgk = new Val(p.fl).times(p.fgkSatz).round();
      const einzel = new Val(p.mek).plus(p.fl).plus(p.sekf);
      const basis = einzel.plus(mgk).plus(fgk);
      const vwgk = basis.times(p.vwgkSatz).round();
      let untergrenze = w.nurEinzelkosten ? einzel : basis;
      if (w.verwaltungInUntergrenze) untergrenze = untergrenze.plus(vwgk);
      let obergrenze = basis.plus(vwgk).plus(p.fkZinsen);
      if (w.mitVertrieb) {
        const vtgk = basis.plus(vwgk).times(p.vtgkSatz).round();
        obergrenze = obergrenze.plus(p.sekv).plus(vtgk);
      }
      return { mgk, fgk, untergrenze, vwgk, obergrenze };
    }
    case 'niederstwert-uv': {
      const ak = new Val(p.akJeStueck).times(p.stueck);
      const tw = new Val(p.kurs).times(p.stueck);
      let ansatz = min(ak, tw);
      if (w.akBehalten || (w.gemildert && p.erholungErwartet)) ansatz = ak;
      if (w.hoehererWert) ansatz = tw;
      const abschreibung = ansatz.cmp(ak) < 0 ? ak.minus(ansatz) : new Val(0);
      return {
        ausgangswert: ak,
        vergleichswert: tw,
        ansatz,
        abschreibung,
        prinzip: w.gemildert ? GEMILDERT : STRENG,
      };
    }
    case 'niederstwert-av': {
      const planmaessig = new Val(p.ak).div(p.nd).round();
      const fortgefuehrt = w.ohneFortfuehrung
        ? new Val(p.ak)
        : new Val(p.ak).minus(planmaessig.times(p.jahre));
      const bw = new Val(p.beizulegend);
      let ansatz = fortgefuehrt;
      if (bw.cmp(fortgefuehrt) < 0 && (p.dauernd || w.ohneDauer)) ansatz = bw;
      if (w.hoehererWert && bw.cmp(fortgefuehrt) > 0) ansatz = bw;
      const abschreibung = ansatz.cmp(fortgefuehrt) < 0 ? fortgefuehrt.minus(ansatz) : new Val(0);
      return {
        planmaessig,
        ausgangswert: fortgefuehrt,
        vergleichswert: bw,
        abschreibung,
        ansatz,
        prinzip: w.ohneDauer ? STRENG : GEMILDERT,
      };
    }
    case 'hoechstwert': {
      const umrechnen = (kurs: string): Val =>
        w.multipliziert ? new Val(p.usd).times(kurs).fix() : new Val(p.usd).div(kurs).fix();
      const wertEin = umrechnen(p.kursEin);
      const wertStichtag = umrechnen(p.kursStichtag);
      const ansatz = w.keineErhoehung
        ? wertEin
        : wertStichtag.cmp(wertEin) > 0
          ? wertStichtag
          : wertEin;
      return {
        wertEin,
        wertStichtag,
        erhoehung: ansatz.minus(wertEin),
        ansatz,
        prinzip: HOECHST,
      };
    }
  }
}

function prinzipFeld(soll: string): Feld {
  return {
    typ: 'auswahl',
    id: 'prinzip',
    label: 'Maßgeblicher Bewertungsgrundsatz',
    optionen: [...PRINZIPIEN],
    soll,
  };
}

function parts(p: F3Params, s: F3Solution): TaskPart[] {
  let felder: Feld[];
  switch (p.variante) {
    case 'herstellungskosten':
      felder = [
        feld('mgk', 'Materialgemeinkosten', s.mgk!),
        feld('fgk', 'Fertigungsgemeinkosten', s.fgk!),
        feld('untergrenze', 'Wertuntergrenze der Herstellungskosten', s.untergrenze!),
        feld('vwgk', 'Verwaltungsgemeinkosten', s.vwgk!),
        feld('obergrenze', 'Wertobergrenze der Herstellungskosten', s.obergrenze!),
        {
          typ: 'auswahl',
          id: 'vertrieb',
          label: 'Einbeziehung der Vertriebskosten',
          optionen: EINBEZUG,
          soll: 'Verbot',
        },
      ];
      break;
    case 'niederstwert-uv':
      felder = [
        feld('ak', 'Anschaffungskosten der Aktien', s.ausgangswert!),
        feld('tw', 'Wert zum Börsenkurs am 31.12.', s.vergleichswert!),
        prinzipFeld(s.prinzip!),
        feld('ansatz', 'Bilanzansatz am 31.12.', s.ansatz!),
        feld('abschreibung', 'Abschreibung', s.abschreibung!),
      ];
      break;
    case 'niederstwert-av':
      felder = [
        feld('planm', 'Planmäßige Abschreibung je Jahr', s.planmaessig!),
        feld('fortgefuehrt', 'Fortgeführte Anschaffungskosten am 31.12.', s.ausgangswert!),
        prinzipFeld(s.prinzip!),
        feld('apl', 'Außerplanmäßige Abschreibung', s.abschreibung!),
        feld('ansatz', 'Bilanzansatz am 31.12.', s.ansatz!),
      ];
      break;
    case 'hoechstwert':
      felder = [
        feld('ein', 'Wert der Verbindlichkeit bei Einbuchung', s.wertEin!),
        feld('stichtag', 'Wert zum Kurs am 31.12.', s.wertStichtag!),
        prinzipFeld(s.prinzip!),
        feld('ansatz', 'Bilanzansatz der Verbindlichkeit', s.ansatz!),
        feld('erhoehung', 'Erhöhung der Verbindlichkeit', s.erhoehung!),
      ];
      break;
  }
  return [{ typ: 'rechenkette', id: 'wert', titel: 'Bewertung zum Bilanzstichtag', felder }];
}

function variants(p: F3Params): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Rechenweg) =>
    out.push({ fehlertyp, parts: parts(p, solveWertmassstab(p, w)) });
  switch (p.variante) {
    case 'herstellungskosten':
      add('hk-nur-einzelkosten', { nurEinzelkosten: true });
      add('vertriebskosten-in-herstellungskosten', { mitVertrieb: true });
      add('verwaltung-in-untergrenze', { verwaltungInUntergrenze: true });
      break;
    case 'niederstwert-uv':
      if (dec(p.kurs).lt(p.akJeStueck)) {
        add('niederstwert-missachtet', { akBehalten: true });
        if (p.erholungErwartet) add('gemildert-statt-streng', { gemildert: true });
      } else add('tageswert-ueber-ak', { hoehererWert: true });
      break;
    case 'niederstwert-av': {
      const s = solveWertmassstab(p);
      if (s.vergleichswert!.cmp(s.ausgangswert!) < 0) {
        if (!p.dauernd) add('abwertung-ohne-dauer', { ohneDauer: true });
        else add('streng-statt-gemildert', { ohneDauer: true });
        add('fortfuehrung-vergessen', { ohneFortfuehrung: true });
      } else add('tageswert-ueber-ak', { hoehererWert: true });
      break;
    }
    case 'hoechstwert':
      add('kurs-multipliziert', { multipliziert: true });
      add('hoechstwert-missachtet', { keineErhoehung: true });
      break;
  }
  return out;
}

const ANLAGEN = ['Etikettiermaschine', 'Abfüllanlage', 'Sirupanlage', 'Palettieranlage'];
const EIGENBAU = [
  'Förderband für die Abfüllung',
  'Mischtank für den Sirupkeller',
  'Palettenwickler',
];

function genHk(rng: Rng, krumm: boolean): HkParams {
  const mek = krumm ? rng.step(10_000, 90_000, 10) : rng.step(10_000, 90_000, 1_000);
  const fl = rng.step(5_000, 40_000, 1_000);
  return {
    variante: 'herstellungskosten',
    anlage: rng.pick(EIGENBAU),
    mek: String(mek),
    fl: String(fl),
    mgkSatz: rng.pick(['0.1', '0.15', '0.2', '0.25', '0.3', '0.4']),
    fgkSatz: rng.pick(['0.8', '1', '1.2', '1.5', '2', '2.5', '3']),
    sekf: String(rng.step(500, 6_000, 500)),
    vwgkSatz: rng.pick(['0.05', '0.08', '0.1', '0.12']),
    sekv: String(rng.step(500, 4_000, 500)),
    vtgkSatz: rng.pick(['0.03', '0.05', '0.06']),
    fkZinsen: String(rng.step(500, 3_000, 250)),
  };
}

function genUv(rng: Rng, krumm: boolean): UvParams {
  const stueck = rng.step(200, 3_000, 100);
  const ak = krumm ? rng.step(1_000, 9_000, 1) / 100 : rng.step(20, 90, 0.5);
  // etwa 70 % Kursverluste, 30 % Kursgewinne
  const faktor = rng.chance(0.7) ? rng.step(70, 95, 1) / 100 : rng.step(105, 130, 1) / 100;
  const kurs = dec(ak)
    .times(faktor)
    .toDecimalPlaces(krumm ? 2 : 1)
    .toFixed(2);
  return {
    variante: 'niederstwert-uv',
    stueck,
    akJeStueck: dec(ak).toFixed(2),
    kurs,
    erholungErwartet: rng.chance(0.5),
  };
}

function genAv(rng: Rng): AvParams {
  const nd = rng.pick([5, 6, 8, 10]);
  const jaehrlich = rng.step(4_000, 30_000, 1_000);
  const jahre = rng.int(1, nd - 2);
  const fortgefuehrt = jaehrlich * (nd - jahre);
  const lower = rng.chance(0.75);
  const faktor = lower ? rng.step(50, 90, 5) / 100 : rng.step(110, 140, 5) / 100;
  return {
    variante: 'niederstwert-av',
    anlage: rng.pick(ANLAGEN),
    ak: String(jaehrlich * nd),
    nd,
    jahre,
    beizulegend: String(Math.round((fortgefuehrt * faktor) / 500) * 500),
    dauernd: rng.chance(0.5),
  };
}

function genHw(rng: Rng): HwParams {
  const eur1 = rng.step(5_000, 60_000, 100);
  const kursEin = dec(rng.step(10_400, 11_800, 5)).div(10_000);
  const kursStichtag = kursEin.minus(dec(rng.step(80, 600, 5)).div(10_000));
  const [lieferant, ware] = rng.pick([
    ['einem Aromenhersteller in Kalifornien', 'Aromen'],
    ['einem Gerätebauer in Texas', 'Ersatzteile für die Abfüllanlage'],
  ] as const);
  return {
    variante: 'hoechstwert',
    lieferant,
    ware,
    usd: kursEin.times(eur1).toFixed(2),
    kursEin: kursEin.toFixed(4),
    kursStichtag: kursStichtag.toFixed(4),
  };
}

const kurs = (k: string) => num(k, 4);
const usd = (x: string) => num(x, 2);

function render(p: F3Params, firma: FirmaConfig): TaskText {
  const kontext = 'Dezember: Jahresabschluss und Inventur';
  switch (p.variante) {
    case 'herstellungskosten':
      return {
        titel: 'Herstellungskosten einer selbst gebauten Anlage',
        kontext,
        sachverhalt: [
          `Die Werkstatt der ${firma.kurz} hat ein ${p.anlage} selbst gebaut. Es soll mit seinen Herstellungskosten aktiviert werden. Laut Betriebsabrechnung sind angefallen:`,
          `Auf den Herstellungszeitraum entfallen außerdem Fremdkapitalzinsen von ${eur(p.fkZinsen)}, die zur Finanzierung der Herstellung aufgenommen wurden.`,
        ],
        daten: {
          spalten: ['Kostenposition', 'Wert'],
          zeilen: [
            ['Materialeinzelkosten', eur(p.mek)],
            ['Fertigungslöhne (Fertigungseinzelkosten)', eur(p.fl)],
            ['Materialgemeinkosten', `${pct(p.mgkSatz)} der Materialeinzelkosten`],
            ['Fertigungsgemeinkosten', `${pct(p.fgkSatz)} der Fertigungslöhne`],
            ['Sondereinzelkosten der Fertigung', eur(p.sekf)],
            ['Verwaltungsgemeinkosten', `${pct(p.vwgkSatz)} der Wertuntergrenze`],
            ['Sondereinzelkosten des Vertriebs', eur(p.sekv)],
            ['Vertriebsgemeinkosten', `${pct(p.vtgkSatz)} der Herstellungskosten`],
          ],
        },
        aufgabe:
          'Ermittle die Wertuntergrenze und die Wertobergrenze der Herstellungskosten nach Handelsrecht (§ 255 Abs. 2 HGB) und gib an, wie Vertriebskosten zu behandeln sind.',
      };
    case 'niederstwert-uv':
      return {
        titel: 'Aktien im Umlaufvermögen bewerten',
        kontext,
        sachverhalt: [
          `Die ${firma.kurz} hat überschüssige Liquidität kurzfristig in ${plain(p.stueck)} Aktien angelegt (Umlaufvermögen). Anschaffungskosten je Aktie: ${eur(p.akJeStueck)}.`,
          `Am 31.12. notiert die Aktie an der Börse bei ${eur(p.kurs)}.${
            p.erholungErwartet
              ? ' Die Hausbank rechnet damit, dass der Kurs im Frühjahr wieder steigt.'
              : ''
          }`,
        ],
        aufgabe:
          'Ermittle den Bilanzansatz der Aktien zum 31.12. und eine notwendige Abschreibung.',
      };
    case 'niederstwert-av': {
      const s = solveWertmassstab(p);
      const lower = s.vergleichswert!.cmp(s.ausgangswert!) < 0;
      return {
        titel: 'Anlage im Anlagevermögen bewerten',
        kontext,
        sachverhalt: [
          `Die ${firma.kurz} hat zu Beginn eines Geschäftsjahres eine ${p.anlage} für ${eur(p.ak)} angeschafft. Sie wird über ${p.nd} Jahre linear abgeschrieben (Restwert 0 €).`,
          `Am 31.12. dieses Jahres ist sie genau ${p.jahre} ${p.jahre === 1 ? 'Jahr' : 'Jahre'} in Gebrauch. Ein Gutachter schätzt den beizulegenden Wert auf ${eur(p.beizulegend)}.`,
          lower
            ? p.dauernd
              ? 'Grund: Ein neues Anlagenmodell ist deutlich leistungsfähiger; die Wertminderung ist voraussichtlich dauernd.'
              : 'Grund: Der Gebrauchtmarkt ist vorübergehend eingebrochen; der Gutachter erwartet, dass sich die Preise im nächsten Jahr wieder erholen.'
            : 'Grund: Gebrauchte Anlagen dieses Typs sind derzeit sehr gefragt.',
        ],
        aufgabe:
          'Ermittle die fortgeführten Anschaffungskosten, eine notwendige außerplanmäßige Abschreibung und den Bilanzansatz zum 31.12.',
      };
    }
    case 'hoechstwert':
      return {
        titel: 'Verbindlichkeit in US-Dollar bewerten',
        kontext,
        sachverhalt: [
          `Die ${firma.kurz} hat bei ${p.lieferant} ${p.ware} auf Ziel gekauft. Rechnungsbetrag: ${usd(p.usd)} US-Dollar.`,
          `Kurs bei Einbuchung: 1 € = ${kurs(p.kursEin)} US-Dollar. Kurs am 31.12.: 1 € = ${kurs(p.kursStichtag)} US-Dollar. Die Rechnung ist am Bilanzstichtag noch offen.`,
        ],
        aufgabe:
          'Ermittle den Wert der Verbindlichkeit bei Einbuchung und am Bilanzstichtag sowie ihren Bilanzansatz (Beträge auf Cent runden).',
      };
  }
}

export const wertmassstaebe = defineGenerator<F3Params, F3Solution>({
  skillId: 'F3-wertmassstaebe',
  titel: 'Wertmaßstäbe und Niederstwertprinzip',
  variants: ['herstellungskosten', 'niederstwert-uv', 'niederstwert-av', 'hoechstwert'],
  points: 4,
  generate: (rng, opts = {}) => {
    const variante =
      (opts.variant as F3Variante | undefined) ??
      rng.pick<F3Variante>([
        'herstellungskosten',
        'herstellungskosten',
        'niederstwert-uv',
        'niederstwert-av',
        'niederstwert-av',
        'hoechstwert',
      ]);
    const krumm = isKrumm(rng, opts.krummAnteil);
    switch (variante) {
      case 'herstellungskosten':
        return genHk(rng, krumm);
      case 'niederstwert-uv':
        return retry(
          rng,
          (r) => genUv(r, krumm),
          (p) => !dec(p.kurs).equals(p.akJeStueck),
        );
      case 'niederstwert-av':
        return retry(
          rng,
          (r) => genAv(r),
          (p) => {
            const s = solveWertmassstab(p);
            return s.vergleichswert!.cmp(s.ausgangswert!) !== 0 && dec(p.beizulegend).gt(0);
          },
        );
      case 'hoechstwert':
        return genHw(rng);
    }
  },
  render,
  solve: (p) => solveWertmassstab(p),
  parts,
  steps: (p, s) => {
    switch (p.variante) {
      case 'herstellungskosten':
        return [
          {
            titel: 'Gemeinkosten',
            rechnung: `MGK ${pct(p.mgkSatz)} × ${eur(p.mek)} = ${eur(s.mgk!)}; FGK ${pct(p.fgkSatz)} × ${eur(p.fl)} = ${eur(s.fgk!)}`,
          },
          {
            titel: 'Wertuntergrenze',
            rechnung: `${eur(p.mek)} + ${eur(s.mgk!)} + ${eur(p.fl)} + ${eur(s.fgk!)} + ${eur(p.sekf)} = ${eur(s.untergrenze!)}`,
            erlaeuterung:
              'Pflichtbestandteile: Material- und Fertigungseinzelkosten, Sondereinzelkosten der Fertigung sowie die notwendigen Material- und Fertigungsgemeinkosten.',
          },
          {
            titel: 'Wertobergrenze',
            rechnung: `${eur(s.untergrenze!)} + Verwaltung ${eur(s.vwgk!)} + Fremdkapitalzinsen ${eur(p.fkZinsen)} = ${eur(s.obergrenze!)}`,
            erlaeuterung:
              'Kosten der allgemeinen Verwaltung und zurechenbare Fremdkapitalzinsen dürfen einbezogen werden (Wahlrecht).',
          },
          {
            titel: 'Vertriebskosten',
            erlaeuterung:
              'Vertriebskosten, auch Sondereinzelkosten des Vertriebs, dürfen nicht in die Herstellungskosten einbezogen werden.',
          },
        ];
      case 'niederstwert-uv':
        return [
          {
            titel: 'Vergleich',
            rechnung: `Anschaffungskosten ${plain(p.stueck)} × ${eur(p.akJeStueck)} = ${eur(s.ausgangswert!)}; Börsenwert ${plain(p.stueck)} × ${eur(p.kurs)} = ${eur(s.vergleichswert!)}`,
          },
          {
            titel: 'Bilanzansatz',
            rechnung: `niedrigerer Wert: ${eur(s.ansatz!)}; Abschreibung ${eur(s.abschreibung!)}`,
            erlaeuterung:
              'Umlaufvermögen: strenges Niederstwertprinzip – immer der niedrigere Wert, auch bei nur vorübergehender Wertminderung. Höchstens die Anschaffungskosten.',
          },
        ];
      case 'niederstwert-av':
        return [
          {
            titel: 'Fortgeführte Anschaffungskosten',
            rechnung: `${eur(p.ak)} ÷ ${p.nd} = ${eur(s.planmaessig!)} je Jahr; ${eur(p.ak)} − ${p.jahre} × ${eur(s.planmaessig!)} = ${eur(s.ausgangswert!)}`,
          },
          {
            titel: 'Vergleich mit dem beizulegenden Wert',
            rechnung: `beizulegender Wert ${eur(p.beizulegend)}; Bilanzansatz ${eur(s.ansatz!)}; außerplanmäßige Abschreibung ${eur(s.abschreibung!)}`,
            erlaeuterung:
              'Anlagevermögen: gemildertes Niederstwertprinzip – abgeschrieben werden muss nur bei voraussichtlich dauernder Wertminderung. Höchstens die fortgeführten Anschaffungskosten.',
          },
        ];
      case 'hoechstwert':
        return [
          {
            titel: 'Umrechnung',
            rechnung: `${usd(p.usd)} USD ÷ ${kurs(p.kursEin)} = ${eur(s.wertEin!)}; ${usd(p.usd)} USD ÷ ${kurs(p.kursStichtag)} = ${eur(s.wertStichtag!)}`,
            erlaeuterung: 'Kurs in US-Dollar je 1 €: Dollarbetrag durch den Kurs teilen.',
          },
          {
            titel: 'Bilanzansatz',
            rechnung: `höherer Wert: ${eur(s.ansatz!)}; Erhöhung ${eur(s.erhoehung!)}`,
            erlaeuterung:
              'Höchstwertprinzip: Von zwei möglichen Werten einer Schuld ist der höhere anzusetzen.',
          },
        ];
    }
  },
  hints: (p, s) => {
    switch (p.variante) {
      case 'herstellungskosten':
        return [
          'Herstellungskosten nach § 255 Abs. 2 HGB: Pflichtbestandteile bilden die Wertuntergrenze, Wahlbestandteile kommen bis zur Wertobergrenze dazu.',
          `Untergrenze = MEK + MGK + Fertigungslöhne + FGK + Sondereinzelkosten der Fertigung. MGK hier ${eur(s.mgk!)}.`,
          `Obergrenze = Untergrenze + ${pct(p.vwgkSatz)} Verwaltung + Fremdkapitalzinsen; Vertriebskosten bleiben draußen.`,
        ];
      case 'niederstwert-uv':
        return [
          'Aktien im Umlaufvermögen: Welches Niederstwertprinzip gilt dort?',
          'Strenges Niederstwertprinzip: Anschaffungskosten und Börsenwert vergleichen, der niedrigere zählt – auch wenn die Wertminderung nur vorübergehend ist.',
          `Vergleiche ${eur(s.ausgangswert!)} mit ${eur(s.vergleichswert!)}.`,
        ];
      case 'niederstwert-av':
        return [
          'Zuerst die planmäßigen Abschreibungen berücksichtigen, dann mit dem beizulegenden Wert vergleichen.',
          `Fortgeführte Anschaffungskosten: ${eur(p.ak)} − ${p.jahre} × ${eur(s.planmaessig!)}.`,
          'Gemildertes Niederstwertprinzip: außerplanmäßig abschreiben nur bei voraussichtlich dauernder Wertminderung; nie über die fortgeführten Anschaffungskosten.',
        ];
      case 'hoechstwert':
        return [
          'Schulden werden nach dem Höchstwertprinzip bewertet.',
          'Kurs „1 € = x US-Dollar“: Euro-Wert = Dollarbetrag ÷ Kurs.',
          `Vergleiche ${eur(s.wertEin!)} mit ${eur(s.wertStichtag!)} – der höhere Wert gilt.`,
        ];
    }
  },
  errorVariants: variants,
  verfahren: (p) =>
    p.variante === 'herstellungskosten'
      ? 'Herstellungskosten nach § 255 Abs. 2 HGB (Wertunter- und -obergrenze)'
      : p.variante === 'niederstwert-uv'
        ? 'Strenges Niederstwertprinzip (Umlaufvermögen)'
        : p.variante === 'niederstwert-av'
          ? 'Gemildertes Niederstwertprinzip (Anlagevermögen)'
          : 'Höchstwertprinzip (Verbindlichkeit in Fremdwährung)',
});
