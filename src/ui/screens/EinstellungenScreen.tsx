// Einstellungen: Darstellung, Zurücksetzen. Geräte verbinden, Wochenziel u. a. folgen.
import { useState } from 'react';
import { FIRMA } from '../../config';
import type { Theme } from '../../learning/types';
import { resetAll, saveSettings } from '../../storage/db';
import { Button, Card, cx } from '../components/ui';
import { useSettings } from '../hooks';

const THEMES: { id: Theme; label: string }[] = [
  { id: 'auto', label: 'Automatisch' },
  { id: 'hell', label: 'Hell' },
  { id: 'dunkel', label: 'Dunkel' },
];

export function EinstellungenScreen() {
  const settings = useSettings();
  const [bestaetigen, setBestaetigen] = useState(false);
  const [fertig, setFertig] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Einstellungen</h1>
      <Card>
        <h2 className="font-semibold">Darstellung</h2>
        <div role="radiogroup" aria-label="Darstellung" className="mt-3 grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={settings.theme === t.id}
              onClick={() => void saveSettings({ theme: t.id })}
              className={cx(
                'min-h-11 rounded-lg border text-[15px]',
                settings.theme === t.id
                  ? 'border-accent bg-accent-soft font-medium text-accent'
                  : 'border-line-strong bg-surface hover:bg-surface-2',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold">Lernstand zurücksetzen</h2>
        <p className="mt-1 text-[15px] text-muted">
          Löscht alle bearbeiteten Aufgaben und Einstellungen auf diesem Gerät.
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
        <p className="mt-1 text-[15px] text-muted">{FIRMA.hinweisFiktiv}</p>
        <p className="mt-2 text-sm text-muted">Version {__APP_VERSION__}</p>
      </Card>
    </div>
  );
}
