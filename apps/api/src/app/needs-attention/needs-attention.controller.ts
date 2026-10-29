import { All, Controller, Get, Header, Inject, ServiceUnavailableException } from '@nestjs/common';
import { DataPermissionsReport } from '../data-permissions/data-permissions';
import { buildManifest, buildWebProperties, WebManifest } from '../web-start-up-module/web-start-up.content';
import { DATA_PERMISSIONS_REPORT } from './data-permissions-report.token';

@Controller()
export class NeedsAttentionController {
  constructor(@Inject(DATA_PERMISSIONS_REPORT) private readonly report: DataPermissionsReport) {}

  @Get('assets/app.properties')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  webProperties(): string {
    return buildWebProperties(process.env['SERVER_HTTP_DOMAIN'] ?? '', false)
      + `DATA_NEEDS_ATTENTION=true\nDATA_REQUIRED_UID=${this.report.uid}\nDATA_REQUIRED_GID=${this.report.gid}\n`;
  }

  @Get([ 'manifest.webmanifest', 'manifest.json' ])
  @Header('Content-Type', 'application/manifest+json; charset=utf-8')
  manifest(): WebManifest {
    return buildManifest();
  }

  @All('{*path}')
  needsAttention(): never {
    throw new ServiceUnavailableException('DATA_NEEDS_ATTENTION');
  }
}
