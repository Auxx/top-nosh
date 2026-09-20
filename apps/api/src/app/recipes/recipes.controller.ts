import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RecipeQueryDto } from './dto/recipe-query.dto';
import {
  CuisineCategoryTreeItem,
  DeleteRecipeResponse,
  ImportedRecipeResponse,
  PaginatedRecipeResponse,
  RecipeCreatedResponse,
  RecipeWithDetails
} from './dto/recipe-response.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeImportService } from './recipe-import.service';
import { RecipesService } from './recipes.service';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly recipeImportService: RecipeImportService
  ) {}

  @Get('cuisines-categories')
  async getCuisinesAndCategories(): Promise<CuisineCategoryTreeItem[]> {
    return this.recipesService.getCuisinesAndCategories();
  }

  @Get('import')
  async importRecipe(
    @Query('recipe-url') recipeUrl?: string
  ): Promise<ImportedRecipeResponse> {
    // URL.canParse() already validates all possible scenarios and data types, no need to validate further
    if (!URL.canParse(recipeUrl)) {
      throw new BadRequestException('Query parameter "recipe-url" must be a valid URL');
    }

    try {
      return await this.recipeImportService.fetchRecipe(recipeUrl.trim());
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to import recipe: ${message}`);
    }
  }

  @Get()
  async getRecipes(
    @Query() query: RecipeQueryDto
  ): Promise<PaginatedRecipeResponse> {
    return this.recipesService.getRecipes(query);
  }

  @Get(':id')
  async getRecipeById(@Param('id') id: string): Promise<RecipeWithDetails> {
    return this.recipesService.getRecipeById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRecipe(
    @Body() createRecipeDto: CreateRecipeDto
  ): Promise<RecipeCreatedResponse> {
    return this.recipesService.createRecipe(createRecipeDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateRecipe(
    @Param('id') id: string,
    @Body() updateRecipeDto: UpdateRecipeDto
  ): Promise<RecipeWithDetails> {
    return this.recipesService.updateRecipe(id, updateRecipeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteRecipe(
    @Param('id') id: string
  ): Promise<DeleteRecipeResponse> {
    return this.recipesService.deleteRecipe(id);
  }
}
