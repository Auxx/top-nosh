import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';

jest.mock('remark-parse', () => {
  const actual = jest.requireActual('remark-parse');
  return actual.default || actual;
});

setupZonelessTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true
});
