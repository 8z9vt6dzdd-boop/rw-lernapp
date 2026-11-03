// Kurztest zum Überspringen (Lektion, Abschnitt, Einstufung). Nicht bestanden ist kein Misserfolg.
import { useMemo, useState } from 'react';
import type { Option } from '../../content/lessons/types';
import { createRng } from '../../engine/rng';
import { Button, Card, Chip, StatusIcon, cx } from '../components/ui';
import { Sprechblase } from './Sprechblase';

export interface TestFrage {
  frage: string;
  optionen: Option[];
  skillId: string;
}

export interface TestErgebnis {
  richtig: number;
  gesamt: number;
  /** Skills mit mindestens einer falschen Antwort */
  falscheSkills: string[];
  skills: string[];
  durationMs: number;
}

export function SkipTest({
  titel,
  fragen,
  onEnde,
  onAbbruch,
}: {
  titel: string;
  fragen: readonly TestFrage[];
  onEnde: (e: TestErgebnis) => void;
  onAbbruch: () => void;
}) {
  const [start] = useState(() => Date.now());
  const [i, setI] = useState(0);
  const [wahl, setWahl] = useState<number | null>(null);
  const [antworten, setAntworten] = useState<boolean[]>([]);
  const [abgeschlossen, setAbgeschlossen] = useState(false);
  const f = fragen[i];
  const reihenfolge = useMemo(
    () => (f ? createRng(i * 7919 + f.frage.length).shuffle(f.optionen.map((_, k) => k)) : []),
    [f, i],
  );
  if (!f) return null;
  const weiter = () => {
    if (abgeschlossen) return;
    const ok = wahl !== null && f.optionen[wahl]?.richtig === true;
    const neu = [...antworten, ok];
    setAntworten(neu);
    setWahl(null);
    if (i + 1 < fragen.length) setI(i + 1);
    else {
      setAbgeschlossen(true);
      const falsche = new Set<string>();
      neu.forEach((r, k) => !r && falsche.add(fragen[k]!.skillId));
      onEnde({
        richtig: neu.filter(Boolean).length,
        gesamt: fragen.length,
        falscheSkills: [...falsche],
        skills: [...new Set(fragen.map((x) => x.skillId))],
        durationMs: Date.now() - start,
      });
    }
  };
  return (
    <div className="flex flex-col gap-4 pb-28">
      <div className="flex items-center justify-between">
        <Chip tone="accent">{titel}</Chip>
        <button type="button" onClick={onAbbruch} className="text-sm text-muted underline">
          Abbrechen
        </button>
      </div>
      <div className="num text-sm text-muted">
        Frage {i + 1} von {fragen.length}
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${(i / fragen.length) * 100}%` }}
        />
      </div>
      <Card>
        <h2 className="text-lg font-semibold">{f.frage}</h2>
        <div role="radiogroup" className="mt-3 flex flex-col gap-2">
          {reihenfolge.map((k) => {
            const o = f.optionen[k]!;
            return (
              <button
                key={o.text}
                type="button"
                role="radio"
                aria-checked={wahl === k}
                onClick={() => setWahl(k)}
                className={cx(
                  'min-h-12 rounded-xl border-2 px-4 py-3 text-left text-[15px]',
                  wahl === k
                    ? 'border-accent bg-accent-soft'
                    : 'border-line-strong bg-surface hover:bg-surface-2',
                )}
              >
                {o.text}
              </button>
            );
          })}
        </div>
      </Card>
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl justify-end px-4 py-3">
          <Button variant="primary" disabled={wahl === null || abgeschlossen} onClick={weiter}>
            {i + 1 < fragen.length ? 'Nächste Frage' : 'Auswerten'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TestAuswertung({
  ergebnis,
  bestanden,
  textBestanden,
  onWeiter,
  onLernen,
  lernenLabel,
}: {
  ergebnis: TestErgebnis;
  bestanden: boolean;
  textBestanden: string;
  onWeiter: () => void;
  onLernen?: (() => void) | undefined;
  lernenLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="text-center">
        <div className="flex justify-center">
          <StatusIcon status={bestanden ? 'richtig' : 'rundung'} />
        </div>
        <h2 className="mt-2 text-xl font-semibold">
          {bestanden ? 'Bestanden!' : 'Noch nicht ganz'}
        </h2>
        <p className="num mt-1 text-muted">
          {ergebnis.richtig} von {ergebnis.gesamt} richtig
        </p>
      </Card>
      {bestanden ? (
        <Sprechblase s={{ figur: 'jana', ausdruck: 'freut', text: textBestanden }} />
      ) : (
        <Sprechblase
          s={{
            figur: 'jana',
            ausdruck: 'erklaert',
            text: 'Lass uns das kurz gemeinsam ansehen. Danach sitzt es sicher.',
          }}
        />
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        {!bestanden && onLernen ? (
          <Button variant="primary" onClick={onLernen}>
            {lernenLabel ?? 'Lektion starten'}
          </Button>
        ) : null}
        <Button variant={bestanden ? 'primary' : 'secondary'} onClick={onWeiter}>
          Zum Lernpfad
        </Button>
      </div>
    </div>
  );
}
