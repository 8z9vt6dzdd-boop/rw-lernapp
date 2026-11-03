// Multiple Choice und „Aufgabe erkennen“: große Antwortflächen für die Daumenbedienung.
import type { PartResult, WahlPart } from '../../engine/task';
import { StatusIcon, cx } from './ui';

export function WahlInput({
  part,
  value,
  onChange,
  result,
  disabled,
}: {
  part: WahlPart;
  value: string | undefined;
  onChange: (id: string) => void;
  result?: PartResult | undefined;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[15px] font-medium">{part.frage}</p>
      <div role="radiogroup" aria-label={part.frage} className="flex flex-col gap-2">
        {part.optionen.map((o) => {
          const gewaehlt = value === o.id;
          const zeigeRichtig = result && o.richtig;
          const zeigeFalsch = result && gewaehlt && !o.richtig;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={gewaehlt}
              disabled={disabled}
              onClick={() => onChange(o.id)}
              className={cx(
                'flex min-h-12 items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-[15px] transition-colors',
                !result && !gewaehlt && 'border-line-strong bg-surface hover:bg-surface-2',
                !result && gewaehlt && 'border-accent bg-accent-soft',
                zeigeRichtig && 'border-ok bg-ok-soft',
                zeigeFalsch && 'border-err bg-err-soft',
                result && !zeigeRichtig && !zeigeFalsch && 'border-line bg-surface opacity-70',
              )}
            >
              <span>{o.text}</span>
              {zeigeRichtig ? (
                <StatusIcon status="richtig" />
              ) : zeigeFalsch ? (
                <StatusIcon status="falsch" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
