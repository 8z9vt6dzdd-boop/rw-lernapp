# Lizenzen fremder und eigener Bestandteile

| Bestandteil | Herkunft | Lizenz | Ort im Projekt |
|---|---|---|---|
| Figuren-Bausteine (Köpfe, Gesichter, Frisuren, Brillen, Oberkörper) | Open Peeps von Pablo Stanley, https://www.openpeeps.com; Pfaddaten übernommen aus dem npm-Paket `react-peeps` (Code MIT, Emre Çakır) per `scripts/peeps-extract.mjs` (nur als Text gelesen) | **CC0 1.0** (Public Domain) für die Zeichnungen | `src/assets/peeps/parts.ts`, Lizenzhinweis `src/assets/peeps/LICENSE.md` |
| Figuren-Zusammenstellung, Farben, Ausdrücke | eigene Arbeit | wie das Projekt | `src/content/characters.ts` |
| Schauplätze, Diagramme, Icons | eigene Zeichnungen im Code (SVG) | wie das Projekt | `src/ui/visuals/`, `src/ui/components/ui.tsx` |
| Sound-Effekte | vollständig im Code erzeugt (Web Audio: Oszillatoren, gefiltertes Rauschen); keine Aufnahmen Dritter | wie das Projekt | `src/ui/sound.ts` |
| Bibliotheken (React, Vite, decimal.js, fraction.js, idb, ts-fsrs, Tailwind usw.) | npm | jeweils MIT bzw. Apache-2.0 laut Paket | `package.json` |

Studienunterlagen in `quellen/` sind urheberrechtlich geschützt, werden nur lokal gelesen und nie ins Repository übernommen.
