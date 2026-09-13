import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { PrismaService, TokenType } from '@top-nosh/data-access';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../dto/login.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env['SECURITY_JWT_SECRET'] || 'top-nosh-secret-key-change-in-production',
      passReqToCallback: true
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    const tokenRecord = await this.prisma.userToken.findFirst({
      where: {
        token,
        userId: payload.sub,
        type: TokenType.AUTHENTICATION
      }
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Authentication token is invalid or has been revoked');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      token
    };
  }
}
