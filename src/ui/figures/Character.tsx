// <Character id="jana" ausdruck="erklaert" /> – austauschbare Figuren-Komponente (10-optik A5).
import { lazy, Suspense } from 'react';
import {
  FIGUREN,
  ichFigur,
  type Ausdruck,
  type Figur,
  type FigurId,
} from '../../content/characters';
import { useSettings } from '../hooks';
import { cx } from '../components/ui';

const PeepSvg = lazy(() => import('./PeepSvg'));

export type Bewegung = 'auftritt' | 'nicken' | 'jubeln' | 'keine';

export function useFigur(id: FigurId): Figur {
  const settings = useSettings();
  return id === 'ich' ? ichFigur(settings.ich) : FIGUREN[id];
}

export function Character({
  id,
  ausdruck = 'neutral',
  groesse = 96,
  bewegung = 'auftritt',
  gespiegelt = false,
  className,
  hintergrund = true,
}: {
  id: FigurId;
  ausdruck?: Ausdruck;
  groesse?: number;
  bewegung?: Bewegung;
  gespiegelt?: boolean;
  className?: string;
  hintergrund?: boolean;
}) {
  const figur = useFigur(id);
  return (
    <div
      role="img"
      aria-label={`${figur.name} (${figur.rolle})`}
      className={cx('peep relative shrink-0', className)}
      style={{ width: groesse, height: groesse * 1.15 }}
    >
      {hintergrund ? (
        <div
          className="absolute inset-x-[6%] bottom-0 top-[18%] rounded-[46%_54%_40%_60%/55%_45%_55%_45%]"
          style={{ background: `color-mix(in srgb, ${figur.farbe} 22%, var(--peep-paper))` }}
          aria-hidden="true"
        />
      ) : null}
      <div
        key={`${ausdruck}-${bewegung}`}
        className={cx(
          'peep-figur absolute inset-0',
          bewegung === 'auftritt' && 'peep-auftritt',
          bewegung === 'nicken' && 'peep-nicken',
          bewegung === 'jubeln' && 'peep-jubeln',
        )}
      >
        <div className="h-full w-full" style={gespiegelt ? { transform: 'scaleX(-1)' } : undefined}>
          <Suspense fallback={null}>
            <PeepSvg figur={figur} ausdruck={ausdruck} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
