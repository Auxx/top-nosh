import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';

function getDatabaseUrl(): string {
  const envUrl = process.env['PRISMA_DATABASE_URL'] || 'file:./data/top-nosh.db';
  if (envUrl.startsWith('file:')) {
    const rawPath = envUrl.slice('file:'.length);
    if (!path.isAbsolute(rawPath)) {
      const workspaceRoot = process.cwd().includes('apps') || process.cwd().includes('libs')
        ? path.resolve(process.cwd(), '../..')
        : process.cwd();
      const absolutePath = path.resolve(workspaceRoot, rawPath);
      return `file:${absolutePath}`;
    }
  }
  return envUrl;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaBetterSqlite3({
      url: getDatabaseUrl()
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
