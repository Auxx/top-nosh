import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '@top-nosh/data-access';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env['JWT_SECRET'] || 'top-nosh-secret-key-change-in-production',
      signOptions: {
        expiresIn: (process.env['JWT_EXPIRES_IN'] || '24h') as StringValue
      }
    })
  ],
  controllers: [ AuthController ],
  providers: [ AuthService, JwtStrategy, JwtAuthGuard ],
  exports: [ AuthService, JwtAuthGuard, PassportModule, JwtModule ]
})
export class AuthModule {}
