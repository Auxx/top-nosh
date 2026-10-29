import { getDatabaseUrl } from '@top-nosh/data-access';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { checkDataPermissions, formatDataPermissionsReport } from './data-permissions';

const describeNonRoot = process.getuid?.() === 0 ? describe.skip : describe;

describe('data-permissions', () => {
  let root: string;
  let dataDir: string;
  let dbPath: string;
  let storagePath: string;
  let databaseUrl: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'top-nosh-perm-'));
    dataDir = path.join(root, 'data');
    fs.mkdirSync(dataDir);
    dbPath = path.join(dataDir, 'top-nosh.db');
    storagePath = path.join(dataDir, 'storage');
    databaseUrl = `file:${dbPath}`;
  });

  afterEach(() => {
    for (const p of [ dataDir, storagePath ]) {
      if (fs.existsSync(p)) {
        fs.chmodSync(p, 0o700);
      }
    }
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('passes when data dir is writable and db/storage do not exist yet', () => {
    const report = checkDataPermissions({ databaseUrl, storagePath });
    expect(report.ok).toBe(true);
    expect(report.failures).toEqual([]);
  });

  it('passes when db, sidecars and storage are all writable', () => {
    fs.writeFileSync(dbPath, '');
    fs.writeFileSync(`${dbPath}-wal`, '');
    fs.writeFileSync(`${dbPath}-shm`, '');
    fs.mkdirSync(storagePath);
    const report = checkDataPermissions({ databaseUrl, storagePath });
    expect(report.ok).toBe(true);
    expect(report.failures).toEqual([]);
  });

  describeNonRoot('with restrictive modes', () => {
    it('fails when data dir is read-only', () => {
      fs.chmodSync(dataDir, 0o500);
      const report = checkDataPermissions({ databaseUrl, storagePath });
      expect(report.ok).toBe(false);
      const failures = report.failures.filter(f => f.path === dataDir);
      expect(failures).toHaveLength(1);
      expect(failures[0].reason).toBe('EACCES');
    });

    it('fails when db file is not writable', () => {
      fs.writeFileSync(dbPath, '');
      fs.chmodSync(dbPath, 0o400);
      const report = checkDataPermissions({ databaseUrl, storagePath });
      expect(report.ok).toBe(false);
      expect(report.failures.map(f => f.path)).toContain(dbPath);
    });

    it('fails when a -wal sidecar is not writable while db file is', () => {
      fs.writeFileSync(dbPath, '');
      fs.writeFileSync(`${dbPath}-wal`, '');
      fs.chmodSync(`${dbPath}-wal`, 0o400);
      const report = checkDataPermissions({ databaseUrl, storagePath });
      expect(report.ok).toBe(false);
      expect(report.failures).toHaveLength(1);
      expect(report.failures[0].path.endsWith('-wal')).toBe(true);
    });

    it('fails when storage dir exists and is read-only', () => {
      fs.mkdirSync(storagePath);
      fs.chmodSync(storagePath, 0o500);
      const report = checkDataPermissions({ databaseUrl, storagePath });
      expect(report.ok).toBe(false);
      expect(report.failures.map(f => f.path)).toContain(storagePath);
    });
  });

  it('leaves no probe file behind after a successful check', () => {
    fs.mkdirSync(storagePath);
    checkDataPermissions({ databaseUrl, storagePath });
    expect(fs.readdirSync(dataDir)).toEqual([ 'storage' ]);
    expect(fs.readdirSync(storagePath)).toEqual([]);
  });

  it('recovers from a stale probe file left by a crashed run', () => {
    fs.writeFileSync(path.join(dataDir, `.top-nosh-write-test-${process.pid}`), '');
    const report = checkDataPermissions({ databaseUrl, storagePath });
    expect(report.ok).toBe(true);
    expect(fs.readdirSync(dataDir)).toEqual([]);
  });

  it('fails when data dir does not exist', () => {
    fs.rmSync(dataDir, { recursive: true });
    const report = checkDataPermissions({ databaseUrl, storagePath: path.join(root, 'storage') });
    expect(report.ok).toBe(false);
    expect(report.failures[0]).toEqual({ path: dataDir, reason: 'ENOENT' });
  });

  it('skips database checks for non-file URLs', () => {
    const report = checkDataPermissions({ databaseUrl: 'postgres://x', storagePath });
    expect(report.ok).toBe(true);
  });

  it('reports uid and gid of the current process', () => {
    const report = checkDataPermissions({ databaseUrl, storagePath });
    expect(report.uid).toBe(process.getuid?.());
    expect(report.gid).toBe(process.getgid?.());
  });

  it('formatDataPermissionsReport includes failing path, uid:gid and chown command', () => {
    const report = {
      ok: false,
      uid: 1000,
      gid: 1000,
      failures: [ { path: dataDir, reason: 'EACCES' } ]
    };
    const text = formatDataPermissionsReport(report);
    expect(text).toContain(dataDir);
    expect(text).toContain(`${report.uid}:${report.gid}`);
    expect(text).toContain('chown -R');
    expect(text).toContain('https://github.com/Auxx/top-nosh#rootless-docker--podman');
    expect(text).not.toContain(':ro');
    expect(text).not.toContain('is missing');
  });

  it('formatDataPermissionsReport hints at a read-only mount for EROFS', () => {
    const text = formatDataPermissionsReport({
      ok: false,
      uid: 1000,
      gid: 1000,
      failures: [ { path: '/app/data', reason: 'EROFS' } ]
    });
    expect(text).toContain('read-only');
    expect(text).toContain(':ro');
    expect(text).not.toContain('chown -R');
  });

  it('formatDataPermissionsReport hints at a missing folder for ENOENT', () => {
    const text = formatDataPermissionsReport({
      ok: false,
      uid: 1000,
      gid: 1000,
      failures: [ { path: '/app/data', reason: 'ENOENT' } ]
    });
    expect(text).toContain('is missing');
    expect(text).toContain('/app/data');
    expect(text).not.toContain('chown -R');
  });

  it('formatDataPermissionsReport keeps chown hint alongside other hints', () => {
    const text = formatDataPermissionsReport({
      ok: false,
      uid: 1000,
      gid: 1000,
      failures: [ { path: '/a', reason: 'EROFS' }, { path: '/b', reason: 'EACCES' } ]
    });
    expect(text).toContain('chown -R');
    expect(text).toContain(':ro');
  });
});

describe('getDatabaseUrl', () => {
  const original = process.env['PRISMA_DATABASE_URL'];

  afterEach(() => {
    if (original === undefined) {
      delete process.env['PRISMA_DATABASE_URL'];
    } else {
      process.env['PRISMA_DATABASE_URL'] = original;
    }
  });

  it('resolves relative file: URL to an absolute path', () => {
    delete process.env['PRISMA_DATABASE_URL'];
    const url = getDatabaseUrl();
    expect(url.startsWith('file:/')).toBe(true);
    expect(url.endsWith('/data/top-nosh.db')).toBe(true);
  });
});
