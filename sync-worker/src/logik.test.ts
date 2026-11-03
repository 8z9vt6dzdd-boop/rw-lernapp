import { describe, expect, it } from 'vitest';
import { ANFRAGEN_JE_MINUTE, erlaubteHerkunft, pull, push, sha256, type Speicher, type Zeile } from './logik';

function attrappe(): Speicher & { zeilen: (Zeile & { code: string; id: string; device: string })[] } {
  const zeilen: (Zeile & { code: string; id: string; device: string })[] = [];
  const anfragen = new Map<string, number>();
  let seq = 0;
  return {
    zeilen,
    async zaehleAnfrage(c, m) {
      const k = `${c}|${m}`;
      anfragen.set(k, (anfragen.get(k) ?? 0) + 1);
      return anfragen.get(k)!;
    },
    async einfuegen(code, e, jetzt) {
      if (zeilen.some((z) => z.code === code && z.id === e.id)) return;
      zeilen.push({ seq: ++seq, received_at: jetzt, payload: e.payload, code, id: e.id, device: e.deviceId });
    },
    async abrufen(code, seit, limit) {
      return zeilen.filter((z) => z.code === code && z.seq > seit).slice(0, limit);
    },
    async geraete(code) {
      return new Set(zeilen.filter((z) => z.code === code).map((z) => z.device)).size;
    },
  };
}

const CODE = 'apfel-birne-kirsche-dattel-ente-fisch-gans-hase';
const ev = (id: string, device = 'a') => ({ id, typ: 'attempt', deviceId: device, ts: '2026-11-03T10:00:00Z', x: 1 });

describe('Abgleich-Dienst', () => {
  it('speichert, liefert ab Cursor und ignoriert Doppelungen', async () => {
    const db = attrappe();
    await push(db, { code: CODE, events: [ev('1'), ev('2')] }, 1000);
    await push(db, { code: CODE, events: [ev('2'), ev('3', 'b')] }, 2000);
    const a = (await pull(db, CODE, '0', 3000)).body as { events: { id: string; _received_at: number }[]; cursor: number; geraete: number };
    expect(a.events.map((e) => e.id)).toEqual(['1', '2', '3']);
    expect(a.geraete).toBe(2);
    const b = (await pull(db, CODE, String(a.cursor), 3000)).body as { events: unknown[]; cursor: number };
    expect(b.events).toEqual([]);
    expect(b.cursor).toBe(a.cursor);
  });

  it('trennt Lernstände nach Code und speichert nur den Hash', async () => {
    const db = attrappe();
    await push(db, { code: CODE, events: [ev('1')] }, 1);
    await push(db, { code: `${CODE}-anders`, events: [ev('1')] }, 1);
    expect(db.zeilen).toHaveLength(2);
    expect(db.zeilen[0]!.code).toBe(await sha256(CODE));
    expect(JSON.stringify(db.zeilen)).not.toContain(CODE);
  });

  it('lehnt zu kurze Codes, zu viele Ereignisse und ungültige Ereignisse ab', async () => {
    const db = attrappe();
    expect((await push(db, { code: 'kurz', events: [] }, 1)).status).toBe(400);
    expect((await push(db, { code: CODE, events: Array.from({ length: 501 }, (_, i) => ev(String(i))) }, 1)).status).toBe(400);
    const r = await push(db, { code: CODE, events: [{ id: 'x' }, ev('ok')] }, 1);
    expect(r.body).toMatchObject({ gespeichert: 1, abgelehnt: 1 });
    expect((await pull(db, CODE, '-1', 1)).status).toBe(400);
  });

  it('begrenzt Anfragen je Code und Minute', async () => {
    const db = attrappe();
    for (let i = 0; i < ANFRAGEN_JE_MINUTE; i++) expect((await pull(db, CODE, '0', 60_000)).status).toBe(200);
    expect((await pull(db, CODE, '0', 60_000)).status).toBe(429);
    expect((await pull(db, CODE, '0', 120_000)).status).toBe(200);
  });

  it('erlaubt nur die App-Adresse (lokal nur im Testbetrieb)', () => {
    const app = 'https://8z9vt6dzdd-boop.github.io';
    expect(erlaubteHerkunft(app, [app], false)).toBe(app);
    expect(erlaubteHerkunft('https://boese.example', [app], false)).toBeNull();
    expect(erlaubteHerkunft('http://localhost:4173', [app], false)).toBeNull();
    expect(erlaubteHerkunft('http://localhost:4173', [app], true)).toBe('http://localhost:4173');
  });
});
