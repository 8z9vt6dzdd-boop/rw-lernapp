// Plagiatsprüfung (07-content-pipeline.md, Schritt 3): Vergleicht alle Inhalte der App mit dem lokalen
// Lehrbrief-Text und meldet Übereinstimmungen von mehr als 8 aufeinanderfolgenden Wörtern.
// Der Lehrbrief-Text liegt nur lokal in quellen/text/ (gitignored, aus den PDFs extrahiert).
// Aufruf: node scripts/check-overlap.ts [Datei oder Ordner …]   (Standard: src/content)
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const WORTE = 9; // mehr als 8 aufeinanderfolgende Wörter
const wurzel = new URL('..', import.meta.url).pathname;
const quellen = join(wurzel, 'quellen', 'text');

/** Feststehende Fachbegriffe und Gesetzesformeln, die wörtlich übereinstimmen dürfen. */
const ERLAUBT = [
  'grundsätze ordnungsmäßiger buchführung',
  'verbindlichkeiten aus lieferungen und leistungen',
  'forderungen aus lieferungen und leistungen',
];

function woerter(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/-\s*\n\s*/g, '') // Silbentrennung am Zeilenende
    .replace(/[^a-zäöüß0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean);
}

function dateien(pfad: string, endungen: string[]): string[] {
  if (!existsSync(pfad)) return [];
  if (statSync(pfad).isFile()) return [pfad];
  return readdirSync(pfad).flatMap((f) => dateien(join(pfad, f), endungen)).filter((f) => endungen.some((e) => f.endsWith(e)));
}

if (!existsSync(quellen)) {
  console.error('quellen/text fehlt – zuerst die Lehrbrief-Texte lokal extrahieren.');
  process.exit(2);
}

const index = new Map<string, string>();
for (const f of dateien(quellen, ['.txt'])) {
  const w = woerter(readFileSync(f, 'utf8'));
  for (let i = 0; i + WORTE <= w.length; i++) index.set(w.slice(i, i + WORTE).join(' '), f.split('/').pop()!);
}

const ziele = process.argv.slice(2);
const pruefen = (ziele.length ? ziele : [join(wurzel, 'src', 'content')]).flatMap((z) =>
  dateien(z, ['.ts', '.tsx', '.json', '.md']),
);

let treffer = 0;
for (const f of pruefen) {
  if (f.endsWith('.test.ts')) continue;
  // Nur Text in Anführungszeichen bzw. JSON-Strings prüfen (keine Programmlogik)
  const roh = readFileSync(f, 'utf8');
  const texte = [...roh.matchAll(/(['"`])((?:\\.|(?!\1).)*)\1/gs)].map((m) => m[2]!).join(' \n ');
  const w = woerter(texte);
  const gemeldet = new Set<number>();
  for (let i = 0; i + WORTE <= w.length; i++) {
    const g = w.slice(i, i + WORTE).join(' ');
    const q = index.get(g);
    if (!q || gemeldet.has(i - 1) || ERLAUBT.some((e) => g.includes(e) && g.split(' ').length - e.split(' ').length < 3)) continue;
    gemeldet.add(i);
    treffer++;
    console.log(`${relative(wurzel, f)}: „${g} …“ (${q})`);
  }
}
console.log(treffer === 0 ? 'Keine Überschneidung über 8 Wörter gefunden.' : `${treffer} Überschneidung(en) gefunden.`);
process.exit(treffer === 0 ? 0 : 1);
