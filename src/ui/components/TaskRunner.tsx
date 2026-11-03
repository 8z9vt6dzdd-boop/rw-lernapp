// Eine Aufgabe Schritt für Schritt bearbeiten: Teil prüfen, Rückmeldung, gestufte Hilfen, Rechenweg.
import { useMemo, useRef, useState, type FormEvent } from 'react';
import { DatenTabelle } from './DatenTabelle';
import { checkPart, combineResults } from '../../engine/check';
import { spiele } from '../sound';
import type { PartAnswer, PartResult, TaskAnswer } from '../../engine/task';
import type { PreparedTask } from '../../learning/prepare';
import { Denkfehler, PartFeedback, Rechenweg } from './Feedback';
import { PartInput, istLeer, leereAntwort } from './PartInput';
import { Button, Card, Chip, Icon, cx } from './ui';

export interface TaskOutcome {
  answers: TaskAnswer;
  /** Ergebnis der jeweils ersten Prüfung je Teil (Grundlage der Bewertung) */
  results: PartResult[];
  hintsUsed: number;
  durationMs: number;
  loesungGezeigt: boolean;
}

export function TaskRunner({
  task,
  position,
  total,
  onFinish,
  onExit,
  wiederholungFolgt,
  bezeichnung = 'Aufgabe',
  weiterText,
  abschlussText = 'Sitzung abschließen',
  breit = false,
}: {
  task: PreparedTask;
  wiederholungFolgt: boolean;
  /** „Aufgabe“ (Kurzmodus) oder „Schritt“ (Fall) */
  bezeichnung?: string;
  /** Beschriftung für den Übergang zur nächsten Aufgabe bzw. zum nächsten Schritt */
  weiterText?: string;
  abschlussText?: string;
  /** Fallmodus am Laptop: Sachverhalt links, Eingaben rechts */
  breit?: boolean;
  position: number;
  total: number;
  onFinish: (o: TaskOutcome) => void;
  onExit: () => void;
}) {
  const [start] = useState(() => Date.now());
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState<TaskAnswer>(() =>
    Object.fromEntries(task.parts.map((p) => [p.id, leereAntwort(p)])),
  );
  const [results, setResults] = useState<Record<string, PartResult>>({});
  const [ersteResults, setErsteResults] = useState<Record<string, PartResult>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [hintLevel, setHintLevel] = useState(0);
  const [showWeg, setShowWeg] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const part = task.parts[active]!;
  const fertig = task.parts.every(
    (p) => results[p.id] && (results[p.id]!.korrekt || revealed[p.id]),
  );
  const currentResult = results[part.id];
  const currentDone =
    currentResult && !editing[part.id] && (currentResult.korrekt || revealed[part.id]);

  const gesamt = useMemo(
    () =>
      fertig
        ? combineResults(task.parts, task.parts.map((p) => ersteResults[p.id]!).filter(Boolean))
        : null,
    [fertig, task.parts, ersteResults],
  );

  const setAnswer = (id: string, a: PartAnswer) => setAnswers((prev) => ({ ...prev, [id]: a }));

  const pruefen = () => {
    const r = checkPart(part, answers[part.id], task.variants);
    spiele(r.korrekt ? 'richtig' : 'falsch');
    setResults((prev) => ({ ...prev, [part.id]: r }));
    setErsteResults((prev) => (prev[part.id] ? prev : { ...prev, [part.id]: r }));
    setEditing((prev) => ({ ...prev, [part.id]: false }));
    requestAnimationFrame(() =>
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }),
    );
  };

  const weiter = () => {
    if (active < task.parts.length - 1) {
      setActive(active + 1);
      requestAnimationFrame(() =>
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }),
      );
    } else {
      onFinish({
        answers,
        results: task.parts.map((p) => ersteResults[p.id]!),
        hintsUsed: hintLevel,
        durationMs: Date.now() - start,
        loesungGezeigt: Object.values(revealed).some(Boolean),
      });
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (fertig && active === task.parts.length - 1 && currentDone) weiter();
    else if (currentDone) weiter();
    else if (!istLeer(answers[part.id]!) && (!currentResult || editing[part.id])) pruefen();
  };

  const darfPruefen = !istLeer(answers[part.id]!) && (!currentResult || editing[part.id]);
  const istFalschOffen =
    currentResult && !currentResult.korrekt && !revealed[part.id] && !editing[part.id];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-40" noValidate>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="num text-sm text-muted">
            {bezeichnung} {position} von {total}
          </span>
          {task.spec.wiederholung ? <Chip tone="accent">Noch einmal üben</Chip> : null}
        </div>
        <button
          type="button"
          onClick={onExit}
          className="flex h-10 items-center gap-1 rounded-lg px-2 text-sm text-muted hover:bg-surface-2"
          aria-label={bezeichnung === 'Aufgabe' ? 'Sitzung beenden' : 'Fall beenden'}
        >
          <Icon name="schliessen" className="h-5 w-5" /> Beenden
        </button>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${((position - 1) / total) * 100}%` }}
        />
      </div>

      <div
        className={
          breit
            ? 'flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-6'
            : 'contents'
        }
      >
        <Card
          className={
            breit ? 'lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto' : undefined
          }
        >
          {task.text.kontext ? (
            <div className="mb-1 text-xs font-medium tracking-wide text-accent uppercase">
              {task.text.kontext}
            </div>
          ) : null}
          <h2 className="text-lg font-semibold">{task.text.titel}</h2>
          <div className="mt-2 flex flex-col gap-2 text-[15px]">
            {task.text.sachverhalt.map((s, i) => (
              <p key={i}>{s}</p>
            ))}
          </div>
          {task.text.daten ? <DatenTabelle daten={task.text.daten} /> : null}
          <p className="mt-3 border-t border-line pt-3 text-[15px] font-medium">
            {task.text.aufgabe}
          </p>
        </Card>
        <div className={breit ? 'flex min-w-0 flex-col gap-4' : 'contents'}>
          {task.parts.slice(0, active + 1).map((p) => {
            const r = results[p.id];
            const locked = (r !== undefined && !editing[p.id]) || p.id !== part.id;
            const a = answers[p.id]!;
            return (
              <Card key={p.id}>
                {'titel' in p ? <h3 className="mb-3 font-semibold">{p.titel}</h3> : null}
                <PartInput
                  part={p}
                  antwort={a}
                  onChange={(x) => setAnswer(p.id, x)}
                  result={editing[p.id] ? undefined : r}
                  revealed={!!revealed[p.id]}
                  disabled={locked}
                />
                {r && !editing[p.id] ? (
                  <div className="mt-4">
                    <PartFeedback
                      result={r}
                      begruendung={
                        (p.typ === 'mc' || p.typ === 'aufgabe-erkennen') &&
                        (r.korrekt || revealed[p.id])
                          ? p.begruendung
                          : undefined
                      }
                    />
                  </div>
                ) : null}
              </Card>
            );
          })}

          {hintLevel > 0 && !fertig ? (
            <Card className="border-accent/40 bg-accent-soft/40">
              <h3 className="mb-2 text-sm font-semibold text-accent">Hilfen</h3>
              <ol className="flex flex-col gap-2 text-[15px]">
                {task.hints.slice(0, hintLevel).map((h, i) => (
                  <li key={i}>
                    <span className="font-medium">
                      {i === 0
                        ? 'Aufgabentyp: '
                        : i === 1
                          ? 'Nächster Schritt: '
                          : 'Lösungsschritt: '}
                    </span>
                    {h}
                  </li>
                ))}
              </ol>
            </Card>
          ) : null}

          {fertig && gesamt ? (
            <Card>
              <h3 className="font-semibold">
                {gesamt.korrekt && !Object.values(revealed).some(Boolean)
                  ? 'Aufgabe gelöst'
                  : 'Aufgabe abgeschlossen'}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {gesamt.korrekt
                  ? hintLevel > 0
                    ? 'Richtig – mit Hilfe. Die Aufgabe kommt bald wieder, damit sie sicher sitzt.'
                    : 'Richtig beim ersten Versuch.'
                  : wiederholungFolgt
                    ? 'Beim ersten Versuch nicht ganz richtig. Eine ähnliche Aufgabe folgt später in dieser Sitzung.'
                    : 'Beim ersten Versuch nicht ganz richtig. Die Aufgabe kommt in den nächsten Sitzungen wieder.'}
              </p>
              {!gesamt.korrekt ? (
                <div className="mt-3">
                  <Denkfehler
                    ids={gesamt.fehlertypen.filter(
                      (f) => !task.parts.some((p) => results[p.id]?.fehlertypen.includes(f)),
                    )}
                  />
                </div>
              ) : null}
              {task.steps.length > 0 ? (
                <div className="mt-3">
                  <button
                    type="button"
                    className="text-sm font-medium text-accent underline"
                    onClick={() => setShowWeg(!showWeg)}
                    aria-expanded={showWeg}
                  >
                    {showWeg ? 'Rechenweg ausblenden' : 'Rechenweg ansehen'}
                  </button>
                  {showWeg ? (
                    <div className="mt-3">
                      <Rechenweg steps={task.steps} />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Card>
          ) : null}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur">
        <div
          className={cx(
            'mx-auto flex items-center gap-2 px-4 py-3 [&_button]:whitespace-nowrap',
            breit ? 'max-w-6xl' : 'max-w-3xl',
          )}
        >
          {!fertig ? (
            <Button
              variant="ghost"
              onClick={() => setHintLevel(Math.min(3, hintLevel + 1))}
              disabled={hintLevel >= 3}
              aria-label={`Hilfe anzeigen (${hintLevel} von 3 genutzt)`}
            >
              <Icon name="hilfe" className="h-5 w-5" />
              <span className={istFalschOffen ? 'sr-only sm:not-sr-only' : undefined}>Hilfe</span>
              {hintLevel > 0 ? <span className="num">{hintLevel}/3</span> : null}
            </Button>
          ) : null}
          <div className="flex-1" />
          {istFalschOffen ? (
            <>
              <Button onClick={() => setEditing((prev) => ({ ...prev, [part.id]: true }))}>
                Korrigieren
              </Button>
              <Button
                variant="primary"
                onClick={() => setRevealed((prev) => ({ ...prev, [part.id]: true }))}
              >
                Lösung zeigen
              </Button>
            </>
          ) : currentDone ? (
            <Button variant="primary" type="submit">
              {active < task.parts.length - 1
                ? 'Weiter'
                : position < total
                  ? (weiterText ?? `Nächste ${bezeichnung}`)
                  : abschlussText}
              <Icon name="pfeil" className="h-5 w-5" />
            </Button>
          ) : (
            <Button variant="primary" type="submit" disabled={!darfPruefen}>
              Prüfen
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
