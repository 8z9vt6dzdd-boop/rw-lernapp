// Kleine Hooks: Hash-Navigation, Lernereignisse und Einstellungen aus IndexedDB.
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { LernEreignis, Settings } from '../learning/types';
import { DEFAULT_SETTINGS, allEvents, getSettings, subscribe } from '../storage/db';

export type Route =
  | 'start'
  | 'lernpfad'
  | 'firma'
  | 'statistik'
  | 'einstellungen'
  | 'sitzung'
  | 'lektion'
  | 'test'
  | 'einstufung'
  | 'erfolge'
  | 'figur'
  | 'willkommen'
  | 'pruefen'
  | 'fall'
  | 'klausur';

const ROUTES: Route[] = [
  'start',
  'lernpfad',
  'firma',
  'statistik',
  'einstellungen',
  'sitzung',
  'lektion',
  'test',
  'einstufung',
  'erfolge',
  'figur',
  'willkommen',
  'pruefen',
  'fall',
  'klausur',
];

/** Pfadteile nach der Route, z. B. #/test/abschnitt/0 → ['abschnitt', '0'] */
export function routeParams(): string[] {
  return window.location.hash
    .replace(/^#\/?/, '')
    .split('?')[0]!
    .split('/')
    .slice(1)
    .map(decodeURIComponent);
}

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0] ?? '';
  return (ROUTES as string[]).includes(h) ? (h as Route) : 'start';
}

function subscribeHash(fn: () => void) {
  window.addEventListener('hashchange', fn);
  return () => window.removeEventListener('hashchange', fn);
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribeHash, parseHash, () => 'start' as Route);
}

export function navigate(route: Route, ...params: string[]): void {
  window.location.hash =
    route === 'start' ? '#/' : `#/${[route, ...params.map(encodeURIComponent)].join('/')}`;
}

export function useEvents(): LernEreignis[] | null {
  const [events, setEvents] = useState<LernEreignis[] | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => allEvents().then((e) => alive && setEvents(e));
    load();
    const unsub = subscribe(load);
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  return events;
}

/** Einstellungen plus Ladezustand (vor dem ersten Laden gelten die Standardwerte). */
export function useSettingsState(): [Settings, boolean] {
  const [state, setState] = useState<[Settings, boolean]>([DEFAULT_SETTINGS, false]);
  useEffect(() => {
    let alive = true;
    const load = () => getSettings().then((s) => alive && setState([s, true]));
    load();
    const unsub = subscribe(load);
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  return state;
}

export function useSettings(): Settings {
  return useSettingsState()[0];
}

/** Bewegung reduzieren (App-Schalter) auf das Dokument anwenden. */
export function useBewegung(reduziert: boolean): void {
  useEffect(() => {
    const root = document.documentElement;
    if (reduziert) root.setAttribute('data-motion', 'reduziert');
    else root.removeAttribute('data-motion');
  }, [reduziert]);
}

/** Wendet hell/dunkel/automatisch auf das Dokument an. */
export function useTheme(theme: Settings['theme']): void {
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);
}

/** Vollständiger Hash inkl. Parameter (z. B. für einen Neustart der Sitzung bei geänderter Adresse). */
export function useHash(): string {
  return useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => '',
  );
}
