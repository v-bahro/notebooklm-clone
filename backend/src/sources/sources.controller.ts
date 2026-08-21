import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateTextSourceDto } from './dto/create-text-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { SourcesService } from './sources.service';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

@Controller('notebooks/:notebookId/sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  findAll(@Param('notebookId') notebookId: string) {
    return this.sourcesService.findAllByNotebook(notebookId);
  }

  @Get(':id')
  findOne(@Param('notebookId') notebookId: string, @Param('id') id: string) {
    return this.sourcesService.findOne(notebookId, id);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  upload(
    @Param('notebookId') notebookId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.sourcesService.createFromUpload(notebookId, file);
  }

  @Post('text')
  addText(
    @Param('notebookId') notebookId: string,
    @Body() dto: CreateTextSourceDto,
  ) {
    return this.sourcesService.createFromText(notebookId, dto);
  }

  @Patch(':id')
  update(
    @Param('notebookId') notebookId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSourceDto,
  ) {
    return this.sourcesService.update(notebookId, id, dto);
  }

  @Delete(':id')
  remove(@Param('notebookId') notebookId: string, @Param('id') id: string) {
    return this.sourcesService.remove(notebookId, id);
  }
}
