import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type MessageRole = 'user' | 'assistant';

export interface Citation {
  index: number;
  sourceId: string;
  sourceTitle: string;
  chunkId: string;
  excerpt: string;
  charStart: number;
  charEnd: number;
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'notebook_id' })
  notebookId: string;

  @Column({ length: 10 })
  role: MessageRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  citations: Citation[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
