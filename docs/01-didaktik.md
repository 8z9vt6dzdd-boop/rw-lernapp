# 01 – Didaktisches Konzept

## Ausgangslage
- Eine lernende Person, berufsbegleitend, lernt in kurzen Häppchen (Smartphone) und in längeren Blöcken (Laptop).
- Grundlagen vorhanden; das Problem ist der Transfer auf Klausuraufgaben: Aufgabentyp erkennen, Lösungsweg strukturieren, mehrstufig sauber rechnen.
- Prüfung: eine gemeinsame Klausur Rechnungswesen (Buchführung/Abschluss + KLR I + KLR II). Format laut Musterklausuren: 1 Punkt = 1 Minute, nicht programmierbarer Taschenrechner, Rechenweg zählt, kaufmännische Rundung auf 2 Nachkommastellen.
- Kein fester Klausurtermin. Optional kann ein Datum gesetzt werden; dann priorisiert die Wiederholung schwache Skills mit hoher Klausurrelevanz.

## Leitprinzipien (Forschungsbasis)
1. **Retrieval Practice, low-stakes.** Abrufen statt Wiederlesen. Kein Druck, keine Strafen.
2. **Spaced Repetition mit FSRS.** Wiederholung pro Skill nach Vergessenskurve.
3. **Interleaving als Hauptmodus der Wiederholung.** Gemischte Aufgabentypen trainieren das Erkennen, welches Verfahren gefragt ist. Neues wird zunächst geblockt geübt.
4. **Expertise-Reversal beachten.** Komplett vorgerechnete Beispiele nur für neue Skills. Für bekannte Skills: erst selbst versuchen, dann gestufte Hilfen.
5. **Gestufte Hilfen statt Vorrechnen:** Hinweis 1 (welcher Aufgabentyp/welches Schema), Hinweis 2 (nächster Schritt konkret), dann Lösungsschritt. Genutzte Hilfen senken die FSRS-Bewertung, nicht die XP.
6. **Fehlerbasiertes Feedback.** Falsche Optionen und Prüfregeln basieren auf typischen Denkfehlern (siehe `03-aufgabentypen.md`). Jeder erkannte Fehlertyp hat eine gezielte Erklärung.
7. **Erroneous Examples.** Fertige Lösungen mit eingebautem Fehler finden und begründen.
8. **Klausurnähe.** Jeder Abschnitt endet mit einer Mini-Klausur im Originalformat (Punkte, Zeit, Rechenweg).

## Lektionen zuerst
Neue Inhalte werden in kurzen, interaktiven Lektionen vermittelt (Rätsel-Einstieg, Alltagsvergleich, Figuren, Erkunden, Vorhersage, Merksatz, Klausurbrücke, Cliffhanger), bevor geübt wird. Einzelheiten: `09-lektionen.md`. Wer etwas schon kann, überspringt per Kurztest (Lektion, Abschnitt, Einstufung).

## Lernmodi
| Modus | Gerät | Dauer | Inhalt |
|---|---|---|---|
| Lektion | beide (mobil zuerst) | 3–8 Min. | Wissen aufbauen: Geschichte, Erkunden, Vorhersage, Merksatz, Klausurbrücke |
| Kurzmodus | Smartphone | 5–10 Min. | fällige Wiederholungen (FSRS), Buchungssätze, Kontenzuordnung, „Aufgabe erkennen", Theorie-Karten |
| Fallmodus | Laptop | 30+ Min. | mehrstufige Fälle (Geschäftsgang, BAB, Leistungsverrechnung, Kalkulation) mit Tabellen und Zwischenergebnissen |
| Mini-Klausur | beide | 15–30 Min. | Abschluss eines Abschnitts, Originalformat, Zeitlimit |
| Probeklausur | Laptop | 60–90 Min. | gemischte Gesamtklausur über alle drei Lehrbriefe, Punkteverteilung gemäß Gewichtung in `02-curriculum.md` |

Jede Sitzung im Kurzmodus mischt automatisch: ca. 70 % fällige Wiederholungen, 30 % Neues aus dem aktuellen Abschnitt.

## Einstufung
Beim ersten Start ein adaptiver Einstufungstest (ca. 15 Aufgaben, 10–15 Min.). Sicher beherrschte Skills werden als „gelernt" markiert und gehen direkt in die Spaced Repetition. Die Einstufung ist jederzeit wiederholbar.

## Kompetenzmodell
- Status je Skill: neu → in Übung → gefestigt.
- Übergang zu „gefestigt": 3 korrekte Lösungen ohne Hilfe an unterschiedlichen Tagen.
- Anzeige als **Kompetenzring** pro Skill und Abschnitt. Der Ring zeigt die aktuelle Abrufwahrscheinlichkeit aus FSRS und verblasst sichtbar, wenn lange nicht geübt wurde.
- **Klausur-Readiness** je Abschnitt und gesamt: Mittelwert der Abrufwahrscheinlichkeiten, gewichtet nach Klausurrelevanz.

## Motivation (ersetzt durch `10-optik-und-motivation.md`)
Die frühere Regel „dezent: Wochenziel statt Tagesserie, XP sparsam, kein Konfetti“ ist aufgehoben. Es gilt `10-optik-und-motivation.md`:
- **Rahmenhandlung MBG Paderborn** mit festen Figuren; der Lernpfad ist eine Karriere mit Beförderungen.
- **Tagesziel und Tagesserie** mit Serienschutz und Reparatur; alles Verpasste ist reparierbar.
- **Tagesaufgaben, XP und Stufen** (nie Abzug), Wochenrückblick, rund 25 Erfolge, Belohnungsmomente.
- **Weiterhin verboten:** Leben/Herzen, Ranglisten, Schuldgefühle-Texte, künstliche Verknappung, roter Druck-Countdown, mehr als eine Erinnerung pro Tag.

## Fehlerdaten für Version 2
Jede Antwort wird als Ereignis gespeichert (`AttemptEvent`, siehe `05-technik.md`). Daraus entstehen ein Fehlerprofil („häufigste Denkfehler") und später der Kontext für einen KI-Tutor.
