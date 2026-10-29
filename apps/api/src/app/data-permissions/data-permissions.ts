import { getDatabaseUrl } from '@top-nosh/data-access';
import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_LOCAL_STORAGE_CONFIG } from '../file-management/file-management.constants';

export interface DataPermissionFailure {
  path: string;
  reason: string;
}

export interface DataPermissionsReport {
  ok: boolean;
  uid: number;
  gid: number;
  failures: DataPermissionFailure[];
}

export interface DataPermissionsOptions {
  databaseUrl?: string;
  storagePath?: string;
}

const DIR_MODE = fs.constants.W_OK | fs.constants.X_OK;
const FILE_MODE = fs.constants.R_OK | fs.constants.W_OK;

function tryAccess(target: string, mode: number): string | null {
  try {
    fs.accessSync(target, mode);
    return null;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code ?? 'UNKNOWN';
  }
}

function nearestExistingAncestor(target: string): string {
  let current = target;
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return current;
}

export function checkDataPermissions(options: DataPermissionsOptions = {}): DataPermissionsReport {
  const databaseUrl = options.databaseUrl ?? getDatabaseUrl();
  const storagePath = options.storagePath
    ?? (process.env['FILEMANAGEMENT_STORAGE_LOCAL']?.trim() || DEFAULT_LOCAL_STORAGE_CONFIG.FALLBACK_PATH);
  const failures: DataPermissionFailure[] = [];

  const check = (target: string, mode: number) => {
    const reason = tryAccess(target, mode);
    if (reason) {
      failures.push({ path: target, reason });
    }
  };

  if (databaseUrl.startsWith('file:')) {
    const dbPath = databaseUrl.slice('file:'.length);
    check(path.dirname(dbPath), DIR_MODE);
    for (const file of [ dbPath, `${dbPath}-journal`, `${dbPath}-wal`, `${dbPath}-shm` ]) {
      if (fs.existsSync(file)) {
        check(file, FILE_MODE);
      }
    }
  }

  if (fs.existsSync(storagePath)) {
    check(storagePath, DIR_MODE);
  } else {
    const ancestor = nearestExistingAncestor(storagePath);
    if (!failures.some(f => f.path === ancestor)) {
      check(ancestor, DIR_MODE);
    }
  }

  return {
    ok: failures.length === 0,
    uid: process.getuid?.() ?? -1,
    gid: process.getgid?.() ?? -1,
    failures
  };
}

export function formatDataPermissionsReport(report: DataPermissionsReport): string {
  return [
    'Top Nosh cannot write to its data folder.',
    ...report.failures.map(f => `  - ${f.path} (${f.reason})`),
    `The application runs as uid:gid ${report.uid}:${report.gid}.`,
    'Fix the ownership of the mounted data folder on the host:',
    `  chown -R ${report.uid}:${report.gid} /path/to/data`,
    'See the README section "Upgrading to 0.2.0" for details.'
  ].join('\n');
}
