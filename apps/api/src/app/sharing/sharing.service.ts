import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@top-nosh/data-access';
import { RecipeWithDetails } from '../recipes/dto/recipe-response.dto';

@Injectable()
export class SharingService {
  constructor(private readonly prisma: PrismaService) {}

  async getSharedRecipeById(id: string): Promise<RecipeWithDetails> {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, isShared: true, deletedAt: null },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            steps: { orderBy: { order: 'asc' } },
            ingredients: { orderBy: { order: 'asc' } }
          }
        }
      }
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe with ID "${id}" not found`);
    }

    return recipe as RecipeWithDetails;
  }
}
