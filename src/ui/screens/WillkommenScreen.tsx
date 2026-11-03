// Erster Start: Begrüßung bei der MBG, eigene Figur gestalten, Tagesziel, Einstufung oder direkt loslegen.
import { useState } from 'react';
import { APP_NAME } from '../../config';
import { GeraeteVerbinden } from '../components/GeraeteVerbinden';
import { ICH_ACCESSOIRES, ICH_FARBEN, ICH_FRISUREN } from '../../content/characters';
import { ZIELE } from '../../learning/motivation';
import type { Tagesziel } from '../../learning/types';
import { saveSettings } from '../../storage/db';
import { Button, Card, cx } from '../components/ui';
import { Character } from '../figures/Character';
import { Sprechblase } from '../lesson/Sprechblase';
import { Schauplatz } from '../visuals/Schauplatz';
import { navigate, useSettings } from '../hooks';

const FRISUR_NAME: Record<string, string> = {
  ShortCurly: 'Locken kurz',
  Bangs: 'Pony',
  Afro: 'Afro',
  Medium: 'Mittellang',
  ShortWavy: 'Kurz gewellt',
  LongCurly: 'Locken lang',
  Pomp: 'Tolle',
  FlatTop: 'Kurz',
};

export function FigurEditor() {
  const settings = useSettings();
  const ich = settings.ich;
  const setze = (patch: Partial<typeof ich>) => void saveSettings({ ich: { ...ich, ...patch } });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <Character id="ich" ausdruck="freut" groesse={140} />
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Wie sollen dich die anderen nennen? (optional)</span>
        <input
          type="text"
          value={settings.name ?? ''}
          maxLength={20}
          onChange={(e) => void saveSettings({ name: e.target.value })}
          className="h-11 rounded-lg border border-line-strong bg-surface px-3"
          placeholder="Vorname"
        />
      </label>
      <div>
        <div className="mb-2 text-sm font-medium">Frisur</div>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Frisur">
          {ICH_FRISUREN.map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={ich.frisur === f}
              onClick={() => setze({ frisur: f })}
              className={cx(
                'min-h-11 rounded-lg border px-1 text-xs',
                ich.frisur === f
                  ? 'border-accent bg-accent-soft font-medium text-accent'
                  : 'border-line-strong bg-surface',
              )}
            >
              {FRISUR_NAME[f] ?? f}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm font-medium">Farbe</div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Farbe">
          {ICH_FARBEN.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={ich.farbe === c}
              aria-label={`Farbe ${c}`}
              onClick={() => setze({ farbe: c })}
              className={cx(
                'h-11 w-11 rounded-full border-4',
                ich.farbe === c ? 'border-ink' : 'border-transparent',
              )}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm font-medium">Accessoire</div>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Accessoire">
          {ICH_ACCESSOIRES.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={ich.accessoire === a.id}
              onClick={() => setze({ accessoire: a.id })}
              className={cx(
                'min-h-11 rounded-lg border text-sm',
                ich.accessoire === a.id
                  ? 'border-accent bg-accent-soft font-medium text-accent'
                  : 'border-line-strong bg-surface',
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FigurScreen() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Deine Figur</h1>
      <FigurEditor />
      <Button variant="primary" onClick={() => navigate('einstellungen')}>
        Fertig
      </Button>
    </div>
  );
}

export function WillkommenScreen() {
  const settings = useSettings();
  const [schritt, setSchritt] = useState(0);
  const [zweitesGeraet, setZweitesGeraet] = useState(false);
  const fertig = async (ziel: 'einstufung' | 'lernpfad') => {
    if (ziel === 'lernpfad') await saveSettings({ onboardingErledigt: true });
    navigate(ziel);
  };
  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex justify-center gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cx('h-1.5 w-8 rounded-full', i <= schritt ? 'bg-accent' : 'bg-surface-3')}
          />
        ))}
      </div>
      {schritt === 0 ? (
        <>
          <Schauplatz ort="buero" hoehe="h-44 sm:h-52">
            <Character id="jana" ausdruck="freut" groesse={100} hintergrund={false} />
            <Character id="tobias" ausdruck="feiert" groesse={100} gespiegelt hintergrund={false} />
          </Schauplatz>
          <p className="text-center text-sm font-medium tracking-wide text-accent uppercase">
            {APP_NAME}
          </p>
          <h1 className="hand text-center text-3xl font-bold">Willkommen bei der MBG!</h1>
          <Sprechblase
            s={{
              figur: 'jana',
              ausdruck: 'freut',
              text: 'Schön, dass du da bist. Ab heute bist du neu im Rechnungswesen – ich zeig dir alles, Schritt für Schritt.',
            }}
          />
          <Sprechblase
            s={{
              figur: 'tobias',
              ausdruck: 'freut',
              text: 'Und ich sorge dafür, dass dir nicht langweilig wird.',
            }}
          />
          <p className="text-center text-xs text-muted">
            Alle Personen, Firmenzahlen und Partner sind erfunden. Kein Bezug zu tatsächlichen
            Geschäftsdaten der MBG Group.
          </p>
          <Button variant="primary" onClick={() => setSchritt(1)}>
            Los geht’s
          </Button>
        </>
      ) : null}
      {schritt === 1 ? (
        <>
          <h1 className="text-2xl font-semibold">Wie siehst du aus?</h1>
          <Card>
            <FigurEditor />
          </Card>
          <Button variant="primary" onClick={() => setSchritt(2)}>
            Weiter
          </Button>
        </>
      ) : null}
      {schritt === 2 ? (
        <>
          <h1 className="text-2xl font-semibold">Dein Tagesziel</h1>
          <p className="text-muted">
            Jeden Tag ein bisschen – das bringt mehr als ein Marathon am Wochenende.
          </p>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Tagesziel">
            {(['leicht', 'normal', 'intensiv'] as Tagesziel[]).map((z) => (
              <button
                key={z}
                type="button"
                role="radio"
                aria-checked={settings.tagesziel === z}
                onClick={() => void saveSettings({ tagesziel: z })}
                className={cx(
                  'min-h-14 rounded-xl border-2 px-4 py-2 text-left',
                  settings.tagesziel === z
                    ? 'border-accent bg-accent-soft'
                    : 'border-line-strong bg-surface',
                )}
              >
                <div className="font-semibold capitalize">{z}</div>
                <div className="text-sm text-muted">{ZIELE[z].text}</div>
              </button>
            ))}
          </div>
          <Button variant="primary" onClick={() => setSchritt(3)}>
            Weiter
          </Button>
        </>
      ) : null}
      {schritt === 3 ? (
        <>
          <h1 className="text-2xl font-semibold">Lernst du auch auf einem zweiten Gerät?</h1>
          <Sprechblase
            s={{
              figur: 'jana',
              ausdruck: 'erklaert',
              text: 'Unterwegs am Handy, abends am Laptop: Verbinde beide Geräte, dann hast du überall denselben Stand.',
            }}
          />
          {zweitesGeraet ? (
            <GeraeteVerbinden />
          ) : (
            <Button variant="primary" onClick={() => setZweitesGeraet(true)}>
              Ja, Geräte verbinden
            </Button>
          )}
          <Button onClick={() => setSchritt(4)}>
            {zweitesGeraet ? 'Weiter' : 'Nein, nur dieses Gerät'}
          </Button>
          <p className="text-center text-sm text-muted">
            Das geht auch später unter Einstellungen → Geräte verbinden.
          </p>
        </>
      ) : null}
      {schritt === 4 ? (
        <>
          <h1 className="text-2xl font-semibold">Kennst du dich schon aus?</h1>
          <Sprechblase
            s={{
              figur: 'leni',
              ausdruck: 'erklaert',
              text: 'Mit einer kurzen Einstufung überspringst du, was du schon kannst. Oder du fängst ganz vorne an.',
            }}
          />
          <Button variant="primary" onClick={() => void fertig('einstufung')}>
            Kurze Einstufung machen
          </Button>
          <Button onClick={() => void fertig('lernpfad')}>Bei null anfangen</Button>
        </>
      ) : null}
    </div>
  );
}
