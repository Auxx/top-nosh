import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateGalleryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
