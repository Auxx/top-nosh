import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import * as client from 'openid-client';
import { ConfigurationsService } from '../configurations/configurations.service';
import { OidcLoginUrlResponse, OidcUserProfile } from './dto/oidc.dto';

interface StateCacheEntry {
  readonly codeVerifier: string;
  readonly nonce: string;
  readonly expiresAt: number;
}

const defaultStateTtlMs = 10 * 60 * 1000;

@Injectable()
export class OpenIdService implements OnModuleInit {
  private readonly logger = new Logger(OpenIdService.name);
  private isConfigured = false;
  private oidcConfig?: client.Configuration;
  private linkByEmail = false;
  private callbackUrl?: string;
  private readonly stateCache = new Map<string, StateCacheEntry>();

  constructor(private readonly configurationsService: ConfigurationsService) {}

  async onModuleInit(): Promise<void> {
    await this.loadConfiguration();
  }

  async loadConfiguration(): Promise<void> {
    const issuerUrl = await this.configurationsService.get('security.oidc.issuerUrl');
    const clientId = await this.configurationsService.get('security.oidc.clientId');
    const clientSecret = await this.configurationsService.get('security.oidc.clientSecret');
    const callbackUrl = await this.configurationsService.get('security.oidc.callbackUrl');
    const linkByEmailRaw = await this.configurationsService.get('security.oidc.linkByEmail');

    this.linkByEmail = linkByEmailRaw === 'true' || (linkByEmailRaw as unknown) === true;

    if (!issuerUrl?.trim() || !clientId?.trim() || !clientSecret?.trim() || !callbackUrl?.trim()) {
      this.isConfigured = false;
      this.oidcConfig = undefined;
      this.callbackUrl = undefined;
      return;
    }

    try {
      this.callbackUrl = callbackUrl.trim();
      const serverUrl = new URL(issuerUrl.trim());
      this.oidcConfig = await client.discovery(serverUrl, clientId.trim(), clientSecret.trim());
      this.isConfigured = true;
    } catch (error) {
      this.logger.warn(`Failed to discover OpenID Connect provider at ${issuerUrl}: ${(error as Error).message}`);
      this.isConfigured = false;
      this.oidcConfig = undefined;
      this.callbackUrl = undefined;
    }
  }

  isEnabled(): boolean {
    return this.isConfigured && !!this.oidcConfig;
  }

  isLinkByEmailEnabled(): boolean {
    return this.linkByEmail;
  }

  async getAuthorizationUrl(): Promise<OidcLoginUrlResponse> {
    if (!this.isEnabled() || !this.oidcConfig || !this.callbackUrl) {
      throw new NotFoundException('OpenID Connect is not enabled');
    }

    this.cleanupExpiredStates();

    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
    const state = client.randomState();
    const nonce = client.randomNonce();

    this.stateCache.set(state, {
      codeVerifier,
      nonce,
      expiresAt: Date.now() + defaultStateTtlMs
    });

    const authorizationUrl = client.buildAuthorizationUrl(this.oidcConfig, {
      redirect_uri: this.callbackUrl,
      scope: 'openid profile email',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce
    });

    return {
      authorizationUrl: authorizationUrl.toString()
    };
  }

  async exchangeCode(
    codeOrParams: string | { code: string; state: string; },
    maybeState?: string
  ): Promise<OidcUserProfile> {
    if (!this.isEnabled() || !this.oidcConfig || !this.callbackUrl) {
      throw new NotFoundException('OpenID Connect is not enabled');
    }

    const code = typeof codeOrParams === 'string' ? codeOrParams : codeOrParams?.code;
    const state = typeof codeOrParams === 'string' ? maybeState : codeOrParams?.state;

    if (!code || !state) {
      throw new BadRequestException('Missing code or state in callback request');
    }

    this.cleanupExpiredStates();

    const cached = this.stateCache.get(state);
    if (!cached) {
      throw new BadRequestException('Invalid or expired state parameter');
    }

    this.stateCache.delete(state);

    if (Date.now() > cached.expiresAt) {
      throw new BadRequestException('Invalid or expired state parameter');
    }

    const currentUrl = new URL(this.callbackUrl);
    currentUrl.searchParams.set('code', code);
    currentUrl.searchParams.set('state', state);

    let tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers;
    try {
      tokens = await client.authorizationCodeGrant(
        this.oidcConfig,
        currentUrl,
        {
          pkceCodeVerifier: cached.codeVerifier,
          expectedState: state,
          expectedNonce: cached.nonce
        }
      );
    } catch (error) {
      this.logger.error(`OpenID Connect authorization code grant failed: ${(error as Error).message}`);
      throw new BadRequestException(`OpenID Connect authorization code grant failed: ${(error as Error).message}`);
    }

    const idTokenClaims = tokens.claims?.();
    let email = (idTokenClaims?.['email'] as string | undefined) ?? undefined;
    let fullName = (idTokenClaims?.['name'] as string | undefined) ?? undefined;
    const sub = (idTokenClaims?.sub as string | undefined) ?? undefined;

    if ((!email || !fullName) && tokens.access_token) {
      try {
        const userInfo = await client.fetchUserInfo(
          this.oidcConfig,
          tokens.access_token,
          sub ?? client.skipSubjectCheck
        );
        if (!email && userInfo['email']) {
          email = userInfo['email'] as string;
        }
        if (!fullName && userInfo['name']) {
          fullName = userInfo['name'] as string;
        }
        if (!fullName && (userInfo['given_name'] || userInfo['family_name'])) {
          fullName = [ userInfo['given_name'], userInfo['family_name'] ].filter(Boolean).join(' ');
        }
        if (!fullName && userInfo['preferred_username']) {
          fullName = userInfo['preferred_username'] as string;
        }
      } catch {
        // Fallback to ID token claims if UserInfo fetch fails
      }
    }

    if (!fullName) {
      if (idTokenClaims?.['preferred_username']) {
        fullName = idTokenClaims['preferred_username'] as string;
      } else if (idTokenClaims?.['given_name'] || idTokenClaims?.['family_name']) {
        fullName = [ idTokenClaims['given_name'], idTokenClaims['family_name'] ].filter(Boolean).join(' ');
      } else if (email) {
        fullName = email.split('@')[0];
      } else {
        fullName = 'OpenID User';
      }
    }

    if (!sub) {
      throw new BadRequestException('Missing subject identifier (sub) claim from OpenID Connect provider');
    }

    if (!email) {
      throw new BadRequestException('Missing email claim from OpenID Connect provider');
    }

    return {
      openId: sub,
      email,
      fullName
    };
  }

  private cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [ key, value ] of this.stateCache.entries()) {
      if (now > value.expiresAt) {
        this.stateCache.delete(key);
      }
    }
  }
}
