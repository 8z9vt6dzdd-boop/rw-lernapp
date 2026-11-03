// A7 – Erfolgsermittlung durch Eigenkapitalvergleich: Erfolg = EK Ende − EK Anfang
// + Privatentnahmen − Privateinlagen (BA 2.3.4; eigene Formulierung und Zahlen).
// Varianten: Standard, ohne Privatvorgänge, Eigenkapital aus Vermögen und Schulden, rückwärts
// (Eigenkapital am Ende aus dem Erfolg). Spezifikation: docs/m7/a.md.
import { FIRMA } from '../../../config';
import { Val, sum } from '../../money';
import type { Rng } from '../../rng';
import type {
  ErrorVariant,
  Feld,
  GenOptions,
  RechenkettePart,
  SolutionStep,
  TaskPart,
  TaskText,
} from '../../task';
import { betrag, defineGenerator, eur, feld, isKrumm, retry } from '../base';
import { auswahl } from './gemeinsam';

const [G1, G2] = FIRMA.gesellschafter;

const EV = 'a-entnahmen-vorzeichen';
const IV = 'a-einlagen-vorzeichen';
const PV = 'a-privat-vergessen';
const DV = 'a-ek-differenz-vertauscht';
const SN = 'a-schulden-nicht-abgezogen';

const GEWINN = 'Gewinn';
const VERLUST = 'Verlust';

export type A7Variante = 'standard' | 'ohne-privat' | 'vermoegen' | 'rueckwaerts';

export interface Privatposten {
  text: string;
  betrag: string;
}

export interface A7Params {
  variante: A7Variante;
  ekAnfang: string;
  /** nicht bei 'rueckwaerts' (dort gesucht) */
  ekEnde: string;
  /** nur 'vermoegen' */
  vermoegenAnfang: string;
  schuldenAnfang: string;
  vermoegenEnde: string;
  schuldenEnde: string;
  entnahmen: Privatposten[];
  einlagen: Privatposten[];
  /** nur 'rueckwaerts': bekannter Erfolg (Verlust negativ) */
  erfolg: string;
}

export interface A7Solution {
  entnahmen: Val;
  einlagen: Val;
  ekAnfang: Val;
  ekEnde: Val;
  veraenderung: Val;
  erfolg: Val;
  ergebnis: string;
}

/** Rechenweg; die Schalter bilden typische Denkfehler nach. */
interface Weg {
  entnahmenFalsch?: boolean;
  einlagenFalsch?: boolean;
  ohnePrivat?: boolean;
  differenzVertauscht?: boolean;
  schuldenVergessen?: boolean;
}

function rechne(p: A7Params, w: Weg = {}): A7Solution {
  const entnahmen = sum(p.entnahmen.map((x) => x.betrag));
  const einlagen = sum(p.einlagen.map((x) => x.betrag));
  const e = w.ohnePrivat ? new Val(0) : w.entnahmenFalsch ? entnahmen.neg() : entnahmen;
  const i = w.ohnePrivat ? new Val(0) : w.einlagenFalsch ? einlagen.neg() : einlagen;
  let ekAnfang = new Val(p.ekAnfang);
  let ekEnde = new Val(p.ekEnde);
  if (p.variante === 'vermoegen') {
    ekAnfang = w.schuldenVergessen
      ? new Val(p.vermoegenAnfang)
      : new Val(p.vermoegenAnfang).minus(p.schuldenAnfang);
    ekEnde = w.schuldenVergessen
      ? new Val(p.vermoegenEnde)
      : new Val(p.vermoegenEnde).minus(p.schuldenEnde);
  }
  if (p.variante === 'rueckwaerts') {
    // EK Ende = EK Anfang + Erfolg − Entnahmen + Einlagen
    const erfolg = new Val(p.erfolg);
    ekEnde = ekAnfang.plus(erfolg).minus(e).plus(i);
    return {
      entnahmen,
      einlagen,
      ekAnfang,
      ekEnde,
      veraenderung: ekEnde.minus(ekAnfang),
      erfolg,
      ergebnis: erfolg.isNegative() ? VERLUST : GEWINN,
    };
  }
  const veraenderung = w.differenzVertauscht ? ekAnfang.minus(ekEnde) : ekEnde.minus(ekAnfang);
  const erfolg = veraenderung.plus(e).minus(i);
  return {
    entnahmen,
    einlagen,
    ekAnfang,
    ekEnde,
    veraenderung,
    erfolg,
    ergebnis: erfolg.isNegative() ? VERLUST : GEWINN,
  };
}

export function solveEkVergleich(p: A7Params): A7Solution {
  return rechne(p);
}

// ---------- Teile ----------

function part(p: A7Params, s: A7Solution): RechenkettePart {
  const felder: Feld[] = [];
  if (p.entnahmen.length > 1)
    felder.push(feld('entnahmen', 'Summe der Privatentnahmen', s.entnahmen));
  if (p.einlagen.length > 1) felder.push(feld('einlagen', 'Summe der Privateinlagen', s.einlagen));
  if (p.variante === 'vermoegen') {
    felder.push(
      feld('ekAnfang', 'Eigenkapital am 1.1.', s.ekAnfang),
      feld('ekEnde', 'Eigenkapital am 31.12.', s.ekEnde),
    );
  }
  if (p.variante === 'rueckwaerts') {
    felder.push(feld('ekEnde', 'Eigenkapital am 31.12.', s.ekEnde));
  } else {
    felder.push(
      feld('veraenderung', 'Veränderung des Eigenkapitals (Abnahme mit Minus)', s.veraenderung),
      feld('erfolg', 'Erfolg des Geschäftsjahres (Verlust mit Minus)', s.erfolg),
      auswahl('ergebnis', 'Ergebnis', [GEWINN, VERLUST], s.ergebnis),
    );
  }
  return { typ: 'rechenkette', id: 'ek-vergleich', titel: 'Eigenkapitalvergleich', felder };
}

function parts(p: A7Params, s: A7Solution): TaskPart[] {
  return [part(p, s)];
}

function variants(p: A7Params): ErrorVariant[] {
  const richtig = rechne(p);
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Weg) => {
    const s = rechne(p, w);
    const kern = p.variante === 'rueckwaerts' ? s.ekEnde : s.erfolg;
    const soll = p.variante === 'rueckwaerts' ? richtig.ekEnde : richtig.erfolg;
    if (kern.value.equals(soll.value) && s.veraenderung.value.equals(richtig.veraenderung.value))
      return;
    out.push({ fehlertyp, parts: parts(p, s) });
  };
  if (p.entnahmen.length > 0) add(EV, { entnahmenFalsch: true });
  if (p.einlagen.length > 0) add(IV, { einlagenFalsch: true });
  if (p.entnahmen.length + p.einlagen.length > 0) add(PV, { ohnePrivat: true });
  if (p.variante !== 'rueckwaerts') add(DV, { differenzVertauscht: true });
  if (p.variante === 'vermoegen') add(SN, { schuldenVergessen: true });
  return out;
}

// ---------- Texte ----------

function render(p: A7Params): TaskText {
  const sachverhalt: string[] = [];
  const daten: string[][] = [];
  if (p.variante === 'vermoegen') {
    sachverhalt.push('Aus den Inventaren der MBG (Beträge in €):');
    daten.push(
      ['Vermögen am 1.1.', eur(p.vermoegenAnfang)],
      ['Schulden am 1.1.', eur(p.schuldenAnfang)],
      ['Vermögen am 31.12.', eur(p.vermoegenEnde)],
      ['Schulden am 31.12.', eur(p.schuldenEnde)],
    );
  } else {
    daten.push(['Eigenkapital am 1.1.', eur(p.ekAnfang)]);
    if (p.variante === 'rueckwaerts')
      daten.push([
        new Val(p.erfolg).isNegative()
          ? 'Verlust des Geschäftsjahres'
          : 'Gewinn des Geschäftsjahres',
        eur(new Val(p.erfolg).abs()),
      ]);
    else daten.push(['Eigenkapital am 31.12.', eur(p.ekEnde)]);
  }
  for (const x of p.entnahmen) daten.push([`Entnahme: ${x.text}`, eur(x.betrag)]);
  for (const x of p.einlagen) daten.push([`Einlage: ${x.text}`, eur(x.betrag)]);
  if (p.variante === 'ohne-privat')
    sachverhalt.push(
      `Die Gesellschafter ${G1} und ${G2} haben im Geschäftsjahr weder etwas entnommen noch etwas eingelegt.`,
    );
  else if (p.entnahmen.length + p.einlagen.length > 0)
    sachverhalt.push(
      `${G1} und ${G2} sind als Gesellschafter in der MBG tätig. Im Geschäftsjahr gab es diese Privatvorgänge:`,
    );
  return {
    titel: p.variante === 'rueckwaerts' ? 'Eigenkapital fortschreiben' : 'Eigenkapitalvergleich',
    kontext: 'Dezember: Jahresabschluss',
    sachverhalt,
    daten: { spalten: ['Angabe', 'Betrag'], zeilen: daten },
    aufgabe:
      p.variante === 'rueckwaerts'
        ? 'Ermittle das Eigenkapital der MBG am 31.12.'
        : p.variante === 'vermoegen'
          ? 'Ermittle das Eigenkapital an beiden Stichtagen und den Erfolg durch Eigenkapitalvergleich.'
          : 'Ermittle den Erfolg der MBG durch Eigenkapitalvergleich.',
  };
}

function steps(p: A7Params, s: A7Solution): SolutionStep[] {
  const out: SolutionStep[] = [];
  if (p.variante === 'vermoegen')
    out.push({
      titel: 'Eigenkapital = Vermögen − Schulden',
      rechnung: `1.1.: ${eur(p.vermoegenAnfang)} − ${eur(p.schuldenAnfang)} = ${eur(s.ekAnfang)}; 31.12.: ${eur(p.vermoegenEnde)} − ${eur(p.schuldenEnde)} = ${eur(s.ekEnde)}`,
    });
  if (p.variante === 'rueckwaerts') {
    out.push({
      titel: 'Eigenkapital am 31.12.',
      rechnung: `${eur(s.ekAnfang)} ${s.erfolg.isNegative() ? '−' : '+'} ${eur(s.erfolg.abs())} − ${eur(s.entnahmen)} + ${eur(s.einlagen)} = ${eur(s.ekEnde)}`,
      ergebnis: eur(s.ekEnde),
      erlaeuterung:
        'Der Gewinn erhöht das Eigenkapital, ein Verlust mindert es. Entnahmen haben es gesenkt, Einlagen erhöht.',
    });
    return out;
  }
  out.push(
    {
      titel: 'Veränderung des Eigenkapitals',
      rechnung: `${eur(s.ekEnde)} − ${eur(s.ekAnfang)} = ${eur(s.veraenderung)}`,
    },
    {
      titel: 'Privatvorgänge berücksichtigen',
      rechnung: `${eur(s.veraenderung)} + ${eur(s.entnahmen)} − ${eur(s.einlagen)} = ${eur(s.erfolg)}`,
      ergebnis: `${s.ergebnis} ${eur(s.erfolg.abs())}`,
      erlaeuterung:
        'Entnahmen haben das Eigenkapital gesenkt, ohne den Erfolg zu mindern – sie werden hinzugerechnet. Einlagen haben es erhöht, ohne erwirtschaftet zu sein – sie werden abgezogen.',
    },
  );
  return out;
}

function hints(p: A7Params, s: A7Solution): [string, string, string] {
  if (p.variante === 'rueckwaerts')
    return [
      'Starte beim Eigenkapital am 1.1.: Ein Gewinn erhöht es, ein Verlust mindert es.',
      'Entnahmen haben das Eigenkapital im Jahr verringert (abziehen), Einlagen haben es erhöht (addieren).',
      `Eigenkapital am 31.12.: ${eur(s.ekEnde)}.`,
    ];
  return [
    p.variante === 'vermoegen'
      ? 'Zuerst das Eigenkapital an beiden Stichtagen: Vermögen minus Schulden.'
      : 'Um wie viel hat sich das Eigenkapital verändert? Ende minus Anfang.',
    'Privatentnahmen werden hinzugerechnet, Privateinlagen abgezogen – sie haben das Eigenkapital verändert, ohne Erfolg zu sein.',
    `${s.ergebnis}: ${eur(s.erfolg.abs())}.`,
  ];
}

// ---------- Erzeugung ----------

const ENTNAHMEN: readonly string[] = [
  `${G1} überweist sich Geld für die Renovierung seines Hauses`,
  `${G2} hebt Geld für eine Urlaubsreise vom Geschäftskonto ab`,
  `Die MBG überweist die private Einkommensteuer-Vorauszahlung von ${G1}`,
  `${G2} lässt sich monatlich einen festen Betrag für den Lebensunterhalt überweisen (Jahressumme)`,
  `${G1} bezahlt eine private Handwerkerrechnung vom Geschäftskonto`,
];

const EINLAGEN: readonly string[] = [
  `${G2} zahlt eine Erbschaft auf das Geschäftskonto ein`,
  `${G1} bringt seinen privaten Kombi als Firmenwagen ein (Zeitwert)`,
  `${G2} zahlt Geld aus einem privaten Sparvertrag auf das Bankkonto der MBG ein`,
];

function posten(
  rng: Rng,
  texte: readonly string[],
  n: number,
  spanne: [number, number, number],
  krumm: boolean,
): Privatposten[] {
  return rng
    .shuffle(texte)
    .slice(0, n)
    .map((text) => ({ text, betrag: betrag(rng, spanne[0], spanne[1], spanne[2], krumm) }));
}

function generate(rng: Rng, opts: GenOptions = {}): A7Params {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const variante =
    (opts.variant as A7Variante | undefined) ??
    rng.pick([
      'standard',
      'standard',
      'standard',
      'ohne-privat',
      'vermoegen',
      'vermoegen',
      'rueckwaerts',
    ] as const);
  const verlust = rng.chance(0.25);
  const make = (r: Rng): A7Params => {
    const ekAnfang = r.step(200_000, 600_000, 5_000);
    const erfolgZiel = verlust ? -r.step(5_000, 60_000, 1_000) : r.step(20_000, 150_000, 1_000);
    const privat = variante !== 'ohne-privat';
    const entnahmen = privat ? posten(r, ENTNAHMEN, r.int(1, 3), [5_000, 40_000, 500], krumm) : [];
    const einlagen =
      privat && (variante === 'standard' ? r.chance(0.6) : r.chance(0.4))
        ? posten(r, EINLAGEN, r.int(1, 2), [2_000, 30_000, 500], krumm)
        : [];
    const ekEnde = new Val(ekAnfang)
      .plus(erfolgZiel)
      .minus(sum(entnahmen.map((x) => x.betrag)))
      .plus(sum(einlagen.map((x) => x.betrag)));
    const schuldenAnfang = r.step(100_000, 400_000, 5_000);
    const schuldenEnde = r.step(100_000, 400_000, 5_000);
    return {
      variante,
      ekAnfang: String(ekAnfang),
      ekEnde: ekEnde.value.toFixed(2),
      vermoegenAnfang: String(ekAnfang + schuldenAnfang),
      schuldenAnfang: String(schuldenAnfang),
      vermoegenEnde: ekEnde.plus(schuldenEnde).value.toFixed(2),
      schuldenEnde: String(schuldenEnde),
      entnahmen,
      einlagen,
      erfolg: String(erfolgZiel),
    };
  };
  return retry(rng, make, (p) => new Val(p.ekEnde).exact.gt(50_000));
}

export const ekVergleich = defineGenerator<A7Params, A7Solution>({
  skillId: 'A7-ek-vergleich',
  titel: 'Eigenkapitalvergleich',
  variants: ['standard', 'ohne-privat', 'vermoegen', 'rueckwaerts'],
  points: 3,
  generate,
  render,
  solve: solveEkVergleich,
  parts,
  steps,
  hints,
  errorVariants: variants,
  verfahren: () =>
    'Erfolg durch Eigenkapitalvergleich: EK Ende − EK Anfang + Privatentnahmen − Privateinlagen',
});
