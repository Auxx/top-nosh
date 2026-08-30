import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { login: jest.Mock; };

  beforeEach(async () => {
    authService = {
      login: jest.fn()
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
});
