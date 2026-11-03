# 06 – Umsetzungsplan

Claude Code arbeitet die Meilensteine selbstständig ab und hält nur an drei **Prüfpunkten** an. Dort bekommt der Auftraggeber eine kurze Zusammenfassung in einfachen Worten und eine Ausprobier-Checkliste fürs Handy. Die Abnahmekriterien je Meilenstein prüft Claude Code selbst (Tests, Playwright, Screenshots).

| Prüfpunkt | nach | Was der Auftraggeber tut |
|---|---|---|
| 1 | M0 + M1 + M2 | App-Adresse in Safari öffnen, zum Home-Bildschirm hinzufügen, eine Kurz-Sitzung durchspielen, Rückmeldung geben |
| 1b (Zwischen-Prüfpunkt) | M2b | Pilotlektionen 0.1, 0.3, 0.5, 0.6 und C5 auf dem Handy durchspielen, Figuren, Lernpfad und Motivationssystem ansehen; Freigabe für M2c |
| 2 | M2c + M3 + M4 + M5 | Lernpfad, Fallmodus am Laptop und eine Mini-Klausur ausprobieren; MBG-Dashboard ansehen |
| 3 | M6 + M7 | Vorher: kostenloses Cloudflare-Konto anlegen. Dann Handy und Laptop per QR-Code verbinden, auf dem Handy lernen, am Laptop prüfen, ob der Stand ankommt; Stichprobe von Theorie-Karten; danach Link an die lernende Person weitergeben |

## M0 – Fundament
- Vite + React + TS (strict), Tailwind, ESLint/Prettier, Vitest, Playwright.
- vite-plugin-pwa mit Manifest, Platzhalter-Icons.
- GitHub Actions: Checks und Deploy auf GitHub Pages.
- Design-Tokens hell/dunkel, Grundlayout mit Navigation (Start, Lernpfad, Firma, Statistik, Einstellungen).
**Abnahme:** Leere App ist unter der Pages-URL erreichbar, als App auf iPhone und Android installierbar, offline startbar, CI grün.

## M1 – Fach-Engine (ohne UI)
- `money.ts`, `accounts.ts`, `booking.ts` (Vergleich, Teilbewertung, Fehlertypen), `linear.ts`, `rng.ts`.
- Generatoren: C5/D4 Skonto, B3 USt-Abschluss, E4 Bestandsveränderungen, H4 kalk. Abschreibung, I4 Stufenleiter, I5 Simultan, J3 Äquivalenzziffern, J4 Zuschlagskalkulation.
- Tests: alle Golden Cases aus `04-fachregeln.md`; Property-Tests mit je 1.000 zufälligen Seeds.
**Abnahme:** `npm test` grün; Testbericht zeigt jeden Golden Case einzeln.

## M2 – Lern-UI Kern
- Interaktionstypen: `buchungssatz`, `rechenkette`, `tabelle`, `mc`, `aufgabe-erkennen`.
- Sitzungsablauf Kurzmodus mit Feedback, gestuften Hilfen, Fehlertyp-Erklärungen.
- Speicherung der `AttemptEvent`s in IndexedDB.
**Abnahme:** Eine 10-Minuten-Sitzung mit den M1-Generatoren ist auf dem Smartphone flüssig bedienbar; falsche Antworten zeigen den konkreten Denkfehler.

## M2b – Lektionen-Pilot, Figuren, Motivation (nach `09-lektionen.md` und `10-optik-und-motivation.md`)
- Figuren (Open Peeps, CC0) mit mindestens 6 Ausdrücken, gezeichnete Schauplätze, Lektions-Player mit allen 14 Bildschirmtypen, Visualisierungs-Bausteine T-Konto, Bilanz-Waage, Brutto-Netto-Balken, Beleg-Ansicht, Lager-Ansicht.
- Lernpfad im Duolingo-Stil (Lektion → Übung → Wiederholung) mit Überspringen auf drei Ebenen (Lektion, Abschnitt, Einstufung).
- Motivationssystem: Tagesziel, Tagesserie mit Serienschutz und Reparatur, Tagesaufgaben, XP und Stufen, Karrierestufen, Erfolge, Belohnungsmomente, Wochenrückblick, Klausur-Readiness. Push-Erinnerungen folgen mit dem Abgleichsdienst in M6.
- Tabellenaufgaben auf dem Handy: Laptop-Hinweis, Liste „Am Laptop weitermachen“, Teilschritte im Kurzmodus.
- Pilotlektionen 0.1, 0.3, 0.5, 0.6, C5.
**Abnahme:** Eine Person ohne Vorwissen versteht nach 0.1 → 0.6 die Grundidee der Buchhaltung und kann nach C5 die Skonto-Übung lösen; jede Pilotlektion erfüllt die Qualitäts-Checkliste aus `09-lektionen.md`; Serie und Serienschutz funktionieren über simulierte Datumswechsel.

## M2c – Lektionen Ausbau (erst nach Freigabe am Zwischen-Prüfpunkt)
- Restliche Lektionen von Abschnitt 0 (0.2, 0.4, 0.7), Abschnitt A (A1–A7), Abschnitt B (B1–B3) und Lektionen für alle Skills mit Übungen (D4, E4, H4, I4, I5, J3, J4); fehlende Visualisierungs-Bausteine (Kontenkreislauf, Kostenstellen-Netz, Kalkulations-Treppe, Abschreibungs-Verlauf, Kostenfunktion).
**Abnahme:** wie M2b für alle neuen Lektionen.

## M3 – Lernpfad und Wiederholung
- Curriculum aus `02-curriculum.md`, Lernpfad-Ansicht mit Kompetenzringen.
- FSRS-Scheduler, Sitzungsmix 70/30, Interleaving.
- Einstufungstest.
- Readiness-Anzeige je Abschnitt und gesamt.
**Abnahme:** Nach Einstufung schlägt die App sinnvolle Sitzungen vor; Ringe verblassen im Zeitraffer-Test (simuliertes Datum).

## M4 – Fallmodus und Klausuren
- Interaktionstypen `tkonto`, `gleichungssystem`, `fehler-finden`, `kurzantwort`.
- Fallmodus mit Folgefehler-freiem Weiterrechnen; Fall E5 „Geschäftsgang" und ein KLR-Fall (BAB → Leistungsverrechnung → Zuschlagskalkulation).
- Mini-Klausur je Abschnitt und Probeklausur (Verteilung aus `02-curriculum.md`), Zeitlimit, Punktebewertung, Auswertung nach Skills.
**Abnahme:** Eine Probeklausur ist am Laptop vollständig bearbeitbar und wird mit Punkten und Skill-Auswertung bewertet.

## M5 – Firma und Motivation (Motivationssystem bereits in M2b; hier MBG-Dashboard und Feinschliff)
- MBG-Dashboard (Bilanz/GuV wachsen mit Abschnitten, Zeitleiste „Geschäftsjahr"), Hinweis auf fiktive Zahlen.
- Wochenziel mit Puffer, XP, Meilensteine (max. 15).
- Statistik: Lernzeit, Fehlerprofil (häufigste Fehlertypen).
**Abnahme:** Keine Bestrafungsmechanik vorhanden; Wochenziel und Puffer funktionieren über Datumswechsel.

## M6 – Automatischer Geräte-Abgleich und eingebettete Hilfe
- Cloudflare Worker + D1 gemäß `05-technik.md` aufsetzen und deployen (Auftraggeber legt vorher nur ein kostenloses Cloudflare-Konto an und bestätigt `wrangler login` im Browser).
- Kopplung per QR-Code und 8-Wörter-Code, Hintergrund-Abgleich, Statusanzeige, Zusammenführen und FSRS-Rekonstruktion.
- Rückfallebene Datei sichern/übernehmen; Onboarding, Hilfe-Seite, Einstellungen.
- Skript `scripts/meldungen.ts`, das alle `meldung`-Ereignisse aus D1 liest und als Liste ausgibt.
- Vor der Übergabe: Testdaten des Auftraggebers entfernen, damit die lernende Person mit einem frischen Stand startet.
**Abnahme:** Zwei verbundene Geräte zeigen nach einer Sitzung auf dem einen innerhalb von 5 Minuten (bzw. beim Öffnen) denselben Stand auf dem anderen; offline gelernte Sitzungen werden nachgeholt; keine Doppelungen; Lernpause von 14 Tagen (simuliert) beeinträchtigt den Abgleich nicht.

## M7 – Restliche Inhalte
- Spezifikationen für alle übrigen Generatoren schreiben, dann bauen; Teilkosten-Generatoren K1–K9 mit Golden Cases GC-21 bis GC-25.
- Theorie-Inhalte über die Content-Pipeline (`07-content-pipeline.md`) für alle Theorie-Skills.
- Plagiatsprüf-Skript (`scripts/check-overlap.ts`, liest `quellen/` lokal) und Faktenabgleich-Durchlauf gemäß `07-content-pipeline.md`.
- Meldefunktion „Fehler melden“ mit Ansicht „Gemeldete Inhalte“ in den Einstellungen.
**Abnahme:** Jeder Skill aus `02-curriculum.md` hat übbare Inhalte; alle aktiven Theorie-Inhalte haben einen dokumentierten Prüfvermerk; keine Überschneidung über 8 Wörter mit den Lehrbriefen.

## Version 2 (nicht jetzt)
KI-Tutor („Warum ist meine Lösung falsch?“) als weiterer Endpunkt im bestehenden Cloudflare Worker.
