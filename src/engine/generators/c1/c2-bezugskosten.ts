// C2 – Bezugskosten (Anschaffungsnebenkosten) auf Unterkonten, Umbuchung, Aufteilung nach
// Gewicht und Wert (Lehrbrief BA 3.1.2; Spezifikation und Golden Cases in docs/m7/c1.md).
import { aufwandKonto, bezugskostenKonto, type Stoff } from '../../accounts';
import { loesung, satz, zeile, type BuchungsLoesung, type ErwZeile } from '../../booking';
import { Val, dec, sum } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, GenOptions, SolutionStep, TaskPart, TaskText } from '../../task';
import { FIRMA } from '../../../config';
import {
  betrag,
  defineGenerator,
  eur,
  feld,
  isExact,
  isKrumm,
  num,
  pct,
  plain,
  retry,
} from '../base';
import { GEGENSTAENDE, KONTEXT_C, steuerAuf, waehleStoff, zerlege } from './common';

export type C2Variante =
  'einkauf' | 'spedition' | 'frachtanteil' | 'aufteilung' | 'umbuchung' | 'aufwandsorientiert';

export interface Bezugsposten {
  art: string;
  /** Nettobetrag in € */
  betrag: string;
}

export interface C2Params {
  variante: C2Variante;
  stoff: Stoff;
  gegenstand: string;
  partner: string;
  ustSatz: string;
  /** Warenwert netto (einkauf, aufwandsorientiert, aufteilung: erster Stoff) */
  warenwert: string;
  /** Bezugskosten netto auf der Lieferantenrechnung (einkauf, aufwandsorientiert) bzw. Buchungen auf dem Unterkonto (umbuchung) */
  posten: Bezugsposten[];
  /** umbuchung: Gutschrift im Haben des Unterkontos (z. B. zurückgegebene Leihpaletten), sonst „0“ */
  gutschrift: string;
  /** spedition: Bruttobetrag der Speditionsrechnung */
  speditionBrutto: string;
  zahlung: 'Kasse' | 'Bank' | 'Verbindlichkeiten aus Lieferungen und Leistungen';
  /** frachtanteil: Rechnungsbetrag netto einschließlich Fracht und Anteil der Fracht (Dezimal-String) */
  rechnungNetto: string;
  anteil: string;
  /** aufteilung: zweiter Stoff, Gewichte (kg) und Spesen */
  zweiterStoff: Stoff;
  zweiterGegenstand: string;
  zweiterWarenwert: string;
  kgErster: number;
  kgZweiter: number;
  fracht: string;
  versicherung: string;
  vorlage: number;
}

export interface C2Solution {
  /** Bezugskosten netto gesamt (bzw. Saldo des Unterkontos) */
  bezugskosten: Val;
  warenwert: Val;
  vorsteuer: Val;
  rechnung: Val;
  /** aufteilung */
  frachtErster: Val;
  frachtZweiter: Val;
  versErster: Val;
  versZweiter: Val;
  bezugErster: Val;
  bezugZweiter: Val;
  buchung: BuchungsLoesung;
}

const VERB = 'Verbindlichkeiten aus Lieferungen und Leistungen';

interface Rechenweg {
  /** Vorsteuer nur auf den Warenwert */
  ohneSteuerAufBezug?: boolean;
  /** Fracht nach Wert und Versicherung nach Gewicht verteilen */
  schluesselVertauscht?: boolean;
  /** Gutschrift im Haben des Unterkontos nicht abziehen */
  ohneGutschrift?: boolean;
}

function anteilig(gesamt: Val, teil: Val | number, summe: Val | number): Val {
  return gesamt.times(Val.of(teil)).div(Val.of(summe)).fix();
}

export function rechneC2(p: C2Params, w: Rechenweg = {}) {
  const u = p.ustSatz;
  const null0 = new Val(0);
  let bezugskosten = null0;
  let warenwert = new Val(p.warenwert);
  let vorsteuer = null0;
  let rechnung = null0;
  let frachtErster = null0;
  let frachtZweiter = null0;
  let versErster = null0;
  let versZweiter = null0;
  switch (p.variante) {
    case 'einkauf':
    case 'aufwandsorientiert':
      bezugskosten = sum(p.posten.map((x) => x.betrag));
      vorsteuer = steuerAuf(w.ohneSteuerAufBezug ? warenwert : warenwert.plus(bezugskosten), u);
      rechnung = warenwert.plus(bezugskosten).plus(vorsteuer);
      break;
    case 'spedition': {
      rechnung = new Val(p.speditionBrutto);
      const z = zerlege(rechnung, u);
      bezugskosten = z.netto;
      vorsteuer = z.steuer;
      warenwert = null0;
      break;
    }
    case 'frachtanteil': {
      const n = new Val(p.rechnungNetto);
      bezugskosten = n.times(dec(p.anteil)).fix();
      warenwert = n.minus(bezugskosten);
      vorsteuer = steuerAuf(n, u);
      rechnung = n.plus(vorsteuer);
      break;
    }
    case 'aufteilung': {
      const f = new Val(p.fracht);
      const v = new Val(p.versicherung);
      const wSumme = new Val(p.warenwert).plus(p.zweiterWarenwert);
      const kgSumme = p.kgErster + p.kgZweiter;
      if (w.schluesselVertauscht) {
        frachtErster = anteilig(f, new Val(p.warenwert), wSumme);
        versErster = anteilig(v, p.kgErster, kgSumme);
      } else {
        frachtErster = anteilig(f, p.kgErster, kgSumme);
        versErster = anteilig(v, new Val(p.warenwert), wSumme);
      }
      frachtZweiter = f.minus(frachtErster);
      versZweiter = v.minus(versErster);
      bezugskosten = f.plus(v);
      vorsteuer = steuerAuf(bezugskosten, u);
      rechnung = bezugskosten.plus(vorsteuer);
      break;
    }
    case 'umbuchung':
      bezugskosten = sum(p.posten.map((x) => x.betrag)).minus(
        w.ohneGutschrift ? 0 : new Val(p.gutschrift),
      );
      break;
  }
  return {
    bezugskosten,
    warenwert,
    vorsteuer,
    rechnung,
    frachtErster,
    frachtZweiter,
    versErster,
    versZweiter,
    bezugErster: frachtErster.plus(versErster),
    bezugZweiter: frachtZweiter.plus(versZweiter),
  };
}

type Werte = ReturnType<typeof rechneC2>;

interface Kontenwahl {
  /** Konto für die Bezugskosten (Standard: Unterkonto des Stoffes) */
  bezugKonto?: string;
  /** Bezugskosten mit auf das Stoffkonto statt aufs Unterkonto */
  aufStoffkonto?: boolean;
  /** aufwandsorientiert: Bestandskonten statt Aufwandskonto */
  bestandStattAufwand?: boolean;
  /** Bezugskosten brutto ohne Vorsteuer (Speditionsrechnung) */
  bruttoOhneSteuer?: boolean;
  /** frachtanteil: Fracht nicht herausgerechnet */
  ohneAnteil?: boolean;
  /** umbuchung in falscher Richtung */
  umbuchungUmgekehrt?: boolean;
}

function buchungC2(p: C2Params, v: Werte, k: Kontenwahl = {}): BuchungsLoesung {
  const bezug = k.bezugKonto ?? bezugskostenKonto(p.stoff);
  switch (p.variante) {
    case 'einkauf':
    case 'frachtanteil': {
      const soll: ErwZeile[] =
        k.aufStoffkonto || k.ohneAnteil
          ? [zeile(p.stoff, v.warenwert.plus(v.bezugskosten))]
          : [zeile(p.stoff, v.warenwert), zeile(bezug, v.bezugskosten)];
      soll.push(zeile('Vorsteuer', v.vorsteuer));
      return loesung([satz(soll, [zeile(VERB, v.rechnung)])]);
    }
    case 'aufwandsorientiert': {
      const soll: ErwZeile[] = k.bestandStattAufwand
        ? [zeile(p.stoff, v.warenwert), zeile(bezugskostenKonto(p.stoff), v.bezugskosten)]
        : [zeile(aufwandKonto(p.stoff), v.warenwert.plus(v.bezugskosten))];
      soll.push(zeile('Vorsteuer', v.vorsteuer));
      return loesung([satz(soll, [zeile(VERB, v.rechnung)])]);
    }
    case 'spedition':
      return loesung([
        satz(
          k.bruttoOhneSteuer
            ? [zeile(bezug, v.rechnung)]
            : [zeile(bezug, v.bezugskosten), zeile('Vorsteuer', v.vorsteuer)],
          [zeile(p.zahlung, v.rechnung)],
        ),
      ]);
    case 'aufteilung':
      return loesung([
        satz(
          [
            zeile(bezugskostenKonto(p.stoff), v.bezugErster),
            zeile(bezugskostenKonto(p.zweiterStoff), v.bezugZweiter),
            zeile('Vorsteuer', v.vorsteuer),
          ],
          [zeile(VERB, v.rechnung)],
        ),
      ]);
    case 'umbuchung':
      return loesung([
        k.umbuchungUmgekehrt
          ? satz([zeile(bezug, v.bezugskosten)], [zeile(p.stoff, v.bezugskosten)])
          : satz([zeile(p.stoff, v.bezugskosten)], [zeile(bezug, v.bezugskosten)], 'Umbuchung'),
      ]);
  }
}

export function solveC2(p: C2Params): C2Solution {
  const v = rechneC2(p);
  return { ...v, buchung: buchungC2(p, v) };
}

function c2Parts(p: C2Params, s: C2Solution): TaskPart[] {
  const buchung: TaskPart = {
    typ: 'buchungssatz',
    id: 'buchung',
    titel:
      p.variante === 'umbuchung'
        ? 'Umbuchung am Periodenende'
        : p.variante === 'spedition' || p.variante === 'aufteilung'
          ? 'Buchungssatz für die Speditionsrechnung'
          : 'Buchungssatz für die Eingangsrechnung',
    loesung: s.buchung,
  };
  switch (p.variante) {
    case 'einkauf':
    case 'aufwandsorientiert':
      return [
        {
          typ: 'rechenkette',
          id: 'rechnung',
          titel: 'Rechnung aufbereiten',
          felder: [
            feld('bezugskosten', 'Bezugskosten netto', s.bezugskosten),
            feld('vorsteuer', 'Vorsteuer', s.vorsteuer),
            feld('rechnung', 'Rechnungsbetrag (brutto)', s.rechnung),
          ],
        },
        buchung,
      ];
    case 'spedition':
      return [
        {
          typ: 'rechenkette',
          id: 'rechnung',
          titel: 'Speditionsrechnung zerlegen',
          felder: [
            feld('bezugskosten', 'Bezugskosten netto', s.bezugskosten),
            feld('vorsteuer', 'Vorsteuer', s.vorsteuer),
          ],
        },
        buchung,
      ];
    case 'frachtanteil':
      return [
        {
          typ: 'rechenkette',
          id: 'rechnung',
          titel: 'Fracht herausrechnen',
          felder: [
            feld('bezugskosten', 'Frachtanteil (Bezugskosten) netto', s.bezugskosten),
            feld('warenwert', 'Warenwert netto', s.warenwert),
            feld('vorsteuer', 'Vorsteuer', s.vorsteuer),
          ],
        },
        buchung,
      ];
    case 'aufteilung':
      return [
        {
          typ: 'rechenkette',
          id: 'rechnung',
          titel: 'Spesen verteilen',
          felder: [
            feld('fracht-1', `Fracht für ${p.gegenstand}`, s.frachtErster),
            feld('fracht-2', `Fracht für ${p.zweiterGegenstand}`, s.frachtZweiter),
            feld('vers-1', `Versicherung für ${p.gegenstand}`, s.versErster),
            feld('vers-2', `Versicherung für ${p.zweiterGegenstand}`, s.versZweiter),
          ],
        },
        buchung,
      ];
    case 'umbuchung':
      return [
        {
          typ: 'tkonto',
          id: 'konto',
          titel: 'Saldo des Unterkontos',
          konto: bezugskostenKonto(p.stoff),
          soll: p.posten.map((x) => ({ text: x.art, betrag: dec(x.betrag).toFixed(2) })),
          haben: dec(p.gutschrift).isZero()
            ? []
            : [{ text: 'Gutschrift Leihpaletten', betrag: dec(p.gutschrift).toFixed(2) }],
          felder: [feld('saldo', 'Saldo (umzubuchender Betrag)', s.bezugskosten)],
        },
        buchung,
      ];
  }
}

const POSTEN_ARTEN = ['Fracht', 'Verpackung', 'Transportversicherung', 'Rollgeld (Hausfracht)'];
const PAARE: [Stoff, Stoff][] = [
  ['Rohstoffe', 'Hilfsstoffe'],
  ['Rohstoffe', 'Betriebsstoffe'],
  ['Hilfsstoffe', 'Betriebsstoffe'],
];

function generateC2(rng: Rng, opts: GenOptions = {}): C2Params {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const alle: C2Variante[] = [
    'einkauf',
    'spedition',
    'frachtanteil',
    'aufteilung',
    'umbuchung',
    'aufwandsorientiert',
  ];
  const variante: C2Variante = alle.includes(opts.variant as C2Variante)
    ? (opts.variant as C2Variante)
    : rng.pick<C2Variante>([
        'einkauf',
        'einkauf',
        'spedition',
        'spedition',
        'frachtanteil',
        'aufteilung',
        'umbuchung',
        'aufwandsorientiert',
      ]);
  let { stoff, gegenstand, partner } = waehleStoff(
    rng,
    FIRMA,
    variante === 'aufwandsorientiert'
      ? ['Rohstoffe', 'Hilfsstoffe', 'Vorprodukte und Fremdbauteile']
      : undefined,
  );
  let zweiterStoff: Stoff = 'Hilfsstoffe';
  let zweiterGegenstand = '';
  if (variante === 'aufteilung') {
    const paar = rng.pick(PAARE);
    stoff = paar[0];
    zweiterStoff = paar[1];
    gegenstand = rng.pick(GEGENSTAENDE[stoff]).name;
    zweiterGegenstand = rng.pick(GEGENSTAENDE[zweiterStoff]).name;
    partner = 'eine Spedition';
  }
  const zahlung = rng.pick(['Kasse', 'Bank', VERB] as const);
  const vorlage = rng.int(0, 1);
  const make = (r: Rng): C2Params => {
    const arten = r.shuffle(POSTEN_ARTEN);
    const anzahl = variante === 'umbuchung' ? r.int(2, 3) : r.int(1, 2);
    const posten = arten.slice(0, anzahl).map((art) => ({
      art,
      betrag: betrag(r, 100, variante === 'umbuchung' ? 3_000 : 1_500, 10, krumm),
    }));
    const p: C2Params = {
      variante,
      stoff,
      gegenstand,
      partner,
      ustSatz: '0.19',
      warenwert: betrag(r, 2_000, 40_000, 100, krumm),
      posten,
      gutschrift: variante === 'umbuchung' && r.chance(0.3) ? String(r.step(50, 300, 10)) : '0',
      speditionBrutto: krumm
        ? betrag(r, 100, 3_000, 1, true)
        : dec(r.step(100, 2_500, 10))
            .times('1.19')
            .toFixed(2),
      zahlung,
      rechnungNetto: betrag(r, 2_000, 40_000, 100, krumm),
      anteil: r.pick(['0.05', '0.1', '0.15', '0.2']),
      zweiterStoff,
      zweiterGegenstand,
      zweiterWarenwert: betrag(r, 1_000, 20_000, 100, krumm),
      kgErster: r.step(1_000, 12_000, 500),
      kgZweiter: r.step(500, 8_000, 500),
      fracht: betrag(r, 300, 3_000, 10, krumm),
      versicherung: betrag(r, 50, 800, 10, krumm),
      vorlage,
    };
    if (variante === 'aufteilung') p.warenwert = betrag(r, 2_000, 30_000, 100, krumm);
    return p;
  };
  return retry(rng, make, (p) => {
    const v = rechneC2(p);
    if (p.variante === 'umbuchung') return v.bezugskosten.cmp(0) > 0;
    if (krumm) return true;
    if (p.variante === 'frachtanteil') return isExact(dec(p.rechnungNetto).times(p.anteil));
    if (p.variante === 'aufteilung') {
      const f = dec(p.fracht)
        .times(p.kgErster)
        .div(p.kgErster + p.kgZweiter);
      const w = dec(p.versicherung)
        .times(p.warenwert)
        .div(dec(p.warenwert).plus(p.zweiterWarenwert));
      const wf = dec(p.fracht).times(p.warenwert).div(dec(p.warenwert).plus(p.zweiterWarenwert));
      // Glatte Anteile; Gewichts- und Wertschlüssel müssen sich unterscheiden (sonst kein Fehler erkennbar).
      return isExact(f) && isExact(w) && !f.equals(wf);
    }
    return true;
  });
}

function renderC2(p: C2Params): TaskText {
  const titel = 'Bezugskosten';
  const u = pct(p.ustSatz);
  switch (p.variante) {
    case 'einkauf':
    case 'aufwandsorientiert': {
      const zeilen: string[][] = [
        [`${p.gegenstand}, Warenwert netto`, eur(p.warenwert)],
        ...p.posten.map((x) => [`${x.art}, netto`, eur(x.betrag)]),
        [`zuzüglich ${u} Umsatzsteuer`, 'auszurechnen'],
      ];
      return {
        titel,
        kontext: KONTEXT_C,
        sachverhalt: [
          p.vorlage === 0
            ? `${p.partner} liefert ${p.gegenstand} frei Werk Paderborn und berechnet die Nebenkosten der Lieferung mit. Die Rechnung ist in 30 Tagen fällig.`
            : `Für eine Lieferung ${p.gegenstand} trifft die Eingangsrechnung von ${p.partner} ein (Zahlungsziel 30 Tage). Sie enthält auch die Kosten für den Transport.`,
          p.variante === 'aufwandsorientiert'
            ? 'Die Lieferung geht direkt in die Produktion („Just-in-time“); die MBG erfasst sie aufwandsorientiert.'
            : 'Die MBG erfasst den Einkauf bestandsorientiert.',
        ],
        daten: { spalten: ['Rechnungsposition', 'Betrag'], zeilen },
        aufgabe: 'Ermittle Bezugskosten, Vorsteuer und Rechnungsbetrag und bilde den Buchungssatz.',
      };
    }
    case 'spedition': {
      const wie =
        p.zahlung === 'Kasse'
          ? 'Der Fahrer erhält den Betrag sofort bar aus der Kasse.'
          : p.zahlung === 'Bank'
            ? 'Die MBG überweist den Betrag sofort per Bank.'
            : 'Die Rechnung wird auf Ziel gebucht.';
      return {
        titel,
        kontext: KONTEXT_C,
        sachverhalt: [
          `Eine Spedition bringt ${p.gegenstand} von ${p.partner} ins Werk Paderborn. Ihre Rechnung über die Fracht lautet auf ${eur(p.speditionBrutto)} einschließlich ${u} Umsatzsteuer.`,
          wie + ' Die MBG erfasst den Einkauf bestandsorientiert.',
        ],
        aufgabe: 'Zerlege den Rechnungsbetrag und bilde den Buchungssatz.',
      };
    }
    case 'frachtanteil':
      return {
        titel,
        kontext: KONTEXT_C,
        sachverhalt: [
          `Eingangsrechnung von ${p.partner} über ${p.gegenstand}: ${eur(p.rechnungNetto)} netto zuzüglich ${u} Umsatzsteuer, Zahlungsziel 30 Tage.`,
          `Im Nettobetrag ist ein Frachtkostenanteil von ${pct(p.anteil)} enthalten. Die MBG erfasst bestandsorientiert.`,
        ],
        aufgabe:
          'Rechne den Frachtanteil heraus, ermittle die Vorsteuer und bilde den Buchungssatz.',
      };
    case 'aufteilung':
      return {
        titel,
        kontext: KONTEXT_C,
        sachverhalt: [
          `Eine Spedition bringt in einer Sammelladung ${p.gegenstand} und ${p.zweiterGegenstand} ins Werk. Sie berechnet Fracht ${eur(p.fracht)} und Transportversicherung ${eur(p.versicherung)}, jeweils netto zuzüglich ${u} Umsatzsteuer, auf Ziel.`,
          'Die Fracht wird nach Gewicht verteilt (Gewichtsspesen), die Versicherung nach dem Warenwert (Wertspesen).',
        ],
        daten: {
          spalten: ['Werkstoff', 'Gewicht', 'Warenwert netto'],
          zeilen: [
            [`${p.gegenstand} (${p.stoff})`, `${num(p.kgErster, 0)} kg`, eur(p.warenwert)],
            [
              `${p.zweiterGegenstand} (${p.zweiterStoff})`,
              `${num(p.kgZweiter, 0)} kg`,
              eur(p.zweiterWarenwert),
            ],
          ],
        },
        aufgabe:
          'Verteile Fracht und Versicherung auf die beiden Werkstoffe und buche die Speditionsrechnung.',
      };
    case 'umbuchung':
      return {
        titel,
        kontext: '31. März: Quartalsabschluss',
        sachverhalt: [
          `Auf dem Unterkonto ${bezugskostenKonto(p.stoff)} wurden im Quartal die Nebenkosten für ${p.gegenstand} gesammelt (Beträge netto).`,
          'Zum Abschluss sollen die Bezugskosten die Anschaffungskosten des Werkstoffs erhöhen.',
        ],
        aufgabe: `Ermittle den Saldo des Unterkontos und bilde die Umbuchung auf das Konto ${p.stoff}.`,
      };
  }
}

function c2Steps(p: C2Params, s: C2Solution): SolutionStep[] {
  const u = pct(p.ustSatz);
  const bezug = bezugskostenKonto(p.stoff);
  switch (p.variante) {
    case 'einkauf':
    case 'aufwandsorientiert':
      return [
        {
          titel: 'Bezugskosten',
          rechnung: `${p.posten.map((x) => eur(x.betrag)).join(' + ')} = ${eur(s.bezugskosten)}`,
          erlaeuterung:
            'Fracht, Verpackung und Transportversicherung sind Anschaffungsnebenkosten des Werkstoffs.',
        },
        {
          titel: 'Vorsteuer',
          rechnung: `(${eur(p.warenwert)} + ${eur(s.bezugskosten)}) × ${u} = ${eur(s.vorsteuer)}`,
          erlaeuterung: 'Auch die Bezugskosten sind umsatzsteuerpflichtig.',
        },
        {
          titel: 'Rechnungsbetrag',
          rechnung: `${eur(p.warenwert)} + ${eur(s.bezugskosten)} + ${eur(s.vorsteuer)} = ${eur(s.rechnung)}`,
        },
        {
          titel: 'Buchung',
          rechnung:
            p.variante === 'aufwandsorientiert'
              ? `${aufwandKonto(p.stoff)} ${eur(s.warenwert.plus(s.bezugskosten))}, Vorsteuer ${eur(s.vorsteuer)} an Verbindlichkeiten a. LL ${eur(s.rechnung)}`
              : `${p.stoff} ${eur(p.warenwert)}, ${bezug} ${eur(s.bezugskosten)}, Vorsteuer ${eur(s.vorsteuer)} an Verbindlichkeiten a. LL ${eur(s.rechnung)}`,
          erlaeuterung:
            p.variante === 'aufwandsorientiert'
              ? 'Aufwandsorientiert werden auch die Bezugskosten direkt auf dem Aufwandskonto erfasst.'
              : 'Bestandsorientiert kommen die Bezugskosten auf das Unterkonto des Werkstoffs.',
        },
      ];
    case 'spedition':
      return [
        {
          titel: 'Bezugskosten netto',
          rechnung: `${eur(p.speditionBrutto)} ÷ (1 + ${u}) = ${eur(s.bezugskosten)}`,
        },
        {
          titel: 'Vorsteuer',
          rechnung: `${eur(p.speditionBrutto)} − ${eur(s.bezugskosten)} = ${eur(s.vorsteuer)}`,
        },
        {
          titel: 'Buchung',
          rechnung: `${bezug} ${eur(s.bezugskosten)}, Vorsteuer ${eur(s.vorsteuer)} an ${p.zahlung === VERB ? 'Verbindlichkeiten a. LL' : p.zahlung} ${eur(s.rechnung)}`,
          erlaeuterung:
            'Eingangsfracht gehört zum Einkauf (Bezugskosten), nicht zu den Ausgangsfrachten.',
        },
      ];
    case 'frachtanteil':
      return [
        {
          titel: 'Frachtanteil',
          rechnung: `${eur(p.rechnungNetto)} × ${pct(p.anteil)} = ${eur(s.bezugskosten)}`,
        },
        {
          titel: 'Warenwert',
          rechnung: `${eur(p.rechnungNetto)} − ${eur(s.bezugskosten)} = ${eur(s.warenwert)}`,
        },
        {
          titel: 'Vorsteuer',
          rechnung: `${eur(p.rechnungNetto)} × ${u} = ${eur(s.vorsteuer)}`,
        },
        {
          titel: 'Buchung',
          rechnung: `${p.stoff} ${eur(s.warenwert)}, ${bezug} ${eur(s.bezugskosten)}, Vorsteuer ${eur(s.vorsteuer)} an Verbindlichkeiten a. LL ${eur(s.rechnung)}`,
        },
      ];
    case 'aufteilung': {
      const kg = p.kgErster + p.kgZweiter;
      const w = dec(p.warenwert).plus(p.zweiterWarenwert);
      return [
        {
          titel: 'Fracht nach Gewicht',
          rechnung: `${eur(p.fracht)} ÷ ${num(kg, 0)} kg × ${num(p.kgErster, 0)} kg = ${eur(s.frachtErster)}; Rest ${eur(s.frachtZweiter)}`,
          erlaeuterung: 'Gewichtsspesen (Fracht, Rollgeld) richten sich nach dem Gewicht.',
        },
        {
          titel: 'Versicherung nach Wert',
          rechnung: `${eur(p.versicherung)} ÷ ${eur(w)} × ${eur(p.warenwert)} = ${eur(s.versErster)}; Rest ${eur(s.versZweiter)}`,
          erlaeuterung: 'Wertspesen (Versicherung) richten sich nach dem Warenwert.',
        },
        {
          titel: 'Vorsteuer',
          rechnung: `(${eur(p.fracht)} + ${eur(p.versicherung)}) × ${u} = ${eur(s.vorsteuer)}`,
        },
        {
          titel: 'Buchung',
          rechnung: `${bezugskostenKonto(p.stoff)} ${eur(s.bezugErster)}, ${bezugskostenKonto(p.zweiterStoff)} ${eur(s.bezugZweiter)}, Vorsteuer ${eur(s.vorsteuer)} an Verbindlichkeiten a. LL ${eur(s.rechnung)}`,
        },
      ];
    }
    case 'umbuchung':
      return [
        {
          titel: 'Saldo',
          rechnung: dec(p.gutschrift).isZero()
            ? `${p.posten.map((x) => eur(x.betrag)).join(' + ')} = ${eur(s.bezugskosten)}`
            : `${p.posten.map((x) => eur(x.betrag)).join(' + ')} − ${eur(p.gutschrift)} = ${eur(s.bezugskosten)}`,
        },
        {
          titel: 'Umbuchung',
          rechnung: `${p.stoff} an ${bezug} ${eur(s.bezugskosten)}`,
          erlaeuterung:
            'Das Unterkonto wird über sein Hauptkonto abgeschlossen. Die Bezugskosten erhöhen so die Anschaffungskosten des Werkstoffs.',
        },
      ];
  }
}

function c2Hints(p: C2Params, s: C2Solution): [string, string, string] {
  const bezug = bezugskostenKonto(p.stoff);
  switch (p.variante) {
    case 'einkauf':
      return [
        'Trenne Warenwert und Nebenkosten der Lieferung. Nebenkosten des Einkaufs sind Bezugskosten.',
        'Die Vorsteuer wird auf Warenwert und Bezugskosten zusammen berechnet.',
        `Soll: ${p.stoff} ${eur(p.warenwert)}, ${bezug} ${eur(s.bezugskosten)}, Vorsteuer ${eur(s.vorsteuer)}.`,
      ];
    case 'aufwandsorientiert':
      return [
        'Aufwandsorientiert landet der ganze Einkauf direkt im Aufwand – auch die Nebenkosten.',
        'Die Vorsteuer wird auf Warenwert und Bezugskosten zusammen berechnet.',
        `Soll: ${aufwandKonto(p.stoff)} ${eur(s.warenwert.plus(s.bezugskosten))} und Vorsteuer ${eur(s.vorsteuer)}.`,
      ];
    case 'spedition':
      return [
        'Die Fracht bringt Werkstoffe zur MBG: Das sind Bezugskosten, keine Ausgangsfrachten.',
        `Netto = Brutto ÷ (1 + ${pct(p.ustSatz)}); die Differenz ist Vorsteuer.`,
        `Soll: ${bezug} ${eur(s.bezugskosten)} und Vorsteuer ${eur(s.vorsteuer)}.`,
      ];
    case 'frachtanteil':
      return [
        'Der Nettobetrag enthält Warenwert und Fracht. Rechne die Fracht mit dem Prozentsatz heraus.',
        `Fracht = ${eur(p.rechnungNetto)} × ${pct(p.anteil)}; der Rest ist der Warenwert.`,
        `Soll: ${p.stoff} ${eur(s.warenwert)}, ${bezug} ${eur(s.bezugskosten)}, Vorsteuer ${eur(s.vorsteuer)}.`,
      ];
    case 'aufteilung':
      return [
        'Fracht ist eine Gewichtsspese, Versicherung eine Wertspese.',
        `Fracht: ${eur(p.fracht)} im Verhältnis ${plain(p.kgErster)} : ${plain(p.kgZweiter)} kg; Versicherung im Verhältnis der Warenwerte.`,
        `Bezugskosten ${p.gegenstand}: ${eur(s.bezugErster)}, ${p.zweiterGegenstand}: ${eur(s.bezugZweiter)}.`,
      ];
    case 'umbuchung':
      return [
        'Bilde zuerst den Saldo des Unterkontos (Soll minus Haben).',
        'Unterkonten werden über ihr Hauptkonto abgeschlossen.',
        `${p.stoff} an ${bezug} ${eur(s.bezugskosten)}.`,
      ];
  }
}

function c2Variants(p: C2Params): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const mk = (fehlertyp: string, w: Rechenweg, k: Kontenwahl = {}) => {
    const v = rechneC2(p, w);
    out.push({ fehlertyp, parts: c2Parts(p, { ...v, buchung: buchungC2(p, v, k) }) });
  };
  switch (p.variante) {
    case 'einkauf':
      mk('bezugskosten-ohne-vorsteuer', { ohneSteuerAufBezug: true });
      mk('bezugskosten-als-ausgangsfracht', {}, { bezugKonto: 'Ausgangsfrachten' });
      mk('bezugskosten-direkt-auf-stoffkonto', {}, { aufStoffkonto: true });
      break;
    case 'aufwandsorientiert':
      mk('bezugskosten-ohne-vorsteuer', { ohneSteuerAufBezug: true });
      mk('erfassungsmethode-verwechselt', {}, { bestandStattAufwand: true });
      break;
    case 'spedition': {
      mk('bezugskosten-als-ausgangsfracht', {}, { bezugKonto: 'Ausgangsfrachten' });
      const v = rechneC2(p);
      out.push({
        fehlertyp: 'bezugskosten-ohne-vorsteuer',
        parts: c2Parts(p, {
          ...v,
          bezugskosten: v.rechnung,
          vorsteuer: new Val(0),
          buchung: buchungC2(p, v, { bruttoOhneSteuer: true }),
        }),
      });
      break;
    }
    case 'frachtanteil': {
      const v = rechneC2(p);
      out.push({
        fehlertyp: 'frachtanteil-nicht-herausgerechnet',
        parts: c2Parts(p, {
          ...v,
          bezugskosten: new Val(0),
          warenwert: new Val(p.rechnungNetto),
          buchung: buchungC2(p, v, { ohneAnteil: true }),
        }),
      });
      break;
    }
    case 'aufteilung':
      mk('schluessel-gewicht-wert-vertauscht', { schluesselVertauscht: true });
      break;
    case 'umbuchung':
      mk('umbuchung-unterkonto-richtung', {}, { umbuchungUmgekehrt: true });
      if (!dec(p.gutschrift).isZero()) mk('gutschrift-nicht-abgezogen', { ohneGutschrift: true });
      break;
  }
  return out;
}

export const bezugskosten = defineGenerator<C2Params, C2Solution>({
  skillId: 'C2-bezugskosten',
  titel: 'Bezugskosten',
  variants: [
    'einkauf',
    'spedition',
    'frachtanteil',
    'aufteilung',
    'umbuchung',
    'aufwandsorientiert',
  ],
  points: 3,
  generate: generateC2,
  render: (p) => renderC2(p),
  solve: solveC2,
  parts: c2Parts,
  steps: c2Steps,
  hints: c2Hints,
  errorVariants: c2Variants,
  verfahren: (p) =>
    p.variante === 'umbuchung'
      ? 'Bezugskosten-Unterkonto über das Werkstoffkonto abschließen'
      : p.variante === 'aufteilung'
        ? 'Bezugskosten nach Gewicht und Wert verteilen'
        : 'Bezugskosten als Anschaffungsnebenkosten auf dem Unterkonto buchen',
});
