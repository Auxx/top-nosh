import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as client from 'openid-client';
import { ConfigurationsService } from '../configurations/configurations.service';
import { OpenIdService } from './open-id.service';

jest.mock('openid-client', () => ({
  discovery: jest.fn(),
  buildAuthorizationUrl: jest.fn(),
  randomPKCECodeVerifier: jest.fn(),
  calculatePKCECodeChallenge: jest.fn(),
  randomState: jest.fn(),
  randomNonce: jest.fn(),
  authorizationCodeGrant: jest.fn(),
  fetchUserInfo: jest.fn(),
  skipSubjectCheck: Symbol('skipSubjectCheck')
}));

describe('OpenIdService', () => {
  let service: OpenIdService;
  let configurationsService: jest.Mocked<ConfigurationsService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenIdService,
        {
          provide: ConfigurationsService,
          useValue: {
            get: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<OpenIdService>(OpenIdService);
    configurationsService = module.get(ConfigurationsService);
  });

  describe('configuration loading & isEnabled', () => {
    it('should be disabled when issuerUrl is missing', async () => {
      configurationsService.get.mockImplementation(async (key: string) => {
        if (key === 'security.oidc.clientId') {
          return 'client-1';
        }
        if (key === 'security.oidc.clientSecret') {
          return 'secret-1';
        }
        if (key === 'security.oidc.callbackUrl') {
          return 'https://app.com/callback';
        }
        return null;
      });

      await service.onModuleInit();

      expect(service.isEnabled()).toBe(false);
      expect(client.discovery).not.toHaveBeenCalled();
    });

    it('should be disabled when clientId is missing', async () => {
      configurationsService.get.mockImplementation(async (key: string) => {
        if (key === 'security.oidc.issuerUrl') {
          return 'https://idp.example.com';
        }
        if (key === 'security.oidc.clientSecret') {
          return 'secret-1';
        }
        if (key === 'security.oidc.callbackUrl') {
          return 'https://app.com/callback';
        }
        return null;
      });

      await service.onModuleInit();

      expect(service.isEnabled()).toBe(false);
    });

    it('should be disabled when clientSecret is missing', async () => {
      configurationsService.get.mockImplementation(async (key: string) => {
        if (key === 'security.oidc.issuerUrl') {
          return 'https://idp.example.com';
        }
        if (key === 'security.oidc.clientId') {
          return 'client-1';
        }
        if (key === 'security.oidc.callbackUrl') {
          return 'https://app.com/callback';
        }
        return null;
      });

      await service.onModuleInit();

      expect(service.isEnabled()).toBe(false);
    });

    it('should be disabled when callbackUrl is missing', async () => {
      configurationsService.get.mockImplementation(async (key: string) => {
        if (key === 'security.oidc.issuerUrl') {
          return 'https://idp.example.com';
        }
        if (key === 'security.oidc.clientId') {
          return 'client-1';
        }
        if (key === 'security.oidc.clientSecret') {
          return 'secret-1';
        }
        return null;
      });

      await service.onModuleInit();

      expect(service.isEnabled()).toBe(false);
    });

    it('should be disabled gracefully when discovery fails', async () => {
      configurationsService.get.mockImplementation(async (key: string) => {
        if (key === 'security.oidc.issuerUrl') {
          return 'https://idp.example.com';
        }
        if (key === 'security.oidc.clientId') {
          return 'client-1';
        }
        if (key === 'security.oidc.clientSecret') {
          return 'secret-1';
        }
        if (key === 'security.oidc.callbackUrl') {
          return 'https://app.com/callback';
        }
        return null;
      });
      (client.discovery as jest.Mock).mockRejectedValue(new Error('Connection timed out'));

      await expect(service.onModuleInit()).resolves.not.toThrow();

      expect(service.isEnabled()).toBe(false);
    });

    it('should be enabled when all required config values are provided and discovery succeeds', async () => {
      configurationsService.get.mockImplementation(async (key: string) => {
        if (key === 'security.oidc.issuerUrl') {
          return 'https://idp.example.com';
        }
        if (key === 'security.oidc.clientId') {
          return 'client-1';
        }
        if (key === 'security.oidc.clientSecret') {
          return 'secret-1';
        }
        if (key === 'security.oidc.callbackUrl') {
          return 'https://app.com/callback';
        }
        if (key === 'security.oidc.linkByEmail') {
          return 'true';
        }
        return null;
      });
      const mockConfig = { serverMetadata: () => ({}) } as unknown as client.Configuration;
      (client.discovery as jest.Mock).mockResolvedValue(mockConfig);

      await service.onModuleInit();

      expect(service.isEnabled()).toBe(true);
      expect(service.isLinkByEmailEnabled()).toBe(true);
      expect(client.discovery).toHaveBeenCalledWith(
        new URL('https://idp.example.com'),
        'client-1',
        'secret-1'
      );
    });

    it('should set linkByEmail to false by default if empty or false', async () => {
      configurationsService.get.mockImplementation(async (key: string) => {
        if (key === 'security.oidc.issuerUrl') {
          return 'https://idp.example.com';
        }
        if (key === 'security.oidc.clientId') {
          return 'client-1';
        }
        if (key === 'security.oidc.clientSecret') {
          return 'secret-1';
        }
        if (key === 'security.oidc.callbackUrl') {
          return 'https://app.com/callback';
        }
        return null;
      });
      (client.discovery as jest.Mock).mockResolvedValue({} as client.Configuration);

      await service.onModuleInit();

      expect(service.isLinkByEmailEnabled()).toBe(false);
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should throw NotFoundException if OIDC is not enabled', async () => {
      await expect(service.getAuthorizationUrl()).rejects.toThrow(NotFoundException);
    });

    it('should generate authorization URL with PKCE challenge, state, and nonce', async () => {
      configurationsService.get.mockImplementation(async (key: string) => {
        if (key === 'security.oidc.issuerUrl') {
          return 'https://idp.example.com';
        }
        if (key === 'security.oidc.clientId') {
          return 'client-1';
        }
        if (key === 'security.oidc.clientSecret') {
          return 'secret-1';
        }
        if (key === 'security.oidc.callbackUrl') {
          return 'https://app.com/callback';
        }
        return null;
      });
      const mockConfig = {} as client.Configuration;
      (client.discovery as jest.Mock).mockResolvedValue(mockConfig);
      (client.randomPKCECodeVerifier as jest.Mock).mockReturnValue('mock-verifier');
      (client.calculatePKCECodeChallenge as jest.Mock).mockResolvedValue('mock-challenge');
      (client.randomState as jest.Mock).mockReturnValue('mock-state');
      (client.randomNonce as jest.Mock).mockReturnValue('mock-nonce');
      (client.buildAuthorizationUrl as jest.Mock).mockReturnValue(
        new URL('https://idp.example.com/auth?client_id=client-1&state=mock-state')
      );

      await service.onModuleInit();
      const result = await service.getAuthorizationUrl();

      expect(result).toEqual({
        authorizationUrl: 'https://idp.example.com/auth?client_id=client-1&state=mock-state'
      });
      expect(client.buildAuthorizationUrl).toHaveBeenCalledWith(mockConfig, {
        redirect_uri: 'https://app.com/callback',
        scope: 'openid profile email',
        code_challenge: 'mock-challenge',
        code_challenge_method: 'S256',
        state: 'mock-state',
        nonce: 'mock-nonce'
      });
    });
  });

  describe('exchangeCode', () => {
    beforeEach(async () => {
      configurationsService.get.mockImplementation(async (key: string) => {
        if (key === 'security.oidc.issuerUrl') {
          return 'https://idp.example.com';
        }
        if (key === 'security.oidc.clientId') {
          return 'client-1';
        }
        if (key === 'security.oidc.clientSecret') {
          return 'secret-1';
        }
        if (key === 'security.oidc.callbackUrl') {
          return 'https://app.com/callback';
        }
        return null;
      });
      const mockConfig = {} as client.Configuration;
      (client.discovery as jest.Mock).mockResolvedValue(mockConfig);
      (client.randomPKCECodeVerifier as jest.Mock).mockReturnValue('mock-verifier');
      (client.calculatePKCECodeChallenge as jest.Mock).mockResolvedValue('mock-challenge');
      (client.randomState as jest.Mock).mockReturnValue('state-123');
      (client.randomNonce as jest.Mock).mockReturnValue('nonce-456');
      (client.buildAuthorizationUrl as jest.Mock).mockReturnValue(new URL('https://idp.example.com/auth'));

      await service.onModuleInit();
    });

    it('should throw BadRequestException if code or state is missing', async () => {
      await expect(service.exchangeCode('', 'state-123')).rejects.toThrow(BadRequestException);
      await expect(service.exchangeCode('code-123', '')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if state is unknown', async () => {
      await expect(service.exchangeCode('code-123', 'unknown-state')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should exchange code and return profile from id token claims', async () => {
      await service.getAuthorizationUrl();

      const mockTokens = {
        claims: jest.fn().mockReturnValue({
          sub: 'oidc-user-123',
          email: 'user@example.com',
          name: 'Jane Doe'
        })
      };
      (client.authorizationCodeGrant as jest.Mock).mockResolvedValue(mockTokens);

      const profile = await service.exchangeCode('auth-code-123', 'state-123');

      expect(profile).toEqual({
        openId: 'oidc-user-123',
        email: 'user@example.com',
        fullName: 'Jane Doe'
      });

      expect(client.authorizationCodeGrant).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(URL),
        {
          pkceCodeVerifier: 'mock-verifier',
          expectedState: 'state-123',
          expectedNonce: 'nonce-456'
        }
      );
    });

    it('should append iss and scope query parameters to currentUrl when provided as positional arguments', async () => {
      await service.getAuthorizationUrl();

      const mockTokens = {
        claims: jest.fn().mockReturnValue({
          sub: 'oidc-user-123',
          email: 'user@example.com',
          name: 'Jane Doe'
        })
      };
      (client.authorizationCodeGrant as jest.Mock).mockResolvedValue(mockTokens);

      await service.exchangeCode(
        'auth-code-123',
        'state-123',
        'https://idp.example.com',
        'openid email'
      );

      const passedUrl = (client.authorizationCodeGrant as jest.Mock).mock.calls[0][1] as URL;
      expect(passedUrl.searchParams.get('code')).toBe('auth-code-123');
      expect(passedUrl.searchParams.get('state')).toBe('state-123');
      expect(passedUrl.searchParams.get('iss')).toBe('https://idp.example.com');
      expect(passedUrl.searchParams.get('scope')).toBe('openid email');
    });

    it('should append iss and scope query parameters to currentUrl when provided in params object', async () => {
      await service.getAuthorizationUrl();

      const mockTokens = {
        claims: jest.fn().mockReturnValue({
          sub: 'oidc-user-123',
          email: 'user@example.com',
          name: 'Jane Doe'
        })
      };
      (client.authorizationCodeGrant as jest.Mock).mockResolvedValue(mockTokens);

      await service.exchangeCode({
        code: 'auth-code-123',
        state: 'state-123',
        iss: 'https://idp.example.com',
        scope: 'openid email'
      });

      const passedUrl = (client.authorizationCodeGrant as jest.Mock).mock.calls[0][1] as URL;
      expect(passedUrl.searchParams.get('code')).toBe('auth-code-123');
      expect(passedUrl.searchParams.get('state')).toBe('state-123');
      expect(passedUrl.searchParams.get('iss')).toBe('https://idp.example.com');
      expect(passedUrl.searchParams.get('scope')).toBe('openid email');
    });

    it('should not append iss or scope to currentUrl when they are omitted', async () => {
      await service.getAuthorizationUrl();

      const mockTokens = {
        claims: jest.fn().mockReturnValue({
          sub: 'oidc-user-123',
          email: 'user@example.com',
          name: 'Jane Doe'
        })
      };
      (client.authorizationCodeGrant as jest.Mock).mockResolvedValue(mockTokens);

      await service.exchangeCode('auth-code-123', 'state-123');

      const passedUrl = (client.authorizationCodeGrant as jest.Mock).mock.calls[0][1] as URL;
      expect(passedUrl.searchParams.get('code')).toBe('auth-code-123');
      expect(passedUrl.searchParams.get('state')).toBe('state-123');
      expect(passedUrl.searchParams.has('iss')).toBe(false);
      expect(passedUrl.searchParams.has('scope')).toBe(false);
    });

    it('should consume state so it cannot be reused', async () => {
      await service.getAuthorizationUrl();

      const mockTokens = {
        claims: jest.fn().mockReturnValue({
          sub: 'oidc-user-123',
          email: 'user@example.com',
          name: 'Jane Doe'
        })
      };
      (client.authorizationCodeGrant as jest.Mock).mockResolvedValue(mockTokens);

      await service.exchangeCode('auth-code-123', 'state-123');

      await expect(service.exchangeCode('auth-code-123', 'state-123')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should reject state if expired', async () => {
      const dateSpy = jest.spyOn(Date, 'now');
      const now = 1000000;
      dateSpy.mockReturnValue(now);

      await service.getAuthorizationUrl();

      // Fast forward past 10 minutes (600,000 ms)
      dateSpy.mockReturnValue(now + 600001);

      await expect(service.exchangeCode('auth-code-123', 'state-123')).rejects.toThrow(
        BadRequestException
      );

      dateSpy.mockRestore();
    });

    it('should fetch UserInfo if email or name is missing from ID token claims', async () => {
      await service.getAuthorizationUrl();

      const mockTokens = {
        access_token: 'mock-access-token',
        claims: jest.fn().mockReturnValue({
          sub: 'oidc-user-123'
        })
      };
      (client.authorizationCodeGrant as jest.Mock).mockResolvedValue(mockTokens);
      (client.fetchUserInfo as jest.Mock).mockResolvedValue({
        email: 'userinfo@example.com',
        name: 'UserInfo Name'
      });

      const profile = await service.exchangeCode('auth-code-123', 'state-123');

      expect(profile).toEqual({
        openId: 'oidc-user-123',
        email: 'userinfo@example.com',
        fullName: 'UserInfo Name'
      });
      expect(client.fetchUserInfo).toHaveBeenCalledWith(
        expect.anything(),
        'mock-access-token',
        'oidc-user-123'
      );
    });

    it('should throw BadRequestException if authorizationCodeGrant rejects', async () => {
      await service.getAuthorizationUrl();

      (client.authorizationCodeGrant as jest.Mock).mockRejectedValue(
        new Error('Invalid authorization code')
      );

      await expect(service.exchangeCode('bad-code', 'state-123')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if sub is missing', async () => {
      await service.getAuthorizationUrl();

      const mockTokens = {
        claims: jest.fn().mockReturnValue({
          email: 'user@example.com',
          name: 'Jane Doe'
        })
      };
      (client.authorizationCodeGrant as jest.Mock).mockResolvedValue(mockTokens);

      await expect(service.exchangeCode('code-123', 'state-123')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if email is missing', async () => {
      await service.getAuthorizationUrl();

      const mockTokens = {
        claims: jest.fn().mockReturnValue({
          sub: 'user-sub-123',
          name: 'Jane Doe'
        })
      };
      (client.authorizationCodeGrant as jest.Mock).mockResolvedValue(mockTokens);

      await expect(service.exchangeCode('code-123', 'state-123')).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
