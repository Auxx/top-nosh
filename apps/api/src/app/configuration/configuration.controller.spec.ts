import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurationController } from './configuration.controller';

describe('Configuration Controller', () => {
  let controller: ConfigurationController;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ ConfigurationController ]
    }).compile();

    controller = module.get<ConfigurationController>(ConfigurationController);
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
      'PRODUCTION=true\nAPI_URL=http://localhost:4200/\n'
    );
  });

  it('should return empty API_URL when CORS_ORIGIN is undefined', () => {
    delete process.env['CORS_ORIGIN'];
    expect(controller.webProperties()).toBe(
      'PRODUCTION=true\nAPI_URL=\n'
    );
  });

  it('should return empty API_URL when CORS_ORIGIN is empty string', () => {
    process.env['CORS_ORIGIN'] = '';
    expect(controller.webProperties()).toBe(
      'PRODUCTION=true\nAPI_URL=\n'
    );
  });
});
