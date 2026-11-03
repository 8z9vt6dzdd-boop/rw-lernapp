// Rückfallebene: Lernstand als Datei sichern und auf einem anderen Gerät übernehmen (Zusammenführen über die ID).
import type { LernEreignis } from '../learning/types';
import { allEvents, uebernehmeEinstellungen, uebernehmeEreignisse } from './db';

const FORMAT = 'rw-lernapp-lernstand';

export interface Sicherung {
  format: typeof FORMAT;
  version: 1;
  erstellt: string;
  events: LernEreignis[];
}

export async function sicherungErstellen(): Promise<Sicherung> {
  return {
    format: FORMAT,
    version: 1,
    erstellt: new Date().toISOString(),
    events: await allEvents(),
  };
}

export function dateiname(d = new Date()): string {
  return `lernstand-${d.toISOString().slice(0, 10)}.json`;
}

/** Prüft eine eingelesene Datei; liefert die Ereignisse oder eine verständliche Fehlermeldung. */
export function sicherungLesen(text: string): { events: LernEreignis[] } | { fehler: string } {
  let daten: unknown;
  try {
    daten = JSON.parse(text);
  } catch {
    return { fehler: 'Diese Datei ist keine Lernstand-Sicherung.' };
  }
  const d = daten as Partial<Sicherung> | null;
  if (!d || d.format !== FORMAT || !Array.isArray(d.events))
    return { fehler: 'Diese Datei ist keine Lernstand-Sicherung dieser App.' };
  const events = d.events.filter(
    (e): e is LernEreignis =>
      !!e &&
      typeof e === 'object' &&
      typeof e.id === 'string' &&
      typeof e.typ === 'string' &&
      typeof e.ts === 'string',
  );
  return { events };
}

export async function sicherungUebernehmen(
  text: string,
): Promise<{ neu: number } | { fehler: string }> {
  const r = sicherungLesen(text);
  if ('fehler' in r) return r;
  const neu = await uebernehmeEreignisse(r.events);
  await uebernehmeEinstellungen(r.events);
  return { neu };
}

/** Teilen (AirDrop, Nachricht) wenn möglich, sonst herunterladen. */
export async function sicherungTeilen(): Promise<'geteilt' | 'heruntergeladen' | 'abgebrochen'> {
  const s = await sicherungErstellen();
  const name = dateiname();
  const datei = new File([JSON.stringify(s)], name, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [datei] })) {
    try {
      await nav.share({ files: [datei], title: 'Lernstand' });
      return 'geteilt';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'abgebrochen';
    }
  }
  const url = URL.createObjectURL(datei);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'heruntergeladen';
}
