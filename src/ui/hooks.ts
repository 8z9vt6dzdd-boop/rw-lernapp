// Kleine Hooks: Hash-Navigation, Lernereignisse und Einstellungen aus IndexedDB.
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { LernEreignis, Settings } from '../learning/types';
import { DEFAULT_SETTINGS, allEvents, getSettings, subscribe } from '../storage/db';

export type Route = 'start' | 'lernpfad' | 'firma' | 'statistik' | 'einstellungen' | 'sitzung';

const ROUTES: Route[] = ['start', 'lernpfad', 'firma', 'statistik', 'einstellungen', 'sitzung'];

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

export function navigate(route: Route): void {
  window.location.hash = route === 'start' ? '#/' : `#/${route}`;
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

export function useSettings(): Settings {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => {
    let alive = true;
    const load = () => getSettings().then((s) => alive && setSettings(s));
    load();
    const unsub = subscribe(load);
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  return settings;
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
