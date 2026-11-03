// Automatischer Abgleich des Lernstands zwischen verbundenen Geräten (05-technik.md).
// Lokal zuerst: Jede Antwort liegt sofort in IndexedDB; der Abgleich lädt im Hintergrund hoch und
// holt Ereignisse der anderen Geräte ab. Zusammengeführt wird über die Ereignis-ID.
import { SYNC_URL } from '../config';
import type { LernEreignis } from '../learning/types';
import {
  allesInAusgang,
  ausgangEntfernen,
  ausgangIds,
  beiNeuemEreignis,
  eventsNachIds,
  getKv,
  notify,
  setKv,
  uebernehmeEinstellungen,
  uebernehmeEreignisse,
} from './db';
import { neuerCode } from './kopplung';

export interface AbgleichStatus {
  /** Abgleich in diesem Build eingerichtet */
  eingerichtet: boolean;
  letzterErfolg?: string;
  letzterVersuch?: string;
  /** letzter Versuch fehlgeschlagen */
  fehler?: 'offline' | 'dienst';
  /** Anzahl der Geräte, die zu diesem Lernstand beitragen */
  geraete?: number;
  /** zuletzt von anderen Geräten übernommene Ereignisse */
  zuletztNeu?: number;
}

const KOPPLUNG = 'kopplung';
const CURSOR = 'abgleich:cursor';
const STATUS = 'abgleich:status';
const BLOCK = 500;

export async function kopplungscode(): Promise<string> {
  const vorhanden = await getKv<string>(KOPPLUNG);
  if (vorhanden) return vorhanden;
  const code = neuerCode();
  await setKv(KOPPLUNG, code);
  return code;
}

export async function abgleichStatus(): Promise<AbgleichStatus> {
  const s = (await getKv<AbgleichStatus>(STATUS)) ?? { eingerichtet: false };
  return { ...s, eingerichtet: Boolean(SYNC_URL) };
}

async function setzeStatus(patch: Partial<AbgleichStatus>): Promise<void> {
  const s = await abgleichStatus();
  await setKv(STATUS, { ...s, ...patch });
  notify();
}

let laeuft: Promise<void> | null = null;
let nochmal = false;

/** Lädt neue lokale Ereignisse hoch und holt die der anderen Geräte ab. Mehrfachaufrufe werden gebündelt. */
export function abgleichen(): Promise<void> {
  if (!SYNC_URL) return Promise.resolve();
  if (laeuft) {
    nochmal = true;
    return laeuft;
  }
  laeuft = (async () => {
    try {
      do {
        nochmal = false;
        await einmalAbgleichen();
      } while (nochmal);
    } finally {
      laeuft = null;
    }
  })();
  return laeuft;
}

async function einmalAbgleichen(): Promise<void> {
  const versuch = new Date().toISOString();
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    await setzeStatus({ letzterVersuch: versuch, fehler: 'offline' });
    return;
  }
  const code = await kopplungscode();
  try {
    // 1. Hochladen
    for (;;) {
      const ids = await ausgangIds(BLOCK);
      if (ids.length === 0) break;
      const events = await eventsNachIds(ids);
      const r = await fetch(`${SYNC_URL}/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, events }),
      });
      if (!r.ok) throw new Error(`push ${r.status}`);
      await ausgangEntfernen(ids);
      if (ids.length < BLOCK) break;
    }
    // 2. Abholen
    let cursor = (await getKv<number>(CURSOR)) ?? 0;
    let neu = 0;
    let geraete: number | undefined;
    for (;;) {
      const r = await fetch(`${SYNC_URL}/pull?code=${encodeURIComponent(code)}&since=${cursor}`);
      if (!r.ok) throw new Error(`pull ${r.status}`);
      const body = (await r.json()) as {
        events: (LernEreignis & { _received_at?: number })[];
        cursor: number;
        mehr: boolean;
        geraete: number;
      };
      const events = body.events.map(({ _received_at: _r, ...e }) => e as LernEreignis);
      neu += await uebernehmeEreignisse(events);
      await uebernehmeEinstellungen(events);
      cursor = body.cursor;
      geraete = body.geraete;
      await setKv(CURSOR, cursor);
      if (!body.mehr) break;
    }
    const s: Partial<AbgleichStatus> = {
      letzterVersuch: versuch,
      letzterErfolg: versuch,
      zuletztNeu: neu,
    };
    if (geraete !== undefined) s.geraete = geraete;
    const alt = await abgleichStatus();
    await setKv(STATUS, { ...alt, ...s, fehler: undefined });
    notify();
  } catch {
    await setzeStatus({
      letzterVersuch: versuch,
      fehler: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'dienst',
    });
  }
}

/** Mit dem Lernstand eines anderen Geräts verbinden: dessen Code übernehmen, eigenes Gelerntes mitbringen. */
export async function verbinden(code: string): Promise<void> {
  await setKv(KOPPLUNG, code);
  await setKv(CURSOR, 0);
  await allesInAusgang();
  const s = await abgleichStatus();
  await setKv(STATUS, { ...s, geraete: undefined, letzterErfolg: undefined });
  notify();
  await abgleichen();
}

let gestartet = false;

/** Hintergrund-Abgleich: beim Start, nach neuen Antworten, beim Zurückkehren, alle 5 Minuten, bei Netz. */
export function abgleichStarten(): void {
  if (gestartet || !SYNC_URL || typeof window === 'undefined') return;
  gestartet = true;
  void abgleichen();
  let timer: number | undefined;
  beiNeuemEreignis(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void abgleichen(), 3_000);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void abgleichen();
  });
  window.addEventListener('online', () => void abgleichen());
  window.setInterval(() => {
    if (document.visibilityState === 'visible') void abgleichen();
  }, 5 * 60_000);
}

/** Verständlicher Text zum Stand, ohne Fachbegriffe. */
export function statusText(
  s: AbgleichStatus,
  jetzt = Date.now(),
): { text: string; hinweis?: string } {
  if (!s.eingerichtet) return { text: 'Abgleich in dieser Version nicht eingerichtet' };
  if (!s.letzterErfolg) {
    return s.fehler === 'offline'
      ? { text: 'Wartet auf Verbindung' }
      : s.fehler
        ? {
            text: 'Lernstand noch nicht abgeglichen',
            hinweis: 'Wird beim nächsten Öffnen erneut versucht.',
          }
        : { text: 'Lernstand wird abgeglichen …' };
  }
  const min = Math.max(0, Math.round((jetzt - Date.parse(s.letzterErfolg)) / 60_000));
  const wann =
    min < 1
      ? 'gerade eben'
      : min < 60
        ? `vor ${min} Min.`
        : min < 48 * 60
          ? `vor ${Math.round(min / 60)} Std.`
          : `vor ${Math.round(min / 1440)} Tagen`;
  const text =
    s.fehler === 'offline'
      ? `Wartet auf Verbindung (zuletzt abgeglichen ${wann})`
      : `Lernstand abgeglichen ${wann}`;
  if (min > 3 * 1440 && s.fehler === 'dienst')
    return {
      text,
      hinweis:
        'Seit über drei Tagen klappt der Abgleich nicht, obwohl Internet da ist. Sichere deinen Lernstand vorsichtshalber als Datei (unten).',
    };
  return { text };
}
