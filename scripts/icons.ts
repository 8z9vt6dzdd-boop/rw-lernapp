// Erzeugt die PNG-Icons aus den SVG-Vorlagen in public/ (einmalig bzw. nach Änderung ausführen):
//   node --experimental-strip-types scripts/icons.ts
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const pub = join(import.meta.dirname, '..', 'public');
const ziele: { svg: string; out: string; size: number }[] = [
  { svg: 'favicon.svg', out: 'icon-192.png', size: 192 },
  { svg: 'favicon.svg', out: 'icon-512.png', size: 512 },
  { svg: 'icon-maskable.svg', out: 'icon-maskable-512.png', size: 512 },
  { svg: 'icon-maskable.svg', out: 'apple-touch-icon.png', size: 180 },
];

const browser = await chromium.launch();
for (const z of ziele) {
  const page = await browser.newPage({ viewport: { width: z.size, height: z.size } });
  const svg = readFileSync(join(pub, z.svg), 'utf8');
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${z.size}" height="${z.size}" `)}</body></html>`,
  );
  writeFileSync(
    join(pub, z.out),
    await page.screenshot({
      omitBackground: true,
      clip: { x: 0, y: 0, width: z.size, height: z.size },
    }),
  );
  await page.close();
}
await browser.close();
console.log('Icons erzeugt');
