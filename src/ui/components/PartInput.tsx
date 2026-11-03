// Einheitliche Eingabe für alle Aufgabenteile (Kurzmodus, Lektion, Fall, Klausur).
import { getKonto } from '../../engine/accounts';
import type {
  FehlerFindenPart,
  GleichungPart,
  KurzantwortPart,
  PartAnswer,
  PartResult,
  SatzEingabe,
  TaskPart,
  TKontoPart,
} from '../../engine/task';
import { TKonto } from '../visuals/TKonto';
import { BuchungssatzBuilder, leereSaetze } from './Buchungssatz';
import { RechenketteInput, TabelleInput, ZahlEingabe, type FeldWerte } from './Felder';
import { StatusIcon, cx } from './ui';
import { WahlInput } from './Wahl';

export function leereAntwort(part: TaskPart): PartAnswer {
  switch (part.typ) {
    case 'buchungssatz':
      return { typ: 'buchung', saetze: leereSaetze(part.loesung.saetze.length) };
    case 'mc':
    case 'aufgabe-erkennen':
      return { typ: 'wahl', optionId: '' };
    case 'fehler-finden':
      return { typ: 'fehler', zeile: null, grundId: '' };
    case 'kurzantwort':
      return { typ: 'kurzantwort', text: '', abgehakt: [] };
    default:
      return { typ: 'felder', werte: {} };
  }
}

export function istLeer(a: PartAnswer): boolean {
  switch (a.typ) {
    case 'wahl':
      return a.optionId === '';
    case 'felder':
      return Object.values(a.werte).every((v) => v.trim() === '');
    case 'buchung':
      return a.saetze.every((s) =>
        [...s.soll, ...s.haben].every((z) => !z.konto && !z.betrag.trim()),
      );
    case 'fehler':
      return a.zeile === null || a.grundId === '';
    case 'kurzantwort':
      return a.text.trim().length < 10;
  }
}

function TKontoInput({
  part,
  werte,
  onChange,
  result,
  revealed,
  disabled,
}: {
  part: TKontoPart;
  werte: FeldWerte;
  onChange: (w: FeldWerte) => void;
  result?: PartResult | undefined;
  revealed: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <TKonto name={getKonto(part.konto).kurz} soll={part.soll} haben={part.haben} />
      </div>
      <RechenketteInput
        part={{ typ: 'rechenkette', id: part.id, titel: part.titel, felder: part.felder }}
        werte={werte}
        onChange={onChange}
        result={result}
        revealed={revealed}
        disabled={disabled}
      />
    </div>
  );
}

function GleichungInput({
  part,
  werte,
  onChange,
  result,
  revealed,
  disabled,
}: {
  part: GleichungPart;
  werte: FeldWerte;
  onChange: (w: FeldWerte) => void;
  result?: PartResult | undefined;
  revealed: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {part.zeilen.map((z) => (
        <div key={z.label} className="rounded-lg border border-line bg-surface-2/50 p-3">
          <div className="mb-2 text-sm font-semibold">{z.label}</div>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
            {z.terme.map((t, i) =>
              t.typ === 'text' ? (
                <span key={i} className="num text-[15px]">
                  {t.text}
                </span>
              ) : t.feld ? (
                <span key={i} className="w-28">
                  <ZahlEingabe
                    feld={t.feld}
                    compact
                    value={werte[t.feld.id] ?? ''}
                    onChange={(v) => onChange({ ...werte, [t.feld!.id]: v })}
                    bewertung={result?.felder?.[t.feld.id]?.bewertung}
                    disabled={disabled}
                    revealed={revealed}
                  />
                </span>
              ) : null,
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function FehlerFindenInput({
  part,
  value,
  onChange,
  result,
  disabled,
}: {
  part: FehlerFindenPart;
  value: { zeile: number | null; grundId: string };
  onChange: (v: { zeile: number | null; grundId: string }) => void;
  result?: PartResult | undefined;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[15px] font-medium">{part.frage}</p>
      <ol className="flex flex-col gap-1.5">
        {part.zeilen.map((z, i) => {
          const zeigeRichtig = result && i === part.fehlerZeile;
          const zeigeFalsch = result && value.zeile === i && i !== part.fehlerZeile;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={disabled}
                aria-pressed={value.zeile === i}
                onClick={() => onChange({ ...value, zeile: i })}
                className={cx(
                  'num flex w-full items-center justify-between gap-2 rounded-lg border-2 px-3 py-2 text-left text-[15px]',
                  zeigeRichtig
                    ? 'border-ok bg-ok-soft'
                    : zeigeFalsch
                      ? 'border-err bg-err-soft'
                      : value.zeile === i
                        ? 'border-senf bg-warn-soft'
                        : 'border-line bg-surface',
                )}
              >
                <span>
                  {i + 1}. {z}
                </span>
                {zeigeRichtig ? (
                  <StatusIcon status="richtig" />
                ) : zeigeFalsch ? (
                  <StatusIcon status="falsch" />
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
      <div role="radiogroup" aria-label="Begründung" className="flex flex-col gap-2">
        <span className="text-sm font-medium">Was ist daran falsch?</span>
        {part.gruende.map((g) => (
          <button
            key={g.id}
            type="button"
            role="radio"
            aria-checked={value.grundId === g.id}
            disabled={disabled}
            onClick={() => onChange({ ...value, grundId: g.id })}
            className={cx(
              'min-h-11 rounded-lg border px-3 py-2 text-left text-[15px]',
              result && g.richtig
                ? 'border-ok bg-ok-soft'
                : result && value.grundId === g.id
                  ? 'border-err bg-err-soft'
                  : value.grundId === g.id
                    ? 'border-accent bg-accent-soft'
                    : 'border-line-strong bg-surface',
            )}
          >
            {g.text}
          </button>
        ))}
      </div>
    </div>
  );
}

function KurzantwortInput({
  part,
  value,
  onChange,
  nachPruefung,
  disabled,
}: {
  part: KurzantwortPart;
  value: { text: string; abgehakt: number[] };
  onChange: (v: { text: string; abgehakt: number[] }) => void;
  nachPruefung: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[15px] font-medium">
        {part.frage} <span className="text-muted">({part.punkte} Punkte)</span>
      </p>
      <textarea
        aria-label="Deine Antwort"
        value={value.text}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
        rows={5}
        className="w-full rounded-lg border border-line-strong bg-surface p-3 text-[15px]"
        placeholder="Antworte in eigenen Worten, in ganzen Sätzen."
      />
      <div className="rounded-lg border border-line bg-surface-2 p-3">
        <div className="text-sm font-semibold">Hake ab, was deine Antwort enthält:</div>
        <ul className="mt-2 flex flex-col gap-2">
          {part.checkliste.map((c, i) => (
            <li key={i}>
              <label className="flex items-start gap-2 text-[15px]">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 accent-[color:var(--accent)]"
                  checked={value.abgehakt.includes(i)}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      abgehakt: e.target.checked
                        ? [...value.abgehakt, i]
                        : value.abgehakt.filter((x) => x !== i),
                    })
                  }
                />
                <span>
                  {c.aussage} <span className="num text-muted">({c.punkte} P.)</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        {nachPruefung ? (
          <p className="mt-3 border-t border-line pt-2 text-sm">
            <span className="font-semibold">Musterantwort:</span> {part.muster}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PartInhalt({
  part,
  antwort,
  onChange,
  result,
  revealed,
  disabled,
}: {
  part: TaskPart;
  antwort: PartAnswer;
  onChange: (a: PartAnswer) => void;
  result?: PartResult | undefined;
  revealed: boolean;
  disabled: boolean;
}) {
  const werte = antwort.typ === 'felder' ? antwort.werte : {};
  const setWerte = (w: FeldWerte) => onChange({ typ: 'felder', werte: w });
  switch (part.typ) {
    case 'rechenkette':
      return (
        <RechenketteInput
          part={part}
          werte={werte}
          onChange={setWerte}
          result={result}
          revealed={revealed}
          disabled={disabled}
        />
      );
    case 'tabelle':
      return (
        <TabelleInput
          part={part}
          werte={werte}
          onChange={setWerte}
          result={result}
          revealed={revealed}
          disabled={disabled}
        />
      );
    case 'tkonto':
      return (
        <TKontoInput
          part={part}
          werte={werte}
          onChange={setWerte}
          result={result}
          revealed={revealed}
          disabled={disabled}
        />
      );
    case 'gleichungssystem':
      return (
        <GleichungInput
          part={part}
          werte={werte}
          onChange={setWerte}
          result={result}
          revealed={revealed}
          disabled={disabled}
        />
      );
    case 'buchungssatz':
      return (
        <BuchungssatzBuilder
          part={part}
          saetze={antwort.typ === 'buchung' ? antwort.saetze : ([] as SatzEingabe[])}
          onChange={(s) => onChange({ typ: 'buchung', saetze: s })}
          result={result}
          revealed={revealed}
          disabled={disabled}
        />
      );
    case 'fehler-finden':
      return (
        <FehlerFindenInput
          part={part}
          value={antwort.typ === 'fehler' ? antwort : { zeile: null, grundId: '' }}
          onChange={(v) => onChange({ typ: 'fehler', ...v })}
          result={result}
          disabled={disabled}
        />
      );
    case 'kurzantwort':
      return (
        <KurzantwortInput
          part={part}
          value={antwort.typ === 'kurzantwort' ? antwort : { text: '', abgehakt: [] }}
          onChange={(v) => onChange({ typ: 'kurzantwort', ...v })}
          nachPruefung={result !== undefined || revealed}
          disabled={disabled}
        />
      );
    case 'mc':
    case 'aufgabe-erkennen':
      return (
        <WahlInput
          part={part}
          value={antwort.typ === 'wahl' ? antwort.optionId : ''}
          onChange={(id) => onChange({ typ: 'wahl', optionId: id })}
          result={result}
          disabled={disabled}
        />
      );
  }
}

/** Eingabe für einen Aufgabenteil; `data-part` erlaubt gezielte Tests bei mehreren Teilen auf einer Seite. */
export function PartInput(props: Parameters<typeof PartInhalt>[0]) {
  return (
    <div data-part={props.part.id} className="min-w-0">
      <PartInhalt {...props} />
    </div>
  );
}
