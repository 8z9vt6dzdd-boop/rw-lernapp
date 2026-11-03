# 02 – Curriculum und Lernpfad

Quelle der Themen: Inhaltsverzeichnisse der drei PFH-Lehrbriefe (lokal in `quellen/`). Die Reihenfolge folgt der Klausurlogik, nicht der Lehrbrief-Reihenfolge. Version 1 deckt **alle** Lehrbrief-Themen (Vollkostenrechnung) sowie die Teilkostenrechnung aus den Lehrbuch-Übungen ab, Theorie überwiegend als Karten und Kurzantworten. Alle Sachverhalte spielen bei der Rahmenfirma MBG Paderborn (siehe `08-firma-mbg.md`).

**Klausurrelevanz** (steuert Wiederholungshäufigkeit, Readiness-Gewichtung und Probeklausur-Zusammenstellung):
- `hoch` = in mehreren Musterklausuren mit 10+ Punkten
- `mittel` = in Einsendeaufgaben/Übungen regelmäßig, in Musterklausuren selten
- `niedrig` = nur im Lehrbrief, in keiner Musterklausur gesehen

Die Einstufung ist eine **Annahme** aus vier Musterklausuren und zwei Einsendeaufgaben. Sie muss in `src/content/curriculum.ts` leicht änderbar sein.

Abkürzungen Lehrbrief: BA = Buchführung und Abschluss, K1 = KLR I, K2 = KLR II.

## Abschnitt 0 – Grundverständnis (vor A, ohne Vorwissen)
Reine Lektionen ohne Formeln (Details und Kern-Aha je Lektion: `09-lektionen.md`, Abschnitt 3). Relevanz: Voraussetzung.
| Skill-ID | Lektion | Lehrbrief | Art |
|---|---|---|---|
| 0.1-wozu | Erster Tag bei der MBG: Wozu das alles? | BA 2.1 | Lektion |
| 0.2-inventur | Inventur: Die MBG zählt alles | BA 2.2 | Lektion |
| 0.3-bilanz | Die Bilanz: das Foto am 31.12. | BA 2.3 | Lektion |
| 0.4-guv | Vom Foto zum Film: Gewinn und Verlust | BA 2.3 | Lektion |
| 0.5-doppik | Warum doppelt? Jede Sache hat zwei Seiten | BA 2.3.1 | Lektion |
| 0.6-konto | Das Konto: ein Notizzettel mit zwei Spalten | BA 2.3.2 | Lektion |
| 0.7-zwei-brillen | Zwei Brillen: Buchhaltung und Kostenrechnung | BA 2.1, K1 1 | Lektion |

## Abschnitt A – Fundament (BA Kap. 1–2)
| Skill-ID | Inhalt | Lehrbrief | Relevanz | Art |
|---|---|---|---|---|
| A1-rw-aufbau | Aufgaben und Teilbereiche des Rechnungswesens, Adressaten | BA 2.1 | niedrig | Theorie |
| A2-gob | Gesetzliche Grundlagen, Buchführungspflicht, GoB | BA 2.2 | niedrig | Theorie |
| A3-kontenarten | Aktiv-, Passiv-, Aufwands-, Ertragskonten zuordnen | BA 2.3 | hoch (Voraussetzung) | Generator |
| A4-bilanzveraenderung | Aktivtausch, Passivtausch, Aktiv-Passiv-Mehrung/-Minderung | BA 2.3.1 | mittel | Generator |
| A5-buchungssatz-basis | Einfache Buchungssätze ohne USt | BA 2.3.5 | hoch (Voraussetzung) | Generator |
| A6-eroeffnung-abschluss | EBK, SBK, Abschluss Bestandskonten, Abschluss Erfolgskonten über GuV, GuV an Eigenkapital | BA 2.3.2–2.3.3 | hoch | Generator + Fall |
| A7-ek-vergleich | Erfolgsermittlung durch Eigenkapitalvergleich inkl. Privatentnahmen/-einlagen | BA 2.3.4 | mittel | Generator |

## Abschnitt B – Umsatzsteuer (BA 3.3)
| Skill-ID | Inhalt | Relevanz | Art |
|---|---|---|---|
| B1-ust-rechnen | Brutto/Netto/Steuer berechnen | hoch | Generator |
| B2-ust-buchen | Ein- und Verkauf mit Vor- und Umsatzsteuer | hoch | Generator |
| B3-ust-abschluss | Zahllast vs. Vorsteuerüberhang, Abschlussbuchungen, Überweisung Zahllast | hoch | Generator |

## Abschnitt C – Beschaffung (BA 3.1)
| Skill-ID | Inhalt | Relevanz | Art |
|---|---|---|---|
| C1-bestand-vs-aufwand | Bestandsorientierte vs. aufwandsorientierte Erfassung, Verbrauchsbuchung | hoch | Generator |
| C2-bezugskosten | Bezugskosten auf Unterkonten, Umbuchung, Aufteilung nach Gewicht/Wert | hoch | Generator |
| C3-ruecksendung-einkauf | Rücksendungen an Lieferer, Stornobuchung | hoch | Generator |
| C4-nachlaesse-einkauf | Preisnachlass, Mängelrüge, Bonus vom Lieferer | hoch | Generator |
| C5-skonto-einkauf | Skonto Netto- und Bruttomethode inkl. Vorsteuerkorrektur | hoch | Generator |
| C6-leihverpackung | Leihverpackung berechnet und gutgeschrieben | mittel | Generator |
| C7-bezugskalkulation | Listeneinkaufspreis bis Bezugspreis | mittel | Generator |
| C8-handelswaren | Handelswaren, Wareneinsatz, Rohgewinn | mittel | Generator |

## Abschnitt D – Absatz und Privat (BA 3.2)
| Skill-ID | Inhalt | Relevanz | Art |
|---|---|---|---|
| D1-verkauf | Verkauf eigener Erzeugnisse mit USt, Nebenkosten (Verpackung, Fracht) in Rechnung | hoch | Generator |
| D2-ruecksendung-verkauf | Rücksendungen von Kunden | hoch | Generator |
| D3-erloesberichtigung | Gutschrift wegen Mängelrüge, Bonus an Kunden | hoch | Generator |
| D4-skonto-verkauf | Kundenskonto Netto- und Bruttomethode inkl. USt-Korrektur | hoch | Generator |
| D5-ausgangsfrachten | Vertriebskosten (Ausgangsfrachten) | mittel | Generator |
| D6-privat | Privatentnahmen Geld/Gegenstände/Leistungen (mit USt), Privateinlagen, Abschluss Privatkonto | hoch | Generator |

## Abschnitt E – Anlagen und Bestände (BA 3.4, BA 2.3)
| Skill-ID | Inhalt | Relevanz | Art |
|---|---|---|---|
| E1-anlagenkauf | Kauf von Anlagegütern, Anschaffungsnebenkosten, Skonto mindert Anschaffungskosten | hoch | Generator |
| E2-eigenleistung-aib | Aktivierte Eigenleistungen, Anlagen im Bau, Anzahlungen | niedrig | Theorie + Generator |
| E3-bilanz-afa | Bilanzielle Abschreibung linear/degressiv, Buchung, Buchwert | hoch | Generator |
| E4-bestandsveraenderung | Bestandsveränderungen unfertige/fertige Erzeugnisse, Wirkung auf Erfolg | hoch | Generator |
| E5-geschaeftsgang | Kompletter Geschäftsgang: AB, laufende Buchungen, vorbereitende Abschlussbuchungen, GuV, SBK | hoch | Fall |

## Abschnitt F – Jahresabschluss (BA Kap. 4–8)
| Skill-ID | Inhalt | Relevanz | Art |
|---|---|---|---|
| F1-bilanztheorien | Statische und dynamische Bilanztheorie | niedrig | Theorie |
| F2-hgb-grundlagen | Drittes Buch HGB, Aufbau, Adressaten | niedrig | Theorie |
| F3-wertmassstaebe | Anschaffungs-/Herstellungskosten, beizulegender Wert, Niederstwertprinzip, Vorsichtsprinzip | mittel | Theorie + Generator |
| F4-ansatz | Bilanzierungspflicht, -verbote, -wahlrechte, Bilanzierungszeitpunkt | niedrig | Theorie |
| F5-bewertung-uv | Bewertung Umlaufvermögen (Vorräte, Verbrauchsfolge) | mittel | Theorie + Generator |
| F6-forderungsbewertung | Zweifelhafte Forderungen, Einzel- und Pauschalwertberichtigung, Ausfall mit USt-Korrektur, Eingang abgeschriebener Forderungen | hoch | Generator |
| F7-rap | Aktive und passive Rechnungsabgrenzung, sonstige Forderungen/Verbindlichkeiten | hoch | Generator |
| F8-rueckstellungen | Rückstellungen bilden, auflösen, in Anspruch nehmen | hoch | Generator |
| F9-guv-aufbau | Aufbau der GuV nach HGB, Ergebnisgrößen | niedrig | Theorie |
| F10-ifrs | Grundzüge und Grundprinzipien der IFRS, Unterschiede zum HGB | niedrig | Theorie |

## Abschnitt G – KLR-Grundlagen (K1 Kap. 1)
| Skill-ID | Inhalt | Relevanz | Art |
|---|---|---|---|
| G1-grundbegriffe | Auszahlung/Ausgabe/Aufwand/Kosten, Einzahlung/Einnahme/Ertrag/Leistung | hoch | Generator (Zuordnung) + Theorie |
| G2-abgrenzung | Neutraler Aufwand (betriebsfremd, periodenfremd, außerordentlich), Grundkosten, Anders- und Zusatzkosten | hoch | Generator (Zuordnung) |
| G3-kostenbegriff | Pagatorischer vs. wertmäßiger Kostenbegriff | niedrig | Theorie |
| G4-fix-variabel | Fixe/variable Kosten, Kostenfunktion, Stückkosten bei Beschäftigungsänderung | mittel | Generator |
| G5-einzel-gemein | Einzel-/Gemeinkosten, unechte Gemeinkosten | hoch | Generator (Zuordnung) + Theorie |
| G6-prinzipien | Verursachungs-, Durchschnitts-, Tragfähigkeitsprinzip; Systematik der Kostenrechnung | niedrig | Theorie |

## Abschnitt H – Kostenartenrechnung (K1 Kap. 2)
| Skill-ID | Inhalt | Relevanz | Art |
|---|---|---|---|
| H1-materialmengen | Erfassung der Verbrauchsmengen (Inventur-, Skontrations-, Rückrechnungsmethode) | mittel | Generator |
| H2-materialbewertung | Periodische/permanente Durchschnittsbewertung, FIFO, LIFO | hoch | Generator |
| H3-arbeitskosten | Löhne, Gehälter, Sozialkosten | niedrig | Theorie |
| H4-kalk-afa | Kalkulatorische Abschreibung linear, arithmetisch-degressiv, leistungsbezogen, Fehleinschätzung der Nutzungsdauer | hoch | Generator |
| H5-kalk-zinsen | Kalkulatorische Zinsen auf betriebsnotwendiges Kapital | mittel | Generator |
| H6-wagnisse | Kalkulatorische Wagnisse, Unternehmerlohn, Miete | mittel | Generator + Theorie |
| H7-sonstige-kostenarten | Buchung kalkulatorischer Kosten, Fremdleistungen, Abgaben | niedrig | Theorie |

## Abschnitt I – Kostenstellenrechnung (K2 Kap. 1)
| Skill-ID | Inhalt | Relevanz | Art |
|---|---|---|---|
| I1-kostenstellenbildung | Grundsätze, Einteilungskriterien, Haupt-/Hilfskostenstellen | niedrig | Theorie |
| I2-bab-verteilung | Primäre Gemeinkosten nach Schlüsseln verteilen | hoch | Generator |
| I3-anbau | Anbauverfahren | mittel | Generator |
| I4-stufenleiter | Stufenleiterverfahren inkl. Reihenfolgebestimmung | hoch | Generator |
| I5-simultan | Simultanverfahren (Gleichungssystem aufstellen und lösen) | hoch | Generator |
| I6-zuschlagssaetze | Ist-Zuschlagssätze, Normalzuschläge, Über-/Unterdeckung | mittel | Generator |

## Abschnitt J – Kostenträgerrechnung (K2 Kap. 2)
| Skill-ID | Inhalt | Relevanz | Art |
|---|---|---|---|
| J1-ktr-grundlagen | Stück- vs. Zeitrechnung, Kalkulationsverfahren je Fertigungsart | mittel | Theorie + „Verfahren wählen" |
| J2-division | Ein-, zwei-, mehrstufige Divisionskalkulation | mittel | Generator |
| J3-aequivalenz | Ein- und mehrstufige Äquivalenzziffernkalkulation | hoch | Generator |
| J4-zuschlag | Summarische und differenzierende Zuschlagskalkulation | hoch | Generator |
| J5-maschinensatz | Maschinenstundensatz, Bezugsgrößenkalkulation | mittel | Generator |
| J6-kuppel | Kuppelproduktkalkulation (Verteilungs- und Restwertmethode) | niedrig | Generator |
| J7-gkv-ukv | Kostenträgerzeitrechnung: Gesamtkosten- und Umsatzkostenverfahren | mittel | Generator |

## Abschnitt K – Teilkostenrechnung (Lehrbuch-Übungen, nicht im Lehrbrief)
Quelle: Lehrbuch-Übungen (Schmolke/Deitermann, Kapitel Teilkosten- und Plankostenrechnung), lokal in `quellen/`. In keinem der drei Lehrbrief-Inhaltsverzeichnisse enthalten; Klausurrelevanz daher unsicher.

| Skill-ID | Inhalt | Relevanz | Art |
|---|---|---|---|
| K1-kostenverlauf | Kostenfunktion K(x) = k_v · x + K_f, Stückkosten bei Beschäftigungsänderung, Beschäftigungsgrad, Fixkostendegression | mittel | Generator |
| K2-db-einstufig | Stückdeckungsbeitrag, Deckungsbeitrag gesamt, Betriebsergebnis | mittel | Generator |
| K3-break-even | Gewinnschwelle (Menge und Umsatz), kritische Menge zweier Verfahren | mittel | Generator |
| K4-db-mehrstufig | Mehrstufige Deckungsbeitragsrechnung (erzeugnisfixe, gruppenfixe, unternehmensfixe Kosten), Sortimentsbereinigung | mittel | Generator |
| K5-preisuntergrenze | Kurz- und langfristige Preisuntergrenze, Zusatzauftrag annehmen/ablehnen | mittel | Generator |
| K6-engpass | Relativer Deckungsbeitrag je Engpasseinheit, optimales Produktionsprogramm | mittel | Generator |
| K7-make-or-buy | Eigenfertigung vs. Fremdbezug auf Basis variabler Kosten, kritische Menge | mittel | Generator |
| K8-voll-vs-teil | Vergleich Voll- und Teilkostenrechnung, Grenzen der Vollkostenrechnung, Fehlentscheidungen durch Fixkostenschlüsselung | mittel | Theorie + „Aufgabe erkennen" |
| K9-plankosten | Grundzüge flexible Plankostenrechnung: Plankostenverrechnungssatz, Sollkosten, verrechnete Plankosten, Abweichungen | niedrig | Generator + Theorie |

## Probeklausur-Verteilung (aus den Musterklausuren abgeleitet)
Belege: Die gemischte Musterklausur „Buchführung + KLR" hat 90 Punkte (Aufgaben mit 20/10/10 Punkten Buchführung, 30/20 Punkten KLR). Die KLR-Probeklausuren I und II haben je 30 Punkte, die Buchführungs-Musterklausur 60 Punkte. Überall gilt 1 Punkt = 1 Minute. Eine ausdrückliche Angabe zu Dauer und Punktzahl der gemeinsamen Klausur steht in den Unterlagen nicht; abgeleitet wird daher **90 Punkte in 90 Minuten** (konfigurierbar).

Zusammenstellung einer Probeklausur (90 Punkte):
- **Buchführung/Abschluss, ca. 40 Punkte:** eine Buchungssatz-Serie (18–20 P., gemischt aus B–E), eine Abschlussaufgabe (USt-Abschluss oder Bestandsveränderungen mit Erfolgsermittlung, 10 P.), eine Jahresabschluss- oder Kontenabschluss-Aufgabe (F6–F8 bzw. E5, 10–15 P.)
- **KLR, ca. 50 Punkte:** eine Leistungsverrechnungs-Aufgabe (Stufenleiter oder Simultan, 15–30 P.), eine BAB- oder Kalkulationsaufgabe (15–20 P.), eine Begriffs- oder Abschreibungsaufgabe (6 P.)
- **Teilkosten:** standardmäßig 0 Punkte. In den Einstellungen zuschaltbar („Teilkosten in Probeklausuren"); dann ersetzt eine K-Aufgabe (10–15 P.) die BAB- oder Kalkulationsaufgabe.

## Freischaltung
Abschnitt 0 und die Abschnitte A–B sind Voraussetzung für alles. Solange Abschnitte noch nicht vollständig mit Lektionen ausgestattet sind (bis M2c/M7), ist die Reihenfolge eine Empfehlung: Ein späterer Abschnitt lässt sich nach einem Hinweis trotzdem öffnen. Je Skill: Lektion → Übung (geblockt) → Wiederholung (gemischt); die Übung wird nach der Lektion oder dem bestandenen Überspringen-Test frei, bei Skills ohne Lektion sofort. Danach kann die Person frei zwischen C–F (Buchführung) und G–K (KLR) wechseln. Abschnitt K setzt G4 (fixe/variable Kosten) voraus. Innerhalb eines Abschnitts wird der Lernpfad empfohlen, aber nicht erzwungen.
