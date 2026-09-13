/**
 * Map of configuration keys to their string values or null.
 */
export type ConfigurationValuesMap = Record<string, string | null>;

/**
 * Payload for retrieving configurations in batch.
 */
export interface RetrieveConfigurationsPayload {
  keys: string[];
}
