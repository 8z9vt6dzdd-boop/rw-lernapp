// C4 – Nachträgliche Preisnachlässe vom Lieferer: Mängelrüge, Kulanz, Bonus; Netto- und
// Bruttomethode; Abschluss des Nachlass-Unterkontos (Lehrbrief BA 3.1.4.1 und 3.1.5;
// 04-fachregeln.md, Konvention 4; Spezifikation in docs/m7/c1.md).
import { nachlassKonto, type Stoff } from '../../accounts';
import { loesung, satz, zeile, type BuchungsLoesung, type ErwSatz } from '../../booking';
import { Val, dec, sum } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, GenOptions, SolutionStep, TaskPart, TaskText } from '../../task';
import { FIRMA } from '../../../config';
import { betrag, defineGenerator, eur, feld, isExact, isKrumm, pct, retry } from '../base';
import {
  KONTEXT_C,
  nachlassKontoFuer,
  steuerAuf,
  waehleStoff,
  zerlege,
  type Erfassung,
} from './common';

export type C4Variante = 'netto-methode' | 'brutto-methode' | 'bonus' | 'umbuchung' | 'aufwand';
export type C4Methode = 'netto' | 'brutto' | 'offen';

export interface C4Params {
  variante: C4Variante;
  erfassung: Erfassung;
  methode: C4Methode;
  stoff: Stoff;
  gegenstand: string;
  partner: string;
  ustSatz: string;
  /** Mängelrüge/Kulanz: Warenwert netto der ursprünglichen Rechnung */
  warenwert: string;
  /** Nachlass- bzw. Bonussatz (Dezimal-String) */
  satz: string;
  anlass: 'maengel' | 'kulanz';
  /** bonus: Jahresumsatz netto mit dem Lieferer; oder Gutschrift brutto gegeben */
  jahresumsatz: string;
  bonusGegeben: 'satz' | 'gutschrift';
  bonusBrutto: string;
  /** umbuchung: Buchungen auf dem Nachlass-Unterkonto (Beträge als Dezimal-String) */
  haben: { text: string; betrag: string }[];
  soll: { text: string; betrag: string }[];
  vorlage: number;
}

export interface C4Solution {
  /** Rechnungsbetrag brutto (Mängelrüge/Kulanz) */
  rechnung: Val;
  nachlassNetto: Val;
  vorsteuer: Val;
  nachlassBrutto: Val;
  /** umbuchung: Saldo des Unterkontos */
  saldo: Val;
  buchung: BuchungsLoesung;
  alternativen: BuchungsLoesung[];
}

const VERB = 'Verbindlichkeiten aus Lieferungen und Leistungen';

interface Rechenweg {
  /** Prozentsatz auf den Bruttobetrag angewendet und das Ergebnis als netto behandelt */
  bruttoAlsNetto?: boolean;
  /** Bonus: Bruttogutschrift als netto behandelt */
  gutschriftAlsNetto?: boolean;
  /** umbuchung: Sollbuchungen nicht abgezogen */
  ohneSoll?: boolean;
}

export function rechneC4(p: C4Params, w: Rechenweg = {}) {
  const u = p.ustSatz;
  const ww = new Val(p.warenwert);
  const rechnung = ww.plus(steuerAuf(ww, u));
  let nachlassNetto = new Val(0);
  let vorsteuer = new Val(0);
  let saldo = new Val(0);
  if (p.variante === 'bonus') {
    if (p.bonusGegeben === 'gutschrift' && !w.gutschriftAlsNetto) {
      const z = zerlege(new Val(p.bonusBrutto), u);
      nachlassNetto = z.netto;
      vorsteuer = z.steuer;
    } else {
      nachlassNetto =
        p.bonusGegeben === 'gutschrift'
          ? new Val(p.bonusBrutto)
          : new Val(p.jahresumsatz).times(dec(p.satz)).fix();
      vorsteuer = steuerAuf(nachlassNetto, u);
    }
  } else if (p.variante === 'umbuchung') {
    saldo = sum(p.haben.map((x) => x.betrag)).minus(
      w.ohneSoll ? 0 : sum(p.soll.map((x) => x.betrag)),
    );
  } else {
    nachlassNetto = (w.bruttoAlsNetto ? rechnung : ww).times(dec(p.satz)).fix();
    vorsteuer = steuerAuf(nachlassNetto, u);
  }
  return {
    rechnung,
    nachlassNetto,
    vorsteuer,
    nachlassBrutto: nachlassNetto.plus(vorsteuer),
    saldo,
  };
}

type Werte = ReturnType<typeof rechneC4>;

interface Kontenwahl {
  konto?: string;
  steuerKonto?: string;
  ohneSteuer?: boolean;
  ohneKorrektur?: boolean;
  umgekehrt?: boolean;
}

function buchungen(p: C4Params, v: Werte, k: Kontenwahl = {}) {
  const konto = k.konto ?? nachlassKontoFuer(p.stoff, p.erfassung);
  const steuerKonto = k.steuerKonto ?? 'Vorsteuer';
  if (p.variante === 'umbuchung') {
    const s: ErwSatz = k.umgekehrt
      ? satz([zeile(p.stoff, v.saldo)], [zeile(konto, v.saldo)])
      : satz([zeile(konto, v.saldo)], [zeile(p.stoff, v.saldo)], 'Umbuchung');
    const l = loesung([s]);
    return { netto: l, brutto: l };
  }
  const netto = k.ohneSteuer
    ? loesung([satz([zeile(VERB, v.nachlassBrutto)], [zeile(konto, v.nachlassBrutto)])])
    : loesung(
        [
          satz(
            [zeile(VERB, v.nachlassBrutto)],
            [zeile(konto, v.nachlassNetto), zeile(steuerKonto, v.vorsteuer)],
            'Gutschrift',
          ),
        ],
        false,
        'Nettomethode',
      );
  const brutto = loesung(
    [
      satz([zeile(VERB, v.nachlassBrutto)], [zeile(konto, v.nachlassBrutto)], 'Gutschrift'),
      ...(k.ohneKorrektur || k.ohneSteuer
        ? []
        : [
            satz([zeile(konto, v.vorsteuer)], [zeile(steuerKonto, v.vorsteuer)], 'Steuerkorrektur'),
          ]),
    ],
    false,
    'Bruttomethode',
  );
  return { netto, brutto };
}

export function solveC4(p: C4Params): C4Solution {
  const v = rechneC4(p);
  const b = buchungen(p, v);
  const buchung = p.methode === 'brutto' ? b.brutto : b.netto;
  return { ...v, buchung, alternativen: p.methode === 'offen' ? [b.brutto] : [] };
}

function c4Parts(p: C4Params, s: C4Solution): TaskPart[] {
  const buchung: TaskPart = {
    typ: 'buchungssatz',
    id: 'buchung',
    titel:
      p.variante === 'umbuchung'
        ? 'Umbuchung am Periodenende'
        : s.buchung.saetze.length > 1
          ? 'Buchungssätze (Gutschrift und Steuerkorrektur)'
          : 'Buchungssatz für die Gutschrift',
    loesung: s.buchung,
  };
  if (s.alternativen.length > 0) buchung.alternativen = s.alternativen;
  if (p.variante === 'umbuchung') {
    return [
      {
        typ: 'tkonto',
        id: 'konto',
        titel: 'Saldo des Unterkontos',
        konto: nachlassKonto(p.stoff),
        soll: p.soll.map((x) => ({ text: x.text, betrag: dec(x.betrag).toFixed(2) })),
        haben: p.haben.map((x) => ({ text: x.text, betrag: dec(x.betrag).toFixed(2) })),
        felder: [feld('saldo', 'Saldo (umzubuchender Betrag)', s.saldo)],
      },
      buchung,
    ];
  }
  const felder =
    p.variante === 'bonus' && p.bonusGegeben === 'gutschrift'
      ? [
          feld('netto', 'Bonus netto', s.nachlassNetto),
          feld('vorsteuer', 'Vorsteuerkorrektur', s.vorsteuer),
        ]
      : [
          feld(
            'netto',
            p.variante === 'bonus' ? 'Bonus netto' : 'Preisnachlass netto',
            s.nachlassNetto,
          ),
          feld('vorsteuer', 'Vorsteuerkorrektur', s.vorsteuer),
          feld('brutto', 'Gutschrift (brutto)', s.nachlassBrutto),
        ];
  return [{ typ: 'rechenkette', id: 'rechnung', titel: 'Gutschrift berechnen', felder }, buchung];
}

function generateC4(rng: Rng, opts: GenOptions = {}): C4Params {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const alle: C4Variante[] = ['netto-methode', 'brutto-methode', 'bonus', 'umbuchung', 'aufwand'];
  const erzwungen = alle.includes(opts.variant as C4Variante);
  const variante: C4Variante = erzwungen
    ? (opts.variant as C4Variante)
    : rng.pick<C4Variante>([
        'netto-methode',
        'netto-methode',
        'netto-methode',
        'brutto-methode',
        'brutto-methode',
        'bonus',
        'bonus',
        'umbuchung',
        'aufwand',
      ]);
  const methode: C4Methode =
    variante === 'brutto-methode'
      ? 'brutto'
      : variante === 'netto-methode' && !erzwungen && rng.chance(0.2)
        ? 'offen'
        : 'netto';
  const { stoff, gegenstand, partner } = waehleStoff(
    rng,
    FIRMA,
    variante === 'aufwand'
      ? ['Rohstoffe', 'Hilfsstoffe', 'Vorprodukte und Fremdbauteile']
      : undefined,
  );
  const anlass = rng.pick(['maengel', 'maengel', 'kulanz'] as const);
  const bonusGegeben = rng.chance(0.35) ? 'gutschrift' : 'satz';
  const vorlage = rng.int(0, 1);
  const make = (r: Rng): C4Params => {
    const haben = r
      .shuffle([
        { text: 'Skonto (netto)', betrag: betrag(r, 50, 900, 10, krumm) },
        { text: 'Preisnachlass Mängelrüge', betrag: betrag(r, 100, 3_000, 10, krumm) },
        { text: 'Bonus Vorjahr', betrag: betrag(r, 200, 4_000, 10, krumm) },
      ])
      .slice(0, r.int(2, 3));
    const soll: { text: string; betrag: string }[] = [];
    if (r.chance(0.3)) {
      // Bruttomethode: Nachlass brutto im Haben, Vorsteuerkorrektur im Soll
      const n = dec(r.step(100, 2_000, 100));
      const vst = n.times('0.19').toDecimalPlaces(2);
      haben.push({ text: 'Preisnachlass Kulanz (brutto)', betrag: n.plus(vst).toFixed(2) });
      soll.push({ text: 'Vorsteuerkorrektur', betrag: vst.toFixed(2) });
    }
    return {
      variante,
      erfassung: variante === 'aufwand' ? 'aufwand' : 'bestand',
      methode,
      stoff,
      gegenstand,
      partner,
      ustSatz: '0.19',
      warenwert: betrag(r, 1_000, 40_000, 100, krumm),
      satz: r.pick(['0.05', '0.1', '0.1', '0.15', '0.2']),
      anlass,
      jahresumsatz: betrag(r, 20_000, 400_000, 1_000, krumm),
      bonusGegeben,
      bonusBrutto: krumm
        ? betrag(r, 200, 8_000, 1, true)
        : dec(r.step(200, 8_000, 50))
            .times('1.19')
            .toFixed(2),
      haben,
      soll,
      vorlage,
    };
  };
  const satzBonus = ['0.01', '0.015', '0.02', '0.025', '0.03'];
  return retry(
    rng,
    (r) => {
      const p = make(r);
      if (p.variante === 'bonus') p.satz = r.pick(satzBonus);
      return p;
    },
    (p) => {
      if (krumm) return true;
      if (p.variante === 'bonus') return isExact(dec(p.jahresumsatz).times(p.satz));
      if (p.variante === 'umbuchung') return true;
      // glatte Nachlässe: auch der Bruttobetrag × Satz geht auf (Lösungsweg über brutto gleichwertig)
      const r = dec(p.warenwert).times('1.19');
      return isExact(dec(p.warenwert).times(p.satz)) && isExact(r.times(p.satz));
    },
  );
}

function renderC4(p: C4Params): TaskText {
  const u = pct(p.ustSatz);
  const titel = 'Nachlass vom Lieferer';
  const methodeText =
    p.methode === 'netto'
      ? ' Buche nach der Nettomethode.'
      : p.methode === 'brutto'
        ? ' Buche nach der Bruttomethode (Gutschrift und Steuerkorrektur am Ende des Voranmeldungszeitraums getrennt).'
        : '';
  if (p.variante === 'bonus') {
    return {
      titel,
      kontext: 'März: Jahresgespräch mit dem Lieferer',
      sachverhalt: [
        p.bonusGegeben === 'satz'
          ? `${p.partner} gewährt der MBG für den Einkauf des Vorjahres (${eur(p.jahresumsatz)} netto) einen Bonus von ${pct(p.satz)}.`
          : `${p.partner} schickt der MBG eine Bonusgutschrift für die Einkäufe des Vorjahres über ${eur(p.bonusBrutto)} einschließlich ${u} Umsatzsteuer.`,
        `Die Gutschrift wird mit offenen Rechnungen verrechnet. Die gekaufte Ware (${p.gegenstand}) wird auf dem Konto ${p.stoff} geführt.`,
      ],
      aufgabe:
        (p.bonusGegeben === 'satz'
          ? 'Berechne die Gutschrift und bilde den Buchungssatz.'
          : 'Zerlege die Gutschrift und bilde den Buchungssatz.') + methodeText,
    };
  }
  if (p.variante === 'umbuchung') {
    return {
      titel,
      kontext: '31. März: Quartalsabschluss',
      sachverhalt: [
        `Auf dem Unterkonto ${nachlassKonto(p.stoff)} wurden im Quartal alle Nachlässe für ${p.gegenstand} gesammelt.`,
        'Zum Abschluss sollen die Nachlässe die Anschaffungskosten des Werkstoffs mindern.',
      ],
      aufgabe: `Ermittle den Saldo des Unterkontos und bilde die Umbuchung auf das Konto ${p.stoff}.`,
    };
  }
  const rechnung = rechneC4(p).rechnung;
  const grund =
    p.anlass === 'maengel'
      ? `Bei der Eingangskontrolle zeigen sich Mängel. Die MBG behält die Ware; nach ihrer Mängelrüge gewährt der Lieferer einen Preisnachlass von ${pct(p.satz)}.`
      : `Die Lieferung kam eine Woche zu spät. Aus Kulanz gewährt der Lieferer nachträglich einen Preisnachlass von ${pct(p.satz)}.`;
  return {
    titel,
    kontext: KONTEXT_C,
    sachverhalt: [
      p.vorlage === 0
        ? `Die MBG hat bei ${p.partner} ${p.gegenstand} auf Ziel gekauft: Warenwert ${eur(p.warenwert)} netto zuzüglich ${u} Umsatzsteuer, Rechnungsbetrag ${eur(rechnung)}.`
        : `Eingangsrechnung von ${p.partner} über ${p.gegenstand}: ${eur(p.warenwert)} netto + ${u} USt = ${eur(rechnung)}. Die Rechnung ist noch offen.`,
      grund +
        (p.erfassung === 'aufwand'
          ? ' Die MBG hat diesen Einkauf aufwandsorientiert erfasst (Lieferung direkt in die Produktion).'
          : ''),
    ],
    aufgabe: 'Berechne die Gutschrift und bilde die Buchung.' + methodeText,
  };
}

function c4Steps(p: C4Params, s: C4Solution): SolutionStep[] {
  const u = pct(p.ustSatz);
  const konto = nachlassKontoFuer(p.stoff, p.erfassung);
  if (p.variante === 'umbuchung') {
    const h = p.haben.map((x) => eur(x.betrag)).join(' + ');
    return [
      {
        titel: 'Saldo',
        rechnung:
          p.soll.length > 0
            ? `${h} − ${p.soll.map((x) => eur(x.betrag)).join(' − ')} = ${eur(s.saldo)}`
            : `${h} = ${eur(s.saldo)}`,
        erlaeuterung: 'Das Nachlasskonto hat einen Habensaldo: Summe Haben minus Summe Soll.',
      },
      {
        titel: 'Umbuchung',
        rechnung: `${nachlassKonto(p.stoff)} an ${p.stoff} ${eur(s.saldo)}`,
        erlaeuterung:
          'Das Unterkonto wird über sein Hauptkonto abgeschlossen. Die Nachlässe mindern so die Anschaffungskosten.',
      },
    ];
  }
  const steps: SolutionStep[] = [];
  if (p.variante === 'bonus' && p.bonusGegeben === 'gutschrift') {
    steps.push(
      {
        titel: 'Bonus netto',
        rechnung: `${eur(p.bonusBrutto)} ÷ (1 + ${u}) = ${eur(s.nachlassNetto)}`,
      },
      {
        titel: 'Vorsteuerkorrektur',
        rechnung: `${eur(p.bonusBrutto)} − ${eur(s.nachlassNetto)} = ${eur(s.vorsteuer)}`,
      },
    );
  } else {
    steps.push(
      {
        titel: p.variante === 'bonus' ? 'Bonus netto' : 'Preisnachlass netto',
        rechnung: `${eur(p.variante === 'bonus' ? p.jahresumsatz : p.warenwert)} × ${pct(p.satz)} = ${eur(s.nachlassNetto)}`,
      },
      {
        titel: 'Vorsteuerkorrektur',
        rechnung: `${eur(s.nachlassNetto)} × ${u} = ${eur(s.vorsteuer)}`,
        erlaeuterung:
          'Der Nachlass mindert das Entgelt. Die beim Einkauf abgezogene Vorsteuer war deshalb zu hoch.',
      },
      {
        titel: 'Gutschrift',
        rechnung: `${eur(s.nachlassNetto)} + ${eur(s.vorsteuer)} = ${eur(s.nachlassBrutto)}`,
      },
    );
  }
  if (p.methode === 'brutto') {
    steps.push(
      {
        titel: 'Buchung der Gutschrift (Bruttomethode)',
        rechnung: `Verbindlichkeiten a. LL an ${konto} ${eur(s.nachlassBrutto)}`,
      },
      {
        titel: 'Steuerkorrektur am Ende des Voranmeldungszeitraums',
        rechnung: `${konto} an Vorsteuer ${eur(s.vorsteuer)}`,
      },
    );
  } else {
    steps.push({
      titel: 'Buchung (Nettomethode)',
      rechnung: `Verbindlichkeiten a. LL ${eur(s.nachlassBrutto)} an ${konto} ${eur(s.nachlassNetto)}, an Vorsteuer ${eur(s.vorsteuer)}`,
      erlaeuterung:
        p.erfassung === 'aufwand'
          ? 'Aufwandsorientiert mindert der Nachlass direkt den gebuchten Aufwand.'
          : 'Der Nachlass kommt auf das Unterkonto Nachlässe, die Ware bleibt bei der MBG – deshalb kein Storno auf dem Stoffkonto.',
    });
  }
  return steps;
}

function c4Hints(p: C4Params, s: C4Solution): [string, string, string] {
  const konto = nachlassKontoFuer(p.stoff, p.erfassung);
  if (p.variante === 'umbuchung')
    return [
      'Bilde zuerst den Saldo des Unterkontos (Haben minus Soll).',
      'Unterkonten werden über ihr Hauptkonto abgeschlossen.',
      `${nachlassKonto(p.stoff)} an ${p.stoff} ${eur(s.saldo)}.`,
    ];
  return [
    'Die Ware bleibt bei der MBG, nur der Preis sinkt: Das ist ein Nachlass, keine Rücksendung.',
    `Nachlass netto × ${pct(p.ustSatz)} = Vorsteuerkorrektur. Die Verbindlichkeit sinkt um den Bruttobetrag.`,
    p.methode === 'brutto'
      ? `Erst Verbindlichkeiten a. LL an ${konto} ${eur(s.nachlassBrutto)}, später ${konto} an Vorsteuer ${eur(s.vorsteuer)}.`
      : `Verbindlichkeiten a. LL ${eur(s.nachlassBrutto)} an ${konto} ${eur(s.nachlassNetto)}, an Vorsteuer ${eur(s.vorsteuer)}.`,
  ];
}

function c4Variants(p: C4Params): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const mk = (fehlertyp: string, w: Rechenweg, k: Kontenwahl = {}) => {
    const v = rechneC4(p, w);
    const b = buchungen(p, v, k);
    const buchung = p.methode === 'brutto' ? b.brutto : b.netto;
    out.push({ fehlertyp, parts: c4Parts(p, { ...v, buchung, alternativen: [] }) });
  };
  if (p.variante === 'umbuchung') {
    mk('umbuchung-unterkonto-richtung', {}, { umgekehrt: true });
    if (p.soll.length > 0) mk('unterkonto-saldo-falsch', { ohneSoll: true });
    return out;
  }
  if (p.methode !== 'brutto') {
    const v = rechneC4(p);
    const ohne = { ...v, nachlassNetto: v.nachlassBrutto, vorsteuer: new Val(0) };
    const b = buchungen(p, ohne, { ohneSteuer: true });
    out.push({
      fehlertyp: 'nachlass-ohne-vorsteuer',
      parts: c4Parts(p, { ...ohne, buchung: b.netto, alternativen: [] }),
    });
  }
  mk('steuer-falsches-konto', {}, { steuerKonto: 'Umsatzsteuer' });
  mk('nachlass-als-erloesberichtigung', {}, { konto: 'Erlösberichtigungen' });
  if (p.erfassung === 'aufwand') {
    mk('erfassungsmethode-verwechselt', {}, { konto: nachlassKonto(p.stoff) });
  } else {
    mk('nachlass-direkt-auf-stoffkonto', {}, { konto: p.stoff });
  }
  if (p.variante !== 'bonus') mk('nachlass-vom-bruttobetrag', { bruttoAlsNetto: true });
  if (p.variante === 'bonus' && p.bonusGegeben === 'gutschrift')
    mk('gutschrift-brutto-als-netto', { gutschriftAlsNetto: true });
  if (p.methode === 'brutto') mk('bruttomethode-ohne-korrektur', {}, { ohneKorrektur: true });
  return out;
}

export const nachlaesseEinkauf = defineGenerator<C4Params, C4Solution>({
  skillId: 'C4-nachlaesse-einkauf',
  titel: 'Nachlässe vom Lieferer',
  variants: ['netto-methode', 'brutto-methode', 'bonus', 'umbuchung', 'aufwand'],
  points: 3,
  generate: generateC4,
  render: (p) => renderC4(p),
  solve: solveC4,
  parts: c4Parts,
  steps: c4Steps,
  hints: c4Hints,
  errorVariants: c4Variants,
  verfahren: (p) =>
    p.variante === 'umbuchung'
      ? 'Nachlass-Unterkonto über das Werkstoffkonto abschließen'
      : 'Preisnachlass oder Bonus vom Lieferer: Nachlass-Unterkonto und Vorsteuerkorrektur',
});
