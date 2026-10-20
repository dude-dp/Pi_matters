import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getPiHexDigits, hexToBinary, hexToAscii, binaryStreamTo5BitText } from './bbp';
import { scanHexForWords } from './matcher';
import { getMeta, getDiscoveries, searchDiscoveries } from './db';
import { runAutonomousMining, resolveDatabase, Bindings } from './mining';
import { lookupWordDefinition } from './dictionary-client';

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
  const lastRunAt = await getMeta(db, 'last_run_at', '');

  return c.json({
    cursor,
    totalProcessed,
    totalWords,
    totalPhrases,
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
