import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { authInterceptor } from '../auth/interceptors/auth/auth.interceptor';
import { baseUrlInterceptor } from '../system/interceptors/base-url/base-url.interceptor';
import { appRoutes } from './app.routes';
import { AppTitleStrategy } from './strategies/app-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([ baseUrlInterceptor, authInterceptor ])),
    { provide: TitleStrategy, useClass: AppTitleStrategy }
  ]
};
