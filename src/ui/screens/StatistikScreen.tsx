// Statistik: Lernzeit je Woche, Klausur-Stand je Abschnitt, Klausuren, häufigste Denkfehler.
import { useEffect, useMemo, useState } from 'react';
import { ABSCHNITTE } from '../../content/curriculum';
import { fehlertyp } from '../../engine/fehlertypen';
import { knotenFuer, readiness } from '../../learning/fortschritt';
import { lernzeitJeWoche, tagKey } from '../../learning/motivation';
import { skillTitel } from '../../learning/prepare';
import { getKv } from '../../storage/db';
import { Card } from '../components/ui';
import { useEvents } from '../hooks';
import { formatPunkte } from './FallScreen';
import { PROTOKOLL, type KlausurProtokoll } from './KlausurScreen';

function datum(tag: string): string {
  const [, m, d] = tag.split('-');
  return `${Number(d)}.${Number(m)}.`;
}

export function StatistikScreen() {
  const events = useEvents();
  const [klausuren, setKlausuren] = useState<KlausurProtokoll[]>([]);
  useEffect(() => {
    let alive = true;
    void getKv<KlausurProtokoll[]>(PROTOKOLL).then((p) => alive && setKlausuren(p ?? []));
    return () => {
      alive = false;
    };
  }, []);
  const s = useMemo(() => {
    if (!events) return null;
    const heute = tagKey(new Date());
    const wochen = lernzeitJeWoche(events, heute);
    const abschnitte = ABSCHNITTE.filter((a) =>
      knotenFuer(events, a).some((k) => k.status !== 'bald'),
    ).map((a) => ({ a, wert: Math.round(readiness(events, a) * 100) }));
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
      wochen,
      abschnitte,
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
            <h2 className="font-semibold">Lernzeit je Woche</h2>
            <div
              className="mt-3 flex h-32 items-end gap-2"
              role="img"
              aria-label={`Lernzeit der letzten 8 Wochen: ${s.wochen.map((w) => `${w.minuten} Minuten`).join(', ')}`}
            >
              {s.wochen.map((w) => {
                const max = Math.max(30, ...s.wochen.map((x) => x.minuten));
                return (
                  <div
                    key={w.woche}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                  >
                    <span className="num text-xs text-muted">{w.minuten > 0 ? w.minuten : ''}</span>
                    <div
                      className="w-full max-w-10 rounded-t bg-accent"
                      style={{
                        height: `${(w.minuten / max) * 100}%`,
                        minHeight: w.minuten > 0 ? 2 : 0,
                      }}
                    />
                    <span className="num text-[11px] text-muted">{datum(w.woche)}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted">Minuten je Woche, jeweils ab Montag.</p>
          </Card>
          <Card>
            <h2 className="font-semibold">Klausur-Stand je Abschnitt</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {s.abschnitte.map(({ a, wert }) => (
                <li key={a.id}>
                  <div className="flex justify-between gap-3 text-[15px]">
                    <span>
                      {a.id === '0' ? '0' : a.id}: {a.titel}
                    </span>
                    <span className="num">{wert} %</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-3">
                    <div className="h-full rounded-full bg-lime" style={{ width: `${wert}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          {klausuren.length > 0 ? (
            <Card>
              <h2 className="font-semibold">Klausuren</h2>
              <ul className="mt-2 flex flex-col">
                {[...klausuren]
                  .reverse()
                  .slice(0, 10)
                  .map((k) => (
                    <li
                      key={k.id}
                      className="num flex justify-between gap-3 border-t border-line py-2 text-[15px] first:border-0"
                    >
                      <span className="min-w-0">
                        {k.titel}
                        <span className="block text-sm text-muted">
                          {new Date(k.ts).toLocaleDateString('de-DE')}
                        </span>
                      </span>
                      <span className="whitespace-nowrap">
                        {formatPunkte(k.punkte)} / {k.max}
                      </span>
                    </li>
                  ))}
              </ul>
            </Card>
          ) : null}
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
