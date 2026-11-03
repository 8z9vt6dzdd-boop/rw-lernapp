# CLAUDE.md – Lern-App Rechnungswesen

## Auftrag
Baue eine gamifizierte Lern-Web-App (PWA) für das Fach Rechnungswesen im berufsbegleitenden BWL-Fernstudium (PFH Göttingen). Die App hat genau **eine Nutzerin/einen Nutzer**. Ziel ist das Bestehen **einer gemeinsamen Klausur Rechnungswesen** mit drei Lehrbriefen: Buchführung und Abschluss, Kosten- und Leistungsrechnung I, Kosten- und Leistungsrechnung II.

Die Person hat Grundlagen, scheitert aber am **Transfer auf Klausuraufgaben**. Die App trainiert deshalb vor allem: Aufgabentypen erkennen, mehrstufige Rechenwege sauber durchführen, typische Fehler vermeiden.

**Rahmenfirma:** Alle Sachverhalte, Fälle und Klausuren spielen bei der MBG aus Paderborn (fiktive Lernversion eines Getränkeherstellers, siehe `docs/08-firma-mbg.md`). Es werden Voll- und Teilkostenrechnung abgebildet.

Lies vor jeder Arbeit alle Dateien in `docs/`. Bei Widersprüchen gilt: `04-fachregeln.md` > `03-aufgabentypen.md` > übrige Dokumente. Für Lernablauf, Optik und Motivation haben `09-lektionen.md` und `10-optik-und-motivation.md` Vorrang vor älteren Aussagen. Wenn etwas fachlich unklar ist: **fragen, nicht raten.**

## Verbindliche Regeln

1. **Fachliche Korrektheit vor allem anderen.** Jede Lösung wird vom Code berechnet, nie hart codiert übernommen. Jeder Generator braucht Unit-Tests gegen die Golden Cases in `docs/04-fachregeln.md`. Die Musterlösungen der Hochschule enthalten nachweislich Fehler und sind keine Testreferenz.
2. **Geldbeträge nie als Float.** Beträge intern als ganzzahlige Cent (oder `decimal.js`), Sätze als Dezimal-Strings. Gleichungssysteme (Simultanverfahren) mit exakten Brüchen (`fraction.js`) lösen.
3. **Rundung:** kaufmännisch auf 2 Nachkommastellen, Antworttoleranz gemäß `04-fachregeln.md`.
4. **Reale Firma als Kulisse:** Die MBG Group existiert. Niemals echte Zahlen, Marken, Logos oder Personen verwenden; Hinweis „fiktive Zahlen" gemäß `docs/08-firma-mbg.md` anzeigen.
5. **Urheberrecht:** Das Repository ist öffentlich. Niemals Text, Aufgaben, Abbildungen oder Zahlenbeispiele aus `quellen/` (Lehrbriefe, Lehrbuch Schmolke/Deitermann, Musterklausuren) ins Repository übernehmen. Inhalte werden inhaltlich aus den Lehrbriefen übernommen, aber in eigenen Worten und mit eigenen Zahlen formuliert. Es gibt keine manuelle Freigabe; die Qualität sichern Faktenabgleich, Plagiatsprüfung und Meldefunktion aus `docs/07-content-pipeline.md`. `quellen/` ist gitignored und darf nur lokal gelesen werden.
6. **Keine Bestrafung von Fehlern:** keine Leben/Herzen, keine XP-Abzüge. Fehler führen zu Erklärung und erneuter Übung.
7. **Warm, unterhaltsam, erwachsen** (`10-optik-und-motivation.md`): handgezeichnete Figuren auf Basis von Open Peeps mit Ausdrücken, gezeichnete Schauplätze, kurze Animationen und Belohnungsmomente (auch Konfetti), Tagesserie mit Serienschutz, Karriere bei der MBG. Zahlen bleiben in gut lesbarer Schrift mit tabellarischen Ziffern, Dark Mode bleibt. Nie albern, nie manipulativ; „Bewegung reduzieren“ wird respektiert.
8. **Erst verstehen, dann üben** (`09-lektionen.md`): Jeder Skill beginnt mit einer interaktiven Lektion (Rätsel, Alltagsvergleich, Figuren, Klausurbrücke, Cliffhanger). Übungen werden nach der Lektion oder nach bestandenem Überspringen-Test frei.
9. **Zwei Gerätewelten:** Kurzmodus und Lektionen mobil-optimiert (Daumenbedienung, 5–10 Minuten), Fallmodus laptop-optimiert (Tabellen, T-Konten, mehrstufige Fälle). Beides muss auf beiden Geräten funktionieren. Tabellenaufgaben auf dem Handy: vorher Hinweis „Diese Aufgabe lässt sich am Laptop deutlich bequemer bearbeiten.“ mit „Trotzdem hier lösen“ / „Für den Laptop merken“ (Liste „Am Laptop weitermachen“ auf der Startseite am Laptop); im Kurzmodus auf dem Handy Teilschritte statt ganzer Tabellen.
10. **Lokal zuerst, automatisch abgeglichen:** Alles ist in der App enthalten und funktioniert offline. Der Lernstand wird automatisch zwischen den Geräten abgeglichen über einen kleinen Cloudflare Worker mit D1 (kostenloser Plan), gekoppelt per QR-Code, ohne Konto für die lernende Person (siehe `docs/05-technik.md`). Datei-Teilen bleibt als Rückfallebene. Alle Einstellungen und Hilfen liegen in der App, nicht in externen Anleitungen.
11. **Sprache:** komplette UI und Inhalte auf Deutsch. Fachbegriffe und Kontenbezeichnungen exakt wie in `04-fachregeln.md`.
12. **Vorbereitung KI-Tutor (Version 2):** Jede falsche Antwort wird strukturiert gespeichert (Aufgabe, Parameter, Eingabe, erwartete Lösung, erkannter Fehlertyp). Keinen KI-Tutor in Version 1 bauen.

## Tech-Stack
Vite, React, TypeScript (strict), Tailwind CSS, vite-plugin-pwa, ts-fsrs, decimal.js, fraction.js, idb (IndexedDB), Vitest, Playwright. Figuren: Open-Peeps-Bausteine (CC0) als Pfaddaten unter `src/assets/peeps/`. Hosting auf GitHub Pages über GitHub Actions. Abgleich: Cloudflare Workers + D1, Deployment mit wrangler (`sync-worker/`). Keine weiteren Frameworks oder Dienste ohne Rückfrage.

## Arbeitsweise
- Der Auftraggeber ist nicht technisch. Erkläre nichts in Fachjargon, stelle keine technischen Fragen, triff technische Entscheidungen selbst im Rahmen dieser Dokumente.
- Arbeite die Meilensteine aus `docs/06-umsetzungsplan.md` **selbstständig** nacheinander ab. Halte nur an den drei **Prüfpunkten** und an vereinbarten Zwischen-Prüfpunkten (z. B. nach M2b) an. Dort: kurze Zusammenfassung in einfachen Worten, die Web-Adresse der App und eine Checkliste mit 3–5 Dingen, die der Auftraggeber auf dem Handy ausprobieren soll.
- Prüfe zwischen den Prüfpunkten selbst: Tests, Playwright-Durchläufe auf Handy- und Laptop-Größe, Screenshots ansehen. Fehler selbst beheben.
- Fachliche Unklarheiten sammeln und gebündelt am nächsten Prüfpunkt stellen, nicht einzeln unterbrechen. Bis dahin mit der vorsichtigsten Annahme weiterarbeiten und sie in `04-fachregeln.md` als `[ANNAHME – bitte prüfen]` markieren.
- Fachlogik (`src/engine/`) ist strikt von UI getrennt und vollständig getestet. Kleine Commits, CI grün.

## Definition of Done (je Feature)
Typisiert, getestet (Engine: Golden Cases plus Property-Tests, z. B. Soll = Haben), auf 375 px Breite und Desktop geprüft, Light und Dark Mode, offline nutzbar, keine Konsolenfehler.
