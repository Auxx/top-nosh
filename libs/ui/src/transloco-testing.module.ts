import { TranslocoTestingModule, TranslocoTestingOptions } from '@jsverse/transloco';

export function getTranslocoModule(options: TranslocoTestingOptions = {}) {
  return TranslocoTestingModule.forRoot({
    langs: { en: {} },
    translocoConfig: {
      availableLangs: [ 'en' ],
      defaultLang: 'en'
    },
    preloadLangs: true,
    ...options
  });
}
