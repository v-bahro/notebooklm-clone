import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

const EMBEDDING_DIMENSIONS = 1536; // OpenAI text-embedding-3-small

@Injectable()
export class VectorSchemaService implements OnModuleInit {
  private readonly logger = new Logger(VectorSchemaService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS vector');
    await this.dataSource.query(
      `ALTER TABLE chunks ADD COLUMN IF NOT EXISTS embedding vector(${EMBEDDING_DIMENSIONS})`,
    );
    this.logger.log('pgvector-Schema bereit (chunks.embedding).');
  }
}
