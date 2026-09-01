import {
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
import { ShoppingList } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { ShoppingListQueryDto } from './dto/shopping-list-query.dto';
import {
  DeleteShoppingListResponse,
  PaginatedShoppingListResponse,
  ShoppingListCreatedResponse,
  ShoppingListWithDetails
} from './dto/shopping-list-response.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';
import { ShoppingListsService } from './shopping-lists.service';

@Controller('shopping-lists')
@UseGuards(JwtAuthGuard)
export class ShoppingListsController {
  constructor(private readonly shoppingListsService: ShoppingListsService) {}

  @Get()
  async getShoppingLists(
    @Query() query: ShoppingListQueryDto
  ): Promise<PaginatedShoppingListResponse> {
    return this.shoppingListsService.getShoppingLists(query);
  }

  @Get('recent')
  async getRecentShoppingLists(): Promise<ShoppingList[]> {
    return this.shoppingListsService.getRecentShoppingLists();
  }

  @Get(':id')
  async getShoppingListById(
    @Param('id') id: string
  ): Promise<ShoppingListWithDetails> {
    return this.shoppingListsService.getShoppingListById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createShoppingList(
    @Body() createShoppingListDto: CreateShoppingListDto
  ): Promise<ShoppingListCreatedResponse> {
    return this.shoppingListsService.createShoppingList(createShoppingListDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateShoppingList(
    @Param('id') id: string,
    @Body() updateShoppingListDto: UpdateShoppingListDto
  ): Promise<ShoppingListWithDetails> {
    return this.shoppingListsService.updateShoppingList(
      id,
      updateShoppingListDto
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteShoppingList(
    @Param('id') id: string
  ): Promise<DeleteShoppingListResponse> {
    return this.shoppingListsService.deleteShoppingList(id);
  }
}
