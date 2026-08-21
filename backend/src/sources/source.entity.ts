import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Notebook } from '../notebooks/notebook.entity';

export type SourceType = 'pdf' | 'text';

@Entity('sources')
export class Source {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Notebook, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notebook_id' })
  notebook: Notebook;

  @Index()
  @Column({ name: 'notebook_id' })
  notebookId: string;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 10 })
  type: SourceType;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'char_count', type: 'int' })
  charCount: number;

  @Column({ name: 'included_in_chat', type: 'boolean', default: true })
  includedInChat: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
