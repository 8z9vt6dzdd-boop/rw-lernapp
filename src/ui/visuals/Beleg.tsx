// Beleg-Ansicht: erfundene Rechnung bzw. Kontoauszug im Papier-Look. Zeilen optional antippbar (Fehlerjagd).
import { formatEuro } from '../../engine/money';
import { cx } from '../components/ui';

import type { BelegZeile } from '../../content/visual-types';

export type { BelegZeile };

export function Beleg({
  art = 'rechnung',
  absender,
  empfaenger = 'MBG Getränke OHG (Lernversion), Paderborn',
  nummer,
  datum,
  zeilen,
  fuss,
  gewaehlt,
  status,
  onZeile,
}: {
  art?: 'rechnung' | 'kontoauszug';
  absender: string;
  empfaenger?: string;
  nummer?: string;
  datum?: string;
  zeilen: readonly BelegZeile[];
  fuss?: string;
  gewaehlt?: number | undefined;
  /** Nach der Prüfung: richtig gefundene bzw. falsch gewählte Zeile */
  status?: { richtig: number; gewaehltFalsch?: number | undefined } | undefined;
  onZeile?: (i: number) => void;
}) {
  return (
    <figure
      className="relative w-full max-w-md rotate-[-0.6deg] rounded-sm bg-[color:var(--peep-paper)] p-4 text-[color:var(--peep-ink)] shadow-[0_2px_0_rgba(0,0,0,0.08),0_6px_16px_rgba(60,45,20,0.12)]"
      aria-label={art === 'rechnung' ? `Rechnung von ${absender}` : `Kontoauszug ${absender}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-dashed border-[color:var(--peep-ink)]/40 pb-2">
        <div>
          <div className="hand text-[15px] font-bold">{absender}</div>
          <div className="text-[11px] opacity-70">an {empfaenger}</div>
        </div>
        <div className="text-right text-[11px] opacity-80">
          <div className="font-semibold tracking-wide uppercase">
            {art === 'rechnung' ? 'Rechnung' : 'Kontoauszug'}
          </div>
          {nummer ? <div>Nr. {nummer}</div> : null}
          {datum ? <div>{datum}</div> : null}
        </div>
      </div>
      <ul className="mt-2 flex flex-col">
        {zeilen.map((z, i) => {
          const istRichtig = status?.richtig === i;
          const istFalsch = status?.gewaehltFalsch === i;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={!onZeile}
                onClick={() => onZeile?.(i)}
                aria-pressed={onZeile ? gewaehlt === i : undefined}
                className={cx(
                  'flex w-full items-baseline justify-between gap-3 rounded px-1.5 py-1 text-left text-[13px] sm:text-sm',
                  z.fett && 'font-semibold',
                  onZeile && 'hover:bg-black/5',
                  gewaehlt === i && !status && 'bg-[#fbefc9] ring-2 ring-[#e2b13c]',
                  istRichtig && 'bg-[#e4f2dc] ring-2 ring-[#2d7a3a]',
                  istFalsch && 'bg-[#fbe9e6] ring-2 ring-[#b3261e]',
                )}
              >
                <span>{z.text}</span>
                {z.betrag ? <span className="num shrink-0">{formatEuro(z.betrag)}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
      {fuss ? (
        <p className="mt-2 border-t border-dashed border-[color:var(--peep-ink)]/40 pt-2 text-[11px] opacity-80">
          {fuss}
        </p>
      ) : null}
      <p className="mt-1 text-[10px] opacity-50">Beispielbeleg mit erfundenen Daten</p>
    </figure>
  );
}
