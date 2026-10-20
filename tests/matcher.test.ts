import { describe, it, expect } from 'vitest';
import { scanHexForWords } from '../src/matcher';
import { getPiHexDigits } from '../src/bbp';

describe('Linguistic Matcher & Word Discovery', () => {
  it('detects a known word from a raw hex string', () => {
    // ASCII for "LOVE": 'L' (4C), 'O' (4F), 'V' (56), 'E' (45)
    // Hex: 4C4F5645
    const fakeHex = '0011224C4F56453344';
    const matches = scanHexForWords(fakeHex, 100);

    const loveMatch = matches.find(m => m.word === 'LOVE');
    expect(loveMatch).toBeDefined();
    expect(loveMatch?.word).toBe('LOVE');
    expect(loveMatch?.digitStart).toBe(106); // 6 hex digits before '4C4F5645' (3 bytes)
  });

  it('detects words across bit shifts', () => {
    // "SUN": S=0x53, U=0x55, N=0x4E
    // In binary: 01010011 01010101 01001110
    // If we shift it right by 1 bit (prefix 1 zero):
    // 00101001 10101010 10100111 00000000 -> Hex: 29AA A700
    const shiftedHex = '29AAA700';
    const matches = scanHexForWords(shiftedHex, 0, { checkBitShifts: true });
    const sunMatch = matches.find(m => m.word === 'SUN');
    expect(sunMatch).toBeDefined();
    expect(sunMatch?.bitOffset).toBe(1);
  });

  it('scans the first 120 hex digits of Pi without crashing and returns any matches', () => {
    const piHex = getPiHexDigits(0, 120);
    const matches = scanHexForWords(piHex, 0);
    expect(Array.isArray(matches)).toBe(true);
    // Even if no long word occurs in the first 120 digits, it should execute smoothly
  });
});
