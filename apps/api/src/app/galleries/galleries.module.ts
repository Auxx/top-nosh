import { Module } from '@nestjs/common';
import { PrismaModule } from '@top-nosh/data-access';
import { ConfigurationsModule } from '../configurations/configurations.module';
import { FileManagementModule } from '../file-management/file-management.module';
import { GalleriesController } from './galleries.controller';
import { GalleriesService } from './galleries.service';
import { ImageProcessingService } from './image-processing.service';

@Module({
  imports: [ PrismaModule, ConfigurationsModule, FileManagementModule ],
  controllers: [ GalleriesController ],
  providers: [ GalleriesService, ImageProcessingService ],
  exports: [ GalleriesService, ImageProcessingService ]
})
export class GalleriesModule {}
