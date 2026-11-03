// Cloudflare Worker für den automatischen Geräte-Abgleich (POST /push, GET /pull).
import { erlaubteHerkunft, pull, push, type Speicher, type Zeile } from './logik';

interface Env {
  DB: D1Database;
  /** Kommagetrennte Liste erlaubter Herkunftsadressen */
  ERLAUBT: string;
  /** "1" erlaubt lokale Testadressen (nur bei wrangler dev) */
  LOKAL?: string;
}

function d1Speicher(db: D1Database): Speicher {
  return {
    async zaehleAnfrage(codeHash, minute) {
      const r = await db
        .prepare(
          'INSERT INTO anfragen (code_hash, minute, anzahl) VALUES (?1, ?2, 1) ON CONFLICT (code_hash, minute) DO UPDATE SET anzahl = anzahl + 1 RETURNING anzahl',
        )
        .bind(codeHash, minute)
        .first<{ anzahl: number }>();
      // Alte Zähler gelegentlich aufräumen
      if (Math.random() < 0.02)
        await db.prepare('DELETE FROM anfragen WHERE minute < ?1').bind(minute - 60).run();
      return r?.anzahl ?? 1;
    },
    async einfuegen(codeHash, e, jetzt) {
      await db
        .prepare(
          'INSERT OR IGNORE INTO events (code_hash, id, typ, device_id, received_at, payload) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
        )
        .bind(codeHash, e.id, e.typ, e.deviceId, jetzt, e.payload)
        .run();
    },
    async abrufen(codeHash, seit, limit) {
      const r = await db
        .prepare(
          'SELECT seq, received_at, payload FROM events WHERE code_hash = ?1 AND seq > ?2 ORDER BY seq LIMIT ?3',
        )
        .bind(codeHash, seit, limit)
        .all<Zeile>();
      return r.results;
    },
    async geraete(codeHash) {
      const r = await db
        .prepare('SELECT COUNT(DISTINCT device_id) AS n FROM events WHERE code_hash = ?1')
        .bind(codeHash)
        .first<{ n: number }>();
      return r?.n ?? 0;
    },
  };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = erlaubteHerkunft(
      req.headers.get('Origin'),
      env.ERLAUBT.split(',').map((s) => s.trim()),
      env.LOKAL === '1',
    );
    const cors: Record<string, string> = origin
      ? {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
          Vary: 'Origin',
        }
      : { Vary: 'Origin' };
    if (req.method === 'OPTIONS') return new Response(null, { status: origin ? 204 : 403, headers: cors });
    if (!origin) return new Response('Nicht erlaubt', { status: 403, headers: cors });
    const url = new URL(req.url);
    const db = d1Speicher(env.DB);
    const jetzt = Date.now();
    let a;
    try {
      if (req.method === 'POST' && url.pathname === '/push') {
        const text = await req.text();
        if (text.length > 2_000_000) return new Response('Zu groß', { status: 413, headers: cors });
        a = await push(db, JSON.parse(text), jetzt);
      } else if (req.method === 'GET' && url.pathname === '/pull') {
        a = await pull(db, url.searchParams.get('code'), url.searchParams.get('since'), jetzt);
      } else {
        a = { status: 404, body: { fehler: 'unbekannt' } };
      }
    } catch {
      a = { status: 400, body: { fehler: 'ungueltig' } };
    }
    return new Response(JSON.stringify(a.body), {
      status: a.status,
      headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
    });
  },
};
