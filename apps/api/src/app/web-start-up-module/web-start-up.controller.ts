import { Controller, Get, Header } from '@nestjs/common';

@Controller()
export class WebStartUpController {
  @Get('assets/app.properties')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  webProperties(): string {
    const apiUrl = process.env['SERVER_HTTP_DOMAIN'] ?? '';
    return `PRODUCTION=true\nAPI_URL=${apiUrl}\n`;
  }
}
