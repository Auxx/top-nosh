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
    expect(pipe.transform(text101, 100)).toBe('a'.repeat(100) + '...');
  });

  it('should support custom limit and ellipsis', () => {
    expect(pipe.transform('Hello World', 5, ' [more]')).toBe('Hello [more]');
  });
});
