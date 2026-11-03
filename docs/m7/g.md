# M7 Batch g (Skills G1–G6)

Quelle: Lehrbrief KLR I, Kap. 1 (K1 1.2 Grundbegriffe S. 21–29, 1.3 Kostenbegriffe S. 30, 1.4.1 fixe/variable Kosten S. 30–32, 1.4.2 Einzel-/Gemeinkosten S. 32–33, 1.5 Prinzipien S. 34–35, 1.6 Systematik und Ergebnistabelle S. 35–42). Kulisse: „Januar Folgejahr: Controlling baut die Kostenrechnung auf“; Abrechnungsperiode in allen Aufgaben ist der Januar. Alle Zahlen eigen.

| Skill            | Art                 | Generator               | Lektion  | Theorie (g.json) |
| ---------------- | ------------------- | ----------------------- | -------- | ---------------- |
| G1-grundbegriffe | Generator + Theorie | `g/g1-grundbegriffe.ts` | `lg1.ts` | 4                |
| G2-abgrenzung    | Generator           | `g/g2-abgrenzung.ts`    | `lg2.ts` | 3                |
| G3-kostenbegriff | Theorie             | –                       | `lg3.ts` | 8                |
| G4-fix-variabel  | Generator           | `g/g4-fix-variabel.ts`  | `lg4.ts` | 2                |
| G5-einzel-gemein | Generator + Theorie | `g/g5-einzel-gemein.ts` | `lg5.ts` | 3                |
| G6-prinzipien    | Theorie             | –                       | `lg6.ts` | 12               |

## Generator-Spezifikationen

### G1 – Grundbegriffe (`G1-grundbegriffe`, 4 Punkte)

- **Varianten:** `zuordnung` (4 Vorgänge, je Vorgang vier Auswahlfelder ja/nein: Auszahlung/Ausgabe/Aufwand/Kosten bzw. Einzahlung/Einnahme/Ertrag/Leistung), `betraege` (4 Vorgänge mit Beträgen, gesucht die Summen der Auszahlungen, Ausgaben, Aufwendungen, Kosten des Monats; immer mit „Zielkauf, davon Teil verbraucht“).
- **Katalog:** 21 Vorgänge (14 Auszahlungsseite, 8 Einzahlungsseite) nach den Lehrbrief-Fällen 1–9, 11–18; Stufen fest im Katalog, Begründung je Vorgang.
- **Definitionen:** Auszahlung = Abfluss liquider Mittel; Ausgabe = Abnahme des Geldvermögens (Kasse + Forderungen − Verbindlichkeiten); Aufwand = bewerteter Verbrauch der Periode; Kosten = betrieblicher, periodenbezogener, ordentlicher Verbrauch (einschließlich Zusatzkosten). Analog Einzahlung/Einnahme/Ertrag/Leistung.
- **Interaktion:** `rechenkette` mit Auswahlfeldern bzw. Zahlfeldern.
- **Prüfregeln:** Zuordnungsaufgaben mit mindestens 3 Vorgängen, deren Stufen nicht alle gleich sind; Betragsvariante: jede Summe ≠ 0.
- **Fehlertypen:** `auszahlung-ausgabe-verwechselt`, `einzahlung-einnahme-verwechselt`, `ausgabe-aufwand-verwechselt`, `einnahme-ertrag-verwechselt`, `neutral-als-kosten`, `neutral-als-leistung`, `kosten-als-neutral`, `zusatzkosten-als-aufwand`, `zusatzleistung-als-ertrag`.

### G2 – Abgrenzung (`G2-abgrenzung`, 6 Punkte; in `tabellen` wegen Ergebnistabelle)

- **Variante `zuordnung`:** 5 Sachverhalte → Auswahl aus 7 Kategorien: neutraler Aufwand betriebsfremd / periodenfremd / außerordentlich, Grundkosten (aufwandsgleich), Anderskosten, Zusatzkosten, weder Aufwand noch Kosten. Mindestens ein neutraler und ein kalkulatorischer Sachverhalt, mindestens 4 verschiedene Kategorien. Katalog: 20 Sachverhalte.
- **Variante `ergebnistabelle`:** Rechnungskreis I (Aufwendungen/Erträge) gegeben; Zeilen: Umsatzerlöse, Zins-/Mieterträge (neutral), Rohstoffe, Löhne, Gehälter, Abschreibungen (bilanziell, optional mit neutralem Anteil für ein nicht betrieblich genutztes Wohnhaus, kalkulatorisch), Zinsaufwendungen/kalkulatorische Zinsen, Betriebssteuern (optional mit Nachzahlung Vorjahr), Spende, kalkulatorischer Unternehmerlohn.
  - Spalten: neutraler Aufwand, neutraler Ertrag (unternehmensbezogene Abgrenzung); Aufwand lt. FB, verrechnete Kosten (kostenrechnerische Korrekturen); Kosten, Leistungen (Betriebsergebnis). Summenzeile mit allen 8 Spalten, danach Rechenkette mit Gesamtergebnis, Ergebnis aus unternehmensbezogenen Abgrenzungen (nE − nA), Ergebnis aus kostenrechnerischen Korrekturen (verrechnete Kosten − Aufwand lt. FB), neutrales Ergebnis, Betriebsergebnis.
  - Umsatz = Aufwand × 1,10–1,35, auf 10.000 € gerundet; krumme Werte nur bei Rohstoffen, Löhnen, kalkulatorischen Zinsen.
  - **Prüfregeln (1.000 Seeds):** Gesamtergebnis = neutrales Ergebnis + Betriebsergebnis; Aufwand RK I = neutraler Aufwand + Aufwand lt. FB + Grundkosten; Erträge RK I = neutrale Erträge + Leistungen; Betriebsergebnis > 0; |Ergebnis Korrekturen| ≥ 500 €.
- **Fehlertypen:** `neutral-als-kosten`, `kosten-als-neutral`, `neutral-art-verwechselt`, `grundkosten-anderskosten-verwechselt`, `anderskosten-zusatzkosten-verwechselt`, `zusatzkosten-als-aufwand`, `zahlung-als-aufwand`, `ausgabe-aufwand-verwechselt`; Ergebnistabelle: `korrektur-vorzeichen`, `bilanziell-statt-kalkulatorisch`, `zusatzkosten-vergessen`, `neutral-als-kosten`.

### G4 – Fixe und variable Kosten (`G4-fix-variabel`, 5 Punkte)

- **Variante `kostenfunktion`:** Gesamtkosten zweier Monate (Mengen in hl, Fertigung I) → kv = ΔK ÷ Δx, Kf = K − kv · x; für eine dritte Menge Gesamtkosten, fixe Stückkosten Kf ÷ x, Stückkosten k = kv + Kf ÷ x (zwei Lösungspfade, kf vorab gerundet). Klausurfreundlich: Kf ÷ x auf Cent genau; 20 % krumm.
- **Variante `beschaeftigungsgrad`:** Kosten bei a % und b % → variable Kosten bei a % = (Ka − Kb) ÷ (a − b) × a, Fixkosten, Kosten bei c %.
- **Variante `zuordnung`:** 5 Kostenarten → fix / variabel / intervallfix (sprungfix).
- **Fehlertypen:** `durchschnitt-statt-differenz`, `alles-variabel`, `fixkosten-vergessen`, `differenz-nicht-hochgerechnet`, `fix-variabel-vertauscht`, `intervallfix-verkannt`.

### G5 – Einzel- und Gemeinkosten (`G5-einzel-gemein`, 4 Punkte)

- **Variante `zuordnung`:** 5 Kostenarten (je 1 Einzel-, 1 unechte, 2 echte Gemeinkosten, 1 Sondereinzelkosten) → Einzelkosten, Sondereinzelkosten der Fertigung, Sondereinzelkosten des Vertriebs, unechte Gemeinkosten, echte Gemeinkosten.
- **Variante `zusammenhang`:** 4 Kostenarten ohne Sondereinzelkosten, zusätzlich fix/variabel (Lehrbrief Abb. 10: Einzelkosten und unechte Gemeinkosten variabel, fixe Kosten regelmäßig Gemeinkosten).
- **Fehlertypen:** `einzel-gemein-vertauscht`, `unechte-gemeinkosten-verkannt`, `sondereinzelkosten-verkannt`, `fix-variabel-vertauscht`.

## Golden Cases (Tests in `src/engine/generators/g/g.test.ts`)

- **GC-G1-1:** Stufen aller Katalogvorgänge, z. B. Überweisung an Lieferanten (Dezember-Rechnung) J/N/N/N; Zielkauf eingelagert N/J/N/N; Verbrauch aus Lagerbestand N/N/J/J; Spende J/J/J/N; kalkulatorischer Unternehmerlohn N/N/N/J; Produktion auf Lager N/N/J/J (Einzahlungsseite); Patentnutzung N/N/N/J.
- **GC-G1-2:** Zielkauf Aromen 20.000 € (davon 12.000 € verbraucht), Überweisung Dezember-Rechnung 8.000 €, Spende 1.500 €, kalkulatorischer Unternehmerlohn 9.000 € → Auszahlungen 9.500,00; Ausgaben 21.500,00; Aufwand 13.500,00; Kosten 21.000,00. Fehler „Zieleinkauf ganz als Aufwand“ → Aufwand 21.500,00, Kosten 29.000,00.
- **GC-G2-1:** Zuordnung aller 20 Sachverhalte (z. B. Kursverlust aus Geldanlage: betriebsfremd; Steuernachzahlung Vorjahr: periodenfremd; Orkanschaden ohne Versicherung: außerordentlich; Kfz-Steuer Januar: Grundkosten; Verbrauch zu Tagespreisen: Anderskosten; kalkulatorische Miete: Zusatzkosten; Privatentnahme: weder noch).
- **GC-G2-2 Ergebnistabelle:** Umsatz 900.000; Zinserträge 6.000; Mieterträge 4.000; Rohstoffe 310.000; Löhne 180.000; Gehälter 95.000; Abschreibungen 72.000 (kalk. 64.000); Zinsaufwand 9.000 (kalk. 15.000); Betriebssteuern 21.000 (davon 5.000 Nachzahlung Vorjahr); Spende 3.000; kalk. Unternehmerlohn 12.000.
  Aufwand 690.000, Erträge 910.000, Gesamtergebnis 220.000. Unternehmensbezogene Abgrenzung: 10.000 − 8.000 = 2.000. Korrekturen: 91.000 − 81.000 = 10.000. Neutrales Ergebnis 12.000. Kosten 692.000, Leistungen 900.000, Betriebsergebnis 208.000. Abstimmung 12.000 + 208.000 = 220.000.
- **GC-G2-3:** wie GC-G2-2, zusätzlich 2.000 € der Abschreibungen auf ein nicht betrieblich genutztes Wohnhaus: Abschreibungszeile nA 2.000, Aufwand lt. FB 70.000, verrechnete Kosten 64.000; Abgrenzungsergebnis 0, Korrekturen 12.000, Betriebsergebnis 208.000.
- **GC-G4-1:** 4.000 hl → 300.000 €, 6.000 hl → 380.000 € ⇒ kv 40,00 €/hl, Kf 140.000,00; bei 5.000 hl: K 340.000,00, kf 28,00, k 68,00. Fehler Durchschnittskosten: kv 75,00.
- **GC-G4-2:** 100 % → 500.000 €, 60 % → 380.000 € ⇒ variable Kosten bei 100 % 300.000,00, Fixkosten 200.000,00, Kosten bei 80 % 440.000,00. Fehler „nicht hochgerechnet“: 120.000,00.
- **GC-G5-1:** Zuordnung aller 14 Kostenarten inkl. fix/variabel (z. B. Leim: unechte Gemeinkosten, variabel; Druckplatte für Kundenauftrag: Sondereinzelkosten der Fertigung; Geschenkkartons für einen Auftrag: Sondereinzelkosten des Vertriebs).
- **Eigenschaften:** alle Generatoren über `generators.test.ts` (1.000 Seeds, Fehlervarianten, Determinismus); zusätzlich Fixkostendegression (500 Seeds), Ergebnistabellen-Abstimmung (1.000 Seeds), jeder verwendete Fehlertyp hat eine Erklärung.

## Prüfvermerke

**Lektionen G1–G6:** Qualitäts-Checkliste (09-lektionen.md) je Lektion im Datensatz; `lessons.test.ts` grün (10–12 Bildschirme, 5–6 interaktive aus 5 Typen, Rätsel → Klausurbrücke → Cliffhanger). Zahlen in G1, G2, G4 aus der Engine (GC-G1-2, GC-G2-2, GC-G4-1), Zuordnungen in G1/G5 aus den Engine-Katalogen. Cliffhanger-Kette G1 → G2 (690.000 € Aufwand) → G3 (Wiederbeschaffungswert) → G4 (doppelte Menge) → G5 (Kosten einer Charge) → G6 (Werkleitergehalt verteilen) → H1 (Zuckerverbrauch, fehlende Entnahmescheine).

**Faktenabgleich (zweiter, getrennter Durchlauf, 03.11.2026, gegen K1 S. 21–42):**

- Theorie: 29 von 31 Elementen ok; 2 korrigiert: G1-karte-002 (Bestandsveränderungen des Sachvermögens statt nur Lager), G3-mc-003 (Beispiel Spende durch Reparatur eines nicht betrieblich genutzten Wohnhauses ersetzt, weil beim Spendenbeispiel auch „Verbrauch“ strittig war). G1-karte-003 (Lehrbrief-Fall 10) auf Empfehlung ergänzt. Alle 32 Elemente `aktiv`.
- Kataloge: alle Zuordnungen bestätigt. Umgesetzte Präzisierungen: Mieterträge/Zinsgutschrift „für Januar“; Stromnachberechnung „ohne Rückstellung/Verbindlichkeit“; Lkw-Unfall durch Orkanschaden ersetzt (Unfall eher kalkulatorisches Wagnis); Schwelle der zweiten Schichtleitung auf 10.000 hl (Kollision mit 8.000 hl in der Kostenfunktion).
- Lektionen: Kosten-Definition in G1 um „periodenbezogen, gewöhnlich“ ergänzt; G2-Cliffhanger widerspruchsfrei zu den Beispielzahlen; G4 „bei linearem Verlauf, innerhalb der Kapazität“; G5 „nach der Systematik des Lehrbriefs“.
- Ergebnistabelle-Logik an Lehrbrief Abb. 16 nachgerechnet: Vorzeichen und Abstimmung stimmen überein.

**Plagiatsprüfung:** `node scripts/check-overlap.ts` über alle Batch-g-Dateien: keine Übereinstimmung über 8 Wörter.

## Annahmen und offene fachliche Fragen

1. `[ANNAHME – bitte prüfen]` **Ausgabe = Abnahme des Geldvermögens.** Der Lehrbrief definiert Ausgaben im Text über den Beschaffungswert zugegangener Güter, bestimmt das Geldvermögen aber über Ausgaben/Einnahmen. Die App wertet daher Spende, Steuernachzahlung und Gehaltszahlung per Bank als Ausgabe (Lehrbuchstandard). Ein streng nach Beschaffungswert korrigierender Prüfer könnte bei Spende/Steuer anders urteilen.
2. `[ANNAHME – bitte prüfen]` **Kalkulatorischer Unternehmerlohn bei der OHG = Zusatzkosten.** Der Lehrbrief nennt den Einzelunternehmer; die Sachverhalte sagen ausdrücklich „ohne Gehalt“.
3. `[ANNAHME – bitte prüfen]` **Zinserträge aus Festgeld = neutraler Ertrag** (im Lehrbrief nur indirekt über die Ergebnistabelle belegt).
4. `[ANNAHME – bitte prüfen]` **Produktion auf Lager = Ertrag und Leistung in gleicher Höhe** (Lehrbrief Fall 12 nennt den Ertrag; Leistung abgeleitet).
5. **Lehrbrief-Fall 10** (Verkauf aus Vorperiodenbestand: Einnahme ohne Ertrag) bewusst nicht im Generator, weil er der Buchhaltungssicht (Umsatzerlös = Ertrag) widerspricht und ohne Gewinnaufschlag formuliert ist; als Theorie-Karte G1-karte-003 vorhanden. Frage: Soll er auch in Übungen vorkommen?
6. **Kalkulatorische Wagnisse** werden in G2 nicht zugeordnet (Lehrbrief erwähnt sie nur beiläufig bei den Zusatzkosten; üblich wäre Anderskosten). Bitte klären, welche Zuordnung die Klausur erwartet.
7. Beispiele für unechte Gemeinkosten (Leim, Kohlensäure, Schrumpffolie) und Sondereinzelkosten der Fertigung „Druckplatte“ sind Lehrbuchstandard, im Lehrbrief nicht namentlich genannt.

## Wünsche an andere Bereiche

- Erkunden-Baustein „Stückkosten-Regler“ (Menge per Schieberegler → Kf ÷ x, kv, k) für G4 und K1; der vorhandene Baustein `kostenfunktion` zeigt Erlös und Ergebnis und passt erst für Abschnitt K.
- Theorie-Karten und Kurzantworten werden in Sitzungen noch nicht genutzt (nur `mc`); `kartenElemente()` ist vorhanden, Kurzantworten bräuchten einen Abruf.
- Interaktionstyp `begriffszuordnung` (03-aufgabentypen.md) existiert nicht als eigener Teiltyp; G1/G2/G5 nutzen daher `rechenkette` mit Auswahlfeldern.
