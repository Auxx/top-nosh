---
sessionId: session-260926-212230-115l
---

# Requirements

### Overview & Goals
The goal of this task is to ensure the central configuration registry (`configEntriesRepository`) in `../../../libs/config` contains an exhaustive and accurate list of all configuration entries actively utilized across the workspace. Having complete configuration metadata maximizes system maintainability, eliminates runtime surprises, and provides a single source of truth for frontend configuration interfaces and backend validation.

### Scope
#### In Scope
- Auditing all `ConfigurationsService.get()` and `ConfigurationsService.getValue()` calls across the `api` project.
- Updating `configEntriesRepository` in `../../../libs/config/src/config-meta/repository.ts` to register all missing configuration keys with appropriate metadata (`key`, `translationKey`, `type`).
- Establishing unit test coverage in `../../../libs/config` to validate repository completeness and data integrity.

#### Out of Scope
- Auditing the `web` project (per task requirements, only `api` currently utilizes dynamic configuration entries).
- Modifying `ConfigurationsService` implementation or altering runtime configuration retrieval behavior.
- Adding new configuration entry types beyond existing `'string' | 'url'`.

### User Stories
- **As a developer**, I want `configEntriesRepository` to list all known configuration keys used across backend services so that configuration schemas and UI editors remain complete, consistent, and up-to-date.
- **As a system operator**, I want configuration keys to be typed and validated properly so that invalid configuration values are rejected early to maximize system stability and avoid unexpected runtime failures.

### Functional Requirements
1. **Repository Completeness**:
   - `configEntriesRepository` must return all 9 configuration entries used across the `api` codebase:
     1. `security.oidc.issuerUrl` (`url`, translationKey: `securityOidcIssuerUrl`)
     2. `security.oidc.clientId` (`string`, translationKey: `securityOidcClientId`)
     3. `security.oidc.clientSecret` (`string`, translationKey: `securityOidcClientSecret`)
     4. `security.oidc.callbackUrl` (`url`, translationKey: `securityOidcCallbackUrl`)
     5. `security.oidc.linkByEmail` (`string`, translationKey: `securityOidcLinkByEmail`)
     6. `fileManagement.storage.active` (`string`, translationKey: `fileManagementStorageActive`)
     7. `fileManagement.storage.default` (`string`, translationKey: `fileManagementStorageDefault`)
     8. `gallery.input.maxUploadSize` (`string`, translationKey: `galleryInputMaxUploadSize`)
     9. `gallery.output.format` (`string`, translationKey: `galleryOutputFormat`)
2. **Naming and Type Consistency**:
   - Translation keys must follow the established camelCase pattern concatenating the domain, group, and entity segments (e.g. `gallery.input.maxUploadSize` -> `galleryInputMaxUploadSize`).
   - Types must be valid members of `allConfigEntryTypes` (`'string' | 'url'`).

# Technical Design

### Current Implementation
`../../../libs/config/src/config-meta/repository.ts` currently defines:
- `ConfigEntryType = 'string' | 'url'`
- `ConfigEntry` interface with `key`, `translationKey`, and `type`
- `configEntriesRepository()` function returning only the 5 OpenID Connect security configuration entries.

Analysis of `../../../apps/api` revealed 4 additional configuration keys actively queried via `ConfigurationsService`:
- `fileManagement.storage.active` (defined in `../../../apps/api/src/app/file-management/file-management.constants.ts` and used in `FileManagementService`)
- `fileManagement.storage.default` (defined in `../../../apps/api/src/app/file-management/file-management.constants.ts` and used in `FileManagementService`)
- `gallery.input.maxUploadSize` (defined in `../../../apps/api/src/app/galleries/galleries.constants.ts` and queried in `GalleriesService.uploadImage`)
- `gallery.output.format` (defined in `../../../apps/api/src/app/galleries/galleries.constants.ts` and queried in `ImageProcessingService.resolveOutputFormat`)

### Key Decisions
1. **Standardized Type Mapping**:
   - Storage option references (`fileManagement.storage.active`, `fileManagement.storage.default`), numeric limits stored as strings (`gallery.input.maxUploadSize`), and format identifiers (`gallery.output.format`) will be assigned the `'string'` type.
   - *Rationale*: Only HTTP/HTTPS URLs require the `'url'` type validator; all other values are represented as plain string entries in the database configuration table.
2. **Deterministic Translation Key Convention**:
   - Every translation key is the camelCase transformation of `<domain>.<group>.<entity>`.
   - *Rationale*: Maintains alignment with existing i18n translation namespaces under `config.labels.*` and `config.descriptions.*`.

### Proposed Changes
1. **`../../../libs/config/src/config-meta/repository.ts`**:
   - Extend the array returned by `configEntriesRepository()` to include the 4 missing entries.
2. **`../../../libs/config/src/config-meta/repository.spec.ts`**:
   - Add unit tests verifying repository contents, uniqueness of keys, and conformance to the `ConfigEntry` schema.

### Data Models / Contracts
```typescript
export interface ConfigEntry {
  readonly key: string;
  readonly translationKey: string;
  readonly type: ConfigEntryType;
}

export const configEntriesRepository = (): ConfigEntry[] => [
  { key: 'security.oidc.issuerUrl', translationKey: 'securityOidcIssuerUrl', type: 'url' },
  { key: 'security.oidc.clientId', translationKey: 'securityOidcClientId', type: 'string' },
  { key: 'security.oidc.clientSecret', translationKey: 'securityOidcClientSecret', type: 'string' },
  { key: 'security.oidc.callbackUrl', translationKey: 'securityOidcCallbackUrl', type: 'url' },
  { key: 'security.oidc.linkByEmail', translationKey: 'securityOidcLinkByEmail', type: 'string' },
  { key: 'fileManagement.storage.active', translationKey: 'fileManagementStorageActive', type: 'string' },
  { key: 'fileManagement.storage.default', translationKey: 'fileManagementStorageDefault', type: 'string' },
  { key: 'gallery.input.maxUploadSize', translationKey: 'galleryInputMaxUploadSize', type: 'string' },
  { key: 'gallery.output.format', translationKey: 'galleryOutputFormat', type: 'string' }
];
```

### File Structure
- `../../../libs/config/src/config-meta/repository.ts` (Modified: add missing entries)
- `../../../libs/config/src/config-meta/repository.spec.ts` (Added: unit tests)
- `../../../libs/config/src/config-meta/validators.spec.ts` (Added: validation tests)

# Testing

### Validation Approach
Automated test suites will be run to verify the accuracy of the configuration metadata repository and protect against regressions, maximizing developer velocity and system reliability.

### Key Scenarios
1. **Repository Completeness**:
   - Verify `configEntriesRepository()` returns 9 distinct configuration entries matching the registered keys across `api`.
2. **Schema & Translation Key Integrity**:
   - Verify every entry has valid non-empty `key`, `translationKey`, and valid `type` (`'string' | 'url'`).
   - Verify no duplicate keys exist in the repository.
3. **Validator Behavior**:
   - Verify `validateConfigValue` correctly accepts valid URLs for `'url'` entries and rejects invalid or non-HTTP/HTTPS URLs.
   - Verify `validateConfigValue` accepts valid strings and empty/null/undefined values for `'string'` entries.

### Test Changes
- **New Test File**: `../../../libs/config/src/config-meta/repository.spec.ts` testing `configEntriesRepository()`.
- **New Test File**: `../../../libs/config/src/config-meta/validators.spec.ts` testing `validateConfigValue()`.
- **Verification Commands**:
  - `npx nx test config`
  - `npx nx test api`
  - `npx nx lint config`

# Delivery Steps

### ✓ Step 1: Update configuration entries repository with missing api keys
The `configEntriesRepository` includes all known configuration keys used by the `api` service with accurate metadata.

- Update `../../../libs/config/src/config-meta/repository.ts` to include the missing configuration entries:
  - `fileManagement.storage.active` (`translationKey: 'fileManagementStorageActive'`, `type: 'string'`)
  - `fileManagement.storage.default` (`translationKey: 'fileManagementStorageDefault'`, `type: 'string'`)
  - `gallery.input.maxUploadSize` (`translationKey: 'galleryInputMaxUploadSize'`, `type: 'string'`)
  - `gallery.output.format` (`translationKey: 'galleryOutputFormat'`, `type: 'string'`)
- Ensure all existing configuration keys (`security.oidc.issuerUrl`, `security.oidc.clientId`, `security.oidc.clientSecret`, `security.oidc.callbackUrl`, `security.oidc.linkByEmail`) remain intact and properly typed.
- Verify that export interfaces and types in `../../../libs/config/src/index.ts` remain clean and consistent.

### ✓ Step 2: Add unit test suite for configuration repository and validators
Automated unit tests exist and pass, ensuring configuration repository entries and value validation behave predictably and prevent future regressions.

- Create `../../../libs/config/src/config-meta/repository.spec.ts` to test `configEntriesRepository`:
  - Verify that `configEntriesRepository()` returns all 9 registered configuration entries.
  - Verify that each entry contains a non-empty `key`, matching camelCase `translationKey`, and valid `type` (`'string' | 'url'`).
  - Verify key uniqueness across all repository entries.
- Add test coverage in `../../../libs/config/src/config-meta/validators.spec.ts` to validate URL and string validation logic against known entries.
- Run `npx nx test config` and `npx nx lint config` to verify test execution and code formatting standards.
