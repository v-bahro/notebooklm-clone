import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { Notebook } from '../notebooks/notebook.entity';
import { Source } from './source.entity';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';

@Module({
  imports: [TypeOrmModule.forFeature([Source, Notebook]), EmbeddingsModule],
  controllers: [SourcesController],
  providers: [SourcesService],
})
export class SourcesModule {}
