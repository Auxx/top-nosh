import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UsersService } from './users.service';

describe('UserController', () => {
  let controller: UserController;
  let usersService: {
    createUser: jest.Mock;
    getUsers: jest.Mock;
    getUserById: jest.Mock;
    updateUser: jest.Mock;
  };

  const mockUserResponse = {
    id: 'user-uuid-1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z')
  };

  beforeEach(async () => {
    usersService = {
      createUser: jest.fn(),
      getUsers: jest.fn(),
      getUserById: jest.fn(),
      updateUser: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ UserController ],
      providers: [
        {
          provide: UsersService,
          useValue: usersService
        }
      ]
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUsers', () => {
    it('should delegate to usersService.getUsers and return paginated users', async () => {
      const paginatedResult = {
        data: [ mockUserResponse ],
        total: 1,
        page: 1,
        totalPages: 1
      };
      usersService.getUsers.mockResolvedValue(paginatedResult);

      const result = await controller.getUsers({ page: 1 });

      expect(usersService.getUsers).toHaveBeenCalledWith({ page: 1 });
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('getUserById', () => {
    it('should delegate to usersService.getUserById and return user', async () => {
      usersService.getUserById.mockResolvedValue(mockUserResponse);

      const result = await controller.getUserById('user-uuid-1');

      expect(usersService.getUserById).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('createUser', () => {
    it('should delegate to usersService.createUser and return created user', async () => {
      const createDto = {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password12345'
      };
      usersService.createUser.mockResolvedValue(mockUserResponse);

      const result = await controller.createUser(createDto);

      expect(usersService.createUser).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('updateCurrentUser', () => {
    it('should deduct user ID from req.user.userId and call usersService.updateUser', async () => {
      const updateDto = { fullName: 'Updated Jane' };
      const req = { user: { userId: 'user-uuid-1' } };
      usersService.updateUser.mockResolvedValue({
        ...mockUserResponse,
        fullName: 'Updated Jane'
      });

      const result = await controller.updateCurrentUser(req, updateDto);

      expect(usersService.updateUser).toHaveBeenCalledWith('user-uuid-1', updateDto);
      expect(result.fullName).toBe('Updated Jane');
    });
  });

  describe('updateUser', () => {
    it('should permit update when id matches req.user.userId', async () => {
      const updateDto = { fullName: 'Updated Jane' };
      const req = { user: { userId: 'user-uuid-1' } };
      usersService.updateUser.mockResolvedValue({
        ...mockUserResponse,
        fullName: 'Updated Jane'
      });

      const result = await controller.updateUser('user-uuid-1', req, updateDto);

      expect(usersService.updateUser).toHaveBeenCalledWith('user-uuid-1', updateDto);
      expect(result.fullName).toBe('Updated Jane');
    });

    it('should throw ForbiddenException when id does not match req.user.userId', async () => {
      const updateDto = { fullName: 'Hacked Name' };
      const req = { user: { userId: 'user-uuid-1' } };

      await expect(
        controller.updateUser('other-user-uuid', req, updateDto)
      ).rejects.toThrow(ForbiddenException);

      expect(usersService.updateUser).not.toHaveBeenCalled();
    });
  });
});
