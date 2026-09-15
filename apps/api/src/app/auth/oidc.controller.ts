import { Controller, Get, NotFoundException, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { OidcLoginUrlResponse } from './dto/oidc.dto';
import { OpenIdService } from './open-id.service';

@Controller('oidc')
export class OidcController {
  constructor(
    private readonly authService: AuthService,
    private readonly openIdService: OpenIdService
  ) {}

  @Get('login')
  async oidcLogin(): Promise<OidcLoginUrlResponse> {
    if (!this.openIdService.isEnabled()) {
      throw new NotFoundException('OpenID Connect is not enabled');
    }
    return this.openIdService.getAuthorizationUrl();
  }

  @Get('callback')
  async oidcCallback(
    @Res() res: Response,
    @Query('code') code?: string,
    @Query('state') state?: string
  ): Promise<void> {
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
      const profile = await this.openIdService.exchangeCode(code, state);
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
}
