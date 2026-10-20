-- Migration 0002: Add Semantic Phrase & Rarity Support to Discoveries
ALTER TABLE discoveries ADD COLUMN is_phrase INTEGER DEFAULT 0;
ALTER TABLE discoveries ADD COLUMN phrase_type TEXT DEFAULT 'WORD';
ALTER TABLE discoveries ADD COLUMN phrase_label TEXT DEFAULT 'Single Word';
ALTER TABLE discoveries ADD COLUMN rarity_tier TEXT DEFAULT 'COMMON';
ALTER TABLE discoveries ADD COLUMN word_count INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_discoveries_is_phrase ON discoveries (is_phrase);
CREATE INDEX IF NOT EXISTS idx_discoveries_rarity ON discoveries (rarity_tier);
