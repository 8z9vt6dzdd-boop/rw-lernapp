# M7 Batch e (Skills E1, E2, E3, E5)

Code: `src/engine/generators/e/` (Registrierung `src/engine/generators/batches/e.ts`), Fehlertypen `src/engine/fehlertypen-batches/e.ts`, Lektionen `src/content/lessons/le1.ts`, `le2.ts`, `le3.ts`, `le5.ts`, Theorie-Karten `src/content/theory/e.json`. Neue Konten waren nicht nötig (alle in `accounts.ts`).

## Generator-Spezifikationen

### E1 – Anlagenkauf (`anlagenkauf.ts`, 5 Punkte)

- **Varianten:** `kauf` (eine Rechnung mit Listenpreis, optional Sofortrabatt 5/8/10 %, Nebenkosten), `nebenkosten-getrennt` (Rechnung des Verkäufers auf Ziel, Nebenkosten auf eigener Rechnung per Bank), `skonto` (wie `kauf`, danach Zahlung der gesamten Rechnung mit 2/2,5/3 % Skonto).
- **Parameter:** Anlage (Etikettiermaschine, Sirup-Lagertank, Palettieranlage → TA und Maschinen; Auslieferungs-Lkw → Fuhrpark; Büromöbel → BGA), Listenpreis netto, Rabattsatz, 1–2 Nebenkostenpositionen (Transport, Montage, Fundamentarbeiten, Überführung, Lieferung und Aufbau), USt 19 %. 20 % „krumme“ Werte (Centbeträge).
- **Lösung:** Anschaffungspreis = Listenpreis × (1 − Rabatt) (auf Cent); Anschaffungskosten = Anschaffungspreis + Nebenkosten; Vorsteuer = 19 % (je Rechnung); Rechnungsbetrag. Skonto: brutto = Rechnung × Satz, netto = brutto ÷ 1,19, Vorsteuerkorrektur = Differenz, Zahlbetrag, endgültige Anschaffungskosten = AK − Skonto netto.
- **Buchungen:** Anlagekonto, Vorsteuer an Verbindlichkeiten a. LL; Nebenkosten getrennt: Anlagekonto, Vorsteuer an Bank; Zahlung (Nettomethode): Verbindlichkeiten a. LL an Bank, an Anlagekonto, an Vorsteuer.
- **Fehlertypen:** `vorsteuer-aktiviert`, `nebenkosten-als-aufwand`, `rabatt-vergessen`, `steuer-falsches-konto`, `nachlass-statt-anlagekonto`, `keine-steuerkorrektur`.
- Fehlerjagd geeignet (Rechnungseingang ist ein einzelner Satz).

### E2 – Eigenleistungen, Anlagen im Bau, Anzahlungen (`eigenleistung-aib.ts`, 4 Punkte)

- **Varianten:** `eigenleistung` (Werkstatt baut Förderstrecke, Mischbehälter, Formatwechsel-Vorrichtung → TA und Maschinen; Werkbänke/Regale → BGA), `anzahlung` (Anzahlung mit Vorsteuer per Bank, später Schlussrechnung, Anlage noch nicht fertig, sofortige Überweisung unter Verrechnung), `fertigstellung` (Bestand Anlagen im Bau aus dem Vorjahr, Schlussrechnung auf Ziel während der Montage, danach Fertigstellung).
- **Lösung Eigenleistung:** MGK = Material × Satz, FGK = Fertigungslöhne × Satz, Herstellungskosten = Material + MGK + Löhne + FGK; ein angegebener Vertriebsgemeinkostenzuschlag bleibt außen vor. Buchung: Anlagekonto an Aktivierte Eigenleistungen (ohne USt). Auswahlfeld: insgesamt erfolgsneutral (Aufwand und Ertrag gleichen sich aus).
- **Lösung Anzahlung:** Geleistete Anzahlungen auf Sachanlagen A, Vorsteuer 0,19 A an Bank. Schlussrechnung G: Rest = G − A, Vorsteuer 0,19 (G − A), Überweisung 1,19 (G − A); Anlagen im Bau G, Vorsteuer an Bank, an Geleistete Anzahlungen A.
- **Lösung Fertigstellung:** Anlagen im Bau S, Vorsteuer an Verbindlichkeiten a. LL; Anschaffungskosten = Vorjahr + S; TA und Maschinen an Anlagen im Bau (gesamt). Auswahlfeld: Abschreibung ab dem Monat der Fertigstellung.
- **Fehlertypen:** `gemeinkosten-vergessen`, `vertriebskosten-aktiviert`, `eigenleistung-falsches-ertragskonto` (Umsatzerlöse bzw. Bestandsveränderungen), `anzahlung-ohne-ust`, `anzahlung-nicht-verrechnet`, `anzahlung-brutto-verrechnet`, `aib-teilweise-umgebucht`, `steuer-falsches-konto`.
- Fehlerjagd geeignet (erster Buchungsteil je Variante ist ein einzelner Satz).

### E3 – Bilanzielle Abschreibung (`bilanz-afa.ts`, 5 Punkte)

- **Varianten:** `linear`, `degressiv` (geometrisch-degressiv mit vorgegebenem Satz vom Buchwert), `leistung` (nach Kilometern bzw. Betriebsstunden).
- **Parameter:** Anlage und Konto, Kaufpreis, Nebenkosten (70 %), Nutzungsdauer, Anschaffungsmonat, Satz (20/25/30 %, höchstens das Dreifache des linearen Satzes), Gesamt- und Jahresleistung.
- **Lösung:** AK = Kaufpreis + Nebenkosten (kein Restwert). Monate im Anschaffungsjahr = 13 − Anschaffungsmonat. Linear: Jahresbetrag = AK ÷ ND, Jahr 1 = Jahresbetrag × Monate/12, Buchwerte Ende Jahr 1 und 2. Degressiv: Jahr 1 = AK × Satz × Monate/12, Jahr 2 = Buchwert × Satz. Leistung: Satz je Einheit = AK ÷ Gesamtleistung (nicht vorab runden; beide Pfade zulässig), Jahr 1 = Satz × Leistung.
- **Buchung:** Abschreibungen auf Sachanlagen an Anlagekonto.
- **Fehlertypen:** `nebenkosten-vergessen`, `volle-jahres-afa`, `anschaffungsmonat-vergessen`, `degressiv-vom-ak`; Soll/Haben-Vertauschung über die allgemeine Regel.
- Nicht für die Fehlerjagd registriert (keine Fehlervariante, die genau eine Zeile ändert).

### E5 – Geschäftsgang

Nur Lektion; der Fall liegt in `src/engine/faelle/geschaeftsgang.ts`. Die Lektion rechnet alle Zahlen mit `generateGeschaeftsgang`/`solveGeschaeftsgang` (Seed 7) und nutzt als Klausurbrücke den Teil `verbrauch` aus `geschaeftsgangFall(7)`.

## Golden Cases (eigene Zahlen, Tests in `src/engine/generators/e/e.test.ts`)

**GC-E1-a Kauf mit Rabatt und Nebenkosten.** Etikettiermaschine Listenpreis 50.000,00, 10 % Rabatt, Transport 800,00, Montage 1.200,00, USt 19 %.
Anschaffungspreis 45.000,00; Nebenkosten 2.000,00; Anschaffungskosten 47.000,00; Vorsteuer 8.930,00; Rechnung 55.930,00.
TA und Maschinen 47.000,00, Vorsteuer 8.930,00 an Verbindlichkeiten a. LL 55.930,00.

**GC-E1-b Zahlung mit 2 % Skonto (wie GC-E1-a).** Skonto brutto 1.118,60, netto 940,00, Vorsteuerkorrektur 178,60, Überweisung 54.811,40; endgültige Anschaffungskosten 46.060,00.
Verbindlichkeiten a. LL 55.930,00 an Bank 54.811,40, an TA und Maschinen 940,00, an Vorsteuer 178,60.

**GC-E1-c Nebenkosten getrennt.** Lkw 80.000,00 netto auf Ziel, Überführung 600,00 netto per Bank.
Fuhrpark 80.000,00, Vorsteuer 15.200,00 an Verbindlichkeiten a. LL 95.200,00; Fuhrpark 600,00, Vorsteuer 114,00 an Bank 714,00; Anschaffungskosten 80.600,00.

**GC-E2-a Aktivierte Eigenleistung.** Material 12.000,00, MGK 10 %, Fertigungslöhne 8.000,00, FGK 150 %, Vertriebsgemeinkosten 5 % (nicht aktivierbar).
MGK 1.200,00; FGK 12.000,00; Herstellungskosten 33.200,00. TA und Maschinen an Aktivierte Eigenleistungen 33.200,00.

**GC-E2-b Anzahlung und Schlussrechnung.** Anzahlung 30.000,00 netto, Schlussrechnung 90.000,00 netto, Anlage noch im Bau.
Geleistete Anzahlungen auf Sachanlagen 30.000,00, Vorsteuer 5.700,00 an Bank 35.700,00.
Anlagen im Bau 90.000,00, Vorsteuer 11.400,00 an Bank 71.400,00, an Geleistete Anzahlungen auf Sachanlagen 30.000,00.

**GC-E2-c Fertigstellung.** Anlagen im Bau aus dem Vorjahr 140.000,00, Schlussrechnung 60.000,00 netto auf Ziel.
Anlagen im Bau 60.000,00, Vorsteuer 11.400,00 an Verbindlichkeiten a. LL 71.400,00; TA und Maschinen an Anlagen im Bau 200.000,00.

**GC-E3-a Linear, zeitanteilig.** Kaufpreis 70.500,00 + Montage 1.500,00, ND 8 Jahre, Anschaffung September.
AK 72.000,00; Jahresbetrag 9.000,00; 4 Monate; Jahr 1 3.000,00; Buchwert 69.000,00; Ende Folgejahr 60.000,00.
Abschreibungen auf Sachanlagen an TA und Maschinen 3.000,00.

**GC-E3-b Geometrisch-degressiv.** AK 120.000,00, 25 % vom Buchwert, Anschaffung April (9 Monate).
Jahr 1 22.500,00; Buchwert 97.500,00; Jahr 2 24.375,00; Buchwert 73.125,00.

**GC-E3-c Leistungsabschreibung.** Lkw AK 150.000,00, Gesamtleistung 300.000 km, 48.000 km im ersten Jahr.
0,50 €/km; Abschreibung 24.000,00; Buchwert 126.000,00. Abschreibungen auf Sachanlagen an Fuhrpark 24.000,00.

Eigenschaftstests: AK = Preis − Rabatt + Nebenkosten; Rechnung = Netto + Vorsteuer; Zahlbetrag + Bruttoskonto = Rechnung; HK = Summe der Bestandteile; Vorsteuer aus Anzahlung und Rest = 19 % der Schlussrechnung; Konto Geleistete Anzahlungen nach der Schlussrechnung ausgeglichen; AK Fertigstellung = Vorjahr + Schlussrechnung; Buchwert = AK − Abschreibung ≥ 0; linear über die volle ND genau die AK; degressiver Satz ≤ 30 % und ≤ 3 × linear. Dazu die allgemeinen Tests aus `generators.test.ts` (1.000 Seeds, Soll = Haben, Fehlertyp-Erkennung).

## Offene fachliche Fragen

1. `[ANNAHME – bitte prüfen]` **Zeitanteilige Abschreibung monatsgenau, Anschaffungsmonat zählt voll** (13 − Monat). Der Lehrbrief (BA 2.3.5.1, Fußnote S. 65) nennt nur „pro rata temporis“ und die abgeschaffte Halbjahresregel, aber keine Monatsregel. Die Annahme entspricht § 7 Abs. 1 Satz 4 EStG.
2. `[ANNAHME – bitte prüfen]` **Degressive bilanzielle Abschreibung**: Der Lehrbrief BA behandelt nur linear und nach Leistungseinheiten. Degressiv ist aus der Lehrbuch-Übung (fester Satz vom Buchwert) übernommen; der Satz wird immer vorgegeben, im Anschaffungsjahr zeitanteilig. Sätze höchstens 30 % und höchstens das Dreifache des linearen Satzes (vorsichtige Annahme zum aktuellen Steuerrecht, nicht verifiziert). Kein Wechsel zur linearen Methode.
3. `[ANNAHME – bitte prüfen]` **Herstellungskosten der Eigenleistung**: Der Lehrbrief-Text (BA 5.2, S. 131) sagt „mindestens die Einzelkosten“, die Tabelle auf S. 132 zählt notwendige Material- und Fertigungsgemeinkosten zu den Mindest-Herstellkosten. Die Aufgaben nennen deshalb ausdrücklich „einschließlich der angemessenen Material- und Fertigungsgemeinkosten“; Vertriebskosten werden nie aktiviert. Verwaltungskosten (Wahlrecht) kommen in den Aufgaben nicht vor.
4. `[ANNAHME – bitte prüfen]` **Schlussrechnung während der Bauphase** wird auf Anlagen im Bau gebucht und erst bei Fertigstellung insgesamt umgebucht (so BA 3.4.4). Eine direkte Buchung auf das Anlagekonto gilt in der App als falsch, obwohl das Endergebnis gleich wäre.
5. `[ANNAHME – bitte prüfen]` **Skonto auf die gesamte Anlagenrechnung** (inklusive Nebenkosten) wie im Lehrbrief-Beispiel BA 3.4.2; Nettobuchung mit sofortiger Vorsteuerkorrektur.
6. Gebäude/Lagerhalle (Lehrbrief-Beispiel zu Anlagen im Bau) wird nicht verwendet, weil das Konto „Gebäude“ nicht in 04-fachregeln.md steht. Wunsch: Konto „Gebäude“ (bzw. „Bebaute Grundstücke“) in 04 aufnehmen, dann kann E2 auch eine Lagerhalle im Bau abbilden.
