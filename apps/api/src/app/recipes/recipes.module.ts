import { Module } from '@nestjs/common';
import { PrismaModule } from '@top-nosh/data-access';
import { GalleriesModule } from '../galleries/galleries.module';
import { RecipeImportService } from './recipe-import.service';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

@Module({
  imports: [ PrismaModule, GalleriesModule ],
  controllers: [ RecipesController ],
  providers: [ RecipesService, RecipeImportService ],
  exports: [ RecipesService, RecipeImportService ]
})
export class RecipesModule {}
