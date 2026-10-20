import { describe, it, expect } from 'vitest';
import { classifyPhrase } from '../src/grammar';
import { scanHexForWords } from '../src/matcher';
import { hexToAscii } from '../src/bbp';

describe('Semantic Grammar & Multi-word Phrase Stitcher', () => {
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

  it('detects multi-word phrases from a raw hex stream with spaces or adjacent words', () => {
    // "TRUE LOVE" in ASCII:
    // T(54) R(52) U(55) E(45) Space(20) L(4C) O(4F) V(56) E(45)
    // Hex: 54525545204C4F5645
    const fakeHex = '0011' + '54525545204C4F5645' + '2233';
    const matches = scanHexForWords(fakeHex, 0, { detectPhrases: true });

    const phrase = matches.find(m => m.word === 'TRUE LOVE');
    expect(phrase).toBeDefined();
    expect(phrase?.isPhrase).toBe(true);
    expect(phrase?.phraseType).toBe('ADJ_NOUN');
    expect(phrase?.rarityTier).toBe('EPIC');
    expect(phrase?.wordCount).toBe(2);
  });
});
