import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notebook } from './notebook.entity';
import { CreateNotebookDto } from './dto/create-notebook.dto';
import { UpdateNotebookDto } from './dto/update-notebook.dto';

@Injectable()
export class NotebooksService {
  constructor(
    @InjectRepository(Notebook)
    private readonly notebooks: Repository<Notebook>,
  ) {}

  findAll(): Promise<Notebook[]> {
    return this.notebooks.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Notebook> {
    const notebook = await this.notebooks.findOne({ where: { id } });
    if (!notebook) {
      throw new NotFoundException(`Notizbuch ${id} wurde nicht gefunden.`);
    }
    return notebook;
  }

  create(dto: CreateNotebookDto): Promise<Notebook> {
    const notebook = this.notebooks.create({ title: dto.title.trim() });
    return this.notebooks.save(notebook);
  }

  async update(id: string, dto: UpdateNotebookDto): Promise<Notebook> {
    const notebook = await this.findOne(id);
    if (dto.title !== undefined) {
      notebook.title = dto.title.trim();
    }
    return this.notebooks.save(notebook);
  }

  async remove(id: string): Promise<void> {
    const result = await this.notebooks.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Notizbuch ${id} wurde nicht gefunden.`);
    }
  }
}
