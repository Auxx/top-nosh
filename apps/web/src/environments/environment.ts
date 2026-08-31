import { getEnv } from '@elemental-concept/env-bakery';

export const environment = () => ({
  production: getEnv('PRODUCTION').boolean(),
  apiUrl: getEnv('API_URL').string()
});
