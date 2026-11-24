import { ChangeDetectorRef, inject, Pipe, PipeTransform } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';

const KNOWN_UNITS = new Set([ 'GRAMS', 'ITEM_COUNT', 'TSP', 'TBSP' ]);

const LOCALES: Record<string, string> = {
  en: 'en-GB',
  ru: 'ru-RU'
};

const DEFAULT_LOCALE = 'en-GB';

/**
 * Formats an ingredient quantity with its unit in the active language.
 *
 * Impure so that a language switch re-renders the output; the result is
 * memoized on the inputs and the active language. Until the active language's
 * translation has loaded it renders `<quantity> <UNIT>`, then marks the host
 * for check so OnPush views pick up the translated text.
 */
@Pipe({ name: 'unit', pure: false })
export class UnitPipe implements PipeTransform {
  private readonly transloco = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);

  private loadedLang?: string;

  private lastQuantity?: number | string;
  private lastUnit?: string;
  private lastLang?: string;
  private lastLoaded = false;
  private lastResult = '';

  constructor() {
    this.transloco
      .selectTranslation()
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.loadedLang = this.transloco.getActiveLang();
        this.cdr.markForCheck();
      });
  }

  transform(quantity: number | string, unit: string): string {
    const lang = this.transloco.getActiveLang();
    const loaded = lang === this.loadedLang;

    if (
      Object.is(quantity, this.lastQuantity)
      && unit === this.lastUnit
      && lang === this.lastLang
      && loaded === this.lastLoaded
    ) {
      return this.lastResult;
    }

    this.lastQuantity = quantity;
    this.lastUnit = unit;
    this.lastLang = lang;
    this.lastLoaded = loaded;
    this.lastResult = this.format(quantity, unit, lang, loaded);

    return this.lastResult;
  }

  private format(quantity: number | string, unit: string, lang: string, loaded: boolean): string {
    const value = Number(quantity);
    const numeric = Number.isFinite(value);
    // Round once so the plural form matches the number the user sees.
    const count = numeric ? Math.round(value * 100) / 100 : NaN;
    const formatted = numeric
      ? new Intl.NumberFormat(LOCALES[lang] ?? DEFAULT_LOCALE, {
        maximumFractionDigits: 2,
        useGrouping: false
      }).format(count)
      : String(quantity);

    if (!loaded || !KNOWN_UNITS.has(unit)) {
      return `${formatted} ${unit}`;
    }

    return this.transloco.translate(`ui.Unit.${unit}`, { count, quantity: formatted }, lang);
  }
}
