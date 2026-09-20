import { CanActivate, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class DevelopmentModeGuard implements CanActivate {
  canActivate(): boolean {
    if (process.env['SERVER_DEVELOPMENT_MODE'] !== 'true') {
      throw new NotFoundException();
    }
    return true;
  }
}
