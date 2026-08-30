import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { login: jest.Mock; changePassword: jest.Mock; };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      changePassword: jest.fn()
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

  describe('login', () => {
    it('should delegate login to AuthService.login and return result', async () => {
      const loginDto = {
        email: 'aux@hexmode.org',
        password: 'Pass1234!!!!'
      };

      const expectedResponse = {
        token: 'mock-jwt-token',
        forcePasswordChange: true
      };

      authService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
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
