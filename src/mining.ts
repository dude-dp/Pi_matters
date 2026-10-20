import { getPiHexDigits } from './bbp';
import { scanHexForWords } from './matcher';
import { getMeta, setMeta, saveDiscoveries } from './db';

export interface Bindings {
  DB?: D1Database;
  ASSETS?: Fetcher;
}

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
