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

export interface ChatMessage {
  id: string;
  notebookId: string;
  role: MessageRole;
  content: string;
  citations: Citation[] | null;
  createdAt: string;
}
