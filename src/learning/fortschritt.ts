// Fortschritt je Skill und Abschnitt, abgeleitet aus den Lernereignissen (Event-Sourcing).
import { ABSCHNITTE, RELEVANZ_GEWICHT, type Abschnitt, type Skill } from '../content/curriculum';
import { lektionFuerSkill } from '../content/lessons';
import { generatorFuer } from '../engine/generators';
import { karten, skillStand } from './scheduler';
import type { AttemptEvent, LernEreignis } from './types';

export type KnotenStatus = 'erledigt' | 'offen' | 'gesperrt' | 'bald';

export interface Knoten {
  skill: Skill;
  typ: 'lektion' | 'uebung';
  status: KnotenStatus;
  /** z. B. „3 von 5 gelöst“ */
  info?: string;
}

export function lektionErledigt(events: readonly LernEreignis[], skillId: string): boolean {
  return events.some(
    (e) =>
      (e.typ === 'lektion' && e.skillId === skillId && e.art !== 'wiederholt') ||
      (e.typ === 'ueberspringen' && e.bestanden && e.skillsErledigt.includes(skillId)),
  );
}

export function versuche(events: readonly LernEreignis[], skillId: string): AttemptEvent[] {
  return events.filter(
    (e): e is AttemptEvent =>
      e.typ === 'attempt' &&
      e.skillId === skillId &&
      e.variant !== 'erkennen' &&
      !e.variant?.startsWith('mc:'),
  );
}

/** Übung bestanden: mindestens eine Aufgabe des Skills beim ersten Versuch gelöst. */
export function uebungBestanden(events: readonly LernEreignis[], skillId: string): boolean {
  return versuche(events, skillId).some((e) => e.correct);
}

export function hatLektion(skillId: string): boolean {
  return lektionFuerSkill(skillId) !== undefined;
}

export function hatUebung(skillId: string): boolean {
  return generatorFuer(skillId) !== undefined;
}

export function knotenFuer(events: readonly LernEreignis[], a: Abschnitt): Knoten[] {
  const out: Knoten[] = [];
  for (const skill of a.skills) {
    const lektion = hatLektion(skill.id);
    const uebung = hatUebung(skill.id) || skill.art === 'fall';
    const lDone = lektion && lektionErledigt(events, skill.id);
    if (lektion) out.push({ skill, typ: 'lektion', status: lDone ? 'erledigt' : 'offen' });
    else if (skill.art === 'lektion' || skill.art === 'theorie')
      out.push({ skill, typ: 'lektion', status: 'bald' });
    if (uebung) {
      const v = versuche(events, skill.id);
      const geloest = v.filter((e) => e.correct).length;
      const k: Knoten = {
        skill,
        typ: 'uebung',
        status: lektion && !lDone ? 'gesperrt' : geloest > 0 ? 'erledigt' : 'offen',
      };
      if (v.length > 0) k.info = `${geloest} von ${v.length} gelöst`;
      out.push(k);
    } else if (skill.art === 'generator' || skill.art === 'fall') {
      out.push({ skill, typ: 'uebung', status: 'bald' });
    }
  }
  return out;
}

export function abschnittAbgeschlossen(events: readonly LernEreignis[], a: Abschnitt): boolean {
  const k = knotenFuer(events, a);
  return k.length > 0 && k.every((x) => x.status === 'erledigt');
}

/** Nächster sinnvoller Schritt im Pfad: erste offene Lektion, sonst erste offene Übung. */
export function naechsterKnoten(events: readonly LernEreignis[]): Knoten | undefined {
  const alle = ABSCHNITTE.flatMap((a) => knotenFuer(events, a));
  return (
    alle.find((k) => k.status === 'offen' && k.typ === 'lektion') ??
    alle.find((k) => k.status === 'offen')
  );
}

/**
 * Klausur-Readiness (0–1): Mittel der Abrufwahrscheinlichkeiten aller Skills (FSRS), gewichtet nach
 * Klausurrelevanz (01-didaktik.md). Nie geübte Skills zählen mit 0.
 */
export function readiness(
  events: readonly LernEreignis[],
  abschnitt?: Abschnitt,
  now = new Date(),
): number {
  const k = karten(events);
  const abschnitte = abschnitt ? [abschnitt] : ABSCHNITTE;
  let summe = 0;
  let gewicht = 0;
  for (const a of abschnitte) {
    for (const s of a.skills) {
      const w = RELEVANZ_GEWICHT[s.relevanz];
      gewicht += w;
      summe += w * (skillStand(k, s.id, now) ?? 0);
    }
  }
  return gewicht === 0 ? 0 : summe / gewicht;
}

/** Kompetenzring je Skill (0–1) oder null, wenn noch nichts gelernt wurde. */
export function kompetenzRinge(
  events: readonly LernEreignis[],
  now = new Date(),
): Map<string, number | null> {
  const k = karten(events);
  return new Map(
    ABSCHNITTE.flatMap((a) => a.skills.map((s) => [s.id, skillStand(k, s.id, now)] as const)),
  );
}
