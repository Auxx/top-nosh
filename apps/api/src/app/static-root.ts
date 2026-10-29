import { existsSync } from 'fs';
import { join } from 'path';

export function getStaticRootPath(): string {
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
