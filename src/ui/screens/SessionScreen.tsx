// Kurz-Sitzung: Aufgaben nacheinander, Fehler führen zu einer weiteren Übung desselben Typs.
import { useEffect, useMemo, useState } from 'react';
import { fehlertyp } from '../../engine/fehlertypen';
import { randomSeed } from '../../engine/rng';
import { prepareTask, skillTitel, type TaskSpec } from '../../learning/prepare';
import { erstelleAttempt, erstelleKartenAttempt } from '../../learning/record';
import { kurzSitzung, kurzSitzungGeplant, wiederholung } from '../../learning/session';
import type { AttemptEvent } from '../../learning/types';
import { laptopListe, laptopSpeichern } from '../../learning/ereignisse';
import { addEvent, allEvents, deviceId, eventsForSkill } from '../../storage/db';
import { Sprechblase } from '../lesson/Sprechblase';
import { Button, Card } from '../components/ui';
import { TaskRunner, type TaskOutcome } from '../components/TaskRunner';
import { KarteRunner } from '../components/KarteRunner';
import { navigate } from '../hooks';

function sitzungAusHash(): TaskSpec[] | null {
  const q = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
  const skill = q.get('skill');
  // Optionaler Start-Seed macht die Aufgabenfolge reproduzierbar (z. B. für automatische Tests).
  const seed = q.get('seed');
  const start = seed ? Number(seed) : null;
  if (skill) {
    return Array.from({ length: 4 }, (_, i) => ({
      key: `g${i}-${Date.now()}`,
      art: 'aufgabe' as const,
      skillId: skill,
      seed: start !== null ? start + i : randomSeed(),
    }));
  }
  if (start !== null) return kurzSitzung(start, { mobil: istMobil() });
  // Ohne Parameter: geplante Sitzung aus dem Lernstand (wird asynchron geladen)
  return null;
}

function istMobil(): boolean {
  return window.matchMedia('(max-width: 767px)').matches;
}

function merkRef(): string | null {
  return new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('merk');
}

/** Hinweis vor Tabellenaufgaben auf dem Handy (CLAUDE.md, Regel 9). */
function LaptopHinweis({ onHier, onMerken }: { onHier: () => void; onMerken: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Sprechblase
          s={{
            figur: 'leni',
            ausdruck: 'erklaert',
            text: 'Diese Aufgabe lässt sich am Laptop deutlich bequemer bearbeiten. Große Tabellen sind auf dem Handy etwas fummelig.',
          }}
        />
      </Card>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="primary" onClick={onMerken}>
          Für den Laptop merken
        </Button>
        <Button onClick={onHier}>Trotzdem hier lösen</Button>
      </div>
      <p className="text-sm text-muted">
        Gemerkte Aufgaben erscheinen am Laptop oben auf der Startseite unter „Am Laptop
        weitermachen“.
      </p>
    </div>
  );
}

function dauerText(ms: number): string {
  const min = Math.round(ms / 60_000);
  return min < 1 ? 'unter 1 Minute' : min === 1 ? '1 Minute' : `${min} Minuten`;
}

export function SessionScreen() {
  const [queue, setQueue] = useState<TaskSpec[] | null>(() =>
    merkRef() ? null : sitzungAusHash(),
  );
  const [hinweisOk, setHinweisOk] = useState<ReadonlySet<string>>(new Set());
  const [gemerkt, setGemerkt] = useState(0);
  const [index, setIndex] = useState(0);
  const [ergebnisse, setErgebnisse] = useState<AttemptEvent[]>([]);
  const [wiederholt, setWiederholt] = useState<ReadonlySet<string>>(new Set());

  const [leer, setLeer] = useState(false);

  const planen = () =>
    allEvents().then((ev) => {
      const geplant = kurzSitzungGeplant(ev, new Date(), undefined, { mobil: istMobil() });
      setLeer(geplant.length === 0);
      setQueue(geplant);
    });

  useEffect(() => {
    if (merkRef() || sitzungAusHash() !== null) return;
    void allEvents().then((ev) => {
      const geplant = kurzSitzungGeplant(ev, new Date(), undefined, { mobil: istMobil() });
      setLeer(geplant.length === 0);
      setQueue(geplant);
    });
  }, []);

  useEffect(() => {
    const ref = merkRef();
    if (!ref) return;
    void allEvents().then((ev) => {
      const e = laptopListe(ev).find((x) => x.ref === ref);
      if (!e) return setQueue([]);
      const spec: TaskSpec = {
        key: `laptop-${ref}`,
        art: 'aufgabe',
        skillId: e.skillId,
        seed: e.seed,
        laptopRef: ref,
      };
      if (e.variant) spec.variant = e.variant;
      setQueue([spec]);
    });
  }, []);

  const spec = queue?.[index];
  const task = useMemo(() => (spec ? prepareTask(spec) : null), [spec]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [index]);

  const onFinish = async (o: TaskOutcome) => {
    if (!task || !spec) return;
    const event = erstelleAttempt({
      task,
      answers: o.answers,
      results: o.results,
      hintsUsed: o.hintsUsed,
      durationMs: o.durationMs,
      deviceId: await deviceId(),
      mode: 'kurz',
      frueher: await eventsForSkill(spec.skillId),
      loesungGezeigt: o.loesungGezeigt,
    });
    await addEvent(event);
    if (spec.laptopRef)
      await laptopSpeichern('laptop-erledigt', {
        ref: spec.laptopRef,
        skillId: spec.skillId,
        seed: spec.seed,
      });
    setErgebnisse((prev) => [...prev, event]);
    if (!event.correct && spec.art === 'aufgabe' && !wiederholt.has(spec.skillId)) {
      setWiederholt((prev) => new Set([...prev, spec.skillId]));
      setQueue((prev) => {
        const q = prev ?? [];
        const pos = Math.min(q.length, index + 3);
        return [...q.slice(0, pos), wiederholung(spec), ...q.slice(pos)];
      });
    }
    setIndex((i) => i + 1);
  };

  if (queue === null) return null;

  if (leer) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <Sprechblase
            s={{
              figur: 'jana',
              ausdruck: 'erklaert',
              text: 'Für die Kurz-Sitzung brauchst du zuerst eine Lektion. Danach planen wir deine Wiederholungen.',
            }}
          />
        </Card>
        <Button variant="primary" onClick={() => navigate('lernpfad')}>
          Zum Lernpfad
        </Button>
      </div>
    );
  }

  if (spec && spec.art === 'karte' && spec.elementId) {
    return (
      <KarteRunner
        key={spec.key}
        merksatzId={spec.elementId}
        position={index + 1}
        total={queue.length}
        onExit={() => (index === 0 ? navigate('start') : setIndex(queue.length))}
        onFertig={async (rating, durationMs) => {
          const event = erstelleKartenAttempt({
            merksatzId: spec.elementId!,
            skillId: spec.skillId,
            rating,
            durationMs,
            deviceId: await deviceId(),
          });
          await addEvent(event);
          setErgebnisse((prev) => [...prev, event]);
          setIndex((i) => i + 1);
        }}
      />
    );
  }

  if (
    spec &&
    task &&
    istMobil() &&
    !spec.laptopRef &&
    !hinweisOk.has(spec.skillId) &&
    task.parts.some((p) => p.typ === 'tabelle')
  ) {
    return (
      <LaptopHinweis
        onHier={() => setHinweisOk(new Set([...hinweisOk, spec.skillId]))}
        onMerken={async () => {
          const d: { skillId: string; seed: number; variant?: string } = {
            skillId: spec.skillId,
            seed: spec.seed,
          };
          if (spec.variant) d.variant = spec.variant;
          await laptopSpeichern('laptop-merken', d);
          setGemerkt(gemerkt + 1);
          setIndex(index + 1);
        }}
      />
    );
  }

  if (!spec || !task) {
    const geloest = ergebnisse.filter((e) => e.correct).length;
    const fehler = [...new Set(ergebnisse.flatMap((e) => e.errorTypes))];
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <h2 className="text-xl font-semibold">Sitzung abgeschlossen</h2>
          {gemerkt > 0 ? (
            <p className="mt-1 text-sm text-muted">
              {gemerkt === 1 ? 'Eine Aufgabe ist' : `${gemerkt} Aufgaben sind`} für den Laptop
              gemerkt.
            </p>
          ) : null}
          <dl className="num mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-muted">Aufgaben</dt>
              <dd className="text-2xl font-semibold">{ergebnisse.length}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Beim ersten Versuch gelöst</dt>
              <dd className="text-2xl font-semibold">{geloest}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-sm text-muted">Lernzeit</dt>
              <dd className="text-lg">
                {dauerText(ergebnisse.reduce((a, e) => a + e.durationMs, 0))}
              </dd>
            </div>
          </dl>
        </Card>
        {fehler.length > 0 ? (
          <Card>
            <h3 className="font-semibold">Darauf achten</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {fehler.map((f) => (
                <li key={f}>
                  <div className="font-medium">{fehlertyp(f).titel}</div>
                  <div className="text-sm text-muted">{fehlertyp(f).erklaerung}</div>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
        <Card>
          <h3 className="font-semibold">Geübt</h3>
          <ul className="mt-2 flex flex-col gap-1 text-[15px]">
            {ergebnisse.map((e) => (
              <li key={e.id} className="flex justify-between gap-3">
                <span>
                  {skillTitel(e.skillId)}
                  {e.variant === 'erkennen'
                    ? ' – erkennen'
                    : e.variant?.startsWith('mc:')
                      ? ' – Verständnisfrage'
                      : ''}
                </span>
                <span className={e.correct ? 'text-ok' : 'text-warn'}>
                  {e.correct ? 'gelöst' : 'geübt'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="primary" onClick={() => navigate('start')}>
            Zur Startseite
          </Button>
          <Button
            onClick={() => {
              void planen();
              setIndex(0);
              setErgebnisse([]);
              setWiederholt(new Set());
            }}
          >
            Noch eine Sitzung
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TaskRunner
      key={spec.key}
      task={task}
      position={index + 1}
      total={queue.length}
      wiederholungFolgt={spec.art === 'aufgabe' && !wiederholt.has(spec.skillId)}
      onFinish={(o) => void onFinish(o)}
      onExit={() => (index === 0 ? navigate('start') : setIndex(queue.length))}
    />
  );
}
