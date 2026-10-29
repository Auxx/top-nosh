import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';
import { getCorsOptions } from './cors.config';

export const GLOBAL_PREFIX = 'api';

export function configureApp(app: INestApplication): void {
  app.enableCors(getCorsOptions());
  app.setGlobalPrefix(GLOBAL_PREFIX, {
    exclude: [
      { path: 'assets/app.properties', method: RequestMethod.GET },
      { path: 'manifest.webmanifest', method: RequestMethod.GET },
      { path: 'manifest.json', method: RequestMethod.GET }
    ]
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
