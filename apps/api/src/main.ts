import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { configureApp, GLOBAL_PREFIX } from './app/configure-app';
import { checkDataPermissions, formatDataPermissionsReport } from './app/data-permissions/data-permissions';
import { NeedsAttentionModule } from './app/needs-attention/needs-attention.module';

async function bootstrap() {
  const report = checkDataPermissions();
  if (process.argv.includes('--check-data-permissions')) {
    if (!report.ok) {
      console.error(formatDataPermissionsReport(report));
    }
    process.exit(report.ok ? 0 : 1);
  }

  if (!report.ok) {
    Logger.error(formatDataPermissionsReport(report));
  }
  const app = await NestFactory.create(report.ok ? AppModule : NeedsAttentionModule.forRoot(report));
  configureApp(app);
  const port = process.env.SERVER_HTTP_PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${GLOBAL_PREFIX}`);
}

bootstrap().then();
