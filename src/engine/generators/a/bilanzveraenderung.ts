// A4 – Bilanzveränderungen: Aktivtausch, Passivtausch, Aktiv-Passiv-Mehrung, Aktiv-Passiv-Minderung
// erkennen, Bestände und Bilanzsumme danach (BA 2.3.1.3, 2.3.1.5; eigene Formulierung und Zahlen).
// Die Art wird aus den Kontenarten der berührten Posten berechnet, nicht vorgegeben.
// Spezifikation: docs/m7/a.md.
import { getKonto } from '../../accounts';
import { loesung, satz, zeile, type BuchungsLoesung } from '../../booking';
import { Val, sum } from '../../money';
import type { Rng } from '../../rng';
import type {
  ErrorVariant,
  Feld,
  GenOptions,
  RechenkettePart,
  SolutionStep,
  TaskPart,
  TaskText,
  WahlPart,
} from '../../task';
import { betrag, defineGenerator, eur, feld, isKrumm, retry } from '../base';
import {
  BANK,
  DARLEHEN,
  EK,
  FORD,
  KASSE,
  VERB,
  auswahl,
  bilanzDaten,
  kontenart,
} from './gemeinsam';

export type Art = 'aktivtausch' | 'passivtausch' | 'mehrung' | 'minderung';

export const ART_LABEL: Record<Art, string> = {
  aktivtausch: 'Aktivtausch',
  passivtausch: 'Passivtausch',
  mehrung: 'Aktiv-Passiv-Mehrung',
  minderung: 'Aktiv-Passiv-Minderung',
};
const ARTEN: Art[] = ['aktivtausch', 'passivtausch', 'mehrung', 'minderung'];

const TP = 'a-aktivtausch-passivtausch-vertauscht';
const TM = 'a-tausch-als-mehrung-minderung';
const MT = 'a-mehrung-minderung-als-tausch';
const MM = 'a-mehrung-minderung-vertauscht';
const ZA = 'a-zugang-abgang-verwechselt';

const TA = 'Technische Anlagen und Maschinen';
const BGA = 'Betriebs- und Geschäftsausstattung';
const FUHRPARK = 'Fuhrpark';
const ROH = 'Rohstoffe';

/** Bilanzveränderung aus den Kontenarten der beiden berührten Posten. */
export function artVon(soll: string, haben: string): Art {
  const s = kontenart(soll);
  const h = kontenart(haben);
  if (s === 'aktiv' && h === 'aktiv') return 'aktivtausch';
  if (s === 'passiv' && h === 'passiv') return 'passivtausch';
  if (s === 'aktiv' && h === 'passiv') return 'mehrung';
  if (s === 'passiv' && h === 'aktiv') return 'minderung';
  throw new Error(`Kein Bestandsvorgang: ${soll} an ${haben}`);
}

/** Veränderung der Bilanzsumme je Art (in Vielfachen des Betrags). */
function summenFaktor(a: Art): number {
  return a === 'mehrung' ? 1 : a === 'minderung' ? -1 : 0;
}

export function fehlertypFuer(richtig: Art, gewaehlt: Art): string {
  const tausch = (a: Art) => a === 'aktivtausch' || a === 'passivtausch';
  if (tausch(richtig)) return tausch(gewaehlt) ? TP : TM;
  return tausch(gewaehlt) ? MT : MM;
}

// ---------- Vorfälle ----------

interface Vorlage {
  soll: string;
  haben: string;
  text: string;
  spanne: [number, number, number];
}

const VORLAGEN: readonly Vorlage[] = [
  // Aktivtausch
  {
    soll: FUHRPARK,
    haben: BANK,
    text: 'Die MBG kauft einen Gabelstapler für das Logistikzentrum und überweist den Kaufpreis.',
    spanne: [5_000, 40_000, 500],
  },
  {
    soll: BGA,
    haben: BANK,
    text: 'Für die Verwaltung werden neue Büromöbel gekauft und sofort per Bank bezahlt.',
    spanne: [2_000, 15_000, 100],
  },
  {
    soll: TA,
    haben: BANK,
    text: 'Eine Etikettiermaschine wird gekauft und per Überweisung bezahlt.',
    spanne: [10_000, 60_000, 1_000],
  },
  {
    soll: BANK,
    haben: FORD,
    text: 'Ein Getränkegroßhändler überweist eine offene Rechnung.',
    spanne: [2_000, 30_000, 100],
  },
  {
    soll: KASSE,
    haben: BANK,
    text: 'Für die Kasse wird Bargeld vom Bankkonto abgehoben.',
    spanne: [300, 3_000, 100],
  },
  {
    soll: BANK,
    haben: KASSE,
    text: 'Überschüssiges Bargeld aus der Kasse wird auf das Bankkonto eingezahlt.',
    spanne: [300, 2_000, 100],
  },
  {
    soll: ROH,
    haben: BANK,
    text: 'Fruchtsaftkonzentrat wird eingekauft und sofort überwiesen.',
    spanne: [2_000, 20_000, 100],
  },
  // Passivtausch
  {
    soll: VERB,
    haben: DARLEHEN,
    text: 'Der Dosenlieferant wandelt eine offene Rechnung in ein Darlehen mit drei Jahren Laufzeit um.',
    spanne: [5_000, 30_000, 1_000],
  },
  {
    soll: VERB,
    haben: DARLEHEN,
    text: 'Die Sparkasse zahlt ein neues Darlehen direkt an einen Lieferanten aus und begleicht damit eine offene Rechnung der MBG.',
    spanne: [5_000, 30_000, 1_000],
  },
  // Aktiv-Passiv-Mehrung
  {
    soll: BANK,
    haben: DARLEHEN,
    text: 'Die Sparkasse zahlt ein Darlehen auf das Bankkonto der MBG aus.',
    spanne: [10_000, 100_000, 5_000],
  },
  {
    soll: ROH,
    haben: VERB,
    text: 'Aromen werden auf Ziel eingekauft.',
    spanne: [2_000, 25_000, 100],
  },
  {
    soll: TA,
    haben: VERB,
    text: 'Eine gebrauchte Abfüllmaschine wird auf Rechnung gekauft.',
    spanne: [10_000, 60_000, 1_000],
  },
  {
    soll: FUHRPARK,
    haben: VERB,
    text: 'Ein Auslieferungs-Lkw wird auf Ziel gekauft.',
    spanne: [20_000, 80_000, 1_000],
  },
  // Aktiv-Passiv-Minderung
  {
    soll: DARLEHEN,
    haben: BANK,
    text: 'Die MBG tilgt einen Teil ihres Darlehens per Überweisung.',
    spanne: [5_000, 40_000, 1_000],
  },
  {
    soll: VERB,
    haben: BANK,
    text: 'Die Rechnung der Etikettendruckerei wird per Bank bezahlt.',
    spanne: [1_000, 20_000, 100],
  },
  {
    soll: VERB,
    haben: KASSE,
    text: 'Eine kleine Lieferantenrechnung wird bar bezahlt.',
    spanne: [100, 1_500, 10],
  },
];

// ---------- Parameter und Lösung ----------

export interface Posten {
  konto: string;
  betrag: string;
}

export interface A4Vorfall {
  soll: string;
  haben: string;
  text: string;
  betrag: string;
}

export interface A4Params {
  variante: 'einzeln' | 'serie';
  aktiva: Posten[];
  passiva: Posten[];
  vorfaelle: A4Vorfall[];
  /** serie: Posten, dessen Schlussbestand gefragt ist */
  frageKonto: string;
}

export interface A4Solution {
  summeVorher: Val;
  arten: Art[];
  /** Bilanzsumme nach jedem Vorfall */
  summen: Val[];
  /** Summe der Passivseite nach jedem Vorfall (Kontrolle Aktiva = Passiva) */
  passivSummen: Val[];
  /** Bestände der berührten Posten nach Vorfall 1 */
  bestandSoll: Val;
  bestandHaben: Val;
  /** Bestand des gefragten Postens nach allen Vorfällen */
  endbestand: Val;
  buchung: BuchungsLoesung;
}

/** Bestände nach einem Vorfall: Aktivkonten nehmen im Soll zu, Passivkonten im Haben. */
function buche(bestand: Map<string, Val>, v: A4Vorfall, richtungFalsch = false): void {
  for (const [konto, imSoll] of [
    [v.soll, true],
    [v.haben, false],
  ] as const) {
    const aktiv = kontenart(konto) === 'aktiv';
    let zunahme = aktiv === imSoll;
    if (richtungFalsch) zunahme = !zunahme;
    const alt = bestand.get(konto) ?? new Val(0);
    bestand.set(konto, zunahme ? alt.plus(v.betrag) : alt.minus(v.betrag));
  }
}

function summeAktiva(bestand: Map<string, Val>): Val {
  return sum([...bestand].filter(([k]) => kontenart(k) === 'aktiv').map(([, b]) => b));
}

function summePassiva(bestand: Map<string, Val>): Val {
  return sum([...bestand].filter(([k]) => kontenart(k) === 'passiv').map(([, b]) => b));
}

function startBestand(p: A4Params): Map<string, Val> {
  return new Map([...p.aktiva, ...p.passiva].map((x) => [x.konto, new Val(x.betrag)]));
}

export function solveBilanzveraenderung(p: A4Params): A4Solution {
  const bestand = startBestand(p);
  const summeVorher = summeAktiva(bestand);
  const summen: Val[] = [];
  const passivSummen: Val[] = [];
  let bestandSoll = new Val(0);
  let bestandHaben = new Val(0);
  p.vorfaelle.forEach((v, i) => {
    buche(bestand, v);
    summen.push(summeAktiva(bestand));
    passivSummen.push(summePassiva(bestand));
    if (i === 0) {
      bestandSoll = bestand.get(v.soll)!;
      bestandHaben = bestand.get(v.haben)!;
    }
  });
  const v0 = p.vorfaelle[0]!;
  return {
    summeVorher,
    arten: p.vorfaelle.map((v) => artVon(v.soll, v.haben)),
    summen,
    passivSummen,
    bestandSoll,
    bestandHaben,
    endbestand: bestand.get(p.frageKonto) ?? new Val(0),
    buchung: loesung([satz([zeile(v0.soll, v0.betrag)], [zeile(v0.haben, v0.betrag)])]),
  };
}

// ---------- Teile ----------

function kurz(konto: string): string {
  return getKonto(konto).kurz;
}

function artPart(richtig: Art, gewaehlt: Art = richtig): WahlPart {
  return {
    typ: 'aufgabe-erkennen',
    id: 'art',
    frage: 'Welche Art der Bilanzveränderung liegt vor?',
    optionen: ARTEN.map((a) => {
      const o: WahlPart['optionen'][number] = {
        id: `o-${a}`,
        text: ART_LABEL[a],
        richtig: a === gewaehlt,
      };
      if (a !== richtig) o.fehlertyp = fehlertypFuer(richtig, a);
      return o;
    }),
    begruendung: `${ART_LABEL[richtig]}: ${
      richtig === 'aktivtausch'
        ? 'zwei Aktivposten ändern sich gegenläufig, die Bilanzsumme bleibt gleich.'
        : richtig === 'passivtausch'
          ? 'zwei Passivposten ändern sich gegenläufig, die Bilanzsumme bleibt gleich.'
          : richtig === 'mehrung'
            ? 'ein Aktiv- und ein Passivposten nehmen zu, die Bilanz wird länger.'
            : 'ein Aktiv- und ein Passivposten nehmen ab, die Bilanz wird kürzer.'
    }`,
  };
}

interface EinzelWerte {
  bestandSoll: Val;
  bestandHaben: Val;
  summe: Val;
}

function einzelPart(p: A4Params, w: EinzelWerte): RechenkettePart {
  const v = p.vorfaelle[0]!;
  return {
    typ: 'rechenkette',
    id: 'bilanz',
    titel: 'Bilanz nach dem Vorfall',
    felder: [
      feld('bestandSoll', `Neuer Bestand ${kurz(v.soll)}`, w.bestandSoll),
      feld('bestandHaben', `Neuer Bestand ${kurz(v.haben)}`, w.bestandHaben),
      feld('summe', 'Bilanzsumme nach dem Vorfall', w.summe),
    ],
  };
}

function seriePart(p: A4Params, arten: Art[], summen: Val[], endbestand: Val): RechenkettePart {
  const felder: Feld[] = [];
  p.vorfaelle.forEach((_, i) => {
    felder.push(
      auswahl(
        `art${i}`,
        `Vorfall ${i + 1}: Art der Bilanzveränderung`,
        ARTEN.map((a) => ART_LABEL[a]),
        ART_LABEL[arten[i]!],
      ),
      feld(`summe${i}`, `Bilanzsumme nach Vorfall ${i + 1}`, summen[i]!),
    );
  });
  felder.push(feld('bestand', `Bestand ${kurz(p.frageKonto)} nach allen Vorfällen`, endbestand));
  return { typ: 'rechenkette', id: 'serie', titel: 'Bilanzveränderungen', felder };
}

function parts(p: A4Params, s: A4Solution): TaskPart[] {
  if (p.variante === 'serie') return [seriePart(p, s.arten, s.summen, s.endbestand)];
  return [
    artPart(s.arten[0]!),
    einzelPart(p, {
      bestandSoll: s.bestandSoll,
      bestandHaben: s.bestandHaben,
      summe: s.summen[0]!,
    }),
    { typ: 'buchungssatz', id: 'buchung', titel: 'Buchungssatz', loesung: s.buchung },
  ];
}

// ---------- Fehlervarianten ----------

function variants(p: A4Params): ErrorVariant[] {
  const s = solveBilanzveraenderung(p);
  const out: ErrorVariant[] = [];
  if (p.variante === 'einzeln') {
    const v = p.vorfaelle[0]!;
    const richtig = s.arten[0]!;
    const basis: EinzelWerte = {
      bestandSoll: s.bestandSoll,
      bestandHaben: s.bestandHaben,
      summe: s.summen[0]!,
    };
    const buchung: TaskPart = {
      typ: 'buchungssatz',
      id: 'buchung',
      titel: 'Buchungssatz',
      loesung: s.buchung,
    };
    for (const a of ARTEN) {
      if (a === richtig) continue;
      const summe = s.summeVorher.plus(new Val(v.betrag).times(summenFaktor(a)));
      out.push({
        fehlertyp: fehlertypFuer(richtig, a),
        parts: [artPart(richtig, a), einzelPart(p, { ...basis, summe }), buchung],
      });
    }
    // Zu- und Abnahme der Posten verwechselt
    const falsch = startBestand(p);
    buche(falsch, v, true);
    out.push({
      fehlertyp: ZA,
      parts: [
        artPart(richtig),
        einzelPart(p, {
          bestandSoll: falsch.get(v.soll)!,
          bestandHaben: falsch.get(v.haben)!,
          summe: summeAktiva(falsch),
        }),
        buchung,
      ],
    });
    out.push({
      fehlertyp: 'soll-haben-vertauscht',
      parts: [
        artPart(richtig),
        einzelPart(p, basis),
        {
          ...buchung,
          loesung: loesung([satz([zeile(v.haben, v.betrag)], [zeile(v.soll, v.betrag)])]),
        },
      ],
    });
    return out;
  }
  // Serie: je Fehlertyp der erste passende Vorfall
  const gesehen = new Set<string>();
  p.vorfaelle.forEach((v, i) => {
    const richtig = s.arten[i]!;
    for (const a of ARTEN) {
      if (a === richtig) continue;
      const f = fehlertypFuer(richtig, a);
      if (gesehen.has(f)) continue;
      gesehen.add(f);
      const diff = new Val(v.betrag).times(summenFaktor(a) - summenFaktor(richtig));
      const arten = s.arten.map((x, j) => (j === i ? a : x));
      const summen = s.summen.map((x, j) => (j >= i ? x.plus(diff) : x));
      out.push({ fehlertyp: f, parts: [seriePart(p, arten, summen, s.endbestand)] });
    }
  });
  return out;
}

// ---------- Texte ----------

function render(p: A4Params): TaskText {
  const summe = sum(p.aktiva.map((x) => x.betrag));
  const daten = bilanzDaten(p.aktiva, p.passiva, summe.value.toFixed(2));
  if (p.variante === 'einzeln') {
    const v = p.vorfaelle[0]!;
    return {
      titel: 'Bilanzveränderung',
      kontext: 'Januar: erste Buchungen',
      sachverhalt: [
        'Ausgangslage ist die Eröffnungsbilanz der MBG zum 1. Januar (Tabelle, Beträge in €).',
        `Am 3. Januar: ${v.text} Betrag: ${eur(v.betrag)}.`,
      ],
      daten,
      aufgabe:
        'Bestimme die Art der Bilanzveränderung, die neuen Bestände der beiden Posten und die Bilanzsumme danach. Bilde den Buchungssatz.',
    };
  }
  return {
    titel: 'Bilanzveränderungen in Folge',
    kontext: 'Januar: erste Buchungen',
    sachverhalt: [
      'Die Eröffnungsbilanz der MBG zum 1. Januar (Beträge in €). Im Januar folgen diese Vorfälle:',
      ...p.vorfaelle.map((v, i) => `${i + 1}. ${v.text} Betrag: ${eur(v.betrag)}.`),
    ],
    daten,
    aufgabe:
      'Bestimme für jeden Vorfall die Art der Bilanzveränderung und die Bilanzsumme danach. Gib zum Schluss den Bestand des gefragten Postens an.',
  };
}

function erklaerung(v: A4Vorfall): string {
  const a = artVon(v.soll, v.haben);
  const richtung = (konto: string, imSoll: boolean) =>
    `${kurz(konto)} (${kontenart(konto) === 'aktiv' ? 'Aktivposten' : 'Passivposten'}) ${
      (kontenart(konto) === 'aktiv') === imSoll ? 'nimmt zu' : 'nimmt ab'
    }`;
  return `${richtung(v.soll, true)}, ${richtung(v.haben, false)} → ${ART_LABEL[a]}.`;
}

function steps(p: A4Params, s: A4Solution): SolutionStep[] {
  const out: SolutionStep[] = [{ titel: 'Bilanzsumme vorher', ergebnis: eur(s.summeVorher) }];
  p.vorfaelle.forEach((v, i) => {
    const f = summenFaktor(s.arten[i]!);
    const vorher = i === 0 ? s.summeVorher : s.summen[i - 1]!;
    out.push({
      titel: `Vorfall ${i + 1}: ${ART_LABEL[s.arten[i]!]}`,
      rechnung:
        f === 0
          ? `Bilanzsumme bleibt ${eur(vorher)}`
          : `${eur(vorher)} ${f > 0 ? '+' : '−'} ${eur(v.betrag)} = ${eur(s.summen[i]!)}`,
      ergebnis: eur(s.summen[i]!),
      erlaeuterung: `${erklaerung(v)} Buchungssatz: ${kurz(v.soll)} an ${kurz(v.haben)}.`,
    });
  });
  if (p.variante === 'einzeln') {
    out.push({
      titel: 'Neue Bestände',
      ergebnis: `${kurz(p.vorfaelle[0]!.soll)} ${eur(s.bestandSoll)}; ${kurz(p.vorfaelle[0]!.haben)} ${eur(s.bestandHaben)}`,
    });
  } else {
    out.push({ titel: `Bestand ${kurz(p.frageKonto)}`, ergebnis: eur(s.endbestand) });
  }
  return out;
}

function hints(p: A4Params, s: A4Solution): [string, string, string] {
  const v = p.vorfaelle[0]!;
  return [
    'Welche zwei Bilanzposten ändern sich? Stehen sie auf der Aktiv- oder der Passivseite, und nehmen sie zu oder ab?',
    'Zwei Posten derselben Seite: Tausch, die Bilanzsumme bleibt. Beide Seiten nehmen zu: Mehrung (Bilanz länger). Beide nehmen ab: Minderung (Bilanz kürzer).',
    p.variante === 'einzeln'
      ? `${ART_LABEL[s.arten[0]!]}; Bilanzsumme danach ${eur(s.summen[0]!)}; Buchungssatz ${kurz(v.soll)} an ${kurz(v.haben)} ${eur(v.betrag)}.`
      : `Arten: ${s.arten.map((a) => ART_LABEL[a]).join(', ')}; Bilanzsumme am Ende ${eur(s.summen[s.summen.length - 1]!)}.`,
  ];
}

// ---------- Erzeugung ----------

function startbilanz(rng: Rng): { aktiva: Posten[]; passiva: Posten[] } {
  const aktiva: Posten[] = [
    { konto: TA, betrag: String(rng.step(150_000, 500_000, 10_000)) },
    { konto: BGA, betrag: String(rng.step(20_000, 80_000, 5_000)) },
    { konto: FUHRPARK, betrag: String(rng.step(30_000, 150_000, 5_000)) },
    { konto: ROH, betrag: String(rng.step(20_000, 90_000, 1_000)) },
    { konto: FORD, betrag: String(rng.step(20_000, 90_000, 1_000)) },
    { konto: BANK, betrag: String(rng.step(40_000, 150_000, 1_000)) },
    { konto: KASSE, betrag: String(rng.step(2_000, 8_000, 100)) },
  ];
  const darlehen = rng.step(100_000, 350_000, 10_000);
  const verb = rng.step(30_000, 100_000, 1_000);
  const ek = sum(aktiva.map((x) => x.betrag))
    .minus(darlehen)
    .minus(verb);
  return {
    aktiva,
    passiva: [
      { konto: EK, betrag: ek.value.toFixed(0) },
      { konto: DARLEHEN, betrag: String(darlehen) },
      { konto: VERB, betrag: String(verb) },
    ],
  };
}

function vorfall(rng: Rng, art: Art, krumm: boolean): A4Vorfall {
  const vorlage = rng.pick(VORLAGEN.filter((v) => artVon(v.soll, v.haben) === art));
  const [min, max, step] = vorlage.spanne;
  return {
    soll: vorlage.soll,
    haben: vorlage.haben,
    text: vorlage.text,
    betrag: betrag(rng, min, max, step, krumm),
  };
}

function gueltig(p: A4Params): boolean {
  const ek = p.passiva.find((x) => x.konto === EK)!;
  if (new Val(ek.betrag).exact.lt(50_000)) return false;
  // Kein Posten darf negativ werden; Texte in einer Serie nicht doppelt
  const bestand = startBestand(p);
  for (const v of p.vorfaelle) {
    buche(bestand, v);
    if ([...bestand.values()].some((b) => b.exact.lte(0))) return false;
  }
  return new Set(p.vorfaelle.map((v) => v.text)).size === p.vorfaelle.length;
}

function generate(rng: Rng, opts: GenOptions = {}): A4Params {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const variante =
    (opts.variant as A4Params['variante'] | undefined) ?? (rng.chance(0.55) ? 'einzeln' : 'serie');
  const make = (r: Rng): A4Params => {
    const { aktiva, passiva } = startbilanz(r);
    const n = variante === 'einzeln' ? 1 : r.int(3, 4);
    const arten = r.shuffle(ARTEN).slice(0, n);
    const vorfaelle = arten.map((a) => vorfall(r, a, krumm));
    // gefragt: ein Posten, der mindestens einmal berührt wird (bevorzugt mehrfach)
    const beruehrt = vorfaelle.flatMap((v) => [v.soll, v.haben]);
    const mehrfach = beruehrt.filter((k, i) => beruehrt.indexOf(k) !== i);
    const frageKonto = r.pick(mehrfach.length > 0 ? mehrfach : beruehrt);
    return { variante, aktiva, passiva, vorfaelle, frageKonto };
  };
  return retry(rng, make, gueltig);
}

export const bilanzveraenderung = defineGenerator<A4Params, A4Solution>({
  skillId: 'A4-bilanzveraenderung',
  titel: 'Bilanzveränderungen',
  variants: ['einzeln', 'serie'],
  points: 3,
  generate,
  render,
  solve: solveBilanzveraenderung,
  parts,
  steps,
  hints,
  errorVariants: variants,
  verfahren: () =>
    'Bilanzveränderung bestimmen: Aktivtausch, Passivtausch, Aktiv-Passiv-Mehrung oder -Minderung',
});
