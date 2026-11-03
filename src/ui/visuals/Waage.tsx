// Bilanz-Waage: Aktiva links, Passiva rechts. Kippt, wenn die Seiten ungleich sind, und pendelt sich ein.
import { Decimal, formatEuro } from '../../engine/money';
import { cx } from '../components/ui';
import { STRICH, handLinie } from './hand';

import type { Posten } from '../../content/visual-types';

export type { Posten };

function gewicht(posten: readonly Posten[]): InstanceType<typeof Decimal> {
  return posten.reduce((a, p) => a.plus(p.betrag ?? 1), new Decimal(0));
}

export function Waage({
  links,
  rechts,
  titelLinks = 'Aktiva',
  untertitelLinks = 'Was wir haben',
  titelRechts = 'Passiva',
  untertitelRechts = 'Woher das Geld kommt',
  summen = true,
  onPosten,
}: {
  links: readonly Posten[];
  rechts: readonly Posten[];
  titelLinks?: string;
  untertitelLinks?: string;
  titelRechts?: string;
  untertitelRechts?: string;
  summen?: boolean;
  onPosten?: (seite: 'links' | 'rechts', index: number) => void;
}) {
  const l = gewicht(links);
  const r = gewicht(rechts);
  const max = Decimal.max(l, r, 1);
  const winkel = Math.max(-12, Math.min(12, r.minus(l).div(max).times(12).toNumber()));
  const rad = (winkel * Math.PI) / 180;
  const arm = 105;
  const lx = 170 - arm * Math.cos(rad);
  const ly = 58 - arm * Math.sin(rad);
  const rx = 170 + arm * Math.cos(rad);
  const ry = 58 + arm * Math.sin(rad);
  const ausgeglichen = l.equals(r);
  const schale = (
    seite: 'links' | 'rechts',
    x: number,
    y: number,
    posten: readonly Posten[],
    titel: string,
    untertitel: string,
    summe: InstanceType<typeof Decimal>,
  ) => (
    <div
      className="absolute flex w-[37%] -translate-x-1/2 flex-col items-center transition-all duration-700 ease-out"
      style={{ left: `${(x / 340) * 100}%`, top: `${((y + 26) / 320) * 100}%` }}
    >
      <div className="hand text-[13px] font-bold">{titel}</div>
      <div className="text-[11px] text-muted">{untertitel}</div>
      <div className="mt-1 flex min-h-10 w-full flex-col gap-1 rounded-b-[40%_20%] border-2 border-[color:var(--peep-ink)] border-t-0 bg-[color:var(--peep-paper)] px-1.5 pt-1.5 pb-3 text-[color:var(--peep-ink)]">
        {posten.map((p, i) => (
          <button
            key={`${p.text}-${i}`}
            type="button"
            disabled={!onPosten}
            onClick={() => onPosten?.(seite, i)}
            className={cx(
              'einblenden flex flex-wrap items-baseline justify-between gap-x-1 rounded-md px-1.5 py-0.5 text-left text-[11.5px] leading-tight sm:text-xs',
              seite === 'links' ? 'bg-[#dcecec]' : 'bg-[#fbe6cf]',
              p.neu && 'ring-2 ring-[color:var(--senf)]',
            )}
          >
            <span className="min-w-0 break-words">{p.text}</span>
            {p.betrag ? (
              <span className="num ml-auto shrink-0 font-medium">{formatEuro(p.betrag, 0)}</span>
            ) : null}
          </button>
        ))}
      </div>
      {summen && posten.some((p) => p.betrag) ? (
        <div className="num mt-1 text-xs font-semibold">Σ {formatEuro(summe, 0)}</div>
      ) : null}
    </div>
  );
  return (
    <figure
      className="w-full"
      aria-label={`Bilanz-Waage: links ${formatEuro(l, 0)}, rechts ${formatEuro(r, 0)}${ausgeglichen ? ', im Gleichgewicht' : ', nicht im Gleichgewicht'}`}
    >
      <div className="relative mx-auto aspect-[340/320] w-full max-w-md">
        <svg viewBox="0 0 340 320" className="absolute inset-0 h-full w-full">
          <path
            d={
              handLinie(170, 62, 150, 228, 3) +
              ' ' +
              handLinie(170, 62, 190, 228, 4) +
              ' ' +
              handLinie(130, 229, 210, 229, 5)
            }
            {...STRICH}
          />
          <g
            className="transition-transform duration-700 ease-out"
            style={{ transform: `rotate(${winkel}deg)`, transformOrigin: '170px 58px' }}
          >
            <path d={handLinie(170 - arm, 58, 170 + arm, 58, 7)} {...STRICH} strokeWidth={3.2} />
          </g>
          <path
            d={handLinie(lx, ly, lx, ly + 24, 8) + ' ' + handLinie(rx, ry, rx, ry + 24, 9)}
            {...STRICH}
            strokeWidth={1.6}
          />
          <circle
            cx="170"
            cy="58"
            r="6"
            fill={ausgeglichen ? 'var(--lime)' : 'var(--orange)'}
            stroke="var(--peep-ink)"
            strokeWidth="2"
          />
        </svg>
        {schale('links', lx, ly, links, titelLinks, untertitelLinks, l)}
        {schale('rechts', rx, ry, rechts, titelRechts, untertitelRechts, r)}
      </div>
      <figcaption
        className={cx(
          'mt-2 text-center text-sm font-medium',
          ausgeglichen ? 'text-ok' : 'text-warn',
        )}
      >
        {links.length + rechts.length === 0
          ? 'Noch leer'
          : ausgeglichen
            ? 'Im Gleichgewicht'
            : 'Nicht im Gleichgewicht'}
      </figcaption>
    </figure>
  );
}
