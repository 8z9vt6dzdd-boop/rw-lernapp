// Eine Aufgabe Schritt für Schritt bearbeiten: Teil prüfen, Rückmeldung, gestufte Hilfen, Rechenweg.
import { useMemo, useRef, useState, type FormEvent } from 'react';
import { checkPart, combineResults } from '../../engine/check';
import type { PartAnswer, PartResult, SatzEingabe, TaskAnswer, TaskPart } from '../../engine/task';
import type { PreparedTask } from '../../learning/prepare';
import { BuchungssatzBuilder, leereSaetze } from './Buchungssatz';
import { Denkfehler, PartFeedback, Rechenweg } from './Feedback';
import { RechenketteInput, TabelleInput, type FeldWerte } from './Felder';
import { Button, Card, Chip, Icon, cx } from './ui';
import { WahlInput } from './Wahl';

export interface TaskOutcome {
  answers: TaskAnswer;
  /** Ergebnis der jeweils ersten Prüfung je Teil (Grundlage der Bewertung) */
  results: PartResult[];
  hintsUsed: number;
  durationMs: number;
  loesungGezeigt: boolean;
}

function leereAntwort(part: TaskPart): PartAnswer {
  switch (part.typ) {
    case 'rechenkette':
    case 'tabelle':
      return { typ: 'felder', werte: {} };
    case 'buchungssatz':
      return { typ: 'buchung', saetze: leereSaetze(part.loesung.saetze.length) };
    default:
      return { typ: 'wahl', optionId: '' };
  }
}

function istLeer(a: PartAnswer): boolean {
  if (a.typ === 'wahl') return a.optionId === '';
  if (a.typ === 'felder') return Object.values(a.werte).every((v) => v.trim() === '');
  return a.saetze.every((s) => [...s.soll, ...s.haben].every((z) => !z.konto && !z.betrag.trim()));
}

export function TaskRunner({
  task,
  position,
  total,
  onFinish,
  onExit,
  wiederholungFolgt,
}: {
  task: PreparedTask;
  wiederholungFolgt: boolean;
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
            Aufgabe {position} von {total}
          </span>
          {task.spec.wiederholung ? <Chip tone="accent">Noch einmal üben</Chip> : null}
        </div>
        <button
          type="button"
          onClick={onExit}
          className="flex h-10 items-center gap-1 rounded-lg px-2 text-sm text-muted hover:bg-surface-2"
          aria-label="Sitzung beenden"
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

      <Card>
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
        {task.text.daten ? (
          <div className="-mx-4 mt-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="num w-full border-collapse text-sm">
              {task.text.daten.spalten.some((s) => s) ? (
                <thead>
                  <tr>
                    {task.text.daten.spalten.map((s, i) => (
                      <th
                        key={i}
                        className={cx(
                          'border-b border-line px-2 py-1.5 text-xs font-semibold text-muted',
                          i === 0 ? 'text-left' : 'text-right',
                        )}
                      >
                        {s}
                      </th>
                    ))}
                  </tr>
                </thead>
              ) : null}
              <tbody>
                {task.text.daten.zeilen.map((z, zi) => (
                  <tr key={zi} className="border-b border-line last:border-0">
                    {z.map((c, ci) => (
                      <td
                        key={ci}
                        className={cx(
                          'px-2 py-1.5',
                          ci === 0 ? 'text-left' : 'text-right whitespace-nowrap',
                        )}
                      >
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <p className="mt-3 border-t border-line pt-3 text-[15px] font-medium">
          {task.text.aufgabe}
        </p>
      </Card>

      {task.parts.slice(0, active + 1).map((p) => {
        const r = results[p.id];
        const locked = (r !== undefined && !editing[p.id]) || p.id !== part.id;
        const a = answers[p.id]!;
        return (
          <Card key={p.id}>
            {'titel' in p ? <h3 className="mb-3 font-semibold">{p.titel}</h3> : null}
            {p.typ === 'rechenkette' ? (
              <RechenketteInput
                part={p}
                werte={(a as { werte: FeldWerte }).werte}
                onChange={(w) => setAnswer(p.id, { typ: 'felder', werte: w })}
                result={editing[p.id] ? undefined : r}
                revealed={!!revealed[p.id]}
                disabled={locked}
              />
            ) : p.typ === 'tabelle' ? (
              <TabelleInput
                part={p}
                werte={(a as { werte: FeldWerte }).werte}
                onChange={(w) => setAnswer(p.id, { typ: 'felder', werte: w })}
                result={editing[p.id] ? undefined : r}
                revealed={!!revealed[p.id]}
                disabled={locked}
              />
            ) : p.typ === 'buchungssatz' ? (
              <BuchungssatzBuilder
                part={p}
                saetze={(a as { saetze: SatzEingabe[] }).saetze}
                onChange={(s) => setAnswer(p.id, { typ: 'buchung', saetze: s })}
                result={editing[p.id] ? undefined : r}
                revealed={!!revealed[p.id]}
                disabled={locked}
              />
            ) : (
              <WahlInput
                part={p}
                value={(a as { optionId: string }).optionId}
                onChange={(id) => setAnswer(p.id, { typ: 'wahl', optionId: id })}
                result={editing[p.id] ? undefined : r}
                disabled={locked}
              />
            )}
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
                  {i === 0 ? 'Aufgabentyp: ' : i === 1 ? 'Nächster Schritt: ' : 'Lösungsschritt: '}
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

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 [&_button]:whitespace-nowrap">
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
                  ? 'Nächste Aufgabe'
                  : 'Sitzung abschließen'}
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
