// D3 – Erlösberichtigungen: nachträgliche Preisnachlässe an Kunden (Mängelrüge, Bonus, Kulanz),
// Netto- und Bruttomethode, Abschluss über Umsatzerlöse (BA 3.2.2). Spezifikation: docs/m7/d.md.
import { loesung, satz, zeile, type BuchungsLoesung } from '../../booking';
import { Val } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, Feld, GenOptions, SolutionStep, TaskPart } from '../../task';
import { betrag, defineGenerator, eur, feld, isExact, isKrumm, pct, retry } from '../base';
import { FORDERUNGEN, ausBrutto, ausNetto, glattBrutto, kunde, produktFuer } from './gemeinsam';

const EB = 'Erlösberichtigungen';
const UE = 'Umsatzerlöse für eigene Erzeugnisse';
const GUV = 'Gewinn- und Verlustkonto';

export type NachlassAnlass = 'maengelruege' | 'bonus' | 'kulanz';
export type NachlassGegeben =
  'prozent-netto' | 'prozent-brutto' | 'gutschrift-brutto' | 'gutschrift-netto';
export type NachlassMethode = 'netto' | 'brutto' | 'offen';

export interface ErloesberichtigungParams {
  fall: 'nachlass' | 'abschluss';
  anlass: NachlassAnlass;
  gegeben: NachlassGegeben;
  /** Rechnungs- oder Umsatzbetrag (prozent-*) bzw. Gutschriftsbetrag (gutschrift-*) */
  betrag: string;
  satz: string;
  methode: NachlassMethode;
  ausgleich: 'forderung' | 'bank';
  /** nur Abschluss: Summe der Umsatzerlöse (Haben) und der Erlösberichtigungen (Soll) */
  umsatzerloese: string;
  erloesberichtigungen: string;
  ustSatz: string;
  kunde: string;
  produkt: string;
}

export interface ErloesberichtigungSolution {
  netto: Val;
  ust: Val;
  brutto: Val;
  nettoumsatz: Val;
  buchung: BuchungsLoesung;
  alternativen: BuchungsLoesung[];
}

interface Rechenweg {
  bruttoAlsNetto?: boolean;
  addiert?: boolean;
}

interface Kontenwahl {
  nachlassKonto?: string;
  steuerKonto?: string;
  ohneSteuer?: boolean;
  korrekturVertauscht?: boolean;
  abschlussKonto?: string;
}

export function rechneNachlass(p: ErloesberichtigungParams, w: Rechenweg = {}) {
  const b = new Val(p.betrag);
  switch (p.gegeben) {
    case 'prozent-netto':
      return ausNetto(b.times(p.satz).fix(), p.ustSatz);
    case 'prozent-brutto': {
      const nachlass = b.times(p.satz).fix();
      return w.bruttoAlsNetto ? ausNetto(nachlass, p.ustSatz) : ausBrutto(nachlass, p.ustSatz);
    }
    case 'gutschrift-brutto':
      return w.bruttoAlsNetto ? ausNetto(b, p.ustSatz) : ausBrutto(b, p.ustSatz);
    case 'gutschrift-netto':
      return ausNetto(b, p.ustSatz);
  }
}

function buchenNachlass(
  p: ErloesberichtigungParams,
  v: ReturnType<typeof rechneNachlass>,
  k: Kontenwahl = {},
): { netto: BuchungsLoesung; brutto: BuchungsLoesung } {
  const konto = k.nachlassKonto ?? EB;
  const steuer = k.steuerKonto ?? 'Umsatzsteuer';
  const gegen = p.ausgleich === 'bank' ? 'Bank' : FORDERUNGEN;
  const netto = k.ohneSteuer
    ? loesung([satz([zeile(konto, v.brutto)], [zeile(gegen, v.brutto)], 'Gutschrift')])
    : loesung(
        [
          satz(
            [zeile(konto, v.netto), zeile(steuer, v.ust)],
            [zeile(gegen, v.brutto)],
            'Gutschrift',
          ),
        ],
        false,
        'Nettomethode',
      );
  const korrektur = k.korrekturVertauscht
    ? satz([zeile(konto, v.ust)], [zeile(steuer, v.ust)], 'Steuerkorrektur')
    : satz([zeile(steuer, v.ust)], [zeile(konto, v.ust)], 'Steuerkorrektur');
  const brutto = loesung(
    [
      satz([zeile(konto, v.brutto)], [zeile(gegen, v.brutto)], 'Gutschrift'),
      ...(k.ohneSteuer ? [] : [korrektur]),
    ],
    false,
    'Bruttomethode',
  );
  return { netto, brutto };
}

function rechneAbschluss(p: ErloesberichtigungParams, w: Rechenweg = {}) {
  const ue = new Val(p.umsatzerloese);
  const eb = new Val(p.erloesberichtigungen);
  return { eb, nettoumsatz: w.addiert ? ue.plus(eb) : ue.minus(eb) };
}

function buchenAbschluss(
  p: ErloesberichtigungParams,
  a: ReturnType<typeof rechneAbschluss>,
  k: Kontenwahl = {},
): BuchungsLoesung {
  if (k.abschlussKonto === GUV) {
    return loesung(
      [
        satz([zeile(GUV, a.eb)], [zeile(EB, a.eb)], 'Abschluss Erlösberichtigungen'),
        satz([zeile(UE, p.umsatzerloese)], [zeile(GUV, p.umsatzerloese)], 'Abschluss Umsatzerlöse'),
      ],
      true,
    );
  }
  return loesung(
    [
      satz([zeile(UE, a.eb)], [zeile(EB, a.eb)], 'Abschluss Erlösberichtigungen'),
      satz([zeile(UE, a.nettoumsatz)], [zeile(GUV, a.nettoumsatz)], 'Abschluss Umsatzerlöse'),
    ],
    true,
  );
}

export function solveErloesberichtigung(p: ErloesberichtigungParams): ErloesberichtigungSolution {
  if (p.fall === 'abschluss') {
    const a = rechneAbschluss(p);
    return {
      netto: a.eb,
      ust: new Val(0),
      brutto: a.eb,
      nettoumsatz: a.nettoumsatz,
      buchung: buchenAbschluss(p, a),
      alternativen: [],
    };
  }
  const v = rechneNachlass(p);
  const b = buchenNachlass(p, v);
  return {
    ...v,
    nettoumsatz: new Val(0),
    buchung: p.methode === 'brutto' ? b.brutto : b.netto,
    alternativen: p.methode === 'offen' ? [b.brutto] : [],
  };
}

function parts(p: ErloesberichtigungParams, s: ErloesberichtigungSolution): TaskPart[] {
  if (p.fall === 'abschluss') {
    return [
      {
        typ: 'rechenkette',
        id: 'rechnung',
        titel: 'Nettoumsatz ermitteln',
        felder: [feld('nettoumsatz', 'Umsatzerlöse nach Erlösberichtigungen', s.nettoumsatz)],
      },
      { typ: 'buchungssatz', id: 'buchung', titel: 'Abschlussbuchungen', loesung: s.buchung },
    ];
  }
  const felder: Feld[] = [
    feld('netto', 'Nachlass netto (Erlösberichtigung)', s.netto),
    feld('ust', 'Umsatzsteuerkorrektur', s.ust),
    feld('brutto', 'Gutschrift brutto', s.brutto),
  ];
  const buchung: TaskPart = {
    typ: 'buchungssatz',
    id: 'buchung',
    titel:
      s.buchung.saetze.length > 1
        ? 'Buchungssätze (Gutschrift und Steuerkorrektur)'
        : 'Buchungssatz für die Gutschrift',
    loesung: s.buchung,
  };
  if (s.alternativen.length > 0) buchung.alternativen = s.alternativen;
  return [{ typ: 'rechenkette', id: 'rechnung', titel: 'Nachlass zerlegen', felder }, buchung];
}

function variants(p: ErloesberichtigungParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  if (p.fall === 'abschluss') {
    const s = solveErloesberichtigung(p);
    const a1 = rechneAbschluss(p);
    out.push({
      fehlertyp: 'erloesberichtigung-ueber-guv',
      parts: parts(p, {
        ...s,
        nettoumsatz: new Val(p.umsatzerloese),
        buchung: buchenAbschluss(p, a1, { abschlussKonto: GUV }),
      }),
    });
    const a2 = rechneAbschluss(p, { addiert: true });
    out.push({
      fehlertyp: 'erloesberichtigung-addiert',
      parts: parts(p, { ...s, nettoumsatz: a2.nettoumsatz, buchung: buchenAbschluss(p, a2) }),
    });
    return out;
  }
  const add = (fehlertyp: string, w: Rechenweg, k: Kontenwahl = {}) => {
    const v = rechneNachlass(p, w);
    const b = buchenNachlass(p, v, k);
    out.push({
      fehlertyp,
      parts: parts(p, {
        ...v,
        nettoumsatz: new Val(0),
        buchung: p.methode === 'brutto' ? b.brutto : b.netto,
        alternativen: [],
      }),
    });
  };
  add('steuer-falsches-konto', {}, { steuerKonto: 'Vorsteuer' });
  add('nachlass-als-umsatzstorno', {}, { nachlassKonto: UE });
  if (p.methode !== 'brutto') add('nachlass-ohne-steuerkorrektur', {}, { ohneSteuer: true });
  if (p.methode === 'brutto')
    add('korrektur-richtung-vertauscht', {}, { korrekturVertauscht: true });
  if (p.gegeben === 'prozent-brutto' || p.gegeben === 'gutschrift-brutto')
    add('brutto-als-netto', { bruttoAlsNetto: true });
  return out;
}

const ANLASS_TEXT: Record<NachlassAnlass, string> = {
  maengelruege: 'wegen einer berechtigten Mängelrüge (einige Paletten mit verbeulten Dosen)',
  bonus: 'als vereinbarten Jahresbonus',
  kulanz: 'aus Kulanz (die Lieferung kam zwei Tage zu spät)',
};

function render(p: ErloesberichtigungParams) {
  const u = pct(p.ustSatz);
  if (p.fall === 'abschluss') {
    return {
      titel: 'Erlösberichtigungen abschließen',
      kontext: '31. Dezember: Abschluss der Erfolgskonten',
      sachverhalt: [
        'Am Jahresende zeigen die Erfolgskonten der MBG folgende Summen:',
        `Umsatzerlöse für eigene Erzeugnisse (Haben): ${eur(p.umsatzerloese)} · Erlösberichtigungen (Soll): ${eur(p.erloesberichtigungen)}`,
      ],
      aufgabe:
        'Ermittle die Umsatzerlöse nach Erlösberichtigungen und bilde die Abschlussbuchungen für beide Konten.',
    };
  }
  const anlass = ANLASS_TEXT[p.anlass];
  const sachverhalt: string[] = [];
  switch (p.gegeben) {
    case 'prozent-netto':
      sachverhalt.push(
        p.anlass === 'bonus'
          ? `${p.kunde} hat im abgelaufenen Jahr ${p.produkt} für ${eur(p.betrag)} netto bei der MBG gekauft.`
          : `Die MBG hat ${p.kunde} ${p.produkt} für ${eur(p.betrag)} netto zuzüglich ${u} Umsatzsteuer geliefert.`,
        `Die MBG gewährt dem Kunden ${anlass} ${pct(p.satz)} ${p.anlass === 'bonus' ? 'auf diesen Umsatz' : 'Preisnachlass auf den Nettowert'}; die Gutschrift enthält ${u} Umsatzsteuer.`,
      );
      break;
    case 'prozent-brutto':
      sachverhalt.push(
        `Die Ausgangsrechnung an ${p.kunde} für ${p.produkt} lautet über ${eur(p.betrag)} einschließlich ${u} Umsatzsteuer.`,
        `Der Kunde behält die Ware; die MBG gewährt ${anlass} einen Nachlass von ${pct(p.satz)} auf den Rechnungsbetrag.`,
      );
      break;
    case 'gutschrift-brutto':
      sachverhalt.push(
        `Die MBG schreibt ${p.kunde} ${anlass} ${eur(p.betrag)} einschließlich ${u} Umsatzsteuer gut.`,
        p.anlass === 'bonus'
          ? `Der Bonus bezieht sich auf die Lieferungen von ${p.produkt} im abgelaufenen Jahr.`
          : `Die gelieferte Ware (${p.produkt}) behält der Kunde.`,
      );
      break;
    case 'gutschrift-netto':
      sachverhalt.push(
        `${p.kunde} erhält ${anlass} eine Gutschrift über ${eur(p.betrag)} netto zuzüglich ${u} Umsatzsteuer.`,
        p.anlass === 'bonus'
          ? `Der Bonus bezieht sich auf die Lieferungen von ${p.produkt} im abgelaufenen Jahr.`
          : `Die gelieferte Ware (${p.produkt}) behält der Kunde.`,
      );
      break;
  }
  sachverhalt.push(
    p.ausgleich === 'forderung'
      ? 'Die Gutschrift wird mit den offenen Forderungen gegen den Kunden verrechnet.'
      : 'Der Kunde hat bereits alles bezahlt; die MBG überweist ihm den Betrag per Bank.',
  );
  const methode =
    p.methode === 'netto'
      ? ' Buche nach der Nettomethode.'
      : p.methode === 'brutto'
        ? ' Buche nach der Bruttomethode (Gutschrift und spätere Steuerkorrektur getrennt).'
        : '';
  return {
    titel: p.anlass === 'bonus' ? 'Bonus an einen Kunden' : 'Preisnachlass an einen Kunden',
    kontext: p.anlass === 'bonus' ? 'Juni: Boni für Großhändler' : 'Mai: Mängelrügen in der Saison',
    sachverhalt,
    aufgabe: `Zerlege den Nachlass und bilde die Buchung.${methode}`,
  };
}

function steps(p: ErloesberichtigungParams, s: ErloesberichtigungSolution): SolutionStep[] {
  const u = pct(p.ustSatz);
  if (p.fall === 'abschluss') {
    return [
      {
        titel: 'Nettoumsatz',
        rechnung: `${eur(p.umsatzerloese)} − ${eur(p.erloesberichtigungen)} = ${eur(s.nettoumsatz)}`,
        erlaeuterung: 'Erlösberichtigungen sind ein Unterkonto der Umsatzerlöse und mindern sie.',
      },
      {
        titel: 'Abschluss Erlösberichtigungen',
        rechnung: `Umsatzerlöse an Erlösberichtigungen ${eur(p.erloesberichtigungen)}`,
        erlaeuterung:
          'Das Unterkonto wird über sein Hauptkonto abgeschlossen, nicht direkt über die GuV.',
      },
      {
        titel: 'Abschluss Umsatzerlöse',
        rechnung: `Umsatzerlöse an GuV ${eur(s.nettoumsatz)}`,
      },
    ];
  }
  const out: SolutionStep[] = [];
  if (p.gegeben === 'prozent-netto')
    out.push({
      titel: 'Nachlass netto',
      rechnung: `${eur(p.betrag)} × ${pct(p.satz)} = ${eur(s.netto)}`,
    });
  if (p.gegeben === 'prozent-brutto')
    out.push({
      titel: 'Nachlass brutto',
      rechnung: `${eur(p.betrag)} × ${pct(p.satz)} = ${eur(s.brutto)}`,
      erlaeuterung:
        'Der Prozentsatz bezieht sich hier auf den Bruttobetrag, also enthält der Nachlass schon Steuer.',
    });
  if (p.gegeben === 'prozent-brutto' || p.gegeben === 'gutschrift-brutto')
    out.push({
      titel: 'Zerlegen',
      rechnung: `${eur(s.brutto)} ÷ (1 + ${u}) = ${eur(s.netto)}; Steuer ${eur(s.brutto)} − ${eur(s.netto)} = ${eur(s.ust)}`,
    });
  else
    out.push({
      titel: 'Steuer und Gutschrift',
      rechnung: `${eur(s.netto)} × ${u} = ${eur(s.ust)}; ${eur(s.netto)} + ${eur(s.ust)} = ${eur(s.brutto)}`,
    });
  const gegen = p.ausgleich === 'bank' ? 'Bank' : 'Forderungen a. LL';
  out.push(
    p.methode === 'brutto'
      ? {
          titel: 'Buchungen (Bruttomethode)',
          rechnung: `1. Erlösberichtigungen ${eur(s.brutto)} an ${gegen} ${eur(s.brutto)}; 2. Umsatzsteuer an Erlösberichtigungen ${eur(s.ust)}`,
          erlaeuterung:
            'Bei der Bruttomethode wird die Steuer erst später (z. B. am Monatsende) herausgerechnet.',
        }
      : {
          titel: 'Buchung (Nettomethode)',
          rechnung: `Erlösberichtigungen ${eur(s.netto)}, Umsatzsteuer ${eur(s.ust)} an ${gegen} ${eur(s.brutto)}`,
          erlaeuterung:
            'Der Nachlass mindert den Umsatz (Erlösberichtigungen im Soll) und die geschuldete Umsatzsteuer.',
        },
  );
  return out;
}

function generate(rng: Rng, opts: GenOptions = {}): ErloesberichtigungParams {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const v = opts.variant;
  const ustSatz = '0.19';
  const base = {
    ustSatz,
    kunde: kunde(rng),
    produkt: produktFuer(rng, 'erzeugnisse'),
    umsatzerloese: '0',
    erloesberichtigungen: '0',
  };
  if (v === 'abschluss' || (v === undefined && rng.chance(0.15))) {
    const ue = rng.step(400_000, 2_000_000, 1_000);
    return {
      ...base,
      fall: 'abschluss',
      anlass: 'maengelruege',
      gegeben: 'gutschrift-netto',
      betrag: '0',
      satz: '0',
      methode: 'netto',
      ausgleich: 'forderung',
      umsatzerloese: String(ue),
      erloesberichtigungen: betrag(rng, 2_000, 40_000, 10, krumm),
    };
  }
  const anlass: NachlassAnlass =
    v === 'bonus'
      ? 'bonus'
      : v === 'maengelruege'
        ? 'maengelruege'
        : rng.pick(['maengelruege', 'maengelruege', 'bonus', 'kulanz'] as const);
  const gegeben: NachlassGegeben =
    anlass === 'bonus'
      ? rng.pick([
          'prozent-netto',
          'prozent-netto',
          'gutschrift-brutto',
          'gutschrift-netto',
        ] as const)
      : rng.pick([
          'prozent-netto',
          'prozent-brutto',
          'gutschrift-brutto',
          'gutschrift-brutto',
          'gutschrift-netto',
        ] as const);
  const methode: NachlassMethode =
    v === 'brutto-methode' ? 'brutto' : rng.pick(['netto', 'netto', 'brutto', 'offen'] as const);
  const make = (r: Rng): ErloesberichtigungParams => {
    let wert: string;
    let satzWert = '0';
    if (gegeben === 'prozent-netto') {
      satzWert =
        anlass === 'bonus'
          ? r.pick(['0.02', '0.03', '0.04', '0.05'])
          : r.pick(['0.05', '0.1', '0.15', '0.2']);
      wert =
        anlass === 'bonus'
          ? betrag(r, 20_000, 300_000, 1_000, krumm)
          : betrag(r, 1_000, 30_000, 100, krumm);
    } else if (gegeben === 'prozent-brutto') {
      satzWert = r.pick(['0.05', '0.1', '0.15', '0.2']);
      wert = krumm
        ? betrag(r, 1_000, 30_000, 1, true)
        : glattBrutto(r, 1_000, 30_000, 100, ustSatz);
    } else if (gegeben === 'gutschrift-brutto') {
      wert = krumm ? betrag(r, 100, 8_000, 1, true) : glattBrutto(r, 100, 8_000, 10, ustSatz);
    } else {
      wert = betrag(r, 100, 8_000, 10, krumm);
    }
    return {
      ...base,
      fall: 'nachlass',
      anlass,
      gegeben,
      betrag: wert,
      satz: satzWert,
      methode,
      ausgleich:
        anlass === 'bonus' && r.chance(0.4) ? 'bank' : r.chance(0.1) ? 'bank' : 'forderung',
    };
  };
  return retry(rng, make, (p) => {
    if (krumm) return true;
    const w = rechneNachlass(p);
    return w.netto.steps === 0 && w.ust.steps === 0 && isExact(w.brutto.exact);
  });
}

export const erloesberichtigung = defineGenerator<
  ErloesberichtigungParams,
  ErloesberichtigungSolution
>({
  skillId: 'D3-erloesberichtigung',
  titel: 'Erlösberichtigungen',
  variants: ['maengelruege', 'bonus', 'brutto-methode', 'abschluss'],
  points: 3,
  generate,
  render,
  solve: solveErloesberichtigung,
  parts,
  steps,
  hints: (p, s) =>
    p.fall === 'abschluss'
      ? [
          'Erlösberichtigungen sind ein Unterkonto der Umsatzerlöse.',
          'Unterkonten werden über ihr Hauptkonto abgeschlossen: Umsatzerlöse an Erlösberichtigungen.',
          `Danach: Umsatzerlöse an GuV ${eur(s.nettoumsatz)}.`,
        ]
      : [
          'Ein nachträglicher Nachlass ist keine Rücksendung: Die Ware bleibt beim Kunden, also Erlösberichtigungen statt Storno.',
          p.gegeben === 'prozent-brutto' || p.gegeben === 'gutschrift-brutto'
            ? `Der Betrag enthält Umsatzsteuer: Netto = Brutto ÷ (1 + ${pct(p.ustSatz)}).`
            : `Auf den Nettonachlass kommt die Umsatzsteuer (${pct(p.ustSatz)}).`,
          p.methode === 'brutto'
            ? `Bruttomethode: erst Erlösberichtigungen ${eur(s.brutto)} an ${p.ausgleich === 'bank' ? 'Bank' : 'Forderungen a. LL'}, dann Umsatzsteuer an Erlösberichtigungen ${eur(s.ust)}.`
            : `Erlösberichtigungen ${eur(s.netto)} und Umsatzsteuer ${eur(s.ust)} an ${p.ausgleich === 'bank' ? 'Bank' : 'Forderungen a. LL'} ${eur(s.brutto)}.`,
        ],
  errorVariants: variants,
  verfahren: (p) =>
    p.fall === 'abschluss'
      ? 'Erlösberichtigungen über Umsatzerlöse abschließen'
      : p.anlass === 'bonus'
        ? 'Bonus an Kunden: Buchung auf Erlösberichtigungen'
        : p.anlass === 'kulanz'
          ? 'Kulanznachlass an Kunden: Buchung auf Erlösberichtigungen'
          : 'Erlösberichtigung wegen Mängelrüge',
});
