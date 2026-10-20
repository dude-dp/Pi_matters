import { DiscoveredMatch } from './matcher';

// In-memory fallback for local development or testing without D1 attached
const memoryMeta = new Map<string, string>([
  ['cursor_digit_index', '0'],
  ['total_digits_processed', '0'],
  ['total_words_found', '0'],
  ['total_phrases_found', '0'],
  ['last_run_at', '']
]);
const memoryDiscoveries: (DiscoveredMatch & { id: number; discovered_at: string })[] = [];
let memoryIdCounter = 1;

export async function getMeta(db: D1Database | undefined, key: string, defaultValue = ''): Promise<string> {
  if (!db) {
    return memoryMeta.get(key) ?? defaultValue;
  }
  try {
    const res = await db.prepare('SELECT value FROM meta WHERE key = ?').bind(key).first<{ value: string }>();
    return res ? res.value : defaultValue;
  } catch (err) {
    console.warn(`[DB] getMeta failed for key ${key}, using memory fallback:`, err);
    return memoryMeta.get(key) ?? defaultValue;
  }
}

export async function setMeta(db: D1Database | undefined, key: string, value: string): Promise<void> {
  if (!db) {
    memoryMeta.set(key, value);
    return;
  }
  try {
    await db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?')
      .bind(key, value, value)
      .run();
  } catch (err) {
    console.warn(`[DB] setMeta failed for key ${key}, updating memory fallback:`, err);
    memoryMeta.set(key, value);
  }
}

export async function saveDiscoveries(db: D1Database | undefined, matches: DiscoveredMatch[]): Promise<number> {
  if (matches.length === 0) return 0;

  let phrasesCount = 0;
  for (const m of matches) {
    if (m.isPhrase) phrasesCount++;
  }

  if (!db) {
    for (const m of matches) {
      memoryDiscoveries.unshift({
        ...m,
        id: memoryIdCounter++,
        discovered_at: new Date().toISOString()
      });
    }
    const currentWords = parseInt(memoryMeta.get('total_words_found') || '0', 10);
    memoryMeta.set('total_words_found', (currentWords + matches.length).toString());

    const currentPhrases = parseInt(memoryMeta.get('total_phrases_found') || '0', 10);
    memoryMeta.set('total_phrases_found', (currentPhrases + phrasesCount).toString());
    return matches.length;
  }

  try {
    const statements = matches.map(m =>
      db.prepare(
        `INSERT INTO discoveries 
         (word, length, digit_start, digit_end, hex_snippet, binary_snippet, decoded_ascii,
          is_phrase, phrase_type, phrase_label, rarity_tier, word_count, discovered_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).bind(
        m.word,
        m.length,
        m.digitStart,
        m.digitEnd,
        m.hexSnippet,
        m.binarySnippet,
        m.decodedAscii,
        m.isPhrase ? 1 : 0,
        m.phraseType,
        m.phraseLabel,
        m.rarityTier,
        m.wordCount
      )
    );

    await db.batch(statements);

    // Update total words counter
    await db.prepare(
      `INSERT INTO meta (key, value) VALUES ('total_words_found', ?)
       ON CONFLICT(key) DO UPDATE SET value = CAST(CAST(value AS INTEGER) + ? AS TEXT)`
    ).bind(matches.length.toString(), matches.length).run();

    // Update total phrases counter if any found
    if (phrasesCount > 0) {
      await db.prepare(
        `INSERT INTO meta (key, value) VALUES ('total_phrases_found', ?)
         ON CONFLICT(key) DO UPDATE SET value = CAST(CAST(value AS INTEGER) + ? AS TEXT)`
      ).bind(phrasesCount.toString(), phrasesCount).run();
    }

    return matches.length;
  } catch (err) {
    console.warn('[DB] saveDiscoveries failed, falling back to memory:', err);
    for (const m of matches) {
      memoryDiscoveries.unshift({
        ...m,
        id: memoryIdCounter++,
        discovered_at: new Date().toISOString()
      });
    }
    return matches.length;
  }
}

export async function getDiscoveries(
  db: D1Database | undefined,
  limit = 50,
  offset = 0,
  filter: 'all' | 'phrases' | 'words' | 'rarest' = 'all'
): Promise<{ discoveries: any[]; total: number }> {
  if (!db) {
    let filtered = memoryDiscoveries;
    if (filter === 'phrases') {
      filtered = memoryDiscoveries.filter(d => d.isPhrase);
    } else if (filter === 'words') {
      filtered = memoryDiscoveries.filter(d => !d.isPhrase);
    } else if (filter === 'rarest') {
      filtered = [...memoryDiscoveries].sort((a, b) => {
        const order = { MYTHIC: 4, EPIC: 3, RARE: 2, UNCOMMON: 1, COMMON: 0 };
        return (order[b.rarityTier] || 0) - (order[a.rarityTier] || 0);
      });
    }
    return { discoveries: filtered.slice(offset, offset + limit), total: filtered.length };
  }

  try {
    let whereClause = '';
    let orderBy = 'ORDER BY digit_start ASC';

    if (filter === 'phrases') {
      whereClause = 'WHERE is_phrase = 1';
      orderBy = 'ORDER BY digit_start ASC';
    } else if (filter === 'words') {
      whereClause = 'WHERE is_phrase = 0';
      orderBy = 'ORDER BY digit_start ASC';
    } else if (filter === 'rarest') {
      orderBy = `ORDER BY 
        CASE rarity_tier 
          WHEN 'MYTHIC' THEN 4 
          WHEN 'EPIC' THEN 3 
          WHEN 'RARE' THEN 2 
          WHEN 'UNCOMMON' THEN 1 
          ELSE 0 
        END DESC, digit_start ASC`;
    }

    const countRes = await db.prepare(`SELECT COUNT(*) as count FROM discoveries ${whereClause}`).first<{ count: number }>();
    const total = countRes ? countRes.count : 0;

    const listRes = await db.prepare(
      `SELECT * FROM discoveries ${whereClause} ${orderBy} LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

    return { discoveries: listRes.results || [], total };
  } catch (err) {
    console.warn('[DB] getDiscoveries failed, using memory:', err);
    return { discoveries: memoryDiscoveries.slice(offset, offset + limit), total: memoryDiscoveries.length };
  }
}

export async function searchDiscoveries(
  db: D1Database | undefined,
  wordQuery: string
): Promise<any[]> {
  const normalized = wordQuery.trim().toUpperCase();
  if (!normalized) return [];

  if (!db) {
    return memoryDiscoveries.filter(d => d.word.includes(normalized));
  }

  try {
    const res = await db.prepare(
      'SELECT * FROM discoveries WHERE word LIKE ? ORDER BY length DESC, digit_start ASC LIMIT 50'
    ).bind(`%${normalized}%`).all();
    return res.results || [];
  } catch (err) {
    console.warn('[DB] searchDiscoveries failed:', err);
    return memoryDiscoveries.filter(d => d.word.includes(normalized));
  }
}
