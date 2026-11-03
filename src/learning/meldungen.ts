// Meldefunktion (07-content-pipeline.md): Gemeldete Inhalte verschwinden sofort aus den Sitzungen.
import { lektion } from '../content/lessons';
import { THEORIE } from '../content/theory';
import type { TaskSpec } from './prepare';
import { skillTitel } from './prepare';
import { merksatzKarten } from './scheduler';
import type { LernEreignis, MeldungEvent } from './types';

/** Element-ID eines Sitzungsinhalts: Generator-Aufgaben je Skill, Karten und Fragen je Element. */
export function elementIdVon(spec: Pick<TaskSpec, 'art' | 'skillId' | 'elementId'>): string {
  if (spec.art === 'karte') return `karte:${spec.elementId ?? ''}`;
  if (spec.art === 'mc' || spec.art === 'kurzantwort') return `theorie:${spec.elementId ?? ''}`;
  return `aufgabe:${spec.skillId}`;
}

/** Aktuell gemeldete Elemente (jüngste Meldung je Element zählt; zurückgezogen = wieder aktiv). */
export function gemeldeteMeldungen(events: readonly LernEreignis[]): Map<string, MeldungEvent> {
  const m = new Map<string, MeldungEvent>();
  const sortiert = events
    .filter((e): e is MeldungEvent => e.typ === 'meldung')
    .sort((a, b) => a.ts.localeCompare(b.ts));
  for (const e of sortiert) {
    if (e.zurueckgezogen) m.delete(e.elementId);
    else m.set(e.elementId, e);
  }
  return m;
}

export function gemeldet(events: readonly LernEreignis[]): Set<string> {
  return new Set(gemeldeteMeldungen(events).keys());
}

/** Lesbare Bezeichnung für die Liste „Gemeldete Inhalte“. */
export function elementTitel(elementId: string): string {
  const [art, ...rest] = elementId.split(':');
  const id = rest.join(':');
  if (art === 'aufgabe') return `Übung: ${skillTitel(id)}`;
  if (art === 'karte') {
    const k = merksatzKarten().find((x) => x.id === id);
    return k ? `Karte: ${k.frage}` : `Karte ${id}`;
  }
  if (art === 'theorie') {
    const t = THEORIE.find((x) => x.id === id);
    return t && 'frage' in t ? `Frage: ${String(t.frage)}` : `Theorie ${id}`;
  }
  if (art === 'lektion') {
    const [lid, nr] = id.split(':');
    const l = lid ? lektion(lid) : undefined;
    return l
      ? `Lektion ${l.id}: ${l.titel}${nr ? `, Bildschirm ${Number(nr) + 1}` : ''}`
      : `Lektion ${id}`;
  }
  return elementId;
}
