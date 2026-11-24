import { DEFAULT_LANGUAGE, INGREDIENT_UNITS, LANGUAGE_CODES } from '@top-nosh/domain';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const i18nDir = join(__dirname, '../../public/assets/i18n');
const fileFor = (code: string) => join(i18nDir, `${code}.json`);
const read = (code: string) => JSON.parse(readFileSync(fileFor(code), 'utf8'));

/** Flattens nested translations into `a.b.c` → value. */
const flatten = (value: unknown, prefix = ''): Record<string, unknown> =>
  typeof value === 'object' && value !== null
    ? Object.assign({}, ...Object.entries(value).map(([ key, child ]) => flatten(child, `${prefix}${key}.`)))
    : { [prefix.slice(0, -1)]: value };

describe('translation files', () => {
  it.each(LANGUAGE_CODES)('has a translation file for %s', code => {
    expect(existsSync(fileFor(code))).toBe(true);
  });

  const cases = LANGUAGE_CODES.flatMap(code => INGREDIENT_UNITS.map(unit => [ code, unit ] as const));

  it.each(cases)('%s translates ui.Unit.%s', (code, unit) => {
    const json = JSON.parse(readFileSync(fileFor(code), 'utf8'));
    expect(typeof json.ui?.Unit?.[unit]).toBe('string');
    expect(json.ui.Unit[unit]).not.toBe('');
  });

  // libs/ui renders these keys; every language must define all of them.
  const uiKeys = Object.keys(flatten(read(DEFAULT_LANGUAGE).ui, 'ui.'));
  const uiCases = LANGUAGE_CODES
    .filter(code => code !== DEFAULT_LANGUAGE)
    .flatMap(code => uiKeys.map(key => [ code, key ] as const));

  it('finds the ui keys in the default language', () => {
    expect(uiKeys).toContain('ui.Confirmation.cancel');
  });

  it.each(uiCases)('%s translates %s', (code, key) => {
    const value = flatten(read(code))[key];
    expect(typeof value).toBe('string');
    expect(value).not.toBe('');
  });
});
