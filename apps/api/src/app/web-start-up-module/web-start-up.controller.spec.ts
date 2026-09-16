import { Test, TestingModule } from '@nestjs/testing';
import { OpenIdService } from '../auth/open-id.service';
import { WebStartUpController } from './web-start-up.controller';

describe('Configuration Controller', () => {
  let controller: WebStartUpController;
  let openIdService: { isEnabled: jest.Mock; };
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    process.env['SERVER_HTTP_DOMAIN'] = '';
    openIdService = {
      isEnabled: jest.fn().mockReturnValue(false)
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ WebStartUpController ],
      providers: [
        {
          provide: OpenIdService,
          useValue: openIdService
        }
      ]
    }).compile();

    controller = module.get<WebStartUpController>(WebStartUpController);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return dotenv configuration with configured CORS_ORIGIN', () => {
    process.env['SERVER_HTTP_DOMAIN'] = 'http://localhost:4200/';
    expect(controller.webProperties()).toBe(
      'PRODUCTION=true\nAPI_URL=http://localhost:4200/\nSECURITY_OIDC_ENABLED=false\n'
    );
  });

  it('should return empty API_URL when CORS_ORIGIN is undefined', () => {
    delete process.env['CORS_ORIGIN'];
    expect(controller.webProperties()).toBe(
      'PRODUCTION=true\nAPI_URL=\nSECURITY_OIDC_ENABLED=false\n'
    );
  });

  it('should return empty API_URL when CORS_ORIGIN is empty string', () => {
    process.env['CORS_ORIGIN'] = '';
    expect(controller.webProperties()).toBe(
      'PRODUCTION=true\nAPI_URL=\nSECURITY_OIDC_ENABLED=false\n'
    );
  });

  it('should return SECURITY_OIDC_ENABLED=true when OpenIdService.isEnabled is true', () => {
    openIdService.isEnabled.mockReturnValue(true);
    process.env['SERVER_HTTP_DOMAIN'] = 'http://localhost:4200/';
    expect(controller.webProperties()).toBe(
      'PRODUCTION=true\nAPI_URL=http://localhost:4200/\nSECURITY_OIDC_ENABLED=true\n'
    );
  });

  it('should return SECURITY_OIDC_ENABLED=false when OpenIdService.isEnabled is false', () => {
    openIdService.isEnabled.mockReturnValue(false);
    expect(controller.webProperties()).toBe(
      'PRODUCTION=true\nAPI_URL=\nSECURITY_OIDC_ENABLED=false\n'
    );
  });
});
