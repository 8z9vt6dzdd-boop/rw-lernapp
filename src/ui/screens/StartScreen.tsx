// Startseite: Kurz-Sitzung starten, kurzer Überblick, Hinweis zum Installieren auf dem iPhone.
import { useMemo } from 'react';
import { saveSettings } from '../../storage/db';
import { Button, Card, Icon } from '../components/ui';
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

function wochenBeginn(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export function StartScreen() {
  const events = useEvents();
  const settings = useSettings();
  const stats = useMemo(() => {
    if (!events) return null;
    const heute = new Date().toDateString();
    const woche = wochenBeginn().getTime();
    return {
      heute: events.filter((e) => new Date(e.ts).toDateString() === heute).length,
      woche: events.filter((e) => new Date(e.ts).getTime() >= woche).length,
      gesamt: events.length,
    };
  }, [events]);

  const zeigeIosHinweis = istIosSafari() && !istInstalliert() && !settings.iosHinweisGesehen;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Rechnungswesen trainieren</h1>
        <p className="mt-1 text-muted">
          Buchführung, Kosten- und Leistungsrechnung – bei der MBG in Paderborn.
        </p>
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Kurz-Sitzung</h2>
            <p className="mt-1 text-[15px] text-muted">
              5–10 Minuten · gemischte Aufgaben · Aufgaben erkennen
            </p>
          </div>
          <Icon name="pfeil" className="mt-1 text-accent" />
        </div>
        <Button
          variant="primary"
          className="mt-4 w-full sm:w-auto"
          onClick={() => navigate('sitzung')}
        >
          Sitzung starten
        </Button>
      </Card>

      {stats ? (
        <Card>
          <h2 className="font-semibold">Dein Stand</h2>
          <dl className="num mt-3 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-surface-2 p-3">
              <dt className="text-xs text-muted">Heute</dt>
              <dd className="text-xl font-semibold">{stats.heute}</dd>
            </div>
            <div className="rounded-lg bg-surface-2 p-3">
              <dt className="text-xs text-muted">Diese Woche</dt>
              <dd className="text-xl font-semibold">{stats.woche}</dd>
            </div>
            <div className="rounded-lg bg-surface-2 p-3">
              <dt className="text-xs text-muted">Insgesamt</dt>
              <dd className="text-xl font-semibold">{stats.gesamt}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-muted">bearbeitete Aufgaben</p>
        </Card>
      ) : null}

      <Card>
        <h2 className="font-semibold">Gezielt üben</h2>
        <p className="mt-1 text-[15px] text-muted">
          Einen Aufgabentyp mehrmals hintereinander rechnen.
        </p>
        <Button className="mt-3" onClick={() => navigate('lernpfad')}>
          Aufgabentypen ansehen
        </Button>
      </Card>
    </div>
  );
}
