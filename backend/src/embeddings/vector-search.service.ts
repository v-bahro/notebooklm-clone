import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface RetrievedChunk {
  id: string;
  sourceId: string;
  sourceTitle: string;
  chunkIndex: number;
  content: string;
  charStart: number;
  charEnd: number;
  similarity: number;
}

const DEFAULT_LIMIT = 6;

@Injectable()
export class VectorSearchService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async search(
    notebookId: string,
    queryEmbedding: number[],
    limit: number = DEFAULT_LIMIT,
  ): Promise<RetrievedChunk[]> {
    const vectorLiteral = `[${queryEmbedding.join(',')}]`;
    return this.dataSource.query(
      `SELECT c.id, c.source_id AS "sourceId", s.title AS "sourceTitle",
              c.chunk_index AS "chunkIndex", c.content,
              c.char_start AS "charStart", c.char_end AS "charEnd",
              1 - (c.embedding <=> $1::vector) AS similarity
       FROM chunks c
       JOIN sources s ON s.id = c.source_id
       WHERE c.notebook_id = $2 AND c.embedding IS NOT NULL
       ORDER BY c.embedding <=> $1::vector
       LIMIT $3`,
      [vectorLiteral, notebookId, limit],
    );
  }
}
