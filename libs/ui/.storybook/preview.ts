import { inject, provideAppInitializer } from '@angular/core';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { provideTransloco, TranslocoLoader, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { applicationConfig, Preview } from '@storybook/angular-vite';
import { DEFAULT_LANGUAGE, LANGUAGE_CODES, LANGUAGES, LOCALES } from '@top-nosh/domain';
import { firstValueFrom, from, Observable } from 'rxjs';
import { provideUiLocales } from '../src/i18n/ui-locales';

class StorybookTranslocoLoader implements TranslocoLoader {
  getTranslation(lang: string): Observable<Record<string, unknown>> {
    return from(fetch(`/assets/i18n/${lang}.json`).then(r => r.json()));
  }
}

const palettes = [
  'chartreuse',
  'red',
  'green',
  'blue',
  'yellow',
  'cyan',
  'magenta',
  'orange',
  'spring-green',
  'azure',
  'violet',
  'rose'
];

const preview: Preview = {
  decorators: [
    applicationConfig({
      providers: [
        provideTransloco({
          config: {
            availableLangs: [ ...LANGUAGE_CODES ],
            defaultLang: DEFAULT_LANGUAGE,
            reRenderOnLangChange: true
          },
          loader: StorybookTranslocoLoader
        }),
        provideTranslocoMessageformat({ locales: LANGUAGES.map(language => language.locale) }),
        provideUiLocales({ locales: LOCALES, defaultLocale: LOCALES[DEFAULT_LANGUAGE] }),
        // Render stories only after the active language has loaded, so the
        // a11y checks never see a control whose label is still pending. A
        // failed load is logged, not thrown: stories still render, untranslated.
        provideAppInitializer(() => {
          const transloco = inject(TranslocoService);
          return firstValueFrom(transloco.load(transloco.getActiveLang())).catch((error: unknown) => {
            console.error('Storybook: could not load translations', error);
          });
        }),
        provideRouter([], withDisabledInitialNavigation())
      ]
    }),
    (story, ctx) => {
      document.body.classList.remove('light', 'dark', ...palettes);
      document.body.classList.add(ctx.globals['scheme'], ctx.globals['palette']);
      return story();
    }
  ],
  globalTypes: {
    scheme: {
      description: 'Color scheme',
      toolbar: {
        title: 'Scheme',
        icon: 'circlehollow',
        items: [ 'light', 'dark' ],
        dynamicTitle: true
      }
    },
    palette: {
      description: 'Theme palette',
      toolbar: {
        title: 'Palette',
        icon: 'paintbrush',
        items: palettes,
        dynamicTitle: true
      }
    }
  },
  initialGlobals: { scheme: 'light', palette: 'chartreuse' },
  parameters: {
    a11y: { test: 'error' },
    layout: 'padded'
  }
};

export default preview;
