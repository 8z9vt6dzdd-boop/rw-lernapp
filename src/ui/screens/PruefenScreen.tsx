// Übersicht: Fälle (Fallmodus), Mini-Klausuren je Abschnitt und Probeklausur.
import { useEffect, useState } from 'react';
import { ABSCHNITTE } from '../../content/curriculum';
import { FAELLE } from '../../engine/faelle';
import { miniKlausur, miniKlausurMoeglich } from '../../learning/klausur';
import { getKv } from '../../storage/db';
import { Button, Card, Chip } from '../components/ui';
import { navigate, useEvents } from '../hooks';
import { formatPunkte } from './FallScreen';
import type { KlausurEvent } from '../../learning/types';

export function PruefenScreen() {
  const events = useEvents();
  const protokoll = (events ?? []).filter((e): e is KlausurEvent => e.typ === 'klausur');
  const [faelleOffen, setFaelleOffen] = useState<Record<string, boolean>>({});
  useEffect(() => {
    let alive = true;
    void Promise.all(
      FAELLE.map(async (f) => {
        const s = await getKv<{ schritt: number }>(`fall:${f.id}`);
        return [f.id, !!s && s.schritt > 0] as const;
      }),
    ).then((x) => alive && setFaelleOffen(Object.fromEntries(x)));
    return () => {
      alive = false;
    };
  }, []);
  const letzteProbe = [...protokoll].reverse().find((p) => p.art === 'probe');
  const minis = ABSCHNITTE.filter((a) => miniKlausurMoeglich(a.id));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Fälle und Klausuren</h1>
        <p className="mt-1 text-[15px] text-muted">
          Hier übst du wie in der Klausur: mehrstufige Fälle und Klausuren auf Zeit. Am Laptop
          deutlich bequemer.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="accent">Probeklausur</Chip>
          <Chip>90 Punkte · 90 Minuten</Chip>
        </div>
        <h2 className="mt-2 text-lg font-semibold">Probeklausur Rechnungswesen</h2>
        <p className="mt-1 text-[15px]">
          Buchführung (40 Punkte) und Kosten- und Leistungsrechnung (50 Punkte), jedes Mal mit neuen
          Zahlen.
        </p>
        {letzteProbe ? (
          <p className="num mt-2 text-sm text-muted">
            Zuletzt: {formatPunkte(letzteProbe.punkte)} von {letzteProbe.max} Punkten am{' '}
            {new Date(letzteProbe.ts).toLocaleDateString('de-DE')}
          </p>
        ) : null}
        <Button variant="primary" className="mt-3" onClick={() => navigate('klausur', 'probe')}>
          Probeklausur öffnen
        </Button>
      </Card>

      <section aria-labelledby="faelle">
        <h2 id="faelle" className="mb-2 text-lg font-semibold">
          Fallmodus
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {FAELLE.map((f) => (
            <Card key={f.id}>
              <h3 className="font-semibold">{f.titel}</h3>
              <p className="mt-1 text-[15px]">{f.beschreibung}</p>
              <p className="mt-1 text-sm text-muted">Etwa {f.minuten} Minuten</p>
              <Button className="mt-3" onClick={() => navigate('fall', f.id)}>
                {faelleOffen[f.id] ? 'Weitermachen' : 'Fall starten'}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="minis">
        <h2 id="minis" className="mb-2 text-lg font-semibold">
          Mini-Klausuren
        </h2>
        <Card>
          <ul className="flex flex-col">
            {minis.map((a) => {
              const plan = miniKlausur(a.id, 1);
              const letzte = [...protokoll]
                .reverse()
                .find((p) => p.art === 'mini' && p.klausurId.startsWith(`mini-${a.id}-`));
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 border-t border-line py-2 first:border-0"
                >
                  <span className="min-w-0 text-[15px]">
                    <span className="font-medium">
                      {a.id}: {a.titel}
                    </span>
                    <span className="num block text-sm text-muted">
                      {plan.minuten} Minuten
                      {letzte ? ` · zuletzt ${formatPunkte(letzte.punkte)}/${letzte.max}` : ''}
                    </span>
                  </span>
                  <Button onClick={() => navigate('klausur', 'mini', a.id)}>Starten</Button>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>
    </div>
  );
}
