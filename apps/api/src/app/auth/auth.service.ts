import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@top-nosh/data-access';
import * as argon2 from 'argon2';
import { ChangePasswordResponse } from './dto/change-password.dto';
import { JwtPayload, LoginDto, LoginResponse } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

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

    return {
      token,
      forcePasswordChange: user.forcePasswordChange
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
