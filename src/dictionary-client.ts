/**
 * Open-Source Wiktionary Dictionary Client
 * Uses https://api.dictionaryapi.dev (Wiktionary-backed, free, open-source)
 * with Cloudflare D1 persistent edge caching.
 */

export interface WordDefinition {
  word: string;
  found: boolean;
  phonetic?: string;
  partOfSpeech?: string;
  definition?: string;
  example?: string;
  audioUrl?: string;
  sourceUrl?: string;
  isPhrase?: boolean;
}

const memoryDictCache = new Map<string, WordDefinition>();

export async function lookupWordDefinition(
  db: D1Database | undefined,
  rawWord: string
): Promise<WordDefinition> {
  const normalized = rawWord.trim().toLowerCase();
  if (!normalized) {
    return { word: rawWord, found: false };
  }

  // 1. Check in-memory cache
  if (memoryDictCache.has(normalized)) {
    return memoryDictCache.get(normalized)!;
  }

  // 2. Check D1 database cache
  if (db) {
    try {
      const cached = await db
        .prepare('SELECT * FROM dictionary_cache WHERE word = ?')
        .bind(normalized)
        .first<any>();

      if (cached) {
        const def: WordDefinition = {
          word: cached.word,
          found: true,
          phonetic: cached.phonetic || undefined,
          partOfSpeech: cached.part_of_speech || undefined,
          definition: cached.definition || undefined,
          example: cached.example || undefined,
          audioUrl: cached.audio_url || undefined,
          sourceUrl: cached.source_url || undefined
        };
        memoryDictCache.set(normalized, def);
        return def;
      }
    } catch (err) {
      console.warn('[Dictionary] D1 cache read error:', err);
    }
  }

  // 3. For multi-word phrases, lookup the key words if whole phrase is not found
  const queryWord = normalized.includes(' ') ? normalized.split(' ')[0] : normalized;

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(queryWord)}`, {
      headers: { 'User-Agent': 'PiMatters/1.0 (Cloudflare Worker)' }
    });

    if (!res.ok) {
      const notFound: WordDefinition = {
        word: rawWord,
        found: false,
        isPhrase: normalized.includes(' '),
        definition: normalized.includes(' ')
          ? `Multi-word phrase combining "${normalized.toUpperCase()}" detected in Pi's infinite decimal stream.`
          : `Valid English word identified in Pi stream.`
      };
      memoryDictCache.set(normalized, notFound);
      return notFound;
    }

    const data = await res.json() as any[];
    if (!Array.isArray(data) || data.length === 0) {
      return { word: rawWord, found: false };
    }

    const entry = data[0];
    const phonetic = entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || '';
    const audioUrl = entry.phonetics?.find((p: any) => p.audio && p.audio.startsWith('http'))?.audio || '';
    const firstMeaning = entry.meanings?.[0];
    const partOfSpeech = firstMeaning?.partOfSpeech || '';
    const firstDef = firstMeaning?.definitions?.[0];
    const definition = firstDef?.definition || '';
    const example = firstDef?.example || '';
    const sourceUrl = entry.sourceUrls?.[0] || 'https://en.wiktionary.org';

    const result: WordDefinition = {
      word: rawWord,
      found: true,
      phonetic,
      partOfSpeech,
      definition: normalized.includes(' ')
        ? `[Phrase: ${rawWord}] ${definition}`
        : definition,
      example,
      audioUrl,
      sourceUrl,
      isPhrase: normalized.includes(' ')
    };

    memoryDictCache.set(normalized, result);

    // 4. Save into D1 cache
    if (db) {
      try {
        await db
          .prepare(
            `INSERT INTO dictionary_cache 
             (word, phonetic, part_of_speech, definition, example, audio_url, source_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(word) DO NOTHING`
          )
          .bind(
            normalized,
            result.phonetic || '',
            result.partOfSpeech || '',
            result.definition || '',
            result.example || '',
            result.audioUrl || '',
            result.sourceUrl || ''
          )
          .run();
      } catch (err) {
        console.warn('[Dictionary] D1 cache write error:', err);
      }
    }

    return result;
  } catch (err) {
    console.warn('[Dictionary] Network fetch failed:', err);
    return {
      word: rawWord,
      found: false,
      definition: 'Definition temporarily unavailable offline.'
    };
  }
}
