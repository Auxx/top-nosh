import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
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
      providers: [ provideTranslocoMessageformat({ locales: [ 'en-GB', 'ru-RU' ] }) ]
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
});
