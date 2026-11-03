# 07 – Content-Pipeline für Theorie-Inhalte

## Grundsatz
Die App ist öffentlich erreichbar (öffentliches Repository, GitHub Pages). Die Lehrbriefe in `quellen/` sind urheberrechtlich geschützt und bleiben lokal. Inhalte im Repository werden **inhaltlich aus den Lehrbriefen übernommen, aber eigenständig formuliert**: keine wörtlichen Passagen, keine kopierten Tabellen, Abbildungen oder Zahlenbeispiele. Fachbegriffe und Definitionsbestandteile werden exakt wie im Lehrbrief verwendet, weil die Klausur genau diese Begriffe abfragt.

Es gibt **keine manuelle Freigabe**. Die Qualität sichern stattdessen automatische Prüfungen und eine Meldefunktion.

## Ablauf je Theorie-Skill
1. **Entwurf:** Claude Code liest lokal das passende Lehrbrief-Kapitel (Zuordnung in `02-curriculum.md`) und erstellt 5–15 Elemente im Format unten. Jedes Element trägt einen Quellverweis (`"quelle": "BA 6.3, S. 157"`).
2. **Faktenabgleich (zweiter Durchlauf):** In einem getrennten Durchlauf wird jedes Element gegen die Quellstelle geprüft: Stimmt die Aussage inhaltlich mit dem Lehrbrief überein? Fehlt eine wesentliche Bedingung oder Ausnahme? Werden die Fachbegriffe korrekt verwendet? Ergebnis je Element: `ok`, `korrigiert` (mit Korrektur) oder `zurueckgehalten` (mit Begründung).
3. **Plagiatsprüfung:** Ein Skript vergleicht jedes Element mit dem lokalen Lehrbrief-Text (n-Gramm-Abgleich). Übereinstimmungen von mehr als 8 aufeinanderfolgenden Wörtern (außer feststehenden Fachbegriffen und Gesetzeszitaten) führen zu `zurueckgehalten`, bis neu formuliert.
4. **Veröffentlichung:** Elemente mit `ok` oder `korrigiert` erhalten Status `aktiv` und erscheinen in Lernsitzungen. Zurückgehaltene Elemente landen in `content/zurueckgehalten.md` mit Begründung.
5. **Meldefunktion in der App:** Jede Theorie-Karte und jede Generator-Aufgabe hat einen Button „Fehler melden" (optional mit Kommentar). Gemeldete Elemente werden sofort aus allen Sitzungen genommen (Status `gemeldet`) und erscheinen in den Einstellungen unter „Gemeldete Inhalte". Die Meldung ist ein Ereignis vom Typ `meldung` (Element-ID, Seed, Kommentar, Zeit) und landet über den Abgleich in der D1-Datenbank. Der Auftraggeber muss die lernende Person nicht fragen: Auf den Auftrag „Sieh dir die gemeldeten Inhalte in der Abgleich-Datenbank an und behebe sie" liest Claude Code alle `meldung`-Ereignisse per `wrangler d1 execute` aus, behebt die Elemente, durchläuft Schritt 2 und 3 erneut und setzt sie mit einem neuen App-Update wieder auf `aktiv`. Behebung: Element korrigieren, erneut Schritt 2 und 3 durchlaufen, wieder `aktiv`.

## Formate
Siehe Beispiele in `content/beispiele/`.
- `karte`: Frage, Antwort (max. 60 Wörter), optional Beispiel.
- `mc`: Frage, 4 Optionen, richtige Option, je Distraktor der zugrunde liegende Denkfehler.
- `kurzantwort`: Klausurfrage im Stil „Erläutern Sie …", Punkte, Checkliste der erwarteten Aussagen (je Aussage Punktwert), Musterantwort.
- `zuordnung`: Begriffe/Sachverhalte mit Kategorien (für G1, G2, G5).

Pflichtfelder für alle Elemente: `id`, `skill`, `typ`, `quelle`, `status` (`entwurf` | `aktiv` | `zurueckgehalten` | `gemeldet`), `pruefung` (Ergebnis aus Schritt 2 und 3 mit Datum).

## Qualitätsregeln
- Jede Antwort muss ohne Lehrbrief verständlich sein.
- Bei Uneinigkeit zwischen Lehrbrief und anderen Quellen gilt der Lehrbrief.
- Keine Inhalte ergänzen, die nicht im Lehrbrief stehen.
