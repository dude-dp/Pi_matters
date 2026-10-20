import { describe, it, expect } from 'vitest';
import { lookupWordDefinition } from '../src/dictionary-client';

describe('Open-Source Wiktionary & Dictionary Cache', () => {
  it('looks up a common English word definition', async () => {
    // Tests online fetch + structured parsing
    const res = await lookupWordDefinition(undefined, 'love');
    expect(res.word).toBe('love');
    if (res.found) {
      expect(typeof res.definition).toBe('string');
      expect(res.definition?.length).toBeGreaterThan(0);
      expect(typeof res.partOfSpeech).toBe('string');
    }
  });

  it('handles multi-word phrases cleanly', async () => {
    const res = await lookupWordDefinition(undefined, 'TRUE LOVE');
    expect(res.word).toBe('TRUE LOVE');
    expect(res.isPhrase).toBe(true);
    expect(res.definition).toContain('TRUE LOVE');
  });
});
