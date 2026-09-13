import { Module } from '@nestjs/common';
import { WebStartUpController } from './web-start-up.controller';

@Module({
  controllers: [ WebStartUpController ]
})
export class WebStartUpModule {}
