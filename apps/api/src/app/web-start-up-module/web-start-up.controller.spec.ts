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

  describe('PWA Manifest', () => {
    it('should return manifest with default configuration and icons', () => {
      delete process.env['SERVER_DEVELOPMENT_MODE'];
      delete process.env['SERVER_DEVELOPMENT_DOMAIN'];
      delete process.env['SERVER_HTTP_DOMAIN'];

      const manifest = controller.manifest();

      expect(manifest).toEqual({
        name: 'Top Nosh',
        short_name: 'Top Nosh',
        start_url: 'http://localhost:4200/',
        display: 'standalone',
        icons: [
          {
            src: '/images/pwa/android/launchericon-48x48.png',
            sizes: '48x48',
            type: 'image/png'
          },
          {
            src: '/images/pwa/android/launchericon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/images/pwa/android/launchericon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/images/pwa/android/launchericon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/images/pwa/android/launchericon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/images/pwa/android/launchericon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      });
    });

    it('should return dynamic start_url when SERVER_HTTP_DOMAIN is set', () => {
      process.env['SERVER_HTTP_DOMAIN'] = 'https://topnosh.example.com';
      const manifest = controller.manifest();
      expect(manifest.start_url).toBe('https://topnosh.example.com/');
    });

    it('should return dynamic start_url in dev mode when SERVER_DEVELOPMENT_DOMAIN is set', () => {
      process.env['SERVER_DEVELOPMENT_MODE'] = 'true';
      process.env['SERVER_DEVELOPMENT_DOMAIN'] = 'http://dev.topnosh.local:4200///';
      const manifest = controller.manifest();
      expect(manifest.start_url).toBe('http://dev.topnosh.local:4200/');
    });
  });
});
