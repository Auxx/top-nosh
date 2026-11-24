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

export function resolveUiLocale(config: UiLocales, lang: string): string {
  return config.locales[lang] ?? (config.defaultLocale || lang);
}
