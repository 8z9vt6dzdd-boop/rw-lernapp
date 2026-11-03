# M7 Batch j (Skills J2, J5, J6, J7)

Quelle: Lehrbrief KLR II (K2), Kap. 2.2.2 (Divisionskalkulation), 2.2.5 (Bezugsgrößen-/Maschinensatzkalkulation), 2.2.6 (Kuppelproduktkalkulation), 2.3 (Kostenträgerzeitrechnung); Einsendeaufgabe KLR (Maschinenstundensatz). Alle Zahlen sind eigene. Die Rechenwege wurden mit den Lehrbrief-Beispielen lokal nachgerechnet (mehrstufige Division inkl. der dort genannten Rundungsdifferenz, Verteilungs- und Restwertmethode, GKV/UKV) und stimmen überein; die Lehrbrief-Zahlen stehen bewusst nicht im Repository.

Code: `src/engine/generators/j/` (`division.ts`, `maschinensatz.ts`, `kuppel.ts`, `gkv-ukv.ts`), Tests `j.test.ts` plus automatisch `generators.test.ts`. Lektionen `src/content/lessons/lj2.ts`, `lj5.ts`, `lj6.ts`, `lj7.ts`. Theorie-Karten `src/content/theory/j.json`.

## Generator-Spezifikationen

### J2 – Divisionskalkulation (`J2-division`, 6 Punkte)
- **Varianten:** `einstufig`, `zweistufig`, `mehrstufig`.
- **einstufig – Parameter:** ein Produkt (Paderquell Energy 0,5 l, Kartons), 3–4 Kostenarten, Menge 20.000–120.000; Produktion = Absatz. **Lösung:** Gesamtkosten = Σ Kostenarten; Selbstkosten je Stück = Gesamtkosten ÷ Menge.
- **zweistufig – Parameter:** Produktion 8.000–60.000 Kartons, Lagerveränderung ±500 bis ±6.000; entweder Absatzmenge direkt oder Lageranfangs- und -endbestand (dann Absatz = AB + Produktion − EB); entweder Herstellkosten direkt oder Gesamtkosten „davon Verwaltungs- und Vertriebskosten“ (dann HK = Gesamt − VV). **Lösung:** HK je Stück = HK ÷ produzierte Menge; VV je Stück = VV ÷ abgesetzte Menge; Selbstkosten je Stück = Summe; Bestandsveränderung = (Produktion − Absatz) × HK je Stück (Mehrung +, Minderung −).
- **mehrstufig – Parameter:** 2 oder 3 Fertigungsstufen (Sirupansatz, ggf. Ausmischen und Karbonisieren, Abfüllung) mit Kosten und Bearbeitungsmenge in hl; VV-Kosten, Absatzmenge. Je hl wird genau 1 hl der Vorstufe eingesetzt. **Lösung:** kh₁ = K₁ ÷ x₁; khⱼ = khⱼ₋₁ + Kⱼ ÷ xⱼ (Kostensatz je Stufe auf Cent gerundet); ks = khₙ + VV ÷ Absatz; Zwischenlager j: (xⱼ − xⱼ₊₁) × khⱼ, Fertiglager: (xₙ − Absatz) × khₙ; Summe der Bestandsveränderungen. **Prüfregel (Probe):** ks × Absatz + Bestandsveränderungen = alle Kosten der Periode (exakter Pfad; schrittweise gerundet nur Rundungsdifferenz).
- **Interaktion:** `rechenkette` (Teil `division`).
- **Fehlertypen:** `division-mengen-vertauscht`, `division-einstufig-trotz-lager`, `hk-inkl-vv` (zweistufig); `stufen-nicht-kumuliert`, `stufenkosten-durch-endmenge`, `bestand-zu-selbstkosten` (mehrstufig).

### J5 – Maschinenstundensatz (`J5-maschinensatz`, 8 Punkte)
- **Varianten:** `stundensatz`, `kalkulation`.
- **stundensatz – Parameter:** Anlage der MBG, Wiederbeschaffungswert, Nutzungsdauer 4–10 Jahre (linear), kalkulatorischer Zinssatz 5–10 % auf die durchschnittliche Kapitalbindung (halber Wiederbeschaffungswert), Platzbedarf in m² mit Raumkosten je m² und Monat oder je m² und Jahr, Energie entweder als (installierte kW, Leistungsgrad, Grundpreis je kW und Monat, Arbeitspreis je kWh) oder als Kosten je Laufstunde, Instandhaltung entweder als Faktor zum Wiederbeschaffungswert über die gesamte Nutzungsdauer oder als Jahresbetrag, Laufzeit 1.200–4.000 h/Jahr.
- **Lösung:** Abschreibung = WBW ÷ ND; Zinsen = WBW ÷ 2 × Zinssatz; Raum = m² × Satz (× 12 bei Monatswert); Energie fix = kW × Grundpreis × 12, variabel = kW × Leistungsgrad × Laufzeit × Arbeitspreis (bzw. Satz × Laufzeit); Instandhaltung = Faktor × WBW ÷ ND (bzw. Jahresbetrag); Summe; Maschinenstundensatz = Summe ÷ Laufzeit (Satz, ± 0,01).
- **kalkulation – Parameter:** Auftrag, Fertigungsmaterial, MGK-%, Fertigungslöhne, Restfertigungsgemeinkosten-% (auf Fertigungslöhne), Maschinenstundensatz, Maschinenlaufzeit des Auftrags, VwGK-%, VtGK-%. **Lösung:** MK = FM + MGK; Maschinenkosten = Laufzeit × Satz; FK = FL + Rest-FGK + Maschinenkosten; HK = MK + FK; VwGK und VtGK auf HK; SK.
- **Interaktion:** `rechenkette` (Teil `mss` bzw. `kalk`).
- **Fehlertypen:** `zinsen-voller-wert`, `monatswert-nicht-hochgerechnet`, `instandhaltung-faktor-nicht-verteilt`, `leistungsgrad-vergessen` (stundensatz); `rest-fgk-falsche-basis`, `maschinenkosten-vergessen` (kalkulation).

### J6 – Kuppelproduktkalkulation (`J6-kuppel`, 6 Punkte)
- **Varianten:** `verteilung`, `restwert`.
- **verteilung – Parameter:** Zitruspresse für Senne Lemon, 3–4 Kuppelprodukte (Zitronensaft hl, Zitronenöl kg, Fruchtfasern t, ggf. Zitrustrester t) mit Menge, Marktpreis und Einzelkosten der Weiterverarbeitung; Gesamtkosten einschließlich Einzelkosten. **Lösung:** Kosten des Kuppelprozesses = Gesamtkosten − Σ Einzelkosten; Erlös je Sorte = Menge × Marktpreis; Kosten je € Erlös = Kuppelkosten ÷ Σ Erlöse (auf 2 Stellen; der Generator wählt glatte Sätze); Stückkosten Kuppelprozess = Kosten je € Erlös × Marktpreis; Einzelkosten je Einheit = Einzelkosten ÷ Menge; Selbstkosten je Einheit = Summe; Selbstkosten der Sorte = × Menge. **Prüfregel:** Σ Selbstkosten der Sorten = Gesamtkosten (exakter Pfad).
- **restwert – Parameter:** Brauerei, Hauptprodukt Almeblick Tequila-Bier (hl), 2–3 Nebenprodukte (Biertreber t, Überschusshefe kg, rückgewonnene Kohlensäure t) mit Menge, Erlös je Einheit und Weiterverarbeitungskosten je Einheit; Kosten des Kuppelprozesses. **Lösung:** Abzug je Nebenprodukt = (Erlös − Weiterverarbeitung) × Menge; Restkosten = Kuppelkosten − Σ Abzüge; Herstellkosten je Einheit des Hauptprodukts = Restkosten ÷ Menge.
- **Interaktion:** verteilung `rechenkette` + `tabelle` (Laptop; im Kurzmodus auf dem Handy nur die Rechenketten), restwert `rechenkette`.
- **Fehlertypen:** `einzelkosten-nicht-abgezogen`, `einzelkosten-vergessen` (verteilung); `weiterverarbeitung-nicht-abgezogen`, `nebenerloes-addiert` (restwert).

### J7 – Gesamt- und Umsatzkostenverfahren (`J7-gkv-ukv`, 8 Punkte)
- **Varianten:** `gkv`, `ukv`, `vergleich` (beide plus `aufgabe-erkennen`: Welches Verfahren zeigt den Erfolg je Produktart?).
- **Parameter:** 2–3 Produktarten (Paderquell Energy, Senne Lemon, Almeblick Tequila-Bier) mit Produktions- und Absatzmenge in Kartons, Verkaufspreis, Material-, Fertigungs- sowie Verwaltungs- und Vertriebskosten der Produktart.
- **Lösung:** HK je Karton = (Material + Fertigung) ÷ Produktionsmenge. GKV: Bestandsveränderung je Produkt = (Produktion − Absatz) × HK je Karton; Umsatzerlöse; Gesamtleistung = Umsatz + Σ Bestandsveränderungen; Kosten der Periode = Σ aller Kosten; Betriebsergebnis = Gesamtleistung − Kosten. UKV: Selbstkosten des Umsatzes = HK je Karton × Absatz + VV; Ergebnis je Produktart = Umsatz − Selbstkosten des Umsatzes; Betriebsergebnis = Summe. **Prüfregel:** GKV = UKV (exakter Pfad).
- **Interaktion:** `tabelle` (HK, Bestandsveränderungen; UKV je Produkt) + `rechenkette` (GKV-Staffel, BE nach UKV); Laptop bevorzugt, auf dem Handy Teilschritte.
- **Fehlertypen:** `bv-vorzeichen-falsch`, `bestand-zu-selbstkosten`, `gkv-ohne-bv` (GKV); `ukv-produktionsmenge` (UKV); `verfahren-verwechselt` (Erkennen).

### Rundung
Wie `04-fachregeln.md` Abschnitt 3: zwei Lösungspfade. Schrittweise gerundet werden Stückkosten/Sätze je Stufe, Zinsen, Abschreibung, variable Energie, Instandhaltung, Kosten je € Erlös, Stückkosten aus dem Kuppelprozess. In 80 % der Aufgaben sind alle Werte glatt (Test: > 70 % bei 500 Seeds ohne „krumme“ Werte).

## Golden Cases
Alle in `src/engine/generators/j/j.test.ts`.

**GC-J2-1 einstufig.** Kostenarten 54.000 + 42.000 + 30.000; 42.000 Kartons → Gesamtkosten 126.000,00; Selbstkosten 3,00 €/Karton.

**GC-J2-2 zweistufig.** Produktion 12.000, Lager AB 1.500, EB 3.500 → Absatz 10.000; HK 96.000, VV 15.000 → HK je Karton 8,00; VV je Karton 1,50; Selbstkosten 9,50; Bestandsveränderung +16.000,00.

**GC-J2-3 zweistufig mit Gesamtkosten.** Gesamtkosten 111.000, davon VV 15.000 → HK 96.000,00, Selbstkosten 9,50. Fehler `hk-inkl-vv`: 9,25 €/Karton.

**GC-J2-4 mehrstufig.** Stufe 1: 36.000 € / 4.000 hl; Stufe 2: 22.800 € / 3.800 hl; Stufe 3: 15.400 € / 4.400 hl; VV 12.600 €, Absatz 4.200 hl.
kh₁ 9,00; kh₂ 15,00; kh₃ 18,50; VV 3,00; ks 21,50. Bestandsveränderungen +1.800,00 / −9.000,00 / +3.700,00 = −3.500,00. Probe: 21,50 × 4.200 − 3.500 = 86.800 = Σ Kosten.

**GC-J5-1 Maschinenstundensatz.** WBW 960.000, ND 8, Zins 8 %, 80 m² × 15 €/Monat, 60 kW, Leistungsgrad 75 %, Grundpreis 12 €/kW/Monat, Arbeitspreis 0,20 €/kWh, Instandhaltungsfaktor 0,4, Laufzeit 2.000 h.
Abschreibung 120.000,00; Zinsen 38.400,00; Raum 14.400,00; Energie fix 8.640,00; Energie variabel 18.000,00; Instandhaltung 48.000,00; Summe 247.440,00; Maschinenstundensatz 123,72 €/h. Fehler: Zinsen vom vollen Wert 76.800,00; Raum ohne × 12 1.200,00; Faktor nicht verteilt 384.000,00; ohne Leistungsgrad 24.000,00.

**GC-J5-2 Maschinensatzkalkulation.** FM 4.000, MGK 10 %, FL 1.200, Rest-FGK 80 %, 6,5 h × 123,72, VwGK 10 %, VtGK 5 %.
MGK 400,00; MK 4.400,00; Maschinenkosten 804,18; Rest-FGK 960,00; FK 2.964,18; HK 7.364,18; VwGK 736,42; VtGK 368,21; SK 8.468,81. Fehler `rest-fgk-falsche-basis`: Rest-FGK 1.603,34.

**GC-J6-1 Verteilungsmethode.** Gesamtkosten 189.200 inkl. Einzelkosten; Zitronensaft 1.000 hl à 150 € (EK 20.000), Zitronenöl 400 kg à 50 € (EK 3.200), Fruchtfasern 60 t à 500 € (EK 6.000).
Kuppelkosten 160.000,00; Σ Erlöse 200.000,00; 0,80 € je € Erlös; Stückkosten Kuppel 120,00 / 40,00 / 400,00; Einzelkosten je Einheit 20,00 / 8,00 / 100,00; Selbstkosten je Einheit 140,00 / 48,00 / 500,00; je Sorte 140.000,00 / 19.200,00 / 30.000,00 (Σ 189.200). Fehler `einzelkosten-nicht-abgezogen`: 0,95.

**GC-J6-2 Restwertmethode.** Kuppelkosten 412.000; Bier 8.000 hl; Biertreber 1.200 t (40 €/t, Weiterverarbeitung 15 €/t); Überschusshefe 2.500 kg (6 €/kg, 2 €/kg).
Abzüge 30.000,00 und 10.000,00; Restkosten 372.000,00; Herstellkosten 46,50 €/hl. Fehler `weiterverarbeitung-nicht-abgezogen`: 43,63 €/hl.

**GC-J7 GKV und UKV.** Paderquell Energy: Produktion 20.000, Absatz 18.000, Preis 14 €, Material 120.000, Fertigung 60.000, VV 30.000. Senne Lemon: Produktion 10.000, Absatz 11.000, Preis 12 €, Material 50.000, Fertigung 30.000, VV 16.000.
HK je Karton 9,00 / 8,00; Bestandsveränderungen +18.000,00 / −8.000,00; Umsatz 384.000,00; Gesamtleistung 394.000,00; Kosten 306.000,00; Betriebsergebnis GKV 88.000,00. UKV: Selbstkosten des Umsatzes 192.000,00 / 104.000,00; Ergebnis 60.000,00 / 28.000,00; Betriebsergebnis 88.000,00. Fehler: Minderung als Mehrung 104.000,00; ohne Bestandsveränderungen 78.000,00; UKV mit Produktionsmenge 78.000,00.

## Lektionen
| Lektion | Kern-Aha | Cliffhanger → |
|---|---|---|
| J2 Divisionskalkulation: Durch welche Menge teilen? | Herstellkosten ÷ Produktion, Verwaltung und Vertrieb ÷ Absatz; einstufig nur ohne Lagerveränderung; mehrstufig Stückkosten je Stufe kumulieren | J3: drei Dosengrößen auf Linie 3 |
| J5 Maschinenstundensatz: Was kostet eine Stunde Abfüllanlage? | Anlagenkosten nach Laufzeit verrechnen; Rest-FGK bleibt Zuschlag auf Löhne | J6: Zitruspresse liefert drei Produkte zugleich |
| J6 Kuppelkalkulation: Saft, Öl und Fasern aus einer Zitrone | keine verursachungsgerechte Verteilung; Verteilungsmethode ohne, Restwertmethode mit Hauptprodukt | J7: Hat die MBG im Mai verdient? |
| J7 Betriebsergebnis: Hat die MBG im Mai verdient? | GKV (Gesamtleistung − alle Kosten) und UKV (Umsatz − Selbstkosten des Absatzes) führen zum gleichen Ergebnis | K1: Winter, halbe Menge, gleiche Fixkosten – Kosten je Dose? |

Die Cliffhanger von J3 und J4 blieben unverändert (J3 führt bereits zu J4; J4 ist vom Auftraggeber festgelegt).

## Offene fachliche Fragen
1. `[ANNAHME – bitte prüfen]` **Mehrstufige Division, Einsatzverhältnis:** Der Generator setzt je Leistungseinheit genau eine Einheit der Vorstufe ein. Andere Einsatzverhältnisse (im Lehrbrief erwähnt) werden nicht erzeugt. Ausreichende Anfangsbestände in den Zwischenlagern werden unterstellt.
2. `[ANNAHME – bitte prüfen]` **Bewertung von Bestandsminderungen** (J2 zweistufig/mehrstufig, J7): mit den Herstellkosten der laufenden Periode, wie im Lehrbrief-Beispiel. Abweichende Vorperiodenwerte werden nicht abgefragt.
3. `[ANNAHME – bitte prüfen]` **Vorzeichen in Eingabefeldern:** Bestandsveränderungen werden als Mehrung positiv, Minderung negativ eingegeben (Feldbeschriftung sagt das).
4. `[ANNAHME – bitte prüfen]` **Maschinenstundensatz, Zinsen:** auf den halben Wiederbeschaffungswert, ohne Restwert (wie Lehrbrief und Einsendeaufgabe). Varianten mit Restwert (½ × (WBW + RW)) werden nicht erzeugt.
5. `[ANNAHME – bitte prüfen]` **Raumkosten:** Der Generator nennt immer ausdrücklich „je m² und Monat“ oder „je m² und Jahr“. Die Einsendeaufgabe lässt das offen; bei Monatsangabe wird × 12 gerechnet.
6. `[ANNAHME – bitte prüfen]` **Verteilungsmethode:** Verteilungsbasis sind nur Marktpreise (wie Lehrbrief-Beispiel). Andere Schlüssel- bzw. Äquivalenzziffern werden nicht erzeugt. Die Kosten je € Erlös werden im schrittweisen Pfad auf 2 Nachkommastellen gerundet (wie im Lehrbrief); der Generator wählt dafür glatte Sätze.
7. `[ANNAHME – bitte prüfen]` **J7 ohne aktivierte Eigenleistungen und ohne Halbfabrikate:** Der Lehrbrief nennt beide für das GKV; der Generator bildet nur Fertigerzeugnisse ab. Verwaltungs- und Vertriebskosten werden je Produktart vorgegeben und vollständig der abgesetzten Menge zugerechnet.
