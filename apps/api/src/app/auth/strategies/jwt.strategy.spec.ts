import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService, TokenType } from '@top-nosh/data-access';
import type { Request } from 'express';
import { JwtPayload } from '../dto/login.dto';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: {
    userToken: {
      findFirst: jest.Mock;
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prismaService = {
      userToken: {
        findFirst: jest.fn()
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: prismaService
        }
      ]
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  const payload: JwtPayload = {
    sub: 'user-123',
    email: 'test@example.com'
  };

  it('should validate and return user details with token when token exists in database', async () => {
    const mockRequest = {
      headers: {
        authorization: 'Bearer valid-token-123'
      }
    } as unknown as Request;

    prismaService.userToken.findFirst.mockResolvedValue({
      id: 'token-uuid',
      userId: 'user-123',
      token: 'valid-token-123',
      createdAt: new Date()
    });

    const result = await strategy.validate(mockRequest, payload);

    expect(prismaService.userToken.findFirst).toHaveBeenCalledWith({
      where: {
        token: 'valid-token-123',
        userId: 'user-123',
        type: TokenType.AUTHENTICATION
      }
    });
    expect(result).toEqual({
      userId: 'user-123',
      email: 'test@example.com',
      token: 'valid-token-123'
    });
  });

  it('should throw UnauthorizedException when token is missing from request header', async () => {
    const mockRequest = {
      headers: {}
    } as unknown as Request;

    await expect(strategy.validate(mockRequest, payload)).rejects.toThrow(
      new UnauthorizedException('Authentication token is missing')
    );
    expect(prismaService.userToken.findFirst).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when token is revoked or not found in database', async () => {
    const mockRequest = {
      headers: {
        authorization: 'Bearer revoked-token'
      }
    } as unknown as Request;

    prismaService.userToken.findFirst.mockResolvedValue(null);

    await expect(strategy.validate(mockRequest, payload)).rejects.toThrow(
      new UnauthorizedException('Authentication token is invalid or has been revoked')
    );
    expect(prismaService.userToken.findFirst).toHaveBeenCalledWith({
      where: {
        token: 'revoked-token',
        userId: 'user-123',
        type: TokenType.AUTHENTICATION
      }
    });
  });

  it('should throw UnauthorizedException when token type is not AUTHENTICATION', async () => {
    const mockRequest = {
      headers: {
        authorization: 'Bearer refresh-token'
      }
    } as unknown as Request;

    prismaService.userToken.findFirst.mockResolvedValue(null);

    await expect(strategy.validate(mockRequest, payload)).rejects.toThrow(
      new UnauthorizedException('Authentication token is invalid or has been revoked')
    );
    expect(prismaService.userToken.findFirst).toHaveBeenCalledWith({
      where: {
        token: 'refresh-token',
        userId: 'user-123',
        type: TokenType.AUTHENTICATION
      }
    });
  });
});
