import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { FileStorageService, StorageOptions } from './file-management.types';

/**
 * Service providing file operations for the local file system storage provider.
 */
@Injectable()
export class LocalFileSystemService implements FileStorageService {
  /**
   * Copies a file from a local source path to the storage destination.
   *
   * @param options Storage configuration options containing the root URL/path.
   * @param sourcePath Source file path on the local filesystem.
   * @param destinationPath Target destination path relative to storage root.
   * @returns Promise resolving to true on success.
   */
  async put(options: StorageOptions, sourcePath: string, destinationPath: string): Promise<boolean> {
    const targetPath = this.resolveDestinationPath(options, destinationPath);
    await this.ensureDirectory(targetPath);
    await fs.copyFile(sourcePath, targetPath);
    return true;
  }

  /**
   * Writes a Buffer directly to the storage destination.
   *
   * @param options Storage configuration options containing the root URL/path.
   * @param sourceBuffer Buffer containing file data.
   * @param destinationPath Target destination path relative to storage root.
   * @returns Promise resolving to true on success.
   */
  async putBuffer(options: StorageOptions, sourceBuffer: Buffer, destinationPath: string): Promise<boolean> {
    const targetPath = this.resolveDestinationPath(options, destinationPath);
    await this.ensureDirectory(targetPath);
    await fs.writeFile(targetPath, sourceBuffer);
    return true;
  }

  /**
   * Reads a file from storage and returns its content as a Buffer.
   *
   * @param options Storage configuration options containing the root URL/path.
   * @param filePath Path of the file relative to storage root.
   * @returns Promise resolving to the file Buffer.
   */
  async get(options: StorageOptions, filePath: string): Promise<Buffer> {
    const targetPath = this.resolveDestinationPath(options, filePath);
    return await fs.readFile(targetPath);
  }

  /**
   * Deletes a file from storage.
   *
   * @param options Storage configuration options containing the root URL/path.
   * @param filePath Path of the file relative to storage root.
   * @returns Promise resolving to true on success.
   */
  async delete(options: StorageOptions, filePath: string): Promise<boolean> {
    const targetPath = this.resolveDestinationPath(options, filePath);
    await fs.unlink(targetPath);
    return true;
  }

  /**
   * Resolves and validates a destination path relative to the storage options root URL.
   */
  private resolveDestinationPath(options: StorageOptions, destinationPath: string): string {
    const cleanPath = destinationPath.replace(/^[/\\]+/, '');
    const targetPath = path.join(options.url, cleanPath);
    const resolvedRoot = path.resolve(options.url);
    const resolvedTarget = path.resolve(targetPath);
    const rootWithSep = resolvedRoot.endsWith(path.sep) ? resolvedRoot : `${resolvedRoot}${path.sep}`;

    if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(rootWithSep)) {
      throw new Error(`Path traversal is not allowed: ${destinationPath}`);
    }

    return targetPath;
  }

  /**
   * Ensures the parent directory of a target file path exists.
   */
  private async ensureDirectory(targetPath: string): Promise<void> {
    const dir = path.dirname(targetPath);
    await fs.mkdir(dir, { recursive: true });
  }
}
