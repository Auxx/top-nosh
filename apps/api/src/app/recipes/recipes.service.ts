import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@top-nosh/data-access';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RecipeQueryDto } from './dto/recipe-query.dto';
import {
  CuisineCategoryTreeItem,
  DeleteRecipeResponse,
  PaginatedRecipeResponse,
  RecipeCreatedResponse,
  RecipeWithDetails
} from './dto/recipe-response.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

const PAGE_SIZE = 50;

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCuisinesAndCategories(): Promise<CuisineCategoryTreeItem[]> {
    const pairs = await this.prisma.recipe.findMany({
      where: { deletedAt: null },
      select: { cuisine: true, category: true },
      distinct: [ 'cuisine', 'category' ]
    });

    const cuisineMap = new Map<string, Set<string>>();

    for (const pair of pairs) {
      if (!cuisineMap.has(pair.cuisine)) {
        cuisineMap.set(pair.cuisine, new Set());
      }
      cuisineMap.get(pair.cuisine)!.add(pair.category);
    }

    const sortedCuisines = Array.from(cuisineMap.keys()).sort((a, b) => a.localeCompare(b));

    return sortedCuisines.map(cuisine => ({
      cuisine,
      categories: Array.from(cuisineMap.get(cuisine)!).sort((a, b) => a.localeCompare(b))
    }));
  }

  async getRecipes(query: RecipeQueryDto): Promise<PaginatedRecipeResponse> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const where: Prisma.RecipeWhereInput = { deletedAt: null };

    if (query.search && query.search.trim() !== '') {
      where.name = { contains: query.search.trim() };
    }

    if (query.cuisine) {
      where.cuisine = query.cuisine;
    }

    if (query.category) {
      where.category = query.category;
    }

    const total = await this.prisma.recipe.count({ where });
    const totalPages = total === 0 ? 0 : Math.ceil(total / PAGE_SIZE);

    const data = await this.prisma.recipe.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' }
    });

    return {
      data,
      total,
      page,
      totalPages
    };
  }

  async getRecipeById(id: string): Promise<RecipeWithDetails> {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, deletedAt: null },
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

  async createRecipe(dto: CreateRecipeDto): Promise<RecipeCreatedResponse> {
    const recipe = await this.prisma.recipe.create({
      data: {
        name: dto.name,
        cuisine: dto.cuisine,
        category: dto.category,
        description: dto.description,
        servings: dto.servings,
        stages: {
          create: dto.stages.map((stage, stageIdx) => ({
            name: stage.name,
            order: stage.order ?? stageIdx,
            steps: {
              create: stage.steps.map((step, stepIdx) => ({
                name: step.name,
                description: step.description,
                order: step.order ?? stepIdx
              }))
            },
            ingredients: {
              create: stage.ingredients.map((ing, ingIdx) => ({
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                order: ing.order ?? ingIdx
              }))
            }
          }))
        }
      }
    });

    return { id: recipe.id };
  }

  async updateRecipe(
    id: string,
    dto: UpdateRecipeDto
  ): Promise<RecipeWithDetails> {
    return this.prisma.$transaction(async tx => {
      const existing = await tx.recipe.findFirst({
        where: { id, deletedAt: null },
        include: {
          stages: {
            include: {
              steps: true,
              ingredients: true
            }
          }
        }
      });

      if (!existing) {
        throw new NotFoundException(`Recipe with ID "${id}" not found`);
      }

      await tx.recipe.update({
        where: { id },
        data: {
          name: dto.name,
          cuisine: dto.cuisine,
          category: dto.category,
          description: dto.description,
          servings: dto.servings
        }
      });

      const existingStageMap = new Map(existing.stages.map(s => [ s.id, s ]));
      const incomingStageIds = new Set(
        dto.stages.filter(s => s.id).map(s => s.id!)
      );

      const stagesToDelete = existing.stages.filter(
        s => !incomingStageIds.has(s.id)
      );
      if (stagesToDelete.length > 0) {
        await tx.recipeStage.deleteMany({
          where: { id: { in: stagesToDelete.map(s => s.id) } }
        });
      }

      for (let stageIdx = 0; stageIdx < dto.stages.length; stageIdx++) {
        const stageDto = dto.stages[stageIdx];
        const stageOrder = stageDto.order ?? stageIdx;

        if (stageDto.id && existingStageMap.has(stageDto.id)) {
          const existingStage = existingStageMap.get(stageDto.id)!;

          await tx.recipeStage.update({
            where: { id: stageDto.id },
            data: {
              name: stageDto.name,
              order: stageOrder
            }
          });

          // Sync steps
          const existingStepMap = new Map(
            existingStage.steps.map(st => [ st.id, st ])
          );
          const incomingStepIds = new Set(
            stageDto.steps.filter(st => st.id).map(st => st.id!)
          );
          const stepsToDelete = existingStage.steps.filter(
            st => !incomingStepIds.has(st.id)
          );

          if (stepsToDelete.length > 0) {
            await tx.cookingStep.deleteMany({
              where: { id: { in: stepsToDelete.map(st => st.id) } }
            });
          }

          for (let stepIdx = 0; stepIdx < stageDto.steps.length; stepIdx++) {
            const stepDto = stageDto.steps[stepIdx];
            const stepOrder = stepDto.order ?? stepIdx;

            if (stepDto.id && existingStepMap.has(stepDto.id)) {
              await tx.cookingStep.update({
                where: { id: stepDto.id },
                data: {
                  name: stepDto.name,
                  description: stepDto.description,
                  order: stepOrder
                }
              });
            } else {
              await tx.cookingStep.create({
                data: {
                  stageId: stageDto.id,
                  name: stepDto.name,
                  description: stepDto.description,
                  order: stepOrder
                }
              });
            }
          }

          // Sync ingredients
          const existingIngMap = new Map(
            existingStage.ingredients.map(ing => [ ing.id, ing ])
          );
          const incomingIngIds = new Set(
            stageDto.ingredients.filter(ing => ing.id).map(ing => ing.id!)
          );
          const ingsToDelete = existingStage.ingredients.filter(
            ing => !incomingIngIds.has(ing.id)
          );

          if (ingsToDelete.length > 0) {
            await tx.ingredient.deleteMany({
              where: { id: { in: ingsToDelete.map(ing => ing.id) } }
            });
          }

          for (let ingIdx = 0; ingIdx < stageDto.ingredients.length; ingIdx++) {
            const ingDto = stageDto.ingredients[ingIdx];
            const ingOrder = ingDto.order ?? ingIdx;

            if (ingDto.id && existingIngMap.has(ingDto.id)) {
              await tx.ingredient.update({
                where: { id: ingDto.id },
                data: {
                  name: ingDto.name,
                  quantity: ingDto.quantity,
                  unit: ingDto.unit,
                  order: ingOrder
                }
              });
            } else {
              await tx.ingredient.create({
                data: {
                  stageId: stageDto.id,
                  name: ingDto.name,
                  quantity: ingDto.quantity,
                  unit: ingDto.unit,
                  order: ingOrder
                }
              });
            }
          }
        } else {
          // New stage
          await tx.recipeStage.create({
            data: {
              recipeId: id,
              name: stageDto.name,
              order: stageOrder,
              steps: {
                create: stageDto.steps.map((step, stepIdx) => ({
                  name: step.name,
                  description: step.description,
                  order: step.order ?? stepIdx
                }))
              },
              ingredients: {
                create: stageDto.ingredients.map((ing, ingIdx) => ({
                  name: ing.name,
                  quantity: ing.quantity,
                  unit: ing.unit,
                  order: ing.order ?? ingIdx
                }))
              }
            }
          });
        }
      }

      const updated = await tx.recipe.findFirst({
        where: { id },
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

      return updated as RecipeWithDetails;
    });
  }

  async deleteRecipe(id: string): Promise<DeleteRecipeResponse> {
    const existing = await this.prisma.recipe.findFirst({
      where: { id, deletedAt: null }
    });

    if (!existing) {
      throw new NotFoundException(`Recipe with ID "${id}" not found`);
    }

    await this.prisma.recipe.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return { message: 'Recipe deleted successfully' };
  }
}
