// A5 – Einfache und zusammengesetzte Buchungssätze ohne Umsatzsteuer (BA 2.3.1.5, 2.3.2.2;
// eigene Formulierung und Zahlen). Varianten: einzelner Vorfall, zusammengesetzter Satz,
// Analyse in Schritten (Kontenart, Zu-/Abnahme) und Serie mehrerer Vorfälle.
// Spezifikation: docs/m7/a.md.
import { FIRMA } from '../../../config';
import { getKonto } from '../../accounts';
import { loesung, satz, zeile, type BuchungsLoesung, type ErwSatz } from '../../booking';
import { Val } from '../../money';
import type { Rng } from '../../rng';
import type {
  BuchungPart,
  ErrorVariant,
  Feld,
  GenOptions,
  RechenkettePart,
  SolutionStep,
  TaskPart,
  TaskText,
} from '../../task';
import { betrag, defineGenerator, eur, isKrumm } from '../base';
import {
  AKTIVKONTO,
  AUFWANDSKONTO,
  BANK,
  DARLEHEN,
  ERTRAGSKONTO,
  FORD,
  KASSE,
  KONTENART_LABEL,
  KONTENARTEN,
  PASSIVKONTO,
  VERB,
  auswahl,
  kontenart,
  zugangsSeite,
} from './gemeinsam';

const ZW = 'a-zahlungsweg-verwechselt';
const ZZ = 'a-ziel-zahlung-verwechselt';
const FV = 'a-forderung-verbindlichkeit-verwechselt';
const AN = 'a-anlage-als-aufwand';
const AEK = 'a-aufwand-ertrag-konto';
const VB = 'a-verkauf-als-bestandsabgang';
const TZ = 'a-tilgung-als-aufwand';
const TG = 'a-teilbetrag-falsch';
const SH = 'soll-haben-vertauscht';
const AP = 'a-aktiv-passiv-vertauscht';
const AE = 'a-aufwand-ertrag-vertauscht';
const ZA = 'a-zugang-abgang-verwechselt';

const UE = 'Umsatzerlöse für eigene Erzeugnisse';
const SBA = 'Sonstige betriebliche Aufwendungen';

const ZUNAHME = 'nimmt zu';
const ABNAHME = 'nimmt ab';

// ---------- Vorlagen ----------

/** Ein Ersatz in genau einer Zeile: Konto auf einer Seite gegen ein anderes tauschen. */
interface Ersatz {
  fehlertyp: string;
  seite: 'soll' | 'haben';
  statt: string;
  durch: string;
}

interface EinfachVorlage {
  id: string;
  text: string;
  soll: string;
  haben: string;
  spanne: [number, number, number];
  fehler: Ersatz[];
}

const P = FIRMA.produkte;

const EINFACH: readonly EinfachVorlage[] = [
  {
    id: 'roh-ziel',
    text: 'Das Aromahaus liefert Zitronenaroma auf Ziel.',
    soll: 'Rohstoffe',
    haben: VERB,
    spanne: [2_000, 25_000, 100],
    fehler: [{ fehlertyp: ZZ, seite: 'haben', statt: VERB, durch: BANK }],
  },
  {
    id: 'hilfs-ziel',
    text: 'Das Dosenwerk liefert Leerdosen auf Rechnung.',
    soll: 'Hilfsstoffe',
    haben: VERB,
    spanne: [2_000, 20_000, 100],
    fehler: [{ fehlertyp: ZZ, seite: 'haben', statt: VERB, durch: BANK }],
  },
  {
    id: 'betriebs-bank',
    text: 'Reinigungsmittel für die Abfüllanlage werden gekauft und sofort überwiesen.',
    soll: 'Betriebsstoffe',
    haben: BANK,
    spanne: [500, 6_000, 50],
    fehler: [{ fehlertyp: ZZ, seite: 'haben', statt: BANK, durch: VERB }],
  },
  {
    id: 'fuhrpark-bank',
    text: 'Ein gebrauchter Gabelstapler wird gekauft und per Bank bezahlt.',
    soll: 'Fuhrpark',
    haben: BANK,
    spanne: [5_000, 30_000, 500],
    fehler: [{ fehlertyp: AN, seite: 'soll', statt: 'Fuhrpark', durch: SBA }],
  },
  {
    id: 'bga-ziel',
    text: 'Für die Verwaltung werden Regale und Schreibtische auf Ziel gekauft.',
    soll: 'Betriebs- und Geschäftsausstattung',
    haben: VERB,
    spanne: [2_000, 15_000, 100],
    fehler: [
      { fehlertyp: ZZ, seite: 'haben', statt: VERB, durch: BANK },
      { fehlertyp: AN, seite: 'soll', statt: 'Betriebs- und Geschäftsausstattung', durch: SBA },
    ],
  },
  {
    id: 'kunde-bank',
    text: 'Ein Getränkegroßhändler überweist eine offene Rechnung.',
    soll: BANK,
    haben: FORD,
    spanne: [1_000, 25_000, 100],
    fehler: [{ fehlertyp: FV, seite: 'haben', statt: FORD, durch: VERB }],
  },
  {
    id: 'kunde-bar',
    text: 'Ein Gastronom bezahlt eine offene Rechnung bar.',
    soll: KASSE,
    haben: FORD,
    spanne: [100, 1_500, 10],
    fehler: [
      { fehlertyp: ZW, seite: 'soll', statt: KASSE, durch: BANK },
      { fehlertyp: FV, seite: 'haben', statt: FORD, durch: VERB },
    ],
  },
  {
    id: 'lieferant-bank',
    text: 'Die MBG überweist die offene Rechnung der Etikettendruckerei.',
    soll: VERB,
    haben: BANK,
    spanne: [1_000, 20_000, 100],
    fehler: [{ fehlertyp: FV, seite: 'soll', statt: VERB, durch: FORD }],
  },
  {
    id: 'abhebung',
    text: 'Bargeld wird vom Bankkonto abgehoben und in die Kasse gelegt.',
    soll: KASSE,
    haben: BANK,
    spanne: [200, 3_000, 100],
    fehler: [],
  },
  {
    id: 'einzahlung',
    text: 'Bargeld aus der Kasse wird auf das Bankkonto eingezahlt.',
    soll: BANK,
    haben: KASSE,
    spanne: [200, 2_000, 100],
    fehler: [],
  },
  {
    id: 'darlehen-auf',
    text: 'Die Sparkasse zahlt ein Darlehen für die neue Abfülllinie auf das Bankkonto aus.',
    soll: BANK,
    haben: DARLEHEN,
    spanne: [10_000, 80_000, 5_000],
    fehler: [],
  },
  {
    id: 'tilgung',
    text: 'Die MBG überweist eine Tilgungsrate für ihr Darlehen.',
    soll: DARLEHEN,
    haben: BANK,
    spanne: [2_000, 20_000, 500],
    fehler: [{ fehlertyp: TZ, seite: 'soll', statt: DARLEHEN, durch: 'Zinsaufwendungen' }],
  },
  {
    id: 'miete',
    text: 'Die Miete für die Lagerhalle wird überwiesen.',
    soll: 'Mietaufwendungen',
    haben: BANK,
    spanne: [1_500, 6_000, 100],
    fehler: [{ fehlertyp: AEK, seite: 'soll', statt: 'Mietaufwendungen', durch: 'Mieterträge' }],
  },
  {
    id: 'loehne',
    text: 'Die Löhne der Abfüllkräfte werden überwiesen.',
    soll: 'Löhne',
    haben: BANK,
    spanne: [10_000, 40_000, 100],
    fehler: [],
  },
  {
    id: 'zinsen-gut',
    text: 'Die Bank schreibt Zinsen für ein Festgeldguthaben gut.',
    soll: BANK,
    haben: 'Zinserträge',
    spanne: [50, 1_500, 10],
    fehler: [{ fehlertyp: AEK, seite: 'haben', statt: 'Zinserträge', durch: 'Zinsaufwendungen' }],
  },
  {
    id: 'zinsen-last',
    text: 'Die Bank belastet das Geschäftskonto mit Darlehenszinsen.',
    soll: 'Zinsaufwendungen',
    haben: BANK,
    spanne: [200, 3_000, 10],
    fehler: [{ fehlertyp: AEK, seite: 'soll', statt: 'Zinsaufwendungen', durch: 'Zinserträge' }],
  },
  {
    id: 'verkauf-ziel',
    text: `Die MBG liefert „${P.lemon}“ auf Ziel an einen Getränkemarkt.`,
    soll: FORD,
    haben: UE,
    spanne: [2_000, 20_000, 100],
    fehler: [{ fehlertyp: VB, seite: 'haben', statt: UE, durch: 'Fertige Erzeugnisse' }],
  },
  {
    id: 'verkauf-bank',
    text: `Ein Hotel kauft „${P.energy}“ und bezahlt sofort per Überweisung.`,
    soll: BANK,
    haben: UE,
    spanne: [1_000, 12_000, 100],
    fehler: [
      { fehlertyp: VB, seite: 'haben', statt: UE, durch: 'Fertige Erzeugnisse' },
      { fehlertyp: ZZ, seite: 'soll', statt: BANK, durch: FORD },
    ],
  },
  {
    id: 'verbrauch',
    text: 'Für die Produktion werden Aromen aus dem Rohstofflager entnommen.',
    soll: 'Aufwendungen für Rohstoffe',
    haben: 'Rohstoffe',
    spanne: [1_000, 12_000, 100],
    fehler: [],
  },
  {
    id: 'werbung-bar',
    text: 'Eine Anzeige im Paderborner Stadtmagazin wird bar bezahlt.',
    soll: 'Werbung',
    haben: KASSE,
    spanne: [100, 900, 10],
    fehler: [{ fehlertyp: ZW, seite: 'haben', statt: KASSE, durch: BANK }],
  },
  {
    id: 'umwandlung',
    text: 'Eine Lieferantenschuld wird in ein langfristiges Darlehen umgewandelt.',
    soll: VERB,
    haben: DARLEHEN,
    spanne: [5_000, 30_000, 1_000],
    fehler: [],
  },
  {
    id: 'buero-bar',
    text: 'Druckerpapier und Toner werden bar gekauft.',
    soll: 'Büromaterial',
    haben: KASSE,
    spanne: [20, 400, 1],
    fehler: [{ fehlertyp: ZW, seite: 'haben', statt: KASSE, durch: BANK }],
  },
];

type ZusammenId =
  'lieferant-teil' | 'kunde-teil' | 'lkw-anzahlung' | 'aroma-teil' | 'lohn-gehalt' | 'rate';

const ZUSAMMEN: readonly ZusammenId[] = [
  'lieferant-teil',
  'kunde-teil',
  'lkw-anzahlung',
  'aroma-teil',
  'lohn-gehalt',
  'rate',
];

// ---------- Parameter und Lösung ----------

export interface A5Vorfall {
  /** Vorlage: einfache ID aus EINFACH oder zusammengesetzte ID */
  id: string;
  /** Gesamtbetrag (bei zusammengesetzt) bzw. Betrag */
  betrag: string;
  /** zusammengesetzt: erster Teilbetrag */
  teil: string;
}

export interface A5Params {
  variante: 'einfach' | 'zusammengesetzt' | 'analyse' | 'serie';
  vorfaelle: A5Vorfall[];
}

export interface A5Solution {
  buchung: BuchungsLoesung;
}

function einfachVorlage(id: string): EinfachVorlage | undefined {
  return EINFACH.find((v) => v.id === id);
}

/** Buchungssatz eines Vorfalls; `fehler` baut einen typischen falschen Satz. */
export function satzFuer(v: A5Vorfall, fehler?: string): ErwSatz | null {
  const b = new Val(v.betrag);
  const t = new Val(v.teil);
  const rest = b.minus(t);
  const e = einfachVorlage(v.id);
  if (e) {
    if (fehler === SH) return satz([zeile(e.haben, b)], [zeile(e.soll, b)]);
    const ersatz = fehler ? e.fehler.find((f) => f.fehlertyp === fehler) : undefined;
    if (fehler && !ersatz) return null;
    const konto = (seite: 'soll' | 'haben', k: string) =>
      ersatz && ersatz.seite === seite && ersatz.statt === k ? ersatz.durch : k;
    return satz([zeile(konto('soll', e.soll), b)], [zeile(konto('haben', e.haben), b)]);
  }
  const id = v.id as ZusammenId;
  switch (id) {
    case 'lieferant-teil':
      if (fehler === TG) return satz([zeile(VERB, b)], [zeile(KASSE, t), zeile(BANK, b)]);
      if (fehler === FV) return satz([zeile(FORD, b)], [zeile(KASSE, t), zeile(BANK, rest)]);
      if (fehler) return null;
      return satz([zeile(VERB, b)], [zeile(KASSE, t), zeile(BANK, rest)]);
    case 'kunde-teil':
      if (fehler === TG) return satz([zeile(KASSE, t), zeile(BANK, b)], [zeile(FORD, b)]);
      if (fehler === FV) return satz([zeile(KASSE, t), zeile(BANK, rest)], [zeile(VERB, b)]);
      if (fehler) return null;
      return satz([zeile(KASSE, t), zeile(BANK, rest)], [zeile(FORD, b)]);
    case 'lkw-anzahlung':
      if (fehler === TG) return satz([zeile('Fuhrpark', b)], [zeile(BANK, t), zeile(VERB, b)]);
      if (fehler === AN) return satz([zeile(SBA, b)], [zeile(BANK, t), zeile(VERB, rest)]);
      if (fehler) return null;
      return satz([zeile('Fuhrpark', b)], [zeile(BANK, t), zeile(VERB, rest)]);
    case 'aroma-teil':
      if (fehler === TG) return satz([zeile('Rohstoffe', b)], [zeile(BANK, t), zeile(VERB, b)]);
      if (fehler === ZZ) return satz([zeile('Rohstoffe', b)], [zeile(BANK, b)]);
      if (fehler) return null;
      return satz([zeile('Rohstoffe', b)], [zeile(BANK, t), zeile(VERB, rest)]);
    case 'lohn-gehalt':
      // betrag = Summe, teil = Löhne, rest = Gehälter
      if (fehler === TG)
        return satz([zeile('Löhne', t), zeile('Gehälter', rest)], [zeile(BANK, t)]);
      if (fehler) return null;
      return satz([zeile('Löhne', t), zeile('Gehälter', rest)], [zeile(BANK, b)]);
    case 'rate':
      // betrag = Rate, teil = Tilgung, rest = Zinsen
      if (fehler === TZ) return satz([zeile('Zinsaufwendungen', b)], [zeile(BANK, b)]);
      if (fehler === TG)
        return satz([zeile(DARLEHEN, t), zeile('Zinsaufwendungen', rest)], [zeile(BANK, t)]);
      if (fehler) return null;
      return satz([zeile(DARLEHEN, t), zeile('Zinsaufwendungen', rest)], [zeile(BANK, b)]);
  }
}

function fehlerFuer(v: A5Vorfall): string[] {
  const e = einfachVorlage(v.id);
  if (e) return [...new Set([...e.fehler.map((f) => f.fehlertyp), SH])];
  switch (v.id as ZusammenId) {
    case 'lieferant-teil':
    case 'kunde-teil':
      return [TG, FV];
    case 'lkw-anzahlung':
      return [TG, AN];
    case 'aroma-teil':
      return [TG, ZZ];
    case 'lohn-gehalt':
      return [TG];
    case 'rate':
      return [TZ, TG];
  }
}

export function solveBuchungssatzBasis(p: A5Params): A5Solution {
  const saetze = p.vorfaelle.map((v, i) => {
    const s = satzFuer(v)!;
    return p.vorfaelle.length > 1 ? { ...s, label: `Vorfall ${i + 1}` } : s;
  });
  return { buchung: loesung(saetze) };
}

// ---------- Texte ----------

function vorfallText(v: A5Vorfall): string {
  const e = einfachVorlage(v.id);
  if (e) return `${e.text} Betrag: ${eur(v.betrag)}.`;
  const b = new Val(v.betrag);
  const t = new Val(v.teil);
  const rest = b.minus(t);
  switch (v.id as ZusammenId) {
    case 'lieferant-teil':
      return `Eine Lieferantenrechnung über ${eur(b)} wird beglichen: ${eur(t)} bar aus der Kasse, den Rest überweist die MBG.`;
    case 'kunde-teil':
      return `Ein Kunde begleicht eine Rechnung über ${eur(b)}: ${eur(t)} zahlt er bar, den Rest überweist er.`;
    case 'lkw-anzahlung':
      return `Ein Auslieferungs-Lkw kostet ${eur(b)}. Die MBG überweist sofort ${eur(t)}; den Rest bleibt sie dem Autohaus bis zum Monatsende schuldig.`;
    case 'aroma-teil':
      return `Das Aromahaus liefert Fruchtaromen für ${eur(b)}. ${eur(t)} überweist die MBG sofort, der Rest ist in 30 Tagen fällig.`;
    case 'lohn-gehalt':
      return `Die Bank überweist in einer Sammelüberweisung Löhne (${eur(t)}) und Gehälter (${eur(rest)}).`;
    case 'rate':
      return `Die Sparkasse bucht die Darlehensrate von ${eur(b)} ab; darin stecken ${eur(t)} Tilgung und ${eur(rest)} Zinsen.`;
  }
}

function kurz(konto: string): string {
  return getKonto(konto).kurz;
}

// ---------- Teile ----------

/** Analyse: je berührtes Konto Kontenart und Zu-/Abnahme (alphabetisch, damit die Seite nicht verraten wird). */
interface AnalyseKonto {
  konto: string;
  art: string;
  richtung: string;
}

function analyseKonten(s: ErwSatz): AnalyseKonto[] {
  const zeilen = [
    ...s.soll.map((z) => ({ konto: z.konto, imSoll: true })),
    ...s.haben.map((z) => ({ konto: z.konto, imSoll: false })),
  ].sort((a, b) => a.konto.localeCompare(b.konto, 'de'));
  return zeilen.map(({ konto, imSoll }) => {
    const art = kontenart(konto);
    return {
      konto,
      art: KONTENART_LABEL[art],
      richtung: (zugangsSeite(art) === 'Soll') === imSoll ? ZUNAHME : ABNAHME,
    };
  });
}

function analysePart(konten: AnalyseKonto[]): RechenkettePart {
  const felder: Feld[] = konten.flatMap((k, i) => [
    auswahl(`art${i}`, `${kurz(k.konto)}: Kontenart`, KONTENARTEN, k.art),
    auswahl(
      `richtung${i}`,
      `${kurz(k.konto)}: Bestand bzw. Betrag`,
      [ZUNAHME, ABNAHME],
      k.richtung,
    ),
  ]);
  return { typ: 'rechenkette', id: 'analyse', titel: 'Erst überlegen', felder };
}

function buchungPart(l: BuchungsLoesung, n: number): BuchungPart {
  return {
    typ: 'buchungssatz',
    id: 'buchung',
    titel: n > 1 ? 'Buchungssätze' : 'Buchungssatz',
    loesung: l,
  };
}

function parts(p: A5Params, s: A5Solution): TaskPart[] {
  const b = buchungPart(s.buchung, p.vorfaelle.length);
  if (p.variante === 'analyse') return [analysePart(analyseKonten(s.buchung.saetze[0]!)), b];
  return [b];
}

// ---------- Fehlervarianten ----------

const GEGENART: Record<string, string> = {
  [AKTIVKONTO]: PASSIVKONTO,
  [PASSIVKONTO]: AKTIVKONTO,
  [AUFWANDSKONTO]: ERTRAGSKONTO,
  [ERTRAGSKONTO]: AUFWANDSKONTO,
};

function variants(p: A5Params): ErrorVariant[] {
  const s = solveBuchungssatzBasis(p);
  const out: ErrorVariant[] = [];
  const gesehen = new Set<string>();
  const n = p.vorfaelle.length;
  const analyse = p.variante === 'analyse' ? analyseKonten(s.buchung.saetze[0]!) : [];
  const mitAnalyse = (b: BuchungPart, a = analyse): TaskPart[] =>
    p.variante === 'analyse' ? [analysePart(a), b] : [b];
  p.vorfaelle.forEach((v, i) => {
    for (const f of fehlerFuer(v)) {
      if (gesehen.has(f)) continue;
      const falsch = satzFuer(v, f);
      if (!falsch) continue;
      gesehen.add(f);
      const saetze = s.buchung.saetze.map((x, j) =>
        j === i ? (n > 1 ? { ...falsch, label: `Vorfall ${i + 1}` } : falsch) : x,
      );
      out.push({ fehlertyp: f, parts: mitAnalyse(buchungPart(loesung(saetze), n)) });
    }
  });
  if (p.variante === 'analyse') {
    const b = buchungPart(s.buchung, 1);
    const artFehler = analyse.find((k) => k.art === AKTIVKONTO || k.art === PASSIVKONTO);
    if (artFehler)
      out.push({
        fehlertyp: AP,
        parts: mitAnalyse(
          b,
          analyse.map((k) => (k === artFehler ? { ...k, art: GEGENART[k.art]! } : k)),
        ),
      });
    const erfolg = analyse.find((k) => k.art === AUFWANDSKONTO || k.art === ERTRAGSKONTO);
    if (erfolg)
      out.push({
        fehlertyp: AE,
        parts: mitAnalyse(
          b,
          analyse.map((k) => (k === erfolg ? { ...k, art: GEGENART[k.art]! } : k)),
        ),
      });
    out.push({
      fehlertyp: ZA,
      parts: mitAnalyse(
        b,
        analyse.map((k) => ({ ...k, richtung: k.richtung === ZUNAHME ? ABNAHME : ZUNAHME })),
      ),
    });
  }
  return out;
}

// ---------- Render, Rechenweg, Hilfen ----------

function render(p: A5Params): TaskText {
  const ohneUst = 'Die Umsatzsteuer bleibt in dieser Übung unberücksichtigt.';
  if (p.variante === 'serie') {
    return {
      titel: 'Buchungssätze bilden',
      kontext: 'Januar: erste Buchungen',
      sachverhalt: [
        'Jana Kröger legt dir die ersten Belege des Jahres auf den Tisch:',
        ...p.vorfaelle.map((v, i) => `${i + 1}. ${vorfallText(v)}`),
      ],
      aufgabe: `Bilde zu jedem Vorfall den Buchungssatz. ${ohneUst}`,
    };
  }
  const v = p.vorfaelle[0]!;
  return {
    titel:
      p.variante === 'zusammengesetzt' ? 'Zusammengesetzter Buchungssatz' : 'Buchungssatz bilden',
    kontext: 'Januar: erste Buchungen',
    sachverhalt: [vorfallText(v)],
    aufgabe:
      p.variante === 'analyse'
        ? `Bestimme zuerst für jedes berührte Konto die Kontenart und ob es zu- oder abnimmt. Bilde dann den Buchungssatz. ${ohneUst}`
        : `Bilde den Buchungssatz. ${ohneUst}`,
  };
}

function satzText(s: ErwSatz): string {
  const f = (zs: ErwSatz['soll']) => zs.map((z) => `${kurz(z.konto)} ${eur(z.betrag)}`).join(', ');
  return `${f(s.soll)} an ${f(s.haben)}`;
}

function steps(p: A5Params, s: A5Solution): SolutionStep[] {
  return p.vorfaelle.map((_v, i) => {
    const x = s.buchung.saetze[i]!;
    const konten = analyseKonten(x)
      .map((k) => `${kurz(k.konto)} (${k.art}) ${k.richtung}`)
      .join('; ');
    return {
      titel: p.vorfaelle.length > 1 ? `Vorfall ${i + 1}` : 'Buchungssatz',
      ergebnis: satzText(x),
      erlaeuterung: `${konten}. Zunahmen bei Aktiv- und Aufwandskonten sowie Abnahmen bei Passiv- und Ertragskonten stehen im Soll, alles andere im Haben.${
        x.soll.length + x.haben.length > 2
          ? ' Mehr als zwei Konten: zusammengesetzter Buchungssatz, Summe Soll = Summe Haben.'
          : ''
      }`,
    };
  });
}

function hints(p: A5Params, s: A5Solution): [string, string, string] {
  return [
    'Welche Konten sind berührt? Bestimme für jedes die Kontenart und ob es zu- oder abnimmt.',
    'Aktivkonten und Aufwandskonten nehmen im Soll zu, Passivkonten und Ertragskonten im Haben. Das Konto im Soll steht vor dem „an“.',
    s.buchung.saetze
      .map((x, i) => `${p.vorfaelle.length > 1 ? `${i + 1}. ` : ''}${satzText(x)}`)
      .join(' | '),
  ];
}

// ---------- Erzeugung ----------

function einfachVorfall(rng: Rng, vorlage: EinfachVorlage, krumm: boolean): A5Vorfall {
  const [min, max, step] = vorlage.spanne;
  return { id: vorlage.id, betrag: betrag(rng, min, max, step, krumm), teil: '0' };
}

function zusammenVorfall(rng: Rng, id: ZusammenId, krumm: boolean): A5Vorfall {
  const cent = (x: number) => (krumm ? betrag(rng, x, x + 1, 1, true) : String(x));
  switch (id) {
    case 'lieferant-teil':
    case 'kunde-teil': {
      const g = rng.step(1_000, 12_000, 100);
      const t = rng.step(100, Math.min(1_500, g / 2), 50);
      return { id, betrag: cent(g), teil: String(t) };
    }
    case 'lkw-anzahlung': {
      const g = rng.step(30_000, 90_000, 1_000);
      const t = rng.step(5_000, g / 2, 1_000);
      return { id, betrag: String(g), teil: cent(t) };
    }
    case 'aroma-teil': {
      const g = rng.step(4_000, 20_000, 100);
      const t = rng.step(1_000, g / 2, 100);
      return { id, betrag: cent(g), teil: String(t) };
    }
    case 'lohn-gehalt': {
      const l = rng.step(15_000, 45_000, 100);
      const ge = rng.step(8_000, 30_000, 100);
      return { id, betrag: String(l + ge), teil: cent(l) };
    }
    case 'rate': {
      const tilg = rng.step(2_000, 15_000, 500);
      const zins = rng.step(200, 2_500, 10);
      return { id, betrag: cent(tilg + zins), teil: String(tilg) };
    }
  }
}

function generate(rng: Rng, opts: GenOptions = {}): A5Params {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const variante =
    (opts.variant as A5Params['variante'] | undefined) ??
    rng.pick([
      'einfach',
      'einfach',
      'einfach',
      'einfach',
      'zusammengesetzt',
      'zusammengesetzt',
      'zusammengesetzt',
      'analyse',
      'serie',
      'serie',
    ] as const);
  if (variante === 'zusammengesetzt')
    return { variante, vorfaelle: [zusammenVorfall(rng, rng.pick(ZUSAMMEN), krumm)] };
  if (variante === 'serie') {
    const n = rng.int(3, 4);
    const vorlagen = rng.shuffle(EINFACH).slice(0, n);
    return { variante, vorfaelle: vorlagen.map((v) => einfachVorfall(rng, v, krumm)) };
  }
  const make = (r: Rng): A5Params => ({
    variante,
    vorfaelle: [einfachVorfall(r, r.pick(EINFACH), krumm)],
  });
  return make(rng);
}

export const buchungssatzBasis = defineGenerator<A5Params, A5Solution>({
  skillId: 'A5-buchungssatz-basis',
  titel: 'Einfache Buchungssätze',
  variants: ['einfach', 'zusammengesetzt', 'analyse', 'serie'],
  points: 2,
  generate,
  render,
  solve: solveBuchungssatzBasis,
  parts,
  steps,
  hints,
  errorVariants: variants,
  verfahren: (p) =>
    p.variante === 'zusammengesetzt'
      ? 'Zusammengesetzter Buchungssatz: mehrere Konten, Summe Soll = Summe Haben'
      : 'Buchungssatz bilden: Konten, Kontenart, Zu- oder Abnahme, Soll an Haben',
});
