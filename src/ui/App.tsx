// App-Rahmen: Navigation (unten auf dem Handy, links am Laptop), Update-Hinweis, Belohnungen,
// Begrüßung beim ersten Start und Hinweis „fiktive Zahlen“.
import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { FIRMA } from '../config';
import { lektion } from '../content/lessons';
import { requestPersistence } from '../storage/db';
import { codeAusHash } from '../storage/kopplung';
import { abgleichStarten } from '../storage/sync';
import { AbgleichStatusZeile } from './components/GeraeteVerbinden';
import { GeraeteScreen } from './screens/GeraeteScreen';
import { HilfeScreen } from './screens/HilfeScreen';
import { VerbindenFrage } from './VerbindenFrage';
import { Button, Card, Icon, cx, type IconName } from './components/ui';
import {
  navigate,
  routeParams,
  useBewegung,
  useHash,
  useRoute,
  useSettingsState,
  useTheme,
  type Route,
} from './hooks';
import { Belohnungen } from './lesson/Belohnungen';
import { ToeneBeobachter } from './ToeneBeobachter';
import { LessonPlayer } from './lesson/LessonPlayer';
import { EinstellungenScreen } from './screens/EinstellungenScreen';
import { ErfolgeScreen } from './screens/ErfolgeScreen';
import { FallScreen } from './screens/FallScreen';
import { FirmaScreen } from './screens/FirmaScreen';
import { KlausurScreen } from './screens/KlausurScreen';
import { PruefenScreen } from './screens/PruefenScreen';
import { LernpfadScreen } from './screens/LernpfadScreen';
import { SessionScreen } from './screens/SessionScreen';
import { StartScreen } from './screens/StartScreen';
import { StatistikScreen } from './screens/StatistikScreen';
import { EinstufungScreen, TestScreen } from './screens/TestScreen';
import { FigurScreen, WillkommenScreen } from './screens/WillkommenScreen';

const NAV: { route: Route; label: string; icon: IconName }[] = [
  { route: 'start', label: 'Start', icon: 'start' },
  { route: 'lernpfad', label: 'Lernpfad', icon: 'pfad' },
  { route: 'firma', label: 'Firma', icon: 'firma' },
  { route: 'statistik', label: 'Statistik', icon: 'statistik' },
  { route: 'einstellungen', label: 'Einstellungen', icon: 'einstellungen' },
];

/** Bereiche ohne Navigation (volle Konzentration auf Lektion, Aufgabe oder Test). */
const VOLLBILD: Route[] = [
  'sitzung',
  'lektion',
  'test',
  'einstufung',
  'willkommen',
  'fall',
  'klausur',
];
/** Breite Bereiche für den Fallmodus am Laptop */
const BREIT: Route[] = ['fall', 'klausur'];

function UpdateHinweis() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });
  if (!needRefresh) return null;
  return (
    <div role="status" className="safe-top fixed inset-x-0 top-0 z-50 flex justify-center p-3">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2 shadow-card">
        <span className="text-[15px]">Neue Version verfügbar</span>
        <Button
          variant="primary"
          className="min-h-9"
          onClick={() => void updateServiceWorker(true)}
        >
          Jetzt laden
        </Button>
      </div>
    </div>
  );
}

function LektionRoute() {
  const [id] = routeParams();
  const l = id ? lektion(id) : undefined;
  if (!l) {
    return (
      <Card>
        <p>Diese Lektion gibt es (noch) nicht.</p>
        <Button className="mt-3" onClick={() => navigate('lernpfad')}>
          Zum Lernpfad
        </Button>
      </Card>
    );
  }
  return <LessonPlayer key={l.id} lektion={l} />;
}

export function App() {
  const route = useRoute();
  const hash = useHash();
  const [settings, geladen] = useSettingsState();
  useTheme(settings.theme);
  useBewegung(settings.bewegungReduziert);

  useEffect(() => {
    void requestPersistence();
    abgleichStarten();
  }, []);
  // Geöffnet über den QR-Code eines anderen Geräts (…/#verbinden-…)
  const [verbindenCode, setVerbindenCode] = useState(() => codeAusHash(window.location.hash));

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  const onboarding = geladen && !settings.onboardingErledigt && route === 'start';
  const effektiv: Route = onboarding ? 'willkommen' : route;
  const vollbild = VOLLBILD.includes(effektiv);

  const screen = {
    start: geladen ? <StartScreen /> : null,
    lernpfad: <LernpfadScreen />,
    firma: <FirmaScreen />,
    statistik: <StatistikScreen />,
    einstellungen: <EinstellungenScreen />,
    sitzung: <SessionScreen key={hash} />,
    lektion: <LektionRoute key={hash} />,
    test: <TestScreen key={hash} />,
    einstufung: <EinstufungScreen />,
    erfolge: <ErfolgeScreen />,
    figur: <FigurScreen />,
    willkommen: <WillkommenScreen />,
    pruefen: <PruefenScreen />,
    fall: <FallScreen key={hash} />,
    klausur: <KlausurScreen key={hash} />,
    geraete: <GeraeteScreen />,
    hilfe: <HilfeScreen />,
  }[effektiv];

  if (verbindenCode) {
    return (
      <main className="safe-top px-4">
        <VerbindenFrage
          code={verbindenCode}
          onFertig={() => {
            setVerbindenCode(null);
            navigate('start');
          }}
        />
      </main>
    );
  }

  return (
    <div className="min-h-dvh lg:flex">
      <UpdateHinweis />
      <ToeneBeobachter />
      {!vollbild && geladen ? <Belohnungen /> : null}
      {!vollbild ? (
        <nav
          aria-label="Hauptnavigation"
          className="hidden w-60 shrink-0 border-r border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:p-4"
        >
          <div className="mb-6 px-2">
            <div className="text-xs font-medium tracking-wide text-accent uppercase">
              {FIRMA.kurz} · Lernversion
            </div>
            <div className="hand text-lg font-bold">Rechnungswesen</div>
          </div>
          <ul className="flex flex-col gap-1">
            {NAV.map((n) => (
              <li key={n.route}>
                <button
                  type="button"
                  onClick={() => navigate(n.route)}
                  aria-current={route === n.route ? 'page' : undefined}
                  className={cx(
                    'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px]',
                    route === n.route
                      ? 'bg-accent-soft font-medium text-accent'
                      : 'text-ink hover:bg-surface-2',
                  )}
                >
                  <Icon name={n.icon} className="h-5 w-5" />
                  {n.label}
                </button>
              </li>
            ))}
          </ul>
          <AbgleichStatusZeile className="mt-auto px-2 text-muted" />
        </nav>
      ) : null}
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <main
          className={cx(
            'safe-top mx-auto w-full flex-1 px-4 pt-4 sm:pt-6',
            BREIT.includes(effektiv) ? 'max-w-6xl' : 'max-w-3xl',
            !vollbild && 'pb-28 lg:pb-10',
          )}
        >
          {screen}
        </main>
        {!vollbild ? (
          <footer className="mx-auto w-full max-w-3xl px-4 pb-28 text-xs text-muted lg:pb-6">
            {FIRMA.hinweisFiktiv} Alle Personen sind erfunden.
          </footer>
        ) : null}
      </div>
      {!vollbild ? (
        <nav
          aria-label="Hauptnavigation"
          className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
        >
          <ul className="mx-auto flex max-w-xl">
            {NAV.map((n) => (
              <li key={n.route} className="flex-1">
                <button
                  type="button"
                  onClick={() => navigate(n.route)}
                  aria-current={route === n.route ? 'page' : undefined}
                  className={cx(
                    'flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px]',
                    route === n.route ? 'text-accent' : 'text-muted',
                  )}
                >
                  <Icon name={n.icon} className="h-6 w-6" />
                  {n.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
