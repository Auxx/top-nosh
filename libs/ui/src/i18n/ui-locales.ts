import { InjectionToken, Provider } from '@angular/core';

/** Maps Transloco language codes to the locales used for number formatting. */
export interface UiLocales {
  locales: Readonly<Record<string, string>>;
  /** Used for a language missing from `locales`. Empty means "use the language code". */
  defaultLocale: string;
}

export const UI_LOCALES = new InjectionToken<UiLocales>('UI_LOCALES', {
  factory: () => ({ locales: {}, defaultLocale: '' })
});

export function provideUiLocales(config: UiLocales): Provider {
  return { provide: UI_LOCALES, useValue: config };
}

/**
 * The locale to format numbers with for `lang`: its mapped locale, else
 * `defaultLocale`, else `lang` itself. Candidates that are not valid BCP 47
 * tags (e.g. `en_US`) are skipped, because `Intl` throws on them; `undefined`
 * means "use the runtime's default locale".
 */
export function resolveUiLocale(config: UiLocales, lang: string): string | undefined {
  return [ config.locales[lang], config.defaultLocale, lang ].find(isValidLocale);
}

function isValidLocale(tag: string | undefined): tag is string {
  if (!tag) {
    return false;
  }

  try {
    return Intl.getCanonicalLocales(tag).length > 0;
  } catch {
    return false;
  }
}
