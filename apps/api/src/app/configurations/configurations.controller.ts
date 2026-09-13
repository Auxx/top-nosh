import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConfigurationsService } from './configurations.service';
import { RetrieveConfigurationsDto } from './dto/retrieve-configurations.dto';
import { UpdateConfigurationsDto } from './dto/update-configurations.dto';

/**
 * Controller exposing endpoints for batch retrieval and modification of configuration settings.
 * All endpoints require valid JWT authentication.
 */
@Controller('configurations')
@UseGuards(JwtAuthGuard)
export class ConfigurationsController {
  constructor(private readonly configurationsService: ConfigurationsService) {}

  /**
   * Batch retrieves values for a list of configuration keys via POST.
   *
   * @param body - The DTO containing the list of keys, or an array of key strings directly.
   * @returns A map of keys to their values (or null).
   */
  @Post('retrieve')
  @HttpCode(HttpStatus.OK)
  async retrieveConfigurations(
    @Body() body: RetrieveConfigurationsDto | string[]
  ): Promise<Record<string, string | null>> {
    let keys: string[];

    if (Array.isArray(body)) {
      keys = body;
    } else if (
      body
      && typeof body === 'object'
      && Array.isArray((body as RetrieveConfigurationsDto).keys)
    ) {
      keys = (body as RetrieveConfigurationsDto).keys;
    } else {
      throw new BadRequestException(
        'Request body must be an array of keys or an object containing a "keys" array.'
      );
    }

    if (!keys.every(k => typeof k === 'string')) {
      throw new BadRequestException('All keys must be non-empty strings.');
    }

    return this.configurationsService.getMany(keys);
  }

  /**
   * Batch retrieves values for configuration keys via GET query parameter.
   *
   * @param keysQuery - Comma-separated keys or query array.
   * @returns A map of keys to their values (or null).
   */
  @Get()
  async getConfigurations(
    @Query('keys') keysQuery?: string | string[]
  ): Promise<Record<string, string | null>> {
    let keys: string[] = [];

    if (Array.isArray(keysQuery)) {
      keys = keysQuery;
    } else if (typeof keysQuery === 'string') {
      keys = keysQuery
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
    }

    return this.configurationsService.getMany(keys);
  }

  /**
   * Batch updates configuration key-value pairs.
   *
   * @param body - A dictionary of key-value pairs or an UpdateConfigurationsDto object.
   * @returns The updated key-value map.
   */
  @Put()
  @HttpCode(HttpStatus.OK)
  async updateConfigurations(
    @Body() body: Record<string, string | null> | UpdateConfigurationsDto
  ): Promise<Record<string, string | null>> {
    let values: Record<string, string | null>;

    if (
      body
      && typeof body === 'object'
      && 'values' in body
      && typeof body.values === 'object'
      && body.values !== null
    ) {
      values = body.values as Record<string, string | null>;
    } else if (body && typeof body === 'object' && !Array.isArray(body)) {
      values = body as Record<string, string | null>;
    } else {
      throw new BadRequestException(
        'Request body must be a configuration key-value dictionary.'
      );
    }

    return this.configurationsService.updateMany(values);
  }
}
