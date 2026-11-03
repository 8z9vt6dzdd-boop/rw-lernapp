// Mini-Klausur und Probeklausur: ohne Hilfen, ruhige Zeitanzeige, Punktebewertung und Auswertung nach Skills.
import { useEffect, useMemo, useState } from 'react';
import { ABSCHNITTE } from '../../content/curriculum';
import type { TaskAnswer } from '../../engine/task';
import {
  bewerteKlausur,
  klausurTask,
  miniKlausur,
  probeklausur,
  type KlausurErgebnis,
  type KlausurPlan,
} from '../../learning/klausur';
import { skillTitel } from '../../learning/prepare';
import { erstelleAttempt } from '../../learning/record';
import { addEvent, deleteKv, deviceId, getKv, setKv } from '../../storage/db';
import { DatenTabelle } from '../components/DatenTabelle';
import { PartFeedback, Rechenweg } from '../components/Feedback';
import { PartInput, istLeer, leereAntwort } from '../components/PartInput';
import { Button, Card, Chip, Icon, cx } from '../components/ui';
import { navigate, routeParams, useSettings } from '../hooks';
import { spiele } from '../sound';
import { formatPunkte } from './FallScreen';

interface KlausurStand {
  art: 'mini' | 'probe';
  abschnittId?: string;
  seed: number;
  start: number;
  antworten: Record<string, TaskAnswer>;
}

export interface KlausurProtokoll {
  id: string;
  titel: string;
  art: 'mini' | 'probe';
  ts: string;
  punkte: number;
  max: number;
}

const AKTIV = 'klausur:aktiv';
export const PROTOKOLL = 'klausuren';

function planVon(s: KlausurStand, teilkosten: boolean): KlausurPlan {
  return s.art === 'probe'
    ? probeklausur(s.seed, { teilkosten })
    : miniKlausur(s.abschnittId!, s.seed);
}

function bearbeitet(plan: KlausurPlan, antworten: Record<string, TaskAnswer>): number {
  return plan.aufgaben.filter((a) => {
    const an = antworten[a.key];
    return an && Object.values(an).some((x) => !istLeer(x));
  }).length;
}

export function KlausurScreen() {
  const [art, abschnittParam] = routeParams();
  const settings = useSettings();
  const [stand, setStand] = useState<KlausurStand | null>(null);
  const [geladen, setGeladen] = useState(false);
  const [index, setIndex] = useState(0);
  const [jetzt, setJetzt] = useState(() => Date.now());
  const [bestaetigen, setBestaetigen] = useState(false);
  const [ergebnis, setErgebnis] = useState<KlausurErgebnis | null>(null);
  const [offen, setOffen] = useState<string | null>(null);

  const gueltig =
    art === 'probe' || (art === 'mini' && ABSCHNITTE.some((a) => a.id === abschnittParam));

  useEffect(() => {
    let alive = true;
    void getKv<KlausurStand>(AKTIV).then((s) => {
      if (!alive) return;
      if (s && s.art === art && (art === 'probe' || s.abschnittId === abschnittParam)) setStand(s);
      setGeladen(true);
    });
    return () => {
      alive = false;
    };
  }, [art, abschnittParam]);

  useEffect(() => {
    const t = window.setInterval(() => setJetzt(Date.now()), 15_000);
    return () => window.clearInterval(t);
  }, []);

  const plan = useMemo(
    () => (stand ? planVon(stand, settings.teilkostenInKlausur) : null),
    [stand, settings.teilkostenInKlausur],
  );
  const vorschau = useMemo(() => {
    if (!gueltig) return null;
    return art === 'probe'
      ? probeklausur(1, { teilkosten: settings.teilkostenInKlausur })
      : miniKlausur(abschnittParam!, 1);
  }, [art, abschnittParam, gueltig, settings.teilkostenInKlausur]);
  const task = useMemo(() => (plan ? klausurTask(plan.aufgaben[index]!) : null), [plan, index]);

  if (!gueltig) {
    return (
      <Card>
        <p>Diese Klausur gibt es nicht.</p>
        <Button className="mt-3" onClick={() => navigate('pruefen')}>
          Zur Übersicht
        </Button>
      </Card>
    );
  }
  if (!geladen || !vorschau) return null;

  const starten = () => {
    const s: KlausurStand = {
      art: art as 'mini' | 'probe',
      // ?seed= für reproduzierbare Durchläufe (Tests), sonst zufällig
      seed:
        Number(new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('seed')) ||
        Math.floor(Math.random() * 2 ** 31),
      start: Date.now(),
      antworten: {},
    };
    if (art === 'mini') s.abschnittId = abschnittParam!;
    setStand(s);
    setIndex(0);
    setJetzt(Date.now());
    void setKv(AKTIV, s);
  };

  // ---------- Auswertung ----------
  if (ergebnis && plan) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 pb-10">
        <Card>
          <Chip tone="accent">Auswertung</Chip>
          <h1 className="mt-2 text-xl font-semibold">{plan.titel}</h1>
          <p className="num mt-3 text-3xl font-semibold">
            {formatPunkte(ergebnis.punkte)}{' '}
            <span className="text-lg text-muted">
              von {ergebnis.max} Punkten ({ergebnis.prozent} %)
            </span>
          </p>
          <p className="mt-2 text-[15px]">
            {ergebnis.prozent >= 50
              ? 'Damit liegst du über der Hälfte der Punkte. Die schwächsten Themen unten lohnen sich jetzt am meisten.'
              : 'Noch unter der Hälfte der Punkte. Kein Grund zur Sorge: Die Themen unten zeigen genau, wo du ansetzt.'}
          </p>
        </Card>
        <Card>
          <h2 className="font-semibold">Nach Themen</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {ergebnis.skills.map((s) => {
              const anteil = s.max > 0 ? s.punkte / s.max : 0;
              return (
                <li key={s.skillId}>
                  <div className="flex justify-between gap-3 text-[15px]">
                    <span>{skillTitel(s.skillId)}</span>
                    <span className="num whitespace-nowrap">
                      {formatPunkte(s.punkte)} / {s.max}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className={cx(
                        'h-full',
                        anteil >= 0.75 ? 'bg-ok' : anteil >= 0.5 ? 'bg-senf' : 'bg-warn',
                      )}
                      style={{ width: `${Math.round(anteil * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold">Aufgaben ansehen</h2>
          <ul className="mt-2 flex flex-col">
            {ergebnis.aufgaben.map((a, i) => {
              const t = klausurTask(plan.aufgaben[i]!);
              const auf = offen === a.key;
              return (
                <li key={a.key} className="border-t border-line py-2 first:border-0">
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-[15px]"
                    aria-expanded={auf}
                    onClick={() => setOffen(auf ? null : a.key)}
                  >
                    <span>
                      {i + 1}. {a.titel}
                    </span>
                    <span className="num whitespace-nowrap">
                      {formatPunkte(a.punkte)} / {a.max}
                    </span>
                  </button>
                  {auf ? (
                    <div className="mt-2 flex flex-col gap-4">
                      {t.parts.map((p, pi) => (
                        <div key={p.id} className="rounded-lg border border-line p-3">
                          {'titel' in p && p.titel ? (
                            <h3 className="mb-2 font-semibold">{p.titel}</h3>
                          ) : null}
                          <PartInput
                            part={p}
                            antwort={stand?.antworten[a.key]?.[p.id] ?? leereAntwort(p)}
                            onChange={() => undefined}
                            result={a.check.parts[pi]}
                            revealed={false}
                            disabled
                          />
                          <div className="mt-3">
                            <PartFeedback result={a.check.parts[pi]!} />
                          </div>
                        </div>
                      ))}
                      {t.steps.length > 0 ? <Rechenweg steps={t.steps} /> : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Card>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="primary" onClick={() => navigate('pruefen')}>
            Zur Übersicht
          </Button>
          <Button onClick={() => navigate('lernpfad')}>Zum Lernpfad</Button>
        </div>
      </div>
    );
  }

  // ---------- Start ----------
  if (!stand || !plan || !task) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 pb-10">
        <button
          type="button"
          onClick={() => navigate('pruefen')}
          className="flex h-10 items-center gap-1 self-start rounded-lg px-2 text-sm text-muted hover:bg-surface-2"
        >
          <Icon name="schliessen" className="h-5 w-5" /> Zurück
        </button>
        <Card>
          <Chip tone="accent">{vorschau.art === 'probe' ? 'Probeklausur' : 'Mini-Klausur'}</Chip>
          <h1 className="mt-2 text-xl font-semibold">{vorschau.titel}</h1>
          <p className="num mt-2 text-[15px]">
            {vorschau.aufgaben.reduce((a, x) => a + x.punkte, 0)} Punkte · {vorschau.minuten}{' '}
            Minuten · {vorschau.aufgaben.length} Aufgaben
          </p>
          <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-[15px]">
            <li>Wie in der echten Klausur: keine Hilfen, keine Rückmeldung zwischendurch.</li>
            <li>Du kannst frei zwischen den Aufgaben springen.</li>
            <li>Die Zeit läuft ruhig mit. Nichts wird abgebrochen, du gibst selbst ab.</li>
            <li>Teilpunkte gibt es für jedes richtige Feld und jede richtige Buchungszeile.</li>
          </ul>
          {vorschau.hinweis ? <p className="mt-3 text-sm text-muted">{vorschau.hinweis}</p> : null}
          <p className="mt-3 text-sm text-muted">
            Am Laptop deutlich bequemer. Die Aufgaben sind jedes Mal neu.
          </p>
        </Card>
        <Button variant="primary" onClick={starten}>
          Klausur beginnen
        </Button>
      </div>
    );
  }

  // ---------- Schreiben ----------
  const antworten = stand.antworten[plan.aufgaben[index]!.key] ?? {};
  const setAntwort = (partId: string, a: TaskAnswer[string]) => {
    const key = plan.aufgaben[index]!.key;
    const neu: KlausurStand = {
      ...stand,
      antworten: { ...stand.antworten, [key]: { ...(stand.antworten[key] ?? {}), [partId]: a } },
    };
    setStand(neu);
    void setKv(AKTIV, neu);
  };
  const minutenUebrig = Math.ceil(plan.minuten - (jetzt - stand.start) / 60_000);
  const zahl = bearbeitet(plan, stand.antworten);

  const abgeben = async () => {
    const e = bewerteKlausur(plan, stand.antworten);
    const dauer = Date.now() - stand.start;
    const dev = await deviceId();
    for (const [i, a] of plan.aufgaben.entries()) {
      const t = klausurTask(a);
      const ev = erstelleAttempt({
        task: t,
        answers: stand.antworten[a.key] ?? {},
        results: e.aufgaben[i]!.check.parts,
        hintsUsed: 0,
        durationMs: dauer / plan.aufgaben.length,
        deviceId: dev,
        mode: plan.art === 'probe' ? 'probeklausur' : 'mini-klausur',
        frueher: [],
        loesungGezeigt: false,
      });
      ev.klausurId = plan.id;
      await addEvent(ev);
    }
    const protokoll = (await getKv<KlausurProtokoll[]>(PROTOKOLL)) ?? [];
    await setKv(PROTOKOLL, [
      ...protokoll,
      {
        id: plan.id,
        titel: plan.titel,
        art: plan.art,
        ts: new Date().toISOString(),
        punkte: e.punkte,
        max: e.max,
      },
    ]);
    await deleteKv(AKTIV);
    spiele(plan.art === 'probe' ? 'feier' : 'lektion');
    setErgebnis(e);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="flex flex-col gap-4 pb-40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-medium tracking-wide text-accent uppercase">
            {plan.titel}
          </div>
          <div className="num text-sm text-muted" role="timer" aria-live="off">
            {minutenUebrig > 0
              ? `Noch etwa ${minutenUebrig} ${minutenUebrig === 1 ? 'Minute' : 'Minuten'}`
              : 'Die geplante Zeit ist um – schreib in Ruhe zu Ende und gib dann ab.'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('pruefen')}
          className="flex h-10 items-center gap-1 rounded-lg px-2 text-sm text-muted hover:bg-surface-2"
          aria-label="Klausur unterbrechen"
        >
          <Icon name="schliessen" className="h-5 w-5" /> Unterbrechen
        </button>
      </div>
      <nav aria-label="Aufgaben" className="flex flex-wrap gap-2">
        {plan.aufgaben.map((a, i) => {
          const fertig = Object.values(stand.antworten[a.key] ?? {}).some((x) => !istLeer(x));
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => {
                setIndex(i);
                window.scrollTo({ top: 0 });
              }}
              aria-current={i === index ? 'step' : undefined}
              aria-label={`Aufgabe ${i + 1}: ${a.titel}, ${a.punkte} Punkte${fertig ? ', bearbeitet' : ''}`}
              className={cx(
                'num flex h-11 min-w-11 items-center justify-center rounded-lg border-2 px-2 text-sm font-semibold',
                i === index
                  ? 'border-accent bg-accent-soft text-accent'
                  : fertig
                    ? 'border-line-strong bg-surface-2'
                    : 'border-line bg-surface text-muted',
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-6">
        <Card className="lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="accent">Aufgabe {index + 1}</Chip>
            <Chip>{plan.aufgaben[index]!.punkte} Punkte</Chip>
          </div>
          <h2 className="mt-2 text-lg font-semibold">{task.text.titel}</h2>
          <div className="mt-2 flex flex-col gap-2 text-[15px]">
            {task.text.sachverhalt.map((s, i) => (
              <p key={i}>{s}</p>
            ))}
          </div>
          {task.text.daten ? <DatenTabelle daten={task.text.daten} /> : null}
          <p className="mt-3 border-t border-line pt-3 text-[15px] font-medium">
            {task.text.aufgabe}
          </p>
        </Card>
        <div className="flex min-w-0 flex-col gap-4">
          {task.parts.map((p) => (
            <Card key={`${plan.aufgaben[index]!.key}-${p.id}`}>
              {'titel' in p && p.titel ? <h3 className="mb-3 font-semibold">{p.titel}</h3> : null}
              <PartInput
                part={p}
                antwort={antworten[p.id] ?? leereAntwort(p)}
                onChange={(a) => setAntwort(p.id, a)}
                revealed={false}
                disabled={false}
              />
            </Card>
          ))}
          {bestaetigen ? (
            <Card className="border-accent/40">
              <p className="text-[15px]">
                Wirklich abgeben? Du hast {zahl} von {plan.aufgaben.length} Aufgaben bearbeitet.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button variant="primary" onClick={() => void abgeben()}>
                  Jetzt abgeben
                </Button>
                <Button onClick={() => setBestaetigen(false)}>Weiter schreiben</Button>
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 [&_button]:whitespace-nowrap">
          <Button
            onClick={() => {
              setIndex(index - 1);
              window.scrollTo({ top: 0 });
            }}
            disabled={index === 0}
          >
            Zurück
          </Button>
          <div className="flex-1" />
          {index < plan.aufgaben.length - 1 ? (
            <Button
              variant="primary"
              onClick={() => {
                setIndex(index + 1);
                window.scrollTo({ top: 0 });
              }}
            >
              Nächste Aufgabe <Icon name="pfeil" className="h-5 w-5" />
            </Button>
          ) : null}
          <Button
            variant={index === plan.aufgaben.length - 1 ? 'primary' : 'secondary'}
            onClick={() => setBestaetigen(true)}
          >
            Abgeben
          </Button>
        </div>
      </div>
    </div>
  );
}
