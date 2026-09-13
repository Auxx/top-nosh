import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: jest.Mock;
    logout: jest.Mock;
    refresh: jest.Mock;
    changePassword: jest.Mock;
    onboardingRequired: jest.Mock;
    onboardUser: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      logout: jest.fn(),
      refresh: jest.fn(),
      changePassword: jest.fn(),
      onboardingRequired: jest.fn(),
      onboardUser: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ AuthController ],
      providers: [
        {
          provide: AuthService,
          useValue: authService
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
});
