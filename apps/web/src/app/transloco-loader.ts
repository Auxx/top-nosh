import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { HTTP_AUTH_ENABLED } from '../auth/interceptors/auth/auth.interceptor.types';
import { HTTP_BASE_URL_ENABLED } from '../system/interceptors/base-url/base-url.interceptor.types';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);

  getTranslation = (lang: string) =>
    this.http.get<Translation>(
      `/assets/i18n/${lang}.json`,
      {
        context: new HttpContext()
          .set(HTTP_AUTH_ENABLED, false)
          .set(HTTP_BASE_URL_ENABLED, false)
      }
    );
}
