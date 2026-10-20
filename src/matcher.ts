import { hexToBinary } from './bbp';
import { DICTIONARY_SET } from './dictionary';

export interface DiscoveredMatch {
  word: string;
  length: number;
  digitStart: number;
  digitEnd: number;
  hexSnippet: string;
  binarySnippet: string;
  decodedAscii: string;
  bitOffset: number;
}

/**
 * Searches for valid English dictionary words inside a hexadecimal stream of Pi digits.
 * Tests multiple bit alignment offsets (0 to 7) to find words whether they are byte-aligned
 * or bit-shifted across arbitrary digit boundaries.
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
  } = {}
): DiscoveredMatch[] {
  const minLength = options.minLength ?? 3;
  const maxLength = options.maxLength ?? 12;
  const checkBitShifts = options.checkBitShifts ?? true;
  const bitShifts = checkBitShifts ? [0, 1, 2, 3, 4, 5, 6, 7] : [0];

  const binary = hexToBinary(hex);
  const matches: DiscoveredMatch[] = [];
  const seenKeys = new Set<string>();

  for (const bitOffset of bitShifts) {
    // Decode bits into characters at this bitOffset
    const chars: { char: string; byteIndex: number; bitPos: number }[] = [];
    for (let b = bitOffset; b + 8 <= binary.length; b += 8) {
      const byteVal = parseInt(binary.slice(b, b + 8), 2);
      // We accept printable ASCII range
      if (byteVal >= 32 && byteVal <= 126) {
        chars.push({
          char: String.fromCharCode(byteVal),
          byteIndex: chars.length,
          bitPos: b
        });
      } else {
        chars.push({
          char: '·',
          byteIndex: chars.length,
          bitPos: b
        });
      }
    }

    const fullString = chars.map(c => c.char).join('');

    // Check sliding windows of lengths minLength to maxLength
    for (let len = minLength; len <= maxLength; len++) {
      for (let i = 0; i + len <= fullString.length; i++) {
        const candidate = fullString.slice(i, i + len).toUpperCase();

        // Must be purely alphabetic (A-Z)
        if (!/^[A-Z]+$/.test(candidate)) continue;

        if (DICTIONARY_SET.has(candidate)) {
          // Calculate exact position in the Pi stream
          const startBit = chars[i].bitPos;
          const endBit = chars[i + len - 1].bitPos + 8; // exclusive end bit
          
          // 4 bits per hex digit
          const hexDigitStart = startDigitIndex + Math.floor(startBit / 4);
          const hexDigitEnd = startDigitIndex + Math.ceil(endBit / 4);

          // Unique key to prevent duplicate reports across overlapping offsets
          const key = `${candidate}-${hexDigitStart}-${hexDigitEnd}`;
          if (seenKeys.has(key)) continue;
          seenKeys.add(key);

          // Extract snippets for UI / context
          const localHexStart = Math.max(0, Math.floor(startBit / 4) - 4);
          const localHexEnd = Math.min(hex.length, Math.ceil(endBit / 4) + 4);
          const hexSnippet = hex.slice(localHexStart, localHexEnd);
          const binarySnippet = binary.slice(Math.max(0, startBit - 8), Math.min(binary.length, endBit + 8));

          const asciiContextStart = Math.max(0, i - 2);
          const asciiContextEnd = Math.min(fullString.length, i + len + 2);
          const decodedAscii = fullString.slice(asciiContextStart, asciiContextEnd);

          matches.push({
            word: candidate,
            length: candidate.length,
            digitStart: hexDigitStart,
            digitEnd: hexDigitEnd,
            hexSnippet,
            binarySnippet,
            decodedAscii,
            bitOffset
          });
        }
      }
    }
  }

  // Sort by length descending, then by position
  return matches.sort((a, b) => b.length - a.length || a.digitStart - b.digitStart);
}
