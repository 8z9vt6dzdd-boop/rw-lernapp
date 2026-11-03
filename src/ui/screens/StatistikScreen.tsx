// Statistik: Lernzeit, gelöste Aufgaben, häufigste Denkfehler.
import { useMemo } from 'react';
import { fehlertyp } from '../../engine/fehlertypen';
import { skillTitel } from '../../learning/prepare';
import { Card } from '../components/ui';
import { useEvents } from '../hooks';

export function StatistikScreen() {
  const events = useEvents();
  const s = useMemo(() => {
    if (!events) return null;
    const attempts = events.filter((e) => e.typ === 'attempt');
    const fehler = new Map<string, number>();
    for (const e of attempts) for (const f of e.errorTypes) fehler.set(f, (fehler.get(f) ?? 0) + 1);
    const jeSkill = new Map<string, { n: number; ok: number }>();
    for (const e of attempts) {
      const x = jeSkill.get(e.skillId) ?? { n: 0, ok: 0 };
      x.n++;
      if (e.correct) x.ok++;
      jeSkill.set(e.skillId, x);
    }
    return {
      anzahl: attempts.length,
      richtig: attempts.filter((e) => e.correct).length,
      minuten: Math.round(attempts.reduce((a, e) => a + e.durationMs, 0) / 60_000),
      fehler: [...fehler.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
      jeSkill: [...jeSkill.entries()].sort((a, b) => b[1].n - a[1].n),
    };
  }, [events]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Statistik</h1>
      {!s || s.anzahl === 0 ? (
        <Card>
          <p className="text-muted">
            Noch keine Aufgaben bearbeitet. Starte eine Kurz-Sitzung – danach siehst du hier deinen
            Verlauf.
          </p>
        </Card>
      ) : (
        <>
          <Card>
            <dl className="num grid grid-cols-3 gap-3 text-center">
              <div>
                <dt className="text-xs text-muted">Aufgaben</dt>
                <dd className="text-xl font-semibold">{s.anzahl}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">gleich gelöst</dt>
                <dd className="text-xl font-semibold">
                  {Math.round((s.richtig / s.anzahl) * 100)} %
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Lernzeit</dt>
                <dd className="text-xl font-semibold">{s.minuten} min</dd>
              </div>
            </dl>
          </Card>
          <Card>
            <h2 className="font-semibold">Häufigste Denkfehler</h2>
            {s.fehler.length === 0 ? (
              <p className="mt-1 text-[15px] text-muted">
                Bisher kein typischer Denkfehler erkannt.
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {s.fehler.map(([id, n]) => (
                  <li key={id}>
                    <div className="flex justify-between gap-3 font-medium">
                      <span>{fehlertyp(id).titel}</span>
                      <span className="num text-muted">{n}×</span>
                    </div>
                    <div className="text-sm text-muted">{fehlertyp(id).erklaerung}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h2 className="font-semibold">Nach Aufgabentyp</h2>
            <ul className="mt-2 flex flex-col">
              {s.jeSkill.map(([id, x]) => (
                <li
                  key={id}
                  className="num flex justify-between gap-3 border-t border-line py-2 text-[15px] first:border-0"
                >
                  <span>{skillTitel(id)}</span>
                  <span className="text-muted">
                    {x.ok} von {x.n} gelöst
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
