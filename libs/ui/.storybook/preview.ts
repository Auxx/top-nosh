import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { provideTransloco, TranslocoLoader } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { applicationConfig, Preview } from '@storybook/angular-vite';
import { from, Observable } from 'rxjs';

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
            availableLangs: [ 'en', 'ru' ],
            defaultLang: 'en',
            reRenderOnLangChange: true
          },
          loader: StorybookTranslocoLoader
        }),
        provideTranslocoMessageformat({ locales: [ 'en-GB', 'ru-RU' ] }),
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
