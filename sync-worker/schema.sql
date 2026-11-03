-- Cloudflare D1: Speicher für den automatischen Geräte-Abgleich.
-- Wird von Claude Code mit `wrangler d1 execute` angelegt.
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,            -- UUID des AttemptEvent
  code_hash TEXT NOT NULL,        -- SHA-256 des Kopplungscodes (nie der Code selbst)
  received_at INTEGER NOT NULL,   -- Server-Zeit in ms, Cursor für den Abruf
  payload TEXT NOT NULL           -- JSON des Ereignisses
);
CREATE INDEX IF NOT EXISTS idx_events_code_received ON events (code_hash, received_at);
