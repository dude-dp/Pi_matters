import { describe, it, expect } from 'vitest';
import { classifyPhrase } from '../src/grammar';
import { scanHexForWords } from '../src/matcher';
import { charToFiveBit } from '../src/bbp';

function stringTo5BitHex(str: string): string {
  let bin = '';
  for (const ch of str) {
    bin += charToFiveBit(ch);
  }
  while (bin.length % 4 !== 0) {
    bin += '0';
  }
  let hex = '';
  for (let i = 0; i < bin.length; i += 4) {
    hex += parseInt(bin.slice(i, i + 4), 2).toString(16).toUpperCase();
  }
  return hex;
}

describe('Semantic Grammar & Multi-word Phrase Stitcher (5-Bit Alphabet)', () => {
  it('classifies Adjective + Noun combinations', () => {
    const res = classifyPhrase(['TRUE', 'LOVE']);
    expect(res.isPhrase).toBe(true);
    expect(res.phraseType).toBe('ADJ_NOUN');
    expect(res.rarityTier).toBe('EPIC');
  });

  it('classifies Subject + Verb combinations', () => {
    const res = classifyPhrase(['WE', 'SEE']);
    expect(res.isPhrase).toBe(true);
    expect(res.phraseType).toBe('SUBJ_VERB');
    expect(res.rarityTier).toBe('EPIC');
  });

  it('classifies Preposition + Noun combinations', () => {
    const res = classifyPhrase(['IN', 'TIME']);
    expect(res.isPhrase).toBe(true);
    expect(res.phraseType).toBe('PREP_NOUN');
    expect(res.rarityTier).toBe('EPIC');
  });

  it('classifies Subject + Verb + Object trigrams', () => {
    const res = classifyPhrase(['WE', 'SEEK', 'TRUTH']);
    expect(res.isPhrase).toBe(true);
    expect(res.phraseType).toBe('TRI_SENTENCE');
    expect(res.rarityTier).toBe('MYTHIC');
  });

  it('detects multi-word phrases from a 5-bit natural alphabet stream with spaces', () => {
    // "TRUE LOVE" with 5-bit space
    const phraseHex = stringTo5BitHex('TRUE LOVE');
    const matches = scanHexForWords(phraseHex, 0, { detectPhrases: true });

    const phrase = matches.find(m => m.word === 'TRUE LOVE');
    expect(phrase).toBeDefined();
    expect(phrase?.isPhrase).toBe(true);
    expect(phrase?.phraseType).toBe('ADJ_NOUN');
    expect(phrase?.rarityTier).toBe('EPIC');
    expect(phrase?.wordCount).toBe(2);
    expect(phrase?.encoding).toBe('5-BIT');
  });
});
