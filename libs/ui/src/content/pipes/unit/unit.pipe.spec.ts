import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTransloco, Translation, TranslocoLoader, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { Observable, of, Subject } from 'rxjs';
import { provideUiLocales } from '../../../i18n/ui-locales';
import { getTranslocoModule } from '../../../transloco-testing.module';
import { UnitPipe } from './unit.pipe';

const en = {
  GRAMS: '{quantity}g',
  ITEM_COUNT: '{count, plural, one {{quantity} item} other {{quantity} items}}',
  TSP: '{count, plural, one {{quantity} teaspoon} other {{quantity} teaspoons}}',
  TBSP: '{count, plural, one {{quantity} tablespoon} other {{quantity} tablespoons}}'
};

const ru = {
  GRAMS: '{quantity} г',
  ITEM_COUNT: '{quantity} шт.',
  TSP: '{quantity} ч. л.',
  TBSP: '{quantity} ст. л.'
};

describe('UnitPipe', () => {
  let pipe: UnitPipe;
  let transloco: TranslocoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        getTranslocoModule({
          langs: { en: { ui: { Unit: en } }, ru: { ui: { Unit: ru } } },
          translocoConfig: { availableLangs: [ 'en', 'ru' ], defaultLang: 'en' }
        })
      ],
      providers: [
        provideTranslocoMessageformat({ locales: [ 'en-GB', 'ru-RU' ] }),
        provideUiLocales({ locales: { en: 'en-GB', ru: 'ru-RU' }, defaultLocale: 'en-GB' }),
        { provide: ChangeDetectorRef, useValue: { markForCheck: jest.fn() } }
      ]
    });
    transloco = TestBed.inject(TranslocoService);
    pipe = TestBed.runInInjectionContext(() => new UnitPipe());
  });

  it('formats English grams without grouping', () => {
    expect(pipe.transform(200, 'GRAMS')).toBe('200g');
    expect(pipe.transform(1500, 'GRAMS')).toBe('1500g');
  });

  it('uses English plural forms', () => {
    expect(pipe.transform(1, 'ITEM_COUNT')).toBe('1 item');
    expect(pipe.transform(2, 'ITEM_COUNT')).toBe('2 items');
    expect(pipe.transform(0.5, 'TSP')).toBe('0.5 teaspoons');
    expect(pipe.transform(1, 'TBSP')).toBe('1 tablespoon');
    expect(pipe.transform(3, 'TBSP')).toBe('3 tablespoons');
  });

  it('accepts numeric strings', () => {
    expect(pipe.transform('2', 'ITEM_COUNT')).toBe('2 items');
  });

  it('formats Russian units and decimal comma', () => {
    transloco.setActiveLang('ru');
    expect(pipe.transform(0.5, 'TSP')).toBe('0,5 ч. л.');
    expect(pipe.transform(200, 'GRAMS')).toBe('200 г');
    expect(pipe.transform(3, 'ITEM_COUNT')).toBe('3 шт.');
  });

  it('updates output when the language changes', () => {
    expect(pipe.transform(1, 'TBSP')).toBe('1 tablespoon');
    transloco.setActiveLang('ru');
    expect(pipe.transform(1, 'TBSP')).toBe('1 ст. л.');
  });

  it('caps output at two decimals', () => {
    expect(pipe.transform(0.3333, 'GRAMS')).toBe('0.33g');
  });

  it('falls back to "<quantity> <unit>" for unknown units', () => {
    expect(pipe.transform(5, 'PINCH')).toBe('5 PINCH');
  });

  it('picks the plural form from the displayed (rounded) number', () => {
    expect(pipe.transform(0.999, 'TSP')).toBe('1 teaspoon');
    expect(pipe.transform(1.004, 'ITEM_COUNT')).toBe('1 item');
  });

  it('keeps a non-numeric quantity as written', () => {
    expect(pipe.transform('1/2', 'TSP')).toBe('1/2 teaspoons');
    expect(pipe.transform('1/2', 'PINCH')).toBe('1/2 PINCH');
    transloco.setActiveLang('ru');
    expect(pipe.transform('1/2', 'TSP')).toBe('1/2 ч. л.');
  });
});

describe('UnitPipe locale configuration', () => {
  const createPipe = (providers: unknown[]) => {
    TestBed.configureTestingModule({
      imports: [
        getTranslocoModule({
          langs: {
            en: { ui: { Unit: en } },
            ru: { ui: { Unit: ru } },
            de: { ui: { Unit: en } },
            en_US: { ui: { Unit: en } }
          },
          translocoConfig: { availableLangs: [ 'en', 'ru', 'de', 'en_US' ], defaultLang: 'en' }
        })
      ],
      providers: [
        provideTranslocoMessageformat({ locales: [ 'en-GB', 'ru-RU' ] }),
        { provide: ChangeDetectorRef, useValue: { markForCheck: jest.fn() } },
        ...(providers as [])
      ]
    });
    return {
      pipe: TestBed.runInInjectionContext(() => new UnitPipe()),
      transloco: TestBed.inject(TranslocoService)
    };
  };

  it('unknown language uses the default locale', () => {
    const { pipe, transloco } = createPipe([
      provideUiLocales({ locales: { en: 'en-GB', ru: 'ru-RU' }, defaultLocale: 'en-GB' })
    ]);
    transloco.setActiveLang('de');
    expect(pipe.transform(0.5, 'TSP')).toBe('0.5 teaspoons');
  });

  it('does not throw for a language code that is not a valid locale', () => {
    const { pipe, transloco } = createPipe([]);
    transloco.setActiveLang('en_US');
    expect(() => pipe.transform(0.5, 'TSP')).not.toThrow();
  });

  it('works without provideUiLocales', () => {
    const { pipe, transloco } = createPipe([]);
    transloco.setActiveLang('ru');
    expect(pipe.transform(0.5, 'TSP')).toBe('0,5 ч. л.');
  });
});

describe('UnitPipe while a language is loading', () => {
  const pending = new Subject<Translation>();

  class DeferredLoader implements TranslocoLoader {
    getTranslation(lang: string): Observable<Translation> {
      return lang === 'ru' ? pending : of({ ui: { Unit: en } });
    }
  }

  it('renders the fallback until the language loads, then re-renders', async () => {
    const markForCheck = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        provideTransloco({
          config: { availableLangs: [ 'en', 'ru' ], defaultLang: 'en' },
          loader: DeferredLoader
        }),
        provideTranslocoMessageformat({ locales: [ 'en-GB', 'ru-RU' ] }),
        { provide: ChangeDetectorRef, useValue: { markForCheck } }
      ]
    });
    const transloco = TestBed.inject(TranslocoService);
    await transloco.load('en').toPromise();
    const pipe = TestBed.runInInjectionContext(() => new UnitPipe());
    expect(pipe.transform(1, 'TBSP')).toBe('1 tablespoon');

    transloco.setActiveLang('ru');
    markForCheck.mockClear();
    expect(pipe.transform(0.5, 'TBSP')).toBe('0,5 TBSP');

    pending.next({ ui: { Unit: ru } });
    pending.complete();
    expect(markForCheck).toHaveBeenCalled();
    expect(pipe.transform(0.5, 'TBSP')).toBe('0,5 ст. л.');
  });
});
