export const allConfigEntryTypes = [
  'string',
  'url'
] as const;

export type ConfigEntryType = typeof allConfigEntryTypes[number];

export interface ConfigEntry {
  /**
   * Configuration key in <domain>.<group>.<entity> as used by ConfigurationsService.
   */
  readonly key: string;

  /**
   * Translation key for labels and descriptions of the configuration entry.
   * All translation keys are part of the `config` translation group.
   * Labels are part of the `config.labels` translation group,
   * and descriptions are part of the `config.descriptions` translation group.
   *
   * For example, if the translation key is `securityOidcIssuerUrl`,
   * the label is `config.labels.securityOidcIssuerUrl`,
   * and the description is `config.descriptions.securityOidcIssuerUrl`.
   */
  readonly translationKey: string;

  /**
   * Type of the configuration entry. Controls which data validator is used.
   */
  readonly type: ConfigEntryType;
}

/**
 * Returns all known configuration entries.
 */
export const configEntriesRepository = (): ConfigEntry[] => [
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
