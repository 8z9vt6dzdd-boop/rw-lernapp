// Übernimmt ausgewählte Open-Peeps-Bausteine (Zeichnungen CC0, Pablo Stanley) als reine Pfaddaten.
// Die Quelldateien werden nur als Text gelesen, nicht ausgeführt.
//   node scripts/peeps-extract.mjs <ordner-mit-peeps-js> src/assets/peeps/parts.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [src, out] = process.argv.slice(2);
if (!src || !out) throw new Error('Aufruf: node scripts/peeps-extract.mjs <quelle> <ziel>');

const AUSWAHL = {
  pose: [
    'bust/Explaining',
    'bust/PointingUp',
    'bust/Coffee',
    'bust/Device',
    'bust/Paper',
    'bust/ArmsCrossed',
    'bust/Geek',
    'bust/Turtleneck',
    'bust/Sweater',
    'bust/ButtonShirt',
    'bust/BlazerBlackTee',
    'bust/Thunder',
    'bust/Whatever',
    'bust/PocketShirt',
    'bust/Hoodie',
    'bust/PoloSweater',
  ],
  face: [
    'Calm',
    'Explaining',
    'Smile',
    'SmileBig',
    'Concerned',
    'Suspicious',
    'Awe',
    'SmileLol',
    'LoveGrin',
    'ConcernedFear',
    'Driven',
    'Cheeky',
  ],
  hair: [
    'Bun',
    'MediumBangs',
    'ShortMessy',
    'Long',
    'GrayShort',
    'GrayBun',
    'Medium',
    'ShortCurly',
    'Afro',
    'Bangs',
    'ShortWavy',
    'FlatTop',
    'LongCurly',
    'Pomp',
  ],
  facialHair: ['Chin', 'MoustacheThin', 'GoateeCircle'],
  accessories: ['GlassRound', 'GlassClubmaster', 'GlassButterflyOutline'],
};

function parseFile(text) {
  const gMatch = text.match(/createElement\("g", (null|\{ transform: '([^']*)' \})/);
  const transform = gMatch?.[2] ?? null;
  const paths = [];
  const re = /createElement\("path", \{([^}]*)\}\)/g;
  let m;
  while ((m = re.exec(text))) {
    const body = m[1];
    const d = body.match(/d: '([^']*)'/)?.[1];
    if (!d) continue;
    const t = body.match(/transform: '([^']*)'/)?.[1] ?? null;
    const fillRaw = body.match(/fill: ([^,]+?)(?:,|$)/)?.[1]?.trim() ?? '';
    const fill = fillRaw.startsWith('backgroundColor')
      ? 'bg'
      : fillRaw.startsWith('strokeColor')
        ? 'stroke'
        : fillRaw.replace(/'/g, '');
    const evenodd = /fillRule: 'evenodd'/.test(body);
    paths.push({ d, t, fill, evenodd });
  }
  if (paths.length === 0) throw new Error('Keine Pfade gefunden');
  return { transform, paths };
}

const parts = {};
for (const [gruppe, namen] of Object.entries(AUSWAHL)) {
  for (const name of namen) {
    const file = join(src, gruppe, `${name}.js`);
    const key = `${gruppe}/${name.split('/').pop()}`;
    parts[key] = parseFile(readFileSync(file, 'utf8'));
  }
}

const header = `// Automatisch erzeugt mit scripts/peeps-extract.mjs – nicht von Hand bearbeiten.
// Open Peeps von Pablo Stanley (https://www.openpeeps.com), Lizenz CC0. Siehe LICENSE.md.
/* eslint-disable */
export interface PeepPath { d: string; t: string | null; fill: string; evenodd: boolean }
export interface PeepPart { transform: string | null; paths: PeepPath[] }
`;
writeFileSync(
  out,
  header + `export const PARTS: Record<string, PeepPart> = ${JSON.stringify(parts)};\n`,
);
console.log(`${Object.keys(parts).length} Bausteine geschrieben`);
