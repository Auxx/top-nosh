import { allConfigEntryTypes, configEntriesRepository } from './repository';

describe('configEntriesRepository', () => {
  it('should return all 10 configuration entries', () => {
    const entries = configEntriesRepository();
    expect(entries).toHaveLength(10);
  });

  it('should have unique keys across all entries', () => {
    const entries = configEntriesRepository();
    const keys = entries.map(e => e.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(entries.length);
  });

  it('should have valid metadata on every entry', () => {
    const entries = configEntriesRepository();
    for (const entry of entries) {
      expect(entry.key).toBeTruthy();
      expect(entry.translationKey).toBeTruthy();
      expect(allConfigEntryTypes).toContain(entry.type);
    }
  });

  it('should include all expected keys with correct translation keys and types', () => {
    const entries = configEntriesRepository();
    const expected = [
      { key: 'security.oidc.issuerUrl', translationKey: 'securityOidcIssuerUrl', type: 'url' },
      { key: 'security.oidc.clientId', translationKey: 'securityOidcClientId', type: 'string' },
      { key: 'security.oidc.clientSecret', translationKey: 'securityOidcClientSecret', type: 'string' },
      { key: 'security.oidc.callbackUrl', translationKey: 'securityOidcCallbackUrl', type: 'url' },
      { key: 'security.oidc.linkByEmail', translationKey: 'securityOidcLinkByEmail', type: 'string' },
      { key: 'fileManagement.storage.active', translationKey: 'fileManagementStorageActive', type: 'string' },
      { key: 'fileManagement.storage.default', translationKey: 'fileManagementStorageDefault', type: 'string' },
      { key: 'gallery.input.maxUploadSize', translationKey: 'galleryInputMaxUploadSize', type: 'string' },
      { key: 'gallery.output.format', translationKey: 'galleryOutputFormat', type: 'string' },
      { key: 'ui.theme.palette', translationKey: 'uiThemePalette', type: 'string' }
    ];
    expect(entries).toEqual(expected);
  });
});
