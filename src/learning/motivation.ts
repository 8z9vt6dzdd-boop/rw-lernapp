// Motivationssystem (10-optik-und-motivation.md, Teil B), vollständig aus den Lernereignissen berechnet.
// Leitplanken: keine Abzüge, keine Schuldgefühle, alles Verpasste ist reparierbar.
import { ABSCHNITTE } from '../content/curriculum';
import { abschnittAbgeschlossen, lektionErledigt, versuche } from './fortschritt';
import type { AttemptEvent, LernEreignis, Tagesziel } from './types';

// ---------- Datum ----------

/** Lokales Datum als YYYY-MM-DD. */
export function tagKey(d: Date | string): string {
  const x = typeof d === 'string' ? new Date(d) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

export function plusTage(tag: string, n: number): string {
  const [y, m, d] = tag.split('-').map(Number) as [number, number, number];
  return tagKey(new Date(y, m - 1, d + n));
}

/** Ganze Kalendertage von `von` bis `bis` (beide „JJJJ-MM-TT“), unabhängig von Sommerzeit. */
export function tageZwischen(von: string, bis: string): number {
  const utc = (t: string) => {
    const [y, mo, d] = t.split('-').map(Number) as [number, number, number];
    return Date.UTC(y, mo - 1, d);
  };
  return Math.round((utc(bis) - utc(von)) / 86_400_000);
}

export function montagVon(tag: string): string {
  const [y, m, d] = tag.split('-').map(Number) as [number, number, number];
  const x = new Date(y, m - 1, d);
  return plusTage(tag, -((x.getDay() + 6) % 7));
}

// ---------- Tageswerte und Tagesziel ----------

export interface TagesWerte {
  lektionen: number;
  minuten: number;
  karten: number;
  aufgaben: number;
  ohneHilfe: number;
  erkannt: number;
  /** längste Folge beim ersten Versuch gelöster Aufgaben */
  folgeRichtig: number;
}

export function tagesWerte(events: readonly LernEreignis[], tag: string): TagesWerte {
  const heute = events.filter((e) => tagKey(e.ts) === tag).sort((a, b) => a.ts.localeCompare(b.ts));
  let ms = 0;
  const w: TagesWerte = {
    lektionen: 0,
    minuten: 0,
    karten: 0,
    aufgaben: 0,
    ohneHilfe: 0,
    erkannt: 0,
    folgeRichtig: 0,
  };
  let folge = 0;
  for (const e of heute) {
    if (e.typ === 'lektion') {
      ms += e.durationMs;
      if (e.art === 'abgeschlossen' || e.art === 'wiederholt') w.lektionen++;
    } else if (e.typ === 'ueberspringen') {
      ms += e.durationMs;
    } else if (e.typ === 'attempt') {
      ms += e.durationMs;
      if (e.variant === 'erkennen') {
        if (e.correct) w.erkannt++;
      } else if (e.variant?.startsWith('mc:') || e.variant?.startsWith('karte:')) {
        w.karten++;
      } else {
        w.aufgaben++;
        if (e.correct && e.hintsUsed === 0) w.ohneHilfe++;
      }
      folge = e.correct ? folge + 1 : 0;
      w.folgeRichtig = Math.max(w.folgeRichtig, folge);
    }
  }
  w.minuten = Math.floor(ms / 60_000);
  return w;
}

export const ZIELE: Record<
  Tagesziel,
  { lektionen: number; minuten: number; karten: number; text: string }
> = {
  leicht: {
    lektionen: 1,
    minuten: 3,
    karten: 5,
    text: 'eine Lektion oder 3 Minuten oder 5 Karten',
  },
  normal: {
    lektionen: 1,
    minuten: 5,
    karten: 10,
    text: 'eine Lektion oder 5 Minuten oder 10 Karten',
  },
  intensiv: {
    lektionen: 2,
    minuten: 10,
    karten: 20,
    text: 'zwei Lektionen oder 10 Minuten oder 20 Karten',
  },
};

export function zielErreicht(w: TagesWerte, stufe: Tagesziel, faktor = 1): boolean {
  const z = ZIELE[stufe];
  return (
    w.lektionen >= z.lektionen * faktor ||
    w.minuten >= z.minuten * faktor ||
    w.karten >= z.karten * faktor
  );
}

/** Fortschritt zum Tagesziel 0–1 (bestes der drei Kriterien). */
export function zielFortschritt(w: TagesWerte, stufe: Tagesziel): number {
  const z = ZIELE[stufe];
  return Math.min(
    1,
    Math.max(w.lektionen / z.lektionen, w.minuten / z.minuten, w.karten / z.karten),
  );
}

// ---------- Serie mit Serienschutz und Reparatur ----------

export interface Serie {
  laenge: number;
  /** verfügbare Serienschutz-Tage (max. 2) */
  schutz: number;
  heuteErreicht: boolean;
  /** Tage, die durch Serienschutz überbrückt wurden */
  geschuetzt: string[];
  /** gerissene Serie, die noch repariert werden kann */
  reparatur?: { verpasst: string; bis: string; vorher: number };
  /** höchster erreichter Meilenstein (7, 30, 50, 100) */
  meilenstein?: number;
  rekord: number;
}

export const SERIEN_MEILENSTEINE = [7, 30, 50, 100] as const;
export const MAX_SCHUTZ = 2;

/**
 * Regeln (10-optik B2): Ein Tag zählt, wenn das Tagesziel erreicht ist. Je 7 Serientage gibt es einen
 * Serienschutz (höchstens 2). Ein verpasster Tag verbraucht automatisch einen Schutz. Ohne Schutz reißt
 * die Serie, lässt sich aber innerhalb von 48 Stunden reparieren, indem man an einem Tag das doppelte
 * Tagesziel schafft. Der heutige Tag reißt die Serie nie, er ist nur „noch offen“.
 */
export function serie(events: readonly LernEreignis[], stufe: Tagesziel, heute: string): Serie {
  const tage = [...new Set(events.map((e) => tagKey(e.ts)))].sort();
  const res: Serie = { laenge: 0, schutz: 0, heuteErreicht: false, geschuetzt: [], rekord: 0 };
  if (tage.length === 0) return res;
  let laenge = 0;
  let schutz = 0;
  let seitSchutz = 0;
  let reparatur: Serie['reparatur'];
  const werte = new Map<string, TagesWerte>();
  const w = (t: string) => {
    if (!werte.has(t)) werte.set(t, tagesWerte(events, t));
    return werte.get(t)!;
  };
  for (let t = tage[0]!; t <= heute; t = plusTage(t, 1)) {
    const erreicht = zielErreicht(w(t), stufe);
    if (reparatur && t > reparatur.bis) reparatur = undefined;
    if (erreicht) {
      if (reparatur && zielErreicht(w(t), stufe, 2)) {
        // Reparatur: der verpasste Tag zählt nachträglich mit, ebenso die Tage seitdem
        laenge = reparatur.vorher + 1 + laenge;
        seitSchutz = laenge % 7;
        reparatur = undefined;
      }
      laenge++;
      seitSchutz++;
      if (seitSchutz >= 7) {
        schutz = Math.min(MAX_SCHUTZ, schutz + 1);
        seitSchutz = 0;
      }
      if (t === heute) res.heuteErreicht = true;
    } else if (t !== heute) {
      // Ein zweiter verpasster Tag beendet die Reparaturmöglichkeit
      if (reparatur) reparatur = undefined;
      if (laenge > 0 && schutz > 0) {
        schutz--;
        res.geschuetzt.push(t);
      } else if (laenge > 0) {
        reparatur = { verpasst: t, bis: plusTage(t, 2), vorher: laenge };
        laenge = 0;
        seitSchutz = 0;
      }
    }
    res.rekord = Math.max(res.rekord, laenge);
  }
  res.laenge = laenge;
  res.schutz = schutz;
  if (reparatur && laenge < reparatur.vorher) res.reparatur = reparatur;
  const m = [...SERIEN_MEILENSTEINE].reverse().find((x) => res.rekord >= x);
  if (m) res.meilenstein = m;
  return res;
}

// ---------- Tagesaufgaben ----------

export interface Tagesaufgabe {
  id: string;
  text: string;
  ziel: number;
  stand: number;
  erledigt: boolean;
}

const AUFGABEN_POOL: { id: string; text: string; ziel: number; wert: (w: TagesWerte) => number }[] =
  [
    { id: 'lektion', text: 'Schließe eine Lektion ab', ziel: 1, wert: (w) => w.lektionen },
    { id: 'ohne-hilfe', text: 'Löse 3 Aufgaben ohne Hilfe', ziel: 3, wert: (w) => w.ohneHilfe },
    { id: 'aufgaben', text: 'Bearbeite 5 Übungsaufgaben', ziel: 5, wert: (w) => w.aufgaben },
    { id: 'erkennen', text: 'Erkenne 2 Aufgabentypen richtig', ziel: 2, wert: (w) => w.erkannt },
    { id: 'minuten', text: 'Lerne 10 Minuten', ziel: 10, wert: (w) => w.minuten },
    {
      id: 'folge',
      text: 'Löse 3 Aufgaben hintereinander richtig',
      ziel: 3,
      wert: (w) => w.folgeRichtig,
    },
  ];

function tagSeed(tag: string): number {
  return [...tag].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
}

export function tagesaufgaben(events: readonly LernEreignis[], tag: string): Tagesaufgabe[] {
  const w = tagesWerte(events, tag);
  const seed = tagSeed(tag);
  // Immer eine Lern-Aufgabe (Lektion oder Minuten) plus zwei Übungsaufgaben
  const erste = AUFGABEN_POOL[seed % 2 === 0 ? 0 : 4]!;
  const rest = AUFGABEN_POOL.filter((a) => a.id !== 'lektion' && a.id !== 'minuten');
  const zweite = rest[seed % rest.length]!;
  const dritte = rest[(seed + 1 + ((seed >> 3) % (rest.length - 1))) % rest.length]!;
  return [erste, zweite, dritte].map((a) => {
    const stand = Math.min(a.ziel, a.wert(w));
    return { id: a.id, text: a.text, ziel: a.ziel, stand, erledigt: stand >= a.ziel };
  });
}

// ---------- XP und Stufen ----------

export const XP = {
  lektion: 20,
  lektionUebersprungen: 10,
  lektionWiederholt: 5,
  aufgabeRichtig: 5,
  aufgabeGeuebt: 2,
  ueberspringenBestanden: 10,
  tagesaufgabe: 10,
  alleTagesaufgaben: 20,
} as const;

export function xpFuer(e: LernEreignis): number {
  switch (e.typ) {
    case 'lektion':
      return e.art === 'abgeschlossen'
        ? XP.lektion
        : e.art === 'uebersprungen'
          ? XP.lektionUebersprungen
          : XP.lektionWiederholt;
    case 'attempt':
      return e.correct ? XP.aufgabeRichtig : XP.aufgabeGeuebt;
    case 'ueberspringen':
      return e.bestanden ? XP.ueberspringenBestanden : 0;
    default:
      return 0;
  }
}

export function xpGesamt(events: readonly LernEreignis[]): number {
  let xp = events.reduce((a, e) => a + xpFuer(e), 0);
  for (const tag of new Set(events.map((e) => tagKey(e.ts)))) {
    const ta = tagesaufgaben(events, tag);
    const n = ta.filter((t) => t.erledigt).length;
    xp += n * XP.tagesaufgabe + (n === ta.length ? XP.alleTagesaufgaben : 0);
  }
  return xp;
}

/** Stufe n beginnt bei 50 · n · (n − 1) XP: 1 → 0, 2 → 100, 3 → 300, 4 → 600 … */
export function stufe(xp: number): { stufe: number; von: number; bis: number } {
  let n = 1;
  while (50 * (n + 1) * n <= xp) n++;
  return { stufe: n, von: 50 * n * (n - 1), bis: 50 * (n + 1) * n };
}

// ---------- Karriere bei der MBG ----------

export const KARRIERE = [
  { stufe: 1, titel: 'Neu im Team', bedingung: 'Start', abschnitte: [] as string[] },
  {
    stufe: 2,
    titel: 'Assistenz Buchhaltung',
    bedingung: 'Abschnitte 0, A und B',
    abschnitte: ['0', 'A', 'B'],
  },
  {
    stufe: 3,
    titel: 'Sachbearbeitung Kreditoren und Debitoren',
    bedingung: 'Abschnitte C und D',
    abschnitte: ['C', 'D'],
  },
  { stufe: 4, titel: 'Bilanzbuchhaltung', bedingung: 'Abschnitte E und F', abschnitte: ['E', 'F'] },
  {
    stufe: 5,
    titel: 'Controlling',
    bedingung: 'Abschnitte G bis J',
    abschnitte: ['G', 'H', 'I', 'J'],
  },
  {
    stufe: 6,
    titel: 'Leitung Rechnungswesen',
    bedingung: 'Abschnitt K und eine bestandene Probeklausur',
    abschnitte: ['K'],
  },
] as const;

export function karriere(events: readonly LernEreignis[]): {
  aktuell: (typeof KARRIERE)[number];
  naechste?: (typeof KARRIERE)[number];
  fortschritt: number;
} {
  const fertig = new Set(
    ABSCHNITTE.filter((a) => abschnittAbgeschlossen(events, a)).map((a) => a.id),
  );
  let aktuell: (typeof KARRIERE)[number] = KARRIERE[0];
  for (const k of KARRIERE.slice(1)) {
    // Stufe 6 verlangt zusätzlich eine bestandene Probeklausur (folgt mit M4)
    if (k.stufe === 6) break;
    if (k.abschnitte.every((a) => fertig.has(a))) aktuell = k;
    else break;
  }
  const naechste = KARRIERE.find((k) => k.stufe === aktuell.stufe + 1);
  let fortschritt = 1;
  if (naechste) {
    const knoten = ABSCHNITTE.filter((a) =>
      (naechste.abschnitte as readonly string[]).includes(a.id),
    ).flatMap((a) => a.skills);
    const erledigt = knoten.filter(
      (s) => lektionErledigt(events, s.id) || versuche(events, s.id).some((e) => e.correct),
    ).length;
    fortschritt = knoten.length === 0 ? 0 : erledigt / knoten.length;
  }
  return naechste ? { aktuell, naechste, fortschritt } : { aktuell, fortschritt };
}

// ---------- Erfolge ----------

export interface Erfolg {
  id: string;
  titel: string;
  text: string;
  /** Symbol für die kleine Illustration */
  symbol:
    | 'stern'
    | 'waage'
    | 'flamme'
    | 'lupe'
    | 'dose'
    | 'rechner'
    | 'buch'
    | 'mond'
    | 'sonne'
    | 'wolke'
    | 'pokal'
    | 'treppe';
  erreicht: boolean;
}

function richtigeVersuche(events: readonly LernEreignis[], skillIds: string[]): number {
  return events.filter(
    (e): e is AttemptEvent =>
      e.typ === 'attempt' && skillIds.includes(e.skillId) && e.correct && e.variant !== 'erkennen',
  ).length;
}

export function erfolge(
  events: readonly LernEreignis[],
  stufeZiel: Tagesziel,
  heute: string,
): Erfolg[] {
  const attempts = events.filter((e): e is AttemptEvent => e.typ === 'attempt');
  const s = serie(events, stufeZiel, heute);
  const lektionen = events.filter((e) => e.typ === 'lektion' && e.art !== 'wiederholt');
  const fehlerGefunden = events.reduce(
    (a, e) => a + (e.typ === 'lektion' ? (e.fehlerGefunden ?? 0) : 0),
    0,
  );
  const stunden = events.map((e) => new Date(e.ts).getHours());
  const tage = [...new Set(events.map((e) => tagKey(e.ts)))];
  const def: Omit<Erfolg, 'erreicht'>[] = [];
  const add = (id: string, titel: string, text: string, symbol: Erfolg['symbol'], ok: boolean) => {
    def.push({ id, titel, text, symbol });
    return ok;
  };
  const ok: boolean[] = [
    add(
      'erste-lektion',
      'Erster Arbeitstag',
      'Die erste Lektion abgeschlossen.',
      'stern',
      lektionen.length > 0,
    ),
    add(
      'erste-bilanz',
      'Erste Bilanz aufgestellt',
      'Lektion „Die Bilanz“ geschafft.',
      'waage',
      lektionErledigt(events, '0.3-bilanz'),
    ),
    add(
      'doppik',
      'Alles doppelt',
      'Die doppelte Buchführung verstanden.',
      'waage',
      lektionErledigt(events, '0.5-doppik'),
    ),
    add(
      'konto',
      'Kontoführung',
      'Soll und Haben sitzen.',
      'buch',
      lektionErledigt(events, '0.6-konto'),
    ),
    add(
      'grundverstaendnis',
      'Grundverständnis',
      'Abschnitt 0 komplett abgeschlossen.',
      'pokal',
      abschnittAbgeschlossen(events, ABSCHNITTE[0]!),
    ),
    add(
      'skonto-profi',
      'Skonto-Profi',
      '5 Skonto-Aufgaben richtig gelöst.',
      'rechner',
      richtigeVersuche(events, ['C5-skonto-einkauf', 'D4-skonto-verkauf']) >= 5,
    ),
    add(
      'ust',
      'Finanzamt-freundlich',
      '3 Umsatzsteuer-Abschlüsse richtig.',
      'rechner',
      richtigeVersuche(events, ['B3-ust-abschluss']) >= 3,
    ),
    add(
      'bestand',
      'Inventur-Ass',
      '3 Aufgaben zu Bestandsveränderungen richtig.',
      'dose',
      richtigeVersuche(events, ['E4-bestandsveraenderung']) >= 3,
    ),
    add(
      'afa',
      'Wertverzehr verstanden',
      '3 Abschreibungsaufgaben richtig.',
      'treppe',
      richtigeVersuche(events, ['H4-kalk-afa']) >= 3,
    ),
    add(
      'stufenleiter',
      'Stufenleiter erklommen',
      '3 Stufenleiter-Aufgaben richtig.',
      'treppe',
      richtigeVersuche(events, ['I4-stufenleiter']) >= 3,
    ),
    add(
      'simultan',
      'Simultanverfahren geknackt',
      '3 Simultan-Aufgaben richtig.',
      'rechner',
      richtigeVersuche(events, ['I5-simultan']) >= 3,
    ),
    add(
      'aequivalenz',
      'Dosengrößen kalkuliert',
      '3 Äquivalenzziffer-Aufgaben richtig.',
      'dose',
      richtigeVersuche(events, ['J3-aequivalenz']) >= 3,
    ),
    add(
      'zuschlag',
      'Kalkulationsprofi',
      '3 Zuschlagskalkulationen richtig.',
      'rechner',
      richtigeVersuche(events, ['J4-zuschlag']) >= 3,
    ),
    add(
      'serie-7',
      '7 Tage am Stück',
      'Eine Woche lang jeden Tag gelernt.',
      'flamme',
      s.rekord >= 7,
    ),
    add('serie-30', '30 Tage am Stück', 'Einen Monat durchgehalten.', 'flamme', s.rekord >= 30),
    add(
      'serie-100',
      '100 Tage am Stück',
      'Hundert Tage – beeindruckend.',
      'flamme',
      s.rekord >= 100,
    ),
    add(
      'fehlerjaeger',
      'Fehlerjäger',
      '10 Fehler in Fehlerjagd-Aufgaben gefunden.',
      'lupe',
      fehlerGefunden >= 10,
    ),
    add(
      'adlerauge',
      'Adlerauge',
      '10 Aufgabentypen richtig erkannt.',
      'lupe',
      attempts.filter((e) => e.variant === 'erkennen' && e.correct).length >= 10,
    ),
    add(
      'ohne-stuetzraeder',
      'Ohne Stützräder',
      '10 Aufgaben ohne Hilfe gelöst.',
      'stern',
      attempts.filter((e) => e.correct && e.hintsUsed === 0 && e.variant !== 'erkennen').length >=
        10,
    ),
    add('hundert', 'Hundert Aufgaben', '100 Aufgaben bearbeitet.', 'pokal', attempts.length >= 100),
    add(
      'alles-erledigt',
      'Alles erledigt',
      'An einem Tag alle drei Tagesaufgaben geschafft.',
      'stern',
      tage.some((t) => tagesaufgaben(events, t).every((a) => a.erledigt)),
    ),
    add(
      'schon-gewusst',
      'Schon gewusst',
      'Einen Überspringen-Test bestanden.',
      'buch',
      events.some((e) => e.typ === 'ueberspringen' && e.bestanden),
    ),
    add(
      'ohne-netz',
      'Ohne Netz',
      'Offline gelernt.',
      'wolke',
      events.some((e) => (e.typ === 'attempt' || e.typ === 'lektion') && e.offline === true),
    ),
    add(
      'frueher-vogel',
      'Früher Vogel',
      'Vor 7 Uhr gelernt.',
      'sonne',
      stunden.some((h) => h < 7),
    ),
    add(
      'nachteule',
      'Nachteule',
      'Nach 22 Uhr gelernt.',
      'mond',
      stunden.some((h) => h >= 22),
    ),
    add('stufe-5', 'Fleißig', 'Stufe 5 erreicht.', 'pokal', stufe(xpGesamt(events)).stufe >= 5),
  ];
  return def.map((d, i) => ({ ...d, erreicht: ok[i] ?? false }));
}

// ---------- Wochenrückblick ----------

export interface Wochenrueckblick {
  von: string;
  bis: string;
  minuten: number;
  lektionen: number;
  aufgaben: number;
  aktiveTage: number;
  staerkstesThema?: string;
}

export function wochenrueckblick(events: readonly LernEreignis[], heute: string): Wochenrueckblick {
  const von = plusTage(montagVon(heute), -7);
  const bis = plusTage(von, 6);
  const woche = events.filter((e) => {
    const t = tagKey(e.ts);
    return t >= von && t <= bis;
  });
  const tage = [...new Set(woche.map((e) => tagKey(e.ts)))];
  const werte = tage.map((t) => tagesWerte(woche, t));
  const jeSkill = new Map<string, number>();
  for (const e of woche)
    if (e.typ === 'attempt' && e.correct) jeSkill.set(e.skillId, (jeSkill.get(e.skillId) ?? 0) + 1);
  const staerkstes = [...jeSkill.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const r: Wochenrueckblick = {
    von,
    bis,
    minuten: werte.reduce((a, w) => a + w.minuten, 0),
    lektionen: werte.reduce((a, w) => a + w.lektionen, 0),
    aufgaben: werte.reduce((a, w) => a + w.aufgaben, 0),
    aktiveTage: tage.length,
  };
  if (staerkstes) r.staerkstesThema = staerkstes;
  return r;
}
