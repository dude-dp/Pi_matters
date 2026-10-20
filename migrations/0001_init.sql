-- Pi_matters D1 Database Schema
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Seed initial cursor state (starting after 3., digit index 0)
INSERT OR IGNORE INTO meta (key, value) VALUES ('cursor_digit_index', '0');
INSERT OR IGNORE INTO meta (key, value) VALUES ('total_digits_processed', '0');
INSERT OR IGNORE INTO meta (key, value) VALUES ('total_words_found', '0');
INSERT OR IGNORE INTO meta (key, value) VALUES ('last_run_at', '');

-- Store discovered valid words and phrases
CREATE TABLE IF NOT EXISTS discoveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL,
  length INTEGER NOT NULL,
  digit_start INTEGER NOT NULL,
  digit_end INTEGER NOT NULL,
  hex_snippet TEXT NOT NULL,
  binary_snippet TEXT NOT NULL,
  decoded_ascii TEXT NOT NULL,
  discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discoveries_word ON discoveries (word);
CREATE INDEX IF NOT EXISTS idx_discoveries_digit_start ON discoveries (digit_start);
CREATE INDEX IF NOT EXISTS idx_discoveries_length ON discoveries (length DESC);
