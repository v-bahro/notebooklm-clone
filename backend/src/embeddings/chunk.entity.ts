import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Source } from '../sources/source.entity';

@Entity('chunks')
export class Chunk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Source, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_id' })
  source: Source;

  @Index()
  @Column({ name: 'source_id' })
  sourceId: string;

  @Index()
  @Column({ name: 'notebook_id' })
  notebookId: string;

  @Column({ name: 'chunk_index', type: 'int' })
  chunkIndex: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'char_start', type: 'int' })
  charStart: number;

  @Column({ name: 'char_end', type: 'int' })
  charEnd: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
