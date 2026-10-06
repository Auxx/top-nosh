import { ConfigEntry, ConfigEntryType } from './repository';

const availableValidators: Record<ConfigEntryType, (value: string) => boolean> = {
  /**
   * All values are valid for the string type.
   */
  string: () => true,

  /**
   * Should be either a valid HTTP(S) URL.
   */
  url: value => {
    if (!URL.canParse(value)) {
      return false;
    }

    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  }
};

/**
 * Validates the value of a config entry.
 * Empty strings, null, and undefined values are valid for all types.
 *
 * @param value
 * @param entry
 */
export const validateConfigValue = (value: string | null | undefined, entry: ConfigEntry): boolean =>
  value === null || value === undefined || value.length === 0
    ? true
    : availableValidators[entry.type](value);
