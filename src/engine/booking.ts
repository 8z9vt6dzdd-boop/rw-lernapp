// Buchungssatz-Modell, Validierung, Vergleich mit Teilbewertung und Fehlertyp-Erkennung.
import { canonicalKonto, getKonto } from './accounts';
import { Decimal, Val, bewerte, formatEuro, parseNumber, sum, type Dec } from './money';
import type { SatzEingabe, ZeilenErgebnis } from './task';

export type Seite = 'soll' | 'haben';

export interface ErwZeile {
  konto: string;
  betrag: Val;
}

export interface ErwSatz {
  soll: ErwZeile[];
  haben: ErwZeile[];
  /** z. B. „Zahlung“, „Korrektur der Vorsteuer“ */
  label?: string;
}

export interface BuchungsLoesung {
  saetze: ErwSatz[];
  /** true, wenn die Sätze fachlich zulässig zu einem Satz zusammengefasst werden dürfen. */
  zusammenfassbar: boolean;
  /** Bezeichnung der Methode, falls mehrere Lösungen zulässig sind (z. B. „Nettomethode“). */
  methode?: string;
}

export interface Zeile {
  konto: string;
  betrag: Dec;
}

export interface Satz {
  soll: Zeile[];
  haben: Zeile[];
}

// ---------- Hilfsfunktionen zum Aufbau ----------

export function zeile(konto: string, betrag: Val | Dec | number | string): ErwZeile {
  // Prüft beim Aufbau, dass das Konto existiert (Tippfehler in Generatoren fallen sofort auf).
  return { konto: getKonto(konto).name, betrag: Val.of(betrag) };
}

export function satz(soll: ErwZeile[], haben: ErwZeile[], label?: string): ErwSatz {
  return label === undefined ? { soll, haben } : { soll, haben, label };
}

export function loesung(
  saetze: ErwSatz[],
  zusammenfassbar = false,
  methode?: string,
): BuchungsLoesung {
  return methode === undefined ? { saetze, zusammenfassbar } : { saetze, zusammenfassbar, methode };
}

export function sollSumme(s: ErwSatz): Val {
  return sum(s.soll.map((z) => z.betrag));
}

export function habenSumme(s: ErwSatz): Val {
  return sum(s.haben.map((z) => z.betrag));
}

/** Soll = Haben auf 2 Nachkommastellen. */
export function istAusgeglichen(s: ErwSatz): boolean {
  return sollSumme(s).value.equals(habenSumme(s).value);
}

// ---------- Eingabe einlesen ----------

export interface ParseErgebnis {
  saetze: Satz[];
  probleme: string[];
}

export function parseEingabe(eingabe: readonly SatzEingabe[]): ParseErgebnis {
  const probleme: string[] = [];
  const saetze: Satz[] = [];
  for (const s of eingabe) {
    const out: Satz = { soll: [], haben: [] };
    for (const seite of ['soll', 'haben'] as const) {
      for (const z of s[seite]) {
        if (z.konto.trim() === '' && z.betrag.trim() === '') continue;
        const konto = canonicalKonto(z.konto);
        const betrag = parseNumber(z.betrag);
        if (!konto) probleme.push(`Konto „${z.konto}“ ist unbekannt.`);
        if (!betrag)
          probleme.push(`Betrag „${z.betrag}“ bei ${z.konto || 'einer Zeile'} ist ungültig.`);
        out[seite].push({ konto: konto ?? z.konto, betrag: betrag ?? new Decimal(0) });
      }
    }
    if (out.soll.length + out.haben.length > 0) saetze.push(out);
  }
  return { saetze, probleme };
}

// ---------- Vergleich ----------

type Key = `${Seite}|${string}`;

function aggregateErw(saetze: readonly ErwSatz[]): Map<Key, Val> {
  const m = new Map<Key, Val>();
  for (const s of saetze) {
    for (const seite of ['soll', 'haben'] as const) {
      for (const z of s[seite]) {
        const key: Key = `${seite}|${z.konto}`;
        m.set(key, (m.get(key) ?? new Val(0)).plus(z.betrag));
      }
    }
  }
  return m;
}

function aggregateIst(saetze: readonly Satz[]): Map<Key, Dec> {
  const m = new Map<Key, Dec>();
  for (const s of saetze) {
    for (const seite of ['soll', 'haben'] as const) {
      for (const z of s[seite]) {
        const key: Key = `${seite}|${z.konto}`;
        m.set(key, (m.get(key) ?? new Decimal(0)).plus(z.betrag));
      }
    }
  }
  return m;
}

function splitKey(key: Key): [Seite, string] {
  const i = key.indexOf('|');
  return [key.slice(0, i) as Seite, key.slice(i + 1)];
}

function other(seite: Seite): Seite {
  return seite === 'soll' ? 'haben' : 'soll';
}

export function satzSummen(s: Satz): { soll: Dec; haben: Dec } {
  const add = (zs: Zeile[]) => zs.reduce((a, z) => a.plus(z.betrag), new Decimal(0));
  return { soll: add(s.soll), haben: add(s.haben) };
}

interface SatzVergleich {
  punkte: number;
  max: number;
  zeilen: ZeilenErgebnis[];
  ueberzaehlig: { seite: Seite; konto: string }[];
  rundung: boolean;
}

function vergleicheAggregat(
  erw: Map<Key, Val>,
  ist: Map<Key, Dec>,
  satzIndex: number,
): SatzVergleich {
  const zeilen: ZeilenErgebnis[] = [];
  let punkte = 0;
  let rundung = false;
  for (const [key, betrag] of erw) {
    const [seite, konto] = splitKey(key);
    const istBetrag = ist.get(key);
    let status: ZeilenErgebnis['status'];
    if (istBetrag !== undefined) {
      const b = bewerte(istBetrag, betrag, 'betrag');
      if (b === 'falsch') {
        status = 'betrag-falsch';
        punkte += 1;
      } else {
        status = 'richtig';
        punkte += 2;
        if (b === 'rundung') rundung = true;
      }
    } else if (ist.has(`${other(seite)}|${konto}`) && !erw.has(`${other(seite)}|${konto}`)) {
      status = 'seite-falsch';
    } else {
      status = 'fehlt';
    }
    zeilen.push({ seite, konto, erwartet: formatEuro(betrag), status, satz: satzIndex });
  }
  const ueberzaehlig: { seite: Seite; konto: string }[] = [];
  for (const key of ist.keys()) {
    if (erw.has(key)) continue;
    const [seite, konto] = splitKey(key);
    // Auf der falschen Seite gebuchte Konten sind bereits als 'seite-falsch' erfasst.
    if (erw.has(`${other(seite)}|${konto}`) && !ist.has(`${other(seite)}|${konto}`)) continue;
    ueberzaehlig.push({ seite, konto });
  }
  return { punkte, max: erw.size * 2, zeilen, ueberzaehlig, rundung };
}

export interface BuchungsVergleich {
  korrekt: boolean;
  score: number;
  zeilen: ZeilenErgebnis[];
  ueberzaehlig: { seite: Seite; konto: string }[];
  rundung: boolean;
  unausgeglichen: number[];
  /** Erwartete Anzahl Sätze, falls die Struktur nicht stimmt. */
  anzahlHinweis?: number;
  zusammengefasst: boolean;
}

function permutations(n: number, k: number): number[][] {
  // Alle injektiven Zuordnungen von n erwarteten Sätzen auf k eingegebene (−1 = nicht zugeordnet).
  const result: number[][] = [];
  const rec = (i: number, used: Set<number>, acc: number[]) => {
    if (i === n) {
      result.push([...acc]);
      return;
    }
    for (let j = -1; j < k; j++) {
      if (j >= 0 && used.has(j)) continue;
      if (j >= 0) used.add(j);
      acc.push(j);
      rec(i + 1, used, acc);
      acc.pop();
      if (j >= 0) used.delete(j);
    }
  };
  rec(0, new Set(), []);
  return result;
}

function bewerteVergleich(v: { punkte: number; max: number; extra: number }): number {
  if (v.max === 0) return 0;
  return Math.max(0, v.punkte - v.extra) / v.max;
}

export function vergleicheBuchung(erw: BuchungsLoesung, ist: readonly Satz[]): BuchungsVergleich {
  const unausgeglichen = ist
    .map((s, i) => ({ i, sums: satzSummen(s) }))
    .filter(({ sums }) => !sums.soll.equals(sums.haben))
    .map(({ i }) => i);

  // (a) Struktur: erwartete Sätze den eingegebenen zuordnen.
  let best: (SatzVergleich & { extra: number; score: number }) | null = null;
  if (erw.saetze.length <= 5 && ist.length <= 6) {
    for (const perm of permutations(erw.saetze.length, ist.length)) {
      const teile = perm.map((j, i) =>
        vergleicheAggregat(
          aggregateErw([erw.saetze[i] as ErwSatz]),
          j >= 0 ? aggregateIst([ist[j] as Satz]) : new Map(),
          i,
        ),
      );
      const unassigned = ist.filter((_, j) => !perm.includes(j));
      const extraZeilen = unassigned.flatMap((s) =>
        [...aggregateIst([s]).keys()].map((key) => {
          const [seite, konto] = splitKey(key);
          return { seite, konto };
        }),
      );
      const ueberzaehlig = [...teile.flatMap((t) => t.ueberzaehlig), ...extraZeilen];
      const punkte = teile.reduce((a, t) => a + t.punkte, 0);
      const max = teile.reduce((a, t) => a + t.max, 0);
      const extra = ueberzaehlig.length;
      const score = bewerteVergleich({ punkte, max, extra });
      if (!best || score > best.score) {
        best = {
          punkte,
          max,
          extra,
          score,
          zeilen: teile.flatMap((t) => t.zeilen),
          ueberzaehlig,
          rundung: teile.some((t) => t.rundung),
        };
      }
    }
  }

  // (b) Zusammengefasst: alle Sätze addiert vergleichen (zulässig, wenn fachlich gleichwertig).
  let zusammengefasst = false;
  if (erw.zusammenfassbar || erw.saetze.length === 1) {
    const agg = vergleicheAggregat(aggregateErw(erw.saetze), aggregateIst(ist), 0);
    const extra = agg.ueberzaehlig.length;
    const score = bewerteVergleich({ punkte: agg.punkte, max: agg.max, extra });
    if (!best || score > best.score) {
      best = { ...agg, extra, score };
      zusammengefasst = erw.saetze.length > 1 || ist.length > 1;
    }
  }

  const b = best ?? { score: 0, zeilen: [], ueberzaehlig: [], rundung: false };
  const korrekt = b.score === 1 && unausgeglichen.length === 0;
  const result: BuchungsVergleich = {
    korrekt,
    score: unausgeglichen.length > 0 ? b.score * 0.9 : b.score,
    zeilen: b.zeilen,
    ueberzaehlig: b.ueberzaehlig,
    rundung: b.rundung,
    unausgeglichen,
    zusammengefasst,
  };
  if (!korrekt && !erw.zusammenfassbar && ist.length !== erw.saetze.length) {
    result.anzahlHinweis = erw.saetze.length;
  }
  return result;
}

// ---------- Fehlertyp-Erkennung ----------

export interface BuchungsVariante {
  fehlertyp: string;
  loesung: BuchungsLoesung;
}

const STEUER_PAAR: Record<string, string> = {
  Vorsteuer: 'Umsatzsteuer',
  Umsatzsteuer: 'Vorsteuer',
};

/**
 * Erkennt Denkfehler, indem die Eingabe mit typischen falschen Lösungen verglichen wird.
 * Eine Variante gilt als erkannt, wenn die Eingabe alle Buchungen enthält, durch die sich die
 * Variante von der richtigen Lösung unterscheidet.
 */
export function erkenneBuchungsfehler(
  richtig: BuchungsLoesung,
  varianten: readonly BuchungsVariante[],
  ist: readonly Satz[],
): string[] {
  const erw = aggregateErw(richtig.saetze);
  const eingabe = aggregateIst(ist);
  const found = new Set<string>();

  for (const v of varianten) {
    const falsch = aggregateErw(v.loesung.saetze);
    const unterschiede: { key: Key; betrag: Val; betragZaehlt: boolean }[] = [];
    for (const [key, betrag] of falsch) {
      const r = erw.get(key);
      if (r === undefined) unterschiede.push({ key, betrag, betragZaehlt: false });
      else if (!r.value.equals(betrag.value))
        unterschiede.push({ key, betrag, betragZaehlt: true });
    }
    const fehlend = [...erw.keys()].filter((key) => !falsch.has(key));
    if (unterschiede.length === 0 && fehlend.length === 0) continue;
    const enthaelt = unterschiede.every(({ key, betrag, betragZaehlt }) => {
      const ib = eingabe.get(key);
      if (ib === undefined) return false;
      return !betragZaehlt || bewerte(ib, betrag, 'betrag') !== 'falsch';
    });
    // Besteht die Variante nur aus Weglassungen, muss die Eingabe den Rest der Variante vollständig
    // und mit passenden Beträgen enthalten – eine bloß unvollständige Eingabe ist kein Denkfehler.
    const ohne =
      unterschiede.length > 0 ||
      (fehlend.every((key) => !eingabe.has(key)) &&
        [...falsch].every(([key, betrag]) => {
          const ib = eingabe.get(key);
          return ib !== undefined && bewerte(ib, betrag, 'betrag') !== 'falsch';
        }));
    if (enthaelt && ohne && eingabe.size > 0) found.add(v.fehlertyp);
  }

  // Allgemeine Regeln
  let seiteFalsch = 0;
  let richtigeSeite = 0;
  for (const [key] of erw) {
    const [seite, konto] = splitKey(key);
    if (eingabe.has(key)) richtigeSeite++;
    else if (eingabe.has(`${other(seite)}|${konto}`)) seiteFalsch++;
    const paar = STEUER_PAAR[konto];
    if (
      paar &&
      !eingabe.has(key) &&
      eingabe.has(`${seite}|${paar}`) &&
      !erw.has(`${seite}|${paar}`)
    ) {
      found.add('steuer-falsches-konto');
    }
  }
  if (seiteFalsch > 0 && richtigeSeite === 0 && seiteFalsch === erw.size)
    found.add('soll-haben-vertauscht');
  else if (seiteFalsch > 0) found.add('konto-falsche-seite');
  if (ist.some((s) => !satzSummen(s).soll.equals(satzSummen(s).haben)))
    found.add('summen-ungleich');
  return [...found];
}

/** Lesbare Darstellung eines Satzes: „Verbindlichkeiten a. LL 11.900,00 € an Bank 11.662,00 €, …“ */
export function formatSatz(s: ErwSatz): string {
  const fmt = (zs: ErwZeile[]) =>
    zs.map((z) => `${getKonto(z.konto).kurz} ${formatEuro(z.betrag)}`);
  return `${fmt(s.soll).join(', ')} an ${fmt(s.haben).join(', an ')}`;
}
