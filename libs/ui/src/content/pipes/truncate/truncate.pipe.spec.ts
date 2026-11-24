import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  it('should return empty string for null, undefined or empty input', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('should not truncate string with length <= limit', () => {
    const text100 = 'a'.repeat(100);
    expect(pipe.transform(text100, 100)).toBe(text100);

    const shortText = 'Hello world';
    expect(pipe.transform(shortText, 100)).toBe('Hello world');
  });

  it('should truncate string with length > limit and append default ellipsis', () => {
    const text101 = 'a'.repeat(101);
    expect(pipe.transform(text101, 100)).toBe('a'.repeat(100) + '…');
  });

  it('should support custom limit and ellipsis', () => {
    expect(pipe.transform('Hello World', 5, ' [more]')).toBe('Hello [more]');
  });

  it('cuts back to the last word boundary', () => {
    expect(pipe.transform('The quick brown fox', 12)).toBe('The quick…');
  });

  it('hard-cuts a single long word', () => {
    expect(pipe.transform('https://example.com/very/long/path', 10)).toBe('https://ex…');
  });

  it('never splits a grapheme cluster', () => {
    expect(pipe.transform('👍🏽👍🏽👍🏽', 2)).toBe('👍🏽👍🏽…');
    expect(pipe.transform('cafe\u0301 au lait', 4)).toBe('cafe\u0301…');
  });

  it('counts graphemes, not code units, against the limit', () => {
    expect(pipe.transform('👍🏽👍🏽', 2)).toBe('👍🏽👍🏽');
  });
});
