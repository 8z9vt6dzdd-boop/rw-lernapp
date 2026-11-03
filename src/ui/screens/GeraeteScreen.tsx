// Geräte verbinden und Lernstand als Datei sichern/übernehmen (Rückfallebene).
import { useRef, useState } from 'react';
import { sicherungTeilen, sicherungUebernehmen } from '../../storage/transfer';
import { GeraeteVerbinden } from '../components/GeraeteVerbinden';
import { Button, Card, Icon } from '../components/ui';
import { navigate } from '../hooks';

export function GeraeteScreen() {
  const datei = useRef<HTMLInputElement>(null);
  const [meldung, setMeldung] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => navigate('einstellungen')}
        className="flex h-10 items-center gap-1 self-start rounded-lg px-2 text-sm text-muted hover:bg-surface-2"
      >
        <Icon name="schliessen" className="h-5 w-5" /> Zurück
      </button>
      <div>
        <h1 className="text-2xl font-semibold">Geräte verbinden</h1>
        <p className="mt-1 text-[15px] text-muted">
          Lerne auf dem Handy und am Laptop mit demselben Stand. Einmal verbinden, danach gleicht
          sich alles von selbst ab – ohne Konto und ohne Passwort.
        </p>
      </div>
      <GeraeteVerbinden />
      <Card>
        <h2 className="font-semibold">Lernstand als Datei</h2>
        <p className="mt-1 text-[15px] text-muted">
          Zur Sicherheit oder falls der Abgleich einmal nicht klappt: Lernstand als Datei sichern
          und auf einem anderen Gerät übernehmen. Nichts geht dabei verloren, beide Stände werden
          zusammengeführt.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() =>
              void sicherungTeilen().then((r) =>
                setMeldung(
                  r === 'geteilt'
                    ? 'Lernstand geteilt.'
                    : r === 'heruntergeladen'
                      ? 'Lernstand als Datei gespeichert.'
                      : null,
                ),
              )
            }
          >
            Lernstand sichern
          </Button>
          <Button onClick={() => datei.current?.click()}>Lernstand übernehmen</Button>
          <input
            ref={datei}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Lernstand-Datei auswählen"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              void f.text().then(async (t) => {
                const r = await sicherungUebernehmen(t);
                setMeldung(
                  'fehler' in r
                    ? r.fehler
                    : r.neu === 0
                      ? 'Alles schon vorhanden – nichts Neues in der Datei.'
                      : `${r.neu} neue Einträge übernommen.`,
                );
              });
              e.target.value = '';
            }}
          />
        </div>
        {meldung ? (
          <p className="mt-3 text-[15px]" role="status">
            {meldung}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
