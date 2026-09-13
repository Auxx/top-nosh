import { IsArray, IsString } from 'class-validator';

/**
 * DTO for batch retrieving configuration values.
 */
export class RetrieveConfigurationsDto {
  @IsArray()
  @IsString({ each: true })
  keys!: string[];
}
