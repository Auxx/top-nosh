// Punycode decoding (RFC 3492), used only to show IDN hostnames in Unicode.
// Browsers have no public API for this, and `new URL()` always returns the
// ASCII ("xn--") form of a hostname.

const base = 36;
const tMin = 1;
const tMax = 26;
const skew = 38;
const damp = 700;
const initialBias = 72;
const initialN = 128;

function adapt(delta: number, numPoints: number, firstTime: boolean): number {
  delta = firstTime ? Math.floor(delta / damp) : delta >> 1;
  delta += Math.floor(delta / numPoints);
  let k = 0;
  while (delta > ((base - tMin) * tMax) >> 1) {
    delta = Math.floor(delta / (base - tMin));
    k += base;
  }
  return k + Math.floor(((base - tMin + 1) * delta) / (delta + skew));
}

function digitValue(codePoint: number): number {
  if (codePoint >= 0x30 && codePoint <= 0x39) {
    return codePoint - 22; // 0-9 → 26-35
  }
  if (codePoint >= 0x41 && codePoint <= 0x5a) {
    return codePoint - 0x41; // A-Z → 0-25
  }
  if (codePoint >= 0x61 && codePoint <= 0x7a) {
    return codePoint - 0x61; // a-z → 0-25
  }
  return base;
}

/** Decodes one Punycode string (without the `xn--` prefix). Throws on invalid input. */
function decode(input: string): string {
  const output: number[] = [];
  const basicEnd = Math.max(input.lastIndexOf('-'), 0);
  for (let j = 0; j < basicEnd; j++) {
    output.push(input.charCodeAt(j));
  }

  let n = initialN;
  let bias = initialBias;
  let i = 0;
  for (let index = basicEnd > 0 ? basicEnd + 1 : 0; index < input.length;) {
    const oldI = i;
    for (let w = 1, k = base;; k += base) {
      if (index >= input.length) {
        throw new RangeError('Invalid punycode');
      }
      const digit = digitValue(input.charCodeAt(index++));
      if (digit >= base) {
        throw new RangeError('Invalid punycode');
      }
      i += digit * w;
      const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
      if (digit < t) {
        break;
      }
      w *= base - t;
    }
    const length = output.length + 1;
    bias = adapt(i - oldI, length, oldI === 0);
    n += Math.floor(i / length);
    i %= length;
    output.splice(i++, 0, n);
  }
  return String.fromCodePoint(...output);
}

/** Converts each `xn--` label of an ASCII hostname to Unicode; invalid labels stay as they are. */
export function hostnameToUnicode(hostname: string): string {
  return hostname
    .split('.')
    .map(label => {
      if (!label.toLowerCase().startsWith('xn--')) {
        return label;
      }
      try {
        return decode(label.slice(4));
      } catch {
        return label;
      }
    })
    .join('.');
}
