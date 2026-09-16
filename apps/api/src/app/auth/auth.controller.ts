import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  Req,
  Res,
  UseGuards
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { ChangePasswordDto, ChangePasswordResponse } from './dto/change-password.dto';
import { LoginDto, LoginResponse } from './dto/login.dto';
import { LogoutDto, LogoutResponse } from './dto/logout.dto';
import { OidcLoginUrlResponse } from './dto/oidc.dto';
import { OnboardingRequiredResponse, OnboardUserDto, OnboardUserResponse } from './dto/onboarding.dto';
import { RefreshTokenDto, RefreshTokenResponse } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OpenIdService } from './open-id.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly openIdService: OpenIdService
  ) {}

  @Get('oidc/login')
  async oidcLogin(): Promise<OidcLoginUrlResponse> {
    console.log('/api/auth/oidc/login');
    if (!this.openIdService.isEnabled()) {
      throw new NotFoundException('OpenID Connect is not enabled');
    }
    return this.openIdService.getAuthorizationUrl();
  }

  @Get('oidc/callback')
  async oidcCallback(
    @Res() res: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('iss') iss?: string,
    @Query('scope') scope?: string
  ): Promise<void> {
    console.log('/api/auth/oidc/callback');
    const frontendUrl = this.getFrontendUrl();
    if (!this.openIdService.isEnabled()) {
      return res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('OpenID Connect is not enabled')}`);
    }
    if (!code || !state) {
      return res.redirect(
        `${frontendUrl}/auth/callback?error=${encodeURIComponent('Missing code or state in callback request')}`
      );
    }
    try {
      const profile = await this.openIdService.exchangeCode(code, state, iss, scope);
      const loginResponse = await this.authService.handleOidcLogin(profile);
      const params = new URLSearchParams({
        token: loginResponse.token,
        refreshToken: loginResponse.refreshToken
      });
      if (loginResponse.forcePasswordChange) {
        params.set('forcePasswordChange', 'true');
      }
      return res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
    } catch (error) {
      const message = (error as Error).message || 'Authentication failed';
      return res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(message)}`);
    }
  }

  private getFrontendUrl(): string {
    const isDevMode = process.env['SERVER_DEVELOPMENT_MODE'] === 'true';
    const rawCorsOrigin = isDevMode ? process.env['SERVER_DEVELOPMENT_DOMAIN'] : process.env['SERVER_HTTP_DOMAIN'];
    const configuredOrigin = process.env['FRONTEND_URL'] || rawCorsOrigin || 'http://localhost:4200';
    return configuredOrigin.trim().replace(/\/+$/, '');
  }

  @Get('onboarding-required')
  async onboardingRequired(): Promise<OnboardingRequiredResponse> {
    return this.authService.onboardingRequired();
  }

  @Post('onboard-user')
  async onboardUser(@Body() onboardUserDto: OnboardUserDto): Promise<OnboardUserResponse> {
    return this.authService.onboardUser(onboardUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponse> {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: { user: { userId: string; token: string; }; },
    @Body() logoutDto?: LogoutDto
  ): Promise<LogoutResponse> {
    return this.authService.logout(req.user.userId, req.user.token, logoutDto?.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: { user: { userId: string; email: string; }; },
    @Body() changePasswordDto: ChangePasswordDto
  ): Promise<ChangePasswordResponse> {
    return this.authService.changePassword(req.user.userId, changePasswordDto.password);
  }
}
