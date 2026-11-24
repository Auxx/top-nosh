import { INGREDIENT_UNITS, LANGUAGE_CODES } from '@top-nosh/domain';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const i18nDir = join(__dirname, '../../public/assets/i18n');
const fileFor = (code: string) => join(i18nDir, `${code}.json`);

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
});
