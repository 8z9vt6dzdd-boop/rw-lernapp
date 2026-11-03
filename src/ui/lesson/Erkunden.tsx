// Erkunden-Bildschirme: etwas verändern und die Wirkung sofort sehen (09-lektionen.md, Typ 4).
import { useMemo, useState } from 'react';
import type { Erkunden } from '../../content/lessons/types';
import { Decimal, formatEuro, formatProzent, round } from '../../engine/money';
import { Button, cx } from '../components/ui';
import { spiele } from '../sound';
import { TKonto, type Eintrag } from '../visuals/TKonto';
import { Waage, type Posten } from '../visuals/Waage';
import {
  AFA_NAME,
  AfaVerlauf,
  Kostenfunktion,
  buchwerte,
  type AfaVerfahrenDiagramm,
} from '../visuals/Diagramme';

type Done = (richtig?: boolean) => void;

function WaageZuordnen({
  e,
  onDone,
}: {
  e: Extract<Erkunden, { art: 'waage-zuordnen' }>;
  onDone: Done;
}) {
  const [platz, setPlatz] = useState<Record<number, 'links' | 'rechts'>>({});
  const [fertig, setFertig] = useState(false);
  const links: Posten[] = [...(e.start?.links ?? [])];
  const rechts: Posten[] = [...(e.start?.rechts ?? [])];
  e.posten.forEach((p, i) => {
    const s = platz[i];
    if (s === 'links') links.push({ ...p, neu: true });
    if (s === 'rechts') rechts.push({ ...p, neu: true });
  });
  const alleGesetzt = e.posten.every((_, i) => platz[i]);
  const alleRichtig = e.posten.every((p, i) => platz[i] === p.seite);
  return (
    <div className="flex flex-col gap-4">
      <Waage links={links} rechts={rechts} />
      <div className="flex flex-col gap-2">
        {e.posten.map((p, i) => (
          <div
            key={p.text}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2"
          >
            <span className="text-[15px]">
              {p.text}
              {p.betrag ? (
                <span className="num text-muted"> · {formatEuro(p.betrag, 0)}</span>
              ) : null}
            </span>
            <div className="flex gap-1" role="radiogroup" aria-label={`Seite für ${p.text}`}>
              {(['links', 'rechts'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={platz[i] === s}
                  disabled={fertig}
                  onClick={() => setPlatz({ ...platz, [i]: s })}
                  className={cx(
                    'min-h-10 rounded-lg border px-3 text-sm',
                    platz[i] === s
                      ? 'border-accent bg-accent-soft font-medium text-accent'
                      : 'border-line-strong bg-surface',
                  )}
                >
                  {s === 'links' ? 'links' : 'rechts'}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {alleGesetzt && !alleRichtig ? (
        <p className="rounded-lg bg-warn-soft p-3 text-sm text-warn">
          Die Waage kippt. Frag dich bei jedem Posten: Haben wir das – oder kommt daher das Geld?
        </p>
      ) : null}
      {alleGesetzt && alleRichtig && !fertig ? (
        <Button
          variant="primary"
          onClick={() => {
            setFertig(true);
            onDone(true);
          }}
        >
          Passt – die Waage ist im Gleichgewicht
        </Button>
      ) : null}
    </div>
  );
}

function bilanzNach(e: Extract<Erkunden, { art: 'geschaeftsvorfall' }>, schritte: number) {
  const seiten = {
    links: e.start.links.map((p) => ({ ...p })),
    rechts: e.start.rechts.map((p) => ({ ...p })),
  };
  e.vorfaelle.slice(0, schritte).forEach((v, vi) => {
    for (const a of v.aenderungen) {
      const liste = seiten[a.seite];
      const p = liste.find((x) => x.text === a.text);
      const neu = vi === schritte - 1;
      if (p) {
        p.betrag = new Decimal(p.betrag ?? 0).plus(a.delta).toString();
        p.neu = neu;
      } else liste.push({ text: a.text, betrag: new Decimal(a.delta).toString(), neu });
    }
  });
  for (const s of ['links', 'rechts'] as const)
    seiten[s] = seiten[s].filter((p) => !new Decimal(p.betrag ?? 0).isZero());
  return seiten;
}

function Geschaeftsvorfall({
  e,
  onDone,
}: {
  e: Extract<Erkunden, { art: 'geschaeftsvorfall' }>;
  onDone: Done;
}) {
  const [schritte, setSchritte] = useState(0);
  const b = useMemo(() => bilanzNach(e, schritte), [e, schritte]);
  const aktuell = e.vorfaelle[schritte - 1];
  const naechster = e.vorfaelle[schritte];
  return (
    <div className="flex flex-col gap-4">
      <Waage links={b.links} rechts={b.rechts} />
      {aktuell ? (
        <div
          className="einblenden rounded-lg border border-line bg-surface-2 p-3 text-[15px]"
          key={schritte}
        >
          <div className="font-medium">{aktuell.text}</div>
          <ul className="num mt-1 text-sm text-muted">
            {aktuell.aenderungen.map((a) => (
              <li key={a.text}>
                {a.seite === 'links' ? 'links' : 'rechts'}: {a.text}{' '}
                {new Decimal(a.delta).isNegative() ? '−' : '+'}
                {formatEuro(new Decimal(a.delta).abs(), 0)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {naechster ? (
        <div className="flex flex-col gap-2 rounded-lg border-2 border-dashed border-accent p-3">
          <div className="text-sm text-muted">
            Vorfall {schritte + 1} von {e.vorfaelle.length}
          </div>
          <div className="font-medium">{naechster.text}</div>
          <Button
            variant="primary"
            onClick={() => {
              setSchritte(schritte + 1);
              if (schritte + 1 === e.vorfaelle.length) onDone(true);
            }}
          >
            Vorfall buchen
          </Button>
        </div>
      ) : (
        <p className="text-sm font-medium text-ok">
          Alle Vorfälle gebucht – und die Waage steht immer noch gerade.
        </p>
      )}
    </div>
  );
}

function TkontoBuchen({
  e,
  onDone,
}: {
  e: Extract<Erkunden, { art: 'tkonto-buchen' }>;
  onDone: Done;
}) {
  const [n, setN] = useState(0);
  const [fehler, setFehler] = useState(false);
  const [fehlerZahl, setFehlerZahl] = useState(0);
  const soll: Eintrag[] = [];
  const haben: Eintrag[] = [];
  if (e.anfang)
    (e.anfang.seite === 'soll' ? soll : haben).push({
      text: e.anfang.text,
      betrag: e.anfang.betrag,
    });
  e.vorgaenge.slice(0, n).forEach((v, i) =>
    (v.seite === 'soll' ? soll : haben).push({
      text: v.text,
      betrag: v.betrag,
      neu: i === n - 1,
    }),
  );
  const aktuell = e.vorgaenge[n];
  const waehle = (seite: 'soll' | 'haben') => {
    if (!aktuell) return;
    if (seite === aktuell.seite) {
      spiele('klack');
      setFehler(false);
      setN(n + 1);
      if (n + 1 === e.vorgaenge.length) onDone(fehlerZahl === 0);
    } else {
      setFehler(true);
      setFehlerZahl(fehlerZahl + 1);
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <TKonto name={e.konto} soll={soll} haben={haben} saldo={!aktuell} />
      </div>
      {aktuell ? (
        <div className="rounded-lg border border-line bg-surface-2 p-3">
          <div className="text-sm text-muted">
            Vorgang {n + 1} von {e.vorgaenge.length}
          </div>
          <div className="num font-medium">
            {aktuell.text}: {formatEuro(aktuell.betrag)}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button onClick={() => waehle('soll')}>← Soll (links)</Button>
            <Button onClick={() => waehle('haben')}>Haben (rechts) →</Button>
          </div>
          {fehler ? (
            <p className="mt-2 text-sm text-warn">
              Andere Seite: Beim Konto {e.konto} stehen Anfangsbestand und Zugänge auf einer Seite,
              Abgänge auf der anderen.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm font-medium text-ok">
          Fertig! Der Saldo ist der Betrag, der am Ende noch auf dem Konto steht.
        </p>
      )}
    </div>
  );
}

function SkontoRegler({
  e,
  onDone,
}: {
  e: Extract<Erkunden, { art: 'skonto-regler' }>;
  onDone: Done;
}) {
  const [satz, setSatz] = useState(0);
  const [bewegt, setBewegt] = useState(false);
  const s = new Decimal(satz).div(1000);
  const brutto = new Decimal(e.brutto);
  const ersparnis = round(brutto.times(s));
  const zahlbetrag = brutto.minus(ersparnis);
  const tage = e.zieltage - e.skontotage;
  const jahreszins = s.isZero()
    ? null
    : s.div(new Decimal(1).minus(s)).times(360).div(tage).times(100);
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm text-muted">Skontosatz</span>
        <input
          type="range"
          min={0}
          max={30}
          step={5}
          value={satz}
          onChange={(ev) => {
            setSatz(Number(ev.target.value));
            if (!bewegt) {
              setBewegt(true);
              onDone();
            }
          }}
          className="w-full accent-[color:var(--accent)]"
          aria-valuetext={formatProzent(s)}
        />
        <span className="num text-center text-2xl font-semibold">{formatProzent(s, 1)}</span>
      </label>
      <dl className="num grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-surface-2 p-3">
          <dt className="text-xs text-muted">Ersparnis</dt>
          <dd className="text-lg font-semibold text-ok">{formatEuro(ersparnis)}</dd>
        </div>
        <div className="rounded-lg bg-surface-2 p-3">
          <dt className="text-xs text-muted">Zahlbetrag</dt>
          <dd className="text-lg font-semibold">{formatEuro(zahlbetrag)}</dd>
        </div>
      </dl>
      <p className="text-sm text-muted">
        {jahreszins
          ? `Du zahlst ${tage} Tage früher. Aufs Jahr hochgerechnet entspricht das einem Zins von rund ${jahreszins.toFixed(0)} %.`
          : 'Schieb den Regler: Wie viel spart die MBG bei schneller Zahlung?'}
      </p>
    </div>
  );
}

function Aufdecken({ e, onDone }: { e: Extract<Erkunden, { art: 'aufdecken' }>; onDone: Done }) {
  const [offen, setOffen] = useState<Set<number>>(new Set());
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {e.karten.map((k, i) => {
        const auf = offen.has(i);
        return (
          <button
            key={k.titel}
            type="button"
            aria-expanded={auf}
            onClick={() => {
              const next = new Set(offen).add(i);
              setOffen(next);
              if (next.size === e.karten.length) onDone();
            }}
            className="min-h-28 rounded-xl border-2 border-[color:var(--peep-ink)] bg-[color:var(--peep-paper)] p-3 text-left text-[color:var(--peep-ink)] transition-transform active:scale-[0.98]"
            style={{ borderTopColor: k.farbe, borderTopWidth: 6 }}
          >
            <div className="hand font-bold">{k.titel}</div>
            {auf ? (
              <p className="einblenden mt-1 text-sm">{k.text}</p>
            ) : (
              <p className="mt-1 text-sm opacity-60">Antippen zum Aufdecken</p>
            )}
          </button>
        );
      })}
    </div>
  );
}

function AfaVergleich({
  e,
  onDone,
}: {
  e: Extract<Erkunden, { art: 'afa-vergleich' }>;
  onDone: Done;
}) {
  const alle: AfaVerfahrenDiagramm[] = ['linear', 'arithmetisch', 'geometrisch'];
  const [an, setAn] = useState<AfaVerfahrenDiagramm[]>(['linear']);
  const [gesehen, setGesehen] = useState<Set<AfaVerfahrenDiagramm>>(new Set(['linear']));
  const umschalten = (v: AfaVerfahrenDiagramm) => {
    const next = an.includes(v) ? an.filter((x) => x !== v) : [...an, v];
    setAn(next.length ? next : [v]);
    const g = new Set(gesehen).add(v);
    setGesehen(g);
    if (g.size === alle.length) onDone();
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Verfahren ein- und ausblenden">
        {alle.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={an.includes(v)}
            onClick={() => umschalten(v)}
            className={cx(
              'min-h-10 rounded-lg border px-3 text-sm',
              an.includes(v)
                ? 'border-accent bg-accent-soft font-medium text-accent'
                : 'border-line-strong bg-surface',
            )}
          >
            {AFA_NAME[v]}
          </button>
        ))}
      </div>
      <AfaVerlauf basis={e.basis} restwert={e.restwert} nd={e.nd} verfahren={an} satz={e.satz} />
      <table className="num w-full text-sm">
        <thead>
          <tr className="text-xs text-muted">
            <th className="text-left font-medium">Abschreibung</th>
            {an.map((v) => (
              <th key={v} className="text-right font-medium">
                {AFA_NAME[v]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3].map((t) => (
            <tr key={t} className="border-t border-line">
              <td>Jahr {t}</td>
              {an.map((v) => {
                const bw = buchwerte(v, e.basis, e.restwert, e.nd, e.satz);
                return (
                  <td key={v} className="text-right">
                    {formatEuro(bw[t - 1]!.minus(bw[t]!))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KostenfunktionRegler({
  e,
  onDone,
}: {
  e: Extract<Erkunden, { art: 'kostenfunktion' }>;
  onDone: Done;
}) {
  const [x, setX] = useState(Math.round(e.xmax / 4));
  const [bewegt, setBewegt] = useState(false);
  const erloes = new Decimal(e.preis).times(x);
  const kosten = new Decimal(e.kf).plus(new Decimal(e.kv).times(x));
  const ergebnis = erloes.minus(kosten);
  const schritt = Math.max(1, Math.round(e.xmax / 100));
  return (
    <div className="flex flex-col gap-3">
      <Kostenfunktion preis={e.preis} kv={e.kv} kf={e.kf} xmax={e.xmax} x={x} einheit={e.einheit} />
      <label className="flex flex-col gap-1">
        <span className="num text-sm text-muted">
          Absatzmenge: {x.toLocaleString('de-DE')} {e.einheit ?? 'Stück'}
        </span>
        <input
          type="range"
          min={0}
          max={e.xmax}
          step={schritt}
          value={x}
          onChange={(ev) => {
            setX(Number(ev.target.value));
            if (!bewegt) {
              setBewegt(true);
              onDone();
            }
          }}
          className="w-full accent-[color:var(--accent)]"
        />
      </label>
      <dl className="num grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg bg-surface-2 p-2">
          <dt className="text-xs text-muted">Erlöse</dt>
          <dd className="font-semibold">{formatEuro(erloes, 0)}</dd>
        </div>
        <div className="rounded-lg bg-surface-2 p-2">
          <dt className="text-xs text-muted">Kosten</dt>
          <dd className="font-semibold">{formatEuro(kosten, 0)}</dd>
        </div>
        <div
          className={cx('rounded-lg p-2', ergebnis.isNegative() ? 'bg-warn-soft' : 'bg-ok-soft')}
        >
          <dt className="text-xs text-muted">Ergebnis</dt>
          <dd className="font-semibold">{formatEuro(ergebnis, 0)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function ErkundenView({ e, onDone }: { e: Erkunden; onDone: Done }) {
  switch (e.art) {
    case 'waage-zuordnen':
      return <WaageZuordnen e={e} onDone={onDone} />;
    case 'geschaeftsvorfall':
      return <Geschaeftsvorfall e={e} onDone={onDone} />;
    case 'tkonto-buchen':
      return <TkontoBuchen e={e} onDone={onDone} />;
    case 'skonto-regler':
      return <SkontoRegler e={e} onDone={onDone} />;
    case 'aufdecken':
      return <Aufdecken e={e} onDone={onDone} />;
    case 'afa-vergleich':
      return <AfaVergleich e={e} onDone={onDone} />;
    case 'kostenfunktion':
      return <KostenfunktionRegler e={e} onDone={onDone} />;
  }
}
