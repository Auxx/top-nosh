import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { DeleteGalleryImagesDto } from './dto/delete-gallery-images.dto';
import { GalleryDetailsDto, GalleryImageDto, GallerySummaryDto } from './dto/gallery-response.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { GalleriesService } from './galleries.service';

@Controller('galleries')
@UseGuards(JwtAuthGuard)
export class GalleriesController {
  constructor(private readonly galleriesService: GalleriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGallery(@Body() dto: CreateGalleryDto): Promise<GallerySummaryDto> {
    return this.galleriesService.createGallery(dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateGallery(
    @Param('id') id: string,
    @Body() dto: UpdateGalleryDto
  ): Promise<GallerySummaryDto> {
    return this.galleriesService.updateGallery(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteGallery(@Param('id') id: string): Promise<{ success: boolean; message: string; }> {
    return this.galleriesService.deleteGallery(id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getGallery(@Param('id') id: string): Promise<GalleryDetailsDto> {
    return this.galleriesService.getGallery(id);
  }

  @Post(':id/images')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File
  ): Promise<GalleryImageDto> {
    return this.galleriesService.uploadImage(id, file);
  }

  @Delete(':id/images')
  @HttpCode(HttpStatus.OK)
  async deleteImages(
    @Param('id') id: string,
    @Body() dto: DeleteGalleryImagesDto
  ): Promise<{ success: boolean; deletedCount: number; }> {
    return this.galleriesService.deleteImages(id, dto);
  }
}
