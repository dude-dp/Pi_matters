import { hexToBinary, fiveBitToChar } from './bbp';
import { DICTIONARY_SET } from './dictionary';
import { classifyPhrase, PhraseType, RarityTier } from './grammar';

export interface DiscoveredMatch {
  word: string;
  length: number;
  digitStart: number;
  digitEnd: number;
  hexSnippet: string;
  binarySnippet: string;
  decodedAscii: string;
  bitOffset: number;
  isPhrase: boolean;
  phraseType: PhraseType;
  phraseLabel: string;
  rarityTier: RarityTier;
  wordCount: number;
  encoding: '5-BIT';
}

interface DetectedToken {
  word: string;
  charStart: number;
  charEnd: number;
  bitStart: number;
  bitEnd: number;
}

/**
 * High-Density 5-Bit Natural Alphabet Word & Phrase Scanner
 * 
 * Maps 5 bits to A-Z (1-26) with 0 and 31 as Space/Delimiters.
 * Scans all 5 bit-alignment shifts (0, 1, 2, 3, 4) for maximum linguistic density.
 * 
 * @param hex The hexadecimal string segment of Pi
 * @param startDigitIndex The 0-based global fractional digit index in Pi
 * @param options Scanning configuration options
 */
export function scanHexForWords(
  hex: string,
  startDigitIndex: number,
  options: {
    minLength?: number;
    maxLength?: number;
    checkBitShifts?: boolean;
    detectPhrases?: boolean;
  } = {}
): DiscoveredMatch[] {
  const minLength = options.minLength ?? 3;
  const maxLength = options.maxLength ?? 12;
  const checkBitShifts = options.checkBitShifts ?? true;
  const detectPhrases = options.detectPhrases ?? true;
  
  // 5 possible bit shifts for 5-bit block alignment
  const bitShifts = checkBitShifts ? [0, 1, 2, 3, 4] : [0];

  const binary = hexToBinary(hex);
  const matches: DiscoveredMatch[] = [];
  const seenKeys = new Set<string>();

  for (const bitOffset of bitShifts) {
    // Decode bits into 5-bit characters at this bitOffset
    const chars: { char: string; index: number; bitPos: number }[] = [];
    for (let b = bitOffset; b + 5 <= binary.length; b += 5) {
      const val = parseInt(binary.slice(b, b + 5), 2);
      chars.push({
        char: fiveBitToChar(val),
        index: chars.length,
        bitPos: b
      });
    }

    const fullString = chars.map(c => c.char).join('');
    const tokensAtOffset: DetectedToken[] = [];

    // 1. Detect single dictionary words
    for (let len = minLength; len <= maxLength; len++) {
      for (let i = 0; i + len <= fullString.length; i++) {
        const candidate = fullString.slice(i, i + len).toUpperCase();

        // Must be purely alphabetic (A-Z)
        if (!/^[A-Z]+$/.test(candidate)) continue;

        if (DICTIONARY_SET.has(candidate)) {
          const startBit = chars[i].bitPos;
          const endBit = chars[i + len - 1].bitPos + 5;

          tokensAtOffset.push({
            word: candidate,
            charStart: i,
            charEnd: i + len,
            bitStart: startBit,
            bitEnd: endBit
          });

          const hexDigitStart = startDigitIndex + Math.floor(startBit / 4);
          const hexDigitEnd = startDigitIndex + Math.ceil(endBit / 4);

          const key = `WORD-${candidate}-${hexDigitStart}-${hexDigitEnd}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);

            const localHexStart = Math.max(0, Math.floor(startBit / 4) - 4);
            const localHexEnd = Math.min(hex.length, Math.ceil(endBit / 4) + 4);
            const hexSnippet = hex.slice(localHexStart, localHexEnd);
            const binarySnippet = binary.slice(Math.max(0, startBit - 5), Math.min(binary.length, endBit + 5));

            const asciiContextStart = Math.max(0, i - 3);
            const asciiContextEnd = Math.min(fullString.length, i + len + 3);
            const decodedAscii = fullString.slice(asciiContextStart, asciiContextEnd);

            const classification = classifyPhrase([candidate]);

            matches.push({
              word: candidate,
              length: candidate.length,
              digitStart: hexDigitStart,
              digitEnd: hexDigitEnd,
              hexSnippet,
              binarySnippet,
              decodedAscii,
              bitOffset,
              isPhrase: false,
              phraseType: 'WORD',
              phraseLabel: classification.label,
              rarityTier: classification.rarityTier,
              wordCount: 1,
              encoding: '5-BIT'
            });
          }
        }
      }
    }

    // 2. Multi-word Semantic Phrase Stitcher (Bigrams & Trigrams)
    if (detectPhrases && tokensAtOffset.length >= 2) {
      const sortedTokens = [...tokensAtOffset].sort((a, b) => a.charStart - b.charStart || a.charEnd - b.charEnd);

      for (let i = 0; i < sortedTokens.length; i++) {
        const t1 = sortedTokens[i];

        for (let j = i + 1; j < sortedTokens.length; j++) {
          const t2 = sortedTokens[j];

          const charGap = t2.charStart - t1.charEnd;
          if (charGap < 0) continue; // overlapping tokens
          if (charGap > 1) break; // too far apart

          // In 5-bit encoding, gap == 1 must be a space or punctuation delimiter
          if (charGap === 1 && fullString[t1.charEnd] !== ' ' && fullString[t1.charEnd] !== ',' && fullString[t1.charEnd] !== '.') {
            continue;
          }

          const bigramWords = [t1.word, t2.word];
          const phraseText = bigramWords.join(' ');
          const classification = classifyPhrase(bigramWords);

          const startBit = t1.bitStart;
          const endBit = t2.bitEnd;
          const hexDigitStart = startDigitIndex + Math.floor(startBit / 4);
          const hexDigitEnd = startDigitIndex + Math.ceil(endBit / 4);

          const phraseKey = `PHRASE-${phraseText}-${hexDigitStart}-${hexDigitEnd}`;
          if (!seenKeys.has(phraseKey)) {
            seenKeys.add(phraseKey);

            const localHexStart = Math.max(0, Math.floor(startBit / 4) - 4);
            const localHexEnd = Math.min(hex.length, Math.ceil(endBit / 4) + 4);
            const hexSnippet = hex.slice(localHexStart, localHexEnd);
            const binarySnippet = binary.slice(Math.max(0, startBit - 5), Math.min(binary.length, endBit + 5));

            const asciiContextStart = Math.max(0, t1.charStart - 3);
            const asciiContextEnd = Math.min(fullString.length, t2.charEnd + 3);
            const decodedAscii = fullString.slice(asciiContextStart, asciiContextEnd);

            matches.push({
              word: phraseText,
              length: phraseText.length,
              digitStart: hexDigitStart,
              digitEnd: hexDigitEnd,
              hexSnippet,
              binarySnippet,
              decodedAscii,
              bitOffset,
              isPhrase: true,
              phraseType: classification.phraseType,
              phraseLabel: classification.label,
              rarityTier: classification.rarityTier,
              wordCount: 2,
              encoding: '5-BIT'
            });
          }

          // Trigram: 3 consecutive words
          for (let k = j + 1; k < sortedTokens.length; k++) {
            const t3 = sortedTokens[k];
            const gap3 = t3.charStart - t2.charEnd;
            if (gap3 < 0) continue;
            if (gap3 > 1) break;

            const trigramWords = [t1.word, t2.word, t3.word];
            const trigramText = trigramWords.join(' ');
            const triClass = classifyPhrase(trigramWords);

            const triStartBit = t1.bitStart;
            const triEndBit = t3.bitEnd;
            const triHexStart = startDigitIndex + Math.floor(triStartBit / 4);
            const triHexEnd = startDigitIndex + Math.ceil(triEndBit / 4);

            const triKey = `TRI-${trigramText}-${triHexStart}-${triHexEnd}`;
            if (!seenKeys.has(triKey)) {
              seenKeys.add(triKey);

              const localHexStart = Math.max(0, Math.floor(triStartBit / 4) - 4);
              const localHexEnd = Math.min(hex.length, Math.ceil(triEndBit / 4) + 4);
              const hexSnippet = hex.slice(localHexStart, localHexEnd);
              const binarySnippet = binary.slice(Math.max(0, triStartBit - 5), Math.min(binary.length, triEndBit + 5));

              const asciiContextStart = Math.max(0, t1.charStart - 3);
              const asciiContextEnd = Math.min(fullString.length, t3.charEnd + 3);
              const decodedAscii = fullString.slice(asciiContextStart, asciiContextEnd);

              matches.push({
                word: trigramText,
                length: trigramText.length,
                digitStart: triHexStart,
                digitEnd: triHexEnd,
                hexSnippet,
                binarySnippet,
                decodedAscii,
                bitOffset,
                isPhrase: true,
                phraseType: triClass.phraseType,
                phraseLabel: triClass.label,
                rarityTier: triClass.rarityTier,
                wordCount: 3,
                encoding: '5-BIT'
              });
            }
          }
        }
      }
    }
  }

  // Priority sort: Phrases first, then by word count, then length, then digitStart
  return matches.sort((a, b) => {
    if (a.isPhrase !== b.isPhrase) return a.isPhrase ? -1 : 1;
    if (a.wordCount !== b.wordCount) return b.wordCount - a.wordCount;
    return b.length - a.length || a.digitStart - b.digitStart;
  });
}
