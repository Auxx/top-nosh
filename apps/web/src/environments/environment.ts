import { getEnv } from '@elemental-concept/env-bakery';

export const environment = () => ({
  production: getEnv('PRODUCTION').boolean(),
  apiUrl: getEnv('API_URL').string(),
  oidcEnabled: getEnv('SECURITY_OIDC_ENABLED').boolean(),
  dataNeedsAttention: getEnv('DATA_NEEDS_ATTENTION').boolean(),
  dataRequiredUid: getEnv('DATA_REQUIRED_UID').string(),
  dataRequiredGid: getEnv('DATA_REQUIRED_GID').string()
});
