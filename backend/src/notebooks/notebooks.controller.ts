import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { NotebooksService } from './notebooks.service';
import { CreateNotebookDto } from './dto/create-notebook.dto';
import { UpdateNotebookDto } from './dto/update-notebook.dto';

@Controller('notebooks')
export class NotebooksController {
  constructor(private readonly notebooksService: NotebooksService) {}

  @Get()
  findAll() {
    return this.notebooksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notebooksService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateNotebookDto) {
    return this.notebooksService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNotebookDto) {
    return this.notebooksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notebooksService.remove(id);
  }
}
