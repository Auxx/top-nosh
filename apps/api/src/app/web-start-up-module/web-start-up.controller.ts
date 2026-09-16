import { Controller, Get, Header } from '@nestjs/common';
import { OpenIdService } from '../auth/open-id.service';

@Controller()
export class WebStartUpController {
  constructor(private readonly openIdService: OpenIdService) {}

  @Get('assets/app.properties')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  webProperties(): string {
    const apiUrl = process.env['SERVER_HTTP_DOMAIN'] ?? '';
    const oidcEnabled = this.openIdService.isEnabled();
    return `PRODUCTION=true\nAPI_URL=${apiUrl}\nSECURITY_OIDC_ENABLED=${oidcEnabled}\n`;
  }
}
