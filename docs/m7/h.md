# M7 Batch h (Skills H1, H2, H3, H5, H6, H7)

Quelle: Lehrbrief KLR I (K1), Kap. 2.2–2.7, S. 48–87, sowie die Reflexions- und Übungsaufgaben mit Lösungshinweisen (S. 87–106). Alle Texte in eigenen Worten, alle Zahlen eigene. H4 (kalkulatorische Abschreibung) bestand bereits; dort wurde nur der Cliffhanger auf H5 umgestellt.

## Generator-Spezifikationen

### H1 – Materialverbrauchsmengen (`src/engine/generators/h/materialmengen.ts`)

- **Parameter:** Material (Etiketten, Zucker, Aromakonzentrat), Anfangsbestand laut Inventur, 2–3 Zugänge laut Lieferschein, Endbestand laut Inventur, 3–4 Materialentnahmescheine, 2 Erzeugnisse mit Produktionsmenge und Bedarf je Einheit laut Stückliste, Einstandspreis frei Lager.
- **Konstruktion:** Sollverbrauch = Σ Menge × Bedarf; Entnahmen = Sollverbrauch + Mehrverbrauch (1–5 %); Inventurbestand = rechnerischer Endbestand − Schwund (1–4 %). Damit sind Schwund und Mehrverbrauch immer positiv, der Endbestand immer > 0.
- **Lösung:** Inventurmethode: AB + Zugänge − EB laut Inventur. Skontrationsmethode: Σ Entnahmescheine; rechnerischer (Soll-)Endbestand = AB + Zugänge − Entnahmen; Inventurdifferenz = Soll-EB − Ist-EB. Retrograde Methode: Σ Produktionsmenge × Bedarf; Soll-EB = AB + Zugänge − Sollverbrauch. Vergleich: Lagerschwund (Skontration gegen Inventur) und Mehrverbrauch in der Fertigung (Entnahmen gegen Stückliste); Summe = Inventurverbrauch − Sollverbrauch. Bewertung (außer Vergleich): Verbrauchsmenge × Einstandspreis.
- **Varianten:** `inventur`, `skontration`, `retrograd`, `vergleich`. Das Festwertverfahren (Verbrauch = Zugang) kommt nur in Lektion und Fehlertyp vor.
- **Interaktion:** `rechenkette` (Teil `mengen`), Mengen ohne Toleranz.
- **Fehlertypen:** `mengen-zugang-vergessen`, `festwert-statt-inventur`, `inventurdifferenz-vorzeichen`, `stueckliste-nicht-angewendet`, `gesamtdifferenz-als-schwund`.

### H2 – Materialbewertung (`src/engine/generators/h/materialbewertung.ts`)

- **Parameter:** Material (Zitronenaroma, Zucker in Säcken, Aromakonzentrat, Braumalz), Anfangsbestand (Menge, Preis), 2–3 Zugänge mit verschiedenen Preisen und 3–4 datierte Abgänge im Wechsel; Bestand nie negativ, Endbestand > 0.
- **Verfahren:** Durchschnitt (periodisch mit Anfangsbestand; permanent nach jedem Zugang neu), Fifo, Lifo, Hifo, Lofo – jeweils periodisch und permanent (Lehrbrief K1 2.2.2).
- **Lösung periodisch:** Verbrauchsmenge = Σ Abgänge. Durchschnittspreis = (Wert AB + Wert Zugänge) ÷ (Menge AB + Menge Zugänge), kaufmännisch auf 2 Stellen; Verbrauch = Menge × Preis; Endbestand = Endbestandsmenge × Preis (so in den Lösungshinweisen des Lehrbriefs). Verbrauchsfolge: Gesamtverbrauch aus allen Partien des Monats in der Reihenfolge des Verfahrens; Endbestand = Gesamtwert − Verbrauch.
- **Lösung permanent:** Jeder Abgang nur aus dem Bestand am Tag des Abgangs. Durchschnitt: nach jedem Zugang Preis = (Restmenge × bisheriger Preis + Zugangsmenge × Zugangspreis) ÷ neue Menge, kaufmännisch auf 2 Stellen; der Bestand wird mit Menge × gerundetem Preis weitergeführt (Lehrbrief-Weg, Hauptlösung). Der ungerundete Weg ist als zweiter Lösungspfad hinterlegt und wird als „Rundung“ akzeptiert.
- **Klausurfreundlich:** periodischer Durchschnittspreis in 80 % der Fälle ohne Rundung (Test: > 2/3 der Seeds).
- **Interaktion:** `rechenkette` (Teil `bewertung`): periodisch Menge, (Preis), Verbrauch, Endbestand; permanent je Abgang (Preis und) Wert, Summe, Endbestand (außer permanenter Durchschnitt).
- **Fehlertypen:** `ungewichteter-durchschnitt`, `durchschnitt-ohne-anfangsbestand`, `fifo-lifo-vertauscht`, `hifo-lofo-vertauscht`, `endbestand-statt-verbrauch`, `periodisch-statt-permanent`.

### H5 – Kalkulatorische Zinsen (`src/engine/generators/h/kalk-zinsen.ts`)

- **Parameter:** Zinssatz (5, 6, 8, 10, 12 %); Anlage mit Anschaffungswert, Restwert, Nutzungsdauer; oder Bilanzauszug mit Grundstück (voller Wert), Gebäude und Abfüllanlage (Anschaffungswert), einer nicht betriebsnotwendigen Position, Vorräten und Forderungen (Anfangs- und Endbestand), Zahlungsmitteln, Kundenanzahlungen, Lieferantenkrediten und einem verzinsten Bankdarlehen (Distraktor).
- **Lösung:** Durchschnittswertverzinsung: (Anschaffungswert + Restwert) ÷ 2 × Zinssatz (04-fachregeln.md, Konvention 9). Restwertverzinsung: lineare Abschreibung (AW − RW) ÷ ND; Zinsen Jahr k = (AW − (k − 1) × Abschreibung) × Zinssatz. Betriebsnotwendiges Kapital: Grundstücke voll + abnutzbares AV ÷ 2 + UV als Mittelwert (AB + EB) ÷ 2 = betriebsnotwendiges Vermögen; − Abzugskapital (zinslos: Anzahlungen, Lieferantenkredite) = betriebsnotwendiges Kapital; × Zinssatz; Monat = Jahr ÷ 12.
- **Varianten:** `durchschnitt`, `restwert`, `betriebsnotwendig`.
- **Interaktion:** `rechenkette` (Teil `zinsen`).
- **Fehlertypen:** `zinsen-vom-anschaffungswert`, `restwert-bei-durchschnitt-vergessen`, `restwert-jahresende`, `nicht-betriebsnotwendig-einbezogen`, `abzugskapital-vergessen`, `darlehen-als-abzugskapital`, `endbestand-statt-mittelwert`.

### H6 – Wagnisse und Zusatzkosten (`src/engine/generators/h/wagnisse.ts`)

- **Parameter Wagnis:** Wagnisart (Bestände-, Gewährleistungs-, Vertriebs-, Fertigungswagnis), Bezugsbasis von 4–6 Vorjahren (Lagerbestände, Umsätze, Zielumsätze, Herstellkosten), Schäden des Zeitraums gesamt, Bezugsbasis des laufenden Jahres. Klausurfreundlich: Satz aus einer festen Liste (z. B. 1,5 %), krumm: Schäden ±10 %.
- **Lösung Wagnis:** Wagnissatz = Σ Schäden ÷ Σ Bezugsbasis (in % auf 2 Stellen, zweiter Pfad mit gerundetem Satz); Wagniskosten = Satz × aktuelle Basis. Einordnung: Anderskosten.
- **Parameter/Lösung Zusatzkosten:** Vergleichsgehälter beider mitarbeitender Gesellschafter (Monat), unentgeltlich überlassene Halle (m², ortsübliche Miete je m² und Monat). Unternehmerlohn und Miete je Monat und Jahr (× 12), Summe Zusatzkosten. Einordnung: Zusatzkosten.
- **Varianten:** `bestaende`, `gewaehrleistung`, `vertrieb`, `fertigung`, `zusatzkosten`.
- **Interaktion:** `rechenkette` (Teil `wagnis` bzw. `zusatz`) plus `aufgabe-erkennen` (Teil `einordnung`).
- **Fehlertypen:** `wagnissatz-vom-durchschnitt`, `wagnis-als-zusatzkosten`, `zusatzkosten-als-anderskosten`, `unternehmerlohn-nur-ein-gesellschafter`, `zusatzkosten-monat-statt-jahr`.

### H3, H7 – Theorie

Je eine Lektion plus Theorie-Elemente in `src/content/theory/h.json` (H3: 8, H6: 3 zusätzlich, H7: 7; je Skill mindestens eine Kurzantwort „Erläutern Sie …“).

## Golden Cases (eigene Zahlen, Tests in `src/engine/generators/h/h.test.ts`)

**GC-15 (04-fachregeln.md)** mit dem neuen Generator nachgerechnet: FIFO 2.800,00; LIFO 3.300,00; Durchschnitt 12,25 €/Stk. → 3.062,50.

**GC-H1 Materialmengen.** Zucker: AB 12.000 kg, Zugänge 18.000 + 9.000 kg, EB laut Inventur 10.500 kg, Entnahmescheine 14.000 + 9.500 + 4.000 kg; Senne Lemon 50 Chargen à 250 kg, Paderquell Energy 35 Chargen à 400 kg; Einstandspreis 0,90 €/kg.
Inventurmethode 28.500 kg (25.650,00 €); Skontration 27.500 kg (24.750,00 €), Soll-EB 11.500 kg, Schwund 1.000 kg; retrograd 26.500 kg (23.850,00 €), Soll-EB 12.500 kg; Mehrverbrauch Fertigung 1.000 kg; 28.500 − 26.500 = 1.000 + 1.000.

**GC-H2 Materialbewertung.** Zitronenaroma: AB 50 kg à 30,00; 3.: Abgang 30 kg; 8.: Zugang 100 kg à 33,00; 14.: Abgang 70 kg; 20.: Zugang 50 kg à 37,00; 27.: Abgang 60 kg. Gesamtwert 6.650,00, Verbrauch 160 kg.

- Durchschnitt periodisch: 33,25 €/kg → 5.320,00; EB 40 kg × 33,25 = 1.330,00. Ohne Anfangsbestand (Fehler): 34,33 → 5.492,80.
- Durchschnitt permanent: 30,00 / 32,50 / 34,75 → 900,00 + 2.275,00 + 2.085,00 = 5.260,00; EB 1.390,00.
- Fifo periodisch = permanent: 5.170,00 (900,00 + 2.250,00 + 2.020,00); EB 1.480,00.
- Lifo periodisch 5.450,00 (EB 1.200,00); permanent 900,00 + 2.310,00 + 2.180,00 = 5.390,00 (EB 1.260,00).
- Hifo periodisch 5.450,00, permanent 5.390,00; Lofo periodisch und permanent 5.170,00.

**GC-H5 Kalkulatorische Zinsen.** Abfüllanlage AW 480.000, RW 40.000, ND 8, 8 %: Durchschnitt 260.000 → 20.800,00 p. a. / 1.733,33 je Monat. Restwert: AfA 55.000; Zinsen 38.400 / 34.000 / 29.600.
Betriebsnotwendiges Kapital (10 %): Grundstück 300.000 + Gebäude 1.200.000 ÷ 2 + Abfüllanlage 900.000 ÷ 2 = 1.350.000; vermietetes Wohnhaus 250.000 ausgesondert; Vorräte (320.000 + 280.000) ÷ 2 + Forderungen (180.000 + 220.000) ÷ 2 + Zahlungsmittel 50.000 = 550.000; Vermögen 1.900.000; Abzugskapital 60.000 + 90.000 = 150.000 (Darlehen 500.000 nicht); Kapital 1.750.000; Zinsen 175.000,00 p. a. / 14.583,33 je Monat.

**GC-H6 Wagnisse und Zusatzkosten.** Lagerbestände 240.000 + 260.000 + 300.000 + 200.000 = 1.000.000, Schäden 15.000 → 1,5 %; aktueller Bestand 280.000 → 4.200,00. Unternehmerlohn (8.000 + 7.000) × 12 = 180.000; Miete 600 m² × 5,50 × 12 = 39.600; Zusatzkosten 219.600,00.

Zusätzlich lokal (nicht im Repository) nachgerechnet: Der Generator reproduziert alle Bewertungsbeispiele des Lehrbriefs zu Kap. 2.2.2 (periodischer/permanenter Durchschnitt mit Rundung, Fifo, Lifo, Hifo, Lofo, Durchschnitt ohne Anfangsbestand), die Lösungshinweise zu Reflexionsaufgabe 1 und das betriebsnotwendige Kapital aus Reflexionsaufgabe 6.

## Prüfvermerke (03.11.2026)

- **Faktenabgleich:** Alle 18 Theorie-Elemente gegen K1 Kap. 2.3, 2.4.3, 2.5–2.7 und die Lösungshinweise geprüft: ok. Lektionen H1–H3, H5–H7 gegen dieselben Stellen geprüft (Vermerk je Lektion in `checkliste.fachlichGeprueft`).
- **Plagiatsprüfung:** `node scripts/check-overlap.ts` über alle Batch-h-Dateien: 0 Überschneidungen (eine Formulierung der H2-Klausurbrücke wurde dafür umformuliert).
- **Tests:** Golden Cases und Eigenschaftstests (Verbrauch + Endbestand = Gesamtwert, Fifo periodisch = permanent, Lofo ≤ Durchschnitt ≤ Hifo, Schwund + Mehrverbrauch = Inventur − Soll, Kapital = Vermögen − Abzugskapital, alle Fehlertypen im Katalog) sowie `generators.test.ts` (1.000 Seeds) und `lessons.test.ts` grün.

## Offene fachliche Fragen

1. `[GEKLÄRT – Prüfpunkt 3]` **Durchschnittswertverzinsung mit Restwert:** (Anschaffungswert + Restwert) ÷ 2 nach 04-fachregeln.md, Konvention 9. Der Lehrbrief nennt nur den „halben Anschaffungswert“; bei Restwert 0 stimmen beide überein.
2. `[ANNAHME – bitte prüfen]` **Restwertverzinsung:** Zinsen vom kalkulatorischen Restwert zu **Beginn** des jeweiligen Jahres (Jahr 1 = voller Anschaffungswert). Der Lehrbrief legt den Zeitpunkt nicht fest; die Aufgabe nennt ihn deshalb ausdrücklich.
3. `[ANNAHME – bitte prüfen]` **Mittelwerte:** Umlaufvermögen mit (AB + EB) ÷ 2 (Lehrbrief: „mit Mittelwerten“, Reflexionsaufgabe 6); Abzugskapital wird im Generator direkt als Durchschnittsbestand vorgegeben.
4. `[ANNAHME – bitte prüfen]` **Endbestand beim periodischen Durchschnitt:** Endbestandsmenge × gerundeter Durchschnittspreis (Lösungshinweis zu Übungsaufgabe 5). Das T-Konto im Lehrbrief zeigt dagegen den Saldo (Gesamtwert − Verbrauch); bei krummen Durchschnittspreisen weichen beide um wenige Euro ab. Die Aufgabe nennt die Formel ausdrücklich.
5. `[ANNAHME – bitte prüfen]` **Permanenter Durchschnitt:** Der Lehrbrief rundet jeden neuen Durchschnittspreis auf 2 Stellen und führt den Bestand mit Menge × gerundetem Preis weiter. Das ist die angezeigte Lösung; der ungerundete Weg gilt als „Rundung“. Hinweis: Das zweite Materialbestandskonto im Lehrbrief (S. 64) enthält offensichtlich falsche Abgangswerte; Referenz ist die Tabelle auf S. 57.
6. `[ANNAHME – bitte prüfen]` **Wagnissatz:** In Prozent auf 2 Nachkommastellen (Lehrbrief-Beispiel rundet auf 1 Stelle). Gerechnet wird exakt, der Weg mit gerundetem Satz ist als zweiter Pfad zulässig.
7. `[ANNAHME – bitte prüfen]` **Kalkulatorische Miete:** Der Lehrbrief erwähnt sie nur als Zusatzkosten (Kap. 1). Berechnung als Fläche × ortsübliche Miete je m² ist eine eigene, naheliegende Annahme.
8. `[ANNAHME – bitte prüfen]` **Bezugsbasen der Wagnisse:** Lagerbestand (Beständewagnis, wie Lehrbrief), Umsätze (Gewährleistungswagnis, wie Reflexionsaufgabe 7), Zielumsätze (Vertriebswagnis) und Herstellkosten (Fertigungswagnis) – die letzten beiden sind eigene Annahmen.
9. `[ANNAHME – bitte prüfen]` **Kostensteuern als Grundkosten** (Lektion H7, Klausurbrücke): Der Lehrbrief nennt Gebühren und Beiträge ausdrücklich Grundkosten; für Kostensteuern (Kfz-, Grund-, Versicherungsteuer) gilt dasselbe, weil sie in gleicher Höhe angesetzt werden.
10. **Hifo/Lofo:** Die Generatoren erzeugen nur verschiedene Preise; bei gleichen Preisen würde die ältere Partie zuerst entnommen (ohne Einfluss auf den Wert).

## Wünsche an andere Bereiche (nicht selbst geändert)

- `docs/03-aufgabentypen.md`: Die Spezifikationen H1, H5, H6 von hier übernehmen; H2 um Hifo/Lofo und die Fehlertypen `durchschnitt-ohne-anfangsbestand`, `hifo-lofo-vertauscht`, `periodisch-statt-permanent` ergänzen.
- `docs/04-fachregeln.md`: GC-H1, GC-H2, GC-H5, GC-H6 als verbindliche Golden Cases aufnehmen; Annahmen 1–6 nach Prüfung als `[GEKLÄRT]` eintragen.
- `src/engine/solvers/materialbewertung.ts` (alt, nur periodisch) wird von `golden.test.ts` genutzt; er könnte durch `solveMatBew` aus `generators/h/materialbewertung.ts` ersetzt werden.
- `src/content/theory.ts`/Lernsitzung: Karten und Kurzantworten aus den Theorie-Dateien werden derzeit nicht ausgespielt (nur `mc`); die H3/H6/H7-Kurzantworten nutzen die Felder `frage`, `punkte`, `checkliste`, `muster` wie `KurzantwortPart`.
