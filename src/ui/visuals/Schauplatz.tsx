// Gezeichnete Schauplätze der MBG als Hintergrund für Dialoge und Abschlussszenen (10-optik A4).
import type { ReactNode } from 'react';
import { STRICH, handLinie, handRechteck } from './hand';

export type SchauplatzId = 'buero' | 'lager' | 'abfuellung' | 'besprechung' | 'gesellschafter';

export const SCHAUPLATZ_NAME: Record<SchauplatzId, string> = {
  buero: 'Büro Rechnungswesen',
  lager: 'Logistikzentrum',
  abfuellung: 'Abfüllanlage',
  besprechung: 'Besprechungsraum',
  gesellschafter: 'Büro der Gesellschafter',
};

const W = 360;
const H = 150;

function Fenster({
  x,
  y,
  w,
  h,
  seed,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  seed: number;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#cfe6ea" opacity={0.7} />
      <path
        d={
          handRechteck(x, y, w, h, seed) +
          ' ' +
          handLinie(x + w / 2, y, x + w / 2, y + h, seed + 9) +
          ' ' +
          handLinie(x, y + h / 2, x + w, y + h / 2, seed + 8)
        }
        {...STRICH}
        strokeWidth={1.8}
      />
    </g>
  );
}

function Hintergrund({ ort }: { ort: SchauplatzId }) {
  switch (ort) {
    case 'buero':
      return (
        <g>
          <Fenster x={24} y={18} w={70} h={56} seed={1} />
          <path
            d={handLinie(220, 40, 330, 40, 2) + ' ' + handLinie(220, 70, 330, 70, 3)}
            {...STRICH}
            strokeWidth={1.8}
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={226 + i * 16}
              y={44}
              width={12}
              height={25}
              rx={1}
              fill={['#1c6670', '#e2b13c', '#e8792b', '#8cbf3f', '#1c6670'][i]}
              opacity={0.75}
            />
          ))}
          <path d={handLinie(0, 118, W, 116, 4)} {...STRICH} strokeWidth={1.4} opacity={0.5} />
          <path
            d="M150 112 q8 -30 2 -44 M150 112 q-12 -22 -22 -26 M150 112 q14 -16 24 -18"
            stroke="#2d7a3a"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
          <path d={handRechteck(140, 108, 20, 16, 5)} {...STRICH} strokeWidth={1.6} />
        </g>
      );
    case 'lager':
      return (
        <g>
          {[0, 1, 2].map((r) => (
            <g key={r}>
              <path
                d={handLinie(20, 38 + r * 34, 340, 38 + r * 34, 10 + r)}
                {...STRICH}
                strokeWidth={1.8}
              />
              {Array.from({ length: 9 }, (_, k) =>
                (k + r) % 4 === 3 ? null : (
                  <rect
                    key={k}
                    x={28 + k * 34}
                    y={14 + r * 34}
                    width={26}
                    height={22}
                    rx={2}
                    fill={['#e2b13c', '#e8792b', '#8cbf3f'][(k + r) % 3]}
                    opacity={0.6}
                  />
                ),
              )}
            </g>
          ))}
          <path
            d={handLinie(20, 8, 20, 120, 20) + ' ' + handLinie(340, 8, 340, 120, 21)}
            {...STRICH}
            strokeWidth={1.8}
          />
          <path d={handLinie(0, 124, W, 122, 22)} {...STRICH} strokeWidth={1.4} opacity={0.5} />
        </g>
      );
    case 'abfuellung':
      return (
        <g>
          <path d={handRechteck(260, 16, 54, 90, 30)} {...STRICH} />
          <rect x={262} y={56} width={50} height={48} fill="#8cbf3f" opacity={0.55} />
          <path
            d={handLinie(10, 96, 250, 96, 31) + ' ' + handLinie(10, 104, 250, 104, 32)}
            {...STRICH}
            strokeWidth={1.8}
          />
          {Array.from({ length: 9 }, (_, i) => (
            <g key={i}>
              <rect
                x={20 + i * 26}
                y={70}
                width={14}
                height={25}
                rx={3}
                fill={['#1c6670', '#e8792b', '#e2b13c'][i % 3]}
                opacity={0.75}
              />
              <path
                d={handRechteck(20 + i * 26, 70, 14, 25, 40 + i)}
                {...STRICH}
                strokeWidth={1.2}
              />
            </g>
          ))}
          <path d={handLinie(287, 106, 287, 124, 33)} {...STRICH} />
        </g>
      );
    case 'besprechung':
      return (
        <g>
          <path d={handRechteck(30, 14, 130, 70, 50)} {...STRICH} />
          <path
            d="M44 70 L70 52 L96 60 L130 30"
            stroke="#e8792b"
            strokeWidth={2.6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Fenster x={250} y={18} w={80} h={56} seed={51} />
          <path d={handLinie(40, 118, 320, 118, 52)} {...STRICH} strokeWidth={3} />
          <path
            d={handLinie(60, 120, 60, 140, 53) + ' ' + handLinie(300, 120, 300, 140, 54)}
            {...STRICH}
          />
        </g>
      );
    case 'gesellschafter':
      return (
        <g>
          <Fenster x={240} y={14} w={96} h={70} seed={60} />
          <path d={handRechteck(40, 20, 54, 40, 61)} {...STRICH} />
          <path d="M48 52 L62 36 L72 46 L80 38 L88 52 Z" fill="#7fa88e" opacity={0.7} />
          <path d={handLinie(20, 116, 200, 116, 62)} {...STRICH} strokeWidth={3} />
          <path d={handRechteck(150, 98, 14, 16, 63)} {...STRICH} strokeWidth={1.6} />
          <path
            d="M152 94 q2 -6 0 -10 M158 94 q2 -6 0 -10"
            stroke="currentColor"
            strokeWidth={1.4}
            fill="none"
            opacity={0.5}
          />
        </g>
      );
  }
}

/** Schauplatz-Banner mit Figuren im Vordergrund. */
export function Schauplatz({
  ort,
  children,
  hoehe = 'h-36 sm:h-44',
}: {
  ort: SchauplatzId;
  children?: ReactNode;
  hoehe?: string;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl bg-[color:var(--peep-paper)] text-[color:var(--peep-ink)] ${hoehe}`}
      aria-label={SCHAUPLATZ_NAME[ort]}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <rect width={W} height={H} fill="#f3ead9" />
        <Hintergrund ort={ort} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-2 px-3">
        {children}
      </div>
      <div className="absolute top-2 left-3 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-[#1d1a17]">
        {SCHAUPLATZ_NAME[ort]}
      </div>
    </div>
  );
}
