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
  id: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  icons: WebManifestIcon[];
}

export function buildWebProperties(apiUrl: string, oidcEnabled: boolean): string {
  return `PRODUCTION=true\nAPI_URL=${apiUrl}\nSECURITY_OIDC_ENABLED=${oidcEnabled}\n`;
}

export function buildManifest(): WebManifest {
  return {
    name: 'Top Nosh',
    short_name: 'Top Nosh',
    start_url: `${getFrontendUrl()}/`,
    id: `${getFrontendUrl()}/`,
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
