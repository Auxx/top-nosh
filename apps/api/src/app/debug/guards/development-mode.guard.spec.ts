import { NotFoundException } from '@nestjs/common';
import { DevelopmentModeGuard } from './development-mode.guard';

describe('DevelopmentModeGuard', () => {
  let guard: DevelopmentModeGuard;
  const originalEnv = process.env['SERVER_DEVELOPMENT_MODE'];

  beforeEach(() => {
    guard = new DevelopmentModeGuard();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env['SERVER_DEVELOPMENT_MODE'] = originalEnv;
    } else {
      delete process.env['SERVER_DEVELOPMENT_MODE'];
    }
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when SERVER_DEVELOPMENT_MODE is "true"', () => {
    process.env['SERVER_DEVELOPMENT_MODE'] = 'true';
    expect(guard.canActivate()).toBe(true);
  });

  it('should throw NotFoundException when SERVER_DEVELOPMENT_MODE is "false"', () => {
    process.env['SERVER_DEVELOPMENT_MODE'] = 'false';
    expect(() => guard.canActivate()).toThrow(NotFoundException);
  });

  it('should throw NotFoundException when SERVER_DEVELOPMENT_MODE is undefined', () => {
    delete process.env['SERVER_DEVELOPMENT_MODE'];
    expect(() => guard.canActivate()).toThrow(NotFoundException);
  });

  it('should throw NotFoundException when SERVER_DEVELOPMENT_MODE is another string', () => {
    process.env['SERVER_DEVELOPMENT_MODE'] = 'yes';
    expect(() => guard.canActivate()).toThrow(NotFoundException);
  });
});
