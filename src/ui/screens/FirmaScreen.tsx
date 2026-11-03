// Firma: Dashboard der MBG (Lernversion) – Zeitleiste des Geschäftsjahrs, Bilanz und GuV wachsen
// mit jedem abgeschlossenen Abschnitt, Controlling-Kennzahlen aus der Kostenrechnung. Darunter der Steckbrief.
import { useMemo } from 'react';
import { FIRMA } from '../../config';
import { ABSCHNITTE } from '../../content/curriculum';
import { getKonto } from '../../engine/accounts';
import { klrFall } from '../../engine/faelle/klr-fall';
import type { ZahlFeld } from '../../engine/task';
import { mbgJahr } from '../../engine/mbg-jahr';
import { formatEuro, formatNumber, type Dec } from '../../engine/money';
import { knotenFuer } from '../../learning/fortschritt';
import type { LernEreignis } from '../../learning/types';
import { Card, Chip, cx } from '../components/ui';
import { useEvents } from '../hooks';

type KapitelStatus = 'erledigt' | 'laeuft' | 'offen';

function kapitelStatus(events: readonly LernEreignis[]): Map<string, KapitelStatus> {
  const m = new Map<string, KapitelStatus>();
  for (const a of ABSCHNITTE) {
    const k = knotenFuer(events, a).filter((x) => x.status !== 'bald');
    const fertig = k.filter((x) => x.status === 'erledigt').length;
    m.set(a.id, k.length > 0 && fertig === k.length ? 'erledigt' : fertig > 0 ? 'laeuft' : 'offen');
  }
  return m;
}

function Posten({
  zeilen,
  summe,
  summeLabel,
}: {
  zeilen: { konto: string; betrag: Dec }[];
  summe?: Dec;
  summeLabel?: string;
}) {
  return (
    <table className="num w-full text-sm">
      <tbody>
        {zeilen.map((z) => (
          <tr key={z.konto} className="border-b border-line last:border-0">
            <td className="py-1.5 pr-2">{getKonto(z.konto).kurz}</td>
            <td className="py-1.5 text-right whitespace-nowrap">{formatEuro(z.betrag, 0)}</td>
          </tr>
        ))}
        {summe ? (
          <tr className="border-t-2 border-ink/60 font-semibold">
            <td className="py-1.5 pr-2">{summeLabel ?? 'Summe'}</td>
            <td className="py-1.5 text-right whitespace-nowrap">{formatEuro(summe, 0)}</td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}

function Dashboard({ events }: { events: readonly LernEreignis[] }) {
  const status = useMemo(() => kapitelStatus(events), [events]);
  const erledigt = useMemo(
    () => new Set([...status].filter(([, s]) => s === 'erledigt').map(([id]) => id)),
    [status],
  );
  const jahr = useMemo(() => mbgJahr(erledigt), [erledigt]);
  const klr = useMemo(() => {
    const f = klrFall(2026);
    const werte = (i: number) =>
      (f.schritte[i]!.parts[0] as { felder: ZahlFeld[] }).felder.map((x) => ({
        label: x.label,
        wert: x.soll.value,
        kind: x.kind,
      }));
    return { saetze: werte(1), kalkulation: werte(2) };
  }, []);
  const summeErtrag = jahr.ertrag.reduce(
    (a, x) => a.plus(x.betrag),
    jahr.erfolg.minus(jahr.erfolg),
  );
  const summeAufwand = jahr.aufwand.reduce(
    (a, x) => a.plus(x.betrag),
    jahr.erfolg.minus(jahr.erfolg),
  );
  const buchhaltungFertig = ['A', 'B', 'C', 'D', 'E', 'F'].filter((x) => erledigt.has(x)).length;
  return (
    <>
      <Card>
        <h2 className="font-semibold">Dein Geschäftsjahr</h2>
        <ol className="mt-3 flex flex-col">
          {ABSCHNITTE.map((a) => {
            const st = status.get(a.id) ?? 'offen';
            return (
              <li key={a.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden="true"
                    className={cx(
                      'mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2',
                      st === 'erledigt'
                        ? 'border-lime bg-lime'
                        : st === 'laeuft'
                          ? 'border-senf bg-senf'
                          : 'border-line-strong bg-surface',
                    )}
                  />
                  <span className="w-0.5 flex-1 bg-line" aria-hidden="true" />
                </div>
                <div className="min-w-0 pb-3">
                  <div className="text-[15px] font-medium">{a.kapitel}</div>
                  <div className="text-sm text-muted">
                    {a.id === '0' ? 'Abschnitt 0' : `Abschnitt ${a.id}`}: {a.titel} ·{' '}
                    {st === 'erledigt' ? 'erledigt' : st === 'laeuft' ? 'läuft' : 'offen'}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Bilanz der MBG</h2>
          <Chip>
            {buchhaltungFertig === 0
              ? 'Eröffnungsbilanz'
              : `${buchhaltungFertig} von 6 Buchhaltungskapiteln gebucht`}
          </Chip>
        </div>
        <p className="mt-1 text-sm text-muted">
          Wächst mit jedem abgeschlossenen Abschnitt A bis F. Vorläufig abgeschlossen: Unterkonten,
          Umsatzsteuer und Erfolg sind schon verrechnet.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
              Aktiva
            </h3>
            <Posten zeilen={jahr.aktiva} summe={jahr.summe} />
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
              Passiva
            </h3>
            <Posten zeilen={jahr.passiva} summe={jahr.summe} />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Gewinn- und Verlustrechnung</h2>
        {jahr.aufwand.length + jahr.ertrag.length === 0 ? (
          <p className="mt-1 text-[15px] text-muted">
            Noch keine Erträge und Aufwendungen gebucht. Die ersten kommen mit Abschnitt B.
          </p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
                  Aufwendungen
                </h3>
                <Posten zeilen={jahr.aufwand} summe={summeAufwand} />
              </div>
              <div>
                <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
                  Erträge
                </h3>
                <Posten zeilen={jahr.ertrag} summe={summeErtrag} />
              </div>
            </div>
            <p className="num mt-3 border-t border-line pt-2 text-[15px] font-semibold">
              {jahr.erfolg.gte(0) ? 'Gewinn' : 'Verlust'}: {formatEuro(jahr.erfolg.abs(), 0)}
            </p>
          </>
        )}
        {jahr.vorfaelle.length > 0 ? (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-accent">
              Gebuchte Vorfälle ansehen
            </summary>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {jahr.vorfaelle.map((v, i) => (
                <li key={i}>
                  <span className="text-muted">{v.abschnitt}:</span> {v.text}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </Card>

      <Card>
        <h2 className="font-semibold">Controlling</h2>
        {erledigt.has('I') ? (
          <>
            <h3 className="mt-2 text-sm font-semibold">Zuschlagssätze aus dem BAB</h3>
            <dl className="num mt-1 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
              {klr.saetze.map((x) => (
                <div key={x.label} className="flex justify-between gap-3 border-b border-line py-1">
                  <dt>{x.label}</dt>
                  <dd className="whitespace-nowrap">
                    {x.kind === 'prozent' ? `${formatNumber(x.wert)} %` : formatEuro(x.wert, 0)}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <p className="mt-1 text-[15px] text-muted">
            Mit Abschnitt I erscheinen hier die Zuschlagssätze aus dem BAB der MBG.
          </p>
        )}
        {erledigt.has('J') ? (
          <>
            <h3 className="mt-3 text-sm font-semibold">Kalkulation eines Großauftrags</h3>
            <p className="num mt-1 text-sm">
              Selbstkosten:{' '}
              {formatEuro(klr.kalkulation.find((x) => x.label === 'Selbstkosten')?.wert ?? 0)}
            </p>
          </>
        ) : null}
      </Card>
    </>
  );
}

export function FirmaScreen() {
  const p = FIRMA.produkte;
  const k = FIRMA.kostenstellen;
  const events = useEvents();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{FIRMA.name}</h1>
        <p className="mt-1 text-muted">{FIRMA.ort} · Getränkehersteller · Personengesellschaft</p>
      </div>
      <Card className="border-warn/40 bg-warn-soft">
        <p className="text-[15px]">{FIRMA.hinweisFiktiv}</p>
      </Card>
      {events ? <Dashboard events={events} /> : null}
      <Card>
        <h2 className="font-semibold">Dein Auftrag</h2>
        <p className="mt-1 text-[15px]">
          Du führst ein Geschäftsjahr lang die Buchhaltung und Kostenrechnung der MBG – vom
          Rohstoffeinkauf für die Sommersaison über den Jahresabschluss bis zur Kalkulation neuer
          Sorten.
        </p>
      </Card>
      <Card>
        <h2 className="font-semibold">Produkte</h2>
        <ul className="mt-2 flex flex-col gap-1 text-[15px]">
          <li>{p.energy} – Energydrink in drei Dosengrößen (eigenes Erzeugnis)</li>
          <li>{p.lemon} – Limonade im Glas (eigenes Erzeugnis)</li>
          <li>{p.bier} (eigenes Erzeugnis)</li>
          <li>
            {p.wein} und {p.vodka} – zugekaufte Handelswaren
          </li>
        </ul>
      </Card>
      <Card>
        <h2 className="font-semibold">Kostenstellen</h2>
        <ul className="mt-2 grid gap-1 text-[15px] sm:grid-cols-2">
          <li>{k.energie} (Vorkostenstelle)</li>
          <li>{k.instandhaltung} (Vorkostenstelle)</li>
          <li>{k.material}</li>
          <li>{k.fertigung1}</li>
          <li>{k.fertigung2}</li>
          <li>{k.verwaltung}</li>
          <li>{k.vertrieb}</li>
        </ul>
      </Card>
      <Card>
        <h2 className="font-semibold">Gesellschafter</h2>
        <p className="mt-1 text-[15px]">
          {FIRMA.gesellschafter.join(' und ')} (erfundene Personen)
        </p>
      </Card>
    </div>
  );
}
