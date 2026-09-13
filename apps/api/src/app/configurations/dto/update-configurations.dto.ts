import { IsObject } from 'class-validator';

/**
 * DTO for batch modifying configuration values.
 */
export class UpdateConfigurationsDto {
  @IsObject()
  values!: Record<string, string | null>;
}
