import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RecipeImportService } from '../recipes/recipe-import.service';
import { DevelopmentModeGuard } from './guards/development-mode.guard';

@Controller('debug')
@UseGuards(DevelopmentModeGuard)
export class DebugController {
  constructor(private readonly recipeImportService: RecipeImportService) {}

  @Get('recipe/import')
  // Required by specification until incoming recipe data structure is analyzed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async importRecipe(@Query('recipe-url') recipeUrl: string): Promise<any> {
    if (recipeUrl.trim() === '') {
      throw new BadRequestException('Query parameter "recipe-url" is required');
    }

    return this.recipeImportService.fetchRecipeFromUrl(recipeUrl);
  }

  @Get('recipe/interface')
  async getRecipeInterface(@Query('recipe-url') recipeUrl: string): Promise<{ interface: string; }> {
    if (recipeUrl.trim() === '') {
      throw new BadRequestException('Query parameter "recipe-url" is required');
    }

    const interfaceDefinition = await this.recipeImportService.generateTypeScriptInterface(recipeUrl);

    return { interface: interfaceDefinition };
  }
}
