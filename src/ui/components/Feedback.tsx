// Rückmeldung zu einem Aufgabenteil: was stimmt, welcher Denkfehler erkannt wurde.
import { fehlertyp } from '../../engine/fehlertypen';
import type { PartResult, SolutionStep } from '../../engine/task';
import { cx } from './ui';

export function PartFeedback({
  result,
  begruendung,
}: {
  result: PartResult;
  begruendung?: string | undefined;
}) {
  const titel = result.korrekt
    ? 'Richtig'
    : result.score >= 0.5
      ? 'Teilweise richtig'
      : 'Noch nicht richtig';
  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      <div
        className={cx(
          'rounded-lg border p-3',
          result.korrekt ? 'border-ok/40 bg-ok-soft' : 'border-warn/40 bg-warn-soft',
        )}
      >
        <div className={cx('font-semibold', result.korrekt ? 'text-ok' : 'text-warn')}>{titel}</div>
        <ul className="mt-1 flex flex-col gap-0.5 text-sm">
          {result.feedback.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
        {result.rundungshinweis ? (
          <p className="mt-1 text-sm text-muted">
            Kleine Abweichung durch Rundung – gilt als richtig. Rechne möglichst mit ungerundeten
            Zwischenwerten.
          </p>
        ) : null}
        {begruendung ? <p className="mt-1 text-sm">{begruendung}</p> : null}
      </div>
      <Denkfehler ids={result.fehlertypen} />
    </div>
  );
}

export function Denkfehler({ ids }: { ids: readonly string[] }) {
  if (ids.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {ids.map((id) => {
        const f = fehlertyp(id);
        return (
          <div key={id} className="rounded-lg border border-line bg-surface-2 p-3">
            <div className="text-xs font-semibold tracking-wide text-muted uppercase">
              Erkannter Denkfehler
            </div>
            <div className="mt-0.5 font-semibold">{f.titel}</div>
            <p className="mt-1 text-sm">{f.erklaerung}</p>
          </div>
        );
      })}
    </div>
  );
}

export function Rechenweg({ steps }: { steps: readonly SolutionStep[] }) {
  if (steps.length === 0) return null;
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
            {i + 1}
          </span>
          <div className="min-w-0">
            <div className="font-medium">{s.titel}</div>
            {s.rechnung ? <div className="num break-words text-[15px]">{s.rechnung}</div> : null}
            {s.erlaeuterung ? <div className="text-sm text-muted">{s.erlaeuterung}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
