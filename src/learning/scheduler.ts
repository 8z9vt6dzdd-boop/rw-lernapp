// Wiederholungsplanung mit FSRS (ts-fsrs). Der FSRS-Zustand wird nie gespeichert, sondern jederzeit aus den
// Lernereignissen rekonstruiert (05-technik.md) – so lassen sich Lernstände mehrerer Geräte konfliktfrei vereinen.
import { createEmptyCard, fsrs, type Card, type Grade } from 'ts-fsrs';
import { LEKTIONEN, lektionFuerSkill } from '../content/lessons';
import { generatorFuer } from '../engine/generators';
import { tagKey } from './motivation';
import type { AttemptEvent, LernEreignis } from './types';

const SCHEDULER = fsrs({ enable_fuzz: false, request_retention: 0.9 });

export type KartenArt = 'skill' | 'karte';

export interface Karte {
  /** Skill-ID oder „karte:<Merksatz-ID>“ */
  id: string;
  art: KartenArt;
  skillId: string;
  card: Card;
  status: 'neu' | 'in-uebung' | 'gefestigt';
  /** Tage (YYYY-MM-DD), an denen ohne Hilfe richtig gelöst wurde */
  richtigOhneHilfe: string[];
  wiederholungen: number;
}

export interface MerksatzKarte {
  id: string;
  skillId: string;
  lektionId: string;
  frage: string;
  antwort: string;
}

/** Alle Merksätze der Lektionen als Wiederholungskarten. */
export function merksatzKarten(): MerksatzKarte[] {
  return LEKTIONEN.flatMap((l) =>
    l.screens.flatMap((s) =>
      s.typ === 'merksatz'
        ? [{ id: s.id, skillId: l.skillId, lektionId: l.id, frage: s.frage, antwort: s.text }]
        : [],
    ),
  );
}

const KARTE_PREFIX = 'karte:';

function karteNeu(id: string, art: KartenArt, skillId: string, now: Date): Karte {
  return {
    id,
    art,
    skillId,
    card: createEmptyCard(now),
    status: 'neu',
    richtigOhneHilfe: [],
    wiederholungen: 0,
  };
}

function bewerten(k: Karte, grade: Grade, now: Date): void {
  k.card = SCHEDULER.next(k.card, now, grade).card;
  k.wiederholungen++;
  if (k.status === 'neu') k.status = 'in-uebung';
}

/** Übung eines Skills zählt nur für Rechen-/Buchungsaufgaben (nicht „erkennen“, nicht Verständnisfragen). */
function istUebung(e: AttemptEvent): boolean {
  return (
    !e.variant ||
    (e.variant !== 'erkennen' &&
      !e.variant.startsWith('mc:') &&
      !e.variant.startsWith(KARTE_PREFIX))
  );
}

/** Rekonstruiert alle Karten aus den Ereignissen (Reihenfolge nach Zeitstempel). */
export function karten(events: readonly LernEreignis[]): Map<string, Karte> {
  const m = new Map<string, Karte>();
  const merks = merksatzKarten();
  const sortiert = [...events].sort((a, b) => a.ts.localeCompare(b.ts));
  const holen = (id: string, art: KartenArt, skillId: string, now: Date) => {
    let k = m.get(id);
    if (!k) {
      k = karteNeu(id, art, skillId, now);
      m.set(id, k);
    }
    return k;
  };
  for (const e of sortiert) {
    const now = new Date(e.ts);
    if (e.typ === 'attempt') {
      if (e.variant?.startsWith(KARTE_PREFIX)) {
        bewerten(holen(e.variant, 'karte', e.skillId, now), e.fsrsRating as Grade, now);
      } else if (istUebung(e) && generatorFuer(e.skillId)) {
        const k = holen(e.skillId, 'skill', e.skillId, now);
        bewerten(k, e.fsrsRating as Grade, now);
        const tag = tagKey(now);
        if (e.correct && e.hintsUsed === 0 && !k.richtigOhneHilfe.includes(tag))
          k.richtigOhneHilfe.push(tag);
        // 01-didaktik: gefestigt nach 3 korrekten Lösungen ohne Hilfe an unterschiedlichen Tagen
        if (k.richtigOhneHilfe.length >= 3) k.status = 'gefestigt';
      }
    } else if (e.typ === 'lektion' && e.art !== 'wiederholt') {
      // Nach der Lektion: Merksätze kommen als neue Karten in die Wiederholung, die Übung wird fällig
      for (const ms of merks.filter((x) => x.lektionId === e.lektionId))
        holen(KARTE_PREFIX + ms.id, 'karte', e.skillId, now);
      if (generatorFuer(e.skillId)) holen(e.skillId, 'skill', e.skillId, now);
      if (e.art === 'uebersprungen') {
        // Übersprungen: günstige Startbewertung (09-lektionen.md, Abschnitt 7)
        for (const ms of merks.filter((x) => x.lektionId === e.lektionId)) {
          const k = m.get(KARTE_PREFIX + ms.id)!;
          if (k.wiederholungen === 0) bewerten(k, 3, now);
        }
      }
    } else if (e.typ === 'ueberspringen' && e.bestanden) {
      for (const skillId of e.skillsErledigt) {
        const l = lektionFuerSkill(skillId);
        for (const ms of merks.filter((x) => x.lektionId === l?.id)) {
          const k = holen(KARTE_PREFIX + ms.id, 'karte', skillId, now);
          if (k.wiederholungen === 0) bewerten(k, 3, now);
        }
        if (generatorFuer(skillId)) {
          const k = holen(skillId, 'skill', skillId, now);
          if (k.wiederholungen === 0) bewerten(k, 3, now);
        }
      }
    }
  }
  return m;
}

/** Abrufwahrscheinlichkeit 0–1 (neue, nie geübte Karten: 0). */
export function abrufwahrscheinlichkeit(k: Karte, now: Date): number {
  if (k.wiederholungen === 0) return 0;
  return SCHEDULER.retrievability(k.card, now);
}

export function faellig(k: Karte, now: Date): boolean {
  return k.card.due.getTime() <= now.getTime();
}

/** Stand eines Skills 0–1 für Kompetenzring und Readiness. */
export function skillStand(
  kartenMap: Map<string, Karte>,
  skillId: string,
  now: Date,
): number | null {
  const skill = kartenMap.get(skillId);
  const merk = [...kartenMap.values()].filter((k) => k.art === 'karte' && k.skillId === skillId);
  const werte: number[] = [];
  if (skill) werte.push(abrufwahrscheinlichkeit(skill, now));
  if (merk.length > 0)
    werte.push(merk.reduce((a, k) => a + abrufwahrscheinlichkeit(k, now), 0) / merk.length);
  if (werte.length === 0) return null;
  // Übung zählt doppelt so viel wie Merksätze, weil die Klausur Rechnen und Buchen verlangt
  return skill && merk.length > 0 ? (2 * werte[0]! + werte[1]!) / 3 : werte[0]!;
}

export { SCHEDULER };
