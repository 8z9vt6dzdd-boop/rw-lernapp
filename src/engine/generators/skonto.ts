// C5 / D4 – Skonto im Einkauf und Verkauf (03-aufgabentypen.md, Teil 3).
import { loesung, satz, zeile, type BuchungsLoesung } from '../booking';
import { nachlassKonto, STOFF_LISTE, type Stoff } from '../accounts';
import { Val, dec } from '../money';
import type { Rng } from '../rng';
import type { ErrorVariant, GenOptions, TaskPart } from '../task';
import type { FirmaConfig } from '../firma';
import {
  betrag as zufallsBetrag,
  defineGenerator,
  eur,
  feld,
  isExact,
  isKrumm,
  pct,
  retry,
} from './base';
import { FIRMA } from '../../config';

export type SkontoSeite = 'einkauf' | 'verkauf';
export type SkontoArt = Stoff | 'Anlagegut';
export type SkontoMethode = 'netto' | 'brutto' | 'offen';

export interface SkontoParams {
  seite: SkontoSeite;
  /** Einkauf: Stoff oder Anlagegut; Verkauf: immer eigene Erzeugnisse. */
  art: SkontoArt | 'Erzeugnisse';
  anlagekonto?: string;
  methode: SkontoMethode;
  gegeben: 'rechnung' | 'zahlbetrag';
  /** Rechnungsbetrag brutto bzw. Zahlbetrag (je nach `gegeben`), Dezimal-String in €. */
  betrag: string;
  skontoSatz: string;
  ustSatz: string;
  partner: string;
  gegenstand: string;
  vorlage: number;
}

export interface SkontoSolution {
  rechnung: Val;
  skontoBrutto: Val;
  skontoNetto: Val;
  steuer: Val;
  zahlbetrag: Val;
  buchung: BuchungsLoesung;
  alternativen: BuchungsLoesung[];
}

interface Rechenweg {
  ustSatz?: string;
  zahlbetragFalsch?: boolean;
  skontoVomNetto?: boolean;
}

export function rechneSkonto(p: SkontoParams, w: Rechenweg = {}) {
  const s = dec(p.skontoSatz);
  const u = dec(w.ustSatz ?? p.ustSatz);
  let rechnung: Val;
  let skontoBrutto: Val;
  let zahlbetrag: Val;
  if (p.gegeben === 'rechnung') {
    rechnung = new Val(p.betrag);
    const basis = w.skontoVomNetto ? rechnung.div(dec(1).plus(u)).fix() : rechnung;
    skontoBrutto = basis.times(s).fix();
    zahlbetrag = rechnung.minus(skontoBrutto);
  } else {
    zahlbetrag = new Val(p.betrag);
    rechnung = (
      w.zahlbetragFalsch ? zahlbetrag.times(dec(1).plus(s)) : zahlbetrag.div(dec(1).minus(s))
    ).fix();
    skontoBrutto = rechnung.minus(zahlbetrag);
  }
  const skontoNetto = skontoBrutto.div(dec(1).plus(u)).fix();
  const steuer = skontoBrutto.minus(skontoNetto);
  return { rechnung, skontoBrutto, skontoNetto, steuer, zahlbetrag };
}

type Werte = ReturnType<typeof rechneSkonto>;

function buchungen(
  p: SkontoParams,
  v: Werte,
  opts: { ohneSteuer?: boolean; steuerKonto?: string; minderungsKonto?: string } = {},
): { netto: BuchungsLoesung; brutto: BuchungsLoesung } {
  const { rechnung, skontoBrutto, skontoNetto, steuer, zahlbetrag } = v;
  if (p.seite === 'einkauf') {
    const steuerKonto = opts.steuerKonto ?? 'Vorsteuer';
    const minderung =
      opts.minderungsKonto ??
      (p.art === 'Anlagegut'
        ? (p.anlagekonto ?? 'Technische Anlagen und Maschinen')
        : nachlassKonto(p.art as Stoff));
    const netto = opts.ohneSteuer
      ? loesung([
          satz(
            [zeile('Verbindlichkeiten aus Lieferungen und Leistungen', rechnung)],
            [zeile('Bank', zahlbetrag), zeile(minderung, skontoBrutto)],
          ),
        ])
      : loesung(
          [
            satz(
              [zeile('Verbindlichkeiten aus Lieferungen und Leistungen', rechnung)],
              [
                zeile('Bank', zahlbetrag),
                zeile(minderung, skontoNetto),
                zeile(steuerKonto, steuer),
              ],
            ),
          ],
          false,
          'Nettomethode',
        );
    const brutto = loesung(
      [
        satz(
          [zeile('Verbindlichkeiten aus Lieferungen und Leistungen', rechnung)],
          [zeile('Bank', zahlbetrag), zeile(minderung, skontoBrutto)],
          'Zahlung',
        ),
        ...(opts.ohneSteuer
          ? []
          : [satz([zeile(minderung, steuer)], [zeile(steuerKonto, steuer)], 'Steuerkorrektur')]),
      ],
      false,
      'Bruttomethode',
    );
    return { netto, brutto };
  }
  const steuerKonto = opts.steuerKonto ?? 'Umsatzsteuer';
  const netto = opts.ohneSteuer
    ? loesung([
        satz(
          [zeile('Bank', zahlbetrag), zeile('Erlösberichtigungen', skontoBrutto)],
          [zeile('Forderungen aus Lieferungen und Leistungen', rechnung)],
        ),
      ])
    : loesung(
        [
          satz(
            [
              zeile('Bank', zahlbetrag),
              zeile('Erlösberichtigungen', skontoNetto),
              zeile(steuerKonto, steuer),
            ],
            [zeile('Forderungen aus Lieferungen und Leistungen', rechnung)],
          ),
        ],
        false,
        'Nettomethode',
      );
  const brutto = loesung(
    [
      satz(
        [zeile('Bank', zahlbetrag), zeile('Erlösberichtigungen', skontoBrutto)],
        [zeile('Forderungen aus Lieferungen und Leistungen', rechnung)],
        'Zahlungseingang',
      ),
      ...(opts.ohneSteuer
        ? []
        : [
            satz(
              [zeile(steuerKonto, steuer)],
              [zeile('Erlösberichtigungen', steuer)],
              'Steuerkorrektur',
            ),
          ]),
    ],
    false,
    'Bruttomethode',
  );
  return { netto, brutto };
}

export function solveSkonto(p: SkontoParams): SkontoSolution {
  const v = rechneSkonto(p);
  const { netto, brutto } = buchungen(p, v);
  const methode = p.art === 'Anlagegut' ? 'netto' : p.methode;
  const buchung = methode === 'brutto' ? brutto : netto;
  const alternativen = methode === 'offen' ? [brutto] : [];
  return { ...v, buchung, alternativen };
}

function skontoParts(
  p: SkontoParams,
  s: Omit<SkontoSolution, 'alternativen'> & { alternativen: BuchungsLoesung[] },
): TaskPart[] {
  const felder =
    p.gegeben === 'rechnung'
      ? [
          feld('skonto-brutto', 'Skonto brutto', s.skontoBrutto),
          feld('skonto-netto', 'Skonto netto', s.skontoNetto),
          feld(
            'steuer',
            p.seite === 'einkauf' ? 'Vorsteuerkorrektur' : 'Umsatzsteuerkorrektur',
            s.steuer,
          ),
          feld(
            'zahlbetrag',
            p.seite === 'einkauf' ? 'Überweisungsbetrag' : 'Zahlungseingang',
            s.zahlbetrag,
          ),
        ]
      : [
          feld('rechnung', 'Rechnungsbetrag (brutto)', s.rechnung),
          feld('skonto-brutto', 'Skonto brutto', s.skontoBrutto),
          feld('skonto-netto', 'Skonto netto', s.skontoNetto),
          feld(
            'steuer',
            p.seite === 'einkauf' ? 'Vorsteuerkorrektur' : 'Umsatzsteuerkorrektur',
            s.steuer,
          ),
        ];
  const buchung: TaskPart = {
    typ: 'buchungssatz',
    id: 'buchung',
    titel:
      s.buchung.saetze.length > 1
        ? 'Buchungssätze (Zahlung und Steuerkorrektur)'
        : 'Buchungssatz für den Zahlungsausgleich',
    loesung: s.buchung,
  };
  if (s.alternativen.length > 0) buchung.alternativen = s.alternativen;
  return [{ typ: 'rechenkette', id: 'rechnung', titel: 'Skonto zerlegen', felder }, buchung];
}

const GEGENSTAENDE: Record<SkontoArt, string[]> = {
  // Reihenfolge passend zu den Lieferanten in config.ts
  Rohstoffe: ['Aromen', 'Zitrusaromen', 'Fruchtsaftkonzentrat', 'Tequila-Aroma'],
  Hilfsstoffe: ['Dosen', 'Etiketten', 'Verschlüsse'],
  Betriebsstoffe: ['Kohlensäure (CO₂)', 'Reinigungsmittel für die Abfüllanlage'],
  'Vorprodukte und Fremdbauteile': ['Getränkegrundstoff'],
  Handelswaren: ['Weißwein „Liboriwein“', 'Vodka „Domkreuz Vodka“'],
  Anlagegut: [
    'eine Etikettiermaschine',
    'einen Lagertank',
    'einen Gabelstapler',
    'Büromöbel für die Verwaltung',
  ],
};

const ANLAGEKONTO: Record<string, string> = {
  'eine Etikettiermaschine': 'Technische Anlagen und Maschinen',
  'einen Lagertank': 'Technische Anlagen und Maschinen',
  'einen Gabelstapler': 'Fuhrpark',
  'Büromöbel für die Verwaltung': 'Betriebs- und Geschäftsausstattung',
};

function lieferantFuer(art: SkontoArt, firma: FirmaConfig, index: number): string {
  const l = firma.lieferanten;
  const map: Record<SkontoArt, string[]> = {
    Rohstoffe: l.rohstoffe,
    Hilfsstoffe: l.hilfsstoffe,
    Betriebsstoffe: l.betriebsstoffe,
    'Vorprodukte und Fremdbauteile': l.vorprodukte,
    Handelswaren: l.handelswaren,
    Anlagegut: l.anlagen,
  };
  const liste = map[art];
  return liste[index % liste.length]!;
}

function generateSkonto(
  seite: SkontoSeite,
  rng: Rng,
  opts: GenOptions,
  firma: FirmaConfig,
): SkontoParams {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const art: SkontoParams['art'] =
    seite === 'verkauf'
      ? 'Erzeugnisse'
      : rng.pick<SkontoArt>([
          ...STOFF_LISTE,
          'Rohstoffe',
          'Hilfsstoffe',
          'Handelswaren',
          'Anlagegut',
        ]);
  const variant = opts.variant;
  const methode: SkontoMethode =
    variant === 'netto-methode'
      ? 'netto'
      : variant === 'brutto-methode'
        ? 'brutto'
        : rng.pick(['netto', 'netto', 'brutto', 'offen'] as const);
  const gegeben =
    variant === 'zahlbetrag' ? 'zahlbetrag' : rng.chance(0.25) ? 'zahlbetrag' : 'rechnung';
  const skontoSatz = rng.pick(['0.01', '0.02', '0.02', '0.025', '0.03']);
  const ustSatz = '0.19';
  const index = art === 'Erzeugnisse' ? 0 : rng.int(0, GEGENSTAENDE[art].length - 1);
  const gegenstand =
    art === 'Erzeugnisse'
      ? rng.pick(Object.values(firma.produkte).slice(0, 3))
      : GEGENSTAENDE[art][index]!;
  const partner =
    seite === 'verkauf' ? rng.pick(firma.kunden) : lieferantFuer(art as SkontoArt, firma, index);
  const make = (r: Rng): SkontoParams => {
    // Klausurfreundlich: Nettowert in vollen 100 €, daraus Brutto; krumm: beliebiger Centbetrag.
    const rechnung = krumm
      ? zufallsBetrag(r, 500, 60_000, 1, true)
      : dec(r.step(500, 50_000, 100))
          .times(dec(1).plus(ustSatz))
          .toFixed(2);
    const betrag =
      gegeben === 'rechnung'
        ? rechnung
        : dec(rechnung).minus(dec(rechnung).times(skontoSatz).toDecimalPlaces(2)).toFixed(2);
    const base: SkontoParams = {
      seite,
      art,
      methode,
      gegeben,
      betrag,
      skontoSatz,
      ustSatz,
      partner,
      gegenstand,
      vorlage: r.int(0, 1),
    };
    if (art === 'Anlagegut')
      base.anlagekonto = ANLAGEKONTO[gegenstand] ?? 'Technische Anlagen und Maschinen';
    return base;
  };
  return retry(rng, make, (p) => {
    if (krumm) return true;
    const v = rechneSkonto(p);
    return (
      isExact(v.skontoBrutto.exact) && isExact(v.skontoNetto.exact) && isExact(v.rechnung.exact)
    );
  });
}

function renderSkonto(p: SkontoParams) {
  const s = pct(p.skontoSatz);
  const u = pct(p.ustSatz);
  const methodeText =
    p.art === 'Anlagegut'
      ? ''
      : p.methode === 'netto'
        ? ' Buche nach der Nettomethode.'
        : p.methode === 'brutto'
          ? ' Buche nach der Bruttomethode (Zahlung und anschließende Steuerkorrektur getrennt).'
          : '';
  const sachverhalt: string[] = [];
  if (p.seite === 'einkauf') {
    const artText = p.art === 'Anlagegut' ? `${p.gegenstand} (Anlagegut)` : p.gegenstand;
    if (p.gegeben === 'rechnung') {
      sachverhalt.push(
        p.vorlage === 0
          ? `Die MBG hat bei ${p.partner} ${artText} auf Ziel gekauft. Die Eingangsrechnung lautet über ${eur(p.betrag)} einschließlich ${u} Umsatzsteuer.`
          : `Für eine Lieferung ${artText} liegt eine Eingangsrechnung von ${p.partner} über ${eur(p.betrag)} (inkl. ${u} USt) vor.`,
        `Die MBG überweist innerhalb der Skontofrist unter Abzug von ${s} Skonto per Bank.`,
      );
    } else {
      sachverhalt.push(
        `Die MBG begleicht eine Eingangsrechnung von ${p.partner} für ${artText} (inkl. ${u} USt) innerhalb der Skontofrist.`,
        `Nach Abzug von ${s} Skonto werden ${eur(p.betrag)} per Bank überwiesen.`,
      );
    }
  } else if (p.gegeben === 'rechnung') {
    sachverhalt.push(
      p.vorlage === 0
        ? `${p.partner} hat von der MBG ${p.gegenstand} auf Ziel erhalten. Die Ausgangsrechnung lautet über ${eur(p.betrag)} einschließlich ${u} Umsatzsteuer.`
        : `Die MBG hat eine Lieferung ${p.gegenstand} an ${p.partner} über ${eur(p.betrag)} (inkl. ${u} USt) berechnet.`,
      `Der Kunde zahlt innerhalb der Skontofrist unter Abzug von ${s} Skonto auf das Bankkonto der MBG.`,
    );
  } else {
    sachverhalt.push(
      `Auf dem Bankkonto der MBG geht eine Zahlung von ${p.partner} über ${eur(p.betrag)} ein.`,
      `Damit gleicht der Kunde eine Rechnung für ${p.gegenstand} (inkl. ${u} USt) unter Abzug von ${s} Skonto aus.`,
    );
  }
  return {
    titel: p.seite === 'einkauf' ? 'Skonto im Einkauf' : 'Skonto im Verkauf',
    kontext:
      p.seite === 'einkauf'
        ? 'Februar: Einkauf für die Sommersaison'
        : 'Mai: Saisonstart Gastronomie',
    sachverhalt,
    aufgabe:
      (p.gegeben === 'rechnung'
        ? 'Zerlege den Skonto und bilde die Buchung für den Zahlungsausgleich.'
        : 'Ermittle zuerst den Rechnungsbetrag, zerlege den Skonto und bilde die Buchung.') +
      methodeText,
  };
}

function skontoVariants(p: SkontoParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Rechenweg, opts: Parameters<typeof buchungen>[2] = {}) => {
    const v = rechneSkonto(p, w);
    const b = buchungen(p, v, opts);
    const methode = p.art === 'Anlagegut' ? 'netto' : p.methode;
    const buchung = methode === 'brutto' ? b.brutto : b.netto;
    out.push({ fehlertyp, parts: skontoParts(p, { ...v, buchung, alternativen: [] }) });
  };
  if (p.gegeben === 'rechnung') add('skonto-vom-netto', { skontoVomNetto: true });
  else add('skonto-auf-zahlbetrag', { zahlbetragFalsch: true });
  add('falscher-steuersatz', { ustSatz: p.ustSatz === '0.19' ? '0.16' : '0.19' });
  // Steuerkorrektur vergessen
  {
    const v = rechneSkonto(p);
    const b = buchungen(
      p,
      { ...v, skontoNetto: v.skontoBrutto, steuer: new Val(0) },
      { ohneSteuer: true },
    );
    const buchung = p.methode === 'brutto' && p.art !== 'Anlagegut' ? b.brutto : b.netto;
    out.push({
      fehlertyp: 'keine-steuerkorrektur',
      parts: skontoParts(p, {
        ...v,
        skontoNetto: v.skontoBrutto,
        steuer: new Val(0),
        buchung,
        alternativen: [],
      }),
    });
  }
  add(
    'steuer-falsches-konto',
    {},
    { steuerKonto: p.seite === 'einkauf' ? 'Umsatzsteuer' : 'Vorsteuer' },
  );
  if (p.art === 'Anlagegut') {
    for (const stoff of [...STOFF_LISTE, 'Handelswaren'] as const) {
      add('nachlass-statt-anlagekonto', {}, { minderungsKonto: nachlassKonto(stoff) });
    }
  }
  return out;
}

function skontoSteps(p: SkontoParams, s: SkontoSolution) {
  const u = pct(p.ustSatz);
  const steps = [];
  if (p.gegeben === 'zahlbetrag') {
    steps.push({
      titel: 'Rechnungsbetrag zurückrechnen',
      rechnung: `${eur(p.betrag)} ÷ (1 − ${pct(p.skontoSatz)}) = ${eur(s.rechnung)}`,
      erlaeuterung: 'Der Zahlbetrag entspricht 100 % minus Skontosatz der Rechnung.',
    });
  }
  steps.push(
    {
      titel: 'Skonto brutto',
      rechnung:
        p.gegeben === 'rechnung'
          ? `${eur(s.rechnung)} × ${pct(p.skontoSatz)} = ${eur(s.skontoBrutto)}`
          : `${eur(s.rechnung)} − ${eur(s.zahlbetrag)} = ${eur(s.skontoBrutto)}`,
    },
    {
      titel: 'Skonto netto',
      rechnung: `${eur(s.skontoBrutto)} ÷ (1 + ${u}) = ${eur(s.skontoNetto)}`,
    },
    {
      titel: p.seite === 'einkauf' ? 'Vorsteuerkorrektur' : 'Umsatzsteuerkorrektur',
      rechnung: `${eur(s.skontoBrutto)} − ${eur(s.skontoNetto)} = ${eur(s.steuer)}`,
      erlaeuterung:
        p.seite === 'einkauf'
          ? 'Die beim Einkauf abgezogene Vorsteuer war zu hoch und wird im Haben korrigiert.'
          : 'Die beim Verkauf gebuchte Umsatzsteuer war zu hoch und wird im Soll korrigiert.',
    },
  );
  if (p.gegeben === 'rechnung') {
    steps.push({
      titel: 'Zahlbetrag',
      rechnung: `${eur(s.rechnung)} − ${eur(s.skontoBrutto)} = ${eur(s.zahlbetrag)}`,
    });
  }
  if (p.art === 'Anlagegut') {
    steps.push({
      titel: 'Buchung',
      erlaeuterung: `Skonto auf ein Anlagegut mindert die Anschaffungskosten: Der Nettoskonto wird direkt auf dem Konto ${p.anlagekonto} im Haben gebucht.`,
    });
  }
  return steps;
}

function skontoHints(p: SkontoParams): [string, string, string] {
  const steuer = p.seite === 'einkauf' ? 'Vorsteuer' : 'Umsatzsteuer';
  return [
    p.gegeben === 'rechnung'
      ? 'Schema: Skonto brutto → Skonto netto → Steuerkorrektur → Zahlbetrag. Danach buchen.'
      : 'Der Zahlbetrag ist schon um den Skonto gemindert. Rechne zuerst auf den Rechnungsbetrag zurück.',
    `Skonto netto = Skonto brutto ÷ (1 + ${pct(p.ustSatz)}). Die Differenz korrigiert das Konto ${steuer}.`,
    p.seite === 'einkauf'
      ? `Im Soll steht die Verbindlichkeit in voller Rechnungshöhe. Im Haben: Bank (Zahlbetrag), ${
          p.art === 'Anlagegut' ? p.anlagekonto : nachlassKonto(p.art as Stoff)
        } und ${steuer}.`
      : `Im Haben steht die Forderung in voller Rechnungshöhe. Im Soll: Bank (Zahlbetrag), Erlösberichtigungen und ${steuer}.`,
  ];
}

function makeSkontoGenerator(seite: SkontoSeite, skillId: string, firmaDefault: () => FirmaConfig) {
  return defineGenerator<SkontoParams, SkontoSolution>({
    skillId,
    titel: seite === 'einkauf' ? 'Skonto im Einkauf' : 'Skonto im Verkauf',
    variants: ['netto-methode', 'brutto-methode', 'zahlbetrag'],
    points: 4,
    generate: (rng, opts = {}) => generateSkonto(seite, rng, opts, firmaDefault()),
    render: (p) => renderSkonto(p),
    solve: solveSkonto,
    parts: skontoParts,
    steps: skontoSteps,
    hints: (p) => skontoHints(p),
    errorVariants: skontoVariants,
    verfahren: () =>
      seite === 'einkauf'
        ? 'Lieferantenskonto: Skonto zerlegen, Vorsteuer korrigieren'
        : 'Kundenskonto: Skonto zerlegen, Umsatzsteuer korrigieren',
  });
}

export const skontoEinkauf = makeSkontoGenerator('einkauf', 'C5-skonto-einkauf', () => FIRMA);
export const skontoVerkauf = makeSkontoGenerator('verkauf', 'D4-skonto-verkauf', () => FIRMA);
