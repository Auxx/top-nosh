---
sessionId: session-260926-235439-8yf4
---

# Requirements

### Overview & Goals
The Russian translation file (`../../../apps/web/public/assets/i18n/ru.json`) is currently missing the `config` section present in `apps/web/public/assets/i18n/en.json`. The goal is to add the `config` section with accurate Russian translations for all configuration labels and descriptions.

### Scope
#### In Scope
- Adding the `config` object to `../../../apps/web/public/assets/i18n/ru.json` with `labels` and `descriptions` subgroups.
- Translating all 9 configuration entries defined in `../../../libs/config/src/config-meta/repository.ts` and `apps/web/public/assets/i18n/en.json`.
- Ensuring consistent terminology with existing translations (e.g., OpenID Connect, email, URL).

#### Out of Scope
- Modifying other translation keys or application logic.
- Changes to `en.json` or configuration repository definitions.

### User Stories
- As a Russian-speaking administrator/user, I want all configuration settings (labels and descriptions) to be displayed in Russian so that I can configure application settings in my native language.

### Functional Requirements
- `../../../apps/web/public/assets/i18n/ru.json` must include the `config` root property with two child objects: `labels` and `descriptions`.
- `config.labels` must provide translations for:
  - `securityOidcIssuerUrl`: "URL издателя"
  - `securityOidcClientId`: "ID клиента"
  - `securityOidcClientSecret`: "Секрет клиента"
  - `securityOidcCallbackUrl`: "URL обратного вызова"
  - `securityOidcLinkByEmail`: "Разрешить связывание пользователей по email"
  - `fileManagementStorageActive`: "Активное хранилище"
  - `fileManagementStorageDefault`: "Хранилище по умолчанию"
  - `galleryInputMaxUploadSize`: "Максимальный размер загрузки"
  - `galleryOutputFormat`: "Формат вывода"
- `config.descriptions` must provide translations for:
  - `securityOidcIssuerUrl`: "URL издателя OpenID Connect"
  - `securityOidcClientId`: "ID клиента, предоставленный издателем OpenID Connect"
  - `securityOidcClientSecret`: "Секрет клиента, предоставленный издателем OpenID Connect"
  - `securityOidcCallbackUrl`: "URL обратного вызова для перенаправления после аутентификации"
  - `securityOidcLinkByEmail`: "Отключите для повышения безопасности Top Nosh"
  - `fileManagementStorageActive`: ""
  - `fileManagementStorageDefault`: ""
  - `galleryInputMaxUploadSize`: ""
  - `galleryOutputFormat`: ""
- The file must remain valid JSON and formatted according to `dprint` rules.

# Technical Design

### Current Implementation
- `../../../apps/web/public/assets/i18n/en.json` contains `ui`, `config`, and `web` sections.
- `../../../apps/web/public/assets/i18n/ru.json` contains `ui` and `web` sections, but lacks `config`.
- `../../../libs/config/src/config-meta/repository.ts` defines the list of `ConfigEntry` objects that use these translation keys under `config.labels.<key>` and `config.descriptions.<key>`.

### Proposed Changes
Add the `config` section into `../../../apps/web/public/assets/i18n/ru.json` directly following the `ui` object:

```json
  "config": {
    "labels": {
      "securityOidcIssuerUrl": "URL издателя",
      "securityOidcClientId": "ID клиента",
      "securityOidcClientSecret": "Секрет клиента",
      "securityOidcCallbackUrl": "URL обратного вызова",
      "securityOidcLinkByEmail": "Разрешить связывание пользователей по email",
      "fileManagementStorageActive": "Активное хранилище",
      "fileManagementStorageDefault": "Хранилище по умолчанию",
      "galleryInputMaxUploadSize": "Максимальный размер загрузки",
      "galleryOutputFormat": "Формат вывода"
    },
    "descriptions": {
      "securityOidcIssuerUrl": "URL издателя OpenID Connect",
      "securityOidcClientId": "ID клиента, предоставленный издателем OpenID Connect",
      "securityOidcClientSecret": "Секрет клиента, предоставленный издателем OpenID Connect",
      "securityOidcCallbackUrl": "URL обратного вызова для перенаправления после аутентификации",
      "securityOidcLinkByEmail": "Отключите для повышения безопасности Top Nosh",
      "fileManagementStorageActive": "",
      "fileManagementStorageDefault": "",
      "galleryInputMaxUploadSize": "",
      "galleryOutputFormat": ""
    }
  },
```

### File Structure
- Modified file: `../../../apps/web/public/assets/i18n/ru.json`

# Testing

### Validation Approach
- Verify syntax correctness and JSON parsing of `../../../apps/web/public/assets/i18n/ru.json`.
- Verify that every key under `config.labels` and `config.descriptions` in `en.json` exists in `ru.json`.
- Execute `npm run format:check` to ensure the file complies with `dprint` formatting settings.
- Run `npm test` across the workspace to ensure all existing tests pass without regressions.

### Key Scenarios
- Parsing `ru.json` as JSON succeeds without errors.
- Transloco translation service can resolve keys `config.labels.*` and `config.descriptions.*` in Russian locale.

# Delivery Steps

### ✓ Step 1: Add missing config section to Russian translation file
The Russian translation file contains the full `config` section with translated labels and descriptions matching `en.json`.

- Add the `config` object to `../../../apps/web/public/assets/i18n/ru.json` (between `ui` and `web` sections to match `en.json` structure).
- Add `labels` subgroup with Russian translations for all configuration keys:
  - `securityOidcIssuerUrl`: `"URL издателя"`
  - `securityOidcClientId`: `"ID клиента"`
  - `securityOidcClientSecret`: `"Секрет клиента"`
  - `securityOidcCallbackUrl`: `"URL обратного вызова"`
  - `securityOidcLinkByEmail`: `"Разрешить связывание пользователей по email"`
  - `fileManagementStorageActive`: `"Активное хранилище"`
  - `fileManagementStorageDefault`: `"Хранилище по умолчанию"`
  - `galleryInputMaxUploadSize`: `"Максимальный размер загрузки"`
  - `galleryOutputFormat`: `"Формат вывода"`
- Add `descriptions` subgroup with Russian translations:
  - `securityOidcIssuerUrl`: `"URL издателя OpenID Connect"`
  - `securityOidcClientId`: `"ID клиента, предоставленный издателем OpenID Connect"`
  - `securityOidcClientSecret`: `"Секрет клиента, предоставленный издателем OpenID Connect"`
  - `securityOidcCallbackUrl`: `"URL обратного вызова для перенаправления после аутентификации"`
  - `securityOidcLinkByEmail`: `"Отключите для повышения безопасности Top Nosh"`
  - `fileManagementStorageActive`: `""`
  - `fileManagementStorageDefault`: `""`
  - `galleryInputMaxUploadSize`: `""`
  - `galleryOutputFormat`: `""`

### ✓ Step 2: Validate translations, JSON formatting, and tests
The translation file is valid JSON and adheres to project formatting and linting rules.

- Verify `../../../apps/web/public/assets/i18n/ru.json` is valid JSON and contains all keys defined in `libs/config/src/config-meta/repository.ts`.
- Run formatting checks via `npm run format:check` (or format with `npm run format`) to ensure alignment with dprint rules.
- Run project test suites to verify no regressions.
