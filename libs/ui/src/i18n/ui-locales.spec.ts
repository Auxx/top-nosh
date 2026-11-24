import { resolveUiLocale } from './ui-locales';

describe('resolveUiLocale', () => {
  const config = { locales: { ru: 'ru-RU' }, defaultLocale: 'en-GB' };

  it('returns the mapped locale for a known language', () => {
    expect(resolveUiLocale(config, 'ru')).toBe('ru-RU');
  });

  it('returns the default locale for an unknown language', () => {
    expect(resolveUiLocale(config, 'de')).toBe('en-GB');
  });

  it('returns the language code when nothing is configured', () => {
    expect(resolveUiLocale({ locales: {}, defaultLocale: '' }, 'ru')).toBe('ru');
  });

  it('falls back to the default locale when the language code is not a valid locale', () => {
    expect(resolveUiLocale({ locales: {}, defaultLocale: 'en-GB' }, 'en_US')).toBe('en-GB');
  });

  it('falls back to the default locale when a mapped locale is invalid', () => {
    expect(resolveUiLocale({ locales: { en: 'en_GB' }, defaultLocale: 'en-GB' }, 'en')).toBe('en-GB');
  });

  it('returns undefined (runtime default) when nothing valid is available', () => {
    expect(resolveUiLocale({ locales: {}, defaultLocale: '' }, 'en_US')).toBeUndefined();
    expect(resolveUiLocale({ locales: {}, defaultLocale: 'not_valid' }, 'en_US')).toBeUndefined();
  });
});
