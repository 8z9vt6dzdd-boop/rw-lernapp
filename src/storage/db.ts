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
}

const DB_NAME = 'rw-lernapp';
let dbPromise: Promise<IDBPDatabase<LernDB>> | null = null;

function db(): Promise<IDBPDatabase<LernDB>> {
  dbPromise ??= openDB<LernDB>(DB_NAME, 1, {
    upgrade(d) {
      const events = d.createObjectStore('events', { keyPath: 'id' });
      events.createIndex('ts', 'ts');
      events.createIndex('skillId', 'skillId');
      d.createObjectStore('kv');
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

function notify(): void {
  for (const fn of listeners) fn();
}

export async function addEvent(e: LernEreignis): Promise<void> {
  await (await db()).put('events', e);
  notify();
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

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await (await db()).put('kv', next, 'settings');
  notify();
  return next;
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
  notify();
}
