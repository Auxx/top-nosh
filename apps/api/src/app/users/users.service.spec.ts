import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@top-nosh/data-access';
import * as argon2 from 'argon2';
import { UsersService } from './users.service';

jest.mock('argon2', () => ({
  hash: jest.fn()
}));

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: {
    user: {
      count: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockUserResponse = {
    id: 'user-uuid-1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z')
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prismaService = {
      user: {
        count: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaService
        }
      ]
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('createUser', () => {
    const createDto = {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password12345'
    };

    it('should create user, hash password, and set forcePasswordChange to true', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-pwd');
      prismaService.user.create.mockResolvedValue(mockUserResponse);

      const result = await service.createUser(createDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: createDto.email }
      });
      expect(argon2.hash).toHaveBeenCalledWith(createDto.password);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          fullName: createDto.fullName,
          email: createDto.email,
          passwordHash: 'hashed-pwd',
          forcePasswordChange: true
        },
        select: expect.any(Object)
      });
      expect(result).toEqual(mockUserResponse);
    });

    it('should throw ConflictException if user with email already exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUserResponse);

      await expect(service.createUser(createDto)).rejects.toThrow(ConflictException);
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException on Prisma P2002 unique constraint error', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-pwd');
      const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0'
      });
      prismaService.user.create.mockRejectedValue(p2002Error);

      await expect(service.createUser(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getUsers', () => {
    it('should return paginated users sorted by fullName asc', async () => {
      prismaService.user.count.mockResolvedValue(1);
      prismaService.user.findMany.mockResolvedValue([ mockUserResponse ]);

      const result = await service.getUsers({ page: 1 });

      expect(prismaService.user.count).toHaveBeenCalledTimes(1);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 50,
        orderBy: { fullName: 'asc' },
        select: expect.any(Object)
      });
      expect(result).toEqual({
        data: [ mockUserResponse ],
        total: 1,
        page: 1,
        totalPages: 1
      });
    });

    it('should default to page 1 when page is not provided or <= 0', async () => {
      prismaService.user.count.mockResolvedValue(0);
      prismaService.user.findMany.mockResolvedValue([]);

      const result = await service.getUsers({ page: 0 });

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 50 })
      );
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUserResponse);

      const result = await service.getUserById('user-uuid-1');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        select: expect.any(Object)
      });
      expect(result).toEqual(mockUserResponse);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUser('non-existent', { fullName: 'New Name' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new email is already in use by another user', async () => {
      prismaService.user.findUnique
        .mockResolvedValueOnce(mockUserResponse) // user check
        .mockResolvedValueOnce({ id: 'another-user-id', email: 'other@example.com' }); // email check

      await expect(
        service.updateUser('user-uuid-1', { email: 'other@example.com' })
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully update user and re-hash password if password is provided', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUserResponse);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed-pwd');
      prismaService.user.update.mockResolvedValue({
        ...mockUserResponse,
        fullName: 'Updated Name'
      });

      const result = await service.updateUser('user-uuid-1', {
        fullName: 'Updated Name',
        password: 'newSecretPassword123'
      });

      expect(argon2.hash).toHaveBeenCalledWith('newSecretPassword123');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: {
          fullName: 'Updated Name',
          passwordHash: 'new-hashed-pwd'
        },
        select: expect.any(Object)
      });
      expect(result.fullName).toBe('Updated Name');
    });

    it('should throw ConflictException on Prisma P2002 error during update', async () => {
      prismaService.user.findUnique
        .mockResolvedValueOnce(mockUserResponse)
        .mockResolvedValueOnce(null);

      const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0'
      });
      prismaService.user.update.mockRejectedValue(p2002Error);

      await expect(
        service.updateUser('user-uuid-1', { email: 'taken@example.com' })
      ).rejects.toThrow(ConflictException);
    });
  });
});
