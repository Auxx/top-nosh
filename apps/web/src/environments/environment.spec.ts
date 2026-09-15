import { bakedEnv } from '@elemental-concept/env-bakery';
import { environment } from './environment';

describe('environment', () => {
  afterEach(() => {
    delete bakedEnv['SECURITY_OIDC_ENABLED'];
  });

  it('should return oidcEnabled as false by default when SECURITY_OIDC_ENABLED is absent', () => {
    delete bakedEnv['SECURITY_OIDC_ENABLED'];
    expect(environment().oidcEnabled).toBe(false);
  });

  it('should return oidcEnabled as true when SECURITY_OIDC_ENABLED is true', () => {
    bakedEnv['SECURITY_OIDC_ENABLED'] = 'true';
    expect(environment().oidcEnabled).toBe(true);
  });

  it('should return oidcEnabled as false when SECURITY_OIDC_ENABLED is false', () => {
    bakedEnv['SECURITY_OIDC_ENABLED'] = 'false';
    expect(environment().oidcEnabled).toBe(false);
  });
});
