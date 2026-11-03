// Kurzes Konfetti für Belohnungsmomente (unter 2 Sekunden, bei „Bewegung reduzieren“ ausgeblendet).
import { useMemo, type CSSProperties } from 'react';
import { createRng } from '../../engine/rng';

const FARBEN = ['#1c6670', '#8cbf3f', '#e8792b', '#e2b13c', '#4a9fd8', '#b8475a'];

export function Konfetti({ anzahl = 46, seed = 7 }: { anzahl?: number; seed?: number }) {
  const teile = useMemo(() => {
    const r = createRng(seed);
    return Array.from({ length: anzahl }, () => ({
      left: 35 + r.next() * 30,
      dx: (r.next() - 0.5) * 360,
      dy: 120 + r.next() * 260,
      rot: (r.next() - 0.5) * 900,
      delay: r.next() * 250,
      farbe: r.pick(FARBEN),
    }));
  }, [anzahl, seed]);
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-0 overflow-visible"
      aria-hidden="true"
    >
      {teile.map((t, i) => (
        <span
          key={i}
          className="konfetti-teil"
          style={
            {
              left: `${t.left}%`,
              top: 0,
              background: t.farbe,
              animationDelay: `${t.delay}ms`,
              '--dx': `${t.dx}px`,
              '--dy': `${t.dy}px`,
              '--rot': `${t.rot}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
