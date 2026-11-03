// Lernereignisse für Lektionen, Überspringen-Tests und die Laptop-Liste speichern.
import { addEvent, deviceId } from '../storage/db';
import type { LaptopEvent, LektionEvent, LernEreignis, UeberspringenEvent } from './types';

function offline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export async function lektionSpeichern(
  e: Omit<LektionEvent, 'typ' | 'id' | 'ts' | 'deviceId' | 'offline'>,
): Promise<LektionEvent> {
  const event: LektionEvent = {
    typ: 'lektion',
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    deviceId: await deviceId(),
    ...e,
  };
  if (offline()) event.offline = true;
  await addEvent(event);
  return event;
}

export async function ueberspringenSpeichern(
  e: Omit<UeberspringenEvent, 'typ' | 'id' | 'ts' | 'deviceId'>,
): Promise<UeberspringenEvent> {
  const event: UeberspringenEvent = {
    typ: 'ueberspringen',
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    deviceId: await deviceId(),
    ...e,
  };
  await addEvent(event);
  return event;
}

export async function laptopSpeichern(
  typ: LaptopEvent['typ'],
  d: { ref?: string; skillId: string; seed: number; variant?: string },
): Promise<LaptopEvent> {
  const id = crypto.randomUUID();
  const event: LaptopEvent = {
    typ,
    id,
    ts: new Date().toISOString(),
    deviceId: await deviceId(),
    ref: d.ref ?? id,
    skillId: d.skillId,
    seed: d.seed,
  };
  if (d.variant) event.variant = d.variant;
  await addEvent(event);
  return event;
}

/** Offene Einträge der Liste „Am Laptop weitermachen“. */
export function laptopListe(events: readonly LernEreignis[]): LaptopEvent[] {
  const erledigt = new Set(
    events.filter((e): e is LaptopEvent => e.typ === 'laptop-erledigt').map((e) => e.ref),
  );
  return events.filter((e): e is LaptopEvent => e.typ === 'laptop-merken' && !erledigt.has(e.ref));
}
