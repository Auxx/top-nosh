import { DomainPipe } from './domain.pipe';

describe('DomainPipe', () => {
  const pipe = new DomainPipe();

  it('returns the hostname of an absolute URL', () => {
    expect(pipe.transform('https://www.example.com/recipes/1?x=2')).toBe('www.example.com');
    expect(pipe.transform('http://localhost:5999/a')).toBe('localhost');
  });

  it('returns the input unchanged when it is not a URL', () => {
    expect(pipe.transform('Grandma\'s notebook')).toBe('Grandma\'s notebook');
  });

  it('returns an empty string for empty input', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('works where URL.parse is unavailable (iOS 17)', () => {
    const original = (URL as { parse?: unknown; }).parse;
    delete (URL as { parse?: unknown; }).parse;
    try {
      expect(pipe.transform('https://example.com/x')).toBe('example.com');
    } finally {
      (URL as { parse?: unknown; }).parse = original;
    }
  });

  it('shows internationalised hostnames in Unicode', () => {
    expect(pipe.transform('https://bücher.de/rezept')).toBe('bücher.de');
    expect(pipe.transform('https://xn--bcher-kva.de/')).toBe('bücher.de');
    expect(pipe.transform('https://www.xn--caf-dma.com/menu')).toBe('www.café.com');
  });
});
