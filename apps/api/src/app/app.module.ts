import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PrismaModule } from '@top-nosh/data-access';
import { existsSync } from 'fs';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RecipesModule } from './recipes/recipes.module';

function getStaticRootPath(): string {
  const candidates = [
    join(__dirname, '..', 'web', 'browser'),
    join(__dirname, '../../../../dist/apps/web/browser'),
    join(process.cwd(), 'dist', 'apps', 'web', 'browser'),
    join(process.cwd(), '..', '..', 'dist', 'apps', 'web', 'browser')
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return join(__dirname, '..', 'web', 'browser');
}

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: getStaticRootPath(),
      exclude: [ '/api{/*path}' ]
    }),
    PrismaModule,
    AuthModule,
    RecipesModule
  ],
  controllers: [ AppController ],
  providers: [ AppService ]
})
export class AppModule {}
