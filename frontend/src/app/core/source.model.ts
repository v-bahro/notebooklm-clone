export type SourceType = 'pdf' | 'text';

export interface Source {
  id: string;
  notebookId: string;
  title: string;
  type: SourceType;
  content: string;
  charCount: number;
  includedInChat: boolean;
  createdAt: string;
}
