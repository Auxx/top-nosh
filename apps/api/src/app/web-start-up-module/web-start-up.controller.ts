import { Controller, Get, Header } from '@nestjs/common';
import { OpenIdService } from '../auth/open-id.service';
import { buildManifest, buildWebProperties, WebManifest } from './web-start-up.content';

export type { WebManifest, WebManifestIcon } from './web-start-up.content';

@Controller()
export class WebStartUpController {
  constructor(private readonly openIdService: OpenIdService) {}

  @Get('assets/app.properties')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  webProperties(): string {
    return buildWebProperties(process.env['SERVER_HTTP_DOMAIN'] ?? '', this.openIdService.isEnabled());
  }

  @Get([ 'manifest.webmanifest', 'manifest.json' ])
  @Header('Content-Type', 'application/manifest+json; charset=utf-8')
  manifest(): WebManifest {
    return buildManifest();
  }
}
