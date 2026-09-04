import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@top-nosh/data-access';
import * as argon2 from 'argon2';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { PaginatedUserResponse, UserResponseDto } from './dto/user-response.dto';

const PAGE_SIZE = 50;

export const userSelect = {
  id: true,
  fullName: true,
  email: true,
  createdAt: true,
  updatedAt: true
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          fullName: dto.fullName,
          email: dto.email,
          passwordHash,
          forcePasswordChange: true
        },
        select: userSelect
      });

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A user with this email already exists');
      }
      throw error;
    }
  }

  async getUsers(query?: UserQueryDto): Promise<PaginatedUserResponse> {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const total = await this.prisma.user.count();
    const totalPages = total === 0 ? 0 : Math.ceil(total / PAGE_SIZE);

    const data = await this.prisma.user.findMany({
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { fullName: 'asc' },
      select: userSelect
    });

    return {
      data,
      total,
      page,
      totalPages
    };
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async updateUser(userId: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    if (dto.email && dto.email !== user.email) {
      const existingWithEmail = await this.prisma.user.findUnique({
        where: { email: dto.email }
      });

      if (existingWithEmail) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.fullName !== undefined) {
      data.fullName = dto.fullName;
    }

    if (dto.email !== undefined) {
      data.email = dto.email;
    }

    if (dto.password) {
      data.passwordHash = await argon2.hash(dto.password);
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data,
        select: userSelect
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A user with this email already exists');
      }
      throw error;
    }
  }
}
