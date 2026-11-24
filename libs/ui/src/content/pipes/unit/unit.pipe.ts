import { inject, Pipe, PipeTransform } from '@angular/core';
import { Translation, TranslocoService } from '@jsverse/transloco';

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
 * memoized on the inputs, the active language and its loaded translation.
 */
@Pipe({ name: 'unit', pure: false })
export class UnitPipe implements PipeTransform {
  private readonly transloco = inject(TranslocoService);

  private lastQuantity?: number | string;
  private lastUnit?: string;
  private lastLang?: string;
  private lastTranslation?: Translation;
  private lastResult = '';

  transform(quantity: number | string, unit: string): string {
    const lang = this.transloco.getActiveLang();
    const translation = this.transloco.getTranslation(lang);

    if (
      quantity === this.lastQuantity
      && unit === this.lastUnit
      && lang === this.lastLang
      && translation === this.lastTranslation
    ) {
      return this.lastResult;
    }

    this.lastQuantity = quantity;
    this.lastUnit = unit;
    this.lastLang = lang;
    this.lastTranslation = translation;
    this.lastResult = this.format(Number(quantity), unit, lang);

    return this.lastResult;
  }

  private format(count: number, unit: string, lang: string): string {
    const formatted = new Intl.NumberFormat(LOCALES[lang] ?? DEFAULT_LOCALE, {
      maximumFractionDigits: 2,
      useGrouping: false
    }).format(count);

    if (!KNOWN_UNITS.has(unit)) {
      return `${formatted} ${unit}`;
    }

    return this.transloco.translate(`ui.Unit.${unit}`, { count, quantity: formatted }, lang);
  }
}
