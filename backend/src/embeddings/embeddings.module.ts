import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chunk } from './chunk.entity';
import { EmbeddingsService } from './embeddings.service';
import { IndexingService } from './indexing.service';
import { VectorSchemaService } from './vector-schema.service';
import { VectorSearchService } from './vector-search.service';

@Module({
  imports: [TypeOrmModule.forFeature([Chunk])],
  providers: [
    EmbeddingsService,
    IndexingService,
    VectorSearchService,
    VectorSchemaService,
  ],
  exports: [EmbeddingsService, IndexingService, VectorSearchService],
})
export class EmbeddingsModule {}
