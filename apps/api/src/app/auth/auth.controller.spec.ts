import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OpenIdService } from './open-id.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: jest.Mock;
    logout: jest.Mock;
    refresh: jest.Mock;
    changePassword: jest.Mock;
    onboardingRequired: jest.Mock;
    onboardUser: jest.Mock;
    handleOidcLogin: jest.Mock;
  };
  let openIdService: {
    isEnabled: jest.Mock;
    getAuthorizationUrl: jest.Mock;
    exchangeCode: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      logout: jest.fn(),
      refresh: jest.fn(),
      changePassword: jest.fn(),
      onboardingRequired: jest.fn(),
      onboardUser: jest.fn(),
      handleOidcLogin: jest.fn()
    };

    openIdService = {
      isEnabled: jest.fn(),
      getAuthorizationUrl: jest.fn(),
      exchangeCode: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ AuthController ],
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

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('onboardingRequired', () => {
    it('should delegate onboardingRequired to AuthService.onboardingRequired and return result', async () => {
      const expectedResponse = { onboardingRequired: true };
      authService.onboardingRequired.mockResolvedValue(expectedResponse);

      const result = await controller.onboardingRequired();

      expect(authService.onboardingRequired).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('onboardUser', () => {
    it('should delegate onboardUser to AuthService.onboardUser and return result', async () => {
      const onboardUserDto = {
        fullName: 'Admin User',
        email: 'admin@example.com',
        password: 'SuperSecret1234!'
      };
      const expectedResponse = { message: 'User onboarded successfully' };
      authService.onboardUser.mockResolvedValue(expectedResponse);

      const result = await controller.onboardUser(onboardUserDto);

      expect(authService.onboardUser).toHaveBeenCalledWith(onboardUserDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('login', () => {
    it('should delegate login to AuthService.login and return result', async () => {
      const loginDto = {
        email: 'aux@hexmode.org',
        password: 'Pass1234!!!!'
      };

      const expectedResponse = {
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        forcePasswordChange: true
      };

      authService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('refresh', () => {
    it('should delegate refresh to AuthService.refresh and return result', async () => {
      const refreshTokenDto = {
        refreshToken: 'valid-refresh-token'
      };

      const expectedResponse = {
        token: 'new-mock-token',
        refreshToken: 'new-mock-refresh-token'
      };

      authService.refresh.mockResolvedValue(expectedResponse);

      const result = await controller.refresh(refreshTokenDto);

      expect(authService.refresh).toHaveBeenCalledWith('valid-refresh-token');
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('logout', () => {
    it('should delegate logout to AuthService.logout without refreshToken and return result', async () => {
      const req = {
        user: {
          userId: 'user-123',
          token: 'token-abc'
        }
      };

      const expectedResponse = {
        message: 'Logged out successfully'
      };

      authService.logout.mockResolvedValue(expectedResponse);

      const result = await controller.logout(req);

      expect(authService.logout).toHaveBeenCalledWith('user-123', 'token-abc', undefined);
      expect(result).toEqual(expectedResponse);
    });

    it('should delegate logout to AuthService.logout with refreshToken and return result', async () => {
      const req = {
        user: {
          userId: 'user-123',
          token: 'token-abc'
        }
      };
      const logoutDto = {
        refreshToken: 'refresh-xyz'
      };

      const expectedResponse = {
        message: 'Logged out successfully'
      };

      authService.logout.mockResolvedValue(expectedResponse);

      const result = await controller.logout(req, logoutDto);

      expect(authService.logout).toHaveBeenCalledWith('user-123', 'token-abc', 'refresh-xyz');
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('changePassword', () => {
    it('should delegate changePassword to AuthService.changePassword and return result', async () => {
      const req = {
        user: {
          userId: 'user-123',
          email: 'aux@hexmode.org'
        }
      };
      const changePasswordDto = {
        password: 'NewPassword123!'
      };

      const expectedResponse = {
        message: 'Password changed successfully'
      };

      authService.changePassword.mockResolvedValue(expectedResponse);

      const result = await controller.changePassword(req, changePasswordDto);

      expect(authService.changePassword).toHaveBeenCalledWith('user-123', 'NewPassword123!');
      expect(result).toEqual(expectedResponse);
    });
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
