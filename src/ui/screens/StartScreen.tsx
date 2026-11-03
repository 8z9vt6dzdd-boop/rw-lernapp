// Startseite (10-optik B4–B7): Serie, Tagesziel, Tagesaufgaben, Karriere, nächste Szene, Klausur-Stand.
import { useMemo, useSyncExternalStore } from 'react';
import { lektionFuerSkill } from '../../content/lessons';
import { skillTitel } from '../../learning/prepare';
import { laptopListe } from '../../learning/ereignisse';
import { naechsterKnoten, readiness } from '../../learning/fortschritt';
import { faellig, karten } from '../../learning/scheduler';
import {
  ZIELE,
  karriere,
  montagVon,
  serie,
  stufe,
  tagKey,
  tagesWerte,
  tagesaufgaben,
  wochenrueckblick,
  xpGesamt,
  zielFortschritt,
} from '../../learning/motivation';
import { saveSettings } from '../../storage/db';
import { Button, Card, Chip, cx } from '../components/ui';
import { Character } from '../figures/Character';
import { Sprechblase } from '../lesson/Sprechblase';
import { navigate, useEvents, useSettings } from '../hooks';

function istIosSafari(): boolean {
  const ua = navigator.userAgent;
  const ios =
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

function istInstalliert(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

const breitQuery = '(min-width: 1024px)';
function useBreit(): boolean {
  return useSyncExternalStore(
    (fn) => {
      const m = window.matchMedia(breitQuery);
      m.addEventListener('change', fn);
      return () => m.removeEventListener('change', fn);
    },
    () => window.matchMedia(breitQuery).matches,
    () => false,
  );
}

/** Gezeichnete Getränkedose, die sich mit dem Tagesziel füllt. */
function Dose({ fuellung, groesse = 64 }: { fuellung: number; groesse?: number }) {
  const h = 70 * Math.max(0, Math.min(1, fuellung));
  return (
    <svg viewBox="0 0 48 90" width={groesse * 0.53} height={groesse} aria-hidden="true">
      <defs>
        <clipPath id="dose-innen">
          <rect x="6" y="12" width="36" height="72" rx="6" />
        </clipPath>
      </defs>
      <rect x="6" y="12" width="36" height="72" rx="6" fill="var(--peep-paper)" />
      <rect
        x="0"
        y={84 - h}
        width="48"
        height={h}
        fill="var(--orange)"
        clipPath="url(#dose-innen)"
        style={{ transition: 'all 0.8s ease-out' }}
      />
      <rect
        x="6"
        y="12"
        width="36"
        height="72"
        rx="6"
        fill="none"
        stroke="var(--peep-ink)"
        strokeWidth="2.5"
      />
      <path
        d="M10 12 q14 -8 28 0 M16 6 h16"
        stroke="var(--peep-ink)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Schild({ voll }: { voll: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6Z"
        fill={voll ? 'var(--accent)' : 'none'}
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StartScreen() {
  const events = useEvents();
  const settings = useSettings();
  const breit = useBreit();
  const heute = tagKey(new Date());
  const daten = useMemo(() => {
    if (!events) return null;
    const xp = xpGesamt(events);
    return {
      serie: serie(events, settings.tagesziel, heute),
      werte: tagesWerte(events, heute),
      aufgaben: tagesaufgaben(events, heute),
      karriere: karriere(events),
      stufe: stufe(xp),
      xp,
      naechster: naechsterKnoten(events),
      readiness: readiness(events),
      laptop: laptopListe(events),
      rueckblick: wochenrueckblick(events, heute),
      faellig: [...karten(events).values()].filter(
        (k) => k.wiederholungen > 0 && faellig(k, new Date()),
      ).length,
    };
  }, [events, settings.tagesziel, heute]);

  if (!daten) return null;
  const zielAnteil = zielFortschritt(daten.werte, settings.tagesziel);
  const zeigeIosHinweis = istIosSafari() && !istInstalliert() && !settings.iosHinweisGesehen;
  const montag = montagVon(heute);
  const zeigeRueckblick =
    settings.wochenrueckblickGesehen !== montag && daten.rueckblick.aktiveTage > 0;
  const n = daten.naechster;
  const naechsteLektion = n?.typ === 'lektion' ? lektionFuerSkill(n.skill.id) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Character
          id="ich"
          ausdruck={daten.serie.heuteErreicht ? 'feiert' : 'freut'}
          groesse={64}
        />
        <div className="min-w-0">
          <div className="text-xs font-medium tracking-wide text-accent uppercase">
            {daten.karriere.aktuell.titel}
          </div>
          <h1 className="hand text-2xl font-bold">
            {settings.name ? `Hallo, ${settings.name}!` : 'Hallo!'}
          </h1>
          <div className="num text-sm text-muted">
            Stufe {daten.stufe.stufe} · {daten.xp} XP
          </div>
        </div>
      </div>

      {zeigeIosHinweis ? (
        <Card className="border-accent/40">
          <h2 className="font-semibold">Als App auf den Home-Bildschirm</h2>
          <ol className="mt-2 list-decimal pl-5 text-[15px]">
            <li>
              Unten in Safari auf <strong>Teilen</strong> tippen (Quadrat mit Pfeil nach oben).
            </li>
            <li>
              <strong>Zum Home-Bildschirm</strong> wählen und bestätigen.
            </li>
          </ol>
          <p className="mt-2 text-sm text-muted">
            So bleibt dein Lernstand dauerhaft gespeichert und die App funktioniert auch offline.
          </p>
          <Button className="mt-3" onClick={() => void saveSettings({ iosHinweisGesehen: true })}>
            Verstanden
          </Button>
        </Card>
      ) : null}

      <Card>
        <div className="flex items-center gap-4">
          <Dose fuellung={zielAnteil} />
          <div className="min-w-0 flex-1">
            <div className="num text-3xl font-bold">
              {daten.serie.laenge}{' '}
              <span className="text-base font-medium text-muted">
                {daten.serie.laenge === 1 ? 'Tag' : 'Tage'} in Folge
              </span>
            </div>
            <p className="text-sm text-muted">
              {daten.serie.heuteErreicht
                ? 'Tagesziel geschafft – stark!'
                : `Heute noch offen: ${ZIELE[settings.tagesziel].text}.`}
            </p>
            <div
              className="mt-1 flex items-center gap-1"
              aria-label={`Serienschutz: ${daten.serie.schutz} von 2`}
            >
              <Schild voll={daten.serie.schutz >= 1} />
              <Schild voll={daten.serie.schutz >= 2} />
              <span className="ml-1 text-xs text-muted">Serienschutz</span>
            </div>
          </div>
        </div>
        {daten.serie.reparatur ? (
          <p className="mt-3 rounded-lg bg-accent-soft p-2 text-sm">
            Deine Serie von {daten.serie.reparatur.vorher} Tagen lässt sich noch retten: Schaff an
            einem Tag bis zum{' '}
            {new Date(daten.serie.reparatur.bis).toLocaleDateString('de-DE', {
              day: 'numeric',
              month: 'long',
            })}{' '}
            das doppelte Tagesziel.
          </p>
        ) : null}
      </Card>

      {n ? (
        <Card>
          <div className="text-xs font-semibold tracking-wide text-muted uppercase">
            Was heute bei der MBG passiert
          </div>
          <div className="mt-3">
            {naechsteLektion ? (
              <Sprechblase s={naechsteLektion.teaser} />
            ) : (
              <Sprechblase
                s={{
                  figur: 'leni',
                  ausdruck: 'erklaert',
                  text: `Zeit für eine Übung: ${n.skill.titel}. Ein paar Aufgaben, dann sitzt das.`,
                }}
              />
            )}
          </div>
          <Button
            variant="primary"
            className="mt-3 w-full sm:w-auto"
            onClick={() =>
              (window.location.hash = naechsteLektion
                ? `#/lektion/${encodeURIComponent(naechsteLektion.id)}`
                : `#/sitzung?skill=${encodeURIComponent(n.skill.id)}`)
            }
          >
            {naechsteLektion ? `Lektion ${naechsteLektion.id} starten` : 'Übung starten'}
          </Button>
        </Card>
      ) : null}

      {breit && daten.laptop.length > 0 ? (
        <Card className="border-senf">
          <h2 className="font-semibold">Am Laptop weitermachen</h2>
          <ul className="mt-2 flex flex-col">
            {daten.laptop.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 border-t border-line py-2 first:border-0"
              >
                <span className="text-[15px]">{skillTitel(e.skillId)}</span>
                <Button
                  onClick={() =>
                    (window.location.hash = `#/sitzung?merk=${encodeURIComponent(e.ref)}`)
                  }
                >
                  Jetzt lösen
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <h2 className="font-semibold">Tagesaufgaben</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {daten.aufgaben.map((a) => (
            <li key={a.id} className="flex items-center gap-3">
              <span
                className={cx(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm',
                  a.erledigt ? 'bg-lime text-white' : 'border-2 border-line-strong',
                )}
                aria-hidden="true"
              >
                {a.erledigt ? '✓' : ''}
              </span>
              <span className="min-w-0 flex-1 text-[15px]">{a.text}</span>
              <span className="num text-sm text-muted">
                {a.stand}/{a.ziel}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">Alle drei geschafft: Bonus-XP.</p>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Kurz-Sitzung</h2>
            <p className="mt-1 text-[15px] text-muted">
              5–10 Minuten · Wiederholung und Neues gemischt
            </p>
            <p className="num mt-1 text-sm font-medium text-accent">
              {daten.faellig === 0
                ? 'Heute nichts fällig – Neues lernen'
                : daten.faellig === 1
                  ? '1 Wiederholung fällig'
                  : `${daten.faellig} Wiederholungen fällig`}
            </p>
          </div>
        </div>
        <Button className="mt-3 w-full sm:w-auto" onClick={() => navigate('sitzung')}>
          Sitzung starten
        </Button>
      </Card>

      <Card>
        <h2 className="font-semibold">Karriere bei der MBG</h2>
        <p className="mt-1 text-[15px]">
          Jetzt: <strong>{daten.karriere.aktuell.titel}</strong>
        </p>
        {daten.karriere.naechste ? (
          <>
            <p className="text-sm text-muted">
              Nächste Beförderung: {daten.karriere.naechste.titel} (
              {daten.karriere.naechste.bedingung})
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${Math.round(daten.karriere.fortschritt * 100)}%` }}
              />
            </div>
          </>
        ) : null}
      </Card>

      <Card>
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Klausur-Stand</h2>
          <span className="num text-2xl font-bold">{Math.round(daten.readiness * 100)} %</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-lime transition-all"
            style={{ width: `${Math.round(daten.readiness * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          Gewichtet nach Klausurrelevanz über alle drei Lehrbriefe. Wächst mit jeder Lektion und
          jeder gelösten Aufgabe.
        </p>
      </Card>

      {zeigeRueckblick ? (
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Wochenrückblick</h2>
            <Chip>letzte Woche</Chip>
          </div>
          <div className="mt-3">
            <Sprechblase
              s={{
                figur: 'jana',
                ausdruck: 'freut',
                text: `${daten.rueckblick.aktiveTage} Lerntage, ${daten.rueckblick.minuten} Minuten, ${daten.rueckblick.lektionen} Lektionen und ${daten.rueckblick.aufgaben} Aufgaben. ${
                  daten.rueckblick.staerkstesThema
                    ? `Am stärksten: ${skillTitel(daten.rueckblick.staerkstesThema)}.`
                    : 'Weiter so!'
                }`,
              }}
            />
          </div>
          <Button
            className="mt-3"
            onClick={() => void saveSettings({ wochenrueckblickGesehen: montag })}
          >
            Danke, Jana
          </Button>
        </Card>
      ) : null}
    </div>
  );
}
