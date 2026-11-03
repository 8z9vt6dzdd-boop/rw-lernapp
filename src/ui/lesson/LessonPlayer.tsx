// Lektions-Player: ein Bildschirm nach dem anderen, Fortschritt wird gespeichert, am Ende ein Belohnungsmoment.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lektion } from '../../content/lessons/types';
import { lektionSpeichern } from '../../learning/ereignisse';
import { XP } from '../../learning/motivation';
import { deleteKv, getKv, setKv } from '../../storage/db';
import { Button, Card, Chip, Icon, cx } from '../components/ui';
import { Character } from '../figures/Character';
import { hatUebung, lektionErledigt } from '../../learning/fortschritt';
import { navigate, useEvents } from '../hooks';
import { Schauplatz } from '../visuals/Schauplatz';
import { Konfetti } from './Konfetti';
import { ScreenView, istSofortErledigt } from './Screens';
import { Sprechblase } from './Sprechblase';

interface Stand {
  index: number;
  ergebnisse: Record<number, boolean>;
}

const key = (id: string) => `lektion:${id}`;

export function LessonPlayer({ lektion }: { lektion: Lektion }) {
  const events = useEvents();
  const [phase, setPhase] = useState<'start' | 'laeuft' | 'fertig'>('start');
  const [index, setIndex] = useState(0);
  const [erledigt, setErledigt] = useState<Set<number>>(new Set());
  const [ergebnisse, setErgebnisse] = useState<Record<number, boolean>>({});
  const [gespeichert, setGespeichert] = useState<Stand | null>(null);
  const start = useRef(0);
  const screen = lektion.screens[index]!;
  const schonErledigt = events ? lektionErledigt(events, lektion.skillId) : false;

  useEffect(() => {
    void getKv<Stand>(key(lektion.id)).then((s) => s && s.index > 0 && setGespeichert(s));
  }, [lektion.id]);

  useEffect(() => {
    if (phase === 'laeuft') window.scrollTo({ top: 0 });
  }, [index, phase]);

  const onDone = useCallback(
    (richtig?: boolean) => {
      setErledigt((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
      if (richtig !== undefined)
        setErgebnisse((prev) => (index in prev ? prev : { ...prev, [index]: richtig }));
    },
    [index],
  );

  const beginnen = (ab = 0, alt?: Stand) => {
    start.current = Date.now();
    setIndex(ab);
    setErgebnisse(alt?.ergebnisse ?? {});
    setErledigt(new Set(Array.from({ length: ab }, (_, i) => i)));
    setPhase('laeuft');
  };

  const weiter = async () => {
    if (index + 1 < lektion.screens.length) {
      const next = index + 1;
      setIndex(next);
      await setKv(key(lektion.id), { index: next, ergebnisse } satisfies Stand);
      return;
    }
    const werte = Object.values(ergebnisse);
    const fehlerGefunden = lektion.screens.filter(
      (s, i) => s.typ === 'fehlerjagd' && ergebnisse[i] === true,
    ).length;
    await lektionSpeichern({
      lektionId: lektion.id,
      skillId: lektion.skillId,
      art: schonErledigt ? 'wiederholt' : 'abgeschlossen',
      durationMs: Date.now() - start.current,
      richtig: werte.filter(Boolean).length,
      gesamt: werte.length,
      fehlerGefunden,
    });
    await deleteKv(key(lektion.id));
    setPhase('fertig');
  };

  if (phase === 'start') {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => navigate('lernpfad')}
          className="flex items-center gap-1 self-start text-sm text-muted"
        >
          ← Lernpfad
        </button>
        <Schauplatz ort={lektion.ort}>
          {lektion.figuren.slice(0, 3).map((f, i) => (
            <Character
              key={f}
              id={f}
              ausdruck={i === 0 ? 'freut' : 'neutral'}
              groesse={88}
              gespiegelt={i % 2 === 1}
              hintergrund={false}
            />
          ))}
        </Schauplatz>
        <div>
          <div className="flex flex-wrap gap-2">
            <Chip tone="accent">Lektion {lektion.id}</Chip>
            <Chip>ca. {lektion.dauerMin} Minuten</Chip>
            {schonErledigt ? <Chip>schon erledigt</Chip> : null}
          </div>
          <h1 className="hand mt-2 text-2xl font-bold">{lektion.titel}</h1>
        </div>
        <Sprechblase s={lektion.teaser} />
        <div className="flex flex-col gap-2">
          {gespeichert ? (
            <Button variant="primary" onClick={() => beginnen(gespeichert.index, gespeichert)}>
              Weiter, wo ich war (Schritt {gespeichert.index + 1})
            </Button>
          ) : null}
          <Button variant={gespeichert ? 'secondary' : 'primary'} onClick={() => beginnen(0)}>
            {schonErledigt ? 'Nochmal ansehen' : gespeichert ? 'Von vorn beginnen' : 'Los geht’s'}
          </Button>
          {!schonErledigt ? (
            <Button variant="ghost" onClick={() => navigate('test', 'lektion', lektion.id)}>
              Kann ich schon – kurzer Test
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (phase === 'fertig') {
    return (
      <div className="relative flex flex-col gap-4">
        <Konfetti />
        <Schauplatz ort={lektion.ort} hoehe="h-44 sm:h-52">
          <Character
            id="jana"
            ausdruck="feiert"
            groesse={100}
            bewegung="jubeln"
            hintergrund={false}
          />
          <Character
            id="ich"
            ausdruck="feiert"
            groesse={100}
            bewegung="jubeln"
            gespiegelt
            hintergrund={false}
          />
        </Schauplatz>
        <Card className="text-center">
          <h1 className="hand text-2xl font-bold">Lektion geschafft!</h1>
          <p className="mt-1 text-muted">{lektion.titel}</p>
          <p className="num mt-3 text-lg font-semibold text-ok">
            +{schonErledigt ? XP.lektionWiederholt : XP.lektion} XP
          </p>
          <p className="mt-3 text-[15px]">
            <span className="font-semibold">Das Wichtigste:</span> {lektion.kernAha}
          </p>
        </Card>
        <div className="flex flex-col gap-2 sm:flex-row">
          {hatUebung(lektion.skillId) ? (
            <Button
              variant="primary"
              onClick={() =>
                (window.location.hash = `#/sitzung?skill=${encodeURIComponent(lektion.skillId)}`)
              }
            >
              Jetzt üben
            </Button>
          ) : null}
          <Button
            variant={hatUebung(lektion.skillId) ? 'secondary' : 'primary'}
            onClick={() => navigate('lernpfad')}
          >
            Weiter im Lernpfad
          </Button>
        </div>
      </div>
    );
  }

  const fertig = erledigt.has(index) || istSofortErledigt(screen);
  return (
    <div className="flex flex-col gap-4 pb-32">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('lernpfad')}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface-2"
          aria-label="Lektion schließen (Fortschritt bleibt gespeichert)"
        >
          <Icon name="schliessen" />
        </button>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={lektion.screens.length}
          aria-valuenow={index + 1}
          aria-label="Fortschritt in der Lektion"
        >
          <div
            className="h-full rounded-full bg-lime transition-all duration-500"
            style={{ width: `${((index + 1) / lektion.screens.length) * 100}%` }}
          />
        </div>
        <span className="num text-xs text-muted">
          {index + 1}/{lektion.screens.length}
        </span>
      </div>
      <div key={index} className="einblenden">
        <ScreenView s={screen} onDone={onDone} />
      </div>
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 [&_button]:whitespace-nowrap">
          {index > 0 ? (
            <Button variant="ghost" onClick={() => setIndex(index - 1)}>
              Zurück
            </Button>
          ) : null}
          <div className="flex-1" />
          <Button
            variant="primary"
            disabled={!fertig}
            onClick={() => void weiter()}
            className={cx(!fertig && 'opacity-50')}
          >
            {index + 1 < lektion.screens.length
              ? screen.typ === 'raetsel'
                ? 'Finde es heraus'
                : 'Weiter'
              : 'Lektion abschließen'}
            <Icon name="pfeil" className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
