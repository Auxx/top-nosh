/** Languages the application is translated into, with the locale used for formatting. */
export const LANGUAGES = [
  { code: 'en', locale: 'en-GB' },
  { code: 'ru', locale: 'ru-RU' }
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export const LANGUAGE_CODES: readonly LanguageCode[] = LANGUAGES.map(language => language.code);

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const LOCALES = Object.fromEntries(
  LANGUAGES.map(language => [ language.code, language.locale ])
) as Readonly<Record<LanguageCode, string>>;
