// Belohnungsmomente außerhalb der Lektion: Beförderung, Serien-Meilenstein, Kapitel geschafft, neuer Erfolg.
// Jede Szene erscheint genau einmal und lässt sich sofort schließen.
import { useEffect, useMemo } from 'react';
import { spiele } from '../sound';
import { ABSCHNITTE } from '../../content/curriculum';
import { abschnittAbgeschlossen } from '../../learning/fortschritt';
import { erfolge, karriere, serie, tagKey } from '../../learning/motivation';
import type { Settings } from '../../learning/types';
import { saveSettings } from '../../storage/db';
import { Button } from '../components/ui';
import { Character } from '../figures/Character';
import { useEvents, useSettings } from '../hooks';
import { ErfolgSymbol } from '../screens/ErfolgeScreen';
import { Schauplatz } from '../visuals/Schauplatz';
import { Konfetti } from './Konfetti';

type Szene =
  | { art: 'karriere'; stufe: number; titel: string }
  | { art: 'serie'; tage: number }
  | { art: 'abschnitt'; id: string; titel: string }
  | {
      art: 'erfolg';
      id: string;
      titel: string;
      text: string;
      symbol: Parameters<typeof ErfolgSymbol>[0]['symbol'];
    };

function offeneSzene(events: Parameters<typeof karriere>[0], settings: Settings): Szene | null {
  const g = settings.gefeiert ?? {};
  const k = karriere(events);
  if (k.aktuell.stufe > (g.karriere ?? 1))
    return { art: 'karriere', stufe: k.aktuell.stufe, titel: k.aktuell.titel };
  const fertig = ABSCHNITTE.filter((a) => abschnittAbgeschlossen(events, a));
  const neu = fertig.find((a) => !(g.abschnitte ?? []).includes(a.id));
  if (neu) return { art: 'abschnitt', id: neu.id, titel: neu.titel };
  const s = serie(events, settings.tagesziel, tagKey(new Date()));
  if (s.meilenstein && s.meilenstein > (g.serie ?? 0)) return { art: 'serie', tage: s.meilenstein };
  const e = erfolge(events, settings.tagesziel, tagKey(new Date())).find(
    (x) => x.erreicht && !(g.erfolge ?? []).includes(x.id),
  );
  if (e) return { art: 'erfolg', id: e.id, titel: e.titel, text: e.text, symbol: e.symbol };
  return null;
}

export function Belohnungen() {
  const events = useEvents();
  const settings = useSettings();
  const szene = useMemo(
    () => (events && events.length > 0 ? offeneSzene(events, settings) : null),
    [events, settings],
  );
  if (!szene) return null;
  return <BelohnungsSzene key={JSON.stringify(szene)} szene={szene} settings={settings} />;
}

function BelohnungsSzene({ szene, settings }: { szene: Szene; settings: Settings }) {
  useEffect(() => {
    spiele(szene.art === 'erfolg' ? 'erfolg' : szene.art === 'serie' ? 'serie' : 'feier');
  }, [szene]);
  const g = settings.gefeiert ?? {};
  const schliessen = () => {
    const next = { ...g };
    if (szene.art === 'karriere') next.karriere = szene.stufe;
    if (szene.art === 'serie') next.serie = szene.tage;
    if (szene.art === 'abschnitt') next.abschnitte = [...(g.abschnitte ?? []), szene.id];
    if (szene.art === 'erfolg') next.erfolge = [...(g.erfolge ?? []), szene.id];
    void saveSettings({ gefeiert: next });
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Belohnung"
    >
      <div className="safe-bottom relative w-full max-w-lg overflow-hidden rounded-t-2xl bg-surface p-4 sm:rounded-2xl">
        <Konfetti seed={szene.art.length * 13} />
        {szene.art === 'karriere' ? (
          <>
            <Schauplatz ort="gesellschafter" hoehe="h-44">
              <Character id="frank" ausdruck="feiert" groesse={96} hintergrund={false} />
              <Character
                id="ich"
                ausdruck="feiert"
                groesse={104}
                bewegung="jubeln"
                hintergrund={false}
              />
              <Character id="sabine" ausdruck="freut" groesse={96} gespiegelt hintergrund={false} />
            </Schauplatz>
            <h2 className="hand mt-4 text-center text-2xl font-bold">Beförderung!</h2>
            <p className="mt-1 text-center">
              Frank und Sabine gratulieren: Du bist jetzt <strong>{szene.titel}</strong>.
            </p>
          </>
        ) : szene.art === 'abschnitt' ? (
          <>
            <Schauplatz ort="besprechung" hoehe="h-44">
              <Character id="jana" ausdruck="feiert" groesse={84} hintergrund={false} />
              <Character id="tobias" ausdruck="feiert" groesse={84} hintergrund={false} />
              <Character
                id="ich"
                ausdruck="feiert"
                groesse={92}
                bewegung="jubeln"
                hintergrund={false}
              />
              <Character id="leni" ausdruck="freut" groesse={84} gespiegelt hintergrund={false} />
            </Schauplatz>
            <h2 className="hand mt-4 text-center text-2xl font-bold">Kapitel geschafft!</h2>
            <p className="mt-1 text-center">
              Abschnitt {szene.id}: {szene.titel} ist abgeschlossen. Das ganze Team ist stolz.
            </p>
          </>
        ) : szene.art === 'serie' ? (
          <>
            <Schauplatz ort="buero" hoehe="h-44">
              <Character
                id="jana"
                ausdruck="feiert"
                groesse={100}
                bewegung="jubeln"
                hintergrund={false}
              />
              <Character id="ich" ausdruck="freut" groesse={100} gespiegelt hintergrund={false} />
            </Schauplatz>
            <h2 className="hand mt-4 text-center text-2xl font-bold">
              {szene.tage} Tage am Stück!
            </h2>
            <p className="mt-1 text-center">
              Jana hat Kuchen mitgebracht. Den hast du dir verdient.
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center py-4">
            <div className="rounded-full bg-[color:var(--peep-paper)] p-3">
              <ErfolgSymbol symbol={szene.symbol} an />
            </div>
            <div className="mt-3 text-xs font-semibold tracking-wide text-muted uppercase">
              Neuer Erfolg
            </div>
            <h2 className="hand mt-1 text-2xl font-bold">{szene.titel}</h2>
            <p className="mt-1 text-center text-muted">{szene.text}</p>
          </div>
        )}
        <Button variant="primary" className="mt-4 w-full" onClick={schliessen}>
          Weiter
        </Button>
      </div>
    </div>
  );
}
