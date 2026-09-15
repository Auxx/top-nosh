import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { OidcController } from './oidc.controller';
import { OpenIdService } from './open-id.service';

describe('OidcController', () => {
  let controller: OidcController;
  let authService: {
    handleOidcLogin: jest.Mock;
  };
  let openIdService: {
    isEnabled: jest.Mock;
    getAuthorizationUrl: jest.Mock;
    exchangeCode: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      handleOidcLogin: jest.fn()
    };

    openIdService = {
      isEnabled: jest.fn(),
      getAuthorizationUrl: jest.fn(),
      exchangeCode: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ OidcController ],
      providers: [
        {
          provide: AuthService,
          useValue: authService
        },
        {
          provide: OpenIdService,
          useValue: openIdService
        }
      ]
    }).compile();

    controller = module.get<OidcController>(OidcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('oidcLogin', () => {
    it('should throw NotFoundException when OpenID Connect is disabled', async () => {
      openIdService.isEnabled.mockReturnValue(false);

      await expect(controller.oidcLogin()).rejects.toThrow(NotFoundException);
      expect(openIdService.getAuthorizationUrl).not.toHaveBeenCalled();
    });

    it('should return authorizationUrl when OpenID Connect is enabled', async () => {
      openIdService.isEnabled.mockReturnValue(true);
      const expectedResponse = {
        authorizationUrl: 'https://idp.example.com/auth?client_id=123'
      };
      openIdService.getAuthorizationUrl.mockResolvedValue(expectedResponse);

      const result = await controller.oidcLogin();

      expect(openIdService.getAuthorizationUrl).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('oidcCallback', () => {
    let mockRes: { redirect: jest.Mock; };
    let response: Response;

    beforeEach(() => {
      mockRes = { redirect: jest.fn() };
      response = mockRes as unknown as Response;
    });

    it('should redirect with error when OpenID Connect is disabled', async () => {
      openIdService.isEnabled.mockReturnValue(false);

      await controller.oidcCallback(response, 'code-123', 'state-456');

      expect(mockRes.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = new URL(mockRes.redirect.mock.calls[0][0]);
      expect(redirectUrl.pathname).toBe('/auth/callback');
      expect(redirectUrl.searchParams.get('error')).toBe('OpenID Connect is not enabled');
      expect(openIdService.exchangeCode).not.toHaveBeenCalled();
    });

    it('should redirect with error when code is missing', async () => {
      openIdService.isEnabled.mockReturnValue(true);

      await controller.oidcCallback(response, '', 'state-456');

      expect(mockRes.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = new URL(mockRes.redirect.mock.calls[0][0]);
      expect(redirectUrl.pathname).toBe('/auth/callback');
      expect(redirectUrl.searchParams.get('error')).toBe('Missing code or state in callback request');
      expect(openIdService.exchangeCode).not.toHaveBeenCalled();
    });

    it('should redirect with error when state is missing', async () => {
      openIdService.isEnabled.mockReturnValue(true);

      await controller.oidcCallback(response, 'code-123', '');

      expect(mockRes.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = new URL(mockRes.redirect.mock.calls[0][0]);
      expect(redirectUrl.pathname).toBe('/auth/callback');
      expect(redirectUrl.searchParams.get('error')).toBe('Missing code or state in callback request');
      expect(openIdService.exchangeCode).not.toHaveBeenCalled();
    });

    it('should exchange code and handle OIDC login redirecting with tokens', async () => {
      openIdService.isEnabled.mockReturnValue(true);
      const profile = {
        openId: 'oidc-sub-123',
        email: 'user@example.com',
        fullName: 'Jane Doe'
      };
      openIdService.exchangeCode.mockResolvedValue(profile);
      const loginResponse = {
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        forcePasswordChange: false
      };
      authService.handleOidcLogin.mockResolvedValue(loginResponse);

      await controller.oidcCallback(response, 'code-123', 'state-456');

      expect(openIdService.exchangeCode).toHaveBeenCalledWith('code-123', 'state-456', undefined, undefined);
      expect(authService.handleOidcLogin).toHaveBeenCalledWith(profile);
      expect(mockRes.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = new URL(mockRes.redirect.mock.calls[0][0]);
      expect(redirectUrl.pathname).toBe('/auth/callback');
      expect(redirectUrl.searchParams.get('token')).toBe('mock-jwt-token');
      expect(redirectUrl.searchParams.get('refreshToken')).toBe('mock-refresh-token');
      expect(redirectUrl.searchParams.get('forcePasswordChange')).toBeNull();
    });

    it('should forward iss and scope parameters to exchangeCode when provided', async () => {
      openIdService.isEnabled.mockReturnValue(true);
      const profile = {
        openId: 'oidc-sub-123',
        email: 'user@example.com',
        fullName: 'Jane Doe'
      };
      openIdService.exchangeCode.mockResolvedValue(profile);
      const loginResponse = {
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        forcePasswordChange: false
      };
      authService.handleOidcLogin.mockResolvedValue(loginResponse);

      await controller.oidcCallback(
        response,
        'code-123',
        'state-456',
        'https://idp.example.com',
        'openid email'
      );

      expect(openIdService.exchangeCode).toHaveBeenCalledWith(
        'code-123',
        'state-456',
        'https://idp.example.com',
        'openid email'
      );
      expect(mockRes.redirect).toHaveBeenCalledTimes(1);
    });

    it('should include forcePasswordChange in redirect URL if true', async () => {
      openIdService.isEnabled.mockReturnValue(true);
      const profile = {
        openId: 'oidc-sub-123',
        email: 'user@example.com',
        fullName: 'Jane Doe'
      };
      openIdService.exchangeCode.mockResolvedValue(profile);
      const loginResponse = {
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        forcePasswordChange: true
      };
      authService.handleOidcLogin.mockResolvedValue(loginResponse);

      await controller.oidcCallback(response, 'code-123', 'state-456');

      expect(mockRes.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = new URL(mockRes.redirect.mock.calls[0][0]);
      expect(redirectUrl.pathname).toBe('/auth/callback');
      expect(redirectUrl.searchParams.get('forcePasswordChange')).toBe('true');
    });

    it('should redirect with error when exchangeCode or handleOidcLogin fails', async () => {
      openIdService.isEnabled.mockReturnValue(true);
      openIdService.exchangeCode.mockRejectedValue(new Error('Invalid authorization code'));

      await controller.oidcCallback(response, 'code-123', 'state-456');

      expect(mockRes.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = new URL(mockRes.redirect.mock.calls[0][0]);
      expect(redirectUrl.pathname).toBe('/auth/callback');
      expect(redirectUrl.searchParams.get('error')).toBe('Invalid authorization code');
    });
  });
});
