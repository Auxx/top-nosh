import { HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService, TokenType } from '@top-nosh/data-access';
import * as argon2 from 'argon2';
import { ChangePasswordResponse } from './dto/change-password.dto';
import { JwtPayload, LoginDto, LoginResponse } from './dto/login.dto';
import { LogoutResponse } from './dto/logout.dto';
import { OnboardingRequiredResponse, OnboardUserDto, OnboardUserResponse } from './dto/onboarding.dto';
import { RefreshTokenResponse } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async onboardingRequired(): Promise<OnboardingRequiredResponse> {
    const userCount = await this.prisma.user.count();
    return {
      onboardingRequired: userCount === 0
    };
  }

  async onboardUser(dto: OnboardUserDto): Promise<OnboardUserResponse> {
    const userCount = await this.prisma.user.count();
    if (userCount > 0) {
      throw new UnauthorizedException('Onboarding is not allowed when users already exist');
    }

    const passwordHash = await argon2.hash(dto.password);

    await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        forcePasswordChange: false
      }
    });

    return { message: 'User onboarded successfully' };
  }

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, pass);
    if (!isPasswordValid) {
      return null;
    }

    const sanitizedUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      forcePasswordChange: user.forcePasswordChange,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return sanitizedUser;
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email
    };

    const token = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    await this.prisma.userToken.create({
      data: {
        userId: user.id,
        token,
        type: TokenType.AUTHENTICATION
      }
    });

    await this.prisma.userToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        type: TokenType.REFRESH
      }
    });

    return {
      token,
      refreshToken,
      forcePasswordChange: user.forcePasswordChange
    };
  }

  async logout(userId: string, token: string, refreshToken?: string): Promise<LogoutResponse> {
    const tokensToDelete = [ token, ...(refreshToken ? [ refreshToken ] : []) ];
    await this.prisma.userToken.deleteMany({
      where: {
        userId,
        token: { in: tokensToDelete }
      }
    });

    return { message: 'Logged out successfully' };
  }

  async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken);
    } catch {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }

    const tokenRecord = await this.prisma.userToken.findFirst({
      where: {
        token: refreshToken,
        userId: payload.sub,
        type: TokenType.REFRESH
      }
    });

    if (!tokenRecord) {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }

    const newPayload: JwtPayload = {
      sub: payload.sub,
      email: payload.email
    };

    const newAuthToken = this.jwtService.sign(newPayload);
    const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '30d' });

    await this.prisma.$transaction(async tx => {
      await tx.userToken.delete({
        where: { id: tokenRecord.id }
      });

      await tx.userToken.create({
        data: {
          userId: payload.sub,
          token: newAuthToken,
          type: TokenType.AUTHENTICATION
        }
      });

      await tx.userToken.create({
        data: {
          userId: payload.sub,
          token: newRefreshToken,
          type: TokenType.REFRESH
        }
      });
    });

    return {
      token: newAuthToken,
      refreshToken: newRefreshToken
    };
  }

  async changePassword(userId: string, newPassword: string): Promise<ChangePasswordResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        forcePasswordChange: false
      }
    });

    return { message: 'Password changed successfully' };
  }
}
