import { ConfigEntry } from './repository';
import { validateConfigValue } from './validators';

describe('validateConfigValue', () => {
  const stringEntry: ConfigEntry = {
    key: 'test.string.key',
    translationKey: 'testStringKey',
    type: 'string'
  };

  const urlEntry: ConfigEntry = {
    key: 'test.url.key',
    translationKey: 'testUrlKey',
    type: 'url'
  };

  describe('empty / null / undefined values', () => {
    it('should return true for null or undefined across all types', () => {
      expect(validateConfigValue(null, stringEntry)).toBe(true);
      expect(validateConfigValue(undefined, stringEntry)).toBe(true);
      expect(validateConfigValue(null, urlEntry)).toBe(true);
      expect(validateConfigValue(undefined, urlEntry)).toBe(true);
    });

    it('should return true for empty string across all types', () => {
      expect(validateConfigValue('', stringEntry)).toBe(true);
      expect(validateConfigValue('', urlEntry)).toBe(true);
    });
  });

  describe('string type validation', () => {
    it('should return true for any non-empty string value', () => {
      expect(validateConfigValue('anything', stringEntry)).toBe(true);
      expect(validateConfigValue('12345', stringEntry)).toBe(true);
      expect(validateConfigValue('local', stringEntry)).toBe(true);
    });
  });

  describe('url type validation', () => {
    it('should return true for valid http and https URLs', () => {
      expect(validateConfigValue('http://example.com', urlEntry)).toBe(true);
      expect(validateConfigValue('https://example.com/callback', urlEntry)).toBe(true);
      expect(validateConfigValue('https://auth.example.com:8443/auth/realms/app', urlEntry)).toBe(true);
    });

    it('should return false for invalid or non-http(s) URLs', () => {
      expect(validateConfigValue('invalid-url', urlEntry)).toBe(false);
      expect(validateConfigValue('ftp://example.com', urlEntry)).toBe(false);
      expect(validateConfigValue('javascript:alert(1)', urlEntry)).toBe(false);
      expect(validateConfigValue('file:///path/to/file', urlEntry)).toBe(false);
    });
  });
});
