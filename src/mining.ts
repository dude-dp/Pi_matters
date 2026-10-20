import { getPiHexDigits } from './bbp';
import { scanHexForWords } from './matcher';
import { getMeta, setMeta, saveDiscoveries } from './db';

export interface Bindings {
  DB?: D1Database;
  pi_db?: D1Database;
  ASSETS?: Fetcher;
}

export function resolveDatabase(env: Bindings): D1Database | undefined {
  return env.pi_db || env.DB;
}

/**
 * Autonomous mining function with adaptive profiling:
 * Advances the global Pi cursor, extracts digits via BBP,
 * detects English words and semantic phrases, and persists findings to D1.
 */
export async function runAutonomousMining(env: Bindings, targetBatchSize = 160) {
  const db = resolveDatabase(env);
  const currentCursorStr = await getMeta(db, 'cursor_digit_index', '0');
  const currentCursor = parseInt(currentCursorStr, 10) || 0;

  const startTime = Date.now();

  // 1. Compute Pi hex digits using BBP
  const hex = getPiHexDigits(currentCursor, targetBatchSize);
  const mathDurationMs = Date.now() - startTime;

  // 2. Scan for English words & multi-word semantic phrases
  const matches = scanHexForWords(hex, currentCursor, { detectPhrases: true });
  const phrasesCount = matches.filter(m => m.isPhrase).length;

  // 3. Save any discovered words and phrases
  if (matches.length > 0) {
    await saveDiscoveries(db, matches);
  }

  // 4. Update cursor and telemetry
  const nextCursor = currentCursor + targetBatchSize;
  await setMeta(db, 'cursor_digit_index', nextCursor.toString());

  const processedStr = await getMeta(db, 'total_digits_processed', '0');
  const totalProcessed = (parseInt(processedStr, 10) || 0) + targetBatchSize;
  await setMeta(db, 'total_digits_processed', totalProcessed.toString());
  await setMeta(db, 'last_run_at', new Date().toISOString());

  const totalDurationMs = Date.now() - startTime;

  return {
    cursorBefore: currentCursor,
    cursorAfter: nextCursor,
    batchSize: targetBatchSize,
    hexSnippet: hex.slice(0, 32) + '...',
    matchesFound: matches.length,
    phrasesFound: phrasesCount,
    executionTimeMs: totalDurationMs,
    mathTimeMs: mathDurationMs,
    matches
  };
}
