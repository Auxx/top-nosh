import { Controller, Get, Header } from '@nestjs/common';

@Controller()
export class Configuration {
  @Get('assets/app.properties')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  webProperties(): string {
    const apiUrl = process.env['CORS_ORIGIN'] ?? '';
    return `PRODUCTION=true\nAPI_URL=${apiUrl}\n`;
  }
}

export { Configuration as ConfigurationController };
