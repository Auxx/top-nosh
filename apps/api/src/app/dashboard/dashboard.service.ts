import { Injectable } from '@nestjs/common';
import { PrismaService } from '@top-nosh/data-access';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(): Promise<DashboardResponseDto> {
    const recipes = await this.prisma.recipe.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true
      }
    });

    const shoppingList = await this.prisma.shoppingList.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        items: {
          take: 5,
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return {
      recipes,
      shoppingList: shoppingList ?? null
    };
  }
}
