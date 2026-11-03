// Hilfe in der App: wie die App funktioniert, Geräte verbinden, Kompetenzringe, Klausuren.
import type { ReactNode } from 'react';
import { Button, Card, Icon } from '../components/ui';
import { navigate } from '../hooks';

function Abschnitt({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="font-semibold">{titel}</h2>
      <div className="mt-2 flex flex-col gap-2 text-[15px]">{children}</div>
    </Card>
  );
}

export function HilfeScreen() {
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => navigate('einstellungen')}
        className="flex h-10 items-center gap-1 self-start rounded-lg px-2 text-sm text-muted hover:bg-surface-2"
      >
        <Icon name="schliessen" className="h-5 w-5" /> Zurück
      </button>
      <h1 className="text-2xl font-semibold">Hilfe</h1>

      <Abschnitt titel="So funktioniert die App">
        <p>
          Jedes Thema beginnt mit einer kurzen Lektion: erst verstehen, dann üben. Danach wird die
          Übung frei. Was du schon kannst, überspringst du mit „Kann ich schon“ oder einem kurzen
          Test.
        </p>
        <p>
          Die <strong>Kurz-Sitzung</strong> (5–10 Minuten) mischt Wiederholungen und Neues. Sie ist
          fürs Handy gedacht. Fehler kosten nichts – du bekommst eine Erklärung und die Aufgabe
          kommt später noch einmal.
        </p>
      </Abschnitt>

      <Abschnitt titel="Fälle und Klausuren">
        <p>
          Am Laptop übst du wie in der Klausur: mehrstufige Fälle, Mini-Klausuren je Abschnitt und
          die Probeklausur mit 90 Punkten in 90 Minuten. Große Tabellen sind am Laptop deutlich
          bequemer. Auf dem Handy kannst du solche Aufgaben „für den Laptop merken“.
        </p>
      </Abschnitt>

      <Abschnitt titel="Handy und Laptop verbinden">
        <p>
          Öffne auf einem Gerät Einstellungen → <strong>Geräte verbinden</strong>. Dort steht ein
          QR-Code und 8 Wörter. Scanne den QR-Code mit der Kamera des anderen Geräts oder tippe die
          8 Wörter dort unter „Mit einem anderen Gerät verbinden“ ein.
        </p>
        <p>
          Danach gleicht sich dein Lernstand von selbst ab: beim Öffnen, nach jeder Sitzung und alle
          paar Minuten. Ohne Internet lernst du ganz normal weiter, der Abgleich holt alles nach.
          Ein Konto oder Passwort brauchst du nicht.
        </p>
        <p>
          iPhone-Tipp: Wenn du die App vom Home-Bildschirm nutzt, gib dort die 8 Wörter ein. Der
          QR-Code öffnet die App zunächst im Browser.
        </p>
      </Abschnitt>

      <Abschnitt titel="Was bedeuten die Ringe im Lernpfad?">
        <p>
          Der Ring um eine Übung zeigt, wie sicher du sie gerade abrufen kannst. Er füllt sich mit
          richtigen Antworten und wird mit der Zeit blasser, wenn du ein Thema lange nicht geübt
          hast. Dann ist es Zeit für eine Wiederholung – die Kurz-Sitzung plant sie automatisch ein.
        </p>
        <p>
          Der <strong>Klausur-Stand</strong> auf der Startseite fasst alle Ringe zusammen, gewichtet
          danach, wie oft ein Thema in Klausuren vorkommt.
        </p>
      </Abschnitt>

      <Abschnitt titel="Lernstand sichern">
        <p>
          Unter Geräte verbinden kannst du deinen Lernstand zusätzlich als Datei sichern und auf
          einem anderen Gerät übernehmen. Beide Stände werden zusammengeführt, nichts wird
          überschrieben.
        </p>
      </Abschnitt>

      <Abschnitt titel="Fehler im Inhalt?">
        <p>
          Wenn dir eine Aufgabe oder Karte falsch vorkommt, tippe auf „Fehler melden“. Der Inhalt
          wird sofort aus deinen Sitzungen genommen und geprüft. Gemeldetes findest du in den
          Einstellungen.
        </p>
      </Abschnitt>

      <Button onClick={() => navigate('geraete')}>Geräte verbinden</Button>
    </div>
  );
}
