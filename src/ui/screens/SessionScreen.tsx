// Kurz-Sitzung: Aufgaben nacheinander, Fehler führen zu einer weiteren Übung desselben Typs.
import { useEffect, useMemo, useState } from 'react';
import { fehlertyp } from '../../engine/fehlertypen';
import { randomSeed } from '../../engine/rng';
import { prepareTask, skillTitel, type TaskSpec } from '../../learning/prepare';
import { erstelleAttempt } from '../../learning/record';
import { kurzSitzung, wiederholung } from '../../learning/session';
import type { AttemptEvent } from '../../learning/types';
import { addEvent, deviceId, eventsForSkill } from '../../storage/db';
import { Button, Card } from '../components/ui';
import { TaskRunner, type TaskOutcome } from '../components/TaskRunner';
import { navigate } from '../hooks';

function sitzungAusHash(): TaskSpec[] {
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
  if (start !== null) return kurzSitzung(start);
  return kurzSitzung();
}

function dauerText(ms: number): string {
  const min = Math.round(ms / 60_000);
  return min < 1 ? 'unter 1 Minute' : min === 1 ? '1 Minute' : `${min} Minuten`;
}

export function SessionScreen() {
  const [queue, setQueue] = useState<TaskSpec[]>(sitzungAusHash);
  const [index, setIndex] = useState(0);
  const [ergebnisse, setErgebnisse] = useState<AttemptEvent[]>([]);
  const [wiederholt, setWiederholt] = useState<ReadonlySet<string>>(new Set());

  const spec = queue[index];
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
    setErgebnisse((prev) => [...prev, event]);
    if (!event.correct && spec.art === 'aufgabe' && !wiederholt.has(spec.skillId)) {
      setWiederholt((prev) => new Set([...prev, spec.skillId]));
      const pos = Math.min(queue.length, index + 3);
      setQueue((prev) => [...prev.slice(0, pos), wiederholung(spec), ...prev.slice(pos)]);
    }
    setIndex((i) => i + 1);
  };

  if (!spec || !task) {
    const geloest = ergebnisse.filter((e) => e.correct).length;
    const fehler = [...new Set(ergebnisse.flatMap((e) => e.errorTypes))];
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <h2 className="text-xl font-semibold">Sitzung abgeschlossen</h2>
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
              setQueue(kurzSitzung());
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
