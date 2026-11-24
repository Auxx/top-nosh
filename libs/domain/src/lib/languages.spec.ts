import { DEFAULT_LANGUAGE, LANGUAGE_CODES, LOCALES } from './languages';

describe('languages', () => {
  it('lists the supported language codes', () => {
    expect(LANGUAGE_CODES).toEqual([ 'en', 'ru' ]);
  });

  it('maps each language to its locale', () => {
    expect(LOCALES).toEqual({ en: 'en-GB', ru: 'ru-RU' });
  });

  it('defaults to a supported language', () => {
    expect(DEFAULT_LANGUAGE).toBe('en');
    expect(LANGUAGE_CODES).toContain(DEFAULT_LANGUAGE);
  });
});
