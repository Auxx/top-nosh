import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WebStartUpController } from './web-start-up.controller';

@Module({
  imports: [ AuthModule ],
  controllers: [ WebStartUpController ]
})
export class WebStartUpModule {}
