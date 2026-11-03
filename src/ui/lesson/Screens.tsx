// Alle Bildschirmtypen einer Lektion (09-lektionen.md, Abschnitt 5).
import { useEffect, useMemo, useState } from 'react';
import type { Option, Screen } from '../../content/lessons/types';
import { checkPart, felderVon, formatSoll } from '../../engine/check';
import { generatorFuer } from '../../engine/generators';
import { createRng } from '../../engine/rng';
import type {
  PartAnswer,
  PartResult,
  RechenkettePart,
  SatzEingabe,
  TaskPart,
} from '../../engine/task';
import { FIRMA } from '../../config';
import { Button, Card, Chip, StatusIcon, cx } from '../components/ui';
import { BuchungssatzBuilder, leereSaetze } from '../components/Buchungssatz';
import { PartFeedback } from '../components/Feedback';
import { RechenketteInput, TabelleInput, type FeldWerte } from '../components/Felder';
import { WahlInput } from '../components/Wahl';
import { Character } from '../figures/Character';
import { Beleg } from '../visuals/Beleg';
import { Schauplatz } from '../visuals/Schauplatz';
import { ErkundenView } from './Erkunden';
import { Sprechblase, Sprechblasen } from './Sprechblase';
import { VisualView } from './VisualView';

/** Meldet: Bildschirm erledigt; bei Aufgaben mit Bewertung zusätzlich richtig/falsch. */
export type Done = (richtig?: boolean) => void;

function OptionenWahl({
  optionen,
  onWahl,
  gewaehlt,
  zeigeAuswertung,
}: {
  optionen: readonly Option[];
  onWahl: (i: number) => void;
  gewaehlt: number | null;
  zeigeAuswertung: boolean;
}) {
  return (
    <div role="radiogroup" className="flex flex-col gap-2">
      {optionen.map((o, i) => {
        const istGewaehlt = gewaehlt === i;
        const richtig = zeigeAuswertung && o.richtig;
        const falsch = zeigeAuswertung && istGewaehlt && !o.richtig;
        return (
          <button
            key={o.text}
            type="button"
            role="radio"
            aria-checked={istGewaehlt}
            disabled={zeigeAuswertung}
            onClick={() => onWahl(i)}
            className={cx(
              'flex min-h-12 items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left text-[15px] transition-colors',
              !zeigeAuswertung &&
                !istGewaehlt &&
                'border-line-strong bg-surface hover:bg-surface-2',
              !zeigeAuswertung && istGewaehlt && 'border-accent bg-accent-soft',
              richtig && 'border-ok bg-ok-soft',
              falsch && 'border-err bg-err-soft',
              zeigeAuswertung && !richtig && !falsch && 'border-line bg-surface opacity-70',
            )}
          >
            <span>{o.text}</span>
            {richtig ? (
              <StatusIcon status="richtig" />
            ) : falsch ? (
              <StatusIcon status="falsch" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function Erklaerung({
  richtig,
  text,
  titel,
}: {
  richtig?: boolean | undefined;
  text: string;
  titel?: string;
}) {
  return (
    <div
      className={cx(
        'einblenden rounded-xl border p-3 text-[15px]',
        richtig === undefined
          ? 'border-accent/40 bg-accent-soft/50'
          : richtig
            ? 'border-ok/40 bg-ok-soft'
            : 'border-warn/40 bg-warn-soft',
      )}
    >
      <div
        className={cx(
          'font-semibold',
          richtig === undefined ? 'text-accent' : richtig ? 'text-ok' : 'text-warn',
        )}
      >
        {titel ?? (richtig === undefined ? 'Auflösung' : richtig ? 'Richtig' : 'Nicht ganz')}
      </div>
      <p className="mt-0.5">{text}</p>
    </div>
  );
}

// ---------- einzelne Bildschirmtypen ----------

function Raetsel({ s }: { s: Extract<Screen, { typ: 'raetsel' }> }) {
  return (
    <div className="flex flex-col gap-4">
      <Schauplatz ort={s.ort}>
        {[...new Set(s.sprecher.map((x) => x.figur))].map((f, i) => {
          const sp = s.sprecher.filter((x) => x.figur === f).at(-1)!;
          return (
            <Character
              key={f}
              id={f}
              ausdruck={sp.ausdruck}
              groesse={96}
              gespiegelt={i % 2 === 1}
              hintergrund={false}
            />
          );
        })}
      </Schauplatz>
      {s.visual ? <VisualView v={s.visual} /> : null}
      <Sprechblasen sprecher={s.sprecher} />
      <div
        className="einblenden rounded-xl border-2 border-dashed border-accent bg-accent-soft/40 p-4"
        style={{ animationDelay: `${s.sprecher.length * 450}ms` }}
      >
        <div className="text-xs font-semibold tracking-wide text-accent uppercase">Das Rätsel</div>
        <p className="mt-1 text-[17px] font-semibold">{s.frage}</p>
      </div>
    </div>
  );
}

function Dialog({ s }: { s: Extract<Screen, { typ: 'dialog' }> }) {
  return (
    <div className="flex flex-col gap-4">
      {s.ort ? (
        <Schauplatz ort={s.ort} hoehe="h-28 sm:h-36">
          {[...new Set(s.sprecher.map((x) => x.figur))].map((f, i) => (
            <Character
              key={f}
              id={f}
              ausdruck={s.sprecher.find((x) => x.figur === f)!.ausdruck}
              groesse={76}
              gespiegelt={i % 2 === 1}
              hintergrund={false}
            />
          ))}
        </Schauplatz>
      ) : null}
      <Sprechblasen sprecher={s.sprecher} />
      {s.visual ? <VisualView v={s.visual} /> : null}
    </div>
  );
}

function Konzept({ s }: { s: Extract<Screen, { typ: 'konzept' }> }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="hand text-2xl font-bold">{s.titel}</h2>
      <p className="text-[17px] leading-relaxed">{s.text}</p>
      <VisualView v={s.visual} />
      {s.figur ? <Sprechblase s={s.figur} /> : null}
    </div>
  );
}

function ErkundenScreen({ s, onDone }: { s: Extract<Screen, { typ: 'erkunden' }>; onDone: Done }) {
  const [fertig, setFertig] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Chip tone="accent">Ausprobieren</Chip>
        <h2 className="mt-2 text-xl font-semibold">{s.titel}</h2>
        <p className="mt-1 text-[15px] text-muted">{s.text}</p>
      </div>
      <ErkundenView
        e={s.erkunden}
        onDone={(r) => {
          setFertig(true);
          onDone(r);
        }}
      />
      {fertig && s.fazit ? <Erklaerung text={s.fazit} titel="Was du gerade gesehen hast" /> : null}
    </div>
  );
}

function Vorhersage({ s, onDone }: { s: Extract<Screen, { typ: 'vorhersage' }>; onDone: Done }) {
  const [wahl, setWahl] = useState<number | null>(null);
  const aufgeloest = wahl !== null;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Chip tone="accent">Was meinst du?</Chip>
        <h2 className="mt-2 text-xl font-semibold">{s.frage}</h2>
        <p className="mt-1 text-sm text-muted">
          Tipp einfach – falsch liegen ist hier ausdrücklich erlaubt.
        </p>
      </div>
      {s.figur ? <Sprechblase s={s.figur} /> : null}
      {s.visual ? <VisualView v={s.visual} /> : null}
      <OptionenWahl
        optionen={s.optionen}
        gewaehlt={wahl}
        zeigeAuswertung={aufgeloest}
        onWahl={(i) => {
          setWahl(i);
          onDone(s.optionen[i]?.richtig === true);
        }}
      />
      {aufgeloest ? (
        <>
          <Erklaerung
            text={s.aufloesung}
            titel={s.optionen[wahl]?.richtig ? 'Gut getippt!' : 'Die Auflösung'}
          />
          {s.aufloesungVisual ? <VisualView v={s.aufloesungVisual} /> : null}
        </>
      ) : null}
    </div>
  );
}

function Sortieren({ s, onDone }: { s: Extract<Screen, { typ: 'sortieren' }>; onDone: Done }) {
  const reihenfolge = useMemo(
    () => createRng(s.elemente.length * 31 + s.titel.length).shuffle(s.elemente.map((_, i) => i)),
    [s],
  );
  const [zuordnung, setZuordnung] = useState<Record<number, string>>({});
  const [geprueft, setGeprueft] = useState(false);
  const alle = s.elemente.every((_, i) => zuordnung[i]);
  const richtig = s.elemente.filter((e, i) => zuordnung[i] === e.kategorie).length;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Chip tone="accent">Zuordnen</Chip>
        <h2 className="mt-2 text-xl font-semibold">{s.titel}</h2>
        {s.text ? <p className="mt-1 text-[15px] text-muted">{s.text}</p> : null}
      </div>
      <ul className="flex flex-col gap-2">
        {reihenfolge.map((i) => {
          const e = s.elemente[i]!;
          const ok = geprueft && zuordnung[i] === e.kategorie;
          const falsch = geprueft && zuordnung[i] !== e.kategorie;
          return (
            <li
              key={e.text}
              className={cx(
                'rounded-xl border-2 p-3',
                ok
                  ? 'border-ok bg-ok-soft'
                  : falsch
                    ? 'border-err bg-err-soft'
                    : 'border-line bg-surface',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[15px] font-medium">{e.text}</span>
                {geprueft ? <StatusIcon status={ok ? 'richtig' : 'falsch'} /> : null}
              </div>
              <div
                className="mt-2 flex flex-wrap gap-1.5"
                role="radiogroup"
                aria-label={`Kategorie für: ${e.text}`}
              >
                {s.kategorien.map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={zuordnung[i] === k}
                    disabled={geprueft}
                    onClick={() => setZuordnung({ ...zuordnung, [i]: k })}
                    className={cx(
                      'min-h-10 rounded-lg border px-3 py-1.5 text-left text-sm',
                      zuordnung[i] === k
                        ? 'border-accent bg-accent-soft font-medium text-accent'
                        : 'border-line-strong bg-surface',
                    )}
                  >
                    {k}
                  </button>
                ))}
              </div>
              {falsch ? (
                <p className="mt-2 text-sm">
                  Richtig: <strong>{e.kategorie}</strong>
                  {e.erklaerung ? ` – ${e.erklaerung}` : ''}
                </p>
              ) : ok && e.erklaerung ? (
                <p className="mt-2 text-sm text-muted">{e.erklaerung}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
      {!geprueft ? (
        <Button
          variant="primary"
          disabled={!alle}
          onClick={() => {
            setGeprueft(true);
            onDone(richtig === s.elemente.length);
          }}
        >
          Zuordnung prüfen
        </Button>
      ) : (
        <Erklaerung
          richtig={richtig === s.elemente.length}
          text={`${richtig} von ${s.elemente.length} richtig zugeordnet.`}
        />
      )}
    </div>
  );
}

function WerHatRecht({
  s,
  onDone,
}: {
  s: Extract<Screen, { typ: 'wer-hat-recht' }>;
  onDone: Done;
}) {
  const [wer, setWer] = useState<'a' | 'b' | null>(null);
  const [grund, setGrund] = useState<number | null>(null);
  const fertig = wer !== null && grund !== null;
  const richtig = wer === s.richtig && grund !== null && s.begruendungen[grund]?.richtig === true;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Chip tone="accent">Wer hat recht?</Chip>
        <h2 className="mt-2 text-xl font-semibold">{s.frage}</h2>
      </div>
      <Sprechblase s={s.a} />
      <Sprechblase s={s.b} rechts />
      <div className="grid grid-cols-2 gap-2">
        {(['a', 'b'] as const).map((x) => (
          <Button
            key={x}
            variant={wer === x ? 'primary' : 'secondary'}
            disabled={fertig}
            onClick={() => setWer(x)}
          >
            {figurName(x === 'a' ? s.a.figur : s.b.figur)} hat recht
          </Button>
        ))}
      </div>
      {wer ? (
        <div className="einblenden flex flex-col gap-2">
          <p className="text-[15px] font-medium">Warum?</p>
          <OptionenWahl
            optionen={s.begruendungen}
            gewaehlt={grund}
            zeigeAuswertung={fertig}
            onWahl={(i) => {
              setGrund(i);
              onDone(wer === s.richtig && s.begruendungen[i]?.richtig === true);
            }}
          />
        </div>
      ) : null}
      {fertig ? <Erklaerung richtig={richtig} text={s.aufloesung} /> : null}
    </div>
  );
}

function figurName(id: string): string {
  return (
    { jana: 'Jana', tobias: 'Tobias', leni: 'Leni', frank: 'Frank', sabine: 'Sabine', ich: 'Ich' }[
      id
    ] ?? id
  );
}

function Fehlerjagd({ s, onDone }: { s: Extract<Screen, { typ: 'fehlerjagd' }>; onDone: Done }) {
  const [zeile, setZeile] = useState<number | undefined>();
  const [zeileGeprueft, setZeileGeprueft] = useState(false);
  const [grund, setGrund] = useState<number | null>(null);
  const zeileRichtig = zeile === s.fehlerZeile;
  const fertig = zeileGeprueft && grund !== null;
  const status = zeileGeprueft
    ? { richtig: s.fehlerZeile, gewaehltFalsch: zeileRichtig ? undefined : zeile }
    : undefined;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Chip tone="accent">Fehlerjagd</Chip>
        <h2 className="mt-2 text-xl font-semibold">{s.titel}</h2>
        <p className="mt-1 text-[15px] text-muted">{s.text}</p>
      </div>
      {s.beleg ? (
        <div className="flex justify-center">
          <Beleg
            {...s.beleg}
            gewaehlt={zeile}
            status={status}
            {...(zeileGeprueft ? {} : { onZeile: setZeile })}
          />
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {(s.zeilen ?? []).map((z, i) => (
            <li key={i}>
              <button
                type="button"
                disabled={zeileGeprueft}
                onClick={() => setZeile(i)}
                aria-pressed={zeile === i}
                className={cx(
                  'num w-full rounded-lg border-2 px-3 py-2 text-left text-[15px]',
                  status?.richtig === i && 'border-ok bg-ok-soft',
                  status?.gewaehltFalsch === i && 'border-err bg-err-soft',
                  !status && zeile === i && 'border-senf bg-warn-soft',
                  !status && zeile !== i && 'border-line bg-surface',
                  status &&
                    status.richtig !== i &&
                    status.gewaehltFalsch !== i &&
                    'border-line bg-surface',
                )}
              >
                {z}
              </button>
            </li>
          ))}
        </ul>
      )}
      {!zeileGeprueft ? (
        <Button
          variant="primary"
          disabled={zeile === undefined}
          onClick={() => setZeileGeprueft(true)}
        >
          Diese Zeile ist falsch
        </Button>
      ) : (
        <div className="einblenden flex flex-col gap-2">
          <p className="text-[15px] font-medium">
            {zeileRichtig
              ? 'Gefunden! Und was genau ist daran falsch?'
              : 'Fast – der Fehler steckt in der grün markierten Zeile. Was ist daran falsch?'}
          </p>
          <OptionenWahl
            optionen={s.gruende}
            gewaehlt={grund}
            zeigeAuswertung={fertig}
            onWahl={(i) => {
              setGrund(i);
              onDone(zeileRichtig && s.gruende[i]?.richtig === true);
            }}
          />
        </div>
      )}
      {fertig ? (
        <Erklaerung
          richtig={zeileRichtig && s.gruende[grund]?.richtig === true}
          text={s.aufloesung}
        />
      ) : null}
    </div>
  );
}

function Vorgerechnet({
  s,
  onDone,
}: {
  s: Extract<Screen, { typ: 'vorgerechnet' }>;
  onDone: Done;
}) {
  const [n, setN] = useState(1);
  useEffect(() => {
    if (s.schritte.length <= 1) onDone();
  }, [s, onDone]);
  const [warum, setWarum] = useState<Set<number>>(new Set());
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Chip>Vorgerechnet</Chip>
        <h2 className="mt-2 text-xl font-semibold">{s.titel}</h2>
        {s.text ? <p className="mt-1 text-[15px] text-muted">{s.text}</p> : null}
      </div>
      {s.visual ? <VisualView v={s.visual} /> : null}
      <ol className="flex flex-col gap-3">
        {s.schritte.slice(0, n).map((st, i) => (
          <li key={i} className="einblenden flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-on-accent">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px]">{st.text}</p>
              {st.rechnung ? (
                <p className="num mt-0.5 rounded-md bg-surface-2 px-2 py-1 text-[15px] font-medium break-words">
                  {st.rechnung}
                </p>
              ) : null}
              <button
                type="button"
                className="mt-1 text-sm font-medium text-accent underline"
                aria-expanded={warum.has(i)}
                onClick={() => setWarum(new Set(warum).add(i))}
              >
                Warum?
              </button>
              {warum.has(i) ? (
                <p className="einblenden mt-1 text-sm text-muted">{st.warum}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {n < s.schritte.length ? (
        <Button
          onClick={() => {
            setN(n + 1);
            if (n + 1 === s.schritte.length) onDone();
          }}
        >
          Nächster Schritt
        </Button>
      ) : null}
    </div>
  );
}

function teilAusGenerator(skillId: string, seed: number, partId: string, variant?: string) {
  const g = generatorFuer(skillId);
  if (!g) throw new Error(`Generator ${skillId} fehlt`);
  const p = g.generate(createRng(seed), variant ? { variant } : {});
  const sol = g.solve(p);
  const parts = g.parts(p, sol);
  const part = parts.find((x) => x.id === partId);
  if (!part) throw new Error(`Teil ${partId} fehlt`);
  return { g, p, part, variants: g.errorVariants(p), text: g.render(p, FIRMA) };
}

function Luecke({ s, onDone }: { s: Extract<Screen, { typ: 'luecke' }>; onDone: Done }) {
  const { part, variants, text } = useMemo(
    () => teilAusGenerator(s.skillId, s.seed, s.partId, s.variant),
    [s],
  );
  const kette = part as RechenkettePart;
  const gegeben = kette.felder.filter((f) => !s.gefragt.includes(f.id));
  const gefragt: RechenkettePart = {
    ...kette,
    felder: kette.felder.filter((f) => s.gefragt.includes(f.id)),
  };
  const [werte, setWerte] = useState<FeldWerte>({});
  const [result, setResult] = useState<PartResult | null>(null);
  const [aufgedeckt, setAufgedeckt] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Chip tone="accent">Jetzt du</Chip>
        <h2 className="mt-2 text-xl font-semibold">{s.titel}</h2>
        <p className="mt-1 text-[15px] text-muted">{s.text}</p>
      </div>
      <Card className="bg-surface-2">
        {text.sachverhalt.map((t, i) => (
          <p key={i} className="text-[15px]">
            {t}
          </p>
        ))}
      </Card>
      {gegeben.length > 0 ? (
        <dl className="num grid grid-cols-2 gap-2 text-sm">
          {gegeben.map((f) => (
            <div key={f.id} className="rounded-lg bg-surface-2 px-3 py-2">
              <dt className="text-muted">{f.label}</dt>
              <dd className="font-semibold">{formatSoll(f)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <RechenketteInput
        part={gefragt}
        werte={werte}
        onChange={setWerte}
        result={result ?? undefined}
        revealed={aufgedeckt}
        disabled={result !== null && (result.korrekt || aufgedeckt)}
      />
      {result ? <PartFeedback result={result} /> : null}
      {!result || (!result.korrekt && !aufgedeckt) ? (
        <div className="flex gap-2">
          <Button
            variant="primary"
            disabled={felderVon(gefragt).some((f) => !(werte[f.id] ?? '').trim())}
            onClick={() => {
              const r = checkPart(gefragt, { typ: 'felder', werte }, variants);
              if (result === null) onDone(r.korrekt);
              setResult(r);
            }}
          >
            Prüfen
          </Button>
          {result && !result.korrekt ? (
            <Button onClick={() => setAufgedeckt(true)}>Lösung zeigen</Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Entscheidung({
  s,
  onDone,
}: {
  s: Extract<Screen, { typ: 'entscheidung' }>;
  onDone: Done;
}) {
  const [wahl, setWahl] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Chip tone="accent">Du entscheidest</Chip>
        <h2 className="mt-2 text-xl font-semibold">{s.frage}</h2>
      </div>
      {s.figur ? <Sprechblase s={s.figur} /> : null}
      <div className="flex flex-col gap-2">
        {s.optionen.map((o, i) => (
          <button
            key={o.text}
            type="button"
            disabled={wahl !== null}
            onClick={() => {
              setWahl(i);
              onDone(o.empfohlen === true);
            }}
            className={cx(
              'min-h-12 rounded-xl border-2 px-4 py-3 text-left text-[15px]',
              wahl === i
                ? 'border-accent bg-accent-soft font-medium'
                : 'border-line-strong bg-surface hover:bg-surface-2',
              wahl !== null && wahl !== i && 'opacity-70',
            )}
          >
            {o.text}
          </button>
        ))}
      </div>
      {wahl !== null ? (
        <div className="einblenden flex flex-col gap-2">
          <Erklaerung text={s.optionen[wahl]!.folge} titel="Das passiert" />
          {s.optionen
            .filter((_, i) => i !== wahl)
            .map((o) => (
              <div
                key={o.text}
                className="rounded-xl border border-dashed border-line-strong p-3 text-sm"
              >
                <div className="font-semibold text-muted">
                  Und wenn du „{o.text}“ gewählt hättest?
                </div>
                <p className="mt-0.5">{o.folge}</p>
              </div>
            ))}
          <p className="text-[15px] font-medium">{s.fazit}</p>
        </div>
      ) : null}
    </div>
  );
}

function Verstaendnis({
  s,
  onDone,
}: {
  s: Extract<Screen, { typ: 'verstaendnis' }>;
  onDone: Done;
}) {
  const [wahl, setWahl] = useState<number | null>(null);
  const o = wahl !== null ? s.optionen[wahl] : undefined;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Chip tone="accent">Verständnisfrage</Chip>
        <h2 className="mt-2 text-xl font-semibold">{s.frage}</h2>
      </div>
      {s.figur ? <Sprechblase s={s.figur} /> : null}
      <OptionenWahl
        optionen={s.optionen}
        gewaehlt={wahl}
        zeigeAuswertung={wahl !== null}
        onWahl={(i) => {
          setWahl(i);
          onDone(s.optionen[i]?.richtig === true);
        }}
      />
      {o ? (
        <Erklaerung
          richtig={o.richtig === true}
          text={o.erklaerung ?? (o.richtig ? 'Genau.' : 'Schau dir die richtige Antwort an.')}
        />
      ) : null}
    </div>
  );
}

function Merksatz({ s }: { s: Extract<Screen, { typ: 'merksatz' }> }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rotate-[-0.8deg] rounded-xl border-2 border-[color:var(--peep-ink)] bg-[#fdf4c9] p-5 text-[#1d1a17] shadow-[0_4px_0_rgba(0,0,0,0.12)]">
        <div className="hand text-sm font-bold tracking-wide uppercase opacity-70">Merksatz</div>
        <p className="hand mt-2 text-[19px] leading-snug font-semibold">{s.text}</p>
      </div>
      <p className="text-sm text-muted">
        Diesen Merksatz bekommst du später als Karte in deiner Wiederholung.
      </p>
      {s.figur ? <Sprechblase s={s.figur} /> : null}
    </div>
  );
}

function leereAntwort(part: TaskPart): PartAnswer {
  if (part.typ === 'buchungssatz')
    return { typ: 'buchung', saetze: leereSaetze(part.loesung.saetze.length) };
  if (part.typ === 'mc' || part.typ === 'aufgabe-erkennen') return { typ: 'wahl', optionId: '' };
  return { typ: 'felder', werte: {} };
}

function Klausur({ s, onDone }: { s: Extract<Screen, { typ: 'klausur' }>; onDone: Done }) {
  const { part, variants, sachverhalt } = useMemo(() => {
    if ('typ' in s.part) return { part: s.part, variants: [], sachverhalt: [] as string[] };
    const t = teilAusGenerator(s.part.skillId, s.part.seed, s.part.partId, s.part.variant);
    return { part: t.part, variants: t.variants, sachverhalt: t.text.sachverhalt };
  }, [s]);
  const [antwort, setAntwort] = useState<PartAnswer>(() => leereAntwort(part));
  const [result, setResult] = useState<PartResult | null>(null);
  const [aufgedeckt, setAufgedeckt] = useState(false);
  const fertig = result !== null && (result.korrekt || aufgedeckt);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2">
          <Chip tone="accent">So kommt das in der Klausur</Chip>
          <Chip>{s.punkte} Punkte</Chip>
        </div>
        {sachverhalt.map((t, i) => (
          <p key={i} className="mt-2 text-[15px]">
            {t}
          </p>
        ))}
        <p className="mt-2 text-[15px] font-medium">{s.aufgabe}</p>
      </div>
      <Card>
        {part.typ === 'rechenkette' ? (
          <RechenketteInput
            part={part}
            werte={(antwort as { werte: FeldWerte }).werte ?? {}}
            onChange={(w) => setAntwort({ typ: 'felder', werte: w })}
            result={result ?? undefined}
            revealed={aufgedeckt}
            disabled={fertig}
          />
        ) : part.typ === 'tabelle' ? (
          <TabelleInput
            part={part}
            werte={(antwort as { werte: FeldWerte }).werte ?? {}}
            onChange={(w) => setAntwort({ typ: 'felder', werte: w })}
            result={result ?? undefined}
            revealed={aufgedeckt}
            disabled={fertig}
          />
        ) : part.typ === 'buchungssatz' ? (
          <BuchungssatzBuilder
            part={part}
            saetze={(antwort as { saetze: SatzEingabe[] }).saetze}
            onChange={(x) => setAntwort({ typ: 'buchung', saetze: x })}
            result={result ?? undefined}
            revealed={aufgedeckt}
            disabled={fertig}
          />
        ) : (
          <WahlInput
            part={part}
            value={(antwort as { optionId: string }).optionId}
            onChange={(id) => setAntwort({ typ: 'wahl', optionId: id })}
            result={result ?? undefined}
            disabled={fertig}
          />
        )}
        {result ? (
          <div className="mt-4">
            <PartFeedback result={result} />
          </div>
        ) : null}
      </Card>
      {!fertig ? (
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => {
              const r = checkPart(part, antwort, variants);
              if (result === null) onDone(r.korrekt);
              setResult(r);
            }}
          >
            {result ? 'Erneut prüfen' : 'Prüfen'}
          </Button>
          {result && !result.korrekt ? (
            <Button onClick={() => setAufgedeckt(true)}>Lösung zeigen</Button>
          ) : null}
        </div>
      ) : (
        <div className="einblenden flex flex-col gap-2">
          <div className="text-xs font-semibold tracking-wide text-muted uppercase">Und dann …</div>
          <Sprechblase s={s.cliffhanger} />
        </div>
      )}
    </div>
  );
}

/** Bildschirme ohne Interaktion gelten sofort als erledigt. */
export function istSofortErledigt(s: Screen): boolean {
  return s.typ === 'raetsel' || s.typ === 'dialog' || s.typ === 'konzept' || s.typ === 'merksatz';
}

export function ScreenView({ s, onDone }: { s: Screen; onDone: Done }) {
  switch (s.typ) {
    case 'raetsel':
      return <Raetsel s={s} />;
    case 'dialog':
      return <Dialog s={s} />;
    case 'konzept':
      return <Konzept s={s} />;
    case 'erkunden':
      return <ErkundenScreen s={s} onDone={onDone} />;
    case 'vorhersage':
      return <Vorhersage s={s} onDone={onDone} />;
    case 'sortieren':
      return <Sortieren s={s} onDone={onDone} />;
    case 'wer-hat-recht':
      return <WerHatRecht s={s} onDone={onDone} />;
    case 'fehlerjagd':
      return <Fehlerjagd s={s} onDone={onDone} />;
    case 'vorgerechnet':
      return <Vorgerechnet s={s} onDone={onDone} />;
    case 'luecke':
      return <Luecke s={s} onDone={onDone} />;
    case 'entscheidung':
      return <Entscheidung s={s} onDone={onDone} />;
    case 'verstaendnis':
      return <Verstaendnis s={s} onDone={onDone} />;
    case 'merksatz':
      return <Merksatz s={s} />;
    case 'klausur':
      return <Klausur s={s} onDone={onDone} />;
  }
}
