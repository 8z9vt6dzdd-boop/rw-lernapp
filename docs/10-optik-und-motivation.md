# 10 – Optik und Motivation

Dieses Dokument ersetzt die bisherigen Regeln „Clean und erwachsen, kein Maskottchen, kein Konfetti" (CLAUDE.md) und „Wochenziel statt Tagesstreak, XP sparsam" (`01-didaktik.md`). Die App soll Spaß machen, zum Wiederkommen einladen und trotzdem erwachsen bleiben.

## Teil A – Optik

### A1. Zeichenstil: handgezeichnet auf Basis von Open Peeps
- Grundlage ist **Open Peeps** von Pablo Stanley, eine handgezeichnete Figuren-Bibliothek unter **CC0-Lizenz** (frei nutzbar, auch kommerziell, ohne Namensnennung). Webseite: openpeeps.com.
- Für Köpfe und Gesichter gibt es das npm-Paket `@dicebear/open-peeps` (Code MIT, Design CC0). Für ganze Figuren mit Körperhaltungen wird das Original-Paket mit SVG-Bausteinen gebraucht (Download über openpeeps.com, Preis 0 €).
- **Wenn du das Original-Paket nicht selbst laden kannst:** Melde dich in einfachen Worten beim Auftraggeber. Er lädt es herunter und legt den entpackten Ordner unter `quellen/open-peeps/` ab. Verwende danach nur die benötigten SVG-Bausteine und lege sie unter `src/assets/peeps/` ab (CC0 erlaubt das; Lizenzhinweis in `src/assets/peeps/LICENSE.md`).
- **Einfärben:** Open Peeps ist Strichzeichnung. Kleidung und Haare bekommen flächige Farben aus der MBG-Palette (siehe A4), die Striche bleiben handgezeichnet. So entsteht ein warmer, leicht verspielter Look, nicht kindlich.

### A2. Die Figuren (fest definiert, immer gleich aussehend)
Jede Figur ist eine feste Kombination aus Open-Peeps-Bausteinen (Kopf, Frisur, Gesicht, Körper, Accessoire) und Farben, gespeichert in `src/content/characters.ts`.
| Figur | Rolle | Erkennungsmerkmal |
|---|---|---|
| Jana Kröger | Buchhaltung, Mentorin | Brille, Blazer in Petrol, oft mit Ordner oder Stift |
| Tobias Hesse | Vertrieb | Hemd mit hochgekrempelten Ärmeln, Handy in der Hand, immer gut gelaunt |
| Dr. Leni Brandt | Controlling | Pullover in Senfgelb, Laptop oder Taschenrechner, nachdenklicher Blick |
| Frank Wessel | Gesellschafter | Sakko, Kaffeebecher |
| Sabine Wessel | Gesellschafterin | Strickjacke, Tablet |
| Die lernende Person | Hauptfigur | wird beim Onboarding aus wenigen Optionen selbst gestaltet (Frisur, Farbe, Accessoire); erscheint z. B. auf der Startseite und in Abschlussszenen |

**Ausdrücke je Figur (mindestens 6):** neutral, erklärt (zeigt), freut sich, grübelt, überrascht/entsetzt, feiert. Ausdruck und Haltung werden pro Sprechblase im Lektionsdatensatz gewählt.

### A3. Bewegung und Animation
- Figuren erscheinen mit kurzer Einblend- und Wipp-Bewegung; beim Sprechen leichtes Nicken; Wechsel des Gesichtsausdrucks als weicher Übergang.
- Fachliche Animationen: Beträge wandern ins T-Konto, Waage kippt und pendelt sich ein, Tanks füllen sich.
- Belohnungsmomente: Lektion geschafft → Figur jubelt, kurzes Konfetti; Kapitel geschafft → Abschlussszene am Schauplatz mit allen beteiligten Figuren.
- Technik: CSS-Animationen bzw. eine schlanke Animationsbibliothek; alle Bewegungen kurz (unter 1 Sekunde, Szenen bis 3 Sekunden) und überspringbar. Einstellung „Bewegung reduzieren" wird respektiert (Systemeinstellung + Schalter in der App).

### A4. Schauplätze und Farbwelt
- Gezeichnete Schauplätze im selben Strichstil: Büro Rechnungswesen, Lager/Logistikzentrum, Abfüllanlage, Besprechungsraum, Büro der Gesellschafter. Einfach gehalten, als Hintergrund für Dialoge und Abschlussszenen.
- Farbwelt: frisch und getränkig (z. B. Petrol, Limettengrün, Orange, Senfgelb) auf hellem, papierartigem Grund; im Dunkelmodus angepasst. Kein MBG-Logo, keine echten Marken.
- Typografie: gut lesbare Sans-Schrift für Inhalte, optional eine handschriftliche Akzentschrift nur für Überschriften und Sprechblasen-Namen.

### A5. Austauschbarkeit
Figuren, Ausdrücke und Schauplätze sind als Komponenten mit festen Namen aufgebaut (z. B. `<Character id="jana" expression="erklaert" />`). So kann später ein Illustrator den Stil professionell neu zeichnen, ohne dass Lektionen geändert werden müssen.

## Teil B – Motivation und Anreize

### B1. Leitplanken (gelten für alles Folgende)
Motivierend ja, manipulativ nein: keine Leben/Herzen, keine Schuldgefühle-Texte („Du hast uns enttäuscht"), keine künstliche Verknappung, keine Ranglisten. Höchstens eine Erinnerung pro Tag. Alles Verpasste ist reparierbar.

### B2. Tagesserie mit Serienschutz
- **Tagesziel** (Standard): eine Lektion ODER 5 Minuten Lernzeit ODER 10 Wiederholungskarten. In den Einstellungen wählbar (leicht/normal/intensiv).
- **Serie** zählt Tage mit erreichtem Tagesziel, sichtbar auf der Startseite (gezeichnete Flamme oder Getränkedose, die sich füllt).
- **Serienschutz:** Für jede 7-Tage-Serie gibt es einen Schutz (max. 2 gespeichert). Ein verpasster Tag verbraucht automatisch einen Schutz.
- **Reparatur:** Ohne Schutz kann eine gerissene Serie innerhalb von 48 Stunden repariert werden, indem man an einem Tag das doppelte Tagesziel schafft.
- Meilensteine 7, 30, 50, 100 Tage mit kleiner Szene (z. B. Jana bringt Kuchen).

### B3. Karriere bei der MBG (Hauptmotivation über die Geschichte)
Der Fortschritt im Lernpfad ist eine Karriere mit Beförderungen. Jede Beförderung = kurze Szene mit den Gesellschaftern, neuer Titel im Profil, neuer Schauplatz oder neues Büro-Detail.
| Stufe | Titel | erreicht nach |
|---|---|---|
| 1 | Neu im Team | Start |
| 2 | Assistenz Buchhaltung | Abschnitte 0, A, B |
| 3 | Sachbearbeitung Kreditoren und Debitoren | Abschnitte C, D |
| 4 | Bilanzbuchhaltung | Abschnitte E, F |
| 5 | Controlling | Abschnitte G bis J |
| 6 | Leitung Rechnungswesen | Abschnitt K und eine bestandene Probeklausur |

### B4. Cliffhanger und Geschichte
Jede Lektion endet mit einem Ausblick auf die nächste Situation (`09-lektionen.md`, 4.8). Die Startseite zeigt „Was heute bei der MBG passiert" mit der nächsten offenen Lektion als Szene (Figur + ein Satz), nicht als nüchterne Liste.

### B5. Tagesaufgaben, XP und Stufen
- **Drei Tagesaufgaben** pro Tag, z. B. „Schließe eine Lektion ab", „Löse 3 Aufgaben ohne Hilfe", „Wiederhole 5 Karten". Alle drei geschafft → kleine Belohnung (Bonus-XP, Szene).
- **XP** für Lektionen, Übungen, Wiederholungen, Tagesaufgaben; nie Abzug. **Stufen** über XP getrennt von der Karriere (Karriere = Inhalt, Stufe = Fleiß).
- **Wochenrückblick** jeden Montag: Was hast du letzte Woche geschafft, Lernzeit, stärkstes Thema, Thema für diese Woche (von Jana präsentiert).

### B6. Erfolge
Rund 25 Erfolge mit eigener kleiner Illustration, z. B. „Erste Bilanz aufgestellt", „Skonto-Profi", „Simultanverfahren geknackt", „7 Tage am Stück", „Fehlerjäger" (10 Fehler in Fehlerjagd-Aufgaben gefunden), „Ohne Netz" (offline gelernt). Erfolgs-Sammlung in einer eigenen Ansicht.

### B7. Klausur-Fortschritt
Auf der Startseite die Klausur-Readiness in Prozent (gewichtet nach Klausurrelevanz). Optional ein Klausurdatum; dann zusätzlich „Noch X Tage" und eine Empfehlung, welches Thema heute am meisten bringt. Kein Druck-Countdown in Rot.

### B8. Push-Erinnerungen (iPhone und Laptop)
- **Funktionsweise:** Web Push über den bestehenden Cloudflare Worker (Cron-Trigger + VAPID-Schlüssel). Auf dem iPhone funktioniert das nur, wenn die App über den Home-Bildschirm installiert ist (iOS 16.4 oder neuer). Die App erklärt das bei Bedarf selbst.
- **Erlaubnis:** nicht beim ersten Start abfragen, sondern nach der ersten abgeschlossenen Lektion mit einer freundlichen Erklärung („Soll Jana dich täglich kurz erinnern?").
- **Regeln:** maximal einmal täglich; Uhrzeit in den Einstellungen wählbar (Standard 19:00 Uhr); nur wenn das Tagesziel noch offen ist; Nachtruhe 21:30–8:00 Uhr wird nie verletzt; jederzeit abschaltbar.
- **Ton:** im Stil der Figuren, abwechselnd, freundlich, nie vorwurfsvoll. Beispiele: „Jana: Die Umsatzsteuer wartet nicht. 5 Minuten?", „Tobias: Ich hab da einem Kunden was versprochen … Kannst du kurz helfen?", „Leni: Eine Kalkulation, dann ist Feierabend. Deal?", „Deine Serie steht bei 12 Tagen. Der Serienschutz ist noch voll."
- Push-Abos werden pro Gerät gespeichert (nur Push-Endpunkt und Uhrzeit, keine persönlichen Daten).

## Teil C – Abnahme
- Alle Figuren sind sichtbar gezeichnet, im einheitlichen handgezeichneten Stil, mit mindestens 6 Ausdrücken, und treten in den Pilotlektionen auf.
- Startseite zeigt Serie, Tagesaufgaben, Karrierestufe, nächste Szene und Klausur-Readiness.
- Belohnungsszenen nach Lektion und Kapitel funktionieren; „Bewegung reduzieren" schaltet sie ruhig.
- Serie, Serienschutz und Reparatur funktionieren über Datumswechsel (simuliert getestet).
- Push: Auf einem iPhone mit installierter App kommt zur eingestellten Uhrzeit genau eine Erinnerung, aber nur, wenn das Tagesziel offen ist.
