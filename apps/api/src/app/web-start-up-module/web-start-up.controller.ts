import { Controller, Get, Header } from '@nestjs/common';
import { OpenIdService } from '../auth/open-id.service';
import { getFrontendUrl } from '../cors.config';

export interface WebManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

export interface WebManifest {
  name: string;
  short_name: string;
  start_url: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  icons: WebManifestIcon[];
}

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

  @Get([ 'manifest.webmanifest', 'manifest.json' ])
  @Header('Content-Type', 'application/manifest+json; charset=utf-8')
  manifest(): WebManifest {
    return {
      name: 'Top Nosh',
      short_name: 'Top Nosh',
      start_url: `${getFrontendUrl()}/`,
      display: 'standalone',
      icons: [
        {
          src: '/images/pwa/android/launchericon-48x48.png',
          sizes: '48x48',
          type: 'image/png'
        },
        {
          src: '/images/pwa/android/launchericon-72x72.png',
          sizes: '72x72',
          type: 'image/png'
        },
        {
          src: '/images/pwa/android/launchericon-96x96.png',
          sizes: '96x96',
          type: 'image/png'
        },
        {
          src: '/images/pwa/android/launchericon-144x144.png',
          sizes: '144x144',
          type: 'image/png'
        },
        {
          src: '/images/pwa/android/launchericon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/images/pwa/android/launchericon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    };
  }
}
