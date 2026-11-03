// E5 – Geschäftsgang: von den Anfangsbeständen über laufende und vorbereitende Abschlussbuchungen
// zu Erfolg, Bankkonto und Schlussbilanz. Alle Werte rechnet das Hauptbuch.
import { FIRMA } from '../../config';
import { loesung, satz, zeile, type BuchungsLoesung, type ErwSatz } from '../booking';
import { feld } from '../generators/base';
import { Hauptbuch } from '../hauptbuch';
import { Decimal, Val, dec, formatEuro, type Dec } from '../money';
import { createRng, type Rng } from '../rng';
import type { BuchungPart, ErrorVariant } from '../task';
import type { Fall, FallSchritt } from './types';

const USt = dec('0.19');
const SKONTO = dec('0.02');

export interface GeschaeftsgangParams {
  ab: {
    maschinen: string;
    rohstoffe: string;
    fe: string;
    forderungen: string;
    bank: string;
    darlehen: string;
    verbindlichkeiten: string;
  };
  einkauf: string;
  verkauf: string;
  loehne: string;
  privat: string;
  afa: string;
  sbRohstoffe: string;
  sbFe: string;
  lieferant: string;
  kunde: string;
}

export interface GeschaeftsgangLoesung {
  buchungen: Record<string, BuchungsLoesung>;
  ekAnfang: Dec;
  ertraege: Dec;
  aufwendungen: Dec;
  gewinn: Dec;
  bank: {
    soll: { text: string; betrag: Dec }[];
    haben: { text: string; betrag: Dec }[];
    saldo: Dec;
  };
  ekSchluss: Dec;
  bilanzsumme: Dec;
  /** Kontrolle über das Hauptbuch */
  summeAktiva: Dec;
  summePassiva: Dec;
}

const RECHNUNG = (netto: NumLike) => dec(netto).times(dec(1).plus(USt));
type NumLike = Dec | string | number;

export function generateGeschaeftsgang(rng: Rng): GeschaeftsgangParams {
  for (let i = 0; i < 500; i++) {
    const ab = {
      maschinen: String(rng.step(120_000, 300_000, 10_000)),
      rohstoffe: String(rng.step(20_000, 60_000, 1_000)),
      fe: String(rng.step(10_000, 40_000, 1_000)),
      forderungen: String(rng.step(10_000, 40_000, 1_000)),
      bank: String(rng.step(40_000, 100_000, 1_000)),
      darlehen: String(rng.step(50_000, 150_000, 10_000)),
      verbindlichkeiten: String(rng.step(10_000, 40_000, 1_000)),
    };
    const einkauf = rng.step(10_000, 40_000, 1_000);
    const verkauf = rng.step(60_000, 160_000, 1_000);
    const verfuegbar = Number(ab.rohstoffe) + einkauf * 0.98;
    const sbRohstoffe = rng.step(
      5_000,
      Math.max(6_000, Math.floor((verfuegbar * 0.5) / 1_000) * 1_000),
      1_000,
    );
    const deltaFe = rng.step(2_000, 9_000, 1_000) * (rng.chance(0.5) ? 1 : -1);
    const p: GeschaeftsgangParams = {
      ab,
      einkauf: String(einkauf),
      verkauf: String(verkauf),
      loehne: String(rng.step(8_000, 25_000, 500)),
      privat: String(rng.step(1_000, 5_000, 500)),
      afa: String(Math.round((Number(ab.maschinen) * 0.1) / 1_000) * 1_000),
      sbRohstoffe: String(sbRohstoffe),
      sbFe: String(Number(ab.fe) + deltaFe),
      lieferant: rng.pick(FIRMA.lieferanten.rohstoffe),
      kunde: rng.pick(FIRMA.kunden),
    };
    const s = solveGeschaeftsgang(p);
    if (s.ekAnfang.gt(0) && s.gewinn.gt(0) && s.bank.saldo.gt(5_000)) return p;
  }
  throw new Error('Geschäftsgang: keine passenden Werte gefunden');
}

const V = (x: NumLike) => new Val(x);

export function solveGeschaeftsgang(p: GeschaeftsgangParams): GeschaeftsgangLoesung {
  const a = p.ab;
  const rechnungE = RECHNUNG(p.einkauf);
  const rechnungV = RECHNUNG(p.verkauf);
  const skontoNetto = dec(p.einkauf).times(SKONTO);
  const skontoSteuer = skontoNetto.times(USt);
  const zahlung = rechnungE.minus(skontoNetto).minus(skontoSteuer);
  const verbrauch = dec(a.rohstoffe).plus(p.einkauf).minus(skontoNetto).minus(p.sbRohstoffe);
  const deltaFe = dec(p.sbFe).minus(a.fe);
  const vst = dec(p.einkauf).times(USt).minus(skontoSteuer);
  const ust = dec(p.verkauf).times(USt);
  const zahllast = ust.minus(vst);

  const NACHLASS = 'Nachlässe für Rohstoffe';
  const b: Record<string, BuchungsLoesung> = {
    einkauf: loesung([
      satz(
        [zeile('Rohstoffe', V(p.einkauf)), zeile('Vorsteuer', V(dec(p.einkauf).times(USt)))],
        [zeile('Verbindlichkeiten aus Lieferungen und Leistungen', V(rechnungE))],
      ),
    ]),
    verkauf: loesung([
      satz(
        [zeile('Forderungen aus Lieferungen und Leistungen', V(rechnungV))],
        [zeile('Umsatzerlöse für eigene Erzeugnisse', V(p.verkauf)), zeile('Umsatzsteuer', V(ust))],
      ),
    ]),
    kunde: loesung([
      satz(
        [zeile('Bank', V(a.forderungen))],
        [zeile('Forderungen aus Lieferungen und Leistungen', V(a.forderungen))],
      ),
    ]),
    lieferant: loesung(
      [
        satz(
          [zeile('Verbindlichkeiten aus Lieferungen und Leistungen', V(rechnungE))],
          [
            zeile('Bank', V(zahlung)),
            zeile(NACHLASS, V(skontoNetto)),
            zeile('Vorsteuer', V(skontoSteuer)),
          ],
        ),
      ],
      false,
      'Nettomethode',
    ),
    loehne: loesung([satz([zeile('Löhne', V(p.loehne))], [zeile('Bank', V(p.loehne))])]),
    privat: loesung([satz([zeile('Privat', V(p.privat))], [zeile('Bank', V(p.privat))])]),
    nachlass: loesung([
      satz([zeile(NACHLASS, V(skontoNetto))], [zeile('Rohstoffe', V(skontoNetto))]),
    ]),
    verbrauch: loesung([
      satz([zeile('Aufwendungen für Rohstoffe', V(verbrauch))], [zeile('Rohstoffe', V(verbrauch))]),
    ]),
    afa: loesung([
      satz(
        [zeile('Abschreibungen auf Sachanlagen', V(p.afa))],
        [zeile('Technische Anlagen und Maschinen', V(p.afa))],
      ),
    ]),
    bv: loesung([
      deltaFe.gte(0)
        ? satz(
            [zeile('Fertige Erzeugnisse', V(deltaFe))],
            [zeile('Bestandsveränderungen', V(deltaFe))],
          )
        : satz(
            [zeile('Bestandsveränderungen', V(deltaFe.neg()))],
            [zeile('Fertige Erzeugnisse', V(deltaFe.neg()))],
          ),
    ]),
    ust: loesung(
      [
        satz([zeile('Umsatzsteuer', V(vst))], [zeile('Vorsteuer', V(vst))], 'Verrechnung'),
        satz(
          [zeile('Umsatzsteuer', V(zahllast))],
          [zeile('Schlussbilanzkonto', V(zahllast))],
          'Passivierung der Zahllast',
        ),
      ],
      true,
    ),
    privatAbschluss: loesung([
      satz([zeile('Eigenkapital', V(p.privat))], [zeile('Privat', V(p.privat))]),
    ]),
  };

  // Hauptbuch führen (ohne Abschluss auf das SBK – die Bestände bleiben für die Bilanz stehen)
  const hb = new Hauptbuch();
  const ekAnfang = dec(a.maschinen)
    .plus(a.rohstoffe)
    .plus(a.fe)
    .plus(a.forderungen)
    .plus(a.bank)
    .minus(a.darlehen)
    .minus(a.verbindlichkeiten);
  hb.eroeffne('Technische Anlagen und Maschinen', a.maschinen);
  hb.eroeffne('Rohstoffe', a.rohstoffe);
  hb.eroeffne('Fertige Erzeugnisse', a.fe);
  hb.eroeffne('Forderungen aus Lieferungen und Leistungen', a.forderungen);
  hb.eroeffne('Bank', a.bank);
  hb.eroeffne('Eigenkapital', ekAnfang);
  hb.eroeffne('Darlehensschulden', a.darlehen);
  hb.eroeffne('Verbindlichkeiten aus Lieferungen und Leistungen', a.verbindlichkeiten);
  const ohneSbk = (s: ErwSatz) =>
    ![...s.soll, ...s.haben].some((z) => z.konto === 'Schlussbilanzkonto');
  for (const l of Object.values(b)) for (const s of l.saetze) if (ohneSbk(s)) hb.buche(s);

  const ertraege = hb.kontenVomTyp('ertrag').reduce((x, k) => x.minus(hb.saldo(k)), new Decimal(0));
  const aufwendungen = hb
    .kontenVomTyp('aufwand')
    .reduce((x, k) => x.plus(hb.saldo(k)), new Decimal(0));
  const gewinn = hb.erfolg();
  b.guv = loesung([
    gewinn.gte(0)
      ? satz([zeile('Gewinn- und Verlustkonto', V(gewinn))], [zeile('Eigenkapital', V(gewinn))])
      : satz(
          [zeile('Eigenkapital', V(gewinn.neg()))],
          [zeile('Gewinn- und Verlustkonto', V(gewinn.neg()))],
        ),
  ]);
  // Erfolgskonten über die GuV ins Eigenkapital: im Hauptbuch genügt die Übertragung des Saldos.
  hb.buche(
    satz([zeile('Gewinn- und Verlustkonto', V(gewinn))], [zeile('Eigenkapital', V(gewinn))]),
  );
  for (const k of hb.kontenVomTyp('ertrag', 'aufwand')) {
    const saldo = hb.saldo(k);
    if (saldo.isZero()) continue;
    hb.buche(
      saldo.gt(0)
        ? satz([zeile('Gewinn- und Verlustkonto', V(saldo))], [zeile(k, V(saldo))])
        : satz([zeile(k, V(saldo.neg()))], [zeile('Gewinn- und Verlustkonto', V(saldo.neg()))]),
    );
  }
  const bil = hb.bilanz();
  const bankBuch = hb.konten.get('Bank')!;
  const text = (gegen: string) =>
    gegen === 'Eröffnungsbilanzkonto' ? 'Anfangsbestand (EBK)' : gegen;
  return {
    buchungen: b,
    ekAnfang,
    ertraege,
    aufwendungen,
    gewinn,
    bank: {
      soll: bankBuch.soll.map((x) => ({ text: text(x.gegen), betrag: x.betrag })),
      haben: bankBuch.haben.map((x) => ({ text: text(x.gegen), betrag: x.betrag })),
      saldo: hb.saldo('Bank'),
    },
    ekSchluss: hb.saldo('Eigenkapital').neg(),
    bilanzsumme: bil.summeAktiva,
    summeAktiva: bil.summeAktiva,
    summePassiva: bil.summePassiva,
  };
}

// ---------- Aufgabenteile ----------

function bp(
  id: string,
  titel: string,
  l: BuchungsLoesung,
  alternativen?: BuchungsLoesung[],
): BuchungPart {
  const p: BuchungPart = { typ: 'buchungssatz', id, titel, loesung: l };
  if (alternativen) p.alternativen = alternativen;
  return p;
}

const e = (x: NumLike) => formatEuro(x);

/** Typische Fehler als Varianten: Steuerkonto vertauscht, Soll/Haben vertauscht, Skonto vom Bruttobetrag ohne Steuerkorrektur. */
function laufendeVarianten(p: GeschaeftsgangParams, s: GeschaeftsgangLoesung): ErrorVariant[] {
  const swap = (l: BuchungsLoesung): BuchungsLoesung =>
    loesung(
      l.saetze.map((x) => satz(x.haben, x.soll)),
      l.zusammenfassbar,
    );
  const einkaufUst = loesung([
    satz(
      [zeile('Rohstoffe', V(p.einkauf)), zeile('Umsatzsteuer', V(dec(p.einkauf).times(USt)))],
      [zeile('Verbindlichkeiten aus Lieferungen und Leistungen', V(RECHNUNG(p.einkauf)))],
    ),
  ]);
  const verkaufVst = loesung([
    satz(
      [zeile('Forderungen aus Lieferungen und Leistungen', V(RECHNUNG(p.verkauf)))],
      [
        zeile('Umsatzerlöse für eigene Erzeugnisse', V(p.verkauf)),
        zeile('Vorsteuer', V(dec(p.verkauf).times(USt))),
      ],
    ),
  ]);
  const skontoBrutto = RECHNUNG(p.einkauf).times(SKONTO);
  const ohneKorrektur = loesung([
    satz(
      [zeile('Verbindlichkeiten aus Lieferungen und Leistungen', V(RECHNUNG(p.einkauf)))],
      [
        zeile('Bank', V(RECHNUNG(p.einkauf).minus(skontoBrutto))),
        zeile('Nachlässe für Rohstoffe', V(skontoBrutto)),
      ],
    ),
  ]);
  return [
    {
      fehlertyp: 'steuer-falsches-konto',
      parts: [bp('einkauf', '', einkaufUst), bp('verkauf', '', verkaufVst)],
    },
    { fehlertyp: 'keine-steuerkorrektur', parts: [bp('lieferant', '', ohneKorrektur)] },
    {
      fehlertyp: 'soll-haben-vertauscht',
      parts: (['einkauf', 'verkauf', 'kunde', 'lieferant', 'loehne', 'privat'] as const).map((id) =>
        bp(id, '', swap(s.buchungen[id]!)),
      ),
    },
  ];
}

function abschlussVarianten(s: GeschaeftsgangLoesung): ErrorVariant[] {
  const swap = (l: BuchungsLoesung): BuchungsLoesung =>
    loesung(
      l.saetze.map((x) => satz(x.haben, x.soll)),
      l.zusammenfassbar,
    );
  return [
    { fehlertyp: 'mehrung-als-aufwand', parts: [bp('bv', '', swap(s.buchungen.bv!))] },
    {
      fehlertyp: 'soll-haben-vertauscht',
      parts: (['nachlass', 'verbrauch', 'afa', 'privatAbschluss'] as const).map((id) =>
        bp(id, '', swap(s.buchungen[id]!)),
      ),
    },
  ];
}

export function geschaeftsgangFall(seed: number): Fall {
  const p = generateGeschaeftsgang(createRng(seed));
  const s = solveGeschaeftsgang(p);
  const a = p.ab;
  const B = s.buchungen;
  const skontoNetto = dec(p.einkauf).times(SKONTO);
  const deltaFe = dec(p.sbFe).minus(a.fe);
  const bruttoEinkauf = RECHNUNG(p.einkauf);

  const anfang = {
    spalten: ['Konto', 'Anfangsbestand'],
    zeilen: [
      ['Technische Anlagen und Maschinen', e(a.maschinen)],
      ['Rohstoffe', e(a.rohstoffe)],
      ['Fertige Erzeugnisse', e(a.fe)],
      ['Forderungen aus Lieferungen und Leistungen', e(a.forderungen)],
      ['Bank', e(a.bank)],
      ['Eigenkapital', e(s.ekAnfang)],
      ['Darlehensschulden', e(a.darlehen)],
      ['Verbindlichkeiten aus Lieferungen und Leistungen', e(a.verbindlichkeiten)],
    ],
  };

  const laufend: FallSchritt = {
    id: 'laufend',
    titel: 'Laufende Buchungen',
    skillId: 'E5-geschaeftsgang',
    text: {
      titel: 'Laufende Buchungen',
      kontext: 'Geschäftsjahr der MBG: Januar bis November',
      sachverhalt: [
        `1. Rohstoffeinkauf bei ${p.lieferant} auf Ziel: ${e(p.einkauf)} netto zuzüglich 19 % Umsatzsteuer.`,
        `2. Verkauf eigener Erzeugnisse an ${p.kunde} auf Ziel: ${e(p.verkauf)} netto zuzüglich 19 % Umsatzsteuer.`,
        `3. Ein Kunde überweist den gesamten Anfangsbestand der Forderungen: ${e(a.forderungen)}.`,
        `4. Die MBG begleicht die Rechnung aus 1. (${e(bruttoEinkauf)}) innerhalb der Skontofrist mit 2 % Skonto per Banküberweisung.`,
        `5. Löhne werden per Bank überwiesen: ${e(p.loehne)}.`,
        `6. Frank Wessel entnimmt für private Zwecke ${e(p.privat)} vom Geschäftskonto.`,
      ],
      daten: anfang,
      aufgabe: 'Bilde zu jedem Geschäftsvorfall den Buchungssatz.',
    },
    parts: [
      bp('einkauf', '1. Rohstoffeinkauf auf Ziel', B.einkauf!),
      bp('verkauf', '2. Verkauf auf Ziel', B.verkauf!),
      bp('kunde', '3. Kunde zahlt', B.kunde!),
      bp('lieferant', '4. Zahlung an den Lieferanten mit Skonto', B.lieferant!, [
        loesung(
          [
            satz(
              [zeile('Verbindlichkeiten aus Lieferungen und Leistungen', V(bruttoEinkauf))],
              [
                zeile('Bank', V(bruttoEinkauf.times(dec(1).minus(SKONTO)))),
                zeile('Nachlässe für Rohstoffe', V(bruttoEinkauf.times(SKONTO))),
              ],
              'Zahlung',
            ),
            satz(
              [zeile('Nachlässe für Rohstoffe', V(skontoNetto.times(USt)))],
              [zeile('Vorsteuer', V(skontoNetto.times(USt)))],
              'Steuerkorrektur',
            ),
          ],
          false,
          'Bruttomethode',
        ),
      ]),
      bp('loehne', '5. Lohnzahlung', B.loehne!),
      bp('privat', '6. Privatentnahme', B.privat!),
    ],
    variants: laufendeVarianten(p, s),
    steps: [
      {
        titel: 'Einkauf',
        rechnung: `Vorsteuer = ${e(p.einkauf)} × 19 % = ${e(dec(p.einkauf).times(USt))}`,
        erlaeuterung: 'Beim Einkauf steht die Vorsteuer im Soll.',
      },
      {
        titel: 'Verkauf',
        rechnung: `Umsatzsteuer = ${e(p.verkauf)} × 19 % = ${e(dec(p.verkauf).times(USt))}`,
        erlaeuterung: 'Beim Verkauf steht die Umsatzsteuer im Haben.',
      },
      {
        titel: 'Skonto',
        rechnung: `Skonto brutto = ${e(bruttoEinkauf)} × 2 % = ${e(bruttoEinkauf.times(SKONTO))}; davon netto ${e(skontoNetto)}, Steuer ${e(skontoNetto.times(USt))}`,
        erlaeuterung:
          'Der Skonto mindert die Anschaffungskosten (Nachlässe für Rohstoffe) und die Vorsteuer.',
      },
      {
        titel: 'Privatentnahme',
        erlaeuterung: 'Entnahmen sind kein Aufwand. Sie laufen über das Konto Privat.',
      },
    ],
    hints: [
      'Frage bei jedem Vorfall: Welche Konten ändern sich, nimmt der Bestand zu oder ab?',
      'Einkauf: Vorsteuer im Soll. Verkauf: Umsatzsteuer im Haben. Skonto beim Einkauf korrigiert auch die Vorsteuer.',
      `Skonto: ${e(bruttoEinkauf)} × 2 % = ${e(bruttoEinkauf.times(SKONTO))}, das sind ${e(skontoNetto)} netto und ${e(skontoNetto.times(USt))} Steuer.`,
    ],
    punkte: 12,
  };

  const abschluss: FallSchritt = {
    id: 'abschluss',
    titel: 'Vorbereitende Abschlussbuchungen',
    skillId: 'E5-geschaeftsgang',
    text: {
      titel: 'Vorbereitende Abschlussbuchungen',
      kontext: 'Geschäftsjahr der MBG: Dezember, Jahresabschluss',
      sachverhalt: [
        'Rechne mit den richtigen Buchungen aus Schritt 1 weiter.',
        `a) Das Konto Nachlässe für Rohstoffe wird abgeschlossen.`,
        `b) Schlussbestand Rohstoffe laut Inventur: ${e(p.sbRohstoffe)}. Der Verbrauch wird als Aufwand gebucht.`,
        `c) Abschreibung auf die Maschinen: ${e(p.afa)}.`,
        `d) Schlussbestand Fertige Erzeugnisse laut Inventur: ${e(p.sbFe)} (Anfangsbestand ${e(a.fe)}).`,
        'e) Vorsteuer und Umsatzsteuer werden verrechnet, die Zahllast wird passiviert.',
        'f) Das Privatkonto wird abgeschlossen.',
      ],
      aufgabe: 'Bilde die Buchungssätze a) bis f).',
    },
    parts: [
      bp('nachlass', 'a) Abschluss Nachlässe', B.nachlass!),
      bp('verbrauch', 'b) Rohstoffverbrauch', B.verbrauch!),
      bp('afa', 'c) Abschreibung', B.afa!),
      bp('bv', 'd) Bestandsveränderung', B.bv!),
      bp('ust', 'e) Umsatzsteuer-Abschluss', B.ust!),
      bp('privatAbschluss', 'f) Abschluss Privatkonto', B.privatAbschluss!),
    ],
    variants: abschlussVarianten(s),
    steps: [
      {
        titel: 'Nachlässe',
        rechnung: `Saldo ${e(skontoNetto)} an Rohstoffe`,
        erlaeuterung: 'Unterkonten werden über das Hauptkonto abgeschlossen.',
      },
      {
        titel: 'Verbrauch',
        rechnung: `${e(a.rohstoffe)} + ${e(p.einkauf)} − ${e(skontoNetto)} − ${e(p.sbRohstoffe)} = ${e(dec(a.rohstoffe).plus(p.einkauf).minus(skontoNetto).minus(p.sbRohstoffe))}`,
        erlaeuterung:
          'Anfangsbestand plus Zugänge minus Nachlässe minus Schlussbestand ergibt den Verbrauch.',
      },
      {
        titel: 'Bestandsveränderung',
        rechnung: `${e(p.sbFe)} − ${e(a.fe)} = ${e(deltaFe)}`,
        erlaeuterung: deltaFe.gte(0)
          ? 'Mehrbestand: Fertige Erzeugnisse an Bestandsveränderungen.'
          : 'Minderbestand: Bestandsveränderungen an Fertige Erzeugnisse.',
      },
      {
        titel: 'Umsatzsteuer',
        erlaeuterung:
          'Erst Umsatzsteuer an Vorsteuer mit dem kleineren Betrag, dann die Zahllast an das Schlussbilanzkonto.',
      },
    ],
    hints: [
      'Reihenfolge: erst Unterkonten abschließen, dann Inventurwerte einbuchen, zum Schluss die Steuer verrechnen.',
      'Verbrauch = Anfangsbestand + Zugänge − Nachlässe − Schlussbestand. Mehrbestand Fertige Erzeugnisse ist ein Ertrag.',
      'Privatentnahmen mindern das Eigenkapital: Eigenkapital an Privat.',
    ],
    punkte: 12,
  };

  const erfolg: FallSchritt = {
    id: 'erfolg',
    titel: 'Erfolg ermitteln',
    skillId: 'E5-geschaeftsgang',
    text: {
      titel: 'Erfolg ermitteln',
      kontext: 'Jahresabschluss: Gewinn- und Verlustkonto',
      sachverhalt: [
        'Rechne mit den richtigen Buchungen aus Schritt 1 und 2 weiter.',
        'Alle Aufwands- und Ertragskonten werden über das Gewinn- und Verlustkonto abgeschlossen.',
      ],
      aufgabe:
        'Ermittle die Summe der Erträge, die Summe der Aufwendungen und den Erfolg. Bilde den Buchungssatz für den Abschluss des Gewinn- und Verlustkontos. Rechne Bestandsveränderungen als Ertrag (Minderbestand mindert die Erträge).',
    },
    parts: [
      {
        typ: 'rechenkette',
        id: 'guv',
        titel: 'Gewinn- und Verlustkonto',
        felder: [
          feld('ertraege', 'Summe der Erträge', V(s.ertraege)),
          feld('aufwendungen', 'Summe der Aufwendungen', V(s.aufwendungen)),
          feld('gewinn', 'Gewinn', V(s.gewinn)),
        ],
      },
      bp('guvAbschluss', 'Abschluss des Gewinn- und Verlustkontos', B.guv!),
    ],
    variants: [
      {
        fehlertyp: 'soll-haben-vertauscht',
        parts: [bp('guvAbschluss', '', loesung(B.guv!.saetze.map((x) => satz(x.haben, x.soll))))],
      },
    ],
    steps: [
      {
        titel: 'Erträge',
        rechnung: `Umsatzerlöse ${e(p.verkauf)} ${deltaFe.gte(0) ? '+' : '−'} Bestandsveränderung ${e(deltaFe.abs())} = ${e(s.ertraege)}`,
      },
      {
        titel: 'Aufwendungen',
        rechnung: `Rohstoffe ${e(dec(a.rohstoffe).plus(p.einkauf).minus(skontoNetto).minus(p.sbRohstoffe))} + Löhne ${e(p.loehne)} + Abschreibung ${e(p.afa)} = ${e(s.aufwendungen)}`,
      },
      {
        titel: 'Gewinn',
        rechnung: `${e(s.ertraege)} − ${e(s.aufwendungen)} = ${e(s.gewinn)}`,
        erlaeuterung:
          'Ein Gewinn erhöht das Eigenkapital: Gewinn- und Verlustkonto an Eigenkapital.',
      },
    ],
    hints: [
      'Erträge: Umsatzerlöse und Bestandsveränderungen. Aufwendungen: Rohstoffverbrauch, Löhne, Abschreibung.',
      'Die Privatentnahme ist kein Aufwand und gehört nicht in die GuV.',
      'Gewinn = Erträge − Aufwendungen. Er steht im Gewinn- und Verlustkonto im Soll und geht ins Eigenkapital (Haben).',
    ],
    punkte: 6,
  };

  const bank: FallSchritt = {
    id: 'bank',
    titel: 'Bankkonto abschließen',
    skillId: 'E5-geschaeftsgang',
    text: {
      titel: 'Bankkonto abschließen',
      kontext: 'Jahresabschluss: Bestandskonten',
      sachverhalt: ['So sieht das Konto Bank nach allen Buchungen aus.'],
      aufgabe: 'Ermittle den Schlussbestand, die Seite des Saldos und das Gegenkonto.',
    },
    parts: [
      {
        typ: 'tkonto',
        id: 'bank',
        titel: 'Konto Bank',
        konto: 'Bank',
        soll: s.bank.soll.map((x) => ({ text: x.text, betrag: x.betrag.toFixed(2) })),
        haben: s.bank.haben.map((x) => ({ text: x.text, betrag: x.betrag.toFixed(2) })),
        felder: [
          feld('saldo', 'Schlussbestand Bank', V(s.bank.saldo)),
          {
            typ: 'auswahl',
            id: 'seite',
            label: 'Seite des Saldos',
            optionen: ['Soll', 'Haben'],
            soll: 'Haben',
          },
          {
            typ: 'auswahl',
            id: 'gegenkonto',
            label: 'Gegenkonto',
            optionen: ['Schlussbilanzkonto', 'Gewinn- und Verlustkonto', 'Eigenkapital'],
            soll: 'Schlussbilanzkonto',
          },
        ],
      },
    ],
    variants: [],
    steps: [
      {
        titel: 'Saldo',
        rechnung: `Soll ${e(s.bank.soll.reduce((x, y) => x.plus(y.betrag), new Decimal(0)))} − Haben ${e(s.bank.haben.reduce((x, y) => x.plus(y.betrag), new Decimal(0)))} = ${e(s.bank.saldo)}`,
      },
      {
        titel: 'Abschluss',
        erlaeuterung:
          'Bei einem Aktivkonto steht der Schlussbestand auf der kleineren Seite, also im Haben. Gegenkonto ist das Schlussbilanzkonto: Schlussbilanzkonto an Bank.',
      },
    ],
    hints: [
      'Addiere beide Seiten. Der Saldo gleicht die kleinere Seite aus.',
      'Bank ist ein Aktivkonto: Zugänge im Soll, Abgänge im Haben.',
      'Bestandskonten werden über das Schlussbilanzkonto abgeschlossen, Erfolgskonten über die GuV.',
    ],
    punkte: 3,
  };

  const bilanz: FallSchritt = {
    id: 'bilanz',
    titel: 'Schlussbilanz',
    skillId: 'E5-geschaeftsgang',
    text: {
      titel: 'Schlussbilanz',
      kontext: 'Jahresabschluss: Schlussbilanzkonto',
      sachverhalt: ['Rechne mit allen richtigen Werten aus den Schritten 1 bis 4 weiter.'],
      aufgabe: 'Ermittle das Eigenkapital zum Jahresende und die Bilanzsumme.',
    },
    parts: [
      {
        typ: 'rechenkette',
        id: 'sbk',
        titel: 'Schlussbilanz',
        felder: [
          feld('ek', 'Eigenkapital zum Jahresende', V(s.ekSchluss)),
          feld('summe', 'Bilanzsumme', V(s.bilanzsumme)),
        ],
      },
    ],
    variants: [
      {
        fehlertyp: 'privat-als-aufwand',
        parts: [
          {
            typ: 'rechenkette',
            id: 'sbk',
            titel: '',
            felder: [feld('ek', '', V(s.ekAnfang.plus(s.gewinn)))],
          },
        ],
      },
    ],
    steps: [
      {
        titel: 'Eigenkapital',
        rechnung: `${e(s.ekAnfang)} − Privat ${e(p.privat)} + Gewinn ${e(s.gewinn)} = ${e(s.ekSchluss)}`,
      },
      {
        titel: 'Bilanzsumme',
        rechnung: `Aktiva: Maschinen ${e(dec(a.maschinen).minus(p.afa))}, Rohstoffe ${e(p.sbRohstoffe)}, Fertige Erzeugnisse ${e(p.sbFe)}, Forderungen ${e(RECHNUNG(p.verkauf))}, Bank ${e(s.bank.saldo)} = ${e(s.summeAktiva)}`,
        erlaeuterung: `Probe: Passiva (Eigenkapital, Darlehen, Verbindlichkeiten, Zahllast) ergeben ebenfalls ${e(s.summePassiva)}.`,
      },
    ],
    hints: [
      'Eigenkapital am Ende = Anfangsbestand − Entnahmen + Gewinn.',
      'Die Bilanzsumme ist die Summe aller Schlussbestände der Aktivkonten.',
      'Vergiss die Forderungen aus dem Verkauf (brutto) nicht. Die alten Forderungen sind bezahlt.',
    ],
    punkte: 4,
  };

  return {
    id: 'geschaeftsgang',
    titel: 'Ein Geschäftsjahr der MBG',
    seed,
    einleitung: [
      'Du begleitest die MBG durch ein ganzes Geschäftsjahr: von den Anfangsbeständen über die laufenden Buchungen bis zur Schlussbilanz.',
      'Jeder Schritt wird für sich bewertet. Danach geht es mit der richtigen Lösung weiter, ein Fehler zieht also keine weiteren Fehler nach sich.',
    ],
    schritte: [laufend, abschluss, erfolg, bank, bilanz],
  };
}
