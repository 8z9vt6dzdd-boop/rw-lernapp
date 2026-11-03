// Einstellungen: Tagesziel, Darstellung, Bewegung, Figur, Erfolge, Zurücksetzen.
import { useState } from 'react';
import { FIRMA } from '../../config';
import { ZIELE } from '../../learning/motivation';
import type { Tagesziel, Theme } from '../../learning/types';
import { resetAll, saveSettings } from '../../storage/db';
import { Button, Card, cx } from '../components/ui';
import { Character } from '../figures/Character';
import { navigate, useSettings } from '../hooks';

const THEMES: { id: Theme; label: string }[] = [
  { id: 'auto', label: 'Automatisch' },
  { id: 'hell', label: 'Hell' },
  { id: 'dunkel', label: 'Dunkel' },
];

function Auswahl<T extends string>({
  label,
  werte,
  aktiv,
  onWahl,
}: {
  label: string;
  werte: { id: T; label: string }[];
  aktiv: T;
  onWahl: (t: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="mt-3 grid grid-cols-3 gap-2">
      {werte.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={aktiv === t.id}
          onClick={() => onWahl(t.id)}
          className={cx(
            'min-h-11 rounded-lg border text-[15px]',
            aktiv === t.id
              ? 'border-accent bg-accent-soft font-medium text-accent'
              : 'border-line-strong bg-surface hover:bg-surface-2',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function EinstellungenScreen() {
  const settings = useSettings();
  const [bestaetigen, setBestaetigen] = useState(false);
  const [fertig, setFertig] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Einstellungen</h1>
      <Card>
        <div className="flex items-center gap-3">
          <Character id="ich" groesse={64} bewegung="keine" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{settings.name || 'Deine Figur'}</div>
            <div className="text-sm text-muted">
              So erscheinst du in Lektionen und Abschlussszenen.
            </div>
          </div>
          <Button onClick={() => navigate('figur')}>Ändern</Button>
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold">Tagesziel</h2>
        <p className="text-sm text-muted">{ZIELE[settings.tagesziel].text}</p>
        <Auswahl<Tagesziel>
          label="Tagesziel"
          werte={[
            { id: 'leicht', label: 'Leicht' },
            { id: 'normal', label: 'Normal' },
            { id: 'intensiv', label: 'Intensiv' },
          ]}
          aktiv={settings.tagesziel}
          onWahl={(t) => void saveSettings({ tagesziel: t })}
        />
      </Card>
      <Card>
        <h2 className="font-semibold">Klausur</h2>
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[15px]">Klausurtermin (freiwillig)</span>
          <input
            type="date"
            aria-label="Klausurtermin"
            value={settings.examDate ?? ''}
            onChange={(e) =>
              void saveSettings(
                e.target.value ? { examDate: e.target.value } : { examDate: undefined },
              )
            }
            className="min-h-11 w-full max-w-xs rounded-lg border border-line-strong bg-surface px-3 text-[15px]"
          />
          <span className="text-sm text-muted">
            Dann zeigt die Startseite, wie viele Tage noch bleiben.
          </span>
        </label>
        <label className="mt-4 flex min-h-11 items-center justify-between gap-3">
          <span>
            <span className="block text-[15px]">Teilkosten in Probeklausuren</span>
            <span className="block text-sm text-muted">
              Standardmäßig aus. Die Teilkosten-Aufgaben folgen mit dem nächsten Ausbau.
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-label="Teilkosten in Probeklausuren"
            checked={settings.teilkostenInKlausur}
            onChange={(e) => void saveSettings({ teilkostenInKlausur: e.target.checked })}
            className="h-6 w-11 shrink-0 accent-[color:var(--accent)]"
          />
        </label>
      </Card>
      <Card>
        <h2 className="font-semibold">Darstellung</h2>
        <Auswahl<Theme>
          label="Darstellung"
          werte={THEMES}
          aktiv={settings.theme}
          onWahl={(t) => void saveSettings({ theme: t })}
        />
        <label className="mt-4 flex min-h-11 items-center justify-between gap-3">
          <span>
            <span className="block text-[15px]">Bewegung reduzieren</span>
            <span className="block text-sm text-muted">Keine Animationen und kein Konfetti.</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-label="Bewegung reduzieren"
            checked={settings.bewegungReduziert}
            onChange={(e) => void saveSettings({ bewegungReduziert: e.target.checked })}
            className="h-6 w-11 accent-[color:var(--accent)]"
          />
        </label>
      </Card>
      <Card>
        <label className="flex min-h-11 items-center justify-between gap-3">
          <span>
            <span className="block font-semibold">Töne</span>
            <span className="block text-sm text-muted">
              Kurze, leise Töne bei Antworten und Erfolgen. Auf dem iPhone gilt der Stummschalter,
              Musik läuft weiter.
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-label="Töne"
            checked={settings.toene}
            onChange={(e) => void saveSettings({ toene: e.target.checked })}
            className="h-6 w-11 shrink-0 accent-[color:var(--accent)]"
          />
        </label>
      </Card>
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Erfolge</h2>
            <p className="text-sm text-muted">Deine Sammlung ansehen.</p>
          </div>
          <Button onClick={() => navigate('erfolge')}>Öffnen</Button>
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Einstufung</h2>
            <p className="text-sm text-muted">Kurzer Test, um Bekanntes zu überspringen.</p>
          </div>
          <Button onClick={() => navigate('einstufung')}>Starten</Button>
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold">Lernstand zurücksetzen</h2>
        <p className="mt-1 text-[15px] text-muted">
          Löscht alle bearbeiteten Aufgaben, Lektionen und Einstellungen auf diesem Gerät.
        </p>
        {fertig ? (
          <p className="mt-3 text-[15px] text-ok">Alles wurde zurückgesetzt.</p>
        ) : bestaetigen ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="primary"
              className="bg-err hover:bg-err"
              onClick={async () => {
                await resetAll();
                setBestaetigen(false);
                setFertig(true);
              }}
            >
              Ja, endgültig löschen
            </Button>
            <Button onClick={() => setBestaetigen(false)}>Abbrechen</Button>
          </div>
        ) : (
          <Button className="mt-3" onClick={() => setBestaetigen(true)}>
            Alles zurücksetzen …
          </Button>
        )}
      </Card>
      <Card>
        <h2 className="font-semibold">Über diese App</h2>
        <p className="mt-1 text-[15px] text-muted">
          {FIRMA.hinweisFiktiv} Alle Figuren sind erfunden. Zeichnungen auf Basis von Open Peeps
          (Pablo Stanley, CC0).
        </p>
        <p className="mt-2 text-sm text-muted">Version {__APP_VERSION__}</p>
      </Card>
    </div>
  );
}
