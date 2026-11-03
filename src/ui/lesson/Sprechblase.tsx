// Figur mit Sprechblase (max. 2 Sätze), abwechselnd links und rechts.
import type { Sprecher } from '../../content/lessons/types';
import { Character, useFigur } from '../figures/Character';
import { cx } from '../components/ui';

export function Sprechblase({
  s,
  rechts = false,
  verzoegerung = 0,
}: {
  s: Sprecher;
  rechts?: boolean;
  verzoegerung?: number;
}) {
  const figur = useFigur(s.figur);
  return (
    <div
      className={cx('sprechblase flex items-end gap-2', rechts && 'flex-row-reverse')}
      style={{ animationDelay: `${verzoegerung}ms` }}
    >
      <Character
        id={s.figur}
        ausdruck={s.ausdruck}
        groesse={64}
        bewegung="nicken"
        gespiegelt={rechts}
      />
      <div
        className={cx(
          'relative mb-3 max-w-[78%] rounded-2xl border-2 border-[color:var(--peep-ink)] bg-[color:var(--peep-paper)] px-3 py-2 text-[15px] text-[color:var(--peep-ink)]',
          rechts ? 'rounded-br-sm' : 'rounded-bl-sm',
        )}
      >
        <div className="hand text-xs font-bold" style={{ color: figur.farbe }}>
          {figur.kurz}
          <span className="font-normal text-[color:var(--peep-ink)]/60"> · {figur.rolle}</span>
        </div>
        <p>{s.text}</p>
      </div>
    </div>
  );
}

export function Sprechblasen({ sprecher }: { sprecher: readonly Sprecher[] }) {
  const ersteFigur = sprecher[0]?.figur;
  return (
    <div className="flex flex-col gap-3">
      {sprecher.map((s, i) => (
        <Sprechblase key={i} s={s} rechts={s.figur !== ersteFigur} verzoegerung={i * 450} />
      ))}
    </div>
  );
}
