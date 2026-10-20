-- Migration 0003: Open-Source Wiktionary & Dictionary Cache
CREATE TABLE IF NOT EXISTS dictionary_cache (
  word TEXT PRIMARY KEY,
  phonetic TEXT,
  part_of_speech TEXT,
  definition TEXT,
  example TEXT,
  audio_url TEXT,
  source_url TEXT,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dict_word ON dictionary_cache (word);
