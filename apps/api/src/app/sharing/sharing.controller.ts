import { Controller, Get, Param } from '@nestjs/common';
import { RecipeWithDetails } from '../recipes/dto/recipe-response.dto';
import { SharingService } from './sharing.service';

@Controller('share')
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Get('recipe/:id')
  async getSharedRecipeById(
    @Param('id') id: string
  ): Promise<RecipeWithDetails> {
    return this.sharingService.getSharedRecipeById(id);
  }
}
