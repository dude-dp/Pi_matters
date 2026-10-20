import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getPiHexDigits, hexToBinary, hexToAscii, binaryStreamTo5BitText } from './bbp';
import { scanHexForWords, DiscoveredMatch } from './matcher';
import { getMeta, setMeta, saveDiscoveries, getDiscoveries, searchDiscoveries } from './db';
import { runAutonomousMining, resolveDatabase, Bindings } from './mining';
import { lookupWordDefinition } from './dictionary-client';
import { DICTIONARY_SET } from './dictionary';
import { classifyPhrase } from './grammar';

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for API routes
app.use('/api/*', cors());

// ---------------- API Endpoints ---------------- //

// 1. Health check & Telemetry
app.get('/api/stats', async (c) => {
  const db = resolveDatabase(c.env);
  const cursor = parseInt(await getMeta(db, 'cursor_digit_index', '0'), 10);
  const totalProcessed = parseInt(await getMeta(db, 'total_digits_processed', '0'), 10);
  const totalWords = parseInt(await getMeta(db, 'total_words_found', '0'), 10);
  const totalPhrases = parseInt(await getMeta(db, 'total_phrases_found', '0'), 10);
  const swarmDigits = parseInt(await getMeta(db, 'swarm_digits_contributed', '0'), 10);
  const lastRunAt = await getMeta(db, 'last_run_at', '');

  return c.json({
    cursor,
    totalProcessed,
    totalWords,
    totalPhrases,
    swarmDigits,
    lastRunAt,
    uptime: 'Autonomous (Cloudflare Workers Cron 1m)',
    algorithm: 'Bailey–Borwein–Plouffe (5-Bit Natural Alphabet A=1..Z=26)'
  });
});

// 2. Discoveries list (paginated, with filter: all, phrases, words, rarest)
app.get('/api/discoveries', async (c) => {
  const db = resolveDatabase(c.env);
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);
  const offset = parseInt(c.req.query('offset') || '0', 10);
  const filter = (c.req.query('filter') || 'all') as 'all' | 'phrases' | 'words' | 'rarest';

  const data = await getDiscoveries(db, limit, offset, filter);
  return c.json(data);
});

// 3. Search discoveries
app.get('/api/search', async (c) => {
  const db = resolveDatabase(c.env);
  const query = c.req.query('q') || '';
  if (!query) {
    return c.json({ results: [] });
  }
  const results = await searchDiscoveries(db, query);
  return c.json({ query, count: results.length, results });
});

// 4. Inspect specific digit range of Pi
app.get('/api/inspect/:position', async (c) => {
  const position = Math.max(0, parseInt(c.req.param('position') || '0', 10));
  const count = Math.min(Math.max(16, parseInt(c.req.query('count') || '64', 10)), 256);

  const hex = getPiHexDigits(position, count);
  const binary = hexToBinary(hex);
  const text5Bit = binaryStreamTo5BitText(binary, 0);
  const ascii = hexToAscii(hex, { replaceNonPrintable: true });
  const detected = scanHexForWords(hex, position, { detectPhrases: true });

  return c.json({
    position,
    count,
    hex,
    binary,
    text5Bit,
    ascii: text5Bit, // primary natural alphabet stream
    rawAscii: ascii.printable,
    detectedWords: detected
  });
});

// 5. Open-Source Wiktionary Definition Lookup with Edge D1 Caching
app.get('/api/define/:word', async (c) => {
  const db = resolveDatabase(c.env);
  const word = c.req.param('word');
  const definition = await lookupWordDefinition(db, word);
  return c.json(definition);
});

// 6. Trigger on-demand mining chunk
app.post('/api/mine', async (c) => {
  let batchSize = 160;
  try {
    const body = await c.req.json();
    if (body && typeof body.batchSize === 'number') {
      batchSize = Math.min(Math.max(10, body.batchSize), 250);
    }
  } catch {
    // default to 160
  }

  const result = await runAutonomousMining(c.env, batchSize);
  return c.json({
    success: true,
    ...result
  });
});

// 7. Collaborative Swarm: Lease a disjoint chunk of Pi digits to an active client Web Worker
app.get('/api/lease-job', async (c) => {
  const db = resolveDatabase(c.env);
  const sizeParam = parseInt(c.req.query('size') || '500', 10);
  const blockSize = Math.min(Math.max(100, isNaN(sizeParam) ? 500 : sizeParam), 2000);

  const currentCursorStr = await getMeta(db, 'cursor_digit_index', '0');
  const startDigit = parseInt(currentCursorStr, 10) || 0;
  const nextCursor = startDigit + blockSize;

  // Monotonically advance cursor frontier
  await setMeta(db, 'cursor_digit_index', nextCursor.toString());

  // Increment total digits processed
  const processedStr = await getMeta(db, 'total_digits_processed', '0');
  const totalProcessed = (parseInt(processedStr, 10) || 0) + blockSize;
  await setMeta(db, 'total_digits_processed', totalProcessed.toString());
  await setMeta(db, 'last_run_at', new Date().toISOString());

  return c.json({
    startDigit,
    blockSize,
    nextCursor
  });
});

// 8. Collaborative Swarm: Submit verified discoveries with Cryptographic Spot-Checking
app.post('/api/contribute', async (c) => {
  const db = resolveDatabase(c.env);
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Invalid JSON payload' }, 400);
  }

  const { startDigit, count, hexSnippet, discoveries } = body;
  if (typeof startDigit !== 'number' || typeof count !== 'number' || typeof hexSnippet !== 'string') {
    return c.json({ success: false, error: 'Missing required fields: startDigit, count, hexSnippet' }, 400);
  }

  // Cryptographic spot-checking: verify the first 8 hex characters using BBP
  const checkLen = Math.min(8, hexSnippet.length);
  if (checkLen < 4) {
    return c.json({ success: false, error: 'Hex snippet too short for cryptographic verification' }, 400);
  }

  const expectedHex = getPiHexDigits(startDigit, checkLen);
  if (expectedHex.toUpperCase() !== hexSnippet.slice(0, checkLen).toUpperCase()) {
    return c.json({
      success: false,
      error: 'Cryptographic proof-of-work verification failed: hex mismatch at startDigit'
    }, 400);
  }

  // Validate and sanitize submitted discoveries against dictionary/grammar
  const validated: DiscoveredMatch[] = [];
  if (Array.isArray(discoveries) && discoveries.length > 0) {
    for (const d of discoveries) {
      if (!d || typeof d.word !== 'string') continue;
      const cleanWord = d.word.trim().toUpperCase();
      if (cleanWord.length < 2) continue;

      // Ensure every token is in our verified English lexicon
      const words = cleanWord.split(' ');
      const allWordsValid = words.every((w: string) => DICTIONARY_SET.has(w));
      if (!allWordsValid) continue;

      const classification = classifyPhrase(words);

      validated.push({
        word: cleanWord,
        length: cleanWord.length,
        digitStart: typeof d.digitStart === 'number' ? d.digitStart : startDigit,
        digitEnd: typeof d.digitEnd === 'number' ? d.digitEnd : startDigit + count,
        hexSnippet: typeof d.hexSnippet === 'string' ? d.hexSnippet.slice(0, 64) : hexSnippet.slice(0, 32),
        binarySnippet: typeof d.binarySnippet === 'string' ? d.binarySnippet.slice(0, 128) : '',
        decodedAscii: typeof d.decodedAscii === 'string' ? d.decodedAscii.slice(0, 64) : cleanWord,
        bitOffset: typeof d.bitOffset === 'number' ? d.bitOffset : 0,
        isPhrase: words.length > 1,
        phraseType: classification.phraseType,
        phraseLabel: classification.label,
        rarityTier: classification.rarityTier,
        wordCount: words.length,
        encoding: '5-BIT'
      });
    }
  }

  let savedCount = 0;
  if (validated.length > 0) {
    savedCount = await saveDiscoveries(db, validated);
  }

  // Track total digits mined by the swarm
  const swarmTotalStr = await getMeta(db, 'swarm_digits_contributed', '0');
  const swarmTotal = (parseInt(swarmTotalStr, 10) || 0) + count;
  await setMeta(db, 'swarm_digits_contributed', swarmTotal.toString());

  return c.json({
    success: true,
    acceptedDiscoveries: savedCount,
    startDigit,
    count
  });
});

// Standard Worker Export
export default {
  fetch: app.fetch,
  
  /**
   * Scheduled Cron Trigger (Runs periodically on Cloudflare Workers)
   */
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    console.log(`[Scheduled] Cron triggered at ${event.cron}. Mining next chunk of Pi...`);
    ctx.waitUntil(runAutonomousMining(env, 180));
  }
};
