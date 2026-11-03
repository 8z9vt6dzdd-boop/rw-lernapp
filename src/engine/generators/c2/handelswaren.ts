// C8 – Handelswaren: Einkauf und Verkauf, Wareneinsatz und Rohgewinn (Spezifikation docs/m7/c2.md).
// Bestandsorientiert: Anfangsbestand + Einkäufe (+ Bezugskosten − Nachlässe) − Schlussbestand lt.
// Inventur = Wareneinsatz (Aufwendungen für Handelswaren). Aufwandsorientiert: Einkäufe direkt als
// Aufwand, am Jahresende nur die Bestandsveränderung. Rohgewinn = Umsatzerlöse für Handelswaren −
// Wareneinsatz.
import { FIRMA } from '../../../config';
import { loesung, satz, zeile, type BuchungsLoesung, type ErwSatz } from '../../booking';
import { Val, dec } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, Feld, GenOptions, SolutionStep, TaskPart, TaskText } from '../../task';
import { betrag, defineGenerator, eur, feld, isExact, isKrumm, pct, retry } from '../base';

export type HwVariante = 'bestandsorientiert' | 'aufwandsorientiert' | 'laufende-buchungen';

export interface HwParams {
  variante: HwVariante;
  /** z. B. „Weißwein „Liboriwein““ */
  ware: string;
  lieferant: string;
  kunde: string;
  /** Anfangsbestand (bestands-/aufwandsorientiert) */
  ab: string;
  /** Einkäufe netto im Jahr bzw. Einkauf netto (laufende Buchungen) */
  einkauf: string;
  /** Bezugskosten für Handelswaren (nur bestandsorientiert, „0“ = keine) */
  bezugskosten: string;
  /** Nachlässe für Handelswaren (nur bestandsorientiert, „0“ = keine) */
  nachlaesse: string;
  /** Schlussbestand lt. Inventur */
  sb: string;
  /** Umsatzerlöse für Handelswaren netto (Jahr bzw. einzelner Verkauf) */
  umsatz: string;
  ustSatz: string;
}

export interface HwSolution {
  wareneinsatz: Val;
  rohgewinn: Val;
  /** SB − AB (positiv = Mehrbestand) */
  bestandsveraenderung: Val;
  abschluss: BuchungsLoesung;
  einkauf: BuchungsLoesung;
  verkauf: BuchungsLoesung;
  vstEinkauf: Val;
  ustVerkauf: Val;
}

interface Weg {
  /** Wareneinsatz = Einkäufe, Bestände ignoriert */
  einkaufAlsEinsatz?: boolean;
  /** AB und SB in der Rechnung vertauscht */
  bestaendeVertauscht?: boolean;
  /** Bezugskosten und Nachlässe nicht umgebucht */
  unterkontenVergessen?: boolean;
  /** Mehr- und Minderbestand verwechselt (aufwandsorientiert) */
  mehrMinderVertauscht?: boolean;
  /** laufende Buchungen */
  einkaufAlsAufwand?: boolean;
  erloeseEigene?: boolean;
  verkaufUeberWarenkonto?: boolean;
  steuerVertauscht?: boolean;
}

const HW = 'Handelswaren';
const AUFWAND = 'Aufwendungen für Handelswaren';

export function solveHw(p: HwParams, w: Weg = {}): HwSolution {
  const ab = new Val(p.ab);
  const sb = new Val(p.sb);
  const einkauf = new Val(p.einkauf);
  const bzk = w.unterkontenVergessen ? new Val(0) : new Val(p.bezugskosten);
  const nl = w.unterkontenVergessen ? new Val(0) : new Val(p.nachlaesse);
  const bv = sb.minus(ab);
  let wareneinsatz: Val;
  if (w.einkaufAlsEinsatz) wareneinsatz = einkauf.plus(bzk).minus(nl);
  else if (w.bestaendeVertauscht) wareneinsatz = sb.plus(einkauf).plus(bzk).minus(nl).minus(ab);
  else if (w.mehrMinderVertauscht) wareneinsatz = einkauf.plus(bv);
  else wareneinsatz = ab.plus(einkauf).plus(bzk).minus(nl).minus(sb);
  const rohgewinn = new Val(p.umsatz).minus(wareneinsatz);

  const saetze: ErwSatz[] = [];
  if (p.variante === 'bestandsorientiert') {
    if (!bzk.exact.isZero())
      saetze.push(
        satz([zeile(HW, bzk)], [zeile('Bezugskosten für Handelswaren', bzk)], 'Umbuchung'),
      );
    if (!nl.exact.isZero())
      saetze.push(satz([zeile('Nachlässe für Handelswaren', nl)], [zeile(HW, nl)], 'Umbuchung'));
    saetze.push(
      satz([zeile('Schlussbilanzkonto', sb)], [zeile(HW, sb)], 'Schlussbestand'),
      satz([zeile(AUFWAND, wareneinsatz)], [zeile(HW, wareneinsatz)], 'Wareneinsatz'),
    );
  } else if (p.variante === 'aufwandsorientiert') {
    const mehr = bv.exact.isPositive() !== Boolean(w.mehrMinderVertauscht);
    const betragBv = bv.abs();
    if (w.einkaufAlsEinsatz) {
      // keine Bestandsveränderung gebucht
    } else if (mehr) {
      saetze.push(satz([zeile(HW, betragBv)], [zeile(AUFWAND, betragBv)], 'Mehrbestand'));
    } else {
      saetze.push(satz([zeile(AUFWAND, betragBv)], [zeile(HW, betragBv)], 'Minderbestand'));
    }
    saetze.push(satz([zeile('Schlussbilanzkonto', sb)], [zeile(HW, sb)], 'Schlussbestand'));
  }

  const u = dec(p.ustSatz);
  const vstEinkauf = einkauf.times(u).fix();
  const ustVerkauf = new Val(p.umsatz).times(u).fix();
  const vst = w.steuerVertauscht ? 'Umsatzsteuer' : 'Vorsteuer';
  const ust = w.steuerVertauscht ? 'Vorsteuer' : 'Umsatzsteuer';
  const einkaufSatz = satz(
    [zeile(w.einkaufAlsAufwand ? AUFWAND : HW, einkauf), zeile(vst, vstEinkauf)],
    [zeile('Verbindlichkeiten aus Lieferungen und Leistungen', einkauf.plus(vstEinkauf))],
    'Einkauf',
  );
  const erloesKonto = w.verkaufUeberWarenkonto
    ? HW
    : w.erloeseEigene
      ? 'Umsatzerlöse für eigene Erzeugnisse'
      : 'Umsatzerlöse für Handelswaren';
  const verkaufSatz = satz(
    [zeile('Forderungen aus Lieferungen und Leistungen', new Val(p.umsatz).plus(ustVerkauf))],
    [zeile(erloesKonto, p.umsatz), zeile(ust, ustVerkauf)],
    'Verkauf',
  );
  return {
    wareneinsatz,
    rohgewinn,
    bestandsveraenderung: bv,
    abschluss: loesung(saetze),
    einkauf: loesung([einkaufSatz]),
    verkauf: loesung([verkaufSatz]),
    vstEinkauf,
    ustVerkauf,
  };
}

export function hwParts(p: HwParams, s: HwSolution): TaskPart[] {
  if (p.variante === 'laufende-buchungen') {
    return [
      { typ: 'buchungssatz', id: 'einkauf', titel: 'Buchungssatz: Einkauf', loesung: s.einkauf },
      { typ: 'buchungssatz', id: 'verkauf', titel: 'Buchungssatz: Verkauf', loesung: s.verkauf },
    ];
  }
  const felder: Feld[] = [];
  if (p.variante === 'aufwandsorientiert') {
    felder.push(
      {
        typ: 'auswahl',
        id: 'art',
        label: 'Art der Bestandsveränderung',
        optionen: ['Mehrbestand', 'Minderbestand'],
        soll: s.bestandsveraenderung.exact.isPositive() ? 'Mehrbestand' : 'Minderbestand',
      },
      feld('bv', 'Höhe der Bestandsveränderung', s.bestandsveraenderung.abs()),
    );
  }
  felder.push(
    feld('wareneinsatz', 'Wareneinsatz (Aufwendungen für Handelswaren)', s.wareneinsatz),
    feld('rohgewinn', 'Rohgewinn', s.rohgewinn),
  );
  return [
    { typ: 'rechenkette', id: 'rechnung', titel: 'Wareneinsatz und Rohgewinn', felder },
    {
      typ: 'buchungssatz',
      id: 'abschluss',
      titel:
        p.variante === 'bestandsorientiert'
          ? 'Abschlussbuchungen für das Konto Handelswaren'
          : 'Buchungen am Jahresende',
      loesung: s.abschluss,
    },
  ];
}

const WAREN = [
  { ware: 'Weißwein „Liboriwein“', lieferant: 0 },
  { ware: 'Vodka „Domkreuz Vodka“', lieferant: 1 },
];

function generate(rng: Rng, opts: GenOptions = {}): HwParams {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const variante =
    (opts.variant as HwVariante | undefined) ??
    rng.pick<HwVariante>(['bestandsorientiert', 'aufwandsorientiert', 'laufende-buchungen']);
  const w = rng.pick(WAREN);
  const base = {
    variante,
    ware: w.ware,
    lieferant: FIRMA.lieferanten.handelswaren[w.lieferant]!,
    kunde: rng.pick(FIRMA.kunden),
    ustSatz: '0.19',
  };
  if (variante === 'laufende-buchungen') {
    return retry(
      rng,
      (r): HwParams => ({
        ...base,
        ab: '0',
        einkauf: betrag(r, 1_000, 30_000, 100, krumm),
        bezugskosten: '0',
        nachlaesse: '0',
        sb: '0',
        umsatz: betrag(r, 1_000, 40_000, 100, krumm),
      }),
      (p) =>
        krumm ||
        (isExact(dec(p.einkauf).times(p.ustSatz)) && isExact(dec(p.umsatz).times(p.ustSatz))),
    );
  }
  return retry(
    rng,
    (r): HwParams => {
      const ab = betrag(r, 5_000, 40_000, 500, krumm);
      const einkauf = betrag(r, 20_000, 150_000, 1_000, krumm);
      const mitBzk = variante === 'bestandsorientiert' && r.chance(0.6);
      const mitNl = variante === 'bestandsorientiert' && r.chance(0.5);
      const sb = betrag(r, 5_000, 40_000, 500, krumm);
      const p: HwParams = {
        ...base,
        ab,
        einkauf,
        bezugskosten: mitBzk ? betrag(r, 300, 4_000, 50, krumm) : '0',
        nachlaesse: mitNl ? betrag(r, 200, 3_000, 50, krumm) : '0',
        sb,
        umsatz: '0',
      };
      const we = solveHw(p).wareneinsatz;
      // Aufschlag 20–80 % auf den Wareneinsatz, gerundet auf 100 € bzw. Cent (krumm)
      const aufschlag = dec(r.step(20, 80, 5))
        .div(100)
        .plus(1);
      const umsatz = we.exact.times(aufschlag);
      p.umsatz = krumm
        ? umsatz.toDecimalPlaces(2).toFixed(2)
        : umsatz.div(100).toDecimalPlaces(0).times(100).toFixed(2);
      return p;
    },
    (p) => {
      const s = solveHw(p);
      return !dec(p.ab).equals(p.sb) && s.wareneinsatz.exact.gt(0) && s.rohgewinn.exact.gt(0);
    },
  );
}

function render(p: HwParams): TaskText {
  if (p.variante === 'laufende-buchungen') {
    const u = pct(p.ustSatz);
    return {
      titel: 'Handelswaren einkaufen und verkaufen',
      kontext: 'März: Zukauf von Wein und Vodka',
      sachverhalt: [
        `Neben eigenen Getränken verkauft die MBG zugekaufte Handelswaren. Sie erfasst den Einkauf bestandsorientiert.`,
        `1. ${p.lieferant} liefert ${p.ware} auf Ziel: ${eur(p.einkauf)} netto zuzüglich ${u} Umsatzsteuer.`,
        `2. Die MBG verkauft ${p.ware} unverändert auf Ziel an ${p.kunde}: ${eur(p.umsatz)} netto zuzüglich ${u} Umsatzsteuer.`,
      ],
      aufgabe: 'Bilde die Buchungssätze für den Einkauf und für den Verkauf.',
    };
  }
  const zeilen: string[][] = [
    ['Anfangsbestand Handelswaren', eur(p.ab)],
    [
      p.variante === 'bestandsorientiert'
        ? 'Einkäufe (Konto Handelswaren)'
        : 'Einkäufe (Konto Aufwendungen für Handelswaren)',
      eur(p.einkauf),
    ],
  ];
  if (!dec(p.bezugskosten).isZero())
    zeilen.push(['Bezugskosten für Handelswaren', eur(p.bezugskosten)]);
  if (!dec(p.nachlaesse).isZero()) zeilen.push(['Nachlässe für Handelswaren', eur(p.nachlaesse)]);
  zeilen.push(
    ['Schlussbestand lt. Inventur', eur(p.sb)],
    ['Umsatzerlöse für Handelswaren', eur(p.umsatz)],
  );
  return {
    titel: 'Wareneinsatz und Rohgewinn',
    kontext: 'Dezember: Inventur der Handelswaren',
    sachverhalt: [
      p.variante === 'bestandsorientiert'
        ? `Die MBG erfasst den Einkauf von ${p.ware} bestandsorientiert auf dem Konto Handelswaren. Zum Jahresende liegen folgende Werte vor (netto):`
        : `Die MBG bucht den Einkauf von ${p.ware} aufwandsorientiert direkt auf das Konto Aufwendungen für Handelswaren. Zum Jahresende liegen folgende Werte vor (netto):`,
    ],
    daten: { spalten: ['Position', 'Betrag'], zeilen },
    aufgabe:
      p.variante === 'bestandsorientiert'
        ? 'Ermittle Wareneinsatz und Rohgewinn und bilde die Abschlussbuchungen für das Konto Handelswaren (einschließlich der Umbuchung der Unterkonten).'
        : 'Ermittle die Bestandsveränderung, den Wareneinsatz und den Rohgewinn und bilde die Buchungen am Jahresende für das Konto Handelswaren.',
  };
}

function steps(p: HwParams, s: HwSolution): SolutionStep[] {
  if (p.variante === 'laufende-buchungen') {
    return [
      {
        titel: 'Einkauf',
        rechnung: `${eur(p.einkauf)} × ${pct(p.ustSatz)} = ${eur(s.vstEinkauf)} Vorsteuer`,
        erlaeuterung:
          'Bestandsorientiert: Der Einkauf erhöht das Bestandskonto Handelswaren im Soll.',
      },
      {
        titel: 'Verkauf',
        rechnung: `${eur(p.umsatz)} × ${pct(p.ustSatz)} = ${eur(s.ustVerkauf)} Umsatzsteuer`,
        erlaeuterung:
          'Der Verkaufserlös gehört auf Umsatzerlöse für Handelswaren – getrennt von den eigenen Erzeugnissen. Das Warenkonto bleibt unberührt; den Verbrauch zeigt erst die Inventur.',
      },
    ];
  }
  const bzk = dec(p.bezugskosten).isZero() ? '' : ` + ${eur(p.bezugskosten)}`;
  const nl = dec(p.nachlaesse).isZero() ? '' : ` − ${eur(p.nachlaesse)}`;
  const out: SolutionStep[] = [];
  if (p.variante === 'aufwandsorientiert') {
    const mehr = s.bestandsveraenderung.exact.isPositive();
    out.push(
      {
        titel: mehr ? 'Mehrbestand' : 'Minderbestand',
        rechnung: `${eur(p.sb)} − ${eur(p.ab)} = ${eur(s.bestandsveraenderung)}`,
        erlaeuterung: mehr
          ? 'Es wurde mehr eingekauft als verkauft. Der Mehrbestand mindert den Aufwand: Handelswaren an Aufwendungen für Handelswaren.'
          : 'Es wurde zusätzlich Ware aus dem Lager verkauft. Der Minderbestand erhöht den Aufwand: Aufwendungen für Handelswaren an Handelswaren.',
      },
      {
        titel: 'Wareneinsatz',
        rechnung: mehr
          ? `${eur(p.einkauf)} − ${eur(s.bestandsveraenderung.abs())} = ${eur(s.wareneinsatz)}`
          : `${eur(p.einkauf)} + ${eur(s.bestandsveraenderung.abs())} = ${eur(s.wareneinsatz)}`,
      },
    );
  } else {
    out.push({
      titel: 'Wareneinsatz',
      rechnung: `${eur(p.ab)} + ${eur(p.einkauf)}${bzk}${nl} − ${eur(p.sb)} = ${eur(s.wareneinsatz)}`,
      erlaeuterung:
        'Anfangsbestand plus Zugänge minus Schlussbestand lt. Inventur. Bezugskosten und Nachlässe werden vorher auf das Konto Handelswaren umgebucht.',
    });
  }
  out.push({
    titel: 'Rohgewinn',
    rechnung: `${eur(p.umsatz)} − ${eur(s.wareneinsatz)} = ${eur(s.rohgewinn)}`,
    erlaeuterung: 'Umsatzerlöse für Handelswaren minus Wareneinsatz.',
  });
  return out;
}

function hints(p: HwParams): [string, string, string] {
  if (p.variante === 'laufende-buchungen') {
    return [
      'Handelswaren werden ohne Be- oder Verarbeitung weiterverkauft. Für sie gibt es eigene Konten.',
      'Bestandsorientiert: Einkauf auf das Konto Handelswaren, Verkauf auf Umsatzerlöse für Handelswaren.',
      'Einkauf: Handelswaren, Vorsteuer an Verbindlichkeiten a. LL. Verkauf: Forderungen a. LL an Umsatzerlöse für Handelswaren, an Umsatzsteuer.',
    ];
  }
  if (p.variante === 'aufwandsorientiert') {
    return [
      'Aufwandsorientiert stehen die Einkäufe schon im Aufwand. Am Jahresende wird nur noch die Bestandsveränderung gebucht.',
      'Schlussbestand größer als Anfangsbestand = Mehrbestand (mindert den Aufwand), sonst Minderbestand (erhöht ihn).',
      'Wareneinsatz = Einkäufe − Mehrbestand bzw. + Minderbestand. Rohgewinn = Umsatzerlöse für Handelswaren − Wareneinsatz.',
    ];
  }
  return [
    'Wareneinsatz = Anfangsbestand + Einkäufe (+ Bezugskosten − Nachlässe) − Schlussbestand lt. Inventur.',
    'Zuerst die Unterkonten auf Handelswaren umbuchen, dann Schlussbestand an SBK, der Rest ist der Wareneinsatz.',
    'Schlussbilanzkonto an Handelswaren; Aufwendungen für Handelswaren an Handelswaren. Rohgewinn = Umsatzerlöse − Wareneinsatz.',
  ];
}

function errorVariants(p: HwParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Weg) =>
    out.push({ fehlertyp, parts: hwParts(p, solveHw(p, w)) });
  if (p.variante === 'laufende-buchungen') {
    add('handelswaren-als-aufwand', { einkaufAlsAufwand: true });
    add('handelswaren-erloese-eigene-erzeugnisse', { erloeseEigene: true });
    add('handelswaren-verkauf-ueber-warenkonto', { verkaufUeberWarenkonto: true });
    add('steuer-falsches-konto', { steuerVertauscht: true });
    return out;
  }
  add('handelswaren-wareneinsatz-gleich-einkauf', { einkaufAlsEinsatz: true });
  if (p.variante === 'bestandsorientiert') {
    add('handelswaren-bestaende-vertauscht', { bestaendeVertauscht: true });
    if (!dec(p.bezugskosten).isZero() || !dec(p.nachlaesse).isZero())
      add('handelswaren-unterkonten-vergessen', { unterkontenVergessen: true });
  } else {
    add('handelswaren-mehr-minder-vertauscht', { mehrMinderVertauscht: true });
  }
  return out;
}

export const handelswaren = defineGenerator<HwParams, HwSolution>({
  skillId: 'C8-handelswaren',
  titel: 'Handelswaren',
  variants: ['bestandsorientiert', 'aufwandsorientiert', 'laufende-buchungen'],
  points: 5,
  generate,
  render: (p) => render(p),
  solve: (p) => solveHw(p),
  parts: hwParts,
  steps,
  hints: (p) => hints(p),
  errorVariants,
  verfahren: (p) =>
    p.variante === 'laufende-buchungen'
      ? 'Handelswaren: Einkauf auf Warenkonto, Verkauf auf Umsatzerlöse für Handelswaren'
      : 'Handelswaren: Wareneinsatz per Inventur, Rohgewinn = Umsatzerlöse − Wareneinsatz',
});
