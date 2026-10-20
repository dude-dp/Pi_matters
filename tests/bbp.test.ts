import { describe, it, expect } from 'vitest';
import { getPiHexDigit, getPiHexDigits, hexToBinary, hexToAscii, binaryStreamToAscii, modPow, fiveBitToChar, charToFiveBit, binaryStreamTo5BitText } from '../src/bbp';

describe('BBP Formula & Hexadecimal Extractor', () => {
  it('correctly calculates modPow', () => {
    expect(modPow(16, 0, 5)).toBe(1);
    expect(modPow(16, 2, 7)).toBe(4); // 256 mod 7 = 4
    expect(modPow(16, 5, 13)).toBe(9); // 1048576 mod 13 = 9
  });

  it('extracts the exact first hex digits of Pi (2, 4, 3, F, 6, A, 8, 8)', () => {
    // Known Pi fractional hex sequence: 2 4 3 F 6 A 8 8 8 5 A 3 0 8 D 3
    expect(getPiHexDigit(0)).toBe('2');
    expect(getPiHexDigit(1)).toBe('4');
    expect(getPiHexDigit(2)).toBe('3');
    expect(getPiHexDigit(3)).toBe('F');
    expect(getPiHexDigit(4)).toBe('6');
    expect(getPiHexDigit(5)).toBe('A');
    expect(getPiHexDigit(6)).toBe('8');
    expect(getPiHexDigit(7)).toBe('8');
  });

  it('extracts a continuous hex stream matching ground truth', () => {
    const expected = '243F6A8885A308D313198A2E03707344';
    const computed = getPiHexDigits(0, expected.length);
    expect(computed).toBe(expected);
  });

  it('converts hex to binary accurately (4 bits per hex digit)', () => {
    // '2' -> '0010', '4' -> '0100', '3' -> '0011', 'F' -> '1111'
    expect(hexToBinary('243F')).toBe('0010010000111111');
  });

  it('converts hex to ASCII bytes and handles printable characters', () => {
    // '48656C6C6F' = 'Hello'
    const result = hexToAscii('48656C6C6F');
    expect(result.printable).toBe('Hello');
    expect(result.bytes).toEqual([72, 101, 108, 108, 111]);
  });

  it('supports sliding bit-window conversion', () => {
    // 'Hello' in binary:
    // 'H' (72) = 01001000
    // If we prefix 1 zero bit: 0 + 01001000...
    const helloBin = '01001000';
    const shifted = '0' + helloBin;
    expect(binaryStreamToAscii(shifted, 1)).toBe('H');
  });

  it('accurately encodes and decodes 5-bit Natural Alphabet (A=1..Z=26, 0=Space)', () => {
    expect(fiveBitToChar(1)).toBe('A');
    expect(fiveBitToChar(26)).toBe('Z');
    expect(fiveBitToChar(0)).toBe(' ');
    expect(fiveBitToChar(31)).toBe(' ');
    expect(fiveBitToChar(27)).toBe('.');

    // "PI" in 5-bit: P = 16 (10000), I = 9 (01001) -> "1000001001"
    const piBin = charToFiveBit('P') + charToFiveBit('I');
    expect(binaryStreamTo5BitText(piBin)).toBe('PI');
  });
});
