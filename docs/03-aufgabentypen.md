# 03 – Aufgabentypen und Generatoren

## Teil 1: Interaktionstypen (UI-Komponenten)

| ID | Name | Beschreibung | Gerät |
|---|---|---|---|
| `kontozuordnung` | Konto zuordnen | Konto erscheint, Wischen/Tippen auf Aktiv/Passiv/Aufwand/Ertrag | mobil |
| `begriffszuordnung` | Begriff zuordnen | Sachverhalt (z. B. „Spende ans Rote Kreuz") → Kategorie (neutraler Aufwand, Grundkosten, Anderskosten, Zusatzkosten …) | mobil |
| `buchungssatz` | Buchungssatz-Builder | Konten aus durchsuchbarer Liste auf Soll/Haben ziehen oder tippen, Beträge eingeben. Mehrere Soll- und Haben-Zeilen. Live-Anzeige Summe Soll/Haben | beide |
| `rechenkette` | Rechenkette | Schritt-für-Schritt-Formular: jeder Zwischenwert ein Feld mit Bezeichnung (z. B. „Skonto brutto", „Skonto netto", „Steuerkorrektur") | beide |
| `tabelle` | Tabellenaufgabe | Editierbare Tabelle (BAB, Stufenleiter, Äquivalenzziffern, Kalkulationsschema). Vorgegebene Felder gesperrt, gesperrte Felder wie in der Klausur grau | Laptop bevorzugt |
| `tkonto` | T-Konto | Konto mit Soll/Haben-Spalten: Einträge setzen, Saldo bilden, Gegenkonto benennen | beide |
| `gleichungssystem` | Gleichungen aufstellen | Für Simultanverfahren: je Kostenstelle die Gleichung aus Bausteinen zusammensetzen (Primärkosten + Σ empfangene Menge × q = Gesamtmenge × q), danach Lösungsfelder für q | Laptop |
| `aufgabe-erkennen` | Aufgabe erkennen | Sachverhalt lesen, dann wählen: welches Verfahren/welcher Buchungsfall/welche Reihenfolge der Schritte. Noch nicht rechnen | mobil |
| `fehler-finden` | Fehler finden | Fertige Lösung mit einem eingebauten Fehler; Person markiert die fehlerhafte Zeile und wählt die Begründung | beide |
| `theoriekarte` | Theorie-Karte | Frage → Antwort aufdecken → Selbsteinschätzung (FSRS-Rating). Für Definitionen und Abgrenzungen | mobil |
| `mc` | Multiple Choice | 3–4 Optionen, Distraktoren aus Fehlertypen | mobil |
| `kurzantwort` | Kurzantwort mit Musterlösung | Freitext (z. B. „Erläutern Sie …"), danach Vergleich mit Musterpunkten als Checkliste, Selbstbewertung je Punkt | Laptop |

### Bewertung im Buchungssatz-Builder
- Reihenfolge der Zeilen egal; zusammengefasste vs. getrennte Buchungssätze gleichwertig, wenn fachlich zulässig (z. B. mehrere Abschreibungen in einem Satz).
- Kontenbezeichnungen über Synonymliste (`04-fachregeln.md`) normalisieren.
- Teilbewertung: richtige Konten, richtige Seiten, richtige Beträge getrennt erfassen. Feedback nennt, was stimmt.
- Fehlertyp-Erkennung über Regeln (siehe Teil 3), z. B. „Vorsteuer und Umsatzsteuer vertauscht".

## Teil 2: Generator-Schnittstelle

Jeder Rechen-Skill hat einen Generator in `src/engine/generators/<skill-id>.ts`:

```ts
interface Generator<P, S> {
  skillId: string;
  variants: string[];                 // z. B. ['netto-methode', 'brutto-methode']
  generate(rng: Rng, opts: GenOptions): P;          // Parameter in plausiblen Bereichen
  render(p: P, firma: FirmaConfig): TaskText;       // Sachverhalt in eigenen Worten
  solve(p: P): S;                                   // exakte Lösung inkl. aller Zwischenschritte
  steps(p: P, s: S): SolutionStep[];                // Rechenweg für Feedback und Hinweise
  hints(p: P, s: S): [string, string, string];      // gestufte Hilfen
  check(p: P, s: S, answer: unknown): CheckResult;  // inkl. erkannter Fehlertypen
  points: number;                                   // Klausurpunkte
}
```

Regeln für Generatoren:
- Zahlen „klausurfreundlich": runde Ausgangswerte, Ergebnisse überwiegend mit max. 2 Nachkommastellen. Für 20 % der Aufgaben auch krumme Werte.
- Der Generator ist deterministisch bei gleichem Seed (wichtig für Tests und Wiederholung derselben Aufgabe).
- Jeder Generator besteht Property-Tests: Soll = Haben, Nettobetrag + Steuer = Brutto, Summe verteilter Kosten = Summe primärer Kosten (Rundungsdifferenz ≤ 0,01 × Anzahl Empfänger) usw.
- **Jeder Sachverhalt spielt bei der MBG Paderborn** (Lernversion, siehe `08-firma-mbg.md`): passende Konten-, Produkt- und Kostenstellenbezeichnungen aus `FirmaConfig`, Lieferanten- und Kundennamen frei erfunden. Generatoren haben je Skill mehrere Sachverhalts-Vorlagen, damit sich die Texte nicht wiederholen.

## Teil 3: Spezifikationen der Kern-Generatoren

### C5 / D4 – Skonto (Einkauf und Verkauf)
- **Parameter:** Bruttobetrag der Rechnung (500–60.000 €), Skontosatz (1, 2, 2,5, 3 %), USt-Satz (Standard 19 %), Seite (Einkauf/Verkauf), Methode (netto/brutto), Bestandsart (Rohstoffe, Hilfsstoffe, Betriebsstoffe, Handelswaren, Anlagegut).
- **Lösung:** Skonto brutto = Rechnungsbetrag × Satz; Skonto netto = Skonto brutto ÷ (1 + USt); Steuerkorrektur = Differenz; Zahlbetrag = Rechnung − Skonto brutto.
- **Buchung Einkauf, Nettomethode:** Verbindlichkeiten a. LL [Rechnung] an Bank [Zahlbetrag], an Nachlässe für [Stoff] [Skonto netto], an Vorsteuer [Korrektur].
- **Buchung Einkauf, Anlagegut:** statt Nachlässe direkt an Anlagekonto (Minderung der Anschaffungskosten).
- **Buchung Einkauf, Bruttomethode:** zunächst an Nachlässe [Skonto brutto], später Nachlässe an Vorsteuer [Korrektur].
- **Buchung Verkauf, Nettomethode:** Bank [Zahlbetrag], Erlösberichtigungen [Skonto netto], Umsatzsteuer [Korrektur] an Forderungen a. LL [Rechnung].
- **Hinweis:** Rücksendungen sind keine Nachlässe, sondern Stornobuchungen (siehe 04-fachregeln.md).
- **Varianten der Aufgabenstellung:** gegeben ist Rechnungsbetrag ODER Zahlbetrag („Bankgutschrift … nach Abzug von 2 % Skonto"). Bei Zahlbetrag: Rechnung = Zahlbetrag ÷ (1 − Satz).
- **Fehlertypen:** `skonto-vom-netto` (Skonto auf Nettobetrag gerechnet), `steuer-falsches-konto` (Korrektur auf USt statt VSt oder umgekehrt), `keine-steuerkorrektur`, `skonto-auf-zahlbetrag` (Rechnung falsch rückgerechnet), `nachlass-statt-anlagekonto`, `falscher-steuersatz`.

### B3 – USt-Abschluss
- **Parameter:** Summe Vorsteuer, Summe Umsatzsteuer (je 5.000–500.000 €), ggf. Anfangsbestand USt.
- **Lösung:** Umsatzsteuer an Vorsteuer [kleinerer Betrag des Vorsteuerkontos bzw. VSt-Summe]; bei Zahllast: Umsatzsteuer an SBK [Zahllast]; bei Überhang: SBK an Vorsteuer [Überhang] (Ausweis als sonstige Forderung).
- **Fehlertypen:** `richtung-vertauscht`, `zahllast-aktiviert`, `ueberhang-passiviert`.

### E4 – Bestandsveränderungen
- **Parameter:** AB/EB unfertige und fertige Erzeugnisse, optional Umsatzerlöse und Aufwendungen für Erfolgsermittlung.
- **Lösung:** Mehrbestand: Erzeugniskonto an Bestandsveränderungen; Minderbestand: Bestandsveränderungen an Erzeugniskonto; Saldo des Kontos Bestandsveränderungen über GuV. Erfolg = Erlöse ± Bestandsveränderungen − Aufwendungen.
- **Fehlertypen:** `mehrung-als-aufwand`, `saldo-falsche-seite`, `ue-fe-verrechnet` (Unfertige und Fertige nicht getrennt).

### F6 – Forderungsbewertung
- **Varianten:** Umbuchung auf zweifelhafte Forderungen; Einzelwertberichtigung mit Ausfallquote (Basis Nettobetrag); Pauschalwertberichtigung auf den einwandfreien Restbestand (Basis netto); endgültiger Ausfall mit USt-Korrektur; Teilzahlung aus Insolvenzquote; Eingang einer bereits abgeschriebenen Forderung.
- **Fehlertypen:** `abschreibung-vom-brutto`, `ust-korrektur-zu-frueh` (USt bereits bei bloßer Wertberichtigung korrigiert), `pwb-auf-gesamtbestand` (zweifelhafte nicht herausgerechnet).

### F7 – Rechnungsabgrenzung / sonstige Forderungen und Verbindlichkeiten
- **Parameter:** Zahlungszeitpunkt (altes/neues Jahr), Leistungszeitraum (Monate über den Stichtag), Art (Aufwand/Ertrag), Betrag.
- **Entscheidungslogik:** Zahlung im alten Jahr, Erfolg im neuen → ARAP (Aufwand) bzw. PRAP (Ertrag). Erfolg im alten Jahr, Zahlung im neuen → sonstige Verbindlichkeit (Aufwand) bzw. sonstige Forderung (Ertrag).
- **Interaktion:** zuerst `aufgabe-erkennen` (welcher der vier Fälle), dann Betrag (zeitanteilig), dann Buchungssatz.
- **Fehlertypen:** `arap-prap-vertauscht`, `rap-statt-sonstige`, `zeitanteil-falsch`.

### F8 – Rückstellungen
- Bildung (z. B. Prozessrisiko, ausstehende Rechnung mit ungewisser Höhe), Inanspruchnahme mit Differenz (Aufwand/Ertrag aus Auflösung), Auflösung.
- **Fehlertypen:** `rueckstellung-mit-ust`, `differenz-falsch-gebucht`, `verbindlichkeit-statt-rueckstellung` (Höhe/Grund gewiss).

### H2 – Materialbewertung
- **Parameter:** AB plus 2–3 Zugänge (Menge, Preis), Abgang gesamt (periodisch) oder datierte Abgänge (permanent).
- **Verfahren:** periodischer Durchschnitt, permanenter (gleitender) Durchschnitt, FIFO, LIFO (periodisch und permanent).
- **Fehlertypen:** `ungewichteter-durchschnitt`, `fifo-lifo-vertauscht`, `endbestand-statt-verbrauch`.

### H4 – Kalkulatorische Abschreibung
- **Parameter:** Anschaffungskosten (bzw. Wiederbeschaffungswert), Nebenkosten (Montage, Transport), Restwert, Nutzungsdauer, ggf. Leistungseinheiten gesamt und je Jahr.
- **Verfahren:** linear; arithmetisch-degressiv (Degressionsbetrag = (AK − RW) ÷ Summe der Jahresziffern, Jahr k: (ND − k + 1) × Degressionsbetrag); geometrisch-degressiv (Satz × Restbuchwert); leistungsbezogen (Satz je Einheit × Leistung); Fehleinschätzung der Nutzungsdauer.
- **Rundungshinweis:** Satz je Leistungseinheit **nicht** vor dem Multiplizieren runden (die Musterlösung rundet 25,56 €/h vorab; exakt wäre 25,555… €/h). Antworttoleranz deckt beide Wege ab, Feedback weist auf den genaueren hin.
- **Fehlertypen:** `nebenkosten-vergessen`, `restwert-vergessen`, `jahresziffern-falsch`.

### I2 – BAB, Verteilung primärer Gemeinkosten
- **Parameter:** 4–8 Gemeinkostenarten, 4–6 Kostenstellen, je Kostenart Einzelbeleg-Werte oder Schlüssel (Fläche, Köpfe, Verhältniszahlen).
- **Lösung:** je Kostenart Betrag ÷ Summe Schlüssel × Schlüssel der Stelle; Summenzeile; Abweichungen durch Rundung in der Stelle mit dem größten Anteil ausgleichen (dokumentiertes Verfahren).
- **Interaktion:** `tabelle`.
- **Fehlertypen:** `schluessel-falsch-summiert`, `zeile-vertauscht`.

### I4 – Stufenleiterverfahren
- **Parameter:** 2–3 Hilfskostenstellen mit gegenseitigen Leistungen, 2–4 Hauptkostenstellen, primäre Gemeinkosten, Leistungsmengen.
- **Lösung:**
  1. Reihenfolge: für jede Hilfskostenstelle den Wert der an andere Hilfsstellen abgegebenen Leistungen berechnen (primäre Kosten ÷ Gesamtleistung × abgegebene Menge). Die Stelle mit dem höheren Wert wird zuerst abgerechnet. (bestätigt durch Lehrbrief K2 Kap. 1.4.2.3)
  2. Verrechnungssatz 1 = primäre Kosten ÷ Gesamtleistung.
  3. Verrechnungssatz 2 = (primäre Kosten + empfangene Kosten) ÷ (Gesamtleistung − an bereits abgerechnete Stellen abgegebene Menge).
  4. Verteilung, Zwischensummen, Gesamtsummen.
- **Interaktion:** `aufgabe-erkennen` (Reihenfolge begründen) + `tabelle` mit geschwärzten Feldern wie in der Klausur.
- **Prüfregel:** Summe der Gesamtsummen der Hauptkostenstellen = Summe aller primären Gemeinkosten (± Rundung).
- **Fehlertypen:** `reihenfolge-falsch`, `rueckfluss-nicht-abgezogen` (Gesamtleistung nicht um Leistung an bereits abgerechnete Stelle gemindert), `primaerkosten-statt-gesamt`.

### I5 – Simultanverfahren
- **Parameter:** 2–4 Kostenstellen mit Leistungsmatrix (inkl. möglichem Eigenverbrauch), primäre Kosten.
- **Lösung:** je Stelle i: Primärkosten_i + Σ_j (Menge von j an i × q_j) = Gesamtleistung_i × q_i. Lösen exakt mit Brüchen, Ausgabe gerundet auf 2 Nachkommastellen. Anschließend Verrechnung auf Hauptkostenstellen.
- **Interaktion:** `gleichungssystem` (Gleichungen zuerst aufstellen und prüfen lassen), dann Werte eingeben. Für schwierige Systeme optional „Lösungsweg anzeigen" (Einsetzungsverfahren Schritt für Schritt), weil in der Klausur von Hand gerechnet wird.
- **Fehlertypen:** `eigenverbrauch-falsch`, `zeile-spalte-vertauscht` (Liefer- und Empfangsrichtung verwechselt), `gesamtleistung-ohne-eigenverbrauch`.

### J3 – Äquivalenzziffern
- **Parameter:** 3–5 Sorten, Mengen, Äquivalenzziffern (ein- oder mehrstufig je Bereich), Gesamtkosten (je Bereich).
- **Lösung:** Rechnungseinheiten = Menge × ÄZ; Kosten je RE = Kosten ÷ Σ RE; Stückkosten je Sorte = Kosten je RE × ÄZ; bei mehrstufig je Bereich, dann summieren. Variante: ÄZ aus prozentualen Angaben ableiten („um 30 % höher als Sorte X").
- **Fehlertypen:** `menge-statt-re`, `aez-relativ-falsch`.

### J4 – Zuschlagskalkulation
- **Parameter:** FM, Zuschlagssätze MGK/FGK (ggf. mehrere Fertigungsstellen), FL, SEK, VwGK/VtGK, optional Gewinn, Skonto, Rabatt, Vertriebsprovision.
- **Schema:** MK = FM + MGK; FK = FL + FGK (+ SEK Fertigung); HK = MK + FK; SK = HK + VwGK + VtGK (+ SEK Vertrieb); Barverkaufspreis = SK + Gewinn; Zielverkaufspreis = Barverkaufspreis ÷ (1 − Skonto − Provision) (im Hundert); Listenverkaufspreis = Zielverkaufspreis ÷ (1 − Rabatt).
- **Fehlertypen:** `im-hundert-statt-vom-hundert`, `zuschlagsbasis-falsch` (VwGK auf SK statt HK), `sek-vergessen`.

### K – Teilkostenrechnung
- **K2/K3 Deckungsbeitrag und Break-even:** Parameter Preis, variable Stückkosten, Fixkosten, Absatzmenge. Lösung: db = p − k_v; DB = db · x; Ergebnis = DB − K_f; Gewinnschwelle = K_f ÷ db (aufrunden auf ganze Stück, „ab dem x-ten Stück Gewinn"). Kritische Menge zweier Verfahren: K_f1 + k_v1 · x = K_f2 + k_v2 · x. Fehlertypen: `fixkosten-je-stueck-im-db`, `nicht-aufgerundet`, `umsatz-statt-menge`.
- **K4 Mehrstufige DB-Rechnung:** 3–5 Erzeugnisse in 2 Gruppen, erzeugnis-, gruppen-, unternehmensfixe Kosten. Interaktion `tabelle`, danach `aufgabe-erkennen` („Welches Produkt einstellen, unter welcher Bedingung?"). Fehlertypen: `gruppenfix-einzeln-zugerechnet`, `einstellung-nach-db-i`.
- **K5 Preisuntergrenze/Zusatzauftrag:** kurzfristig = k_v; langfristig = k_v + K_f/x; Entscheidung bei freier Kapazität vs. Verdrängung. Fehlertyp: `vollkosten-als-untergrenze`.
- **K6 Engpass:** relativer DB = db ÷ Engpassbeanspruchung je Stück; Programm nach Rangfolge bis Kapazität oder Absatzgrenze. Fehlertyp: `rangfolge-nach-absolutem-db`.
- **K7 Make-or-buy:** Vergleich Fremdbezugspreis vs. variable Kosten der Eigenfertigung (bei freier Kapazität), mit zusätzlichen Fixkosten kritische Menge. Fehlertyp: `fixkosten-bei-freier-kapazitaet`.
- **K9 Plankosten:** Plankostenverrechnungssatz = Plankosten ÷ Planbeschäftigung; Sollkosten = K_f,plan + k_v,plan · Ist-Beschäftigung; verrechnete Plankosten = Verrechnungssatz · Ist-Beschäftigung; Beschäftigungs- und Verbrauchsabweichung.

### Weitere Generatoren (nach gleichem Muster spezifizieren)
A3, A4, A5, A6, A7, B1, B2, C1–C4, C6–C8, D1–D3, D5, D6, E1–E3, E5, F3, F5, G1, G2, G4, G5, H1, H5, H6, I3, I6, J2, J5, J6, J7. Bevor du einen dieser Generatoren baust: Spezifikation im obigen Format in dieses Dokument schreiben, Golden Cases ergänzen, zur Prüfung vorlegen.

## Teil 4: Fallmodus (E5 und KLR-Fälle)
Ein Fall ist eine Sequenz aus 5–20 Teilaufgaben auf einem gemeinsamen Datenstand der Firma (Anfangsbestände, Kontensalden). Teilaufgaben bauen aufeinander auf: Fehler in Schritt 3 werden markiert, ab Schritt 4 rechnet die App mit dem richtigen Wert weiter („Folgefehler-frei"), damit die Person nicht an einem Fehler hängen bleibt. Am Ende: abgeschlossene Konten, GuV, SBK als Tabellen, Abgleich mit Soll-Lösung.
