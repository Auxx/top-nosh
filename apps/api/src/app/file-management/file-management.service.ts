import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@top-nosh/data-access';
import { ConfigurationsService } from '../configurations/configurations.service';
import { DEFAULT_LOCAL_STORAGE_CONFIG, FILE_MANAGEMENT_CONFIG_KEYS } from './file-management.constants';

/**
 * Service managing file storage configurations and startup initialization.
 */
@Injectable()
export class FileManagementService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configurationsService: ConfigurationsService
  ) {}

  /**
   * Initializes the default storage option if none exist on application startup.
   */
  async onModuleInit(): Promise<void> {
    await this.initializeDefaultStorage();
  }

  private async initializeDefaultStorage(): Promise<void> {
    const count = await this.prisma.storageOption.count();

    if (count > 0) {
      return;
    }

    const url = this.resolveLocalStoragePath();
    const externalUrl = this.resolveExternalStorageUrl();

    const storageOption = await this.prisma.storageOption.create({
      data: {
        name: DEFAULT_LOCAL_STORAGE_CONFIG.NAME,
        description: DEFAULT_LOCAL_STORAGE_CONFIG.DESCRIPTION,
        type: DEFAULT_LOCAL_STORAGE_CONFIG.TYPE,
        url,
        externalUrl,
        username: null,
        password: null
      }
    });

    await this.configurationsService.set(
      FILE_MANAGEMENT_CONFIG_KEYS.ACTIVE_STORAGE,
      storageOption.id
    );
    await this.configurationsService.set(
      FILE_MANAGEMENT_CONFIG_KEYS.DEFAULT_STORAGE,
      storageOption.id
    );
  }

  private resolveLocalStoragePath(): string {
    const path = process.env['FILEMANAGEMENT_STORAGE_LOCAL']?.trim();
    return path || DEFAULT_LOCAL_STORAGE_CONFIG.FALLBACK_PATH;
  }

  private resolveExternalStorageUrl(): string {
    const domain = process.env['SERVER_HTTP_DOMAIN']?.trim();

    if (!domain) {
      throw new Error('SERVER_HTTP_DOMAIN environment variable is required to initialize default storage option');
    }

    const trimmedDomain = domain.replace(/\/+$/, '');
    const fullUrl = `${trimmedDomain}${DEFAULT_LOCAL_STORAGE_CONFIG.STORAGE_URL_PATH}`;

    try {
      new URL(fullUrl);
    } catch {
      throw new Error(`Invalid SERVER_HTTP_DOMAIN URL: ${domain}`);
    }

    return fullUrl;
  }
}
