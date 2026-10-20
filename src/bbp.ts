/**
 * Bailey-Borwein-Plouffe (BBP) Formula Digit Extraction Algorithm
 * 
 * Computes hexadecimal digits of Pi directly at an arbitrary starting position d.
 * Formula:
 *   pi = sum_{k=0}^infty (1/16^k) * (4/(8k+1) - 2/(8k+4) - 1/(8k+5) - 1/(8k+6))
 */

/**
 * Computes (base^exp) mod modulus for BigInt/numbers safely.
 */
export function modPow(base: number, exp: number, modulus: number): number {
  if (modulus === 1) return 0;
  let result = 1n;
  let b = BigInt(base) % BigInt(modulus);
  let e = BigInt(exp);
  const m = BigInt(modulus);

  while (e > 0n) {
    if (e & 1n) {
      result = (result * b) % m;
    }
    b = (b * b) % m;
    e >>= 1n;
  }

  return Number(result);
}

/**
 * Computes { 16^d * S_j } mod 1, where S_j = sum_{k=0}^inf 1 / (16^k * (8k + j))
 * @param j Component offset (1, 4, 5, or 6)
 * @param d 0-indexed position after the hexadecimal point
 */
export function seriesSum(j: number, d: number): number {
  let s = 0;

  // First finite sum: k = 0 to d
  for (let k = 0; k <= d; k++) {
    const denominator = 8 * k + j;
    const numerator = modPow(16, d - k, denominator);
    s += numerator / denominator;
    s = s - Math.floor(s); // Keep fractional part
  }

  // Second infinite tail: k = d + 1 onwards (converges exponentially, ~15 terms is sufficient)
  let termPower = 1.0;
  for (let k = d + 1; ; k++) {
    termPower /= 16.0;
    if (termPower === 0 || termPower < 1e-15) break;
    const term = termPower / (8 * k + j);
    if (term < 1e-17) break;
    s += term;
    s = s - Math.floor(s);
  }

  return s;
}

/**
 * Returns fractional part { 16^d * pi } mod 1
 * @param d 0-based index of the fractional hex digit (d = 0 gives digits starting immediately after 3.)
 */
export function bbpFraction(d: number): number {
  const s1 = seriesSum(1, d);
  const s4 = seriesSum(4, d);
  const s5 = seriesSum(5, d);
  const s6 = seriesSum(6, d);

  let frac = 4.0 * s1 - 2.0 * s4 - s5 - s6;
  frac = frac - Math.floor(frac);
  if (frac < 0) {
    frac += 1.0;
  }
  return frac;
}

/**
 * Calculates a single hexadecimal digit of Pi at position d (0-indexed after the decimal).
 * For example:
 *   d = 0 -> '2'
 *   d = 1 -> '4'
 *   d = 2 -> '3'
 *   d = 3 -> 'F'
 */
export function getPiHexDigit(d: number): string {
  const frac = bbpFraction(d);
  const digitVal = Math.floor(16.0 * frac);
  return digitVal.toString(16).toUpperCase();
}

/**
 * Extracts a sequence of N hexadecimal digits starting from position d.
 * Notice: Each BBP evaluation yields ~8-10 accurate consecutive hex digits from the fraction.
 * For robust arbitrary lengths, we advance cleanly.
 * @param startDigit 0-indexed starting position
 * @param count Number of hex digits to retrieve
 */
export function getPiHexDigits(startDigit: number, count: number): string {
  let hexString = '';
  // Since 1 bbpFraction call gives ~8 digits of precision, we can jump by 4 to 8 digits,
  // or compute directly for guaranteed precision.
  for (let i = 0; i < count; i++) {
    hexString += getPiHexDigit(startDigit + i);
  }
  return hexString;
}

/**
 * Converts a hex string into an array of binary bits (4 bits per hex character).
 */
export function hexToBinary(hex: string): string {
  let binary = '';
  for (let i = 0; i < hex.length; i++) {
    const val = parseInt(hex[i], 16);
    if (!isNaN(val)) {
      binary += val.toString(2).padStart(4, '0');
    }
  }
  return binary;
}

/**
 * Decodes 8-bit bytes from a hex string into ASCII / UTF-8 text characters.
 * Replaces non-printable control characters with placeholder if requested.
 */
export function hexToAscii(hex: string, options: { replaceNonPrintable?: boolean } = {}): {
  raw: string;
  bytes: number[];
  printable: string;
} {
  const bytes: number[] = [];
  let raw = '';
  let printable = '';

  // Process pairs of hex digits (1 byte = 2 hex chars = 8 bits)
  const evenLen = hex.length - (hex.length % 2);
  for (let i = 0; i < evenLen; i += 2) {
    const byte = parseInt(hex.slice(i, i + 2), 16);
    bytes.push(byte);
    const char = String.fromCharCode(byte);
    raw += char;
    // ASCII 32 (space) to 126 (~) are printable characters
    if (byte >= 32 && byte <= 126) {
      printable += char;
    } else {
      printable += options.replaceNonPrintable ? '·' : ' ';
    }
  }

  return { raw, bytes, printable };
}

/**
 * Sliding bit-window decoder:
 * Allows shifting the binary bit stream by bitOffset (0 to 7) before grouping into 8-bit bytes.
 * This is crucial because text might not be byte-aligned to the arbitrary starting hex boundary!
 */
export function binaryStreamToAscii(binary: string, bitOffset = 0): string {
  let result = '';
  for (let i = bitOffset; i + 8 <= binary.length; i += 8) {
    const byteVal = parseInt(binary.slice(i, i + 8), 2);
    if (byteVal >= 32 && byteVal <= 126) {
      result += String.fromCharCode(byteVal);
    } else {
      result += '·';
    }
  }
  return result;
}
