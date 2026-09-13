import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '@top-nosh/data-access';
import { ConfigurationsController } from './configurations.controller';
import { ConfigurationsService } from './configurations.service';

/**
 * Global module providing configurations service across the API and exposing configuration endpoints.
 */
@Global()
@Module({
  imports: [ PrismaModule ],
  controllers: [ ConfigurationsController ],
  providers: [ ConfigurationsService ],
  exports: [ ConfigurationsService ]
})
export class ConfigurationsModule {}
