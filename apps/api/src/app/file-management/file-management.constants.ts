export const FILE_MANAGEMENT_CONFIG_DOMAIN = 'fileManagement';

export const FILE_MANAGEMENT_CONFIG_KEYS = {
  ACTIVE_STORAGE: 'fileManagement.storage.active',
  DEFAULT_STORAGE: 'fileManagement.storage.default'
} as const;

export const DEFAULT_LOCAL_STORAGE_CONFIG = {
  NAME: 'Local File System',
  DESCRIPTION: '',
  TYPE: 'local',
  FALLBACK_PATH: '/app/data/storage',
  STORAGE_URL_PATH: '/storage'
} as const;

export const fileStates = {
  staging: 'staging',
  deployed: 'deployed'
} as const;

export const FILE_STATES = {
  STAGING: 'staging',
  DEPLOYED: 'deployed'
} as const;

export const stagingDirectory = '.staging';
export const STAGING_DIRECTORY = stagingDirectory;
