import { describe, it, expect } from 'vitest';
import { scanHexForWords } from '../src/matcher';
import { getPiHexDigits, charToFiveBit } from '../src/bbp';

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

describe('Linguistic Matcher & Word Discovery (5-Bit Alphabet)', () => {
  it('detects a known 5-bit encoded word from hex', () => {
    // Encode "LOVE" into 5-bit hex
    const loveHex = stringTo5BitHex('LOVE');
    const matches = scanHexForWords(loveHex, 0);

    const loveMatch = matches.find(m => m.word === 'LOVE');
    expect(loveMatch).toBeDefined();
    expect(loveMatch?.word).toBe('LOVE');
    expect(loveMatch?.encoding).toBe('5-BIT');
  });

  it('detects 5-bit words across bit shifts', () => {
    // "SUN" with 1 bit prefix
    let bin = '0'; // 1 bit offset
    for (const ch of 'SUN') {
      bin += charToFiveBit(ch);
    }
    while (bin.length % 4 !== 0) bin += '0';
    let hex = '';
    for (let i = 0; i < bin.length; i += 4) {
      hex += parseInt(bin.slice(i, i + 4), 2).toString(16).toUpperCase();
    }

    const matches = scanHexForWords(hex, 0, { checkBitShifts: true });
    const sunMatch = matches.find(m => m.word === 'SUN');
    expect(sunMatch).toBeDefined();
    expect(sunMatch?.bitOffset).toBe(1);
  });

  it('scans the first 120 hex digits of Pi without crashing and returns any matches', () => {
    const piHex = getPiHexDigits(0, 120);
    const matches = scanHexForWords(piHex, 0);
    expect(Array.isArray(matches)).toBe(true);
  });
});
