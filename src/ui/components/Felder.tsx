// Rechenkette und Tabellenaufgabe: Eingabefelder mit Bezeichnung, Einheit und Bewertung.
import { felderVon, formatSoll } from '../../engine/check';
import type { Bewertung } from '../../engine/money';
import type { Feld, PartResult, RechenkettePart, TabellePart, ZahlFeld } from '../../engine/task';
import { StatusIcon, cx } from './ui';

export type FeldWerte = Record<string, string>;

interface FeldProps {
  werte: FeldWerte;
  onChange: (werte: FeldWerte) => void;
  result?: PartResult | undefined;
  revealed: boolean;
  disabled: boolean;
}

function bewertungVon(result: PartResult | undefined, id: string): Bewertung | undefined {
  return result?.felder?.[id]?.bewertung;
}

export function ZahlEingabe({
  feld,
  value,
  onChange,
  bewertung,
  disabled,
  compact = false,
  revealed,
}: {
  feld: ZahlFeld;
  value: string;
  onChange: (v: string) => void;
  bewertung?: Bewertung | undefined;
  disabled: boolean;
  compact?: boolean;
  revealed: boolean;
}) {
  const falsch = bewertung === 'falsch';
  return (
    <div className={cx('flex flex-col', compact ? 'min-w-[8.75rem]' : 'w-full')}>
      <div
        className={cx(
          'flex items-center rounded-lg border bg-surface focus-within:border-accent',
          bewertung === undefined && 'border-line-strong',
          bewertung && !falsch && 'border-ok bg-ok-soft',
          falsch && 'border-err bg-err-soft',
        )}
      >
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="next"
          aria-label={feld.label}
          aria-invalid={falsch || undefined}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cx(
            'num w-full min-w-0 bg-transparent text-right outline-none disabled:text-ink',
            compact ? 'h-10 px-2 text-[15px]' : 'h-11 px-3 text-base',
          )}
        />
        {feld.einheit ? <span className="pr-3 text-sm text-muted">{feld.einheit}</span> : null}
      </div>
      {falsch && revealed ? (
        <span className="num mt-1 text-right text-xs text-ok">richtig: {formatSoll(feld)}</span>
      ) : null}
      {bewertung === 'rundung' ? (
        <span className="num mt-1 text-right text-xs text-muted">genauer: {formatSoll(feld)}</span>
      ) : null}
    </div>
  );
}

function AuswahlEingabe({
  feld,
  value,
  onChange,
  bewertung,
  disabled,
  revealed,
}: {
  feld: Extract<Feld, { typ: 'auswahl' }>;
  value: string;
  onChange: (v: string) => void;
  bewertung?: Bewertung | undefined;
  disabled: boolean;
  revealed: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={feld.label} className="flex flex-wrap gap-2">
      {feld.optionen.map((o) => {
        const gewaehlt = value === o;
        const istRichtig = revealed && o === feld.soll;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={gewaehlt}
            disabled={disabled}
            onClick={() => onChange(o)}
            className={cx(
              'min-h-11 rounded-lg border px-3 py-2 text-left text-[15px] transition-colors',
              !gewaehlt && 'border-line-strong bg-surface hover:bg-surface-2',
              gewaehlt && bewertung === undefined && 'border-accent bg-accent-soft text-accent',
              gewaehlt && bewertung === 'richtig' && 'border-ok bg-ok-soft text-ok',
              gewaehlt && bewertung === 'falsch' && 'border-err bg-err-soft text-err',
              istRichtig && !gewaehlt && 'border-ok border-dashed',
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function RechenketteInput({
  part,
  werte,
  onChange,
  result,
  revealed,
  disabled,
}: FeldProps & { part: RechenkettePart }) {
  return (
    <div className="flex flex-col gap-4">
      {part.felder.map((f) => {
        const b = bewertungVon(result, f.id);
        return (
          <div key={f.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[15px] font-medium">{f.label}</label>
              {b ? <StatusIcon status={b} /> : null}
            </div>
            {f.typ === 'zahl' ? (
              <ZahlEingabe
                feld={f}
                value={werte[f.id] ?? ''}
                onChange={(v) => onChange({ ...werte, [f.id]: v })}
                bewertung={b}
                disabled={disabled}
                revealed={revealed}
              />
            ) : (
              <AuswahlEingabe
                feld={f}
                value={werte[f.id] ?? ''}
                onChange={(v) => onChange({ ...werte, [f.id]: v })}
                bewertung={b}
                disabled={disabled}
                revealed={revealed}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TabelleInput({
  part,
  werte,
  onChange,
  result,
  revealed,
  disabled,
}: FeldProps & { part: TabellePart }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full border-separate border-spacing-0 text-[15px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface p-2 text-left text-xs font-semibold text-muted" />
              {part.spalten.map((s) => (
                <th
                  key={s}
                  className="min-w-[8.75rem] p-2 text-right align-bottom text-xs font-semibold text-muted"
                >
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {part.zeilen.map((z, zi) => (
              <tr key={zi}>
                <th
                  scope="row"
                  className={cx(
                    'sticky left-0 z-10 max-w-[9rem] bg-surface p-2 text-left align-top text-sm font-medium sm:max-w-none',
                    z.summe && 'border-t-2 border-line-strong',
                  )}
                >
                  {z.label}
                </th>
                {z.zellen.map((c, ci) => (
                  <td
                    key={ci}
                    className={cx('p-1 align-top', z.summe && 'border-t-2 border-line-strong')}
                  >
                    {c.typ === 'fest' ? (
                      <div className="num flex h-10 items-center justify-end rounded-md bg-surface-2 px-2 text-muted">
                        {c.text}
                      </div>
                    ) : c.typ === 'leer' ? (
                      <div className="h-10 rounded-md bg-surface-3/60" aria-hidden="true" />
                    ) : (
                      <ZahlEingabe
                        feld={c}
                        compact
                        value={werte[c.id] ?? ''}
                        onChange={(v) => onChange({ ...werte, [c.id]: v })}
                        bewertung={bewertungVon(result, c.id)}
                        disabled={disabled}
                        revealed={revealed}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {part.hinweis ? <p className="text-sm text-muted">{part.hinweis}</p> : null}
    </div>
  );
}

export function anzahlFelder(part: RechenkettePart | TabellePart): number {
  return felderVon(part).length;
}
