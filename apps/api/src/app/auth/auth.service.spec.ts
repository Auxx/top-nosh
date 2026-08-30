import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@top-nosh/data-access';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';

jest.mock('argon2', () => ({
  verify: jest.fn(),
  hash: jest.fn()
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let jwtService: {
    sign: jest.Mock;
  };

  const mockUser = {
    id: 'user-123',
    fullName: 'Aux',
    email: 'aux@hexmode.org',
    passwordHash: '$argon2id$v=19$m=65536,p=4,t=3$mockhash',
    forcePasswordChange: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prismaService = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn()
      }
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked.jwt.token')
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaService
        },
        {
          provide: JwtService,
          useValue: jwtService
        }
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return sanitized user when email and password are valid', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('aux@hexmode.org', 'Pass1234!!!!');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'aux@hexmode.org' }
      });
      expect(argon2.verify).toHaveBeenCalledWith(mockUser.passwordHash, 'Pass1234!!!!');
      expect(result).toEqual({
        id: mockUser.id,
        fullName: mockUser.fullName,
        email: mockUser.email,
        forcePasswordChange: mockUser.forcePasswordChange,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should return null if user is not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('notfound@hexmode.org', 'Pass1234!!!!');

      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('aux@hexmode.org', 'WrongPassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return JWT token and forcePasswordChange when credentials are valid', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'aux@hexmode.org',
        password: 'Pass1234!!!!'
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email
      });
      expect(result).toEqual({
        token: 'mocked.jwt.token',
        forcePasswordChange: true
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'invalid@hexmode.org',
          password: 'Pass1234!!!!'
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('should throw NotFoundException if user is not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('non-existent-user', 'NewPass123456!')
      ).rejects.toThrow(NotFoundException);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-user' }
      });
    });

    it('should hash password with argon2 and update user with forcePasswordChange=false', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (argon2.hash as jest.Mock).mockResolvedValue('$argon2id$v=19$newhashedpassword');
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        passwordHash: '$argon2id$v=19$newhashedpassword',
        forcePasswordChange: false
      });

      const result = await service.changePassword(mockUser.id, 'NewPass123456!');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id }
      });
      expect(argon2.hash).toHaveBeenCalledWith('NewPass123456!');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          passwordHash: '$argon2id$v=19$newhashedpassword',
          forcePasswordChange: false
        }
      });
      expect(result).toEqual({
        message: 'Password changed successfully'
      });
    });
  });
});
