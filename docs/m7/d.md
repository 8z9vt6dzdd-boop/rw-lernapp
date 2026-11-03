# M7 Batch d (Skills D1, D2, D3, D5, D6)

Quellen (nur lokal gelesen, eigene Formulierung): BA 2.3.4 (Privatentnahmen/-einlagen), BA 2.3.5.3 (Umsatzsteuer beim Verkauf), BA 3.2.1–3.2.3 mit Abb. 68–73 (Rücksendungen, Nachlässe netto/brutto, Abschluss Erlösberichtigungen), BA 3.3 Fußnote 30 (Konto Privat, Personensteuern), Aufbau der Musterklausur Buchführung (berechnete Verpackung/Fracht, Spediteurrechnung, Entnahme). Alle Zahlen eigen.

Code: `src/engine/generators/d/` (gemeinsame Bausteine in `gemeinsam.ts`), Registrierung `src/engine/generators/batches/d.ts`, Fehlertypen `src/engine/fehlertypen-batches/d.ts`. Neue Konten waren nicht nötig.

## Generator-Spezifikationen

### D1 – Verkauf (`D1-verkauf`, `verkauf.ts`, 3 Punkte)

- **Parameter:** Art (eigene Erzeugnisse 80 % / Handelswaren 20 %), Listenpreis netto (1.000–40.000 €, Schritt 100), Sofortrabatt (0 oder 5/10/15/20/25 %), optional Verpackung (40–600 €) und Fracht (60–900 €), jeweils netto oder brutto angegeben, USt 19 %, Ziel (85 %) oder sofortige Bankzahlung, Kunde aus `config.ts`.
- **Varianten:** `einfach`, `rabatt`, `nebenkosten`, `nebenkosten-brutto`, `handelswaren`; 20 % krumme Werte (Centbeträge).
- **Lösung:** Rabatt = Listenpreis × Satz (nur Warenwert); Warenwert = Listenpreis − Rabatt; Nebenkosten netto (brutto ÷ 1,19); Umsatzerlöse = Warenwert + Nebenkosten; USt = Umsatzerlöse × 19 %; Brutto = Summe.
- **Buchung:** Forderungen a. LL (bzw. Bank) [brutto] an Umsatzerlöse für eigene Erzeugnisse bzw. für Handelswaren [netto], an Umsatzsteuer.
- **Teile:** Rechenkette (Rabatt, Warenwert, Nebenkosten, Umsatzerlöse, USt, Brutto – je nach Fall), Buchungssatz.
- **Fehlertypen:** `steuer-falsches-konto`, `erloeskonto-verwechselt`, `rabatt-vergessen`, `sofortrabatt-gebucht`, `rabatt-auf-nebenkosten`, `verkaufsnebenkosten-vergessen`, `nebenkosten-als-aufwandsminderung`, `brutto-als-netto`.

### D2 – Rücksendung vom Kunden (`D2-ruecksendung-verkauf`, `ruecksendung-verkauf.ts`, 2 Punkte)

- **Parameter:** gegeben = Nettowert / Gutschrift brutto / Listenpreis mit ursprünglichem Rabatt (10–25 %) / zurückgegebene, berechnete Mehrwegverpackung mit gutgeschriebenem Anteil (50–100 %); Art Erzeugnisse/Handelswaren; Gutschrift mindert Forderung (80 %) oder wird per Bank zurückgezahlt (20 %); Grund der Rücksendung als Textbaustein.
- **Varianten:** `netto`, `brutto`, `rabatt`, `verpackung`, `handelswaren`.
- **Lösung:** Nettowert (ggf. Liste × (1 − Rabatt) bzw. Verpackung × Anteil, bzw. brutto ÷ 1,19), USt-Korrektur, Gutschrift brutto.
- **Buchung (Storno, Konvention 5):** Umsatzerlöse für eigene Erzeugnisse bzw. für Handelswaren [netto], Umsatzsteuer [Steuer] an Forderungen a. LL bzw. Bank [brutto].
- **Fehlertypen:** `steuer-falsches-konto`, `ruecksendung-als-erloesberichtigung`, `ruecksendung-auf-bestandskonto` (Fertige Erzeugnisse/Handelswaren statt Erlös), `ruecksendung-ohne-ust`, `brutto-als-netto`, `rabatt-vergessen`.

### D3 – Erlösberichtigungen (`D3-erloesberichtigung`, `erloesberichtigung.ts`, 3 Punkte)

- **Fall Nachlass:** Anlass Mängelrüge / Bonus / Kulanz; gegeben Prozentsatz auf Nettowert (Bonus: 2–5 % auf Jahresumsatz 20.000–300.000 €; Mängelrüge 5–20 %), Prozentsatz auf Bruttorechnung, Gutschrift brutto oder netto; Methode netto / brutto / offen (beide zulässig); Verrechnung mit Forderungen oder Überweisung per Bank.
- **Nettomethode:** Erlösberichtigungen [netto], Umsatzsteuer [Steuer] an Forderungen a. LL bzw. Bank [brutto].
- **Bruttomethode:** 1. Erlösberichtigungen [brutto] an Forderungen a. LL bzw. Bank; 2. Umsatzsteuer an Erlösberichtigungen [Steuer]. Nicht zusammenfassbar.
- **Fall Abschluss (`abschluss`):** Summen Umsatzerlöse und Erlösberichtigungen gegeben. Nettoumsatz = UE − EB. Buchungen: Umsatzerlöse an Erlösberichtigungen [EB]; Umsatzerlöse an GuV [Nettoumsatz].
- **Varianten:** `maengelruege`, `bonus`, `brutto-methode`, `abschluss`.
- **Fehlertypen:** `steuer-falsches-konto`, `nachlass-als-umsatzstorno`, `nachlass-ohne-steuerkorrektur`, `korrektur-richtung-vertauscht`, `brutto-als-netto`, `erloesberichtigung-ueber-guv`, `erloesberichtigung-addiert`.

### D5 – Ausgangsfrachten (`D5-ausgangsfrachten`, `ausgangsfrachten.ts`, 2 Punkte)

- **Fälle:** `ausgang` (Lieferung frei Haus, Spedition berechnet der MBG die Fracht), `eingang` (Kontrastfall: Fracht für Roh- oder Hilfsstoffe), `weiterberechnet` (MBG berechnet dem Kunden einen Frachtanteil und bezahlt selbst die Spedition). Fracht 80–2.500 € netto oder brutto; Zahlung auf Ziel, per Bank oder bar. Optional vorgeschalteter Teil „Konto bestimmen“ (Aufgabe erkennen).
- **Varianten:** `ausgang`, `brutto`, `weiterberechnet`, `unterscheiden`.
- **Buchung:** Ausgangsfrachten [netto], Vorsteuer an Verbindlichkeiten a. LL / Bank / Kasse [brutto]. Eingangsfracht: Bezugskosten für [Stoff] statt Ausgangsfrachten. Weiterberechnet zusätzlich (eigener Satz): Forderungen a. LL an Umsatzerlöse (Warenwert + berechnete Fracht), an Umsatzsteuer.
- **Fehlertypen:** `steuer-falsches-konto`, `ausgangsfracht-als-bezugskosten`, `eingangsfracht-als-ausgangsfracht`, `ausgangsfracht-als-erloesberichtigung`, `fracht-ohne-vorsteuer`, `brutto-als-netto`, `weiterberechnete-fracht-verrechnet`.

### D6 – Privat (`D6-privat`, `privat.ts`, 2 Punkte)

- **Fälle:** Geldentnahme (Bank/Kasse), Einkommensteuer der Gesellschafter über das Geschäftskonto, private Rechnung (brutto) über das Geschäftskonto, Entnahme von Gegenständen (Erzeugnisse oder Handelswaren; Nettowert oder Menge × Stückwert), Entnahme von Leistungen (Lkw-Nutzung, Werkstatt, Arbeitszeit), Geldeinlage, Sacheinlage (Pkw → Fuhrpark, Laptop/Möbel → BGA, Zeitwert), Abschluss des Kontos Privat (T-Konto mit 3 Entnahme- und 0–2 Einlageposten).
- **Varianten:** `geld` (inkl. Steuer), `gegenstand`, `leistung`, `privatrechnung`, `einlage`, `abschluss`.
- **Buchungen:** Privat an Bank/Kasse; Privat [brutto] an Entnahme v. G. u. s. L. [netto], an Umsatzsteuer; Bank/Kasse bzw. Anlagekonto an Privat; Abschluss: Entnahmen > Einlagen → Eigenkapital an Privat (Saldo im Haben), sonst Privat an Eigenkapital (Saldo im Soll).
- **Fehlertypen:** `entnahme-ohne-ust`, `entnahme-als-erloes`, `steuer-falsches-konto`, `geldentnahme-mit-ust`, `privat-als-aufwand` (bestehend), `privat-mit-vorsteuer`, `einlage-entnahme-verwechselt`, `sacheinlage-mit-vorsteuer`, `privatabschluss-ueber-guv`, `privatabschluss-richtung`.

Alle fünf Skills stehen in `fehlerjagd` (Buchungssatz mit einem Satz und einzeiligen Fehlervarianten in den meisten Seeds); keiner in `tabellen`.

## Golden Cases

Eigene Zahlen, USt 19 %. Tests: `src/engine/generators/d/*.test.ts`.

| ID       | Sachverhalt                                                                    | Erwartete Buchung                                                                                                          |
| -------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| GC-D1-01 | Listenpreis 30.000, 15 % Rabatt, Verpackung 238 brutto, Fracht 400 netto, Ziel | Rabatt 4.500; Warenwert 25.500; Nebenkosten 600; Forderungen 31.059 an Umsatzerlöse 26.100, an USt 4.959                   |
| GC-D1-02 | Handelswaren 8.000 netto, Bankzahlung                                          | Bank 9.520 an Umsatzerlöse für Handelswaren 8.000, an USt 1.520                                                            |
| GC-D2-01 | Rücksendung Listenpreis 6.000, ursprünglich 20 % Rabatt                        | Umsatzerlöse 4.800, USt 912 an Forderungen 5.712                                                                           |
| GC-D2-02 | Gutschrift 2.975 brutto, Kunde hatte bezahlt                                   | Umsatzerlöse 2.500, USt 475 an Bank 2.975                                                                                  |
| GC-D2-03 | Mehrwegpaletten 600 netto berechnet, 75 % gutgeschrieben                       | Umsatzerlöse 450, USt 85,50 an Forderungen 535,50                                                                          |
| GC-D2-04 | Handelswaren zurück, netto 1.250                                               | Umsatzerlöse für Handelswaren 1.250, USt 237,50 an Forderungen 1.487,50                                                    |
| GC-D3-01 | Mängelrüge 10 % auf 8.000 netto, Nettomethode                                  | Erlösberichtigungen 800, USt 152 an Forderungen 952                                                                        |
| GC-D3-02 | wie 01, Bruttomethode                                                          | Erlösberichtigungen 952 an Forderungen 952; USt 152 an Erlösberichtigungen 152                                             |
| GC-D3-03 | Bonus 3 % auf 150.000 Jahresumsatz, Überweisung                                | Erlösberichtigungen 4.500, USt 855 an Bank 5.355                                                                           |
| GC-D3-04 | Gutschrift 1.785 brutto                                                        | netto 1.500, USt 285                                                                                                       |
| GC-D3-05 | Abschluss: UE 900.000, EB 18.500                                               | Umsatzerlöse an Erlösberichtigungen 18.500; Umsatzerlöse an GuV 881.500                                                    |
| GC-D5-01 | Ausgangsfracht 1.190 brutto bar                                                | Ausgangsfrachten 1.000, Vorsteuer 190 an Kasse 1.190                                                                       |
| GC-D5-02 | Eingangsfracht Rohstoffe 500 netto, Ziel                                       | Bezugskosten für Rohstoffe 500, Vorsteuer 95 an Verbindlichkeiten 595                                                      |
| GC-D5-03 | Warenwert 10.000 + berechnete Fracht 250; Spedition 300 netto auf Ziel         | Forderungen 12.197,50 an Umsatzerlöse 10.250, an USt 1.947,50; Ausgangsfrachten 300, Vorsteuer 57 an Verbindlichkeiten 357 |
| GC-08    | Entnahme Erzeugnisse 600 netto (aus 04)                                        | Privat 714 an Entnahme v. G. u. s. L. 600, an USt 114                                                                      |
| GC-D6-01 | Entnahme 50 Kartons à 7,50 netto                                               | Privat 446,25 an Entnahme v. G. u. s. L. 375, an USt 71,25                                                                 |
| GC-D6-02 | private Rechnung 2.380 brutto über Bank                                        | Privat 2.380 an Bank 2.380                                                                                                 |
| GC-D6-03 | Sacheinlage Pkw, Zeitwert 12.000                                               | Fuhrpark 12.000 an Privat 12.000                                                                                           |
| GC-D6-04 | Privat: Soll 30.000 + 8.000 + 714, Haben 10.000                                | Saldo 28.714 im Haben; Eigenkapital an Privat 28.714                                                                       |
| GC-D6-05 | Privat: Soll 5.000, Haben 20.000                                               | Saldo 15.000 im Soll; Privat an Eigenkapital 15.000                                                                        |

Eigenschaftstests: Soll = Haben, Netto + Steuer = Brutto, Rabatt nur vom Listenpreis (D1), Storno ohne Erlösberichtigungen (D2), Erlösberichtigungen im Soll der Gutschrift bzw. Nettoumsatz + EB = UE (D3), Ausgangsfracht nie auf Bezugskosten und immer mit Vorsteuer (D5), Privat-Seite je Fall, USt nur bei Gegenständen/Leistungen, nie Vorsteuer oder GuV (D6).

## Lektionen

| Lektion                                 | Kern-Aha (kurz)                                                                                     | Klausurbrücke                | Cliffhanger →                   |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------- |
| D1 `ld1.ts`                             | Umsatzerlöse = Warenwert nach Sofortrabatt + berechnete Nebenkosten; Rabatt wird nicht gebucht      | D1, Seed 4 (Buchung)         | Rücksendung (D2)                |
| D2 `ld2.ts`                             | Rücksendung = Storno mit vertauschten Seiten, keine Erlösberichtigungen                             | D2 `brutto`, Seed 4          | Nachlass statt Rücksendung (D3) |
| D3 `ld3.ts`                             | Ware bleibt, Preis sinkt: Erlösberichtigungen netto + USt-Korrektur; Abschluss über Umsatzerlöse    | D3 `bonus`, Seed 3           | Nolte zahlt weniger (D4 Skonto) |
| D4 `ld4.ts` (nur Cliffhanger angepasst) | –                                                                                                   | –                            | „frei Haus“ zugesagt (D5)       |
| D5 `ld5.ts`                             | MBG trägt Versandfracht: Ausgangsfrachten netto + Vorsteuer; Abgrenzung Bezugskosten / Umsatzerlöse | D5 `weiterberechnet`, Seed 3 | Sabine nimmt Getränke mit (D6)  |
| D6 `ld6.ts`                             | Privates über Privat, nicht GuV; Waren/Leistungen mit USt, Geld ohne; Abschluss ins Eigenkapital    | D6 `gegenstand`, Seed 3      | neue Abfülllinie (E1)           |

## Offene fachliche Fragen

1. `[ANNAHME – bitte prüfen]` Dem Kunden **berechnete Verpackung und Fracht** werden auf das jeweilige Umsatzerlöskonto gebucht (bei Handelswaren: Umsatzerlöse für Handelswaren), nicht auf ein eigenes Konto. Grundlage: Aufbau der Musterklausur; der Lehrbrief nennt keinen eigenen Fall.
2. `[ANNAHME – bitte prüfen]` Die **Rückgabe berechneter Mehrwegverpackung** durch einen Kunden wird wie eine Rücksendung storniert (Umsatzerlöse und Umsatzsteuer im Soll), nicht über Erlösberichtigungen.
3. `[ANNAHME – bitte prüfen]` Bei Rücksendungen wird der **Rechnungspreis nach Sofortrabatt** gutgeschrieben (Listenpreis × (1 − Rabatt)).
4. `[ANNAHME – bitte prüfen]` **Bruttomethode bei Nachlässen** (D3): Gutschrift und spätere Steuerkorrektur bleiben zwei Buchungssätze und dürfen nicht zusammengefasst werden – analog zur geklärten Regel beim Kundenskonto (04, Abschnitt 6).
5. `[ANNAHME – bitte prüfen]` **Abschluss Erlösberichtigungen** (D3): „Umsatzerlöse an Erlösberichtigungen“ und „Umsatzerlöse an GuV“ werden auch als ein zusammengesetzter Satz akzeptiert; das Feedback zeigt die zwei Sätze.
6. `[ANNAHME – bitte prüfen]` **Bonus für das Vorjahr:** Der Lehrbrief weist darauf hin, dass ein Bonus periodengerecht dem abgelaufenen Jahr zuzurechnen ist. Die Aufgaben buchen die Bonusgutschrift als laufenden Vorgang ohne Abgrenzung (keine Rückstellung/sonstige Verbindlichkeit).
7. `[ANNAHME – bitte prüfen]` **Ausgangsfrachten** werden immer mit 19 % Vorsteuer gebucht (inländische Spedition). Fracht, die der Kunde bezahlt, und die Speditionsrechnung werden getrennt und ohne Verrechnung gebucht.
8. `[ANNAHME – bitte prüfen]` **Leistungsentnahmen** (private Lkw-Nutzung, Werkstatt, Arbeitszeit eines Mitarbeiters) werden mit dem angegebenen Nettowert und 19 % USt über „Entnahme von Gegenständen und sonstigen Leistungen“ gebucht. Die im Lehrbuch ebenfalls gezeigte Variante „Privat an [Aufwandskonto] und Vorsteuer“ (z. B. privater Telefonanteil) ist nicht umgesetzt, weil das Konto nicht in der Kontenliste steht.
9. `[ANNAHME – bitte prüfen]` **Sacheinlagen** aus dem Privatvermögen werden mit dem Zeitwert ohne Vorsteuer gebucht (Anlagekonto an Privat).
10. `[ANNAHME – bitte prüfen]` Auch die **Entnahme von Handelswaren** läuft über „Entnahme von Gegenständen und sonstigen Leistungen“ (so in der Musterklausur), nicht über Umsatzerlöse für Handelswaren.
