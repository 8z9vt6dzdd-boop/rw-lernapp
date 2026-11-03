// C1 – Bestandsorientierte und aufwandsorientierte Erfassung des Werkstoffeinkaufs,
// Verbrauchsbuchung (Lehrbrief BA 3.1.1, 3.1.2 und 3.1.5; Spezifikation in docs/m7/c1.md).
import { aufwandKonto, type Stoff } from '../../accounts';
import { loesung, satz, zeile, type BuchungsLoesung, type ErwSatz } from '../../booking';
import { Val, sum } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, GenOptions, SolutionStep, TaskPart, TaskText } from '../../task';
import { FIRMA } from '../../../config';
import { betrag, defineGenerator, eur, feld, isKrumm, pct, retry } from '../base';
import { einkaufsKonto, KONTEXT_C, steuerAuf, waehleStoff, type Erfassung } from './common';

export type C1Variante = 'einkauf' | 'entnahme' | 'inventur-bestand' | 'inventur-aufwand';

export interface C1Params {
  variante: C1Variante;
  erfassung: Erfassung;
  stoff: Stoff;
  gegenstand: string;
  partner: string;
  ustSatz: string;
  /** einkauf: Nettowert der Lieferung */
  netto: string;
  /** Anfangsbestand laut Eröffnungsbilanz (entnahme, inventur-*) */
  ab: string;
  /** Einkäufe der Periode, netto (entnahme, inventur-*) */
  zugaenge: string[];
  /** Materialentnahmescheine (entnahme) */
  entnahmen: string[];
  /** Schlussbestand laut Inventur (inventur-*) */
  sb: string;
  vorlage: number;
}

export interface C1Solution {
  vorsteuer: Val;
  rechnung: Val;
  zugaenge: Val;
  entnahmen: Val;
  buchbestand: Val;
  /** Verbrauch (Aufwand) der Periode */
  verbrauch: Val;
  /** Schlussbestand − Anfangsbestand (positiv = Mehrbestand) */
  delta: Val;
  buchung: BuchungsLoesung;
}

const VERB = 'Verbindlichkeiten aus Lieferungen und Leistungen';
const SBK = 'Schlussbilanzkonto';
const MEHR = 'Mehrbestand';
const MINDER = 'Minderbestand';

export function solveC1(p: C1Params): C1Solution {
  const netto = new Val(p.netto);
  const vorsteuer = steuerAuf(netto, p.ustSatz);
  const rechnung = netto.plus(vorsteuer);
  const ab = new Val(p.ab);
  const sb = new Val(p.sb);
  const zugaenge = sum(p.zugaenge);
  const entnahmen = sum(p.entnahmen);
  const buchbestand = ab.plus(zugaenge).minus(entnahmen);
  const delta = sb.minus(ab);
  const aufwand = aufwandKonto(p.stoff);
  let verbrauch = new Val(0);
  let buchung: BuchungsLoesung;
  switch (p.variante) {
    case 'einkauf':
      buchung = loesung([
        satz(
          [zeile(einkaufsKonto(p.stoff, p.erfassung), netto), zeile('Vorsteuer', vorsteuer)],
          [zeile(VERB, rechnung)],
        ),
      ]);
      break;
    case 'entnahme':
      verbrauch = entnahmen;
      buchung = loesung([satz([zeile(aufwand, entnahmen)], [zeile(p.stoff, entnahmen)])]);
      break;
    case 'inventur-bestand':
      verbrauch = ab.plus(zugaenge).minus(sb);
      buchung = loesung(
        [
          satz([zeile(SBK, sb)], [zeile(p.stoff, sb)], 'Schlussbestand'),
          satz([zeile(aufwand, verbrauch)], [zeile(p.stoff, verbrauch)], 'Verbrauch'),
        ],
        true,
      );
      break;
    case 'inventur-aufwand':
      verbrauch = zugaenge.minus(delta);
      buchung = loesung(
        [
          satz([zeile(SBK, sb)], [zeile(p.stoff, sb)], 'Schlussbestand'),
          bestandsSatz(p.stoff, delta),
        ],
        true,
      );
      break;
  }
  return { vorsteuer, rechnung, zugaenge, entnahmen, buchbestand, verbrauch, delta, buchung };
}

/** Aufwandsorientiert: Mehrbestand „Stoff an Aufwand“, Minderbestand „Aufwand an Stoff“. */
function bestandsSatz(stoff: Stoff, delta: Val, umgekehrt = false): ErwSatz {
  const b = delta.abs();
  const mehr = !delta.isNegative() !== umgekehrt;
  return mehr
    ? satz([zeile(stoff, b)], [zeile(aufwandKonto(stoff), b)], 'Mehrbestand')
    : satz([zeile(aufwandKonto(stoff), b)], [zeile(stoff, b)], 'Minderbestand');
}

function c1Parts(p: C1Params, s: C1Solution): TaskPart[] {
  const buchung: TaskPart = {
    typ: 'buchungssatz',
    id: 'buchung',
    titel:
      p.variante === 'einkauf'
        ? 'Buchungssatz für die Eingangsrechnung'
        : p.variante === 'entnahme'
          ? 'Buchungssatz für die Entnahmen'
          : 'Abschlussbuchungen für das Konto ' + p.stoff,
    loesung: s.buchung,
  };
  switch (p.variante) {
    case 'einkauf':
      return [
        {
          typ: 'rechenkette',
          id: 'rechnung',
          titel: 'Rechnungsbetrag',
          felder: [
            feld('vorsteuer', 'Vorsteuer', s.vorsteuer),
            feld('rechnung', 'Rechnungsbetrag (brutto)', s.rechnung),
          ],
        },
        buchung,
      ];
    case 'entnahme':
      return [
        {
          typ: 'rechenkette',
          id: 'rechnung',
          titel: 'Verbrauch und Buchbestand',
          felder: [
            feld('entnahmen', 'Verbrauch laut Entnahmescheinen', s.entnahmen),
            feld('buchbestand', 'Buchbestand am Monatsende', s.buchbestand),
          ],
        },
        buchung,
      ];
    case 'inventur-bestand':
      return [
        {
          typ: 'rechenkette',
          id: 'rechnung',
          titel: 'Verbrauch ermitteln',
          felder: [feld('verbrauch', 'Verbrauch (Aufwand) der Periode', s.verbrauch)],
        },
        buchung,
      ];
    case 'inventur-aufwand':
      return [
        {
          typ: 'rechenkette',
          id: 'rechnung',
          titel: 'Bestandsveränderung und Aufwand',
          felder: [
            {
              typ: 'auswahl',
              id: 'richtung',
              label: 'Bestandsveränderung',
              optionen: [MEHR, MINDER],
              soll: s.delta.isNegative() ? MINDER : MEHR,
            },
            feld('delta', 'Betrag der Bestandsveränderung', s.delta.abs()),
            feld('verbrauch', 'Aufwand (Verbrauch) der Periode', s.verbrauch),
          ],
        },
        buchung,
      ];
  }
}

function generateC1(rng: Rng, opts: GenOptions = {}): C1Params {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const variante: C1Variante =
    opts.variant === 'einkauf' ||
    opts.variant === 'entnahme' ||
    opts.variant === 'inventur-bestand' ||
    opts.variant === 'inventur-aufwand'
      ? opts.variant
      : rng.pick<C1Variante>([
          'einkauf',
          'einkauf',
          'entnahme',
          'inventur-bestand',
          'inventur-bestand',
          'inventur-aufwand',
          'inventur-aufwand',
        ]);
  const erfassung: Erfassung =
    variante === 'inventur-aufwand'
      ? 'aufwand'
      : variante === 'einkauf'
        ? rng.chance(0.5)
          ? 'aufwand'
          : 'bestand'
        : 'bestand';
  const { stoff, gegenstand, partner } = waehleStoff(rng, FIRMA);
  const vorlage = rng.int(0, 1);
  const make = (r: Rng): C1Params => {
    const base: C1Params = {
      variante,
      erfassung,
      stoff,
      gegenstand,
      partner,
      ustSatz: '0.19',
      netto: '0',
      ab: '0',
      zugaenge: [],
      entnahmen: [],
      sb: '0',
      vorlage,
    };
    if (variante === 'einkauf') {
      base.netto = betrag(r, 1_000, 40_000, 100, krumm);
    } else {
      base.ab = betrag(r, 2_000, 30_000, 100, krumm);
      base.zugaenge = [betrag(r, 1_000, 25_000, 100, krumm), betrag(r, 1_000, 25_000, 100, krumm)];
      if (variante === 'entnahme') {
        base.entnahmen = [
          betrag(r, 500, 12_000, 50, krumm),
          betrag(r, 500, 12_000, 50, krumm),
          betrag(r, 500, 12_000, 50, krumm),
        ];
      } else {
        base.sb = betrag(r, 1_000, 30_000, 100, krumm);
      }
    }
    return base;
  };
  return retry(rng, make, (p) => {
    const s = solveC1(p);
    if (p.variante === 'entnahme') return s.buchbestand.cmp(500) >= 0;
    if (p.variante === 'inventur-bestand')
      return s.verbrauch.cmp(500) >= 0 && s.verbrauch.cmp(p.sb) !== 0;
    if (p.variante === 'inventur-aufwand')
      return (
        !s.delta.exact.isZero() &&
        s.verbrauch.cmp(500) >= 0 &&
        s.delta.abs().cmp(s.zugaenge) !== 0 &&
        s.verbrauch.cmp(s.zugaenge) !== 0
      );
    return true;
  });
}

function datenBestand(p: C1Params): TaskText['daten'] {
  const zeilen: string[][] = [['Anfangsbestand laut Eröffnungsbilanz (1. Februar)', eur(p.ab)]];
  p.zugaenge.forEach((z, i) =>
    zeilen.push([`Einkauf auf Ziel, Eingangsrechnung ${i + 1} (netto)`, eur(z)]),
  );
  if (p.variante === 'entnahme') {
    p.entnahmen.forEach((e, i) =>
      zeilen.push([`Materialentnahmeschein ${i + 1} (Fertigung I)`, eur(e)]),
    );
  } else {
    zeilen.push(['Schlussbestand laut Inventur (31. März)', eur(p.sb)]);
  }
  return { spalten: ['Vorgang', 'Betrag'], zeilen };
}

function renderC1(p: C1Params): TaskText {
  const titel = 'Bestands- oder aufwandsorientierte Erfassung';
  if (p.variante === 'einkauf') {
    const jit =
      p.erfassung === 'aufwand'
        ? `Die Lieferung geht ohne Zwischenlager direkt in die Produktion („Just-in-time“). Die MBG erfasst diesen Einkauf deshalb aufwandsorientiert.`
        : `Die Lieferung kommt zunächst ins Lager und wird erst nach und nach verbraucht. Die MBG erfasst diesen Einkauf bestandsorientiert.`;
    return {
      titel,
      kontext: KONTEXT_C,
      sachverhalt: [
        p.vorlage === 0
          ? `Die MBG kauft bei ${p.partner} ${p.gegenstand} auf Ziel. Der Warenwert beträgt ${eur(p.netto)} netto zuzüglich ${pct(p.ustSatz)} Umsatzsteuer.`
          : `Von ${p.partner} trifft eine Eingangsrechnung über ${p.gegenstand} ein: Warenwert ${eur(p.netto)} netto zuzüglich ${pct(p.ustSatz)} Umsatzsteuer, zahlbar in 30 Tagen.`,
        jit,
      ],
      aufgabe: 'Ermittle Vorsteuer und Rechnungsbetrag und bilde den Buchungssatz.',
    };
  }
  if (p.variante === 'entnahme') {
    return {
      titel,
      kontext: KONTEXT_C,
      sachverhalt: [
        `Die MBG erfasst ${p.gegenstand} bestandsorientiert auf dem Konto ${p.stoff}. Jede Entnahme für die Produktion wird mit einem Materialentnahmeschein belegt und einzeln als Verbrauch gebucht (Fortschreibung).`,
        'Die Einkäufe sind bereits gebucht. Für den Februar liegen folgende Werte vor:',
      ],
      daten: datenBestand(p),
      aufgabe:
        'Ermittle den Verbrauch und den Buchbestand am Monatsende und buche die Entnahmen (zusammengefasst).',
    };
  }
  if (p.variante === 'inventur-bestand') {
    return {
      titel,
      kontext: '31. März: Quartalsabschluss',
      sachverhalt: [
        `Die MBG erfasst ${p.gegenstand} bestandsorientiert: Alle Einkäufe wurden im Soll des Kontos ${p.stoff} gebucht. Entnahmen wurden nicht einzeln erfasst, der Verbrauch ergibt sich aus der Inventur.`,
        'Das Konto zeigt folgende Werte:',
      ],
      daten: datenBestand(p),
      aufgabe: `Ermittle den Verbrauch und bilde die Abschlussbuchungen für das Konto ${p.stoff} (Schlussbestand und Verbrauch).`,
    };
  }
  return {
    titel,
    kontext: '31. März: Quartalsabschluss',
    sachverhalt: [
      `Die MBG erfasst ${p.gegenstand} aufwandsorientiert: Alle Einkäufe wurden direkt auf dem Konto ${aufwandKonto(p.stoff)} gebucht. Auf dem Bestandskonto ${p.stoff} steht bisher nur der Anfangsbestand.`,
      'Es liegen folgende Werte vor:',
    ],
    daten: datenBestand(p),
    aufgabe: `Ermittle die Bestandsveränderung und den Aufwand der Periode und bilde die Abschlussbuchungen für das Konto ${p.stoff}.`,
  };
}

function c1Steps(p: C1Params, s: C1Solution): SolutionStep[] {
  const aufwand = aufwandKonto(p.stoff);
  switch (p.variante) {
    case 'einkauf':
      return [
        {
          titel: 'Erfassung erkennen',
          erlaeuterung:
            p.erfassung === 'aufwand'
              ? `Aufwandsorientiert: Der Einkauf wird sofort als Verbrauch gebucht, also auf ${aufwand}.`
              : `Bestandsorientiert: Der Einkauf erhöht den Lagerbestand, also das Konto ${p.stoff}.`,
        },
        {
          titel: 'Vorsteuer',
          rechnung: `${eur(p.netto)} × ${pct(p.ustSatz)} = ${eur(s.vorsteuer)}`,
        },
        {
          titel: 'Rechnungsbetrag',
          rechnung: `${eur(p.netto)} + ${eur(s.vorsteuer)} = ${eur(s.rechnung)}`,
        },
        {
          titel: 'Buchung',
          rechnung: `${einkaufsKonto(p.stoff, p.erfassung)} ${eur(p.netto)}, Vorsteuer ${eur(s.vorsteuer)} an Verbindlichkeiten a. LL ${eur(s.rechnung)}`,
        },
      ];
    case 'entnahme':
      return [
        {
          titel: 'Verbrauch',
          rechnung: `${p.entnahmen.map((e) => eur(e)).join(' + ')} = ${eur(s.entnahmen)}`,
          erlaeuterung: 'Bei der Fortschreibung ist der Verbrauch die Summe der Entnahmescheine.',
        },
        {
          titel: 'Buchbestand',
          rechnung: `${eur(p.ab)} + ${eur(s.zugaenge)} − ${eur(s.entnahmen)} = ${eur(s.buchbestand)}`,
          erlaeuterung: 'Anfangsbestand + Zugänge − Entnahmen = Buchbestand (Soll-Endbestand).',
        },
        {
          titel: 'Buchung',
          rechnung: `${aufwand} an ${p.stoff} ${eur(s.entnahmen)}`,
          erlaeuterung: 'Der Verbrauch ist Aufwand (Soll) und mindert den Bestand (Haben).',
        },
      ];
    case 'inventur-bestand':
      return [
        {
          titel: 'Verbrauch (Inventurmethode)',
          rechnung: `${eur(p.ab)} + ${eur(s.zugaenge)} − ${eur(p.sb)} = ${eur(s.verbrauch)}`,
          erlaeuterung: 'Anfangsbestand + Zugänge − Schlussbestand laut Inventur = Verbrauch.',
        },
        { titel: 'Schlussbestand', rechnung: `SBK an ${p.stoff} ${eur(p.sb)}` },
        {
          titel: 'Verbrauch buchen',
          rechnung: `${aufwand} an ${p.stoff} ${eur(s.verbrauch)}`,
          erlaeuterung: 'Der Saldo des Bestandskontos ist der Verbrauch und wird zu Aufwand.',
        },
      ];
    case 'inventur-aufwand': {
      const mehr = !s.delta.isNegative();
      return [
        {
          titel: 'Bestandsveränderung',
          rechnung: `${eur(p.sb)} − ${eur(p.ab)} = ${eur(s.delta)} → ${mehr ? MEHR : MINDER} ${eur(s.delta.abs())}`,
          erlaeuterung: mehr
            ? 'Es wurde mehr eingekauft als verbraucht: Ein Teil des gebuchten Aufwands liegt noch im Lager.'
            : 'Es wurde mehr verbraucht als eingekauft: Zusätzlich wurde Lagerbestand verbraucht.',
        },
        { titel: 'Schlussbestand', rechnung: `SBK an ${p.stoff} ${eur(p.sb)}` },
        {
          titel: 'Bestandsveränderung buchen',
          rechnung: mehr
            ? `${p.stoff} an ${aufwand} ${eur(s.delta.abs())}`
            : `${aufwand} an ${p.stoff} ${eur(s.delta.abs())}`,
          erlaeuterung: mehr
            ? 'Mehrbestand: Das Bestandskonto nimmt zu, der Aufwand sinkt.'
            : 'Minderbestand: Das Bestandskonto nimmt ab, der Aufwand steigt.',
        },
        {
          titel: 'Aufwand der Periode',
          rechnung: `${eur(s.zugaenge)} ${mehr ? '−' : '+'} ${eur(s.delta.abs())} = ${eur(s.verbrauch)}`,
          erlaeuterung: 'Einkäufe − Mehrbestand bzw. + Minderbestand = Verbrauch.',
        },
      ];
    }
  }
}

function c1Hints(p: C1Params, s: C1Solution): [string, string, string] {
  const aufwand = aufwandKonto(p.stoff);
  switch (p.variante) {
    case 'einkauf':
      return [
        'Lies, wie die MBG erfasst: Geht die Ware ins Lager (bestandsorientiert) oder direkt in die Produktion (aufwandsorientiert)?',
        p.erfassung === 'aufwand'
          ? `Aufwandsorientiert landet der Warenwert sofort auf ${aufwand}.`
          : `Bestandsorientiert landet der Warenwert auf dem Bestandskonto ${p.stoff}.`,
        `Soll: ${einkaufsKonto(p.stoff, p.erfassung)} ${eur(p.netto)} und Vorsteuer ${eur(s.vorsteuer)}; Haben: Verbindlichkeiten a. LL ${eur(s.rechnung)}.`,
      ];
    case 'entnahme':
      return [
        'Fortschreibung: Jeder Entnahmeschein ist ein Verbrauch. Zähle sie zusammen.',
        'Buchbestand = Anfangsbestand + Zugänge − Entnahmen.',
        `Buchung: ${aufwand} an ${p.stoff} ${eur(s.entnahmen)}.`,
      ];
    case 'inventur-bestand':
      return [
        'Inventurmethode: Der Verbrauch wurde nicht einzeln gebucht, er ergibt sich als Rest.',
        'Verbrauch = Anfangsbestand + Zugänge − Schlussbestand laut Inventur.',
        `Erst SBK an ${p.stoff} ${eur(p.sb)}, dann ${aufwand} an ${p.stoff} ${eur(s.verbrauch)}.`,
      ];
    case 'inventur-aufwand':
      return [
        'Aufwandsorientiert stehen die Einkäufe schon im Aufwand. Am Ende wird nur noch die Bestandsveränderung gebucht.',
        'Vergleiche Schlussbestand und Anfangsbestand: Ist der Schlussbestand höher, liegt ein Mehrbestand vor.',
        !s.delta.isNegative()
          ? `Mehrbestand: ${p.stoff} an ${aufwand} ${eur(s.delta.abs())}; dazu SBK an ${p.stoff} ${eur(p.sb)}.`
          : `Minderbestand: ${aufwand} an ${p.stoff} ${eur(s.delta.abs())}; dazu SBK an ${p.stoff} ${eur(p.sb)}.`,
      ];
  }
}

function c1Variants(p: C1Params): ErrorVariant[] {
  const s = solveC1(p);
  const out: ErrorVariant[] = [];
  const aufwand = aufwandKonto(p.stoff);
  const mk = (fehlertyp: string, t: Partial<C1Solution>) =>
    out.push({ fehlertyp, parts: c1Parts(p, { ...s, ...t }) });
  switch (p.variante) {
    case 'einkauf': {
      const anderes: Erfassung = p.erfassung === 'aufwand' ? 'bestand' : 'aufwand';
      mk('erfassungsmethode-verwechselt', {
        buchung: loesung([
          satz(
            [zeile(einkaufsKonto(p.stoff, anderes), p.netto), zeile('Vorsteuer', s.vorsteuer)],
            [zeile(VERB, s.rechnung)],
          ),
        ]),
      });
      mk('einkauf-ohne-vorsteuer', {
        vorsteuer: new Val(0),
        rechnung: new Val(p.netto),
        buchung: loesung([
          satz([zeile(einkaufsKonto(p.stoff, p.erfassung), p.netto)], [zeile(VERB, p.netto)]),
        ]),
      });
      break;
    }
    case 'entnahme':
      mk('anfangsbestand-vergessen', { buchbestand: s.zugaenge.minus(s.entnahmen) });
      mk('soll-haben-vertauscht', {
        buchung: loesung([satz([zeile(p.stoff, s.entnahmen)], [zeile(aufwand, s.entnahmen)])]),
      });
      break;
    case 'inventur-bestand': {
      const ohneAB = s.zugaenge.minus(p.sb);
      mk('anfangsbestand-vergessen', {
        verbrauch: ohneAB,
        ...(ohneAB.cmp(0) > 0
          ? {
              buchung: loesung(
                [
                  satz([zeile(SBK, p.sb)], [zeile(p.stoff, p.sb)]),
                  satz([zeile(aufwand, ohneAB)], [zeile(p.stoff, ohneAB)]),
                ],
                true,
              ),
            }
          : {}),
      });
      mk('schlussbestand-als-verbrauch', {
        verbrauch: new Val(p.sb),
        buchung: loesung(
          [
            satz([zeile(SBK, p.sb)], [zeile(p.stoff, p.sb)]),
            satz([zeile(aufwand, p.sb)], [zeile(p.stoff, p.sb)]),
          ],
          true,
        ),
      });
      break;
    }
    case 'inventur-aufwand':
      mk('mehr-minder-verwechselt', {
        delta: s.delta.neg(),
        verbrauch: s.zugaenge.plus(s.delta),
        buchung: loesung([
          satz([zeile(SBK, p.sb)], [zeile(p.stoff, p.sb)]),
          bestandsSatz(p.stoff, s.delta, true),
        ]),
      });
      mk('einkauf-gleich-verbrauch', { verbrauch: s.zugaenge });
      break;
  }
  return out;
}

export const bestandVsAufwand = defineGenerator<C1Params, C1Solution>({
  skillId: 'C1-bestand-vs-aufwand',
  titel: 'Bestands- und aufwandsorientierte Erfassung',
  variants: ['einkauf', 'entnahme', 'inventur-bestand', 'inventur-aufwand'],
  points: 3,
  generate: generateC1,
  render: (p) => renderC1(p),
  solve: solveC1,
  parts: c1Parts,
  steps: c1Steps,
  hints: c1Hints,
  errorVariants: c1Variants,
  verfahren: (p) =>
    p.variante === 'einkauf'
      ? 'Werkstoffeinkauf buchen: Bestandskonto oder Aufwandskonto'
      : p.variante === 'inventur-aufwand'
        ? 'Aufwandsorientierte Erfassung: Bestandsveränderung am Periodenende buchen'
        : 'Bestandsorientierte Erfassung: Verbrauch ermitteln und buchen',
});
