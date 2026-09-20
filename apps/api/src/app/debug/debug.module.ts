import { Module } from '@nestjs/common';
import { RecipesModule } from '../recipes/recipes.module';
import { DebugController } from './debug.controller';
import { DevelopmentModeGuard } from './guards/development-mode.guard';

@Module({
  imports: [ RecipesModule ],
  controllers: [ DebugController ],
  providers: [ DevelopmentModeGuard ]
})
export class DebugModule {}
