import { Injectable, OnModuleInit } from '@nestjs/common';
import { File, StorageOption } from '@prisma/client';
import { PrismaService } from '@top-nosh/data-access';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import 'multer';
import { ConfigurationsService } from '../configurations/configurations.service';
import {
  DEFAULT_LOCAL_STORAGE_CONFIG,
  FILE_MANAGEMENT_CONFIG_KEYS,
  fileStates,
  stagingDirectory
} from './file-management.constants';
import { LocalFileSystemService } from './local-file-system.service';
import { StorageProviderRegistry } from './storage-provider.registry';

// TODO Add a method to duplicate or create a file in staging area
/**
 * Service managing file storage configurations, file lifecycle operations, and startup initialization.
 */
@Injectable()
export class FileManagementService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configurationsService: ConfigurationsService,
    private readonly localFileSystemService: LocalFileSystemService,
    private readonly storageProviderRegistry: StorageProviderRegistry
  ) {}

  /**
   * Initializes the default storage option if none exist on application startup.
   */
  async onModuleInit(): Promise<void> {
    await this.initializeDefaultStorage();
  }

  /**
   * Stages an uploaded file by moving it to the .staging directory on default storage and tracking it in the database.
   *
   * @param file Uploaded multer file.
   * @returns Newly created File entity in staging state.
   */
  async stage(file: Express.Multer.File): Promise<File> {
    const defaultStorage = await this.getStorageOptionByKey(
      FILE_MANAGEMENT_CONFIG_KEYS.DEFAULT_STORAGE,
      'Default'
    );

    const extension = path.extname(file.originalname);
    const generatedFileName = `${randomUUID()}${extension}`;
    const stagingPath = `${stagingDirectory}/${generatedFileName}`;

    await this.localFileSystemService.put(defaultStorage, file.path, stagingPath);
    await fs.unlink(file.path);

    try {
      return await this.prisma.file.create({
        data: {
          originalFileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          generatedFileName,
          storageId: defaultStorage.id,
          locationPath: stagingPath,
          state: fileStates.staging
        }
      });
    } catch (error) {
      try {
        await this.localFileSystemService.delete(defaultStorage, stagingPath);
      } catch {
        // Cleanup error ignored to propagate root cause
      }
      throw error;
    }
  }

  /**
   * Stages an in-memory buffer by writing it to the .staging directory on default storage and tracking it in the database.
   *
   * @param buffer In-memory file content buffer.
   * @param originalFileName Original file name to derive extension and store metadata.
   * @param mimeType MIME type of the file.
   * @returns Newly created File entity in staging state.
   */
  async stageBuffer(
    buffer: Buffer,
    originalFileName: string,
    mimeType: string
  ): Promise<File> {
    const defaultStorage = await this.getStorageOptionByKey(
      FILE_MANAGEMENT_CONFIG_KEYS.DEFAULT_STORAGE,
      'Default'
    );
    const extension = path.extname(originalFileName) || '.bin';
    const generatedFileName = `${randomUUID()}${extension}`;
    const stagingPath = `${stagingDirectory}/${generatedFileName}`;

    await this.localFileSystemService.putBuffer(defaultStorage, buffer, stagingPath);

    try {
      return await this.prisma.file.create({
        data: {
          originalFileName,
          fileSize: buffer.length,
          mimeType,
          generatedFileName,
          storageId: defaultStorage.id,
          locationPath: stagingPath,
          state: fileStates.staging
        }
      });
    } catch (error) {
      try {
        await this.localFileSystemService.delete(defaultStorage, stagingPath);
      } catch {
        // Cleanup error ignored to propagate root cause
      }
      throw error;
    }
  }

  /**
   * Deploys a staged file to active storage and updates the database record.
   *
   * @param fileId Unique identifier of the file to deploy.
   * @returns Updated File entity in deployed state.
   */
  async deploy(fileId: string): Promise<File> {
    const fileRecord = await this.prisma.file.findFirst({
      where: { id: fileId, deletedAt: null }
    });

    if (!fileRecord) {
      throw new Error(`File not found: ${fileId}`);
    }

    if (fileRecord.state !== fileStates.staging) {
      throw new Error(`File is not in staging state: ${fileId}`);
    }

    const stagingStorage = await this.getStorageOptionByKey(
      FILE_MANAGEMENT_CONFIG_KEYS.DEFAULT_STORAGE,
      'Default'
    );

    const activeStorage = await this.getStorageOptionByKey(
      FILE_MANAGEMENT_CONFIG_KEYS.ACTIVE_STORAGE,
      'Active'
    );

    const deployedPath = fileRecord.generatedFileName;
    const fileBuffer = await this.localFileSystemService.get(stagingStorage, fileRecord.locationPath);

    await this.localFileSystemService.putBuffer(activeStorage, fileBuffer, deployedPath);
    await this.localFileSystemService.delete(stagingStorage, fileRecord.locationPath);

    return await this.prisma.file.update({
      where: { id: fileId },
      data: {
        state: fileStates.deployed,
        storageId: activeStorage.id,
        locationPath: deployedPath
      }
    });
  }

  /**
   * Deletes a physical file from its storage provider and soft-deletes the database record.
   *
   * @param fileId Unique identifier of the file to delete.
   * @returns Promise resolving to true on successful deletion.
   */
  async delete(fileId: string): Promise<boolean> {
    const fileRecord = await this.prisma.file.findFirst({
      where: { id: fileId, deletedAt: null }
    });

    if (!fileRecord) {
      throw new Error(`File not found: ${fileId}`);
    }

    const storageOption = await this.prisma.storageOption.findFirst({
      where: { id: fileRecord.storageId, deletedAt: null }
    });

    if (!storageOption) {
      throw new Error(`Storage option not found for file: ${fileId}`);
    }

    const provider = this.storageProviderRegistry.get(storageOption.type);
    await provider.delete(storageOption, fileRecord.locationPath);

    await this.prisma.file.update({
      where: { id: fileId },
      data: {
        deletedAt: new Date()
      }
    });

    return true;
  }

  /**
   * Retrieves active file metadata by ID if not soft deleted.
   *
   * @param fileId Unique identifier of the file.
   * @returns File entity or null if not found or soft deleted.
   */
  async getInformation(fileId: string): Promise<File | null> {
    return await this.prisma.file.findFirst({
      where: { id: fileId, deletedAt: null }
    });
  }

  private async getStorageOptionByKey(configKey: string, description: string): Promise<StorageOption> {
    const storageId = await this.configurationsService.get(configKey);

    if (!storageId) {
      throw new Error(`${description} storage is not configured`);
    }

    const storageOption = await this.prisma.storageOption.findFirst({
      where: { id: storageId, deletedAt: null }
    });

    if (!storageOption) {
      throw new Error(`${description} storage option not found or inaccessible: ${storageId}`);
    }

    return storageOption;
  }

  private async initializeDefaultStorage(): Promise<void> {
    await this.prisma.$transaction(async tx => {
      const count = await tx.storageOption.count();

      if (count > 0) {
        return;
      }

      const url = this.resolveLocalStoragePath();

      const storageOption = await tx.storageOption.create({
        data: {
          name: DEFAULT_LOCAL_STORAGE_CONFIG.NAME,
          description: DEFAULT_LOCAL_STORAGE_CONFIG.DESCRIPTION,
          type: DEFAULT_LOCAL_STORAGE_CONFIG.TYPE,
          url,
          externalUrl: '',
          username: null,
          password: null
        }
      });

      const externalUrl = this.resolveExternalStorageUrl(storageOption.id);

      await tx.storageOption.update({
        where: { id: storageOption.id },
        data: { externalUrl }
      });

      await this.configurationsService.set(
        FILE_MANAGEMENT_CONFIG_KEYS.ACTIVE_STORAGE,
        storageOption.id
      );
      await this.configurationsService.set(
        FILE_MANAGEMENT_CONFIG_KEYS.DEFAULT_STORAGE,
        storageOption.id
      );
    });
  }

  private resolveLocalStoragePath(): string {
    const path = process.env['FILEMANAGEMENT_STORAGE_LOCAL']?.trim();
    return path || DEFAULT_LOCAL_STORAGE_CONFIG.FALLBACK_PATH;
  }

  /**
   * Resolves the fully qualified external storage URL for a given storage ID.
   *
   * @param storageId Unique identifier of the storage option.
   * @returns Fully qualified external URL endpoint.
   */
  resolveExternalStorageUrl(storageId: string): string {
    const domain = process.env['SERVER_HTTP_DOMAIN']?.trim();

    if (!domain) {
      throw new Error('SERVER_HTTP_DOMAIN environment variable is required to initialize default storage option');
    }

    const trimmedDomain = domain.replace(/\/+$/, '');
    const fullUrl = `${trimmedDomain}${DEFAULT_LOCAL_STORAGE_CONFIG.STORAGE_URL_PATH}/${storageId.trim()}`;

    try {
      new URL(fullUrl);
    } catch {
      throw new Error(`Invalid SERVER_HTTP_DOMAIN URL: ${domain}`);
    }

    return fullUrl;
  }
}
