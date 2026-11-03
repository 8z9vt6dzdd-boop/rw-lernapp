// Lager-Ansicht der MBG: Paletten im Regal und Tanks, die sich füllen oder leeren.
import { STRICH, handLinie, handRechteck } from './hand';

import type { LagerPosten, Tank } from '../../content/visual-types';

export type { LagerPosten, Tank };

export function Lager({
  regal = [],
  tanks = [],
  titel,
}: {
  regal?: readonly LagerPosten[];
  tanks?: readonly Tank[];
  titel?: string;
}) {
  const breite = 340;
  const regalHoehe = 46;
  const hoehe = Math.max(regal.length * regalHoehe + 30, tanks.length ? 170 : 0);
  const tankX = regal.length ? 230 : 40;
  return (
    <figure
      className="w-full rounded-lg bg-[color:var(--peep-paper)] p-2 text-[color:var(--peep-ink)]"
      aria-label={titel ?? 'Lager der MBG'}
    >
      {titel ? (
        <figcaption className="hand mb-1 text-center text-sm font-bold">{titel}</figcaption>
      ) : null}
      <svg
        viewBox={`0 0 ${breite} ${hoehe}`}
        className="w-full"
        role="img"
        aria-label={[
          ...regal.map((r) => `${r.name}: ${r.paletten} Paletten`),
          ...tanks.map((t) => `${t.name}: ${Math.round(t.fuellung * 100)} % gefüllt`),
        ].join(', ')}
      >
        {regal.map((r, i) => {
          const y = 10 + i * regalHoehe;
          return (
            <g key={r.name}>
              <path d={handLinie(8, y + 34, 210, y + 34, 20 + i)} {...STRICH} strokeWidth={2.2} />
              {Array.from({ length: Math.min(8, r.paletten) }, (_, k) => (
                <g key={k} className="einblenden" style={{ animationDelay: `${k * 60}ms` }}>
                  <rect
                    x={12 + k * 24}
                    y={y + 12}
                    width={20}
                    height={20}
                    rx={2}
                    fill={r.farbe ?? '#e2b13c'}
                  />
                  <path
                    d={handRechteck(12 + k * 24, y + 12, 20, 20, 30 + k + i * 10)}
                    {...STRICH}
                    strokeWidth={1.6}
                  />
                </g>
              ))}
              <text x={12} y={y + 8} fontSize="10" fill="currentColor" opacity={0.8}>
                {r.name}
              </text>
            </g>
          );
        })}
        {tanks.map((t, i) => {
          const x = tankX + i * 52;
          const top = 20;
          const h = 130;
          const fill = Math.max(0, Math.min(1, t.fuellung));
          return (
            <g key={t.name}>
              <rect
                x={x}
                y={top + h * (1 - fill)}
                width={40}
                height={h * fill}
                fill={t.farbe ?? '#8cbf3f'}
                opacity={0.85}
                style={{ transition: 'all 0.7s ease-out' }}
              />
              <path d={handRechteck(x, top, 40, h, 50 + i)} {...STRICH} />
              <path
                d={
                  handLinie(x + 4, top + h + 2, x + 4, top + h + 14, 60 + i) +
                  ' ' +
                  handLinie(x + 36, top + h + 2, x + 36, top + h + 14, 61 + i)
                }
                {...STRICH}
              />
              <text x={x + 20} y={top - 6} fontSize="10" textAnchor="middle" fill="currentColor">
                {t.name}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
