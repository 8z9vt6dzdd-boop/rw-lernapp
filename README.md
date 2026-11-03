# Übergabepaket: Lern-App Rechnungswesen

Dieses Paket enthält alles, was Claude Code braucht, um die App zu bauen.

## So startest du

1. GitHub-Konto anlegen (github.com), falls noch nicht vorhanden.
2. Claude Code installieren und anmelden.
3. Einen Ordner anlegen (z. B. `rw-lernapp`), dieses Paket hinein entpacken, darin einen Unterordner `quellen/` anlegen und alle Studienunterlagen hineinlegen. `quellen/` wird nie hochgeladen.
4. Claude Code in diesem Ordner starten und diesen Auftrag einfügen:

   > Lies CLAUDE.md und alle Dateien in docs/. Richte Git ein, lege ein öffentliches GitHub-Repository „rw-lernapp" an, verbinde es und prüfe vor dem ersten Hochladen, dass quellen/ nicht enthalten ist. Arbeite dann die Meilensteine selbstständig ab und melde dich nur an den drei Prüfpunkten aus docs/06-umsetzungsplan.md – in einfachen Worten, ohne Fachjargon.

5. Vor Prüfpunkt 3 meldet sich Claude Code und bittet dich, ein kostenloses Konto bei cloudflare.com anzulegen (für den automatischen Abgleich zwischen Handy und Laptop). Danach einmal im Browser die Anmeldung bestätigen, den Rest erledigt Claude Code.
6. An jedem der drei Prüfpunkte: App auf dem Handy öffnen, die Checkliste von Claude Code ausprobieren, Rückmeldung in normalen Worten geben („Der Button ist zu klein", „Diese Buchung ist falsch") und „weiter" schreiben.
7. Nach Prüfpunkt 3: den Link an die lernende Person schicken. Alles Weitere (Installation aufs Handy, Geräte per QR-Code verbinden, Einstellungen) erklärt die App selbst.

## Inhalt

| Datei | Zweck |
|---|---|
| CLAUDE.md | Projektauftrag und verbindliche Regeln für Claude Code |
| docs/01-didaktik.md | Didaktisches Konzept und Gamification-Regeln |
| docs/02-curriculum.md | Lernpfad, Skills, Klausurrelevanz |
| docs/03-aufgabentypen.md | Interaktionstypen und Generator-Spezifikationen |
| docs/04-fachregeln.md | Buchungskonventionen, Kontenliste, Rundung, Golden Cases |
| docs/05-technik.md | Architektur, Datenmodell, automatischer Abgleich, PWA, eingebettete Hilfe |
| sync-worker/schema.sql | Datenbank für den automatischen Abgleich |
| docs/06-umsetzungsplan.md | Meilensteine mit Abnahmekriterien |
| docs/07-content-pipeline.md | Wie Theorie-Inhalte entstehen und geprüft werden |
| docs/08-firma-mbg.md | Rahmenfirma MBG Paderborn: Produkte, Konten, Kostenstellen, Geschäftsjahr |
| content/beispiele/ | Beispiel-Inhalte im Zielformat |

## Festgelegte Rahmenbedingungen

- Rahmenfirma: MBG Paderborn als fiktive Lernversion (docs/08-firma-mbg.md).
- Inhalte: Vollkostenrechnung laut Lehrbriefen plus Teilkostenrechnung aus den Lehrbuch-Übungen.
- Probeklausur: 90 Punkte in 90 Minuten, ca. 40 Punkte Buchführung und 50 Punkte KLR (abgeleitet aus den Musterklausuren; konfigurierbar).
- Theorie-Inhalte: keine manuelle Freigabe, stattdessen Faktenabgleich, Plagiatsprüfung und Meldefunktion.
- Repository öffentlich, Inhalte in eigenen Worten.
- Lokal zuerst, automatischer Abgleich zwischen Handy und Laptop über einen kostenlosen Cloudflare-Dienst; Kopplung per QR-Code, ohne Konto für die lernende Person.

Offen und nicht blockierend: Wochenziel (Standard 5 Sitzungen, in der App einstellbar).
