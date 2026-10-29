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
import { authInterceptor } from '../auth/interceptors/auth/auth.interceptor';
import { baseUrlInterceptor } from '../system/interceptors/base-url/base-url.interceptor';
import { appRoutes } from './app.routes';
import { AppTitleStrategy } from './strategies/app-title.strategy';
import { TranslocoHttpLoader } from './transloco-loader';

export const translocoProviders: (Provider | EnvironmentProviders)[] = [
  provideTransloco({
    config: {
      availableLangs: [ 'en', 'ru' ],
      defaultLang: getBrowserLang(),
      reRenderOnLangChange: true,
      prodMode: !isDevMode(),
      fallbackLang: 'en'
    },
    loader: TranslocoHttpLoader
  }),
  provideTranslocoMessageformat({
    locales: [ 'en-GB', 'ru-RU' ]
  })
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
