// D5 – Ausgangsfrachten (Vertriebskosten): Frachtrechnung für die Auslieferung an Kunden als Aufwand
// mit Vorsteuer; Abgrenzung zur Eingangsfracht (Bezugskosten) und zur dem Kunden berechneten Fracht
// (Umsatzerlöse). Spezifikation: docs/m7/d.md.
import { loesung, satz, zeile, type BuchungsLoesung, type ErwSatz } from '../../booking';
import { bezugskostenKonto, type Stoff } from '../../accounts';
import { Val } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, Feld, GenOptions, SolutionStep, TaskPart, WahlPart } from '../../task';
import { betrag, defineGenerator, eur, feld, isKrumm, pct, retry } from '../base';
import {
  ERLOESKONTO,
  FORDERUNGEN,
  VERBINDLICHKEITEN,
  ausBrutto,
  ausNetto,
  glattBrutto,
  kunde,
  produktFuer,
} from './gemeinsam';

const AF = 'Ausgangsfrachten';

export type FrachtFall = 'ausgang' | 'eingang' | 'weiterberechnet';

export interface AusgangsfrachtParams {
  fall: FrachtFall;
  gegeben: 'netto' | 'brutto';
  /** Frachtbetrag der Spedition (netto oder brutto je nach `gegeben`) */
  betrag: string;
  zahlung: 'ziel' | 'bank' | 'kasse';
  /** nur Eingangsfracht */
  stoff: Stoff;
  gegenstand: string;
  kunde: string;
  produkt: string;
  /** nur weiterberechnet: Warenwert netto und dem Kunden berechnete Fracht netto */
  warenwert: string;
  frachtBerechnet: string;
  /** zuerst Konto bestimmen (Aufgabe erkennen) */
  erkennen: boolean;
  ustSatz: string;
}

export interface AusgangsfrachtSolution {
  netto: Val;
  vorsteuer: Val;
  brutto: Val;
  erloesNetto: Val;
  erloesUst: Val;
  erloesBrutto: Val;
  buchung: BuchungsLoesung;
}

interface Rechenweg {
  bruttoAlsNetto?: boolean;
  ohneVorsteuer?: boolean;
}

interface Kontenwahl {
  frachtKonto?: string;
  steuerKonto?: string;
  /** dem Kunden berechnete Fracht im Haben von Ausgangsfrachten statt in den Umsatzerlösen */
  verrechnet?: boolean;
}

function gegenkonto(p: AusgangsfrachtParams): string {
  return p.zahlung === 'bank' ? 'Bank' : p.zahlung === 'kasse' ? 'Kasse' : VERBINDLICHKEITEN;
}

function richtigesKonto(p: AusgangsfrachtParams): string {
  return p.fall === 'eingang' ? bezugskostenKonto(p.stoff) : AF;
}

export function rechneFracht(p: AusgangsfrachtParams, w: Rechenweg = {}) {
  let f;
  if (w.ohneVorsteuer) {
    const b = p.gegeben === 'brutto' ? new Val(p.betrag) : ausNetto(p.betrag, p.ustSatz).brutto;
    f = { netto: b, ust: new Val(0), brutto: b };
  } else if (p.gegeben === 'brutto' && !w.bruttoAlsNetto) f = ausBrutto(p.betrag, p.ustSatz);
  else f = ausNetto(p.betrag, p.ustSatz);
  const r = ausNetto(new Val(p.warenwert).plus(p.frachtBerechnet), p.ustSatz);
  return {
    netto: f.netto,
    vorsteuer: f.ust,
    brutto: f.brutto,
    erloesNetto: r.netto,
    erloesUst: r.ust,
    erloesBrutto: r.brutto,
  };
}

type Werte = ReturnType<typeof rechneFracht>;

function buchen(p: AusgangsfrachtParams, v: Werte, k: Kontenwahl = {}): BuchungsLoesung {
  const konto = k.frachtKonto ?? richtigesKonto(p);
  const steuer = k.steuerKonto ?? 'Vorsteuer';
  const soll = [zeile(konto, v.netto)];
  if (!v.vorsteuer.exact.isZero()) soll.push(zeile(steuer, v.vorsteuer));
  const fracht = satz(soll, [zeile(gegenkonto(p), v.brutto)], 'Rechnung der Spedition');
  if (p.fall !== 'weiterberechnet') return loesung([fracht]);
  const erloesHaben = k.verrechnet
    ? [
        zeile(ERLOESKONTO.erzeugnisse, p.warenwert),
        zeile(AF, p.frachtBerechnet),
        zeile('Umsatzsteuer', v.erloesUst),
      ]
    : [zeile(ERLOESKONTO.erzeugnisse, v.erloesNetto), zeile('Umsatzsteuer', v.erloesUst)];
  const ausgang: ErwSatz = satz(
    [zeile(FORDERUNGEN, v.erloesBrutto)],
    erloesHaben,
    'Ausgangsrechnung an den Kunden',
  );
  return loesung([ausgang, fracht]);
}

export function solveAusgangsfracht(p: AusgangsfrachtParams): AusgangsfrachtSolution {
  const v = rechneFracht(p);
  return { ...v, buchung: buchen(p, v) };
}

function kontoPart(p: AusgangsfrachtParams, richtig: string): WahlPart {
  const optionen: [string, string | undefined][] = [
    [AF, p.fall === 'eingang' ? 'eingangsfracht-als-ausgangsfracht' : undefined],
    [
      bezugskostenKonto(p.stoff),
      p.fall === 'eingang' ? undefined : 'ausgangsfracht-als-bezugskosten',
    ],
    ['Erlösberichtigungen', 'ausgangsfracht-als-erloesberichtigung'],
    [ERLOESKONTO.erzeugnisse, undefined],
  ];
  return {
    typ: 'aufgabe-erkennen',
    id: 'konto',
    frage: 'Auf welchem Konto erfasst die MBG den Nettobetrag der Speditionsrechnung?',
    optionen: optionen.map(([text, fehlertyp], i) => {
      const o: WahlPart['optionen'][number] = { id: `k${i}`, text, richtig: text === richtig };
      if (text !== richtig && fehlertyp) o.fehlertyp = fehlertyp;
      if (text === ERLOESKONTO.erzeugnisse && text !== richtig)
        o.erklaerung =
          'Umsatzerlöse entstehen nur, wenn die MBG dem Kunden etwas berechnet. Hier bezahlt die MBG selbst eine Rechnung.';
      return o;
    }),
    begruendung:
      p.fall === 'eingang'
        ? 'Fracht für eingekaufte Stoffe gehört zu den Anschaffungskosten: Bezugskosten (Unterkonto des Stoffkontos).'
        : 'Fracht für die Auslieferung an Kunden ist Vertriebsaufwand: Ausgangsfrachten.',
  };
}

function parts(
  p: AusgangsfrachtParams,
  s: AusgangsfrachtSolution,
  kontoRichtig = richtigesKonto(p),
): TaskPart[] {
  const felder: Feld[] = [];
  if (p.fall === 'weiterberechnet')
    felder.push(feld('erloes', 'Umsatzerlöse laut Ausgangsrechnung (netto)', s.erloesNetto));
  felder.push(
    feld('netto', 'Fracht netto (Speditionsrechnung)', s.netto),
    feld('vst', 'Vorsteuer', s.vorsteuer),
    feld('brutto', 'Fracht brutto', s.brutto),
  );
  const out: TaskPart[] = [];
  if (p.erkennen) out.push(kontoPart(p, kontoRichtig));
  out.push(
    { typ: 'rechenkette', id: 'rechnung', titel: 'Frachtrechnung zerlegen', felder },
    {
      typ: 'buchungssatz',
      id: 'buchung',
      titel: p.fall === 'weiterberechnet' ? 'Buchungssätze (Kunde und Spedition)' : 'Buchungssatz',
      loesung: s.buchung,
    },
  );
  return out;
}

function variants(p: AusgangsfrachtParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Rechenweg, k: Kontenwahl = {}, konto?: string) => {
    const v = rechneFracht(p, w);
    out.push({ fehlertyp, parts: parts(p, { ...v, buchung: buchen(p, v, k) }, konto) });
  };
  add('steuer-falsches-konto', {}, { steuerKonto: 'Umsatzsteuer' });
  if (p.fall === 'eingang') {
    add('eingangsfracht-als-ausgangsfracht', {}, { frachtKonto: AF }, AF);
  } else {
    const bk = bezugskostenKonto(p.stoff);
    add('ausgangsfracht-als-bezugskosten', {}, { frachtKonto: bk }, bk);
    add(
      'ausgangsfracht-als-erloesberichtigung',
      {},
      { frachtKonto: 'Erlösberichtigungen' },
      'Erlösberichtigungen',
    );
  }
  add('fracht-ohne-vorsteuer', { ohneVorsteuer: true });
  if (p.gegeben === 'brutto') add('brutto-als-netto', { bruttoAlsNetto: true });
  if (p.fall === 'weiterberechnet')
    add('weiterberechnete-fracht-verrechnet', {}, { verrechnet: true });
  return out;
}

const ZAHLUNG_TEXT: Record<AusgangsfrachtParams['zahlung'], string> = {
  ziel: 'Die Rechnung wird später bezahlt.',
  bank: 'Die MBG überweist den Betrag sofort per Bank.',
  kasse: 'Der Fahrer erhält den Betrag bar aus der Kasse.',
};

function render(p: AusgangsfrachtParams) {
  const u = pct(p.ustSatz);
  const fracht = `${eur(p.betrag)} ${p.gegeben === 'brutto' ? `einschließlich ${u} Umsatzsteuer` : `netto zuzüglich ${u} Umsatzsteuer`}`;
  const sachverhalt: string[] = [];
  if (p.fall === 'ausgang') {
    sachverhalt.push(
      `Die MBG liefert ${p.produkt} frei Haus an ${p.kunde}. Die Fracht trägt also die MBG.`,
      `Die beauftragte Spedition berechnet für den Transport ${fracht}. ${ZAHLUNG_TEXT[p.zahlung]}`,
    );
  } else if (p.fall === 'eingang') {
    sachverhalt.push(
      `Für eine Lieferung ${p.gegenstand} vom Lieferanten zum Werk Paderborn berechnet die Spedition der MBG ${fracht}.`,
      ZAHLUNG_TEXT[p.zahlung],
    );
  } else {
    sachverhalt.push(
      `Die MBG liefert ${p.produkt} an ${p.kunde}: Warenwert ${eur(p.warenwert)} netto. Laut Vereinbarung berechnet sie dem Kunden zusätzlich ${eur(p.frachtBerechnet)} netto Frachtanteil; auf die Ausgangsrechnung kommen ${u} Umsatzsteuer (Verkauf auf Ziel).`,
      `Die Spedition stellt der MBG für diese Lieferung ${fracht} in Rechnung. ${ZAHLUNG_TEXT[p.zahlung]}`,
    );
  }
  return {
    titel: p.fall === 'eingang' ? 'Frachtrechnung im Einkauf' : 'Ausgangsfrachten',
    kontext: 'Juni: Auslieferung an die Gastronomie',
    sachverhalt,
    aufgabe:
      p.fall === 'weiterberechnet'
        ? 'Bilde die Buchungssätze für die Ausgangsrechnung und für die Rechnung der Spedition.'
        : 'Zerlege die Frachtrechnung und bilde den Buchungssatz.',
  };
}

function steps(p: AusgangsfrachtParams, s: AusgangsfrachtSolution): SolutionStep[] {
  const u = pct(p.ustSatz);
  const out: SolutionStep[] = [
    {
      titel: 'Konto bestimmen',
      erlaeuterung:
        p.fall === 'eingang'
          ? `Die Fracht gehört zum Einkauf der ${p.stoff}: Sie erhöht die Anschaffungskosten und kommt auf ${bezugskostenKonto(p.stoff)}.`
          : 'Die Fracht entsteht beim Verkauf und wird von der MBG getragen: Vertriebsaufwand auf Ausgangsfrachten.',
    },
    {
      titel: 'Frachtrechnung zerlegen',
      rechnung:
        p.gegeben === 'brutto'
          ? `${eur(p.betrag)} ÷ (1 + ${u}) = ${eur(s.netto)}; Vorsteuer ${eur(s.brutto)} − ${eur(s.netto)} = ${eur(s.vorsteuer)}`
          : `${eur(s.netto)} × ${u} = ${eur(s.vorsteuer)}; brutto ${eur(s.brutto)}`,
      erlaeuterung:
        'Die Spedition ist ein Lieferant der MBG: Ihre Umsatzsteuer ist für die MBG Vorsteuer.',
    },
  ];
  if (p.fall === 'weiterberechnet')
    out.push({
      titel: 'Ausgangsrechnung',
      rechnung: `${eur(p.warenwert)} + ${eur(p.frachtBerechnet)} = ${eur(s.erloesNetto)}; Umsatzsteuer ${eur(s.erloesUst)}; Forderung ${eur(s.erloesBrutto)}`,
      erlaeuterung:
        'Was der Kunde für die Fracht bezahlt, ist Umsatzerlös. Was die MBG der Spedition zahlt, ist Aufwand. Beides wird nicht miteinander verrechnet.',
    });
  return out;
}

const GEGENSTAND: Record<'Rohstoffe' | 'Hilfsstoffe', string[]> = {
  Rohstoffe: ['Aromen', 'Aromakonzentrat', 'Tequila-Aroma'],
  Hilfsstoffe: ['Dosen', 'Glasflaschen', 'Etiketten'],
};

function generate(rng: Rng, opts: GenOptions = {}): AusgangsfrachtParams {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const v = opts.variant;
  const fall: FrachtFall =
    v === 'weiterberechnet'
      ? 'weiterberechnet'
      : v === 'ausgang' || v === 'brutto'
        ? 'ausgang'
        : v === 'unterscheiden'
          ? rng.pick(['ausgang', 'eingang'] as const)
          : rng.pick(['ausgang', 'ausgang', 'ausgang', 'eingang', 'weiterberechnet'] as const);
  const gegeben = v === 'brutto' ? 'brutto' : rng.chance(0.35) ? 'brutto' : 'netto';
  const erkennen =
    v === 'unterscheiden' || fall === 'eingang' || (v === undefined && rng.chance(0.3));
  const stoff = rng.pick(['Rohstoffe', 'Hilfsstoffe'] as const);
  const ustSatz = '0.19';
  const make = (r: Rng): AusgangsfrachtParams => ({
    fall,
    gegeben,
    betrag:
      gegeben === 'brutto'
        ? krumm
          ? betrag(r, 80, 3_000, 1, true)
          : glattBrutto(r, 80, 2_500, 10, ustSatz)
        : betrag(r, 80, 2_500, 10, krumm),
    zahlung:
      fall === 'weiterberechnet'
        ? r.pick(['ziel', 'bank'] as const)
        : r.pick(['ziel', 'ziel', 'bank', 'kasse'] as const),
    stoff,
    gegenstand: r.pick(GEGENSTAND[stoff]),
    kunde: kunde(r),
    produkt: produktFuer(r, 'erzeugnisse'),
    warenwert: fall === 'weiterberechnet' ? String(r.step(2_000, 30_000, 100)) : '0',
    frachtBerechnet: fall === 'weiterberechnet' ? String(r.step(50, 600, 10)) : '0',
    erkennen,
    ustSatz,
  });
  return retry(rng, make, (p) => {
    if (krumm) return true;
    const w = rechneFracht(p);
    return w.netto.steps === 0 && w.vorsteuer.steps === 0;
  });
}

export const ausgangsfrachten = defineGenerator<AusgangsfrachtParams, AusgangsfrachtSolution>({
  skillId: 'D5-ausgangsfrachten',
  titel: 'Ausgangsfrachten',
  variants: ['ausgang', 'brutto', 'weiterberechnet', 'unterscheiden'],
  points: 2,
  generate,
  render,
  solve: solveAusgangsfracht,
  parts,
  steps,
  hints: (p, s) => [
    'Frage zuerst: Gehört die Fracht zum Einkauf (Bezugskosten) oder zum Verkauf (Ausgangsfrachten)? Und wer bezahlt sie?',
    p.gegeben === 'brutto'
      ? `Die Rechnung ist brutto angegeben: Netto = Brutto ÷ (1 + ${pct(p.ustSatz)}). Die Steuer ist Vorsteuer.`
      : `Auf die Nettofracht kommt ${pct(p.ustSatz)} Vorsteuer.`,
    `${p.fall === 'eingang' ? bezugskostenKonto(p.stoff) : 'Ausgangsfrachten'} ${eur(s.netto)}, Vorsteuer ${eur(s.vorsteuer)} an ${p.zahlung === 'bank' ? 'Bank' : p.zahlung === 'kasse' ? 'Kasse' : 'Verbindlichkeiten a. LL'} ${eur(s.brutto)}.`,
  ],
  errorVariants: variants,
  verfahren: (p) =>
    p.fall === 'eingang'
      ? 'Eingangsfracht: Bezugskosten auf dem Unterkonto des Stoffes'
      : 'Ausgangsfracht: Vertriebsaufwand mit Vorsteuer',
});
