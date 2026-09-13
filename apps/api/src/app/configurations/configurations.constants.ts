/**
 * Set of configuration keys that are protected from runtime modification.
 */
export const protectedKeys = new Set<string>([
  'prisma.database.url',
  'server.http.port'
]);

/**
 * Backwards compatibility alias for protected keys set.
 */
export const PROTECTED_KEYS = protectedKeys;

/**
 * Regular expression validating a 3-tier dot-separated configuration key (domain.group.entity).
 */
export const configurationKeyRegex = /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+){2}$/;

/**
 * Regular expression validating a single configuration key segment.
 */
export const configurationSegmentRegex = /^[a-zA-Z0-9_-]+$/;
