// Wird gezeigt, wenn die App über den QR-Code eines anderen Geräts geöffnet wurde (…/#verbinden-…).
import { useState } from 'react';
import { verbinden } from '../storage/sync';
import { Button, Card } from './components/ui';
import { Sprechblase } from './lesson/Sprechblase';
import { istInstalliert, istIosSafari } from './geraet';

export function VerbindenFrage({ code, onFertig }: { code: string; onFertig: () => void }) {
  const [verbunden, setVerbunden] = useState(false);
  const iosBrowser = istIosSafari() && !istInstalliert();
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 pt-4">
      <h1 className="text-2xl font-semibold">Gerät verbinden</h1>
      {verbunden ? (
        <Card>
          <p className="text-[15px]">Verbunden. Dein Lernstand wird jetzt abgeglichen.</p>
          <Button variant="primary" className="mt-3" onClick={onFertig}>
            Weiter
          </Button>
        </Card>
      ) : (
        <>
          <Sprechblase
            s={{
              figur: 'leni',
              ausdruck: 'erklaert',
              text: 'Mit diesem Lernstand verbinden? Was du auf diesem Gerät schon gelernt hast, bleibt erhalten und wird zusammengeführt.',
            }}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="primary"
              onClick={() => void verbinden(code).then(() => setVerbunden(true))}
            >
              Ja, verbinden
            </Button>
            <Button onClick={onFertig}>Nein, abbrechen</Button>
          </div>
        </>
      )}
      {iosBrowser ? (
        <Card className="border-senf">
          <h2 className="font-semibold">Nutzt du die App vom Home-Bildschirm?</h2>
          <p className="mt-1 text-[15px]">
            Dann öffne sie dort und gib unter Einstellungen → Geräte verbinden diese 8 Wörter ein:
          </p>
          <p className="num mt-2 rounded-lg bg-surface-2 p-3 text-[15px] font-medium">
            {code.split('-').join(' ')}
          </p>
        </Card>
      ) : null}
    </div>
  );
}
