import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ShoppingList } from '@prisma/client';
import { PrismaService } from '@top-nosh/data-access';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { ShoppingListQueryDto } from './dto/shopping-list-query.dto';
import {
  DeleteShoppingListResponse,
  PaginatedShoppingListResponse,
  ShoppingListCreatedResponse,
  ShoppingListWithDetails
} from './dto/shopping-list-response.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';

const PAGE_SIZE = 50;

@Injectable()
export class ShoppingListsService {
  constructor(private readonly prisma: PrismaService) {}

  async getShoppingLists(
    query: ShoppingListQueryDto
  ): Promise<PaginatedShoppingListResponse> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const where: Prisma.ShoppingListWhereInput = { deletedAt: null };

    const total = await this.prisma.shoppingList.count({ where });
    const totalPages = total === 0 ? 0 : Math.ceil(total / PAGE_SIZE);

    const data = await this.prisma.shoppingList.findMany({
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

  async getRecentShoppingLists(): Promise<ShoppingList[]> {
    return this.prisma.shoppingList.findMany({
      where: { deletedAt: null },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getShoppingListById(id: string): Promise<ShoppingListWithDetails> {
    const shoppingList = await this.prisma.shoppingList.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!shoppingList) {
      throw new NotFoundException(`Shopping list with ID "${id}" not found`);
    }

    return shoppingList as ShoppingListWithDetails;
  }

  async createShoppingList(
    dto: CreateShoppingListDto
  ): Promise<ShoppingListCreatedResponse> {
    const shoppingList = await this.prisma.shoppingList.create({
      data: {
        name: dto.name,
        description: dto.description,
        items: {
          create: dto.items.map((item, itemIdx) => ({
            name: item.name,
            quantity: item.quantity,
            isBought: item.isBought ?? false,
            order: item.order ?? itemIdx
          }))
        }
      }
    });

    return { id: shoppingList.id };
  }

  async updateShoppingList(
    id: string,
    dto: UpdateShoppingListDto
  ): Promise<ShoppingListWithDetails> {
    return this.prisma.$transaction(async tx => {
      const existing = await tx.shoppingList.findFirst({
        where: { id, deletedAt: null },
        include: {
          items: true
        }
      });

      if (!existing) {
        throw new NotFoundException(`Shopping list with ID "${id}" not found`);
      }

      await tx.shoppingList.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description
        }
      });

      const existingItemMap = new Map(existing.items.map(i => [ i.id, i ]));
      const incomingItemIds = new Set(
        dto.items.filter(i => i.id).map(i => i.id!)
      );

      const itemsToDelete = existing.items.filter(
        i => !incomingItemIds.has(i.id)
      );
      if (itemsToDelete.length > 0) {
        await tx.shoppingListItem.deleteMany({
          where: { id: { in: itemsToDelete.map(i => i.id) } }
        });
      }

      for (let itemIdx = 0; itemIdx < dto.items.length; itemIdx++) {
        const itemDto = dto.items[itemIdx];
        const itemOrder = itemDto.order ?? itemIdx;

        if (itemDto.id && existingItemMap.has(itemDto.id)) {
          await tx.shoppingListItem.update({
            where: { id: itemDto.id },
            data: {
              name: itemDto.name,
              quantity: itemDto.quantity,
              isBought: itemDto.isBought,
              order: itemOrder
            }
          });
        } else {
          await tx.shoppingListItem.create({
            data: {
              shoppingListId: id,
              name: itemDto.name,
              quantity: itemDto.quantity,
              isBought: itemDto.isBought ?? false,
              order: itemOrder
            }
          });
        }
      }

      const updated = await tx.shoppingList.findFirst({
        where: { id },
        include: {
          items: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return updated as ShoppingListWithDetails;
    });
  }

  async deleteShoppingList(id: string): Promise<DeleteShoppingListResponse> {
    const existing = await this.prisma.shoppingList.findFirst({
      where: { id, deletedAt: null }
    });

    if (!existing) {
      throw new NotFoundException(`Shopping list with ID "${id}" not found`);
    }

    await this.prisma.shoppingList.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return { message: 'Shopping list deleted successfully' };
  }
}
