# M7 Batch a (Skills A1–A7)

Quellen (nur lokal gelesen, eigene Formulierung): BA 2.1.1–2.1.2 (S. 6–11), 2.2.1–2.2.2 (S. 11–27), 2.3.1.1 (S. 31–33, Aufbewahrung Inventar), 2.3.1.3–2.3.1.6 (S. 36–52), 2.3.2.1–2.3.2.2 (S. 55–60), 2.3.3–2.3.4 (S. 60–62); Lektionen `la1.ts`–`la7.ts` für Begriffe und Ton. Seitenangaben = Druckseiten (PDF-Seite − 18). Alle Zahlen eigen.

Code: `src/engine/generators/a/` (gemeinsame Bausteine in `gemeinsam.ts`), Registrierung `src/engine/generators/batches/a.ts`, Fehlertypen `src/engine/fehlertypen-batches/a.ts` (alle mit Präfix `a-`), Theorie `src/content/theory/a.json`. Neue Konten waren nicht nötig. Umsatzsteuer kommt in A3–A7 nicht vor; Rohstoff-Sachverhalte nutzen trotzdem 19-%-Waren (Aromen, Fruchtsaftkonzentrat, Dosen, Etiketten), damit spätere Erweiterungen mit Steuer passen.

## Generator-Spezifikationen

### A3 – Kontenarten (`A3-kontenarten`, `kontenarten.ts`, 2 Punkte)

- **Varianten:**
  - `zuordnen`: 5 Konten aus einem Katalog von 28 Konten (jede Kontenart mindestens einmal) → Aktiv-, Passiv-, Aufwands-, Ertragskonto (Auswahlfelder). Je Konto ist ein typischer Denkfehler hinterlegt (z. B. Vorsteuer → Aufwand, Umsatzsteuer → Ertrag, Darlehensschulden → Aktiv, Rohstoffe → Aufwand).
  - `seiten`: 4 Einträge (2 Bestands-, 2 Erfolgskonten) – Anfangsbestand, Zugang, Abgang/Minderung oder Saldo → Soll/Haben.
  - `kontostand`: Bestandskonto (Bank, Kasse, Rohstoffe, Forderungen, Verbindlichkeiten, Darlehensschulden) mit Anfangsbestand und 3–4 in Worten beschriebenen Vorfällen. Felder: Kontenart, Seite des Anfangsbestands, Summe Zugänge, Summe Abgänge, Schlussbestand, Seite des Schlussbestands.
  - `tkonto`: T-Konto (60 % Bestands-, 40 % Erfolgskonto) mit Gegenkonten als Text. Felder: Kontenart, Saldo, Seite des Saldos.
- **Lösung:** Zugangsseite Aktiv/Aufwand = Soll, Passiv/Ertrag = Haben; Saldo = Anfangsbestand + Zugänge − Abgänge, eingetragen auf der Abnahmeseite. 20 % krumme Beträge (Cent).
- **Fehlertypen:** `a-aktiv-passiv-vertauscht`, `a-aufwand-ertrag-vertauscht`, `a-bestand-erfolg-verwechselt`, `a-kontoseite-vertauscht`, `a-saldo-seite`, `a-abgaenge-addiert`, `a-anfangsbestand-vergessen`, `a-zugang-abgang-verwechselt`, `a-summe-statt-saldo`.

### A4 – Bilanzveränderungen (`A4-bilanzveraenderung`, `bilanzveraenderung.ts`, 3 Punkte)

- **Ausgangslage:** Eröffnungsbilanz der MBG (TA und Maschinen, BGA, Fuhrpark, Rohstoffe, Forderungen, Bank, Kasse | Eigenkapital = Aktiva − Fremdkapital ≥ 50.000, Darlehensschulden, Verbindlichkeiten).
- **Vorfälle (16 Vorlagen):** Aktivtausch (Kauf Gabelstapler/Büromöbel/Maschine/Konzentrat per Bank, Kunde überweist, Barabhebung, Bareinzahlung), Passivtausch (Lieferantenschuld wird Darlehen, Bank zahlt Darlehen direkt an Lieferanten), Aktiv-Passiv-Mehrung (Darlehen auf Bankkonto, Kauf auf Ziel), Aktiv-Passiv-Minderung (Tilgung, Lieferantenrechnung per Bank oder bar).
- **Varianten:** `einzeln` (Art per „Aufgabe erkennen“, neue Bestände beider Posten, Bilanzsumme, Buchungssatz) und `serie` (3–4 Vorfälle mit verschiedenen Arten: je Art und Bilanzsumme danach, zum Schluss Bestand eines mehrfach berührten Postens).
- **Lösung:** Die Art wird aus den Kontenarten berechnet (Aktiv an Aktiv = Aktivtausch, Passiv an Passiv = Passivtausch, Aktiv an Passiv = Mehrung, Passiv an Aktiv = Minderung). Bestände werden fortgeschrieben; kein Posten wird ≤ 0.
- **Fehlertypen:** `a-aktivtausch-passivtausch-vertauscht`, `a-tausch-als-mehrung-minderung`, `a-mehrung-minderung-als-tausch`, `a-mehrung-minderung-vertauscht` (jeweils mit der dazu passenden falschen Bilanzsumme), `a-zugang-abgang-verwechselt`, `soll-haben-vertauscht`.

### A5 – Buchungssätze ohne USt (`A5-buchungssatz-basis`, `buchungssatz-basis.ts`, 2 Punkte)

- **Vorlagen:** 22 einfache Vorfälle (Einkauf auf Ziel/gegen Bank, Anlagenkauf, Kunden- und Lieferantenzahlungen, Bank/Kasse, Darlehen aufnehmen/tilgen, Miete, Löhne, Zinsen, Verkauf ohne USt, Rohstoffverbrauch, Werbung, Büromaterial, Umwandlung in Darlehen) und 6 zusammengesetzte (Lieferantenrechnung teils bar/teils Bank, Kunde zahlt teils bar, Lkw mit Anzahlung und Rest auf Ziel, Aromen teils sofort/teils Ziel, Löhne und Gehälter in einer Überweisung, Darlehensrate mit Tilgung und Zinsen).
- **Varianten:** `einfach`, `zusammengesetzt`, `analyse` (je berührtes Konto Kontenart und „nimmt zu/ab“, alphabetisch sortiert, dann Buchungssatz), `serie` (3–4 einfache Vorfälle, getrennte Sätze).
- **Fehlertypen:** `soll-haben-vertauscht`, `a-zahlungsweg-verwechselt`, `a-ziel-zahlung-verwechselt`, `a-forderung-verbindlichkeit-verwechselt`, `a-anlage-als-aufwand`, `a-aufwand-ertrag-konto`, `a-verkauf-als-bestandsabgang`, `a-tilgung-als-aufwand`, `a-teilbetrag-falsch`; in `analyse` zusätzlich `a-aktiv-passiv-vertauscht`, `a-aufwand-ertrag-vertauscht`, `a-zugang-abgang-verwechselt`.
- In `fehlerjagd` (die meisten Fehlervarianten weichen in genau einer Zeile ab).

### A6 – Eröffnung und Abschluss (`A6-eroeffnung-abschluss`, `eroeffnung-abschluss.ts`, 3 Punkte)

- **Varianten:**
  - `eroeffnung`: Eröffnungsbilanz mit 3–5 Aktiv- und 3 Passivposten. Felder: Gegenkonto (EBK), Seite der Aktivposten im EBK (Haben), Summe des EBK. Buchung: „Aktivkonten an EBK“ und „EBK an Passivkonten“ (Sammelsätze wie im Lehrbrief; zusammenfassbar, Einzelsätze je Konto gelten ebenfalls). „Saldenvortrag“/„SV“ wird über die Synonymliste als EBK erkannt (Test GC-A6-01b).
  - `bestandskonto`: T-Konto mit Anfangsbestand (EBK) und Bewegungen → Saldo, Seite, Gegenkonto (SBK), Abschlussbuchung „SBK an Aktivkonto“ bzw. „Passivkonto an SBK“.
  - `erfolgskonto`: T-Konto ohne Anfangsbestand → Saldo, Seite, Gegenkonto (GuV), „GuV an Aufwandskonto“ bzw. „Ertragskonto an GuV“.
  - `guv`: 2–3 Aufwands- und 1–2 Ertragskonten mit Salden (25 % Verlust). Felder: Summe Aufwendungen, Summe Erträge, Saldo der GuV, Gewinn/Verlust. Buchung: Abschluss jedes Erfolgskontos, dann „GuV an Eigenkapital“ (Gewinn) bzw. „Eigenkapital an GuV“ (Verlust); zusammenfassbar.
- **Fehlertypen:** `a-eroeffnung-seiten-vertauscht`, `a-eroeffnung-ueber-sbk`, `a-abschluss-richtung`, `a-bestandskonto-ueber-guv`, `a-erfolgskonto-ueber-sbk`, `a-summe-statt-saldo`, `a-guv-ergebnis-vertauscht`, `a-guv-ueber-sbk`.
- In `fehlerjagd` (Varianten `bestandskonto`/`erfolgskonto` liefern einen Satz mit einzeiliger Abweichung; Fehlerjagd-Test grün).

### A7 – Eigenkapitalvergleich (`A7-ek-vergleich`, `ek-vergleich.ts`, 3 Punkte)

- **Varianten:** `standard` (EK Anfang/Ende, 1–3 Entnahmen, 0–2 Einlagen), `ohne-privat`, `vermoegen` (EK je Stichtag = Vermögen − Schulden aus dem Inventar), `rueckwaerts` (EK Ende = EK Anfang ± Erfolg − Entnahmen + Einlagen). 25 % Verlustfälle.
- **Felder:** Summen der Entnahmen/Einlagen (nur bei mehreren Posten), ggf. EK an beiden Stichtagen, Veränderung des EK (Abnahme mit Minus), Erfolg (Verlust mit Minus), Gewinn/Verlust; rückwärts nur EK am 31.12.
- **Privatvorgänge:** nur Geldentnahmen (auch private Einkommensteuer über das Geschäftskonto) und Geld- bzw. Sacheinlagen ohne Umsatzsteuer (siehe Annahme 2).
- **Fehlertypen:** `a-entnahmen-vorzeichen`, `a-einlagen-vorzeichen`, `a-privat-vergessen`, `a-ek-differenz-vertauscht`, `a-schulden-nicht-abgezogen`.

Keiner der Skills steht in `tabellen`.

## Golden Cases

Eigene Zahlen, ohne Umsatzsteuer. Tests: `src/engine/generators/a/*.test.ts`.

| ID          | Sachverhalt                                                                                                   | Erwartet                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| GC-A3-01    | Vorsteuer, Umsatzsteuer, Darlehensschulden, Zinserträge, Aufwendungen für Rohstoffe                           | Aktiv, Passiv, Passiv, Ertrag, Aufwand                                                                               |
| GC-A3-02    | Bank AB 30.000; Zugänge 8.000 + 5.000; Abgänge 2.500 + 12.000                                                 | Zugänge 13.000, Abgänge 14.500, SB 28.500; AB im Soll, SB im Haben                                                   |
| GC-A3-03    | Verbindlichkeiten AB 20.000; Zugang 6.000; Abgang 9.000                                                       | SB 17.000; AB im Haben, SB im Soll                                                                                   |
| GC-A3-04    | Mietaufwendungen 3.000 + 2.000, Erstattung 500                                                                | Saldo 4.500 im Haben (Kontosumme 5.000)                                                                              |
| GC-A3-05    | AB Darlehen / Minderung Zinserträge / SB Kasse / Zugang Löhne                                                 | Haben / Soll / Haben / Soll                                                                                          |
| GC-A4-01–04 | Bilanz 285.000; Gabelstapler 20.000 per Bank; Darlehen 40.000; Verb. → Darlehen 10.000; Verb. per Bank 12.000 | Aktivtausch 285.000; Mehrung 325.000; Passivtausch 325.000; Minderung 313.000; Bank am Ende 58.000                   |
| GC-A4-02e   | wie Vorfall 2 einzeln                                                                                         | Bank 90.000, Darlehen 110.000; Bank an Darlehensschulden 40.000                                                      |
| GC-A5-01    | Barabhebung 800                                                                                               | Kasse an Bank 800                                                                                                    |
| GC-A5-02    | Lieferantenrechnung 3.200, davon 500 bar                                                                      | Verbindlichkeiten 3.200 an Kasse 500, an Bank 2.700                                                                  |
| GC-A5-03    | Darlehensrate 6.250 mit 5.000 Tilgung                                                                         | Darlehensschulden 5.000, Zinsaufwendungen 1.250 an Bank 6.250                                                        |
| GC-A5-04    | Lkw 60.000, 15.000 sofort, Rest Ziel                                                                          | Fuhrpark 60.000 an Bank 15.000, an Verbindlichkeiten 45.000                                                          |
| GC-A5-05    | Löhne 18.000 und Gehälter 12.000 in einer Überweisung                                                         | Löhne 18.000, Gehälter 12.000 an Bank 30.000                                                                         |
| GC-A5-06    | Zinsgutschrift 240; Verkauf auf Ziel 5.000                                                                    | Bank an Zinserträge 240; Forderungen an Umsatzerlöse 5.000                                                           |
| GC-A6-01    | Eröffnungsbilanz TA 120.000, Rohstoffe 30.000, Bank 50.000 / EK 140.000, Darlehen 40.000, Verb. 20.000        | TA, Rohstoffe, Bank an EBK 200.000; EBK 200.000 an EK, Darlehen, Verb.; Einzelsätze mit „Saldenvortrag“/„SV“ richtig |
| GC-A6-02    | Bank AB 30.000 + 8.000 − 2.500 − 12.000                                                                       | Saldo 23.500 im Haben; SBK an Bank 23.500                                                                            |
| GC-A6-03    | Verbindlichkeiten AB 20.000 + 6.000 − 9.000                                                                   | Saldo 17.000 im Soll; Verbindlichkeiten an SBK 17.000                                                                |
| GC-A6-04    | Mietaufwendungen 3.000 + 2.000 − 500                                                                          | GuV an Mietaufwendungen 4.500                                                                                        |
| GC-A6-05    | Löhne 64.000, Werbung 11.000, Umsatzerlöse 82.000, Zinserträge 1.000                                          | Aufwand 75.000, Ertrag 83.000, Gewinn 8.000; GuV an EK 8.000                                                         |
| GC-A6-06    | Löhne 70.000, Miete 25.000, Umsatzerlöse 88.000                                                               | Verlust 7.000; Eigenkapital an GuV 7.000                                                                             |
| GC-A7-01    | EK 300.000 → 318.000; Entnahmen 24.000 + 6.000; Einlage 10.000                                                | Veränderung 18.000; Gewinn 38.000                                                                                    |
| GC-A7-02    | EK 250.000 → 226.000; Entnahmen 15.000                                                                        | Veränderung −24.000; Verlust 9.000                                                                                   |
| GC-A7-03    | Vermögen 520.000/Schulden 200.000 → 560.000/230.000; Entnahme 20.000                                          | EK 320.000 → 330.000; Gewinn 30.000                                                                                  |
| GC-A7-04    | rückwärts: EK 400.000, Gewinn 60.000, Entnahmen 45.000, Einlage 5.000                                         | EK am 31.12. 420.000                                                                                                 |

**Eigenschaftstests** (je 300–1.000 Seeds, zusätzlich zu `generators.test.ts`): A3 Saldo = Zugangsseite − Abgänge > 0 und Saldo auf der Gegenseite des Anfangsbestands, Zuordnung enthält alle vier Kontenarten; A4 Aktiva = Passiva nach jedem Vorfall, Bilanzsumme ändert sich nur bei Mehrung (+Betrag) und Minderung (−Betrag); A5 Soll = Haben, keine Steuer- und keine Abschlusskonten, Beträge > 0; A6 Soll = Haben, Bestandskonten nur über EBK/SBK, Erfolgskonten nur über GuV, EBK beidseitig = Bilanzsumme, GuV-Konto geht nach dem Abschluss auf; A7 Erfolg = ΔEK + Entnahmen − Einlagen, rückwärts ist die exakte Umkehrung, ohne Privat Erfolg = ΔEK.

## Prüfvermerke Theorie-Elemente (Faktenabgleich und Plagiatsprüfung, 03.11.2026)

Faktenabgleich: getrennter zweiter Durchlauf, jedes Element gegen die angegebene Quellstelle im Lehrbrief BA. Plagiatsprüfung: `node scripts/check-overlap.ts` über alle Dateien des Batches (Generatoren, Fehlertypen, Registrierung, `a.json`) – 0 Überschneidungen über 8 Wörter.

| ID                  | Typ                       | Quelle                               | Faktenabgleich                                                                                                                                                                                     |
| ------------------- | ------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1-k-001 – A1-k-006 | 6 Karten                  | BA 2.1.1–2.1.2, S. 6–10              | ok                                                                                                                                                                                                 |
| A1-mc-001 – 003     | MC                        | BA 2.1.2 (Fn. 4), 2.2.1              | ok                                                                                                                                                                                                 |
| A1-ka-001, 002      | Kurzantwort (3 bzw. 4 P.) | BA 2.1.1, 2.1.2                      | ok                                                                                                                                                                                                 |
| A2-k-001 – A2-k-009 | 9 Karten                  | BA 2.2.1–2.2.2.2, S. 11–27           | ok (A2-k-001/002 bewusst ohne Schwellenwerte, siehe A2-Z01)                                                                                                                                        |
| A2-k-010            | Karte                     | BA 2.3.1.1, S. 31–33; 04 Abschn. 7.2 | korrigiert: Lehrbrief nennt nur 10 Jahre für Inventare/Handelsbücher und den Fristbeginn; 8 Jahre (Belege) und 6 Jahre (Briefe) nach geklärtem Punkt 7.2, Abweichung zum Lehrbrief im Text benannt |
| A2-mc-001, 002, 004 | MC                        | BA 2.2.1, 2.2.2.2                    | ok                                                                                                                                                                                                 |
| A2-ka-001, 002      | Kurzantwort (4 bzw. 3 P.) | BA 2.2.1, 2.2.2.1–2.2.2.2            | ok                                                                                                                                                                                                 |
| A2-Z01              | Karte                     | BA 2.2.1, S. 11–12                   | **zurückgehalten** (siehe Frage 1)                                                                                                                                                                 |

Ein zunächst entworfenes MC zur Induktion wurde gestrichen (doppelt zu A2-k-004, Grenze 15 Elemente je Skill).

## Offene fachliche Fragen

1. `[ANNAHME – bitte prüfen]` **Schwellenwerte der Buchführungspflicht.** Der Lehrbrief nennt für § 241a HGB und § 141 AO 600.000 € Umsatz und 60.000 € Gewinn bzw. Jahresüberschuss. Nach meinem Kenntnisstand wurden beide Grenzen für Geschäftsjahre ab 2024 auf 800.000 € bzw. 80.000 € angehoben (unbestätigt, nicht gegen den Gesetzestext geprüft). Aktive Inhalte nennen deshalb keine Zahlen; die Karte A2-Z01 mit den Lehrbriefwerten ist zurückgehalten, bis geklärt ist, welche Werte gelernt werden sollen. Hinweis: Lektion A2 nutzt „Nur wenn sie mehr als 600.000 € Umsatz im Jahr hat“ als falsche Antwort – das bleibt auch nach neuem Recht falsch (die MBG ist als OHG immer buchführungspflichtig).
2. `[ANNAHME – bitte prüfen]` **Entnahmen im Eigenkapitalvergleich (A7)** werden mit dem Betrag angesetzt, der auf dem Konto Privat steht. Um die Frage „netto oder brutto?“ bei Sachentnahmen mit Umsatzsteuer zu vermeiden, erzeugt A7 nur Geldentnahmen sowie Geld- und Sacheinlagen ohne Steuer. Bitte bestätigen, dass Sachentnahmen (Privat brutto an Entnahme v. G. u. s. L. und Umsatzsteuer) im Eigenkapitalvergleich mit dem Bruttobetrag zählen, bevor sie aufgenommen werden.
3. `[ANNAHME – bitte prüfen]` **Eröffnungsbuchungen als Sammelsätze.** Die Musterlösung zeigt wie der Lehrbrief „Aktivkonten an EBK“ und „EBK an Passivkonten“; Einzelsätze je Konto und ein einziger zusammengefasster Satz gelten ebenfalls als richtig. Für den Abschluss der Erfolgskonten zeigt die Musterlösung je Konto einen Satz (wie Lektion A6), ebenfalls zusammenfassbar.
4. **Rohstoff-Sachverhalte ohne Zucker und Malz** (Hinweis aus der Integration: ermäßigter Steuersatz). A3–A7 rechnen ohne Umsatzsteuer, verwenden aber vorsorglich nur Waren mit 19 %.

## Wünsche an andere Dateien

- `content/zurueckgehalten.md` (nicht in meinem Schreibbereich): Zeile für **A2-Z01** ergänzen – „Schwellenwerte §§ 241a HGB, 141 AO im Lehrbrief vermutlich veraltet; zurückgehalten bis zur Klärung. Details: `docs/m7/a.md`.“
- `src/engine/accounts.ts`: keine neuen Konten nötig.
