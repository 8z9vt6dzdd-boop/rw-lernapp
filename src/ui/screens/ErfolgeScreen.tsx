// Erfolgs-Sammlung mit kleinen Illustrationen (10-optik B6).
import { useMemo, type ReactNode } from 'react';
import { erfolge, tagKey, type Erfolg } from '../../learning/motivation';
import { Card, cx } from '../components/ui';
import { useEvents, useSettings } from '../hooks';

export function ErfolgSymbol({ symbol, an }: { symbol: Erfolg['symbol']; an: boolean }) {
  const stroke = an ? 'var(--peep-ink)' : 'var(--border-strong)';
  const fill = an
    ? {
        stern: '#e2b13c',
        waage: '#1c6670',
        flamme: '#e8792b',
        lupe: '#4a9fd8',
        dose: '#8cbf3f',
        rechner: '#1c6670',
        buch: '#b8475a',
        mond: '#2f4b7c',
        sonne: '#e2b13c',
        wolke: '#4a9fd8',
        pokal: '#e2b13c',
        treppe: '#7fa88e',
      }[symbol]
    : 'transparent';
  const p = {
    stroke,
    strokeWidth: 2.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const formen: Record<Erfolg['symbol'], ReactNode> = {
    stern: (
      <path
        d="M24 6l5.5 11.5 12.5 1.7-9.1 8.6 2.3 12.4L24 34.3 12.8 40.2l2.3-12.4L6 19.2l12.5-1.7Z"
        fill={fill}
        {...p}
      />
    ),
    waage: (
      <>
        <path d="M24 8v30M10 14h28M16 38h16" fill="none" {...p} />
        <path d="M10 14 5 26h10ZM38 14l-5 12h10Z" fill={fill} {...p} />
      </>
    ),
    flamme: (
      <path
        d="M24 6c6 8 12 12 12 22a12 12 0 0 1-24 0c0-6 4-9 5-14 2 4 4 5 5 5 0-5 0-9 2-13Z"
        fill={fill}
        {...p}
      />
    ),
    lupe: (
      <>
        <circle cx="20" cy="20" r="11" fill={fill} {...p} />
        <path d="m28 28 12 12" fill="none" {...p} />
      </>
    ),
    dose: (
      <>
        <rect x="14" y="8" width="20" height="32" rx="4" fill={fill} {...p} />
        <path d="M18 8q6-4 12 0" fill="none" {...p} />
      </>
    ),
    rechner: (
      <>
        <rect x="12" y="6" width="24" height="36" rx="3" fill={fill} {...p} />
        <path
          d="M17 12h14v6H17ZM18 25h2M24 25h2M30 25h1M18 31h2M24 31h2M30 31h1M18 37h2M24 37h2"
          fill="none"
          {...p}
        />
      </>
    ),
    buch: (
      <path
        d="M8 10c5-3 11-3 16 1 5-4 11-4 16-1v28c-5-3-11-3-16 1-5-4-11-4-16-1ZM24 11v28"
        fill={fill}
        {...p}
      />
    ),
    mond: <path d="M30 6a16 16 0 1 0 10 26A13 13 0 0 1 30 6Z" fill={fill} {...p} />,
    sonne: (
      <>
        <circle cx="24" cy="24" r="8" fill={fill} {...p} />
        <path
          d="M24 6v5M24 37v5M6 24h5M37 24h5M11 11l3.5 3.5M33.5 33.5 37 37M11 37l3.5-3.5M33.5 14.5 37 11"
          fill="none"
          {...p}
        />
      </>
    ),
    wolke: (
      <>
        <path d="M14 34a8 8 0 0 1 0-16 11 11 0 0 1 21 3 7 7 0 0 1-1 13Z" fill={fill} {...p} />
        <path d="M10 40 38 12" fill="none" {...p} />
      </>
    ),
    pokal: (
      <>
        <path d="M15 8h18v8a9 9 0 0 1-18 0Z" fill={fill} {...p} />
        <path
          d="M15 11H9a5 5 0 0 0 6 7M33 11h6a5 5 0 0 1-6 7M24 25v8M17 40h14M19 33h10v7H19Z"
          fill="none"
          {...p}
        />
      </>
    ),
    treppe: (
      <path
        d="M6 40h10v-8h10v-8h10v-8h6"
        fill="none"
        {...p}
        stroke={an ? '#7fa88e' : stroke}
        strokeWidth={4}
      />
    ),
  };
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden="true">
      {formen[symbol]}
    </svg>
  );
}

export function ErfolgeScreen() {
  const events = useEvents();
  const settings = useSettings();
  const liste = useMemo(
    () => (events ? erfolge(events, settings.tagesziel, tagKey(new Date())) : []),
    [events, settings.tagesziel],
  );
  const n = liste.filter((e) => e.erreicht).length;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Erfolge</h1>
        <p className="num mt-1 text-muted">
          {n} von {liste.length} gesammelt
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {liste.map((e) => (
          <Card
            key={e.id}
            className={cx('flex flex-col items-center text-center', !e.erreicht && 'opacity-60')}
          >
            <div
              className={cx(
                'rounded-full p-2',
                e.erreicht ? 'bg-[color:var(--peep-paper)]' : 'bg-surface-2',
              )}
            >
              <ErfolgSymbol symbol={e.symbol} an={e.erreicht} />
            </div>
            <div className="mt-2 text-sm font-semibold">{e.titel}</div>
            <div className="mt-0.5 text-xs text-muted">{e.text}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
