import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { PrismaService } from '@top-nosh/data-access';
import { Response } from 'express';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Controller handling public retrieval and serving of locally stored static files.
 */
@Controller('storage')
export class StorageController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Serves a static file from a designated local storage option.
   *
   * @param storageId Unique identifier of the storage option.
   * @param fileName File name to retrieve.
   * @param res Express response object.
   */
  @Get(':storageId/:fileName')
  async serve(
    @Param('storageId') storageId: string,
    @Param('fileName') fileName: string,
    @Res() res: Response
  ): Promise<void> {
    const storageOption = await this.prisma.storageOption.findFirst({
      where: { id: storageId, deletedAt: null }
    });

    if (!storageOption || storageOption.type !== 'local') {
      throw new NotFoundException(`Storage option not found: ${storageId}`);
    }

    const cleanFileName = fileName.replace(/^[/\\]+/, '');
    const resolvedRoot = path.resolve(storageOption.url);
    const targetPath = path.resolve(resolvedRoot, cleanFileName);
    const rootWithSep = resolvedRoot.endsWith(path.sep) ? resolvedRoot : `${resolvedRoot}${path.sep}`;

    if (targetPath !== resolvedRoot && !targetPath.startsWith(rootWithSep)) {
      throw new NotFoundException(`File not found: ${fileName}`);
    }

    try {
      const stats = await fs.stat(targetPath);
      if (!stats.isFile()) {
        throw new NotFoundException(`File not found: ${fileName}`);
      }
    } catch {
      throw new NotFoundException(`File not found: ${fileName}`);
    }

    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(targetPath);
  }
}
