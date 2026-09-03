import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { PaginatedUserResponse, UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers(@Query() query: UserQueryDto): Promise<PaginatedUserResponse> {
    return this.usersService.getUsers(query);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.getUserById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.createUser(createUserDto);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  async updateCurrentUser(
    @Req() req: { user: { userId: string; }; },
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(req.user.userId, updateUserDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id') id: string,
    @Req() req: { user: { userId: string; }; },
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    if (id !== req.user.userId) {
      throw new ForbiddenException('You are not allowed to update another user');
    }
    return this.usersService.updateUser(id, updateUserDto);
  }
}
