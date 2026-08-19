import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Source } from '../sources/source.entity';
import { Chunk } from './chunk.entity';
import { chunkText } from './chunking';
import { EmbeddingsService } from './embeddings.service';

@Injectable()
export class IndexingService {
  private readonly logger = new Logger(IndexingService.name);

  constructor(
    @InjectRepository(Chunk)
    private readonly chunks: Repository<Chunk>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly embeddings: EmbeddingsService,
  ) {}

  async indexSource(source: Source): Promise<void> {
    const textChunks = chunkText(source.content);
    if (textChunks.length === 0) return;

    const vectors = await this.embeddings.embedBatch(
      textChunks.map((c) => c.content),
    );

    const entities = textChunks.map((c, i) =>
      this.chunks.create({
        sourceId: source.id,
        notebookId: source.notebookId,
        chunkIndex: i,
        content: c.content,
        charStart: c.charStart,
        charEnd: c.charEnd,
      }),
    );
    const saved = await this.chunks.save(entities);

    for (let i = 0; i < saved.length; i++) {
      await this.dataSource.query(
        'UPDATE chunks SET embedding = $1::vector WHERE id = $2',
        [`[${vectors[i].join(',')}]`, saved[i].id],
      );
    }

    this.logger.log(
      `Quelle ${source.id} indexiert: ${saved.length} Chunks mit Embeddings.`,
    );
  }
}
