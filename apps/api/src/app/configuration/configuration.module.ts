import { Module } from '@nestjs/common';
import { Configuration } from './configuration.controller';

@Module({
  controllers: [ Configuration ]
})
export class ConfigurationModule {}
