// D2 – Rücksendungen von Kunden: Stornobuchung auf dem Erlöskonto (04-fachregeln.md, Konvention 5;
// BA 3.2.1). Spezifikation: docs/m7/d.md.
import { loesung, satz, zeile, type BuchungsLoesung } from '../../booking';
import { Val } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, GenOptions, SolutionStep, TaskPart } from '../../task';
import { betrag, defineGenerator, eur, feld, isExact, isKrumm, pct, retry } from '../base';
import {
  ERLOESKONTO,
  FORDERUNGEN,
  ausBrutto,
  ausNetto,
  glattBrutto,
  kunde,
  produktFuer,
  type Verkaufsart,
} from './gemeinsam';

export type RuecksendungGegeben = 'netto' | 'brutto' | 'liste' | 'verpackung';

export interface RuecksendungParams {
  art: Verkaufsart;
  produkt: string;
  kunde: string;
  gegeben: RuecksendungGegeben;
  /** netto/brutto: Wert der Rücksendung; liste: Listenpreis der zurückgesandten Ware; verpackung: berechnete Verpackung netto */
  betrag: string;
  /** nur bei 'liste': Rabatt der ursprünglichen Rechnung */
  rabattSatz: string;
  /** nur bei 'verpackung': gutgeschriebener Anteil */
  anteil: string;
  grund: number;
  ustSatz: string;
  /** forderung: Gutschrift mindert die offene Forderung; bank: Kunde hatte schon bezahlt, Rückzahlung */
  ausgleich: 'forderung' | 'bank';
  vorlage: number;
}

export interface RuecksendungSolution {
  netto: Val;
  ust: Val;
  brutto: Val;
  buchung: BuchungsLoesung;
}

interface Rechenweg {
  bruttoAlsNetto?: boolean;
  rabattVergessen?: boolean;
}

interface Kontenwahl {
  stornoKonto?: string;
  steuerKonto?: string;
  ohneSteuer?: boolean;
}

export function rechneRuecksendung(p: RuecksendungParams, w: Rechenweg = {}) {
  switch (p.gegeben) {
    case 'brutto':
      return w.bruttoAlsNetto ? ausNetto(p.betrag, p.ustSatz) : ausBrutto(p.betrag, p.ustSatz);
    case 'liste': {
      const liste = new Val(p.betrag);
      const rabatt = w.rabattVergessen ? new Val(0) : liste.times(p.rabattSatz).fix();
      return ausNetto(liste.minus(rabatt), p.ustSatz);
    }
    case 'verpackung':
      return ausNetto(new Val(p.betrag).times(p.anteil).fix(), p.ustSatz);
    default:
      return ausNetto(p.betrag, p.ustSatz);
  }
}

type Werte = ReturnType<typeof rechneRuecksendung>;

function buchen(p: RuecksendungParams, v: Werte, k: Kontenwahl = {}): BuchungsLoesung {
  const konto = k.stornoKonto ?? ERLOESKONTO[p.art];
  const gegen = p.ausgleich === 'bank' ? 'Bank' : FORDERUNGEN;
  const soll = k.ohneSteuer
    ? [zeile(konto, v.brutto)]
    : [zeile(konto, v.netto), zeile(k.steuerKonto ?? 'Umsatzsteuer', v.ust)];
  return loesung([satz(soll, [zeile(gegen, v.brutto)], 'Gutschrift für die Rücksendung')]);
}

export function solveRuecksendung(p: RuecksendungParams): RuecksendungSolution {
  const v = rechneRuecksendung(p);
  return { ...v, buchung: buchen(p, v) };
}

function parts(p: RuecksendungParams, s: RuecksendungSolution): TaskPart[] {
  return [
    {
      typ: 'rechenkette',
      id: 'rechnung',
      titel: 'Gutschrift berechnen',
      felder: [
        feld(
          'netto',
          p.gegeben === 'verpackung' ? 'Gutschrift netto' : 'Nettowert der Rücksendung',
          s.netto,
        ),
        feld('ust', 'Umsatzsteuerkorrektur', s.ust),
        feld('brutto', 'Gutschrift brutto', s.brutto),
      ],
    },
    {
      typ: 'buchungssatz',
      id: 'buchung',
      titel: 'Buchungssatz für die Rücksendung',
      loesung: s.buchung,
    },
  ];
}

function variants(p: RuecksendungParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Rechenweg, k: Kontenwahl = {}) => {
    const v = rechneRuecksendung(p, w);
    out.push({ fehlertyp, parts: parts(p, { ...v, buchung: buchen(p, v, k) }) });
  };
  add('steuer-falsches-konto', {}, { steuerKonto: 'Vorsteuer' });
  add('ruecksendung-als-erloesberichtigung', {}, { stornoKonto: 'Erlösberichtigungen' });
  if (p.gegeben !== 'verpackung')
    add(
      'ruecksendung-auf-bestandskonto',
      {},
      { stornoKonto: p.art === 'erzeugnisse' ? 'Fertige Erzeugnisse' : 'Handelswaren' },
    );
  add('ruecksendung-ohne-ust', {}, { ohneSteuer: true });
  if (p.gegeben === 'brutto') add('brutto-als-netto', { bruttoAlsNetto: true });
  if (p.gegeben === 'liste') add('rabatt-vergessen', { rabattVergessen: true });
  return out;
}

const GRUENDE = [
  'weil ein Teil der Dosen beim Transport verbeult wurde',
  'weil eine falsche Sorte geliefert wurde',
  'weil mehr geliefert wurde als bestellt',
  'weil die Etiketten falsch bedruckt waren',
];

function render(p: RuecksendungParams) {
  const u = pct(p.ustSatz);
  const grund = GRUENDE[p.grund % GRUENDE.length]!;
  const sachverhalt: string[] = [];
  switch (p.gegeben) {
    case 'netto':
      sachverhalt.push(
        p.vorlage === 0
          ? `${p.kunde} schickt einen Teil einer Lieferung ${p.produkt} zurück, ${grund}.`
          : `Rücksendung von ${p.kunde}: ${p.produkt}, ${grund}.`,
        `Der Nettowert der zurückgesandten Ware beträgt ${eur(p.betrag)}; die MBG erteilt eine Gutschrift einschließlich ${u} Umsatzsteuer.`,
      );
      break;
    case 'brutto':
      sachverhalt.push(
        `${p.kunde} sendet ${p.produkt} zurück, ${grund}.`,
        `Die MBG schreibt dem Kunden dafür ${eur(p.betrag)} einschließlich ${u} Umsatzsteuer gut.`,
      );
      break;
    case 'liste':
      sachverhalt.push(
        `${p.kunde} hatte ${p.produkt} mit ${pct(p.rabattSatz)} Wiederverkäuferrabatt gekauft und schickt jetzt einen Teil zurück, ${grund}.`,
        `Der Listenpreis der zurückgesandten Ware beträgt ${eur(p.betrag)} netto. Die Gutschrift wird zum Rechnungspreis (nach Rabatt) zuzüglich ${u} Umsatzsteuer erteilt.`,
      );
      break;
    case 'verpackung':
      sachverhalt.push(
        `Die MBG hatte ${p.kunde} Mehrwegpaletten mit ${eur(p.betrag)} netto in Rechnung gestellt (gebucht auf Umsatzerlöse).`,
        `Der Kunde gibt die Paletten zurück. Vereinbarungsgemäß werden ${pct(p.anteil)} des berechneten Betrags zuzüglich ${u} Umsatzsteuer gutgeschrieben.`,
      );
      break;
  }
  sachverhalt.push(
    p.ausgleich === 'forderung'
      ? 'Die Rechnung ist noch nicht bezahlt; die Gutschrift mindert die offene Forderung.'
      : 'Der Kunde hatte die Rechnung bereits bezahlt. Die MBG überweist ihm den Gutschriftsbetrag per Bank zurück.',
  );
  return {
    titel: 'Rücksendung vom Kunden',
    kontext: 'Mai: Reklamationen in der Saison',
    sachverhalt,
    aufgabe: 'Berechne die Gutschrift und bilde den Buchungssatz für die Rücksendung.',
  };
}

function steps(p: RuecksendungParams, s: RuecksendungSolution): SolutionStep[] {
  const u = pct(p.ustSatz);
  const out: SolutionStep[] = [];
  if (p.gegeben === 'brutto')
    out.push({
      titel: 'Gutschrift zerlegen',
      rechnung: `${eur(p.betrag)} ÷ (1 + ${u}) = ${eur(s.netto)}; Steuer ${eur(s.brutto)} − ${eur(s.netto)} = ${eur(s.ust)}`,
    });
  else {
    if (p.gegeben === 'liste')
      out.push({
        titel: 'Rechnungspreis nach Rabatt',
        rechnung: `${eur(p.betrag)} − ${pct(p.rabattSatz)} = ${eur(s.netto)}`,
        erlaeuterung:
          'Gutgeschrieben wird, was der Kunde für die Ware wirklich berechnet bekam – also nach Abzug des Rabatts.',
      });
    if (p.gegeben === 'verpackung')
      out.push({
        titel: 'Gutgeschriebener Anteil',
        rechnung: `${eur(p.betrag)} × ${pct(p.anteil)} = ${eur(s.netto)}`,
      });
    out.push({
      titel: 'Umsatzsteuer und Gutschrift',
      rechnung: `${eur(s.netto)} × ${u} = ${eur(s.ust)}; ${eur(s.netto)} + ${eur(s.ust)} = ${eur(s.brutto)}`,
    });
  }
  out.push({
    titel: 'Stornobuchung',
    rechnung: `${ERLOESKONTO[p.art]} ${eur(s.netto)}, Umsatzsteuer ${eur(s.ust)} an ${p.ausgleich === 'bank' ? 'Bank' : 'Forderungen a. LL'} ${eur(s.brutto)}`,
    erlaeuterung:
      'Eine Rücksendung macht den Verkauf teilweise rückgängig: Der ursprüngliche Buchungssatz wird mit vertauschten Seiten gebucht. Erlösberichtigungen sind nur für Nachlässe gedacht.',
  });
  return out;
}

function generate(rng: Rng, opts: GenOptions = {}): RuecksendungParams {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const v = opts.variant;
  const gegeben: RuecksendungGegeben =
    v === 'netto' || v === 'brutto' || v === 'verpackung'
      ? v
      : v === 'rabatt'
        ? 'liste'
        : v === 'handelswaren'
          ? rng.pick(['netto', 'brutto'] as const)
          : rng.pick(['netto', 'netto', 'brutto', 'liste', 'verpackung'] as const);
  const art: Verkaufsart =
    gegeben === 'verpackung'
      ? 'erzeugnisse'
      : v === 'handelswaren' || (v === undefined && rng.chance(0.2))
        ? 'handelswaren'
        : 'erzeugnisse';
  const ustSatz = '0.19';
  const make = (r: Rng): RuecksendungParams => {
    let wert: string;
    if (gegeben === 'brutto')
      wert = krumm ? betrag(r, 100, 12_000, 1, true) : glattBrutto(r, 100, 10_000, 10, ustSatz);
    else if (gegeben === 'verpackung') wert = betrag(r, 100, 2_000, 10, krumm);
    else wert = betrag(r, 200, 12_000, 10, krumm);
    return {
      art,
      produkt: produktFuer(r, art),
      kunde: kunde(r),
      gegeben,
      betrag: wert,
      rabattSatz: gegeben === 'liste' ? r.pick(['0.1', '0.15', '0.2', '0.25']) : '0',
      anteil: gegeben === 'verpackung' ? r.pick(['0.5', '0.6', '0.75', '0.8', '1']) : '1',
      grund: r.int(0, GRUENDE.length - 1),
      ustSatz,
      ausgleich: r.chance(0.2) ? 'bank' : 'forderung',
      vorlage: r.int(0, 1),
    };
  };
  return retry(rng, make, (p) => {
    if (krumm) return true;
    const w = rechneRuecksendung(p);
    return isExact(w.netto.exact) && w.netto.steps === 0 && w.ust.steps === 0;
  });
}

export const ruecksendungVerkauf = defineGenerator<RuecksendungParams, RuecksendungSolution>({
  skillId: 'D2-ruecksendung-verkauf',
  titel: 'Rücksendung vom Kunden',
  variants: ['netto', 'brutto', 'rabatt', 'verpackung', 'handelswaren'],
  points: 2,
  generate,
  render,
  solve: solveRuecksendung,
  parts,
  steps,
  hints: (p, s) => [
    'Eine Rücksendung ist eine Stornobuchung: Der Verkauf wird (teilweise) rückgängig gemacht.',
    p.gegeben === 'brutto'
      ? `Die Gutschrift ist brutto angegeben: Netto = Gutschrift ÷ (1 + ${pct(p.ustSatz)}).`
      : p.gegeben === 'liste'
        ? 'Zuerst den Rabatt der ursprünglichen Rechnung vom Listenpreis abziehen, dann die Steuer berechnen.'
        : `Zur Nettogutschrift kommt die Umsatzsteuer (${pct(p.ustSatz)}) hinzu.`,
    `Im Soll: ${ERLOESKONTO[p.art]} ${eur(s.netto)} und Umsatzsteuer ${eur(s.ust)}; im Haben: ${p.ausgleich === 'bank' ? 'Bank' : 'Forderungen a. LL'} ${eur(s.brutto)}.`,
  ],
  errorVariants: variants,
  verfahren: () => 'Rücksendung vom Kunden: Stornobuchung auf dem Umsatzerlöskonto',
});
