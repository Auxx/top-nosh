import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  EnvironmentProviders,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  Provider
} from '@angular/core';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { getBrowserLang, provideTransloco } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { DEFAULT_LANGUAGE, LANGUAGE_CODES, LANGUAGES, LOCALES } from '@top-nosh/domain';
import { provideUiLocales } from '@top-nosh/ui';
import { authInterceptor } from '../auth/interceptors/auth/auth.interceptor';
import { baseUrlInterceptor } from '../system/interceptors/base-url/base-url.interceptor';
import { appRoutes } from './app.routes';
import { AppTitleStrategy } from './strategies/app-title.strategy';
import { TranslocoHttpLoader } from './transloco-loader';

export const translocoProviders: (Provider | EnvironmentProviders)[] = [
  provideTransloco({
    config: {
      availableLangs: [ ...LANGUAGE_CODES ],
      defaultLang: getBrowserLang(),
      reRenderOnLangChange: true,
      prodMode: !isDevMode(),
      fallbackLang: DEFAULT_LANGUAGE
    },
    loader: TranslocoHttpLoader
  }),
  provideTranslocoMessageformat({
    locales: LANGUAGES.map(language => language.locale)
  }),
  provideUiLocales({ locales: LOCALES, defaultLocale: LOCALES[DEFAULT_LANGUAGE] })
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([ baseUrlInterceptor, authInterceptor ])),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    ...translocoProviders
  ]
};
