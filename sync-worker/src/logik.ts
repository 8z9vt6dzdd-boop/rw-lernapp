// Fachlogik des Abgleich-Dienstes, unabhängig von Cloudflare testbar (Datenbank als Schnittstelle).

export const MAX_EVENTS = 500;
export const MAX_PULL = 1000;
export const MAX_EVENT_BYTES = 32_000;
export const MIN_CODE_LAENGE = 20;
export const ANFRAGEN_JE_MINUTE = 60;

export interface Zeile {
  seq: number;
  received_at: number;
  payload: string;
}

/** Minimale Datenbank-Schnittstelle (D1 in Produktion, Speicher-Attrappe im Test). */
export interface Speicher {
  zaehleAnfrage(codeHash: string, minute: number): Promise<number>;
  einfuegen(
    codeHash: string,
    e: { id: string; typ: string; deviceId: string; payload: string },
    jetzt: number,
  ): Promise<void>;
  abrufen(codeHash: string, seit: number, limit: number): Promise<Zeile[]>;
  geraete(codeHash: string): Promise<number>;
}

export interface Antwort {
  status: number;
  body: unknown;
}

export async function sha256(text: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function codeGueltig(code: unknown): code is string {
  return typeof code === 'string' && code.length >= MIN_CODE_LAENGE && code.length <= 200;
}

interface EventLike {
  id: string;
  typ: string;
  deviceId: string;
  ts: string;
}

function eventGueltig(e: unknown): e is EventLike {
  if (!e || typeof e !== 'object') return false;
  const x = e as Record<string, unknown>;
  return (
    typeof x.id === 'string' &&
    x.id.length > 0 &&
    x.id.length <= 64 &&
    typeof x.typ === 'string' &&
    x.typ.length <= 32 &&
    typeof x.deviceId === 'string' &&
    x.deviceId.length <= 64 &&
    typeof x.ts === 'string'
  );
}

async function begrenzt(db: Speicher, codeHash: string, jetzt: number): Promise<boolean> {
  const n = await db.zaehleAnfrage(codeHash, Math.floor(jetzt / 60_000));
  return n > ANFRAGEN_JE_MINUTE;
}

export async function push(db: Speicher, body: unknown, jetzt: number): Promise<Antwort> {
  const b = body as { code?: unknown; events?: unknown } | null;
  if (!b || !codeGueltig(b.code)) return { status: 400, body: { fehler: 'code' } };
  if (!Array.isArray(b.events) || b.events.length > MAX_EVENTS)
    return { status: 400, body: { fehler: 'events' } };
  const codeHash = await sha256(b.code);
  if (await begrenzt(db, codeHash, jetzt)) return { status: 429, body: { fehler: 'zu-viele' } };
  let gespeichert = 0;
  let abgelehnt = 0;
  for (const e of b.events) {
    const payload = JSON.stringify(e);
    if (!eventGueltig(e) || payload.length > MAX_EVENT_BYTES) {
      abgelehnt++;
      continue;
    }
    await db.einfuegen(codeHash, { id: e.id, typ: e.typ, deviceId: e.deviceId, payload }, jetzt);
    gespeichert++;
  }
  return { status: 200, body: { ok: true, gespeichert, abgelehnt } };
}

export async function pull(
  db: Speicher,
  code: string | null,
  seitText: string | null,
  jetzt: number,
): Promise<Antwort> {
  if (!codeGueltig(code)) return { status: 400, body: { fehler: 'code' } };
  const seit = Number(seitText ?? '0');
  if (!Number.isFinite(seit) || seit < 0) return { status: 400, body: { fehler: 'seit' } };
  const codeHash = await sha256(code);
  if (await begrenzt(db, codeHash, jetzt)) return { status: 429, body: { fehler: 'zu-viele' } };
  const zeilen = await db.abrufen(codeHash, seit, MAX_PULL);
  const events = zeilen.map((z) => ({ ...JSON.parse(z.payload), _received_at: z.received_at }));
  const cursor = zeilen.length > 0 ? zeilen[zeilen.length - 1]!.seq : seit;
  return {
    status: 200,
    body: { events, cursor, mehr: zeilen.length === MAX_PULL, geraete: await db.geraete(codeHash) },
  };
}

/** Erlaubte Herkunft: nur die App-Adresse (plus lokale Testadressen, wenn freigeschaltet). */
export function erlaubteHerkunft(origin: string | null, erlaubt: string[], lokal: boolean): string | null {
  if (!origin) return null;
  if (erlaubt.includes(origin)) return origin;
  if (lokal && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return origin;
  return null;
}
