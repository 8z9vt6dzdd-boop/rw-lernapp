# M7 Batch ij (Skills I1, I2, I3, I6, J1)

Quellen (nur lokal gelesen): Lehrbrief KLR II (K2) Kap. 1.1–1.4.4 und 2.1–2.2.2.1, dazu zur Stilprüfung die Übungsaufgaben KLR und die Klausuraufgaben KLR II. Alle Zahlen sind eigene Zahlen; Lösungen rechnet die Engine.

| Skill                   | Art                                    | Dateien                                                           |
| ----------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| I1-kostenstellenbildung | Theorie + Lektion                      | `src/content/lessons/li1.ts`, `src/content/theory/ij.json` (I1-…) |
| I2-bab-verteilung       | Generator + Lektion                    | `src/engine/generators/ij/bab.ts`, `li2.ts`                       |
| I3-anbau                | Generator + Lektion                    | `src/engine/generators/ij/anbau.ts`, `li3.ts`                     |
| I6-zuschlagssaetze      | Generator + Lektion                    | `src/engine/generators/ij/zuschlagssaetze.ts`, `li6.ts`           |
| J1-ktr-grundlagen       | Theorie + „Verfahren wählen“ + Lektion | `lj1.ts`, `src/content/theory/ij.json` (J1-…)                     |

Tests: `src/engine/generators/ij/ij.test.ts` (Golden Cases, Eigenschaften), dazu automatisch `generators.test.ts` und `lessons.test.ts`.

## Generator-Spezifikationen

### I2 – BAB, Verteilung primärer Gemeinkosten (`I2-bab-verteilung`)

- **Varianten:** `endkostenstellen` (4 oder 5 Stellen: Material, Fertigung I, ggf. Fertigung II, Verwaltung, Vertrieb – einstufiger BAB), `mit-vorkostenstellen` (6 Stellen: Energie, Instandhaltung, Material, Fertigung I, Verwaltung, Vertrieb; nur die Primärverteilung).
- **Parameter:** 1–2 direkt zugeordnete Kostenarten (Hilfsstoffe, Betriebsstoffe laut Entnahmeschein; Hilfslöhne laut Lohnliste; Gehälter laut Gehaltsliste) und 3–4 geschlüsselte Kostenarten (Raumkosten nach m², freiwillige Sozialkosten nach Mitarbeitern, kalkulatorische Abschreibungen nach Anlagenwerten (Wertschlüssel), kalkulatorische Zinsen und Versicherungen nach Schlüsselzahlen, Energiekosten nach kWh nur ohne eigene Energie-Kostenstelle). Insgesamt 4–6 Kostenarten. Klausurfreundlich (80 %): Betrag = Satz je Schlüsseleinheit × Schlüsselsumme, alle Anteile centgenau. Krumm (20 %): beliebige Centbeträge.
- **Lösung:** Kostenstelleneinzelkosten unverändert übernehmen; je Schlüsselzeile Schlüsselsumme Σk, Anteil der Stelle = Betrag × k ÷ Σk, auf Cent gerundet; Rundungsdifferenz der Zeile in der Stelle mit dem größten Schlüssel ausgleichen (bei Gleichstand die erste). Summenzeile je Stelle. Einzelkosten (Fertigungsmaterial, Fertigungslöhne) bleiben draußen.
- **Bewertung:** Exakter Pfad = Anteile mit Rundungsausgleich; zweiter Pfad = ungerundeter Anteil. Damit gilt auch einfaches kaufmännisches Runden ohne Ausgleich als richtig (Rundungshinweis).
- **Interaktion:** `rechenkette` „Schlüsselsummen“ (Teilschritt für das Handy), `tabelle` BAB (direkte Zeilen gesperrt).
- **Prüfregeln:** Jede Zeile verteilt genau ihren Betrag; Σ Summenzeile = Σ aller Gemeinkosten.
- **Fehlertypen:** `schluessel-falsch-summiert` (Schlüsselsumme ohne die erste Stelle bzw. ohne die Vorkostenstellen), `zeile-vertauscht` (Schlüssel der ersten beiden Schlüsselzeilen vertauscht).
- **Punkte:** 10.

### I3 – Anbauverfahren (`I3-anbau`)

- **Parameter:** Vorkostenstellen Energie (kWh) und Instandhaltung (Std.) mit gegenseitigen Lieferungen (5–25 % der Leistung, immer > 0), 2–4 Hauptkostenstellen mit primären Gemeinkosten 10.000–150.000 €. Klausurfreundlich: primäre Kosten = glatter Satz × Leistung an die Hauptkostenstellen.
- **Lösung:** Leistung an die Hauptkostenstellen = Gesamtleistung − Lieferung an die andere Vorkostenstelle; q = primäre Gemeinkosten ÷ Leistung an die Hauptkostenstellen; Umlage = q × Menge; Summe = primäre Gemeinkosten der Hauptkostenstelle + Umlagen.
- **Rundung:** Der Lehrbrief rechnet mit dem auf 2 Stellen gerundeten Satz weiter; dieser Weg gilt als richtig (zweiter Pfad), der exakte Weg ebenso.
- **Interaktion:** `rechenkette` (Leistung an die Hauptkostenstellen, Verrechnungssätze), `tabelle` BAB.
- **Prüfregel:** Σ Hauptkostenstellen = Σ primäre Gemeinkosten aller Stellen (exakter Pfad).
- **Fehlertypen:** `anbau-gesamtleistung` (durch die gesamte Leistung geteilt), `summe-ohne-primaerkosten`.
- **Punkte:** 10.

### I6 – Zuschlagssätze, Normalzuschläge, Über-/Unterdeckung (`I6-zuschlagssaetze`)

- **Varianten:** `ist-saetze`, `deckung`.
- **Parameter:** Fertigungsmaterial, Fertigungslöhne (eine oder zwei Fertigungsstellen), Istgemeinkosten der Hauptkostenstellen aus dem BAB, 0–2 Bestandsveränderungen (Mehr-/Minderbestand an unfertigen bzw. fertigen Erzeugnissen); in `deckung` zusätzlich Normalzuschlagssätze. Istgemeinkosten in `deckung` = Normalgemeinkosten ± 1–10 %.
- **Lösung `ist-saetze`:** MGK-Satz = MGK ÷ FM × 100; FGK-Satz = FGK ÷ FL × 100 (je Fertigungsstelle); Herstellkosten der Periode = FM + MGK + FL + FGK; Herstellkosten des Umsatzes = HK der Periode − Mehrbestand + Minderbestand; VwGK-Satz und VtGK-Satz = Gemeinkosten ÷ HK des Umsatzes × 100. Sätze auf 2 Nachkommastellen in Prozent.
- **Lösung `deckung`:** Normal-MGK = FM × Normalsatz, Normal-FGK = FL × Normalsatz; Normal-HK des Umsatzes = FM + Normal-MGK + FL + Normal-FGK ∓ Bestandsveränderungen; Normal-VwGK/-VtGK = Normal-HK des Umsatzes × Normalsatz `[ANNAHME – bitte prüfen]`. Über-/Unterdeckung je Stelle und gesamt = Normal − Ist; positiv = Überdeckung, negativ = Unterdeckung `[ANNAHME – bitte prüfen]`. Abfrage als Betrag plus Auswahl „Überdeckung/Unterdeckung“.
- **Interaktion:** `rechenkette` (keine große Tabelle, auch auf dem Handy vollständig).
- **Fehlertypen:** `bestandsveraenderung-vorzeichen`, `hk-periode-statt-umsatz`, `zuschlagsbasis-falsch` (Vertrieb auf HK + VwGK, vorhandener Typ), `ueber-unterdeckung-vertauscht`, `normal-auf-ist-basis`.
- **Prüfregeln:** Gesamtdeckung = Σ Normal − Σ Ist = Σ der Stellenabweichungen; keine Abweichung von 0.
- **Punkte:** 8.

## Golden Cases

Alle Beträge in €, eigene Zahlen. Umgesetzt in `src/engine/generators/ij/ij.test.ts`.

**GC-IJ-01 BAB (einstufig).** Stellen Material, Fertigung I, Verwaltung, Vertrieb. Hilfslöhne direkt 2.000 / 12.500 / 1.000 / 2.500 (18.000). Raumkosten 24.000 nach 400 : 1.200 : 300 : 500 m² (Σ 2.400) → 4.000 / 12.000 / 3.000 / 5.000. Energiekosten 15.000 nach 1 : 6 : 1 : 2 (Σ 10) → 1.500 / 9.000 / 1.500 / 3.000. Kalk. Abschreibungen 36.000 nach Anlagenwerten 60.000 : 300.000 : 40.000 : 50.000 (Σ 450.000) → 4.800 / 24.000 / 3.200 / 4.000.
Summen: 12.300,00 / 57.500,00 / 8.700,00 / 14.500,00; zusammen 93.000,00.

**GC-IJ-02 BAB-Rundung.** 10.000 nach 1 : 1 : 1 : 3 → 1.666,67 / 1.666,67 / 1.666,67 / 4.999,99 (Ausgleich in der Stelle mit dem größten Schlüssel). 5.000,00 ohne Ausgleich gilt ebenfalls als richtig (Rundungshinweis).

**GC-IJ-03 Anbauverfahren.** Energie primär 18.000, 10.000 kWh (an Instandhaltung 1.000, Material 2.000, Fertigung I 5.000, Verwaltung 1.000, Vertrieb 1.000). Instandhaltung primär 12.000, 500 Std. (an Energie 20, Material 80, Fertigung I 300, Verwaltung 40, Vertrieb 60). Hauptkostenstellen primär 30.000 / 80.000 / 20.000 / 25.000.
Leistung an Hauptkostenstellen 9.000 kWh und 480 Std.; q = 2,00 €/kWh und 25,00 €/Std. Umlagen Energie 4.000 / 10.000 / 2.000 / 2.000, Instandhaltung 2.000 / 7.500 / 1.000 / 1.500. Summen 36.000 / 97.500 / 23.000 / 28.500 = 185.000 (= alle primären Gemeinkosten). Typischer Fehler durch Gesamtleistung: 1,80 €/kWh und 24,00 €/Std.

**GC-IJ-04 Anbau mit gerundetem Satz.** Energie 20.000 auf 6.000 kWh an Hauptkostenstellen (500 kWh an Instandhaltung): q = 3,333… → 3,33 €/kWh. Umlage Material (1.000 kWh) exakt 3.333,33, Lehrbrief-Weg 3.330,00 – beides richtig. Summe exakt 79.000,00.

**GC-IJ-05 Ist-Zuschlagssätze.** FM 200.000, MGK 24.000 → 12,00 %; FL 120.000, FGK 180.000 → 150,00 %. HK der Periode 524.000; Mehrbestand fertige Erzeugnisse 30.000, Minderbestand unfertige Erzeugnisse 6.000 → HK des Umsatzes 500.000. VwGK 50.000 → 10,00 %; VtGK 25.000 → 5,00 %. Fehler „Vorzeichen vertauscht“: HK des Umsatzes 548.000.

**GC-IJ-06 Über-/Unterdeckung.** Wie GC-IJ-05, Normalzuschläge 10 % / 160 % / 9 % / 6 %.
Normal-MGK 20.000; Normal-FGK 192.000; Normal-HK der Periode 532.000; Normal-HK des Umsatzes 508.000; Normal-VwGK 45.720; Normal-VtGK 30.480.
Normal − Ist: Material −4.000 (Unterdeckung), Fertigung +12.000 (Überdeckung), Verwaltung −4.280 (Unterdeckung), Vertrieb +5.480 (Überdeckung); gesamt +9.200 (Überdeckung). Mit Ist-HK als Basis (Fehlertyp `normal-auf-ist-basis`): Normal-VwGK 45.000.

## Prüfvermerke

**Lektionen (Checkliste 09, Abschnitt 9; `lessons.test.ts` grün):**

- I1 „Kostenstellen: Wo entstehen die Kosten?“ – Rätsel (Stromkosten des Werks ohne Aufteilung), Alltag WG mit Zählern je Zimmer, 5 interaktive Bildschirme (Sortieren, Vorhersage, Wer hat recht, Fehlerjagd, Verständnis), Klausurbrücke Zuordnung Vor-/Endkostenstellen. Geprüft gegen K2 1.1, 1.2.1, 1.2.2.
- I2 „Der BAB: Eine Rechnung, vier Kostenstellen“ – Rätsel Mietrechnung (Beleg), Alltag WG-Miete nach Zimmergröße, 5 interaktive Bildschirme inkl. Lückenbeispiel vom Generator, Klausurbrücke BAB-Tabelle (Engine). Geprüft gegen K2 1.3, 1.4.1.
- I3 „Anbauverfahren: Der schnelle Weg“ – Rätsel Zahlen bis heute Abend, Alltag Mitbewohner, 5 interaktive Bildschirme inkl. Lückenbeispiel, Klausurbrücke Verrechnungssätze (Engine). Geprüft gegen K2 1.4.2.1, 1.4.2.2.
- I6 „Zuschlagssätze: Vom BAB zum Prozentsatz“ – Rätsel Prozentsatz für die Hotelkette, Alltag Trinkgeld und Nebenkostenvorauszahlung, 5 interaktive Bildschirme, Klausurbrücke Ist-Zuschlagssätze mit Bestandsveränderungen (Engine). Geprüft gegen K2 1.4.3, 1.4.4.
- J1 „Kostenträger: Welche Kalkulation passt?“ – Rätsel Zuschlag je Dose, Alltag Partypizza vs. Caterer, 5 interaktive Bildschirme (zweimal Sortieren, Vorhersage, Wer hat recht, Verständnis), Klausurbrücke Zuordnung Fertigungsart → Verfahren. Geprüft gegen K2 2.1, 2.2.1, 2.2.2.1.
- Cliffhanger-Kette: I1 → I2 (eine Mietrechnung für das ganze Werk) → I3 (Energie und Werkstatt verkaufen nichts) → I4 (die Werkstatt trägt keinen Stromkosten-Cent) → I5 → I6 (Cliffhanger in `li5.ts` angepasst: Wie kommen die Gemeinkosten in den Preis eines Auftrags?) → J1 (Millionen gleicher Dosen) → J2 (eine Linie, eine Sorte: Divisionskalkulation).

**Theorie (`src/content/theory/ij.json`, 24 Elemente, alle `aktiv`):** I1: 5 Karten, 5 Multiple Choice, 1 Kurzantwort; J1: 4 Karten, 7 Multiple Choice (davon 5 „Verfahren wählen“), 2 Kurzantworten.

- Faktenabgleich (zweiter Durchlauf, 03.11.2026) je Element gegen die angegebene Lehrbriefstelle: 23 × `ok`, 1 × `korrigiert` (I1-007: ergänzt, dass Hauptkostenstellen in der produktionstechnischen Einteilung nur die Fertigungsstellen sind). Zusätzlich im Entwurf korrigiert: J1-006 Distraktor-Erklärung ohne Aussage, die nicht im Lehrbrief steht; J1-008 Quelle um K2 2.2.6 ergänzt (keine verursachungsgerechte Zuordnung bei Kuppelproduktion).
- Plagiatsprüfung: `node scripts/check-overlap.ts` über alle Dateien dieses Batches: keine Überschneidung über 8 Wörter.

## Offene fachliche Fragen

1. `[GEKLÄRT – Prüfpunkt 3]` **Richtung von Über- und Unterdeckung.** Der Lehrbrief (K2 1.4.4, S. 41) schreibt sinngemäß „Istwert > Normalwert = Überdeckung“, erklärt das aber damit, dass in der Planung höhere Gemeinkosten angesetzt wurden – das passt zur üblichen Definition **Normalgemeinkosten > Istgemeinkosten = Überdeckung** (zu viel verrechnet). Die App verwendet die übliche Definition: Differenz Normal − Ist, positiv = Überdeckung, negativ = Unterdeckung. Bitte bestätigen, dass die Klausur das so erwartet.
2. `[ANNAHME – bitte prüfen]` **Basis der Normal-Verwaltungs- und -Vertriebsgemeinkosten.** Die App rechnet sie auf die Herstellkosten des Umsatzes, die mit den Normalgemeinkosten von Material und Fertigung gebildet werden (Kostenträgerzeitblatt). Der Lehrbrief nennt nur „verrechnete Normalgemeinkosten auf Basis des Normalzuschlagssatzes“. Der Weg über die Ist-Herstellkosten wird als Fehlertyp erkannt und erklärt.
3. `[ANNAHME – bitte prüfen]` **Rundungsausgleich im BAB:** Die Stelle mit dem größten Schlüssel (bei Gleichstand die erste) übernimmt die Rundungsdifferenz einer Zeile (03-aufgabentypen.md). Einfach gerundete Anteile ohne Ausgleich gelten ebenfalls als richtig.
4. **Begriff Hauptkostenstelle.** Der Lehrbrief verwendet im BAB „Haupt-(End-)kostenstellen“ gleichbedeutend (K2 1.3, 1.4.2.2), definiert in der produktionstechnischen Einteilung (K2 1.2.2, S. 18) Hauptkostenstellen aber enger als reine Fertigungsstellen. Umgesetzt: im BAB-Zusammenhang „Hauptkostenstellen, auch Endkostenstellen genannt“ (04, Abschnitt 7.3), die enge Einteilung nur auf Theorie-Karte I1-007. Bitte bestätigen.
5. `[ANNAHME – bitte prüfen]` **Aktivierte Eigenleistungen** mindern laut Lehrbrief die Herstellkosten des Umsatzes; der I6-Generator variiert nur Bestandsveränderungen. Falls Klausuren aktivierte Eigenleistungen in dieser Rechnung abfragen, ergänze ich das.
