// App-Rahmen: Navigation (unten auf dem Handy, links am Laptop), Update-Hinweis, Hinweis „fiktive Zahlen“.
import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { FIRMA } from '../config';
import { requestPersistence } from '../storage/db';
import { Button, Icon, cx, type IconName } from './components/ui';
import { navigate, useHash, useRoute, useSettings, useTheme, type Route } from './hooks';
import { EinstellungenScreen } from './screens/EinstellungenScreen';
import { FirmaScreen } from './screens/FirmaScreen';
import { LernpfadScreen } from './screens/LernpfadScreen';
import { SessionScreen } from './screens/SessionScreen';
import { StartScreen } from './screens/StartScreen';
import { StatistikScreen } from './screens/StatistikScreen';

const NAV: { route: Route; label: string; icon: IconName }[] = [
  { route: 'start', label: 'Start', icon: 'start' },
  { route: 'lernpfad', label: 'Lernpfad', icon: 'pfad' },
  { route: 'firma', label: 'Firma', icon: 'firma' },
  { route: 'statistik', label: 'Statistik', icon: 'statistik' },
  { route: 'einstellungen', label: 'Einstellungen', icon: 'einstellungen' },
];

function UpdateHinweis() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });
  if (!needRefresh) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-50 flex justify-center p-3 safe-top">
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

export function App() {
  const route = useRoute();
  const hash = useHash();
  const settings = useSettings();
  useTheme(settings.theme);

  useEffect(() => {
    void requestPersistence();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  const imSitzungsmodus = route === 'sitzung';

  const screen = {
    start: <StartScreen />,
    lernpfad: <LernpfadScreen />,
    firma: <FirmaScreen />,
    statistik: <StatistikScreen />,
    einstellungen: <EinstellungenScreen />,
    sitzung: <SessionScreen key={hash} />,
  }[route];

  return (
    <div className="min-h-dvh lg:flex">
      <UpdateHinweis />
      {!imSitzungsmodus ? (
        <nav
          aria-label="Hauptnavigation"
          className="hidden w-60 shrink-0 border-r border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:p-4"
        >
          <div className="mb-6 px-2">
            <div className="text-xs font-medium tracking-wide text-accent uppercase">
              {FIRMA.kurz} · Lernversion
            </div>
            <div className="font-semibold">Rechnungswesen</div>
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
        </nav>
      ) : null}
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <main
          className={cx(
            'mx-auto w-full flex-1 px-4 pt-4 safe-top sm:pt-6',
            imSitzungsmodus ? 'max-w-3xl' : 'max-w-3xl pb-28 lg:pb-10',
          )}
        >
          {screen}
        </main>
        {!imSitzungsmodus ? (
          <footer className="mx-auto w-full max-w-3xl px-4 pb-28 text-xs text-muted lg:pb-6">
            {FIRMA.hinweisFiktiv}
          </footer>
        ) : null}
      </div>
      {!imSitzungsmodus ? (
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
