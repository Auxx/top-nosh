import { Test, TestingModule } from '@nestjs/testing';
import { WebStartUpController } from './web-start-up.controller';

describe('Configuration Controller', () => {
  let controller: WebStartUpController;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    process.env['SERVER_HTTP_DOMAIN'] = '';
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ WebStartUpController ]
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
