// Kontenliste nach 04-fachregeln.md, Abschnitt 1 (IKR in Wortbezeichnungen).

export type KontoTyp = 'aktiv' | 'passiv' | 'aufwand' | 'ertrag' | 'abschluss';

export interface Konto {
  /** Kanonischer Name, zugleich ID. */
  name: string;
  /** Kurzform für die Anzeige auf kleinen Bildschirmen. */
  kurz: string;
  typ: KontoTyp;
  /** Name des Hauptkontos bei Unterkonten. */
  unterkontoVon?: string;
  synonyme: string[];
  hinweis?: string;
}

const STOFFE = [
  'Rohstoffe',
  'Hilfsstoffe',
  'Betriebsstoffe',
  'Vorprodukte und Fremdbauteile',
] as const;
export type Stoff = (typeof STOFFE)[number] | 'Handelswaren';

function k(
  name: string,
  typ: KontoTyp,
  synonyme: string[] = [],
  extra: Partial<Omit<Konto, 'name' | 'typ' | 'synonyme'>> = {},
): Konto {
  return { name, typ, synonyme, kurz: extra.kurz ?? name, ...extra };
}

function stoffKonten(stoff: Stoff, kurz: string): Konto[] {
  return [
    k(stoff, 'aktiv', stoff === 'Handelswaren' ? ['Waren'] : []),
    k(`Bezugskosten für ${stoff}`, 'aktiv', [`Bezugskosten ${stoff}`], {
      unterkontoVon: stoff,
      kurz: `Bezugskosten für ${kurz}`,
    }),
    k(`Nachlässe für ${stoff}`, 'aktiv', [`Nachlässe ${stoff}`], {
      unterkontoVon: stoff,
      kurz: `Nachlässe für ${kurz}`,
      hinweis: 'Unterkonto, Buchung im Haben',
    }),
  ];
}

export const KONTEN: readonly Konto[] = [
  // Aktiv
  k('Technische Anlagen und Maschinen', 'aktiv', ['TA u. Maschinen', 'TAuM', 'TA und Maschinen'], {
    kurz: 'TA und Maschinen',
  }),
  k(
    'Betriebs- und Geschäftsausstattung',
    'aktiv',
    ['BGA', 'Andere Anlagen/BGA', 'Geschäftsausstattung'],
    { kurz: 'BGA' },
  ),
  k('Fuhrpark', 'aktiv'),
  k('Büromaschinen', 'aktiv'),
  k('Anlagen im Bau', 'aktiv'),
  k('Geleistete Anzahlungen auf Sachanlagen', 'aktiv'),
  ...stoffKonten('Rohstoffe', 'Rohstoffe'),
  ...stoffKonten('Hilfsstoffe', 'Hilfsstoffe'),
  ...stoffKonten('Betriebsstoffe', 'Betriebsstoffe'),
  ...stoffKonten('Vorprodukte und Fremdbauteile', 'Vorprodukte/Fremdbauteile'),
  // Unterkonten für Handelswaren analog zu den Stoffkonten (04-fachregeln.md, Abschnitt 6, geklärt).
  ...stoffKonten('Handelswaren', 'Handelswaren'),
  k('Unfertige Erzeugnisse', 'aktiv', ['UE']),
  k('Fertige Erzeugnisse', 'aktiv', ['FE']),
  k('Forderungen aus Lieferungen und Leistungen', 'aktiv', ['Forderungen a. LL', 'Forderungen'], {
    kurz: 'Forderungen a. LL',
  }),
  k('Zweifelhafte Forderungen', 'aktiv'),
  k('Sonstige Forderungen', 'aktiv'),
  k('Vorsteuer', 'aktiv', ['VSt']),
  k('Bank', 'aktiv', ['Bankguthaben']),
  k('Kasse', 'aktiv'),
  k('Aktive Rechnungsabgrenzung', 'aktiv', ['ARAP', 'aktive RAP'], { kurz: 'ARAP' }),
  // Passiv
  k('Eigenkapital', 'passiv', ['EK']),
  k('Privat', 'passiv', ['Privatkonto', 'Privatentnahmen', 'Privateinlagen'], {
    unterkontoVon: 'Eigenkapital',
  }),
  k('Einzelwertberichtigung zu Forderungen', 'passiv', ['EWB'], { kurz: 'EWB' }),
  k('Pauschalwertberichtigung zu Forderungen', 'passiv', ['PWB'], { kurz: 'PWB' }),
  k('Rückstellungen', 'passiv'),
  k('Darlehensschulden', 'passiv', ['Darlehen', 'Verbindlichkeiten gegenüber Kreditinstituten']),
  k(
    'Verbindlichkeiten aus Lieferungen und Leistungen',
    'passiv',
    ['Verbindlichkeiten a. LL', 'Verbindlichkeiten'],
    { kurz: 'Verbindlichkeiten a. LL' },
  ),
  k('Umsatzsteuer', 'passiv', ['USt']),
  k('Sonstige Verbindlichkeiten', 'passiv'),
  k('Passive Rechnungsabgrenzung', 'passiv', ['PRAP', 'passive RAP'], { kurz: 'PRAP' }),
  // Ertrag
  k('Umsatzerlöse für eigene Erzeugnisse', 'ertrag', ['Umsatzerlöse'], { kurz: 'Umsatzerlöse' }),
  k('Erlöse aus innergemeinschaftlicher Lieferung', 'ertrag'),
  k('Umsatzerlöse für Handelswaren', 'ertrag'),
  k('Erlösberichtigungen', 'ertrag', ['Erlösschmälerungen'], {
    unterkontoVon: 'Umsatzerlöse für eigene Erzeugnisse',
    hinweis: 'Unterkonto, Buchung im Soll',
  }),
  k('Bestandsveränderungen', 'ertrag', ['BV'], { hinweis: 'Ertrag oder Aufwand je nach Saldo' }),
  k('Aktivierte Eigenleistungen', 'ertrag'),
  k(
    'Entnahme von Gegenständen und sonstigen Leistungen',
    'ertrag',
    ['Entnahme v. G. u. s. L.', 'unentgeltliche Wertabgaben'],
    { kurz: 'Entnahme v. G. u. s. L.' },
  ),
  k('Zinserträge', 'ertrag'),
  k('Mieterträge', 'ertrag'),
  k('Provisionserträge', 'ertrag'),
  k('Erträge aus der Auflösung von Rückstellungen', 'ertrag'),
  k('Erträge aus abgeschriebenen Forderungen', 'ertrag'),
  // Aufwand
  k('Aufwendungen für Rohstoffe', 'aufwand', ['Rohstoffaufwand']),
  k('Aufwendungen für Hilfsstoffe', 'aufwand'),
  k('Aufwendungen für Betriebsstoffe', 'aufwand'),
  k('Aufwendungen für Vorprodukte und Fremdbauteile', 'aufwand'),
  k('Aufwendungen für Handelswaren', 'aufwand', ['Aufwendungen für Waren']),
  k('Löhne', 'aufwand'),
  k('Gehälter', 'aufwand'),
  k('Soziale Abgaben', 'aufwand'),
  k('Abschreibungen auf Sachanlagen', 'aufwand', ['Abschreibungen auf SA'], {
    kurz: 'Abschreibungen auf SA',
  }),
  k('Abschreibungen auf Forderungen', 'aufwand'),
  k('Einstellung in Wertberichtigungen', 'aufwand'),
  k('Mietaufwendungen', 'aufwand'),
  k('Büromaterial', 'aufwand'),
  k('Fremdinstandhaltung', 'aufwand'),
  k('Werbung', 'aufwand'),
  k('Ausgangsfrachten', 'aufwand'),
  k('Zinsaufwendungen', 'aufwand'),
  k('Betriebssteuern', 'aufwand'),
  k('Sonstige betriebliche Aufwendungen', 'aufwand'),
  // Abschluss
  k('Eröffnungsbilanzkonto', 'abschluss', ['EBK', 'Saldenvortrag', 'SV', 'Saldenvorträge'], {
    kurz: 'EBK',
    hinweis: 'auch Saldenvortrag (SV) genannt',
  }),
  k('Schlussbilanzkonto', 'abschluss', ['SBK'], { kurz: 'SBK' }),
  k('Gewinn- und Verlustkonto', 'abschluss', ['GuV'], { kurz: 'GuV' }),
];

export const KONTOTYP_LABEL: Record<KontoTyp, string> = {
  aktiv: 'Aktivkonto',
  passiv: 'Passivkonto',
  aufwand: 'Aufwandskonto',
  ertrag: 'Ertragskonto',
  abschluss: 'Abschlusskonto',
};

/** Vereinheitlicht Schreibweisen für den Vergleich (Groß/Klein, „u.“/„und“, Satzzeichen). */
export function normalizeKontoName(s: string): string {
  return s
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/\bu\.\s*/g, 'und ')
    .replace(/&/g, ' und ')
    .replace(/\ba\.\s*ll\b/g, 'aus lieferungen und leistungen')
    .replace(/[.,/()\-–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const INDEX = new Map<string, Konto>();
for (const konto of KONTEN) {
  for (const n of [konto.name, konto.kurz, ...konto.synonyme]) {
    const key = normalizeKontoName(n);
    if (!INDEX.has(key)) INDEX.set(key, konto);
  }
}

export function findKonto(input: string): Konto | undefined {
  return INDEX.get(normalizeKontoName(input));
}

export function getKonto(name: string): Konto {
  const konto = findKonto(name);
  if (!konto) throw new Error(`Unbekanntes Konto: ${name}`);
  return konto;
}

/** Kanonischer Name zu einer Eingabe (Synonyme werden aufgelöst). */
export function canonicalKonto(input: string): string | undefined {
  return findKonto(input)?.name;
}

/** Häufig gebrauchte Konten erscheinen bei gleich guten Treffern zuerst. */
const HAEUFIG = new Set([
  'Bank',
  'Vorsteuer',
  'Umsatzsteuer',
  'Verbindlichkeiten aus Lieferungen und Leistungen',
  'Forderungen aus Lieferungen und Leistungen',
  'Rohstoffe',
  'Umsatzerlöse für eigene Erzeugnisse',
  'Schlussbilanzkonto',
  'Gewinn- und Verlustkonto',
  'Eigenkapital',
  'Privat',
  'Erlösberichtigungen',
]);

/** Suche für den Buchungssatz-Builder: Präfixtreffer vor Teiltreffern. */
export function searchKonten(query: string, limit = 50): Konto[] {
  const q = normalizeKontoName(query);
  if (q === '') return [...KONTEN].slice(0, limit);
  const scored: { konto: Konto; score: number }[] = [];
  for (const konto of KONTEN) {
    let best = Infinity;
    for (const n of [konto.name, konto.kurz, ...konto.synonyme]) {
      const norm = normalizeKontoName(n);
      if (norm === q) best = Math.min(best, 0);
      else if (norm.startsWith(q)) best = Math.min(best, 1);
      else if (norm.split(' ').some((w) => w.startsWith(q))) best = Math.min(best, 2);
      else if (norm.includes(q)) best = Math.min(best, 3);
    }
    if (best < Infinity) scored.push({ konto, score: best });
  }
  const rang = (k: Konto) => (HAEUFIG.has(k.name) ? 0 : 1);
  return scored
    .sort(
      (a, b) =>
        a.score - b.score ||
        rang(a.konto) - rang(b.konto) ||
        a.konto.name.localeCompare(b.konto.name, 'de'),
    )
    .slice(0, limit)
    .map((s) => s.konto);
}

export function nachlassKonto(stoff: Stoff): string {
  return `Nachlässe für ${stoff}`;
}

export function bezugskostenKonto(stoff: Stoff): string {
  return `Bezugskosten für ${stoff}`;
}

export function aufwandKonto(stoff: Stoff): string {
  return `Aufwendungen für ${stoff}`;
}

export const STOFF_LISTE = STOFFE;
