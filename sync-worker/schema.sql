-- Cloudflare D1: Speicher für den automatischen Geräte-Abgleich (05-technik.md).
-- Gespeichert werden nur Lernereignisse, Einstellungen und Fehlermeldungen – keine personenbezogenen Daten.
CREATE TABLE IF NOT EXISTS events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT, -- fortlaufender Cursor für den Abruf
  code_hash TEXT NOT NULL,               -- SHA-256 des Kopplungscodes (nie der Code selbst)
  id TEXT NOT NULL,                      -- UUID des Ereignisses
  typ TEXT NOT NULL,                     -- Ereignistyp (attempt, lektion, meldung, …)
  device_id TEXT NOT NULL,
  received_at INTEGER NOT NULL,          -- Server-Zeit in ms
  payload TEXT NOT NULL,                 -- JSON des Ereignisses
  UNIQUE (code_hash, id)
);
CREATE INDEX IF NOT EXISTS idx_events_code_seq ON events (code_hash, seq);
CREATE INDEX IF NOT EXISTS idx_events_typ ON events (typ);

-- Einfache Begrenzung der Anfragen je Code und Minute
CREATE TABLE IF NOT EXISTS anfragen (
  code_hash TEXT NOT NULL,
  minute INTEGER NOT NULL,
  anzahl INTEGER NOT NULL,
  PRIMARY KEY (code_hash, minute)
);
