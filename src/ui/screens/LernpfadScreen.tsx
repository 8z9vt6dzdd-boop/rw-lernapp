// Lernpfad im Duolingo-Stil: Abschnitte als Kapitel, je Skill Lektion → Übung (→ später Wiederholung).
import { useMemo, useState } from 'react';
import { fallFuerSkill } from '../../engine/faelle';
import { miniKlausurMoeglich } from '../../learning/klausur';
import { ABSCHNITTE, type Abschnitt } from '../../content/curriculum';
import { LEKTIONEN, lektionFuerSkill } from '../../content/lessons';
import {
  abschnittAbgeschlossen,
  knotenFuer,
  kompetenzRinge,
  naechsterKnoten,
  readiness,
  type Knoten,
} from '../../learning/fortschritt';
import type { LernEreignis } from '../../learning/types';
import { Button, Card, Chip, cx } from '../components/ui';
import { Character } from '../figures/Character';
import { navigate, useEvents } from '../hooks';

function KnotenIcon({ k }: { k: Knoten }) {
  const p = {
    viewBox: '0 0 24 24',
    className: 'h-7 w-7',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (k.status === 'erledigt')
    return (
      <svg {...p}>
        <path d="M5 12.5 10 17l9-10" />
      </svg>
    );
  if (k.status === 'gesperrt')
    return (
      <svg {...p}>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    );
  if (k.typ === 'lektion')
    return (
      <svg {...p}>
        <path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5Z" />
        <path d="M12 6v13.5" />
      </svg>
    );
  return (
    <svg {...p}>
      <path d="m14.5 5.5 4 4L9 19H5v-4Z" />
      <path d="m12.5 7.5 4 4" />
    </svg>
  );
}

function zielVon(k: Knoten): string | null {
  if (k.status === 'bald' || k.status === 'gesperrt') return null;
  if (k.typ === 'lektion') {
    const l = lektionFuerSkill(k.skill.id);
    return l ? `#/lektion/${encodeURIComponent(l.id)}` : null;
  }
  const fall = fallFuerSkill(k.skill.id);
  if (fall) return `#/fall/${fall.id}`;
  return `#/sitzung?skill=${encodeURIComponent(k.skill.id)}`;
}

/** Kompetenzring: Abrufwahrscheinlichkeit aus FSRS, verblasst, wenn lange nicht geübt. */
function Ring({ wert }: { wert: number | null }) {
  if (wert === null || wert <= 0) return null;
  const r = 37;
  const u = 2 * Math.PI * r;
  return (
    <svg
      viewBox="0 0 80 80"
      className="pointer-events-none absolute -inset-2 h-20 w-20 -rotate-90"
      aria-hidden="true"
    >
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="4" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke="#8cbf3f"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${u * wert} ${u}`}
        opacity={0.35 + 0.65 * wert}
      />
    </svg>
  );
}

function Pfad({
  knoten,
  naechster,
  ringe,
}: {
  knoten: Knoten[];
  naechster?: Knoten | undefined;
  ringe: Map<string, number | null>;
}) {
  const [hinweis, setHinweis] = useState<string | null>(null);
  // Zickzack wie bei Duolingo, schmal genug für 360 px Breite
  const versatz = [0, 36, 56, 36, 0, -36, -56, -36];
  return (
    <ol className="relative flex flex-col items-center gap-3 overflow-x-clip py-2">
      {knoten.map((k, i) => {
        const ziel = zielVon(k);
        const istNaechster =
          naechster && naechster.skill.id === k.skill.id && naechster.typ === k.typ;
        const label = `${k.typ === 'lektion' ? 'Lektion' : 'Übung'}: ${k.skill.titel}`;
        return (
          <li
            key={`${k.skill.id}-${k.typ}`}
            className="flex w-full flex-col items-center"
            style={{ transform: `translateX(${versatz[i % versatz.length]}px)` }}
          >
            <div className="relative">
              {istNaechster ? (
                <div
                  className={cx(
                    'absolute top-1/2 -translate-y-1/2',
                    (versatz[i % versatz.length] ?? 0) < 0 ? 'left-full ml-2' : 'right-full mr-2',
                  )}
                >
                  <Character id="ich" ausdruck="freut" groesse={52} bewegung="nicken" />
                </div>
              ) : null}
              <button
                type="button"
                aria-label={`${label} – ${k.status === 'erledigt' ? 'erledigt' : k.status === 'gesperrt' ? 'gesperrt' : k.status === 'bald' ? 'folgt bald' : 'offen'}`}
                onClick={() => {
                  if (ziel) window.location.hash = ziel;
                  else if (k.status === 'gesperrt')
                    setHinweis(
                      `Die Übung „${k.skill.titel}“ wird nach der Lektion frei – oder nach „Kann ich schon“.`,
                    );
                  else setHinweis(`„${k.skill.titel}“ ist in Vorbereitung.`);
                }}
                className={cx(
                  'flex h-16 w-16 items-center justify-center rounded-full border-b-4 transition-transform active:translate-y-0.5',
                  k.status === 'erledigt' && 'border-[#5d8a24] bg-lime text-white',
                  k.status === 'offen' &&
                    k.typ === 'lektion' &&
                    'border-[#124a51] bg-accent text-on-accent',
                  k.status === 'offen' &&
                    k.typ === 'uebung' &&
                    'border-[#b8892a] bg-senf text-[#1d1a17]',
                  k.status === 'gesperrt' && 'border-line-strong bg-surface-3 text-muted',
                  k.status === 'bald' &&
                    'border-2 border-dashed border-line-strong bg-surface text-muted',
                  istNaechster && 'ring-4 ring-accent/30',
                )}
              >
                <KnotenIcon k={k} />
              </button>
              <Ring wert={ringe.get(k.skill.id) ?? null} />
            </div>
            <span
              className={cx(
                'mt-1 max-w-[11rem] text-center text-xs',
                k.status === 'bald' ? 'text-muted' : 'font-medium',
              )}
            >
              {k.skill.titel}
              {k.info ? <span className="num block font-normal text-muted">{k.info}</span> : null}
              {k.status === 'bald' ? <span className="block font-normal">folgt bald</span> : null}
            </span>
          </li>
        );
      })}
      {hinweis ? (
        <li
          role="status"
          className="sticky bottom-24 z-10 w-full rounded-xl border border-line bg-surface p-3 text-sm shadow-card"
          onClick={() => setHinweis(null)}
        >
          {hinweis}
        </li>
      ) : null}
    </ol>
  );
}

function AbschnittKarte({
  a,
  events,
  offen,
  onToggle,
  naechster,
  ringe,
}: {
  a: Abschnitt;
  events: readonly LernEreignis[];
  offen: boolean;
  onToggle: () => void;
  naechster?: Knoten | undefined;
  ringe: Map<string, number | null>;
}) {
  const knoten = knotenFuer(events, a);
  const verfuegbar = knoten.filter((k) => k.status !== 'bald');
  const erledigt = knoten.filter((k) => k.status === 'erledigt').length;
  const fertig = abschnittAbgeschlossen(events, a);
  const hatLektionen = LEKTIONEN.some((l) => l.abschnitt === a.id);
  const offeneLektionen = knoten.some((k) => k.typ === 'lektion' && k.status === 'offen');
  const r = Math.round(readiness(events, a) * 100);
  return (
    <Card className={cx(fertig && 'border-lime')}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 text-left"
        aria-expanded={offen}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="accent">{a.id === '0' ? 'Abschnitt 0' : `Abschnitt ${a.id}`}</Chip>
            {fertig ? <Chip>abgeschlossen</Chip> : null}
          </div>
          <h2 className="mt-1 text-lg font-semibold">{a.titel}</h2>
          <p className="text-sm text-muted">{a.kapitel}</p>
        </div>
        <div className="num shrink-0 text-right text-sm text-muted">
          {verfuegbar.length > 0 ? `${erledigt}/${knoten.length}` : 'folgt'}
          {verfuegbar.length > 0 ? <div className="text-xs">Stand {r} %</div> : null}
        </div>
      </button>
      {offen ? (
        <div className="mt-3">
          {['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].includes(a.id) ? (
            <p className="mb-2 rounded-lg bg-surface-2 p-2 text-xs text-muted">
              Empfohlen: vorher Abschnitt 0, A und B. Du kannst aber schon hineinschauen.
            </p>
          ) : null}
          <Pfad knoten={knoten} naechster={naechster} ringe={ringe} />
          {hatLektionen && offeneLektionen ? (
            <Button
              variant="ghost"
              className="mt-2 w-full"
              onClick={() => navigate('test', 'abschnitt', a.id)}
            >
              Abschnitt überspringen – kurzer Test
            </Button>
          ) : null}
          {miniKlausurMoeglich(a.id) ? (
            <Button
              variant="ghost"
              className="mt-1 w-full"
              onClick={() => navigate('klausur', 'mini', a.id)}
            >
              Mini-Klausur zu Abschnitt {a.id}
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

export function LernpfadScreen() {
  const events = useEvents();
  const naechster = useMemo(() => (events ? naechsterKnoten(events) : undefined), [events]);
  const ringe = useMemo(
    () => (events ? kompetenzRinge(events) : new Map<string, number | null>()),
    [events],
  );
  const [offen, setOffen] = useState<Set<string> | null>(null);
  if (!events) return null;
  // Aufgeklappt: Abschnitte mit eigenem Fortschritt und der mit dem nächsten Schritt; sonst die ersten beiden mit Inhalten
  const mitInhalt = ABSCHNITTE.filter((a) =>
    knotenFuer(events, a).some((k) => k.status !== 'bald'),
  );
  const standard = new Set(
    mitInhalt
      .filter((a) => knotenFuer(events, a).some((k) => k.status === 'erledigt'))
      .map((a) => a.id),
  );
  if (naechster) {
    const a = ABSCHNITTE.find((x) => x.skills.some((s) => s.id === naechster.skill.id));
    if (a) standard.add(a.id);
  }
  if (standard.size === 0) mitInhalt.slice(0, 2).forEach((a) => standard.add(a.id));
  const aktivOffen = offen ?? standard;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Lernpfad</h1>
        <p className="mt-1 text-muted">
          Erst die Lektion, dann die Übung. Was du schon kannst, überspringst du mit einem kurzen
          Test.
        </p>
      </div>
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">Fälle und Klausuren</h2>
          <p className="text-sm text-muted">
            Mehrstufige Fälle, Mini-Klausuren und die Probeklausur
          </p>
        </div>
        <Button onClick={() => navigate('pruefen')}>Öffnen</Button>
      </Card>
      {ABSCHNITTE.map((a) => (
        <AbschnittKarte
          key={a.id}
          a={a}
          events={events}
          naechster={naechster}
          ringe={ringe}
          offen={aktivOffen.has(a.id)}
          onToggle={() => {
            const n = new Set(aktivOffen);
            if (n.has(a.id)) n.delete(a.id);
            else n.add(a.id);
            setOffen(n);
          }}
        />
      ))}
    </div>
  );
}
