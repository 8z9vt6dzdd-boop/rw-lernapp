// T-Konto: Soll links, Haben rechts. Neue Einträge wandern sichtbar hinein, der Saldo bildet sich.
import { Decimal, formatEuro } from '../../engine/money';
import { cx } from '../components/ui';
import { STRICH, handLinie } from './hand';

export interface Eintrag {
  text: string;
  betrag: string;
  neu?: boolean;
}

export function TKonto({
  name,
  soll,
  haben,
  saldo = false,
  untertitel,
  kompakt = false,
}: {
  name: string;
  soll: readonly Eintrag[];
  haben: readonly Eintrag[];
  /** Saldo auf der kleineren Seite einsetzen und Summen ziehen */
  saldo?: boolean;
  untertitel?: string;
  kompakt?: boolean;
}) {
  const s = soll.reduce((a, e) => a.plus(e.betrag), new Decimal(0));
  const h = haben.reduce((a, e) => a.plus(e.betrag), new Decimal(0));
  const differenz = s.minus(h);
  const saldoSeite: 'soll' | 'haben' | null =
    !saldo || differenz.isZero() ? null : differenz.isPositive() ? 'haben' : 'soll';
  const summe = Decimal.max(s, h);
  const spalte = (seite: 'soll' | 'haben', eintraege: readonly Eintrag[]) => (
    <div
      className={cx(
        'flex min-w-0 flex-col gap-1 px-2 py-1.5',
        seite === 'haben' && 'items-stretch',
      )}
    >
      {eintraege.map((e, i) => (
        <div
          key={`${e.text}-${i}`}
          className={cx(
            'flex items-baseline justify-between gap-2 rounded px-1 text-[13px] sm:text-sm',
            e.neu && 'einblenden bg-[#fbefc9]',
          )}
        >
          <span className="min-w-0 truncate">{e.text}</span>
          <span className="num shrink-0">{formatEuro(e.betrag)}</span>
        </div>
      ))}
      {saldoSeite === seite ? (
        <div className="einblenden flex items-baseline justify-between gap-2 rounded px-1 text-[13px] font-semibold text-[#1c6670] sm:text-sm">
          <span>Saldo</span>
          <span className="num">{formatEuro(differenz.abs())}</span>
        </div>
      ) : null}
    </div>
  );
  return (
    <figure
      className={cx(
        'w-full rounded-lg bg-[color:var(--peep-paper)] p-2 text-[color:var(--peep-ink)]',
        kompakt ? 'max-w-xs' : 'max-w-md',
      )}
      aria-label={`T-Konto ${name}`}
    >
      <div className="text-center">
        <div className="hand text-[15px] font-bold">{name}</div>
        {untertitel ? <div className="text-[11px] opacity-70">{untertitel}</div> : null}
      </div>
      <div className="relative">
        <div className="flex justify-between px-1 text-[11px] font-semibold tracking-wide uppercase opacity-70">
          <span>Soll</span>
          <span>Haben</span>
        </div>
        <svg
          className="pointer-events-none absolute inset-x-0 top-4 h-[calc(100%-1rem)] w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <path
            d={handLinie(0, 1, 100, 1, 11, 0.6)}
            {...STRICH}
            strokeWidth={1.4}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={handLinie(50, 1, 50, 99, 12, 0.6)}
            {...STRICH}
            strokeWidth={1.4}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="grid min-h-16 grid-cols-2 pt-1">
          {spalte('soll', soll)}
          {spalte('haben', haben)}
        </div>
        {saldo && (soll.length > 0 || haben.length > 0) ? (
          <div className="num grid grid-cols-2 border-t-2 border-double border-[color:var(--peep-ink)] text-[13px] font-semibold sm:text-sm">
            <span className="px-3 py-1 text-right">{formatEuro(summe)}</span>
            <span className="px-3 py-1 text-right">{formatEuro(summe)}</span>
          </div>
        ) : null}
      </div>
    </figure>
  );
}
