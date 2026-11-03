// B1 – Umsatzsteuer rechnen: Netto, Steuer und Brutto in beide Richtungen (19 % und 7 %),
// Rechnung mit zwei Steuersätzen, Zahllast bzw. Vorsteuerüberhang eines Monats.
// Lehrbrief BA 2.3.5.3 (nur lokal gelesen, eigene Formulierung). Spezifikation: docs/m7/b.md.
import { Val, sum } from '../../money';
import type { Rng } from '../../rng';
import type { Feld, GenOptions, SolutionStep, TaskPart, TaskText } from '../../task';
import { FIRMA } from '../../../config';
import { betrag, defineGenerator, eur, feld, isKrumm, pct, plain, retry } from '../base';
import {
  EINKAUF_19,
  EINKAUF_7,
  ERMAESSIGT,
  KONTEXT_B,
  REGELSATZ,
  VERKAUF,
  andererSatz,
  bruttoProzent,
  faktor,
  glattBrutto,
  istErmaessigt,
  nettoAusBrutto,
  steuerVomBruttoFalsch,
  steuerVomNetto,
  type Artikel,
} from './gemeinsam';

export type B1Variante =
  'netto-brutto' | 'brutto-netto' | 'steuer-netto' | 'zwei-saetze' | 'zahllast';
export type Richtung = 'eingang' | 'ausgang';
export type B1Fall = 'zahllast' | 'ueberhang';

export interface B1Position {
  text: string;
  netto: string;
  satz: string;
}

export interface B1Beleg {
  richtung: Richtung;
  text: string;
  /** Betrag laut Beleg (netto oder brutto) */
  betrag: string;
  brutto: boolean;
  satz: string;
}

export interface B1Params {
  variante: B1Variante;
  richtung: Richtung;
  satz: string;
  /** Gegebener Betrag: Netto (netto-brutto), Brutto (brutto-netto) oder Steuer (steuer-netto) */
  betrag: string;
  gegenstand: string;
  partner: string;
  /** zwei-saetze: Positionen einer Rechnung mit unterschiedlichen Steuersätzen */
  positionen: B1Position[];
  /** zahllast: Belege des Monats */
  belege: B1Beleg[];
  monat: string;
  vorlage: number;
}

export interface B1Solution {
  netto: Val;
  steuer: Val;
  brutto: Val;
  /** zwei-saetze: Nettosumme und Steuer je Satz */
  nettoRegel: Val;
  nettoErm: Val;
  steuerRegel: Val;
  steuerErm: Val;
  /** zahllast: Steuer je Beleg, Summen, Ergebnis */
  belegSteuern: Val[];
  vorsteuer: Val;
  umsatzsteuer: Val;
  fall: B1Fall;
  saldo: Val;
}

interface Rechenweg {
  /** Prozentsatz vom Bruttobetrag statt Rückrechnung mit ÷ 1,19 */
  prozentVomBrutto?: boolean;
  /** Satz je Position ersetzen (Steuersatz verwechselt bzw. alles mit 19 %) */
  satz?: (s: string) => string;
  /** Vorsteuer und Umsatzsteuer vertauscht */
  vertauscht?: boolean;
  /** Zahllast und Überhang verwechselt */
  richtungFalsch?: boolean;
}

const NULL = new Val(0);

function belegSteuer(b: B1Beleg, satz: string, w: Rechenweg): Val {
  if (!b.brutto) return steuerVomNetto(b.betrag, satz);
  if (w.prozentVomBrutto) return steuerVomBruttoFalsch(b.betrag, satz);
  return new Val(b.betrag).minus(nettoAusBrutto(b.betrag, satz));
}

export function rechneB1(p: B1Params, w: Rechenweg = {}): B1Solution {
  const sz = (s: string) => (w.satz ? w.satz(s) : s);
  const s: B1Solution = {
    netto: NULL,
    steuer: NULL,
    brutto: NULL,
    nettoRegel: NULL,
    nettoErm: NULL,
    steuerRegel: NULL,
    steuerErm: NULL,
    belegSteuern: [],
    vorsteuer: NULL,
    umsatzsteuer: NULL,
    fall: 'zahllast',
    saldo: NULL,
  };
  const satz = sz(p.satz);
  switch (p.variante) {
    case 'netto-brutto': {
      s.netto = new Val(p.betrag);
      s.steuer = steuerVomNetto(s.netto, satz);
      s.brutto = s.netto.plus(s.steuer);
      break;
    }
    case 'brutto-netto': {
      s.brutto = new Val(p.betrag);
      if (w.prozentVomBrutto) {
        s.steuer = steuerVomBruttoFalsch(s.brutto, satz);
        s.netto = s.brutto.minus(s.steuer);
      } else {
        s.netto = nettoAusBrutto(s.brutto, satz);
        s.steuer = s.brutto.minus(s.netto);
      }
      break;
    }
    case 'steuer-netto': {
      s.steuer = new Val(p.betrag);
      if (w.prozentVomBrutto) {
        // Denkfehler: Steuer als Anteil am Bruttobetrag verstanden
        s.brutto = s.steuer.div(satz).fix();
        s.netto = s.brutto.minus(s.steuer);
      } else {
        s.netto = s.steuer.div(satz).fix();
        s.brutto = s.netto.plus(s.steuer);
      }
      break;
    }
    case 'zwei-saetze': {
      const regel = p.positionen.filter((x) => !istErmaessigt(x.satz));
      const erm = p.positionen.filter((x) => istErmaessigt(x.satz));
      s.nettoRegel = sum(regel.map((x) => x.netto));
      s.nettoErm = sum(erm.map((x) => x.netto));
      // Steuer je Steuersatz auf die Summe der Nettobeträge dieses Satzes
      s.steuerRegel = steuerVomNetto(s.nettoRegel, sz(REGELSATZ));
      s.steuerErm = steuerVomNetto(s.nettoErm, sz(ERMAESSIGT));
      s.netto = s.nettoRegel.plus(s.nettoErm);
      s.steuer = s.steuerRegel.plus(s.steuerErm);
      s.brutto = s.netto.plus(s.steuer);
      break;
    }
    case 'zahllast': {
      s.belegSteuern = p.belege.map((b) => belegSteuer(b, sz(b.satz), w));
      const vst = sum(s.belegSteuern.filter((_, i) => p.belege[i]!.richtung === 'eingang'));
      const ust = sum(s.belegSteuern.filter((_, i) => p.belege[i]!.richtung === 'ausgang'));
      s.vorsteuer = w.vertauscht ? ust : vst;
      s.umsatzsteuer = w.vertauscht ? vst : ust;
      const zahllast = s.umsatzsteuer.cmp(s.vorsteuer) > 0;
      s.fall = zahllast !== Boolean(w.richtungFalsch) ? 'zahllast' : 'ueberhang';
      s.saldo = s.umsatzsteuer.minus(s.vorsteuer).abs();
      break;
    }
  }
  return s;
}

export function solveB1(p: B1Params): B1Solution {
  return rechneB1(p);
}

const FALL_TEXT: Record<B1Fall, string> = {
  zahllast: 'Zahllast',
  ueberhang: 'Vorsteuerüberhang',
};

function steuerName(r: Richtung): string {
  return r === 'eingang' ? 'Vorsteuer' : 'Umsatzsteuer';
}

function parts(p: B1Params, s: B1Solution): TaskPart[] {
  const st = steuerName(p.richtung);
  let felder: Feld[];
  let titel: string;
  switch (p.variante) {
    case 'netto-brutto':
      titel = 'Steuer und Bruttobetrag';
      felder = [feld('steuer', st, s.steuer), feld('brutto', 'Bruttobetrag', s.brutto)];
      break;
    case 'brutto-netto':
      titel = 'Rückrechnung aus dem Bruttobetrag';
      felder = [feld('netto', 'Nettobetrag', s.netto), feld('steuer', st, s.steuer)];
      break;
    case 'steuer-netto':
      titel = 'Nettobetrag und Bruttobetrag aus der Steuer';
      felder = [feld('netto', 'Nettobetrag', s.netto), feld('brutto', 'Bruttobetrag', s.brutto)];
      break;
    case 'zwei-saetze':
      titel = 'Rechnung mit zwei Steuersätzen';
      felder = [
        feld('steuerRegel', `${st} ${pct(REGELSATZ)}`, s.steuerRegel),
        feld('steuerErm', `${st} ${pct(ERMAESSIGT)}`, s.steuerErm),
        feld('brutto', 'Rechnungsbetrag (brutto)', s.brutto),
      ];
      break;
    case 'zahllast':
      titel = 'Zahllast oder Vorsteuerüberhang?';
      felder = [
        feld('vorsteuer', 'Vorsteuer des Monats', s.vorsteuer),
        feld('umsatzsteuer', 'Umsatzsteuer des Monats', s.umsatzsteuer),
        {
          typ: 'auswahl',
          id: 'fall',
          label: 'Ergebnis',
          optionen: ['Zahllast', 'Vorsteuerüberhang'],
          soll: FALL_TEXT[s.fall],
        },
        feld('saldo', 'Betrag', s.saldo),
      ];
      break;
  }
  return [{ typ: 'rechenkette', id: 'rechnung', titel, felder }];
}

function errorVariants(p: B1Params) {
  const out: { fehlertyp: string; parts: TaskPart[] }[] = [];
  const add = (fehlertyp: string, w: Rechenweg) =>
    out.push({ fehlertyp, parts: parts(p, rechneB1(p, w)) });
  switch (p.variante) {
    case 'netto-brutto':
      if (istErmaessigt(p.satz)) add('b-steuersatz-verwechselt', { satz: andererSatz });
      break;
    case 'brutto-netto':
    case 'steuer-netto':
      add('b-prozent-vom-brutto', { prozentVomBrutto: true });
      if (istErmaessigt(p.satz)) add('b-steuersatz-verwechselt', { satz: andererSatz });
      break;
    case 'zwei-saetze':
      add('b-ein-satz-fuer-alles', { satz: () => REGELSATZ });
      add('b-steuersatz-verwechselt', { satz: andererSatz });
      break;
    case 'zahllast':
      if (p.belege.some((b) => b.brutto)) add('b-prozent-vom-brutto', { prozentVomBrutto: true });
      add('steuer-falsches-konto', { vertauscht: true });
      add('b-zahllast-richtung', { richtungFalsch: true });
      break;
  }
  return out;
}

// ---------- Texte ----------

function belegZeile(b: B1Beleg): string[] {
  return [b.text, eur(b.betrag), b.brutto ? 'brutto' : 'netto', pct(b.satz)];
}

function render(p: B1Params): TaskText {
  const u = pct(p.satz);
  const st = steuerName(p.richtung);
  const ein = p.richtung === 'eingang';
  const beleg = ein
    ? `Eingangsrechnung von ${p.partner}: ${p.gegenstand}`
    : `Ausgangsrechnung der MBG an ${p.partner}: ${p.gegenstand}`;
  switch (p.variante) {
    case 'netto-brutto':
      return {
        titel: 'Vom Netto zum Brutto',
        kontext: KONTEXT_B,
        sachverhalt: [
          `${beleg}.`,
          p.vorlage === 0
            ? `Der Nettobetrag beträgt ${eur(p.betrag)}, hinzu kommen ${u} Umsatzsteuer.`
            : `Warenwert ${eur(p.betrag)} netto zuzüglich ${u} Umsatzsteuer.`,
        ],
        aufgabe: `Berechne die ${st} und den Bruttobetrag.`,
      };
    case 'brutto-netto':
      return {
        titel: 'Rückrechnung aus dem Bruttobetrag',
        kontext: KONTEXT_B,
        sachverhalt: [
          `${beleg}.`,
          p.vorlage === 0
            ? `Der Beleg nennt nur einen Gesamtbetrag von ${eur(p.betrag)} einschließlich ${u} Umsatzsteuer.`
            : `Rechnungsbetrag ${eur(p.betrag)} brutto (darin enthalten: ${u} Umsatzsteuer).`,
        ],
        aufgabe: `Rechne den Nettobetrag und die ${st} aus dem Bruttobetrag heraus.`,
      };
    case 'steuer-netto':
      return {
        titel: 'Vom Steuerbetrag zum Netto',
        kontext: KONTEXT_B,
        sachverhalt: [
          `${beleg}.`,
          ein
            ? `Auf der Rechnung ist nur noch der Steuerbetrag gut lesbar: ${eur(p.betrag)} Umsatzsteuer (${u}). Der Rest ist durch einen Kaffeefleck verwischt.`
            : `Tobias Hesse weiß von dieser Rechnung nur noch, dass ${eur(p.betrag)} Umsatzsteuer (${u}) ausgewiesen waren.`,
        ],
        aufgabe: 'Ermittle den Nettobetrag und den Bruttobetrag der Rechnung.',
      };
    case 'zwei-saetze':
      return {
        titel: 'Eine Rechnung, zwei Steuersätze',
        kontext: KONTEXT_B,
        sachverhalt: [
          `Eingangsrechnung von ${p.partner}. Die Positionen unterliegen unterschiedlichen Steuersätzen:`,
        ],
        daten: {
          spalten: ['Position', 'Nettobetrag', 'Steuersatz'],
          zeilen: p.positionen.map((x) => [x.text, eur(x.netto), pct(x.satz)]),
        },
        aufgabe: `Berechne die ${st} je Steuersatz und den Rechnungsbetrag (brutto).`,
      };
    case 'zahllast':
      return {
        titel: 'Zahllast eines Monats ermitteln',
        kontext: `${p.monat}: Umsatzsteuer-Voranmeldung`,
        sachverhalt: [
          `Jana Kröger bereitet die Umsatzsteuer-Voranmeldung für ${p.monat} vor. Im Monat sind diese Belege angefallen:`,
        ],
        daten: {
          spalten: ['Beleg', 'Betrag', 'Angabe', 'Steuersatz'],
          zeilen: p.belege.map(belegZeile),
        },
        aufgabe:
          'Ermittle die Vorsteuer und die Umsatzsteuer des Monats und entscheide, ob eine Zahllast oder ein Vorsteuerüberhang entsteht.',
      };
  }
}

function steps(p: B1Params, s: B1Solution): SolutionStep[] {
  const u = pct(p.satz);
  const f = faktor(p.satz);
  const st = steuerName(p.richtung);
  switch (p.variante) {
    case 'netto-brutto':
      return [
        {
          titel: `${st} vom Nettobetrag`,
          rechnung: `${eur(s.netto)} × ${u} = ${eur(s.steuer)}`,
          erlaeuterung: 'Der Steuersatz bezieht sich immer auf den Nettobetrag.',
        },
        {
          titel: 'Bruttobetrag',
          rechnung: `${eur(s.netto)} + ${eur(s.steuer)} = ${eur(s.brutto)} (oder ${eur(s.netto)} × ${f})`,
        },
      ];
    case 'brutto-netto':
      return [
        {
          titel: 'Nettobetrag',
          rechnung: `${eur(s.brutto)} ÷ ${f} = ${eur(s.netto)}`,
          erlaeuterung: `Der Bruttobetrag entspricht ${bruttoProzent(p.satz)} des Nettobetrags. Teilen durch ${f} führt zurück auf 100 %.`,
        },
        {
          titel: st,
          rechnung: `${eur(s.brutto)} − ${eur(s.netto)} = ${eur(s.steuer)}`,
          erlaeuterung: `Nicht ${u} vom Bruttobetrag abziehen – das ergibt einen zu kleinen Nettobetrag.`,
        },
      ];
    case 'steuer-netto':
      return [
        {
          titel: 'Nettobetrag',
          rechnung: `${eur(s.steuer)} ÷ ${plain(p.satz)} = ${eur(s.netto)}`,
          erlaeuterung: `Die Steuer sind ${u} vom Nettobetrag. Also ist der Nettobetrag Steuer ÷ ${plain(p.satz)}.`,
        },
        {
          titel: 'Bruttobetrag',
          rechnung: `${eur(s.netto)} + ${eur(s.steuer)} = ${eur(s.brutto)}`,
        },
      ];
    case 'zwei-saetze':
      return [
        {
          titel: `Nettobeträge je Steuersatz`,
          rechnung: `${pct(REGELSATZ)}: ${eur(s.nettoRegel)}; ${pct(ERMAESSIGT)}: ${eur(s.nettoErm)}`,
          erlaeuterung: 'Positionen mit gleichem Steuersatz werden zusammengefasst.',
        },
        {
          titel: 'Steuer je Satz',
          rechnung: `${eur(s.nettoRegel)} × ${pct(REGELSATZ)} = ${eur(s.steuerRegel)}; ${eur(s.nettoErm)} × ${pct(ERMAESSIGT)} = ${eur(s.steuerErm)}`,
        },
        {
          titel: 'Rechnungsbetrag',
          rechnung: `${eur(s.netto)} + ${eur(s.steuerRegel)} + ${eur(s.steuerErm)} = ${eur(s.brutto)}`,
        },
      ];
    case 'zahllast': {
      const zeile = (art: Richtung) =>
        p.belege
          .map((b, i) => ({ b, t: s.belegSteuern[i]! }))
          .filter(({ b }) => b.richtung === art)
          .map(({ b, t }) =>
            b.brutto
              ? `${eur(b.betrag)} − ${eur(b.betrag)} ÷ ${faktor(b.satz)} = ${eur(t)}`
              : `${eur(b.betrag)} × ${pct(b.satz)} = ${eur(t)}`,
          )
          .join('; ');
      return [
        {
          titel: 'Vorsteuer aus den Eingangsrechnungen',
          rechnung: `${zeile('eingang')} → ${eur(s.vorsteuer)}`,
          erlaeuterung: 'Steuer auf Einkäufe holt sich die MBG vom Finanzamt zurück.',
        },
        {
          titel: 'Umsatzsteuer aus den Ausgangsrechnungen',
          rechnung: `${zeile('ausgang')} → ${eur(s.umsatzsteuer)}`,
          erlaeuterung: 'Steuer auf Verkäufe schuldet die MBG dem Finanzamt.',
        },
        {
          titel: FALL_TEXT[s.fall],
          rechnung:
            s.fall === 'zahllast'
              ? `${eur(s.umsatzsteuer)} − ${eur(s.vorsteuer)} = ${eur(s.saldo)}`
              : `${eur(s.vorsteuer)} − ${eur(s.umsatzsteuer)} = ${eur(s.saldo)}`,
          erlaeuterung:
            s.fall === 'zahllast'
              ? 'Die Umsatzsteuer ist höher: Die MBG überweist die Differenz bis zum 10. des Folgemonats ans Finanzamt.'
              : 'Die Vorsteuer ist höher: Das Finanzamt erstattet der MBG die Differenz.',
        },
      ];
    }
  }
}

function hints(p: B1Params, s: B1Solution): [string, string, string] {
  const u = pct(p.satz);
  const f = faktor(p.satz);
  switch (p.variante) {
    case 'netto-brutto':
      return [
        `Der Nettobetrag ist 100 %. Die Steuer kommt mit ${u} obendrauf.`,
        `Steuer = Nettobetrag × ${u}; Bruttobetrag = Netto + Steuer.`,
        `Steuer ${eur(s.steuer)}, Bruttobetrag ${eur(s.brutto)}.`,
      ];
    case 'brutto-netto':
      return [
        `Der Bruttobetrag ist nicht 100 %, sondern ${bruttoProzent(p.satz)}.`,
        `Nettobetrag = Brutto ÷ ${f}. Die Steuer ist die Differenz – nicht ${u} vom Bruttobetrag.`,
        `Netto ${eur(s.netto)}, Steuer ${eur(s.steuer)}.`,
      ];
    case 'steuer-netto':
      return [
        `Die Steuer sind ${u} des Nettobetrags.`,
        `Nettobetrag = Steuer ÷ ${plain(p.satz)} (das sind die ${u} als Dezimalzahl).`,
        `Netto ${eur(s.netto)}, Brutto ${eur(s.brutto)}.`,
      ];
    case 'zwei-saetze':
      return [
        'Jeder Steuersatz wird getrennt gerechnet: erst die Nettobeträge je Satz zusammenzählen.',
        `Nettosumme ${pct(REGELSATZ)}: ${eur(s.nettoRegel)}; Nettosumme ${pct(ERMAESSIGT)}: ${eur(s.nettoErm)}.`,
        `Steuer ${eur(s.steuerRegel)} und ${eur(s.steuerErm)}; Rechnungsbetrag ${eur(s.brutto)}.`,
      ];
    case 'zahllast':
      return [
        'Eingangsrechnungen enthalten Vorsteuer, Ausgangsrechnungen Umsatzsteuer. Bruttoangaben erst zurückrechnen.',
        `Vorsteuer ${eur(s.vorsteuer)}, Umsatzsteuer ${eur(s.umsatzsteuer)}. Welche Summe ist größer?`,
        `${FALL_TEXT[s.fall]} von ${eur(s.saldo)}.`,
      ];
  }
}

// ---------- Erzeugung ----------

const KONTEXTE_7: readonly Artikel[] = EINKAUF_7;

function wahlEingang19(rng: Rng): Artikel {
  return rng.pick(EINKAUF_19.filter((a) => a.max >= 1_000));
}

/** Glatter Nettobetrag: Schritt 100 bei großen, 10 bei kleinen Beträgen (Steuer geht auf den Cent auf). */
function glattNetto(rng: Rng, min: number, max: number): number {
  return rng.step(min, max, max >= 2_000 ? 100 : 10);
}

function einzelKontext(
  rng: Rng,
  satz: string,
): {
  richtung: Richtung;
  gegenstand: string;
  partner: string;
  min: number;
  max: number;
} {
  if (istErmaessigt(satz)) {
    const a = rng.pick(KONTEXTE_7);
    return { richtung: 'eingang', gegenstand: a.text, partner: a.partner, min: a.min, max: a.max };
  }
  if (rng.chance(0.5)) {
    const a = wahlEingang19(rng);
    return { richtung: 'eingang', gegenstand: a.text, partner: a.partner, min: a.min, max: a.max };
  }
  const v = rng.pick(VERKAUF);
  return {
    richtung: 'ausgang',
    gegenstand: v.text,
    partner: rng.pick(FIRMA.kunden),
    min: 1_000,
    max: 40_000,
  };
}

const ZWEI_SAETZE: readonly { partner: string; regel: string[]; erm: string[] }[] = [
  {
    partner: 'einer Fachbuchhandlung in Paderborn',
    regel: ['Ordner und Druckerpapier', 'Kugelschreiber und Notizblöcke'],
    erm: ['Fachbücher zur Getränketechnologie', 'Kommentar zum Lebensmittelrecht'],
  },
  {
    partner: 'einem Fachverlag',
    regel: [
      'Anzeige für die MBG in der Fachzeitschrift',
      'Stellenanzeige im Online-Portal des Verlags',
    ],
    erm: ['gedruckte Fachzeitschrift (Jahresabonnement)', 'Fachbuch „Abfülltechnik kompakt“'],
  },
];

function generate(rng: Rng, opts: GenOptions = {}): B1Params {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const varianten: B1Variante[] = [
    'netto-brutto',
    'brutto-netto',
    'brutto-netto',
    'steuer-netto',
    'zwei-saetze',
    'zahllast',
    'zahllast',
  ];
  const variante: B1Variante = varianten.includes(opts.variant as B1Variante)
    ? (opts.variant as B1Variante)
    : rng.pick(varianten);
  const leer: B1Params = {
    variante,
    richtung: 'eingang',
    satz: REGELSATZ,
    betrag: '0',
    gegenstand: '',
    partner: '',
    positionen: [],
    belege: [],
    monat: rng.pick(['Januar', 'Februar', 'März']),
    vorlage: rng.int(0, 1),
  };

  if (variante === 'zwei-saetze') {
    const t = rng.pick(ZWEI_SAETZE);
    const pos = (text: string, satz: string, min: number, max: number): B1Position => ({
      text,
      satz,
      netto: krumm ? betrag(rng, min, max, 1, true) : String(rng.step(min, max, 10)),
    });
    const positionen = [
      pos(rng.pick(t.erm), ERMAESSIGT, 40, 800),
      pos(rng.pick(t.regel), REGELSATZ, 50, 1_500),
    ];
    return { ...leer, partner: t.partner, positionen: rng.shuffle(positionen) };
  }

  if (variante === 'zahllast') return { ...leer, belege: zahllastBelege(rng, krumm) };

  const satz = rng.chance(0.35) ? ERMAESSIGT : REGELSATZ;
  const k = einzelKontext(rng, satz);
  const basis = {
    ...leer,
    satz,
    richtung: k.richtung,
    gegenstand: k.gegenstand,
    partner: k.partner,
  };
  switch (variante) {
    case 'netto-brutto':
      return {
        ...basis,
        betrag: krumm ? betrag(rng, k.min, k.max, 1, true) : String(glattNetto(rng, k.min, k.max)),
      };
    case 'brutto-netto': {
      const bmin = Math.round(k.min * 1.2);
      const bmax = Math.round(k.max * 1.2);
      return {
        ...basis,
        betrag: krumm
          ? betrag(rng, bmin, bmax, 1, true)
          : glattBrutto(glattNetto(rng, k.min, k.max), satz),
      };
    }
    default: {
      // steuer-netto: Nettobetrag in ganzen Euro, damit die Steuer genau aufgeht und eindeutig ist
      const netto = krumm ? rng.int(k.min, k.max) : glattNetto(rng, k.min, k.max);
      return { ...basis, betrag: steuerVomNetto(String(netto), satz).value.toFixed(2) };
    }
  }
}

function zahllastBelege(rng: Rng, krumm: boolean): B1Beleg[] {
  const ueberhang = rng.chance(0.25);
  const make = (r: Rng): B1Beleg[] => {
    const n = r.int(3, 5);
    const nAus = r.int(1, n - 1);
    const out: B1Beleg[] = [];
    const wert = (min: number, max: number, satz: string, brutto: boolean): string => {
      if (krumm) return betrag(r, min, max, 1, true);
      const netto = r.step(min, max, max >= 2_000 ? 100 : 10);
      return brutto ? glattBrutto(netto, satz) : String(netto);
    };
    for (let i = 0; i < nAus; i++) {
      const v = r.pick(VERKAUF);
      const brutto = r.chance(0.3);
      out.push({
        richtung: 'ausgang',
        text: `Ausgangsrechnung an ${r.pick(FIRMA.kunden)}: ${v.text}`,
        betrag: wert(5_000, 60_000, REGELSATZ, brutto),
        brutto,
        satz: REGELSATZ,
      });
    }
    for (let i = nAus; i < n; i++) {
      const brutto = r.chance(0.3);
      if (r.chance(0.15)) {
        const a = r.pick(EINKAUF_7);
        out.push({
          richtung: 'eingang',
          text: `Eingangsrechnung von ${a.partner}: ${a.text}`,
          betrag: wert(a.min, a.max, ERMAESSIGT, brutto),
          brutto,
          satz: ERMAESSIGT,
        });
        continue;
      }
      const a = wahlEingang19(r);
      out.push({
        richtung: 'eingang',
        text: `Eingangsrechnung von ${a.partner}: ${a.text}`,
        betrag: wert(Math.max(a.min, 1_000), a.max, REGELSATZ, brutto),
        brutto,
        satz: REGELSATZ,
      });
    }
    if (ueberhang) {
      out.push({
        richtung: 'eingang',
        text: `Eingangsrechnung von ${FIRMA.lieferanten.anlagen[1]!}: neue Etikettiermaschine`,
        betrag: wert(80_000, 250_000, REGELSATZ, false),
        brutto: false,
        satz: REGELSATZ,
      });
    }
    return r.shuffle(out);
  };
  return retry(rng, make, (belege) => {
    const s = rechneB1({
      variante: 'zahllast',
      richtung: 'eingang',
      satz: REGELSATZ,
      betrag: '0',
      gegenstand: '',
      partner: '',
      positionen: [],
      belege,
      monat: '',
      vorlage: 0,
    });
    return s.fall === (ueberhang ? 'ueberhang' : 'zahllast') && !s.saldo.value.isZero();
  });
}

export const ustRechnen = defineGenerator<B1Params, B1Solution>({
  skillId: 'B1-ust-rechnen',
  titel: 'Umsatzsteuer berechnen',
  variants: ['netto-brutto', 'brutto-netto', 'steuer-netto', 'zwei-saetze', 'zahllast'],
  points: 2,
  generate,
  render,
  solve: solveB1,
  parts,
  steps,
  hints,
  errorVariants,
  verfahren: (p) => {
    switch (p.variante) {
      case 'netto-brutto':
        return 'Umsatzsteuer vom Nettobetrag berechnen und Bruttobetrag bilden';
      case 'brutto-netto':
        return 'Nettobetrag aus dem Bruttobetrag zurückrechnen (÷ 1,19 bzw. ÷ 1,07)';
      case 'steuer-netto':
        return 'Nettobetrag aus dem Steuerbetrag ermitteln (Steuer ÷ Steuersatz)';
      case 'zwei-saetze':
        return 'Rechnung mit 19 % und 7 %: Steuer je Steuersatz getrennt berechnen';
      case 'zahllast':
        return 'Steuer aus den Belegen eines Monats summieren und Zahllast berechnen';
    }
  },
});
