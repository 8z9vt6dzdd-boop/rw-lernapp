// Lokale Speicherung in IndexedDB (über idb). Alles funktioniert offline.
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { LernEreignis, Settings } from '../learning/types';
import { ICH_STANDARD } from '../content/characters';

interface LernDB extends DBSchema {
  events: {
    key: string;
    value: LernEreignis;
    indexes: { ts: string; skillId: string };
  };
  kv: {
    key: string;
    value: unknown;
  };
  /** IDs lokaler Ereignisse, die noch zum Abgleich hochgeladen werden müssen */
  ausgang: {
    key: string;
    value: string;
  };
}

const DB_NAME = 'rw-lernapp';
let dbPromise: Promise<IDBPDatabase<LernDB>> | null = null;

function db(): Promise<IDBPDatabase<LernDB>> {
  dbPromise ??= openDB<LernDB>(DB_NAME, 2, {
    async upgrade(d, alteVersion, _neu, tx) {
      if (alteVersion < 1) {
        const events = d.createObjectStore('events', { keyPath: 'id' });
        events.createIndex('ts', 'ts');
        events.createIndex('skillId', 'skillId');
        d.createObjectStore('kv');
      }
      if (alteVersion < 2) {
        const ausgang = d.createObjectStore('ausgang');
        // Bereits vorhandene Ereignisse beim ersten Abgleich mit hochladen
        for (const id of await tx.objectStore('events').getAllKeys()) await ausgang.put(id, id);
      }
    },
  });
  return dbPromise;
}

export const DEFAULT_SETTINGS: Settings = {
  tagesziel: 'normal',
  theme: 'auto',
  teilkostenInKlausur: false,
  bewegungReduziert: false,
  toene: true,
  ich: ICH_STANDARD,
  onboardingErledigt: false,
};

type Listener = () => void;
const listeners = new Set<Listener>();

/** Benachrichtigt die Oberfläche über neue Ereignisse oder geänderte Einstellungen. */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify(): void {
  for (const fn of listeners) fn();
}

export async function addEvent(e: LernEreignis): Promise<void> {
  const d = await db();
  const tx = d.transaction(['events', 'ausgang'], 'readwrite');
  await Promise.all([
    tx.objectStore('events').put(e),
    tx.objectStore('ausgang').put(e.id, e.id),
    tx.done,
  ]);
  notify();
  for (const fn of neuesEreignis) fn();
}

/** Wird nach jedem lokal gespeicherten Ereignis aufgerufen (z. B. um den Abgleich anzustoßen). */
const neuesEreignis = new Set<() => void>();
export function beiNeuemEreignis(fn: () => void): () => void {
  neuesEreignis.add(fn);
  return () => neuesEreignis.delete(fn);
}

/** Ereignisse von anderen Geräten übernehmen (ohne sie erneut hochzuladen). Liefert die Zahl neuer Ereignisse. */
export async function uebernehmeEreignisse(events: readonly LernEreignis[]): Promise<number> {
  if (events.length === 0) return 0;
  const d = await db();
  const tx = d.transaction('events', 'readwrite');
  let neu = 0;
  for (const e of events) {
    if (await tx.store.getKey(e.id)) continue;
    await tx.store.put(e);
    neu++;
  }
  await tx.done;
  if (neu > 0) notify();
  return neu;
}

export async function ausgangIds(limit: number): Promise<string[]> {
  return (await db()).getAllKeys('ausgang', undefined, limit);
}

export async function eventsNachIds(ids: readonly string[]): Promise<LernEreignis[]> {
  const d = await db();
  const tx = d.transaction('events');
  const r = await Promise.all(ids.map((id) => tx.store.get(id)));
  await tx.done;
  return r.filter((e): e is LernEreignis => e !== undefined);
}

export async function ausgangEntfernen(ids: readonly string[]): Promise<void> {
  const d = await db();
  const tx = d.transaction('ausgang', 'readwrite');
  await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
}

/** Alle lokalen Ereignisse erneut zum Hochladen vormerken (nach dem Verbinden mit einem anderen Lernstand). */
export async function allesInAusgang(): Promise<void> {
  const d = await db();
  const ids = await d.getAllKeys('events');
  const tx = d.transaction('ausgang', 'readwrite');
  await Promise.all([...ids.map((id) => tx.store.put(id, id)), tx.done]);
}

export async function allEvents(): Promise<LernEreignis[]> {
  return (await db()).getAllFromIndex('events', 'ts');
}

export async function eventsForSkill(skillId: string): Promise<LernEreignis[]> {
  return (await db()).getAllFromIndex('events', 'skillId', skillId);
}

export async function getSettings(): Promise<Settings> {
  const stored = (await (await db()).get('kv', 'settings')) as Partial<Settings> | undefined;
  return { ...DEFAULT_SETTINGS, ...stored, ich: { ...DEFAULT_SETTINGS.ich, ...stored?.ich } };
}

/** Einstellungen, die zwischen verbundenen Geräten abgeglichen werden (Darstellung, Töne usw. bleiben je Gerät). */
export const GERAETEUEBERGREIFEND: readonly (keyof Settings)[] = [
  'tagesziel',
  'examDate',
  'teilkostenInKlausur',
  'bestehensgrenze',
  'ich',
  'name',
  'onboardingErledigt',
  'wochenrueckblickGesehen',
  'gefeiert',
];

type Stand = Partial<Record<keyof Settings, string>>;

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await (await db()).put('kv', next, 'settings');
  const uebergreifend = (Object.keys(patch) as (keyof Settings)[]).filter((k) =>
    GERAETEUEBERGREIFEND.includes(k),
  );
  if (uebergreifend.length > 0) {
    const ts = new Date().toISOString();
    const stand = ((await getKv<Stand>('einstellungen:stand')) ?? {}) as Stand;
    // undefined (gelöscht) wird als null übertragen
    const werte = Object.fromEntries(uebergreifend.map((k) => [k, patch[k] ?? null]));
    for (const k of uebergreifend) stand[k] = ts;
    await setKv('einstellungen:stand', stand);
    await addEvent({
      typ: 'einstellungen',
      id: crypto.randomUUID(),
      ts,
      deviceId: await deviceId(),
      werte: werte as Partial<Settings>,
    });
  } else notify();
  return next;
}

/** Einstellungen anderer Geräte übernehmen, sofern sie jünger sind als der lokale Stand. */
export async function uebernehmeEinstellungen(events: readonly LernEreignis[]): Promise<void> {
  const neu = events
    .filter((e) => e.typ === 'einstellungen')
    .sort((a, b) => a.ts.localeCompare(b.ts));
  if (neu.length === 0) return;
  const stand = ((await getKv<Stand>('einstellungen:stand')) ?? {}) as Stand;
  const patch: Record<string, unknown> = {};
  for (const e of neu)
    for (const [k, v] of Object.entries(e.werte) as [keyof Settings, unknown][]) {
      if (!GERAETEUEBERGREIFEND.includes(k) || (stand[k] && stand[k]! >= e.ts)) continue;
      stand[k] = e.ts;
      patch[k] = v === null ? undefined : v;
    }
  if (Object.keys(patch).length === 0) return;
  const next = { ...(await getSettings()), ...patch };
  await (await db()).put('kv', next, 'settings');
  await setKv('einstellungen:stand', stand);
  notify();
}

export async function getKv<T>(key: string): Promise<T | undefined> {
  return (await (await db()).get('kv', key)) as T | undefined;
}

export async function setKv(key: string, value: unknown): Promise<void> {
  await (await db()).put('kv', value, key);
}

export async function deleteKv(key: string): Promise<void> {
  await (await db()).delete('kv', key);
}

export async function deviceId(): Promise<string> {
  const d = await db();
  const existing = (await d.get('kv', 'deviceId')) as string | undefined;
  if (existing) return existing;
  const id = crypto.randomUUID();
  await d.put('kv', id, 'deviceId');
  return id;
}

/** Bittet den Browser, die Daten dauerhaft zu behalten (wichtig für Safari). */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

export async function resetAll(): Promise<void> {
  const d = await db();
  await d.clear('events');
  await d.clear('kv');
  await d.clear('ausgang');
  notify();
}
