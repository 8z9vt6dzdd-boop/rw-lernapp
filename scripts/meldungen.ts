// Liest alle gemeldeten Inhalte („Fehler melden“) aus der Abgleich-Datenbank und gibt sie als Liste aus.
// Aufruf: node scripts/meldungen.ts   (vorher einmal `npx wrangler login` im Ordner sync-worker)
import { execFileSync } from 'node:child_process';

interface Meldung {
  ts: string;
  elementId: string;
  skillId?: string;
  seed?: number;
  variant?: string;
  kommentar?: string;
  zurueckgezogen?: boolean;
}

const sql =
  "SELECT payload FROM events WHERE typ = 'meldung' ORDER BY json_extract(payload, '$.ts')";
const roh = execFileSync(
  'npx',
  ['wrangler', 'd1', 'execute', 'rw-lernapp-sync', '--remote', '--json', '--command', sql],
  {
    cwd: new URL('../sync-worker/', import.meta.url),
    encoding: 'utf8',
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
  },
);
const ergebnis = JSON.parse(roh) as { results: { payload: string }[] }[];
const meldungen = (ergebnis[0]?.results ?? []).map((r) => JSON.parse(r.payload) as Meldung);

// Zurückgezogene Meldungen heben frühere Meldungen desselben Elements auf
const offen = new Map<string, Meldung[]>();
for (const m of meldungen) {
  const key = `${m.elementId}|${m.seed ?? ''}`;
  if (m.zurueckgezogen) offen.delete(key);
  else offen.set(key, [...(offen.get(key) ?? []), m]);
}

if (offen.size === 0) {
  console.log('Keine offenen Meldungen.');
} else {
  console.log(`${offen.size} gemeldete Inhalte:\n`);
  for (const liste of offen.values()) {
    const m = liste[liste.length - 1]!;
    console.log(
      `• ${m.elementId}${m.skillId ? ` (Skill ${m.skillId})` : ''}${m.seed !== undefined ? `, Seed ${m.seed}` : ''}${m.variant ? `, ${m.variant}` : ''}`,
    );
    console.log(
      `  gemeldet am ${new Date(m.ts).toLocaleString('de-DE')}${liste.length > 1 ? ` (${liste.length}×)` : ''}`,
    );
    for (const x of liste) if (x.kommentar) console.log(`  Kommentar: ${x.kommentar}`);
  }
}
