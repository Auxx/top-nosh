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
});
