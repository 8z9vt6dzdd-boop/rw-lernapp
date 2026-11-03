// Buchungssatz-Builder: Konten aus der Liste wählen, Beträge eingeben, Soll/Haben-Summen live.
import { useState } from 'react';
import { canonicalKonto, getKonto } from '../../engine/accounts';
import { formatSatz } from '../../engine/booking';
import { Decimal, formatEuro, parseNumber } from '../../engine/money';
import type { BuchungPart, PartResult, SatzEingabe, ZeilenEingabe } from '../../engine/task';
import { KontoPicker } from './KontoPicker';
import { Icon, StatusIcon, cx } from './ui';

type Seite = 'soll' | 'haben';

export function leereSaetze(anzahl: number): SatzEingabe[] {
  return Array.from({ length: anzahl }, () => ({
    soll: [{ konto: '', betrag: '' }],
    haben: [{ konto: '', betrag: '' }],
  }));
}

function summe(zeilen: ZeilenEingabe[]): InstanceType<typeof Decimal> {
  return zeilen.reduce((a, z) => a.plus(parseNumber(z.betrag) ?? 0), new Decimal(0));
}

function zeilenStatus(
  result: PartResult | undefined,
  seite: Seite,
  kontoEingabe: string,
): 'richtig' | 'betrag' | 'falsch' | undefined {
  if (!result || !kontoEingabe) return undefined;
  const konto = canonicalKonto(kontoEingabe);
  if (!konto) return 'falsch';
  const z = result.zeilen?.filter((x) => x.konto === konto) ?? [];
  if (z.some((x) => x.seite === seite && x.status === 'richtig')) return 'richtig';
  if (z.some((x) => x.seite === seite && x.status === 'betrag-falsch')) return 'betrag';
  return 'falsch';
}

export function BuchungssatzBuilder({
  part,
  saetze,
  onChange,
  result,
  revealed,
  disabled,
}: {
  part: BuchungPart;
  saetze: SatzEingabe[];
  onChange: (s: SatzEingabe[]) => void;
  result?: PartResult | undefined;
  revealed: boolean;
  disabled: boolean;
}) {
  const [picker, setPicker] = useState<{ satz: number; seite: Seite; zeile: number } | null>(null);
  const labels = part.loesung.saetze.map((s) => s.label);

  const update = (si: number, seite: Seite, zi: number, patch: Partial<ZeilenEingabe>) => {
    const next = saetze.map((s, i) =>
      i !== si ? s : { ...s, [seite]: s[seite].map((z, j) => (j === zi ? { ...z, ...patch } : z)) },
    );
    onChange(next);
  };
  const addZeile = (si: number, seite: Seite) =>
    onChange(
      saetze.map((s, i) =>
        i !== si ? s : { ...s, [seite]: [...s[seite], { konto: '', betrag: '' }] },
      ),
    );
  const removeZeile = (si: number, seite: Seite, zi: number) =>
    onChange(
      saetze.map((s, i) => (i !== si ? s : { ...s, [seite]: s[seite].filter((_, j) => j !== zi) })),
    );

  return (
    <div className="flex flex-col gap-4">
      {saetze.map((s, si) => {
        const sumS = summe(s.soll);
        const sumH = summe(s.haben);
        const ausgeglichen = sumS.equals(sumH) && !sumS.isZero();
        return (
          <div
            key={si}
            data-satz={si}
            className="rounded-lg border border-line bg-surface-2/40 p-3"
          >
            {saetze.length > 1 || labels[si] ? (
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                  Buchungssatz {saetze.length > 1 ? si + 1 : ''}
                  {labels[si] ? (
                    <span className="font-normal text-muted"> – {labels[si]}</span>
                  ) : null}
                </h4>
                {!disabled && saetze.length > part.loesung.saetze.length ? (
                  <button
                    type="button"
                    className="text-sm text-muted underline"
                    onClick={() => onChange(saetze.filter((_, i) => i !== si))}
                  >
                    entfernen
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(['soll', 'haben'] as const).map((seite) => (
                <div key={seite} className="flex min-w-0 flex-col gap-2">
                  <div className="text-xs font-semibold tracking-wide text-muted uppercase">
                    {seite === 'soll' ? 'Soll' : 'Haben (an …)'}
                  </div>
                  {s[seite].map((z, zi) => {
                    const st = zeilenStatus(result, seite, z.konto);
                    const kurz = z.konto
                      ? canonicalKonto(z.konto)
                        ? getKonto(z.konto).name
                        : z.konto
                      : '';
                    return (
                      <div key={zi} className="flex items-start gap-2">
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row">
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => setPicker({ satz: si, seite, zeile: zi })}
                            aria-label={`${seite === 'soll' ? 'Soll' : 'Haben'}-Konto ${zi + 1}: ${kurz || 'wählen'}`}
                            className={cx(
                              'min-h-11 min-w-0 flex-1 truncate rounded-lg border px-3 text-left text-[15px]',
                              !st && 'border-line-strong bg-surface',
                              st === 'richtig' && 'border-ok bg-ok-soft',
                              st === 'betrag' && 'border-ok bg-ok-soft',
                              st === 'falsch' && 'border-err bg-err-soft',
                              !kurz && 'text-muted',
                            )}
                          >
                            {kurz || 'Konto wählen …'}
                          </button>
                          <div
                            className={cx(
                              'flex items-center rounded-lg border bg-surface sm:w-40',
                              st === 'betrag'
                                ? 'border-err bg-err-soft'
                                : st === 'richtig'
                                  ? 'border-ok bg-ok-soft'
                                  : 'border-line-strong',
                            )}
                          >
                            <input
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              aria-label={`Betrag ${seite === 'soll' ? 'Soll' : 'Haben'} ${zi + 1}`}
                              placeholder="Betrag"
                              value={z.betrag}
                              disabled={disabled}
                              onChange={(e) => update(si, seite, zi, { betrag: e.target.value })}
                              className="num h-11 w-full min-w-0 bg-transparent px-3 text-right outline-none disabled:text-ink"
                            />
                            <span className="pr-3 text-sm text-muted">€</span>
                          </div>
                        </div>
                        {st ? (
                          <div className="pt-2.5">
                            <StatusIcon status={st === 'richtig' ? 'richtig' : 'falsch'} />
                          </div>
                        ) : !disabled && s[seite].length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeZeile(si, seite, zi)}
                            className="flex h-11 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2"
                            aria-label="Zeile entfernen"
                          >
                            <Icon name="minus" className="h-5 w-5" />
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                  {!disabled ? (
                    <button
                      type="button"
                      onClick={() => addZeile(si, seite)}
                      className="flex min-h-10 items-center gap-1 self-start rounded-lg px-2 text-sm text-accent hover:bg-accent-soft"
                    >
                      <Icon name="plus" className="h-4 w-4" /> Zeile{' '}
                      {seite === 'soll' ? 'Soll' : 'Haben'}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <div
              className={cx(
                'num mt-2 flex flex-wrap justify-between gap-x-4 border-t border-line pt-2 text-sm',
                ausgeglichen ? 'text-muted' : 'text-warn',
              )}
            >
              <span>Soll {formatEuro(sumS)}</span>
              <span>Haben {formatEuro(sumH)}</span>
              <span aria-live="polite">
                {ausgeglichen
                  ? 'ausgeglichen'
                  : sumS.isZero() && sumH.isZero()
                    ? ''
                    : 'nicht ausgeglichen'}
              </span>
            </div>
          </div>
        );
      })}
      {!disabled ? (
        <button
          type="button"
          onClick={() => onChange([...saetze, ...leereSaetze(1)])}
          className="flex min-h-10 items-center gap-1 self-start rounded-lg px-2 text-sm text-muted hover:bg-surface-2"
        >
          <Icon name="plus" className="h-4 w-4" /> weiterer Buchungssatz
        </button>
      ) : null}
      {revealed ? (
        <div className="rounded-lg border border-ok/40 bg-ok-soft p-3 text-sm">
          <div className="mb-1 font-semibold text-ok">Lösung</div>
          <ol className="flex flex-col gap-1">
            {part.loesung.saetze.map((s, i) => (
              <li key={i} className="num">
                {part.loesung.saetze.length > 1 ? `${i + 1}. ` : ''}
                {formatSatz(s)}
              </li>
            ))}
          </ol>
          {part.alternativen?.length ? (
            <p className="mt-2 text-muted">
              Ebenfalls richtig: {part.alternativen.map((a) => a.methode).join(', ')}.
            </p>
          ) : null}
        </div>
      ) : null}
      {picker ? (
        <KontoPicker
          seite={picker.seite}
          onClose={() => setPicker(null)}
          onSelect={(k) => {
            update(picker.satz, picker.seite, picker.zeile, { konto: k.name });
            setPicker(null);
          }}
        />
      ) : null}
    </div>
  );
}
