import { Module } from '@nestjs/common';
import { PrismaModule } from '@top-nosh/data-access';
import { SharingController } from './sharing.controller';
import { SharingService } from './sharing.service';

@Module({
  imports: [ PrismaModule ],
  controllers: [ SharingController ],
  providers: [ SharingService ],
  exports: [ SharingService ]
})
export class SharingModule {}
