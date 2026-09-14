import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class DeleteGalleryImagesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayNotEmpty()
  imageIds!: string[];
}
