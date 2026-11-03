// Geräte verbinden: eigener Code als QR-Code und 8 Wörter, oder Code eines anderen Geräts eingeben.
import { useEffect, useState } from 'react';
import { codeAusEingabe, verbindenLink } from '../../storage/kopplung';
import { abgleichen, kopplungscode, statusText, verbinden } from '../../storage/sync';
import { useAbgleich } from '../hooks';
import { QrCode } from './QrCode';
import { Button, Card, cx } from './ui';

export function AbgleichStatusZeile({ className }: { className?: string }) {
  const s = useAbgleich();
  if (!s) return null;
  const t = statusText(s);
  const ok = s.eingerichtet && s.letzterErfolg && !s.fehler;
  return (
    <div className={cx('text-sm', className)} role="status">
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={cx('h-2.5 w-2.5 shrink-0 rounded-full', ok ? 'bg-ok' : 'bg-line-strong')}
        />
        <span>{t.text}</span>
      </span>
      {s.geraete && s.geraete > 1 ? (
        <span className="mt-0.5 block text-muted">{s.geraete} Geräte verbunden</span>
      ) : null}
      {t.hinweis ? <span className="mt-1 block text-warn">{t.hinweis}</span> : null}
    </div>
  );
}

export function GeraeteVerbinden() {
  const [code, setCode] = useState<string | null>(null);
  const [eingabe, setEingabe] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [fragen, setFragen] = useState<string | null>(null);
  const [verbunden, setVerbunden] = useState(false);
  useEffect(() => {
    let alive = true;
    void kopplungscode().then((c) => alive && setCode(c));
    return () => {
      alive = false;
    };
  }, [verbunden]);
  if (!code) return null;
  const link = verbindenLink(code, window.location.href);
  const pruefen = () => {
    const c = codeAusEingabe(eingabe);
    if (!c) {
      setFehler('Bitte genau die 8 Wörter vom anderen Gerät eingeben.');
      return;
    }
    if (c === code) {
      setFehler('Das ist der Code dieses Geräts. Gib den Code des anderen Geräts ein.');
      return;
    }
    setFehler(null);
    setFragen(c);
  };
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h2 className="font-semibold">Dieses Gerät</h2>
        <AbgleichStatusZeile className="mt-2" />
        <p className="mt-3 text-[15px]">
          Scanne den Code mit der Kamera des anderen Geräts. Oder tippe dort die 8 Wörter ein.
        </p>
        <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <QrCode
            text={link}
            label="QR-Code zum Verbinden eines weiteren Geräts"
            className="h-48 w-48 shrink-0 rounded-lg border border-line"
          />
          <ol
            aria-label="Die 8 Wörter dieses Geräts"
            className="grid w-full grid-cols-2 gap-2 text-[15px]"
          >
            {code.split('-').map((w, i) => (
              <li key={i} className="num rounded-lg bg-surface-2 px-3 py-2 font-medium">
                <span className="text-muted">{i + 1}.</span> {w}
              </li>
            ))}
          </ol>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Mit einem anderen Gerät verbinden</h2>
        <p className="mt-1 text-[15px] text-muted">
          Öffne dort Einstellungen → Geräte verbinden und tippe die 8 Wörter hier ein.
        </p>
        {verbunden ? (
          <p className="mt-3 rounded-lg bg-ok-soft p-3 text-[15px]">
            Verbunden. Dein Lernstand wird jetzt mit dem anderen Gerät abgeglichen.
          </p>
        ) : fragen ? (
          <div className="mt-3 rounded-lg border border-accent/40 p-3">
            <p className="text-[15px]">
              Mit diesem Lernstand verbinden? Was du hier schon gelernt hast, bleibt erhalten und
              wird zusammengeführt.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button
                variant="primary"
                onClick={() =>
                  void verbinden(fragen).then(() => {
                    setVerbunden(true);
                    setFragen(null);
                  })
                }
              >
                Ja, verbinden
              </Button>
              <Button onClick={() => setFragen(null)}>Abbrechen</Button>
            </div>
          </div>
        ) : (
          <form
            className="mt-3 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              pruefen();
            }}
          >
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">8 Wörter des anderen Geräts</span>
              <textarea
                aria-label="8 Wörter des anderen Geräts"
                rows={2}
                value={eingabe}
                onChange={(e) => setEingabe(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="rounded-lg border border-line-strong bg-surface p-3 text-[15px]"
                placeholder="z. B. apfel birne kirsche …"
              />
            </label>
            {fehler ? <p className="text-sm text-err">{fehler}</p> : null}
            <Button type="submit" variant="primary" disabled={eingabe.trim() === ''}>
              Verbinden
            </Button>
          </form>
        )}
      </Card>
      <Button variant="ghost" onClick={() => void abgleichen()}>
        Jetzt abgleichen
      </Button>
    </div>
  );
}
