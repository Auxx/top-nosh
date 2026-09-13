import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Configuration } from '@prisma/client';
import { PrismaService } from '@top-nosh/data-access';
import { configurationKeyRegex, configurationSegmentRegex, protectedKeys } from './configurations.constants';

/**
 * Service managing database-backed configurations with environment variable fallback
 * and protection for critical infrastructure settings.
 */
@Injectable()
export class ConfigurationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Converts a dot-separated configuration key to its corresponding UPPER_SNAKE_CASE environment variable name.
   *
   * @param key - The dot-separated configuration key (e.g., `files.storage.type`).
   * @returns The uppercase snake-case environment variable name (e.g., `FILES_STORAGE_TYPE`).
   */
  keyToEnvVar(key: string): string {
    return key.replace(/\./g, '_').toUpperCase();
  }

  /**
   * Retrieves the value of a configuration key.
   * If the key is not found in the database, falls back to the corresponding environment variable.
   *
   * @param key - The dot-separated configuration key.
   * @returns The string value or null if not set.
   */
  async get(key: string): Promise<string | null>;
  /**
   * Retrieves the value of a configuration key using domain, group, and entity segments.
   *
   * @param domain - The domain segment.
   * @param group - The group segment.
   * @param entity - The entity segment.
   * @returns The string value or null if not set.
   */
  async get(domain: string, group: string, entity: string): Promise<string | null>;
  async get(first: string, second?: string, third?: string): Promise<string | null> {
    const key = this.parseKey(first, second, third);
    const record = await this.prisma.configuration.findUnique({
      where: { key }
    });

    if (record !== null) {
      return record.value;
    }

    return this.getEnvFallback(key);
  }

  /**
   * Alias for `get`. Retrieves the value of a configuration key.
   *
   * @param key - The dot-separated configuration key.
   * @returns The string value or null if not set.
   */
  async getValue(key: string): Promise<string | null>;
  /**
   * Alias for `get`. Retrieves the value of a configuration key using three segments.
   *
   * @param domain - The domain segment.
   * @param group - The group segment.
   * @param entity - The entity segment.
   * @returns The string value or null if not set.
   */
  async getValue(domain: string, group: string, entity: string): Promise<string | null>;
  async getValue(first: string, second?: string, third?: string): Promise<string | null> {
    if (second !== undefined && third !== undefined) {
      return this.get(first, second, third);
    }
    return this.get(first);
  }

  /**
   * Sets or updates a configuration key value (upsert).
   * Throws ForbiddenException if the key is protected.
   *
   * @param key - The dot-separated configuration key.
   * @param value - The value to store, or null.
   * @returns The upserted Configuration entity.
   */
  async set(key: string, value: string | null): Promise<Configuration>;
  /**
   * Sets or updates a configuration key value using three segments (upsert).
   * Throws ForbiddenException if the key is protected.
   *
   * @param domain - The domain segment.
   * @param group - The group segment.
   * @param entity - The entity segment.
   * @param value - The value to store, or null.
   * @returns The upserted Configuration entity.
   */
  async set(
    domain: string,
    group: string,
    entity: string,
    value: string | null
  ): Promise<Configuration>;
  async set(
    first: string,
    second: string | null,
    third?: string,
    fourth?: string | null
  ): Promise<Configuration> {
    let key: string;
    let value: string | null;

    if (third !== undefined) {
      if (typeof second !== 'string') {
        throw new BadRequestException('Group segment must be a string');
      }
      key = this.parseKey(first, second, third);
      value = fourth ?? null;
    } else {
      key = this.parseKey(first);
      value = second;
    }

    this.assertNotProtected(key);

    return this.prisma.configuration.upsert({
      where: { key },
      create: { key, value },
      update: { value }
    });
  }

  /**
   * Creates a new configuration key.
   *
   * @param key - The dot-separated configuration key.
   * @param value - The value to store, or null.
   * @returns The created or updated Configuration entity.
   */
  async create(key: string, value: string | null): Promise<Configuration> {
    return this.set(key, value);
  }

  /**
   * Updates an existing configuration key or creates it if absent.
   *
   * @param key - The dot-separated configuration key.
   * @param value - The value to store, or null.
   * @returns The updated Configuration entity.
   */
  async update(key: string, value: string | null): Promise<Configuration> {
    return this.set(key, value);
  }

  /**
   * Batch updates multiple key-value pairs in a single transaction.
   * Throws ForbiddenException if any key is protected, cancelling the operation.
   *
   * @param values - A record mapping configuration keys to their desired values (or null).
   * @returns The updated key-value map.
   */
  async updateMany(
    values: Record<string, string | null>
  ): Promise<Record<string, string | null>> {
    const entries = Object.entries(values);

    for (const [ key ] of entries) {
      this.parseKey(key);
      this.assertNotProtected(key);
    }

    if (entries.length > 0) {
      await this.prisma.$transaction(
        entries.map(([ key, value ]) =>
          this.prisma.configuration.upsert({
            where: { key },
            create: { key, value },
            update: { value }
          })
        )
      );
    }

    return values;
  }

  /**
   * Alias for `updateMany`. Batch updates multiple key-value pairs.
   *
   * @param values - A record mapping configuration keys to their values.
   * @returns The updated key-value map.
   */
  async setMany(
    values: Record<string, string | null>
  ): Promise<Record<string, string | null>> {
    return this.updateMany(values);
  }

  /**
   * Batch retrieves values for a list of keys with environment variable fallback.
   *
   * @param keys - An array of dot-separated configuration keys.
   * @returns A map of keys to their resolved values (or null).
   */
  async getMany(keys: string[]): Promise<Record<string, string | null>> {
    for (const key of keys) {
      this.parseKey(key);
    }

    const records = await this.prisma.configuration.findMany({
      where: { key: { in: keys } }
    });

    const dbMap = new Map<string, string | null>();
    for (const record of records) {
      dbMap.set(record.key, record.value);
    }

    const result: Record<string, string | null> = {};
    for (const key of keys) {
      if (dbMap.has(key)) {
        result[key] = dbMap.get(key) ?? null;
      } else {
        result[key] = this.getEnvFallback(key);
      }
    }

    return result;
  }

  /**
   * Queries all non-null configuration values under a given domain.
   * Environment variable fallback is ignored for domain queries.
   *
   * @param domain - The domain segment (e.g. `files`).
   * @returns A dictionary of key-value pairs with non-null values.
   */
  async getByDomain(domain: string): Promise<Record<string, string>> {
    if (!domain || !configurationSegmentRegex.test(domain)) {
      throw new BadRequestException(
        `Invalid domain '${domain}'. Expected non-empty alphanumeric segment.`
      );
    }

    const records = await this.prisma.configuration.findMany({
      where: {
        key: { startsWith: `${domain}.` },
        value: { not: null }
      }
    });

    const result: Record<string, string> = {};
    for (const record of records) {
      if (record.value !== null) {
        result[record.key] = record.value;
      }
    }

    return result;
  }

  /**
   * Queries all non-null configuration values under a given domain and group.
   * Environment variable fallback is ignored for domain and group queries.
   *
   * @param domain - The domain segment (e.g. `files`).
   * @param group - The group segment (e.g. `storage`).
   * @returns A dictionary of key-value pairs with non-null values.
   */
  async getByDomainAndGroup(
    domain: string,
    group: string
  ): Promise<Record<string, string>> {
    if (!domain || !configurationSegmentRegex.test(domain)) {
      throw new BadRequestException(
        `Invalid domain '${domain}'. Expected non-empty alphanumeric segment.`
      );
    }

    if (!group || !configurationSegmentRegex.test(group)) {
      throw new BadRequestException(
        `Invalid group '${group}'. Expected non-empty alphanumeric segment.`
      );
    }

    const prefix = `${domain}.${group}.`;
    const records = await this.prisma.configuration.findMany({
      where: {
        key: { startsWith: prefix },
        value: { not: null }
      }
    });

    const result: Record<string, string> = {};
    for (const record of records) {
      if (record.value !== null) {
        result[record.key] = record.value;
      }
    }

    return result;
  }

  /**
   * Parses and validates a configuration key provided either as a single string
   * or as domain, group, and entity segments.
   */
  private parseKey(first: string, second?: string, third?: string): string {
    if (second !== undefined || third !== undefined) {
      if (!first || !second || !third) {
        throw new BadRequestException(
          'All three segments (domain, group, entity) must be non-empty strings.'
        );
      }
      if (
        !configurationSegmentRegex.test(first)
        || !configurationSegmentRegex.test(second)
        || !configurationSegmentRegex.test(third)
      ) {
        throw new BadRequestException(
          'Each segment must contain only alphanumeric characters, underscores, or hyphens.'
        );
      }
      const fullKey = `${first}.${second}.${third}`;
      if (!configurationKeyRegex.test(fullKey)) {
        throw new BadRequestException(
          `Invalid configuration key '${fullKey}'. Expected format: <domain>.<group>.<entity>`
        );
      }
      return fullKey;
    }

    if (!first || !configurationKeyRegex.test(first)) {
      throw new BadRequestException(
        `Invalid configuration key '${first}'. Expected format: <domain>.<group>.<entity>`
      );
    }

    return first;
  }

  /**
   * Asserts that a configuration key is not protected.
   */
  private assertNotProtected(key: string): void {
    if (protectedKeys.has(key)) {
      throw new ForbiddenException(
        `Configuration key '${key}' is protected and cannot be modified.`
      );
    }
  }

  /**
   * Resolves the environment variable fallback for a key.
   */
  private getEnvFallback(key: string): string | null {
    const envKey = this.keyToEnvVar(key);
    const envValue = process.env[envKey];
    if (envValue !== undefined) {
      return envValue;
    }

    const altEnvKey = envKey.replace(/-/g, '_');
    const altEnvValue = process.env[altEnvKey];
    if (altEnvValue !== undefined) {
      return altEnvValue;
    }

    return null;
  }
}
