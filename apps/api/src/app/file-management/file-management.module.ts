import { Module } from '@nestjs/common';
import { PrismaModule } from '@top-nosh/data-access';
import { ConfigurationsModule } from '../configurations/configurations.module';
import { FileManagementService } from './file-management.service';
import { LocalFileSystemService } from './local-file-system.service';

/**
 * Module providing file management and storage configuration services.
 */
@Module({
  imports: [ PrismaModule, ConfigurationsModule ],
  providers: [ FileManagementService, LocalFileSystemService ],
  exports: [ FileManagementService, LocalFileSystemService ]
})
export class FileManagementModule {}
