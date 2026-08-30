import { Module } from '@nestjs/common';
import { PrismaModule } from '@top-nosh/data-access';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

@Module({
  imports: [ PrismaModule ],
  controllers: [ RecipesController ],
  providers: [ RecipesService ],
  exports: [ RecipesService ]
})
export class RecipesModule {}
