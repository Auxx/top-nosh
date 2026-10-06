# Update known configuration entries

`configEntriesRepository` in `libs/config/src/config-meta/repository.ts` should
contain all configuration entries used across the workspace. Find missing
entries and add them to the repository.

## Requirements

- Only `api` project is using configuration entries at the moment, there is no
  need to check `web` project.
- Configuration is accessed via `ConfigurationsService`.
- Find all calls to `ConfigurationsService.get()` and
  `ConfigurationsService.getValue()` methods, and analyze the keys used.
- Add any missing configuration entry keys to the `configEntriesRepository`.
