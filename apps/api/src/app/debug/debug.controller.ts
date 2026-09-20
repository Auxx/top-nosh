import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ImportedRecipeResponse } from '../recipes/dto/recipe-response.dto';
import { RecipeImportService } from '../recipes/recipe-import.service';
import { RecipeImportResponse } from '../recipes/recipe-import/wprm.types';
import { DevelopmentModeGuard } from './guards/development-mode.guard';

@Controller('debug')
@UseGuards(DevelopmentModeGuard)
export class DebugController {
  constructor(private readonly recipeImportService: RecipeImportService) {}

  @Get('recipe/import')
  async importRecipe(@Query('recipe-url') recipeUrl: string): Promise<RecipeImportResponse> {
    if (!recipeUrl || recipeUrl.trim() === '') {
      throw new BadRequestException('Query parameter "recipe-url" is required');
    }

    const html = await this.recipeImportService.fetchRecipeHtmlFromUrl(recipeUrl);
    const metadata = this.recipeImportService.extractRecipeMetadata(html);
    const instructions = this.recipeImportService.extractCookingInstructions(html);

    return { metadata, instructions };
  }

  @Get('recipe/parse')
  async parseRecipe(@Query('recipe-url') recipeUrl: string): Promise<ImportedRecipeResponse> {
    if (!recipeUrl || recipeUrl.trim() === '') {
      throw new BadRequestException('Query parameter "recipe-url" is required');
    }

    return await this.recipeImportService.fetchRecipe(recipeUrl);
  }
}
