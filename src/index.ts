import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getPiHexDigits, hexToBinary, hexToAscii } from './bbp';
import { scanHexForWords } from './matcher';
import { getMeta, setMeta, saveDiscoveries, getDiscoveries, searchDiscoveries } from './db';

export interface Bindings {
  DB?: D1Database;
  ASSETS?: Fetcher;
}

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for API routes
app.use('/api/*', cors());

/**
 * Autonomous mining function:
 * Advances the global Pi cursor, extracts digits via BBP,
 * detects English words, and persists the findings.
 */
export async function runAutonomousMining(env: Bindings, batchSize = 100) {
  const currentCursorStr = await getMeta(env.DB, 'cursor_digit_index', '0');
  const currentCursor = parseInt(currentCursorStr, 10) || 0;

  // 1. Compute Pi hex digits using BBP
  const hex = getPiHexDigits(currentCursor, batchSize);

  // 2. Scan for English words across byte boundaries & bit offsets
  const matches = scanHexForWords(hex, currentCursor);

  // 3. Save any discovered words
  if (matches.length > 0) {
    await saveDiscoveries(env.DB, matches);
  }

  // 4. Update cursor and telemetry
  const nextCursor = currentCursor + batchSize;
  await setMeta(env.DB, 'cursor_digit_index', nextCursor.toString());

  const processedStr = await getMeta(env.DB, 'total_digits_processed', '0');
  const totalProcessed = (parseInt(processedStr, 10) || 0) + batchSize;
  await setMeta(env.DB, 'total_digits_processed', totalProcessed.toString());
  await setMeta(env.DB, 'last_run_at', new Date().toISOString());

  return {
    cursorBefore: currentCursor,
    cursorAfter: nextCursor,
    batchSize,
    hexSnippet: hex.slice(0, 32) + '...',
    matchesFound: matches.length,
    matches
  };
}

// ---------------- API Endpoints ---------------- //

// 1. Health check & Telemetry
app.get('/api/stats', async (c) => {
  const cursor = parseInt(await getMeta(c.env.DB, 'cursor_digit_index', '0'), 10);
  const totalProcessed = parseInt(await getMeta(c.env.DB, 'total_digits_processed', '0'), 10);
  const totalWords = parseInt(await getMeta(c.env.DB, 'total_words_found', '0'), 10);
  const lastRunAt = await getMeta(c.env.DB, 'last_run_at', '');

  return c.json({
    cursor,
    totalProcessed,
    totalWords,
    lastRunAt,
    uptime: 'Autonomous (Cloudflare Workers Cron)',
    algorithm: 'Bailey–Borwein–Plouffe (BBP Base-16)'
  });
});

// 2. Discoveries list (paginated)
app.get('/api/discoveries', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  const data = await getDiscoveries(c.env.DB, limit, offset);
  return c.json(data);
});

// 3. Search discoveries
app.get('/api/search', async (c) => {
  const query = c.req.query('q') || '';
  if (!query) {
    return c.json({ results: [] });
  }
  const results = await searchDiscoveries(c.env.DB, query);
  return c.json({ query, count: results.length, results });
});

// 4. Inspect specific digit range of Pi
app.get('/api/inspect/:position', async (c) => {
  const position = Math.max(0, parseInt(c.req.param('position') || '0', 10));
  const count = Math.min(Math.max(16, parseInt(c.req.query('count') || '64', 10)), 256);

  const hex = getPiHexDigits(position, count);
  const binary = hexToBinary(hex);
  const ascii = hexToAscii(hex, { replaceNonPrintable: true });
  const detected = scanHexForWords(hex, position);

  return c.json({
    position,
    count,
    hex,
    binary,
    ascii: ascii.printable,
    detectedWords: detected
  });
});

// 5. Trigger on-demand mining chunk
app.post('/api/mine', async (c) => {
  let batchSize = 100;
  try {
    const body = await c.req.json();
    if (body && typeof body.batchSize === 'number') {
      batchSize = Math.min(Math.max(10, body.batchSize), 200);
    }
  } catch {
    // default to 100
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
    ctx.waitUntil(runAutonomousMining(env, 120));
  }
};
