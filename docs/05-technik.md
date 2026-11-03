# 05 – Technik

## Architektur
Statische PWA auf GitHub Pages. Alle Lernlogik und alle Inhalte laufen im Browser. Einziger externer Dienst: ein kleiner Cloudflare Worker für den automatischen Geräte-Abgleich.

```
src/
  engine/              # reine Fachlogik, kein React, 100 % getestet
    money.ts           # Cent-Arithmetik, Rundung, Toleranzprüfung
    accounts.ts        # Kontenliste, Synonyme, Kontentypen (aus 04-fachregeln.md)
    booking.ts         # Buchungssatz-Modell, Validierung, Vergleich, Fehlertyp-Erkennung
    linear.ts          # exakter Gleichungslöser (fraction.js) für Simultanverfahren
    generators/        # ein Modul je Skill (Schnittstelle siehe 03-aufgabentypen.md)
    rng.ts             # seedbarer Zufallsgenerator
  learning/
    scheduler.ts       # FSRS (ts-fsrs), Sitzungszusammenstellung 70/30, Interleaving
    mastery.ts         # Skill-Status, Kompetenzringe, Readiness
    placement.ts       # Einstufungstest
    exam.ts            # Mini-Klausur und Probeklausur
  content/
    curriculum.ts      # Abschnitte, Skills, Relevanz, Voraussetzungen
    theory/*.json      # Theorie-Karten und Kurzantworten (siehe 07-content-pipeline.md)
  storage/
    db.ts              # IndexedDB über idb
    sync.ts            # automatischer Abgleich mit dem Cloudflare Worker
    transfer.ts        # Rückfallebene: Lernstand als Datei teilen/übernehmen, Zusammenführen
  ui/
    components/        # Interaktionstypen aus 03-aufgabentypen.md
    screens/           # Start, Lernpfad, Sitzung, Fall, Klausur, Firma, Statistik, Einstellungen
  config.ts            # Firma (Name, Branche), Wochenziel, USt-Standard, Klausurdatum
```

## Datenmodell (lokal, IndexedDB)

```ts
type SkillId = string;

interface SkillCard {               // eine FSRS-Karte je Skill bzw. je Theorie-Karte
  id: string;                       // SkillId oder theory:<cardId>
  fsrs: Card;                       // ts-fsrs Card-Objekt
  status: 'neu' | 'in-uebung' | 'gefestigt';
  correctWithoutHelpDays: string[]; // ISO-Daten, für Statuswechsel
}

interface AttemptEvent {            // append-only, Grundlage für Übertragung und KI-Tutor (V2)
  id: string;                       // UUID
  ts: string;                       // ISO-Zeitstempel
  deviceId: string;
  skillId: SkillId;
  variant?: string;
  seed?: number;                    // reproduziert die Aufgabe
  mode: 'kurz' | 'fall' | 'mini-klausur' | 'probeklausur' | 'einstufung';
  answer: unknown;                  // strukturierte Eingabe
  correct: boolean;
  partial?: number;                 // 0..1 Teilpunkte
  hintsUsed: 0 | 1 | 2 | 3;
  errorTypes: string[];             // erkannte Fehlertypen
  durationMs: number;
  fsrsRating: 1 | 2 | 3 | 4;        // Again/Hard/Good/Easy, abgeleitet aus correct + hints + Dauer
}

interface Settings { firma: FirmaConfig; weeklyGoal: number; examDate?: string; theme: 'auto'|'hell'|'dunkel'; pairingCode?: string; lastSyncAt?: string; teilkostenInKlausur: boolean; }
```

**FSRS-Rating-Ableitung (Generator-Aufgaben):** falsch → 1; richtig mit Hinweis 2 oder 3 → 2; richtig mit Hinweis 1 oder deutlich über der eigenen Median-Dauer → 3; richtig ohne Hilfe → 4. Theorie-Karten nutzen die Selbsteinschätzung der Person.

**Wichtig:** Der FSRS-Zustand wird nicht abgeglichen, sondern jederzeit aus den `AttemptEvent`s rekonstruiert. Dadurch lassen sich Lernstände zweier Geräte konfliktfrei zusammenführen.

## Lokal zuerst, automatischer Abgleich im Hintergrund
Die App funktioniert vollständig offline; alle Inhalte (Generatoren, Theorie, MBG) sind im App-Bundle. Zusätzlich gleicht sie den Lernstand **automatisch** zwischen Handy und Laptop ab. Dafür gibt es genau einen kleinen Dienst: einen **Cloudflare Worker mit D1-Datenbank** (kostenloser Plan).

Warum Cloudflare statt Supabase: Kostenlose Supabase-Projekte werden nach 7 Tagen ohne Aktivität pausiert und müssen manuell wieder aktiviert werden. Bei einer berufsbegleitend lernenden Person sind Lernpausen von einer Woche normal; der Abgleich würde dann still ausfallen. Der Cloudflare-Free-Plan pausiert nicht; die Limits (100.000 Worker-Anfragen und 100.000 geschriebene Datenbankzeilen pro Tag) liegen für eine Person um Größenordnungen über dem Bedarf.

### Kopplung der Geräte (einmalig, ohne Technik)
1. Beim ersten Start erzeugt die App einen Kopplungscode (128 Bit Zufall).
2. Einstellungen → „Weiteres Gerät verbinden" zeigt einen **QR-Code**. Er enthält einen Link zur App mit dem Code (`…/#verbinden-<code>`).
3. Auf dem zweiten Gerät QR-Code mit der Kamera scannen → App öffnet sich → „Mit diesem Lernstand verbinden?" → Ja. Fertig.
4. Alternativ: Code als 8 deutsche Wörter zum Abtippen.
Kein Konto, kein Passwort, keine E-Mail.

### Ablauf des Abgleichs
- Jede Antwort wird zuerst lokal gespeichert (IndexedDB) und in eine Warteschlange gelegt.
- Abgleich beim Start, nach jeder Sitzung, beim Zurückkehren in die App und alle 5 Minuten bei bestehender Verbindung: neue Ereignisse hochladen, Ereignisse des anderen Geräts abholen, lokal zusammenführen (Vereinigung über Event-`id`), Wiederholungsplan neu berechnen.
- Ohne Netz läuft alles weiter; der Abgleich holt nach.
- **Statusanzeige** dezent in den Einstellungen und als kleines Symbol: „Abgeglichen vor 2 Min." bzw. „Wartet auf Verbindung". Wenn 3 Tage kein erfolgreicher Abgleich trotz Verbindung: verständlicher Hinweis.
- Keine Fachbegriffe wie „Sync", „Server" oder „Event" in der UI; es heißt „Geräte verbunden" und „Lernstand abgeglichen".

### Worker-Schnittstelle (`sync-worker/`)
- `POST /push` mit `{ code, events[] }` → speichert neue Ereignisse (`INSERT OR IGNORE`), max. 500 je Aufruf.
- `GET /pull?code=…&since=<ms>` → Ereignisse seit `since`, je mit `_received_at`; die App merkt sich den höchsten Wert.
- In der Datenbank liegt nur der SHA-256-Hash des Codes. Code-Mindestlänge prüfen, CORS nur für die GitHub-Pages-Adresse der App, einfache Begrenzung der Anfragen je Code und Minute.
- Gespeichert werden nur Lernereignisse, Fehlermeldungen (`meldung`) und Einstellungen, keine personenbezogenen Daten.
- Schema: `sync-worker/schema.sql`. Deployment mit `wrangler`; Claude Code richtet Worker, D1-Datenbank und die Worker-Adresse im Build vollständig selbst ein. Der Auftraggeber legt nur ein kostenloses Cloudflare-Konto an und bestätigt einmal die Anmeldung im Browser.

### Rückfallebene
„Lernstand teilen/übernehmen" per Datei (AirDrop, Nachricht) bleibt in den Einstellungen erhalten, als Sicherung und falls der Abgleich einmal ausfällt.

## PWA
- `vite-plugin-pwa`, Strategie `generateSW`, alle Assets vorab gecacht, App vollständig offline.
- Manifest: `display: standalone`, Theme-Farben hell/dunkel, Icons 192/512 px plus maskable, `apple-touch-icon`.
- Beim ersten Start auf iOS einmalig eine Anleitung „Zum Home-Bildschirm hinzufügen" zeigen (Safari kann Website-Daten nach 7 Tagen ohne Nutzung löschen, als Home-Bildschirm-App gilt ein eigener Nutzungszähler). Zusätzlich `navigator.storage.persist()` anfragen.
- Update-Hinweis bei neuer Version („Neue Version verfügbar – neu laden").

## Deployment
- GitHub Actions: bei Push auf `main` → Typecheck, Lint, Tests, Build, Deploy auf GitHub Pages. Claude Code richtet das vollständig selbst ein.
- `base` in `vite.config.ts` auf den Repository-Namen setzen.

## In der App eingebettet (statt Anleitung außerhalb)
- **Erster Start (Onboarding, 4 Bildschirme):** Begrüßung bei der MBG; auf dem iPhone die Anleitung „Zum Home-Bildschirm hinzufügen" mit Abbildung (nur wenn nicht schon installiert); „Lernst du auch auf einem zweiten Gerät?" → QR-Code zum Verbinden; kurzer Einstufungstest oder „überspringen".
- **Einstellungen:** Wochenziel, optionales Klausurdatum, Teilkosten in Probeklausuren ein/aus, Darstellung hell/dunkel, „Weiteres Gerät verbinden" (QR-Code) mit Abgleichstatus, Lernstand als Datei sichern/übernehmen, gemeldete Inhalte, „Alles zurücksetzen" mit Sicherheitsabfrage.
- **Hilfe-Seite** in der App: wie die App funktioniert, wie man ein zweites Gerät verbindet, was die Kompetenzringe bedeuten.
- **Update-Hinweis:** Bei neuer Version erscheint „Neue Version verfügbar – jetzt laden".

## UI-Grundsätze
- Mobile first ab 360 px; Fallmodus ab 1024 px mit Zwei-Spalten-Layout (Sachverhalt links, Arbeitsfläche rechts).
- Zahlen in tabellarischen Ziffern, deutsches Zahlenformat (1.234,56 €), Eingabe akzeptiert Komma und Punkt sinnvoll (1.234,5 → 1234,50).
- Tastatur-Bedienung im Fallmodus (Tab durch Tabellenfelder, Enter prüft).
- Barrierearm: Kontraste WCAG AA, Fokuszustände sichtbar, Bedeutung nie nur über Farbe.

## Vorbereitung Version 2 (KI-Tutor)
Nicht bauen, aber vorsehen: `AttemptEvent` enthält alle nötigen Daten; ein späterer Tutor-Dienst bekommt Aufgabe (über Seed reproduzierbar), Eingabe, Lösung und erkannte Fehlertypen. Er kann später als weiterer Endpunkt im selben Cloudflare Worker laufen; der API-Schlüssel liegt dann nur dort.
