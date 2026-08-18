import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notebook } from './notebook.entity';
import { NotebooksService } from './notebooks.service';
import { NotebooksController } from './notebooks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Notebook])],
  controllers: [NotebooksController],
  providers: [NotebooksService],
})
export class NotebooksModule {}
