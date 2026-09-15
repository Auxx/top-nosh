import { Module } from '@nestjs/common';
import { PrismaModule } from '@top-nosh/data-access';
import { ConfigurationsModule } from '../configurations/configurations.module';
import { FileManagementService } from './file-management.service';
import { LocalFileSystemService } from './local-file-system.service';
import { StorageProviderRegistry } from './storage-provider.registry';
import { StorageController } from './storage.controller';

/**
 * Module providing file management and storage configuration services.
 */
@Module({
  imports: [ PrismaModule, ConfigurationsModule ],
  controllers: [ StorageController ],
  providers: [ FileManagementService, LocalFileSystemService, StorageProviderRegistry ],
  exports: [ FileManagementService, LocalFileSystemService, StorageProviderRegistry ]
})
export class FileManagementModule {}
