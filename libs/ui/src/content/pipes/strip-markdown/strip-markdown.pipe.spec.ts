import { StripMarkdownPipe } from './strip-markdown.pipe';

describe('StripMarkdownPipe', () => {
  let pipe: StripMarkdownPipe;

  beforeEach(() => {
    pipe = new StripMarkdownPipe();
  });

  it('should return empty string for null, undefined or empty input', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('should strip markdown headers', () => {
    expect(pipe.transform('# Header 1\n## Header 2\n### Header 3')).toBe('Header 1 Header 2 Header 3');
  });

  it('should strip bold, italic, and strikethrough formatting', () => {
    expect(pipe.transform('**bold** and *italic* and ***bold-italic*** and ~~strike~~')).toBe(
      'bold and italic and bold-italic and strike'
    );
    expect(pipe.transform('__bold__ and _italic_ and ___bold-italic___')).toBe(
      'bold and italic and bold-italic'
    );
  });

  it('should strip links and images leaving text/alt', () => {
    expect(pipe.transform('Click [here](https://example.com) for details and ![alt image](img.png)')).toBe(
      'Click here for details and alt image'
    );
  });

  it('should strip inline code and fenced code blocks', () => {
    const input = 'Use `npm install` to install.\n```ts\nconst x = 1;\n```\nDone.';
    expect(pipe.transform(input)).toBe('Use npm install to install. Done.');
  });

  it('should strip list markers, blockquotes and horizontal rules', () => {
    const input = '> Quote\n- Item 1\n* Item 2\n+ Item 3\n1. Numbered\n---';
    expect(pipe.transform(input)).toBe('Quote Item 1 Item 2 Item 3 Numbered');
  });

  it('should strip html tags', () => {
    expect(pipe.transform('<p>Paragraph with <strong>HTML</strong></p>')).toBe('Paragraph with HTML');
  });

  it('should trim and normalize whitespace', () => {
    expect(pipe.transform('  Multiple   spaces \n\n and newlines  ')).toBe('Multiple spaces and newlines');
  });

  it('should keep underscores inside words', () => {
    expect(pipe.transform('use snake_case_name and my_file_v2.txt')).toBe('use snake_case_name and my_file_v2.txt');
  });

  it('should keep spaced asterisks used as operators', () => {
    expect(pipe.transform('2 * 3 * 4 = 24')).toBe('2 * 3 * 4 = 24');
  });

  it('should strip emphasis around a phrase with punctuation', () => {
    expect(pipe.transform('**Prep ahead:** chill overnight')).toBe('Prep ahead: chill overnight');
  });

  it('should remove *** and ___ horizontal rules without leftovers', () => {
    expect(pipe.transform('a\n***\nb')).toBe('a b');
    expect(pipe.transform('a\n___\nb')).toBe('a b');
  });

  it('should keep unspaced asterisks between digits and letters', () => {
    expect(pipe.transform('2*3*4 = 24')).toBe('2*3*4 = 24');
    expect(pipe.transform('Rated 4*/5* by me')).toBe('Rated 4*/5* by me');
  });

  it('should remove bullets inside blockquotes', () => {
    expect(pipe.transform('> * quoted item\n> - another')).toBe('quoted item another');
  });
});
