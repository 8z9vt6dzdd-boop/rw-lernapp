// Fallmodus: mehrstufiger Fall am Laptop (Sachverhalt links, Eingaben rechts), folgefehlerfrei.
import { useEffect, useMemo, useState } from 'react';
import { fallInfo, fallPunkte } from '../../engine/faelle';
import { laptopSpeichern } from '../../learning/ereignisse';
import { punkteAus, schrittAlsTask } from '../../learning/klausur';
import { erstelleAttempt } from '../../learning/record';
import { skillTitel } from '../../learning/prepare';
import { addEvent, deleteKv, deviceId, eventsForSkill, getKv, setKv } from '../../storage/db';
import { LaptopHinweis } from '../components/LaptopHinweis';
import { TaskRunner, type TaskOutcome } from '../components/TaskRunner';
import { Button, Card, Chip, Icon } from '../components/ui';
import { navigate, routeParams } from '../hooks';
import { spiele } from '../sound';

interface FallStand {
  seed: number;
  schritt: number;
  punkte: number[];
}

function query(): URLSearchParams {
  return new URLSearchParams(window.location.hash.split('?')[1] ?? '');
}

function istMobil(): boolean {
  return window.matchMedia('(max-width: 1023px)').matches;
}

export function FallScreen() {
  const [id] = routeParams();
  const info = id ? fallInfo(id) : undefined;
  const merk = query().get('merk');
  const [stand, setStand] = useState<FallStand | null>(null);
  const [gestartet, setGestartet] = useState(false);
  const [hier, setHier] = useState(() => !istMobil());
  const [gemerkt, setGemerkt] = useState(false);

  // Gespeicherten Stand laden oder neuen Fall anlegen
  useEffect(() => {
    if (!info) return;
    let alive = true;
    const seedParam = Number(query().get('seed'));
    void getKv<FallStand>(`fall:${info.id}`).then((s) => {
      if (!alive) return;
      if (s && (!seedParam || s.seed === seedParam)) setStand(s);
      else
        setStand({
          seed: seedParam || Math.floor(Math.random() * 2 ** 31),
          schritt: 0,
          punkte: [],
        });
    });
    return () => {
      alive = false;
    };
  }, [info]);

  const fall = useMemo(() => (info && stand ? info.erstelle(stand.seed) : null), [info, stand]);

  if (!info) {
    return (
      <Card>
        <p>Diesen Fall gibt es nicht.</p>
        <Button className="mt-3" onClick={() => navigate('pruefen')}>
          Zur Übersicht
        </Button>
      </Card>
    );
  }
  if (!fall || !stand) return null;

  const max = fallPunkte(fall);
  const fertig = stand.schritt >= fall.schritte.length;

  const speichern = (s: FallStand) => {
    setStand(s);
    void setKv(`fall:${info.id}`, s);
  };

  const onFinish = async (o: TaskOutcome) => {
    const schritt = fall.schritte[stand.schritt]!;
    const task = schrittAlsTask(info.id, stand.seed, schritt);
    const event = erstelleAttempt({
      task,
      answers: o.answers,
      results: o.results,
      hintsUsed: o.hintsUsed,
      durationMs: o.durationMs,
      deviceId: await deviceId(),
      mode: 'fall',
      frueher: await eventsForSkill(schritt.skillId),
      loesungGezeigt: o.loesungGezeigt,
    });
    await addEvent(event);
    const score = o.loesungGezeigt ? Math.min(event.partial ?? 0, 0.999) : (event.partial ?? 0);
    const neu = {
      ...stand,
      schritt: stand.schritt + 1,
      punkte: [...stand.punkte, punkteAus(score, schritt.punkte)],
    };
    speichern(neu);
    if (neu.schritt >= fall.schritte.length) {
      spiele('lektion');
      if (merk)
        await laptopSpeichern('laptop-erledigt', {
          ref: merk,
          skillId: fall.schritte[0]!.skillId,
          seed: stand.seed,
        });
    }
    window.scrollTo({ top: 0 });
  };

  const neuerFall = () => {
    void deleteKv(`fall:${info.id}`);
    setGestartet(true);
    setStand({ seed: Math.floor(Math.random() * 2 ** 31), schritt: 0, punkte: [] });
  };

  if (!hier && !gemerkt) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">{info.titel}</h1>
        <LaptopHinweis
          onHier={() => setHier(true)}
          onMerken={() => {
            void laptopSpeichern('laptop-merken', {
              skillId: fall.schritte[0]!.skillId,
              seed: stand.seed,
              variant: `fall:${info.id}`,
            });
            setGemerkt(true);
          }}
        />
      </div>
    );
  }
  if (gemerkt) {
    return (
      <Card>
        <h1 className="text-lg font-semibold">Gemerkt</h1>
        <p className="mt-1 text-[15px]">
          Der Fall wartet am Laptop auf der Startseite unter „Am Laptop weitermachen“.
        </p>
        <Button className="mt-3" onClick={() => navigate('pruefen')}>
          Zur Übersicht
        </Button>
      </Card>
    );
  }

  if (fertig) {
    const erreicht = stand.punkte.reduce((a, b) => a + b, 0);
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 pb-10">
        <Card>
          <Chip tone="accent">Fall abgeschlossen</Chip>
          <h1 className="mt-2 text-xl font-semibold">{fall.titel}</h1>
          <p className="num mt-3 text-3xl font-semibold">
            {formatPunkte(erreicht)} <span className="text-lg text-muted">von {max} Punkten</span>
          </p>
          <ul className="mt-4 flex flex-col">
            {fall.schritte.map((s, i) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 border-t border-line py-2 text-[15px]"
              >
                <span>
                  {i + 1}. {s.titel}
                  <span className="block text-sm text-muted">{skillTitel(s.skillId)}</span>
                </span>
                <span className="num whitespace-nowrap">
                  {formatPunkte(stand.punkte[i] ?? 0)} / {s.punkte}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="primary" onClick={neuerFall}>
            Neuer Fall mit anderen Zahlen
          </Button>
          <Button onClick={() => navigate('pruefen')}>Zur Übersicht</Button>
        </div>
      </div>
    );
  }

  if (!gestartet && stand.schritt === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 pb-10">
        <button
          type="button"
          onClick={() => navigate('pruefen')}
          className="flex h-10 items-center gap-1 self-start rounded-lg px-2 text-sm text-muted hover:bg-surface-2"
        >
          <Icon name="schliessen" className="h-5 w-5" /> Zurück
        </button>
        <Card>
          <Chip tone="accent">Fallmodus</Chip>
          <h1 className="mt-2 text-xl font-semibold">{fall.titel}</h1>
          <div className="mt-2 flex flex-col gap-2 text-[15px]">
            {fall.einleitung.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </div>
          <ol className="mt-4 flex flex-col gap-1 text-[15px]">
            {fall.schritte.map((s, i) => (
              <li key={s.id} className="flex justify-between gap-3">
                <span>
                  {i + 1}. {s.titel}
                </span>
                <span className="num text-muted">{s.punkte} P.</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-muted">
            Etwa {info.minuten} Minuten, {max} Punkte. Dein Stand wird nach jedem Schritt
            gespeichert.
          </p>
        </Card>
        <Button variant="primary" onClick={() => setGestartet(true)}>
          Fall starten
        </Button>
      </div>
    );
  }

  const schritt = fall.schritte[stand.schritt]!;
  return (
    <TaskRunner
      key={`${stand.seed}-${schritt.id}`}
      task={schrittAlsTask(info.id, stand.seed, schritt)}
      position={stand.schritt + 1}
      total={fall.schritte.length}
      bezeichnung="Schritt"
      weiterText="Weiter mit der richtigen Lösung"
      abschlussText="Fall abschließen"
      wiederholungFolgt={false}
      breit
      onFinish={(o) => void onFinish(o)}
      onExit={() => navigate('pruefen')}
    />
  );
}

export function formatPunkte(p: number): string {
  return Number.isInteger(p) ? String(p) : p.toFixed(1).replace('.', ',');
}
