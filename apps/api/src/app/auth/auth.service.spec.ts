import { HttpException, HttpStatus, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService, TokenType } from '@top-nosh/data-access';
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
      count: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    userToken: {
      create: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
      findFirst: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let jwtService: {
    sign: jest.Mock;
    verifyAsync: jest.Mock;
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
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      userToken: {
        create: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        findFirst: jest.fn()
      },
      $transaction: jest.fn().mockImplementation(cb => cb(prismaService))
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked.jwt.token'),
      verifyAsync: jest.fn()
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

  describe('onboardingRequired', () => {
    it('should return onboardingRequired true when count is 0', async () => {
      prismaService.user.count.mockResolvedValue(0);

      const result = await service.onboardingRequired();

      expect(prismaService.user.count).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ onboardingRequired: true });
    });

    it('should return onboardingRequired false when count is greater than 0', async () => {
      prismaService.user.count.mockResolvedValue(1);

      const result = await service.onboardingRequired();

      expect(prismaService.user.count).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ onboardingRequired: false });
    });
  });

  describe('onboardUser', () => {
    const onboardDto = {
      fullName: 'Admin User',
      email: 'admin@example.com',
      password: 'SuperSecret1234!'
    };

    it('should create user and return message when no users exist', async () => {
      prismaService.user.count.mockResolvedValue(0);
      (argon2.hash as jest.Mock).mockResolvedValue('$argon2id$v=19$mockedhashedpassword');
      prismaService.user.create.mockResolvedValue({
        id: 'new-user-id',
        ...onboardDto,
        passwordHash: '$argon2id$v=19$mockedhashedpassword',
        forcePasswordChange: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await service.onboardUser(onboardDto);

      expect(prismaService.user.count).toHaveBeenCalledTimes(1);
      expect(argon2.hash).toHaveBeenCalledWith('SuperSecret1234!');
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          fullName: 'Admin User',
          email: 'admin@example.com',
          passwordHash: '$argon2id$v=19$mockedhashedpassword',
          forcePasswordChange: false
        }
      });
      expect(result).toEqual({ message: 'User onboarded successfully' });
    });

    it('should throw UnauthorizedException when users already exist', async () => {
      prismaService.user.count.mockResolvedValue(1);

      await expect(service.onboardUser(onboardDto)).rejects.toThrow(UnauthorizedException);
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
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
    it('should return auth token, refresh token and forcePasswordChange when credentials are valid', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      jwtService.sign
        .mockReturnValueOnce('mocked.jwt.token')
        .mockReturnValueOnce('mocked.refresh.token');
      prismaService.userToken.create.mockResolvedValue({
        id: 'token-id',
        userId: mockUser.id,
        token: 'mocked.jwt.token',
        type: TokenType.AUTHENTICATION,
        createdAt: new Date()
      });

      const result = await service.login({
        email: 'aux@hexmode.org',
        password: 'Pass1234!!!!'
      });

      expect(jwtService.sign).toHaveBeenNthCalledWith(1, {
        sub: mockUser.id,
        email: mockUser.email
      });
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        {
          sub: mockUser.id,
          email: mockUser.email
        },
        { expiresIn: '30d' }
      );
      expect(prismaService.userToken.create).toHaveBeenNthCalledWith(1, {
        data: {
          userId: mockUser.id,
          token: 'mocked.jwt.token',
          type: TokenType.AUTHENTICATION
        }
      });
      expect(prismaService.userToken.create).toHaveBeenNthCalledWith(2, {
        data: {
          userId: mockUser.id,
          token: 'mocked.refresh.token',
          type: TokenType.REFRESH
        }
      });
      expect(result).toEqual({
        token: 'mocked.jwt.token',
        refreshToken: 'mocked.refresh.token',
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
      expect(prismaService.userToken.create).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should delete the user token matching userId and token when no refreshToken is provided', async () => {
      prismaService.userToken.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('user-123', 'some-token');

      expect(prismaService.userToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          token: { in: [ 'some-token' ] }
        }
      });
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should delete both tokens matching userId and tokens when refreshToken is provided', async () => {
      prismaService.userToken.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.logout('user-123', 'some-token', 'some-refresh-token');

      expect(prismaService.userToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          token: { in: [ 'some-token', 'some-refresh-token' ] }
        }
      });
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('refresh', () => {
    const validRefreshToken = 'valid.refresh.token';
    const refreshPayload = {
      sub: 'user-123',
      email: 'aux@hexmode.org'
    };

    it('should rotate tokens and return new token pair when refresh token is valid', async () => {
      jwtService.verifyAsync.mockResolvedValue(refreshPayload);
      prismaService.userToken.findFirst.mockResolvedValue({
        id: 'token-uuid-1',
        token: validRefreshToken,
        userId: 'user-123',
        type: TokenType.REFRESH
      });
      jwtService.sign
        .mockReturnValueOnce('new.auth.token')
        .mockReturnValueOnce('new.refresh.token');

      const result = await service.refresh(validRefreshToken);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(validRefreshToken);
      expect(prismaService.userToken.findFirst).toHaveBeenCalledWith({
        where: {
          token: validRefreshToken,
          userId: 'user-123',
          type: TokenType.REFRESH
        }
      });
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(prismaService.userToken.delete).toHaveBeenCalledWith({
        where: { id: 'token-uuid-1' }
      });
      expect(prismaService.userToken.create).toHaveBeenNthCalledWith(1, {
        data: {
          userId: 'user-123',
          token: 'new.auth.token',
          type: TokenType.AUTHENTICATION
        }
      });
      expect(prismaService.userToken.create).toHaveBeenNthCalledWith(2, {
        data: {
          userId: 'user-123',
          token: 'new.refresh.token',
          type: TokenType.REFRESH
        }
      });
      expect(result).toEqual({
        token: 'new.auth.token',
        refreshToken: 'new.refresh.token'
      });
    });

    it('should throw 403 Forbidden when refresh token signature is invalid or expired', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

      await expect(service.refresh('invalid.token')).rejects.toThrow(HttpException);
      await expect(service.refresh('invalid.token')).rejects.toMatchObject({
        status: HttpStatus.FORBIDDEN
      });
      expect(prismaService.userToken.findFirst).not.toHaveBeenCalled();
    });

    it('should throw 403 Forbidden when refresh token is revoked or not found in database', async () => {
      jwtService.verifyAsync.mockResolvedValue(refreshPayload);
      prismaService.userToken.findFirst.mockResolvedValue(null);

      await expect(service.refresh('revoked.token')).rejects.toThrow(HttpException);
      await expect(service.refresh('revoked.token')).rejects.toMatchObject({
        status: HttpStatus.FORBIDDEN
      });
      expect(prismaService.userToken.findFirst).toHaveBeenCalledWith({
        where: {
          token: 'revoked.token',
          userId: 'user-123',
          type: TokenType.REFRESH
        }
      });
      expect(prismaService.userToken.delete).not.toHaveBeenCalled();
      expect(prismaService.userToken.create).not.toHaveBeenCalled();
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
