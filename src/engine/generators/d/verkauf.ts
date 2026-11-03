// D1 – Verkauf eigener Erzeugnisse (und Handelswaren) mit Umsatzsteuer, Rabatt und
// in Rechnung gestellten Nebenkosten (Verpackung, Fracht). Spezifikation: docs/m7/d.md.
import { loesung, satz, zeile, type BuchungsLoesung } from '../../booking';
import { Val, dec } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, Feld, GenOptions, SolutionStep, TaskPart } from '../../task';
import { betrag, defineGenerator, eur, feld, isExact, isKrumm, pct, retry } from '../base';
import {
  ERLOESKONTO,
  FORDERUNGEN,
  ausBrutto,
  glattBrutto,
  kunde,
  produktFuer,
  type Verkaufsart,
} from './gemeinsam';

export interface Nebenkosten {
  /** Betrag in €, Dezimal-String */
  betrag: string;
  /** true: Betrag einschließlich Umsatzsteuer angegeben */
  brutto: boolean;
}

export interface VerkaufParams {
  art: Verkaufsart;
  produkt: string;
  kunde: string;
  /** Warenwert netto vor Rabatt (Listenpreis) */
  listenpreis: string;
  /** Sofortrabatt als Dezimal-String, '0' = kein Rabatt */
  rabattSatz: string;
  verpackung?: Nebenkosten;
  fracht?: Nebenkosten;
  ustSatz: string;
  zahlung: 'ziel' | 'bank';
  vorlage: number;
}

export interface VerkaufSolution {
  rabatt: Val;
  warenwert: Val;
  verpackungNetto: Val;
  frachtNetto: Val;
  nebenkosten: Val;
  netto: Val;
  ust: Val;
  brutto: Val;
  buchung: BuchungsLoesung;
}

interface Rechenweg {
  rabattVergessen?: boolean;
  rabattAufNebenkosten?: boolean;
  nebenkostenVergessen?: boolean;
  bruttoAlsNetto?: boolean;
}

interface Kontenwahl {
  erloesKonto?: string;
  steuerKonto?: string;
  /** Nebenkosten getrennt auf diesem Konto im Haben (Fehler: als Aufwandsminderung) */
  nebenkostenKonto?: string;
  /** Sofortrabatt als Erlösberichtigung gebucht (Fehler) */
  rabattGebucht?: boolean;
}

function nkNetto(nk: Nebenkosten | undefined, ustSatz: string, w: Rechenweg): Val {
  if (!nk || w.nebenkostenVergessen) return new Val(0);
  return nk.brutto && !w.bruttoAlsNetto ? ausBrutto(nk.betrag, ustSatz).netto : new Val(nk.betrag);
}

export function rechneVerkauf(p: VerkaufParams, w: Rechenweg = {}) {
  const verpackungNetto = nkNetto(p.verpackung, p.ustSatz, w);
  const frachtNetto = nkNetto(p.fracht, p.ustSatz, w);
  const nebenkosten = verpackungNetto.plus(frachtNetto);
  const liste = new Val(p.listenpreis);
  const rabattBasis = w.rabattAufNebenkosten ? liste.plus(nebenkosten) : liste;
  const rabatt = w.rabattVergessen ? new Val(0) : rabattBasis.times(p.rabattSatz).fix();
  const warenwert = liste.minus(rabatt);
  const netto = warenwert.plus(nebenkosten);
  const ust = netto.times(p.ustSatz).fix();
  return {
    rabatt,
    warenwert,
    verpackungNetto,
    frachtNetto,
    nebenkosten,
    netto,
    ust,
    brutto: netto.plus(ust),
  };
}

type Werte = ReturnType<typeof rechneVerkauf>;

function buchen(p: VerkaufParams, v: Werte, k: Kontenwahl = {}): BuchungsLoesung {
  const soll = [zeile(p.zahlung === 'bank' ? 'Bank' : FORDERUNGEN, v.brutto)];
  const erloes = k.erloesKonto ?? ERLOESKONTO[p.art];
  const steuer = k.steuerKonto ?? 'Umsatzsteuer';
  const haben = [];
  if (k.nebenkostenKonto && !v.nebenkosten.exact.isZero()) {
    haben.push(zeile(erloes, v.warenwert), zeile(k.nebenkostenKonto, v.nebenkosten));
  } else if (k.rabattGebucht && !v.rabatt.exact.isZero()) {
    soll.push(zeile('Erlösberichtigungen', v.rabatt));
    haben.push(zeile(erloes, v.netto.plus(v.rabatt)));
  } else {
    haben.push(zeile(erloes, v.netto));
  }
  haben.push(zeile(steuer, v.ust));
  return loesung([satz(soll, haben, 'Ausgangsrechnung')]);
}

export function solveVerkauf(p: VerkaufParams): VerkaufSolution {
  const v = rechneVerkauf(p);
  return { ...v, buchung: buchen(p, v) };
}

function hatRabatt(p: VerkaufParams): boolean {
  return !dec(p.rabattSatz).isZero();
}

function hatNebenkosten(p: VerkaufParams): boolean {
  return p.verpackung !== undefined || p.fracht !== undefined;
}

function parts(
  p: VerkaufParams,
  s: Omit<VerkaufSolution, 'buchung'> & { buchung: BuchungsLoesung },
) {
  const felder: Feld[] = [];
  if (hatRabatt(p)) {
    felder.push(
      feld('rabatt', 'Rabatt', s.rabatt),
      feld('warenwert', 'Warenwert nach Rabatt (netto)', s.warenwert),
    );
  }
  if (hatNebenkosten(p)) {
    felder.push(feld('nebenkosten', 'Verpackung und Fracht (netto)', s.nebenkosten));
  }
  felder.push(
    feld('netto', 'Umsatzerlöse (netto)', s.netto),
    feld('ust', 'Umsatzsteuer', s.ust),
    feld('brutto', 'Rechnungsbetrag (brutto)', s.brutto),
  );
  const out: TaskPart[] = [
    { typ: 'rechenkette', id: 'rechnung', titel: 'Ausgangsrechnung aufbauen', felder },
    {
      typ: 'buchungssatz',
      id: 'buchung',
      titel: 'Buchungssatz für die Ausgangsrechnung',
      loesung: s.buchung,
    },
  ];
  return out;
}

function variants(p: VerkaufParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Rechenweg, k: Kontenwahl = {}) => {
    const v = rechneVerkauf(p, w);
    out.push({ fehlertyp, parts: parts(p, { ...v, buchung: buchen(p, v, k) }) });
  };
  add('steuer-falsches-konto', {}, { steuerKonto: 'Vorsteuer' });
  add(
    'erloeskonto-verwechselt',
    {},
    { erloesKonto: ERLOESKONTO[p.art === 'erzeugnisse' ? 'handelswaren' : 'erzeugnisse'] },
  );
  if (hatRabatt(p)) {
    add('rabatt-vergessen', { rabattVergessen: true });
    add('sofortrabatt-gebucht', {}, { rabattGebucht: true });
    if (hatNebenkosten(p)) add('rabatt-auf-nebenkosten', { rabattAufNebenkosten: true });
  }
  if (hatNebenkosten(p)) {
    add('verkaufsnebenkosten-vergessen', { nebenkostenVergessen: true });
    add('nebenkosten-als-aufwandsminderung', {}, { nebenkostenKonto: 'Ausgangsfrachten' });
    if (p.verpackung?.brutto || p.fracht?.brutto) add('brutto-als-netto', { bruttoAlsNetto: true });
  }
  return out;
}

function nkText(name: string, nk: Nebenkosten | undefined): string | null {
  if (!nk) return null;
  return `${name} ${eur(nk.betrag)} ${nk.brutto ? 'brutto' : 'netto'}`;
}

function render(p: VerkaufParams) {
  const u = pct(p.ustSatz);
  const was = p.art === 'erzeugnisse' ? `${p.produkt} aus eigener Herstellung` : p.produkt;
  const sachverhalt = [
    p.vorlage === 0
      ? `Die MBG liefert ${was} an ${p.kunde}. Der Listenpreis der Ware beträgt ${eur(p.listenpreis)} netto.`
      : `Ausgangsrechnung an ${p.kunde}: ${was}, Listenpreis ${eur(p.listenpreis)} netto.`,
  ];
  if (hatRabatt(p))
    sachverhalt.push(
      `Als Wiederverkäufer erhält der Kunde ${pct(p.rabattSatz)} Rabatt auf den Warenwert, der direkt in der Rechnung abgezogen wird.`,
    );
  const nk = [nkText('Verpackung', p.verpackung), nkText('Fracht', p.fracht)].filter(
    (x): x is string => x !== null,
  );
  if (nk.length > 0)
    sachverhalt.push(`Zusätzlich berechnet die MBG dem Kunden: ${nk.join(' und ')}.`);
  sachverhalt.push(
    p.zahlung === 'ziel'
      ? `Hinzu kommen ${u} Umsatzsteuer. Der Kunde zahlt später (Verkauf auf Ziel).`
      : `Hinzu kommen ${u} Umsatzsteuer. Der Kunde überweist den Rechnungsbetrag sofort auf das Bankkonto der MBG.`,
  );
  return {
    titel: p.art === 'erzeugnisse' ? 'Verkauf eigener Erzeugnisse' : 'Verkauf von Handelswaren',
    kontext: 'April: Saisonstart Gastronomie',
    sachverhalt,
    aufgabe: 'Ermittle die Rechnungsbeträge und bilde den Buchungssatz für die Ausgangsrechnung.',
  };
}

function steps(p: VerkaufParams, s: VerkaufSolution): SolutionStep[] {
  const out: SolutionStep[] = [];
  const u = pct(p.ustSatz);
  if (hatRabatt(p)) {
    out.push({
      titel: 'Rabatt abziehen',
      rechnung: `${eur(p.listenpreis)} × ${pct(p.rabattSatz)} = ${eur(s.rabatt)}; ${eur(p.listenpreis)} − ${eur(s.rabatt)} = ${eur(s.warenwert)}`,
      erlaeuterung:
        'Ein Rabatt, der schon in der Rechnung abgezogen wird, wird nicht gebucht. Er gilt nur für den Warenwert, nicht für Verpackung und Fracht.',
    });
  }
  if (hatNebenkosten(p)) {
    const teile: string[] = [];
    for (const [name, nk, netto] of [
      ['Verpackung', p.verpackung, s.verpackungNetto],
      ['Fracht', p.fracht, s.frachtNetto],
    ] as const) {
      if (!nk) continue;
      teile.push(
        nk.brutto
          ? `${name}: ${eur(nk.betrag)} ÷ (1 + ${u}) = ${eur(netto)}`
          : `${name}: ${eur(netto)}`,
      );
    }
    out.push({
      titel: 'Nebenkosten netto',
      rechnung: `${teile.join('; ')} → zusammen ${eur(s.nebenkosten)}`,
      erlaeuterung:
        'Was die MBG dem Kunden für Verpackung und Fracht berechnet, ist Teil des Verkaufserlöses.',
    });
  }
  out.push(
    {
      titel: 'Umsatzerlöse (netto)',
      rechnung: hatNebenkosten(p)
        ? `${eur(s.warenwert)} + ${eur(s.nebenkosten)} = ${eur(s.netto)}`
        : `${eur(s.netto)}`,
    },
    {
      titel: 'Umsatzsteuer und Rechnungsbetrag',
      rechnung: `${eur(s.netto)} × ${u} = ${eur(s.ust)}; ${eur(s.netto)} + ${eur(s.ust)} = ${eur(s.brutto)}`,
    },
    {
      titel: 'Buchung',
      rechnung: `${p.zahlung === 'bank' ? 'Bank' : 'Forderungen a. LL'} ${eur(s.brutto)} an ${p.art === 'erzeugnisse' ? 'Umsatzerlöse für eigene Erzeugnisse' : 'Umsatzerlöse für Handelswaren'} ${eur(s.netto)}, an Umsatzsteuer ${eur(s.ust)}`,
      erlaeuterung:
        'Die Umsatzsteuer schuldet die MBG dem Finanzamt (Passivkonto, Haben). Der Kunde schuldet den Bruttobetrag.',
    },
  );
  return out;
}

function generate(rng: Rng, opts: GenOptions = {}): VerkaufParams {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const v = opts.variant;
  const art: Verkaufsart =
    v === 'handelswaren'
      ? 'handelswaren'
      : v
        ? 'erzeugnisse'
        : rng.chance(0.2)
          ? 'handelswaren'
          : 'erzeugnisse';
  const mitRabatt = v === 'rabatt' || (v === undefined && rng.chance(0.5));
  const mitNK =
    v === 'nebenkosten' || v === 'nebenkosten-brutto' || (v === undefined && rng.chance(0.6));
  const ustSatz = '0.19';
  const make = (r: Rng): VerkaufParams => {
    const p: VerkaufParams = {
      art,
      produkt: produktFuer(r, art),
      kunde: kunde(r),
      listenpreis: betrag(r, 1_000, 40_000, 100, krumm),
      rabattSatz: mitRabatt ? r.pick(['0.05', '0.1', '0.15', '0.2', '0.25']) : '0',
      ustSatz,
      zahlung: r.chance(0.15) ? 'bank' : 'ziel',
      vorlage: r.int(0, 1),
    };
    if (mitNK) {
      const welche = r.pick(['beide', 'beide', 'verpackung', 'fracht'] as const);
      const brutto = (): boolean =>
        v === 'nebenkosten-brutto' ? true : v === 'nebenkosten' ? false : r.chance(0.35);
      const nk = (min: number, max: number): Nebenkosten => {
        const b = brutto();
        return {
          brutto: b,
          betrag: krumm
            ? betrag(r, min, max, 1, true)
            : b
              ? glattBrutto(r, min, max, 10, ustSatz)
              : String(r.step(min, max, 10)),
        };
      };
      if (welche !== 'fracht') p.verpackung = nk(40, 600);
      if (welche !== 'verpackung') p.fracht = nk(60, 900);
      if (v === 'nebenkosten-brutto' && !p.verpackung?.brutto && !p.fracht?.brutto)
        p.fracht = { ...nk(60, 900), brutto: true };
    }
    return p;
  };
  return retry(rng, make, (p) => {
    if (krumm) return true;
    const w = rechneVerkauf(p);
    return isExact(w.rabatt.exact) && isExact(w.ust.exact) && w.ust.steps === 0;
  });
}

export const verkauf = defineGenerator<VerkaufParams, VerkaufSolution>({
  skillId: 'D1-verkauf',
  titel: 'Verkauf mit Umsatzsteuer',
  variants: ['einfach', 'rabatt', 'nebenkosten', 'nebenkosten-brutto', 'handelswaren'],
  points: 3,
  generate,
  render,
  solve: solveVerkauf,
  parts,
  steps,
  hints: (p, s) => [
    hatRabatt(p)
      ? 'Zuerst den Rabatt vom Listenpreis abziehen – nur vom Warenwert, nicht von Verpackung und Fracht.'
      : 'Erst alle Nettobeträge zusammenzählen, dann die Umsatzsteuer berechnen.',
    hatNebenkosten(p)
      ? `Verpackung und Fracht, die der Kunde bezahlt, gehören zu den Umsatzerlösen. Bruttoangaben vorher durch (1 + ${pct(p.ustSatz)}) teilen.`
      : `Umsatzsteuer = Nettobetrag × ${pct(p.ustSatz)}; Rechnungsbetrag = Netto + Steuer.`,
    `${p.zahlung === 'bank' ? 'Bank' : 'Forderungen a. LL'} ${eur(s.brutto)} an ${p.art === 'erzeugnisse' ? 'Umsatzerlöse für eigene Erzeugnisse' : 'Umsatzerlöse für Handelswaren'} ${eur(s.netto)}, an Umsatzsteuer ${eur(s.ust)}.`,
  ],
  errorVariants: variants,
  verfahren: (p) =>
    p.art === 'erzeugnisse'
      ? 'Verkauf eigener Erzeugnisse: Umsatzerlöse und Umsatzsteuer buchen'
      : 'Verkauf von Handelswaren: Umsatzerlöse für Handelswaren und Umsatzsteuer buchen',
});
