// Spielt Töne bei Zustandswechseln, die nicht an einem einzelnen Knopf hängen:
// Tagesziel erreicht (Serie verlängert) und alle drei Tagesaufgaben erledigt. Nur bei Wechseln während der Nutzung.
import { useEffect, useRef } from 'react';
import { serie, tagKey, tagesaufgaben } from '../learning/motivation';
import { useEvents, useSettings } from './hooks';
import { setToeneAn, spiele, toeneEntsperren } from './sound';

export function ToeneBeobachter() {
  const events = useEvents();
  const settings = useSettings();
  const vorher = useRef<{ tag: string; serie: boolean; aufgaben: boolean } | null>(null);

  useEffect(() => {
    toeneEntsperren();
  }, []);

  useEffect(() => {
    setToeneAn(settings.toene);
  }, [settings.toene]);

  useEffect(() => {
    if (!events) return;
    const tag = tagKey(new Date());
    const jetzt = {
      tag,
      serie: serie(events, settings.tagesziel, tag).heuteErreicht,
      aufgaben: tagesaufgaben(events, tag).every((a) => a.erledigt),
    };
    const alt = vorher.current;
    vorher.current = jetzt;
    if (!alt || alt.tag !== tag) return;
    if (!alt.aufgaben && jetzt.aufgaben) spiele('akkord');
    else if (!alt.serie && jetzt.serie) spiele('serie');
  }, [events, settings.tagesziel]);

  return null;
}
