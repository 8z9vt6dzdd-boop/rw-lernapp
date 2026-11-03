# 08 – Rahmenfirma: MBG, Paderborn (fiktive Lernversion)

Alle Sachverhalte, Fälle und Klausuren der App spielen in **einer** durchgehenden Firma: der MBG aus Paderborn. Die Person führt deren Buchhaltung und Kostenrechnung durch ein komplettes Geschäftsjahr.

## Wichtig: fiktive Lernversion
Die MBG Group ist ein reales Unternehmen (Getränke-Markenartikler, Sitz Paderborn). Die App nutzt nur den Namen und die Branche als Kulisse. **Alle Zahlen, Abläufe, Kunden, Lieferanten und Vorfälle sind frei erfunden** und lassen keine Rückschlüsse auf das reale Unternehmen zu.
- Im Footer und auf dem Firmen-Dashboard steht: „Lernszenario mit fiktiven Zahlen. Kein Bezug zu tatsächlichen Geschäftsdaten der MBG Group."
- Keine echten Markennamen, Logos oder Produktabbildungen. Produkte tragen erfundene Namen (siehe unten).
- Keine echten Personen. Kunden und Lieferanten sind erfunden; Orte aus der Region (Paderborn, Bielefeld, Detmold, Lippstadt, Bad Driburg, Warburg) sind erlaubt.
- Name in `src/config.ts` zentral änderbar, falls die Kulisse später gewechselt werden soll.

## Firmensteckbrief (Lernversion)
- **Name:** MBG Getränke OHG (Lernversion), Paderborn. Rechtsform im Szenario: Personengesellschaft (OHG), weil die Musterklausuren Buchungssätze „für eine Personengesellschaft" verlangen und Privatkonten vorkommen. Gesellschafter: Frank und Sabine Wessel (erfunden). Weitere feste Figuren: Jana Kröger (Buchhaltung), Tobias Hesse (Vertrieb), Dr. Leni Brandt (Controlling), siehe `09-lektionen.md`.
- **Geschäftsmodell im Szenario:** Herstellung und Abfüllung eigener Getränke im Werk Paderborn (Industriebetrieb nach IKR) plus Zukauf und Weiterverkauf von Handelswaren (zugekaufte Spirituosen und Weine).
- **Kunden:** Gastronomie, Getränkefachgroßhandel, Lebensmitteleinzelhandel, Tankstellen; Exportkunden in der EU (für innergemeinschaftliche Lieferung).
- **Standorte:** Verwaltung und Werk Paderborn, Logistikzentrum Paderborn.

## Produkte (erfundene Namen)
| Produkt | Art | Verwendung in der App |
|---|---|---|
| „Paderquell Energy" 0,25 l / 0,33 l / 0,5 l Dose | eigenes Erzeugnis | Äquivalenzziffern (Dosengrößen), Divisionskalkulation |
| „Senne Lemon" Limonade 0,33 l Glas | eigenes Erzeugnis | Zuschlagskalkulation, Deckungsbeitrag |
| „Almeblick Tequila-Bier" 0,33 l | eigenes Erzeugnis | Deckungsbeitrag, Engpass |
| „Liboriwein" Weißwein | Handelsware | Handelswaren, Wareneinsatz, Rohgewinn |
| „Domkreuz Vodka" | Handelsware | Handelswaren, Privatentnahme |

## Konten-Bezug im Szenario
| Konto | Konkreter Inhalt bei der MBG |
|---|---|
| Rohstoffe | Aromen (z. B. Zitrusaromen, Tequila-Aroma), Fruchtsaftkonzentrat; Zucker und Braumalz nur in der Kostenrechnung ohne Umsatzsteuer (beide unterliegen 7 % USt nach Anlage 2 UStG, deshalb nie in Aufgaben mit 19 % Vor- oder Umsatzsteuer) |
| Hilfsstoffe | Dosen, Flaschen, Etiketten, Verschlüsse |
| Betriebsstoffe | CO₂, Reinigungsmittel für die Abfüllanlage, Schmierstoffe |
| Vorprodukte/Fremdbauteile | zugekaufter Getränkegrundstoff |
| Unfertige Erzeugnisse | angesetzter Sirup und Bier in den Lagertanks |
| Fertige Erzeugnisse | abgefüllte, palettierte Ware im Logistikzentrum |
| Handelswaren | zugekaufter Wein und Vodka |
| TA und Maschinen | Abfüllanlage, Sirupanlage, Tanks |
| BGA / Fuhrpark | Büroausstattung, Gabelstapler, Auslieferungs-Lkw |
| Leihverpackung | Mehrweg-Paletten und Leihfässer der Lieferanten |

## Kostenstellen (KLR)
| Kostenstelle | Typ |
|---|---|
| Energie (Strom, Dampf, Druckluft) | Vorkostenstelle / Hilfskostenstelle |
| Instandhaltung (Werkstatt) | Vorkostenstelle / Hilfskostenstelle |
| Material (Wareneingang, Rohstofflager) | Hauptkostenstelle |
| Fertigung I: Sirup- und Braukeller | Hauptkostenstelle |
| Fertigung II: Abfüllung | Hauptkostenstelle (Maschinenstundensatz der Abfüllanlage) |
| Verwaltung | Hauptkostenstelle |
| Vertrieb (Außendienst Gastro, Logistik) | Hauptkostenstelle |

## Geschäftsjahr als Rahmenhandlung
Jeder Abschnitt des Lernpfads ist ein Kapitel im Geschäftsjahr der MBG:
| Abschnitt | Kapitel im Szenario |
|---|---|
| A Fundament | 1. Januar: Eröffnungsbilanz der MBG, erste Buchungen |
| B Umsatzsteuer | Januar: erste Umsatzsteuer-Voranmeldung |
| C Beschaffung | Februar–März: Rohstoffeinkauf für die Sommersaison (Aromen, Dosen, Leihpaletten, Skonto) |
| D Absatz und Privat | April–Juni: Saisonstart Gastronomie, Mängelrügen bei beschädigten Dosen, Boni an Großhändler, Privatentnahmen der Gesellschafter |
| E Anlagen und Bestände | Juli: neue Abfülllinie, Abschreibungen, Bestände im Tanklager |
| F Jahresabschluss | Dezember: Insolvenz eines Gastronomen (Einzelwertberichtigung), Rückstellung für einen Rechtsstreit, vorausbezahlte Messestandmiete (ARAP), Inventur |
| G–H KLR-Grundlagen, Kostenarten | Januar Folgejahr: Controlling baut die Kostenrechnung auf (Abgrenzung, kalkulatorische Kosten der Abfüllanlage) |
| I Kostenstellen | BAB der MBG mit Leistungsverrechnung Energie/Instandhaltung |
| J Kostenträger | Kalkulation der Dosengrößen (Äquivalenzziffern), Angebot an eine Hotelkette (Zuschlagskalkulation), Maschinenstundensatz Abfüllanlage |
| K Teilkosten | Sortimentsentscheidungen: Lohnt die neue Sorte? Eigenmarke für einen Discounter annehmen? Engpass Abfüllanlage im Sommer? Selbst abfüllen oder Lohnabfüller? |

## Firmen-Dashboard
Zeigt Bilanz und GuV der MBG (Lernversion), die mit jedem abgeschlossenen Abschnitt fortgeschrieben werden, plus eine Zeitleiste „Geschäftsjahr" mit erledigten Kapiteln.
