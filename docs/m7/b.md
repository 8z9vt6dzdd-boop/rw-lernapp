# M7 Batch b (Skills B1, B2)

Quellen (nur lokal gelesen, eigene Formulierung): BA 2.3.5.3 (Steuersätze 19 % / 7 % mit Beispielen, Nettoprinzip, Sollbesteuerung mit Abführung zum 10. des Folgemonats, Herausrechnen der Steuer aus dem Bruttobetrag, Buchung der Ausgangsrechnung, Vorsteuer als Aktivkonto, monatliche Verrechnung, Zahllast bzw. Vorsteuerüberhang), 04-fachregeln.md (Abschnitt 2 Nr. 1–2, Abschnitt 6: „Umsatzsteuer an Bank“). Alle Zahlen eigen.

Code: `src/engine/generators/b/` (gemeinsame Bausteine in `gemeinsam.ts`), Registrierung `src/engine/generators/batches/b.ts`, Fehlertypen `src/engine/fehlertypen-batches/b.ts`. Neue Konten waren nicht nötig. B3 (USt-Abschluss) bleibt beim bestehenden Generator `ust-abschluss.ts`.

## Generator-Spezifikationen

### B1 – Umsatzsteuer rechnen (`B1-ust-rechnen`, `ust-rechnen.ts`, 2 Punkte)

- **Parameter:** Variante, Richtung (Eingangsrechnung → „Vorsteuer“, Ausgangsrechnung → „Umsatzsteuer“), Steuersatz 19 % (65 %) oder 7 % (35 %; nur Eingangsbelege über Fachbücher, gedruckte Fachzeitschrift, Bahnfahrkarten), Betrag, Gegenstand und Partner aus `gemeinsam.ts` / `config.ts`. 20 % krumme Werte (Centbeträge bzw. Netto in ganzen Euro bei `steuer-netto`).
- **Varianten:**
  - `netto-brutto`: Netto gegeben → Steuer = Netto × Satz (auf Cent), Brutto = Netto + Steuer.
  - `brutto-netto`: Brutto gegeben → Netto = Brutto ÷ (1 + Satz) (auf Cent), Steuer = Brutto − Netto.
  - `steuer-netto`: Steuerbetrag gegeben → Netto = Steuer ÷ Satz, Brutto = Netto + Steuer (Netto immer ganze Euro, damit eindeutig).
  - `zwei-saetze`: Rechnung mit einer 7-%- und einer 19-%-Position (netto) → Steuer je Satz auf die Nettosumme dieses Satzes, Rechnungsbetrag.
  - `zahllast`: 3–6 Belege eines Monats (Ein-/Ausgang, netto oder brutto, überwiegend 19 %, gelegentlich ein 7-%-Beleg) → Vorsteuer, Umsatzsteuer, Auswahl Zahllast/Vorsteuerüberhang, Betrag. 25 % Überhang (große Investition: Etikettiermaschine).
- **Teile:** eine Rechenkette (2–4 Felder je Variante).
- **Fehlertypen:** `b-prozent-vom-brutto` (Steuersatz auf den Bruttobetrag; auch „Steuer ÷ 19 % = Brutto“), `b-steuersatz-verwechselt` (7 % ↔ 19 %), `b-ein-satz-fuer-alles` (alle Positionen mit 19 %), `steuer-falsches-konto` (Vorsteuer und Umsatzsteuer vertauscht), `b-zahllast-richtung`.

### B2 – Umsatzsteuer buchen (`B2-ust-buchen`, `ust-buchen.ts`, 2 Punkte)

- **Fälle:** Einkauf (45 %), Verkauf (38 %), Überweisung der Zahllast (12 %), Erstattung eines Vorsteuerüberhangs (5 %). Steuersatz immer 19 % (Getränke, Werkstoffe, Dienstleistungen).
- **Einkauf:** Werkstoffe und Handelswaren (bestandsorientiert, im Text genannt), Büromaterial, Fremdinstandhaltung, Werbung. Partner aus `config.ts` bzw. ohne Namen („einem Bürofachhandel in Paderborn“).
- **Verkauf:** eigene Erzeugnisse → Umsatzerlöse für eigene Erzeugnisse, Handelswaren → Umsatzerlöse für Handelswaren; Kunden aus `config.ts`.
- **Zahlung:** auf Ziel (60 %), per Bank (25 %), bar (15 %; nur kleine Beträge 40–900 €, Kassenbon immer brutto).
- **Betragsangabe:** netto oder (20 %, bei bar immer) brutto. Bei brutto zusätzlich Rechenkette „Bruttobetrag zerlegen“ (Netto, Steuer).
- **Mehrere Positionen (20 %):** Eingangsrechnung mit 2–3 Positionen auf verschiedenen (oder gleichen) Konten, z. B. Etiketten + Werbeplakate + Briefpapier; Ausgangsrechnung mit 2–3 Getränken (Erzeugnisse und Handelswaren). Steuer auf die Summe der Nettobeträge; gleiche Konten werden addiert.
- **Buchungen:**
  - Einkauf: [Sachkonto je Position] netto, Vorsteuer an Verbindlichkeiten a. LL / Bank / Kasse [brutto].
  - Verkauf: Forderungen a. LL / Bank / Kasse [brutto] an Umsatzerlöse … [netto je Konto], an Umsatzsteuer.
  - Zahllast (Verrechnung bereits gebucht): Umsatzsteuer an Bank.
  - Erstattung (Verrechnung bereits gebucht): Bank an Vorsteuer.
- **Varianten:** `einkauf`, `verkauf`, `bar`, `brutto`, `mehrere-positionen`, `zahllast`, `erstattung`.
- **Fehlertypen:** `steuer-falsches-konto`, `b-zahlungskonto-falsch`, `einkauf-ohne-vorsteuer` (c1), `b-verkauf-ohne-umsatzsteuer`, `erloeskonto-verwechselt` (d), `b-positionen-zusammengefasst`, `brutto-als-netto` (d), `b-prozent-vom-brutto`, `b-zahllast-als-aufwand`, `b-zahllast-ueber-vorsteuer`, `b-erstattung-ueber-umsatzsteuer`, `soll-haben-vertauscht`.
- B2 steht in `fehlerjagd` (ein Buchungssatz mit einem Satz; einzeilige Fehlervarianten in allen Fällen). B1 hat keinen Buchungssatz, keiner der beiden in `tabellen`.

## Golden Cases

Eigene Zahlen. Tests: `src/engine/generators/b/*.test.ts`.

| ID       | Sachverhalt                                                                                    | Erwartung                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| GC-B1-01 | Netto 4.200, 19 %                                                                              | Steuer 798,00; Brutto 4.998,00                                                                                 |
| GC-B1-02 | Netto 350, 7 %                                                                                 | Steuer 24,50; Brutto 374,50                                                                                    |
| GC-B1-03 | Brutto 7.140, 19 %                                                                             | Netto 6.000,00; Steuer 1.140,00 (falsch „minus 19 %“: 5.783,40 → `b-prozent-vom-brutto`)                       |
| GC-B1-04 | Brutto 214, 7 %                                                                                | Netto 200,00; Steuer 14,00 (mit 19 % gerechnet: 179,83 → `b-steuersatz-verwechselt`)                           |
| GC-B1-05 | Brutto 1.000, 19 % (krumm)                                                                     | Netto 840,34; Steuer 159,66                                                                                    |
| GC-B1-06 | Steuer 570, 19 %                                                                               | Netto 3.000,00; Brutto 3.570,00 (falsch: 570 ÷ 0,19 als Brutto → Netto 2.430)                                  |
| GC-B1-07 | 7 %: 300 netto; 19 %: 500 netto                                                                | Steuer 21,00 und 95,00; Brutto 916,00 (alles mit 19 %: 57,00 / 952,00 → `b-ein-satz-fuer-alles`)               |
| GC-B1-08 | Ausgang 50.000 netto, Ausgang 11.900 brutto; Eingang 20.000 netto, Eingang 2.140 brutto zu 7 % | Vorsteuer 3.940,00; Umsatzsteuer 11.400,00; Zahllast 7.460,00                                                  |
| GC-B1-09 | Eingang 100.000 netto; Ausgang 30.000 netto                                                    | Vorsteuerüberhang 13.300,00                                                                                    |
| GC-B2-01 | Hilfsstoffe 8.000 netto auf Ziel                                                               | Hilfsstoffe 8.000, Vorsteuer 1.520 an Verbindlichkeiten a. LL 9.520                                            |
| GC-B2-02 | Büromaterial bar, Kassenbon 297,50 brutto                                                      | Büromaterial 250, Vorsteuer 47,50 an Kasse 297,50                                                              |
| GC-B2-03 | Handelswaren 4.760 brutto, Kunde überweist sofort                                              | Bank 4.760 an Umsatzerlöse für Handelswaren 4.000, an Umsatzsteuer 760                                         |
| GC-B2-04 | Etiketten 3.000, Werbeplakate 1.200, Briefpapier 300 netto auf Ziel                            | Hilfsstoffe 3.000, Werbung 1.200, Büromaterial 300, Vorsteuer 855 an Verbindlichkeiten a. LL 5.355             |
| GC-B2-05 | Energy 10.000, Lemon 5.000, Liboriwein 2.000 netto auf Ziel                                    | Forderungen a. LL 20.230 an Umsatzerlöse 15.000, an Umsatzerlöse für Handelswaren 2.000, an Umsatzsteuer 3.230 |
| GC-B2-06 | Zahllast 7.460 überweisen                                                                      | Umsatzsteuer an Bank 7.460                                                                                     |
| GC-B2-07 | Vorsteuerüberhang 13.300 wird erstattet                                                        | Bank an Vorsteuer 13.300                                                                                       |
| GC-B2-08 | Barverkauf 99,99 brutto (krumm)                                                                | Kasse 99,99 an Umsatzerlöse 84,03, an Umsatzsteuer 15,96                                                       |

Eigenschaftstests: Netto + Steuer = Brutto exakt; Steuer = Netto × Satz (auf Cent); Rückrechnung = Brutto ÷ (1 + Satz) und stets größer als „Brutto minus Satz“, Gegenprobe Netto × (1 + Satz) ± 0,01; Steuer ÷ Satz trifft den Nettobetrag genau; Zahllast = Summe Umsatzsteuer − Summe Vorsteuer mit passendem Ergebnis; Soll = Haben; Einkauf nie mit Umsatzsteuer, Verkauf nie mit Vorsteuer; Zahlungskonto passt zur Zahlungsart; Kassenbons immer brutto; Zahllast immer „Umsatzsteuer an Bank“, Erstattung immer „Bank an Vorsteuer“.

## Offene fachliche Fragen

1. `[ANNAHME – bitte prüfen]` **Erstattung eines Vorsteuerüberhangs:** gebucht als „Bank an Vorsteuer“ (Saldo nach der Verrechnung steht auf dem Konto Vorsteuer). Der Lehrbrief sagt nur, dass der Überhang vom Finanzamt beglichen wird; einen Buchungssatz nennt er nicht.
2. `[ANNAHME – bitte prüfen]` **Zahllast in B2:** Die Aufgabe nennt die Zahllast und sagt ausdrücklich, dass die Verrechnung schon gebucht ist; gefragt ist nur die Überweisung („Umsatzsteuer an Bank“, 04 Abschnitt 6). Verrechnung plus Überweisung bleibt Aufgabe von B3.
3. `[ANNAHME – bitte prüfen]` **Mehrere Positionen:** Die Steuer wird je Steuersatz auf die Summe der Nettobeträge berechnet und einmal gerundet (wie auf einer Rechnung). Rundet jemand je Position, weicht das höchstens um einen Cent je Position ab; die Toleranz fängt das bei krummen Werten ab.
4. `[ANNAHME – bitte prüfen]` **7 % nur in B1** und nur für Gegenstände aus der Beispielliste des Lehrbriefs (Bücher, Zeitschriften, Personenbeförderung). B2 bucht ausschließlich zu 19 %, weil die MBG Getränke verkauft und ihre Werkstoffe im Szenario zum Regelsatz einkauft.
5. **Hinweis zur bestehenden Lektion B2:** Das Rätsel nutzt „Kristallzucker … zzgl. 19 % Umsatzsteuer“. Zucker unterliegt nach meinem Kenntnisstand dem ermäßigten Satz von 7 % (Anlage 2 UStG; nicht gegen eine Quelle in `quellen/` verifiziert). Die Generatoren von Batch b vermeiden Zucker deshalb. Vorschlag: in der Lektion einen anderen Rohstoff (z. B. Aromen) verwenden. **Erledigt (03.11.2026):** Lektion B2 nutzt jetzt Zitrusaroma; Zucker und Braumalz wurden aus allen Stellen mit Vor- oder Umsatzsteuer entfernt.
