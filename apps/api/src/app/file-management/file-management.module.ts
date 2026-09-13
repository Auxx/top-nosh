import { Module } from '@nestjs/common';
import { PrismaModule } from '@top-nosh/data-access';
import { ConfigurationsModule } from '../configurations/configurations.module';
import { FileManagementService } from './file-management.service';

/**
 * Module providing file management and storage configuration services.
 */
@Module({
  imports: [ PrismaModule, ConfigurationsModule ],
  providers: [ FileManagementService ],
  exports: [ FileManagementService ]
})
export class FileManagementModule {}
