import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { Repository } from 'typeorm';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import {
  RetrievedChunk,
  VectorSearchService,
} from '../embeddings/vector-search.service';
import { Notebook } from '../notebooks/notebook.entity';
import { Citation, Message } from './message.entity';

const CHAT_MODEL = 'claude-opus-5';
const MAX_ANSWER_TOKENS = 1500;
const RETRIEVAL_LIMIT = 6;

const NO_SOURCES_ANSWER =
  'In diesem Notizbuch sind noch keine durchsuchbaren Quellen vorhanden. Lade zuerst eine Quelle hoch, um Fragen dazu stellen zu können.';

const CHAT_UNAVAILABLE_ANSWER =
  'Der Chat ist gerade nicht erreichbar. Bitte versuche es in Kürze erneut.';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private anthropicClient: Anthropic | null = null;

  constructor(
    @InjectRepository(Message)
    private readonly messages: Repository<Message>,
    @InjectRepository(Notebook)
    private readonly notebooks: Repository<Notebook>,
    private readonly embeddings: EmbeddingsService,
    private readonly vectorSearch: VectorSearchService,
    private readonly config: ConfigService,
  ) {}

  private getAnthropicClient(): Anthropic {
    if (!this.anthropicClient) {
      this.anthropicClient = new Anthropic({
        apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
      });
    }
    return this.anthropicClient;
  }

  async findAllByNotebook(notebookId: string): Promise<Message[]> {
    await this.ensureNotebookExists(notebookId);
    return this.messages.find({
      where: { notebookId },
      order: { createdAt: 'ASC' },
    });
  }

  async ask(
    notebookId: string,
    question: string,
  ): Promise<{ userMessage: Message; assistantMessage: Message }> {
    await this.ensureNotebookExists(notebookId);

    const userMessage = await this.messages.save(
      this.messages.create({ notebookId, role: 'user', content: question }),
    );

    const { content, citations } = await this.answer(notebookId, question);

    const assistantMessage = await this.messages.save(
      this.messages.create({
        notebookId,
        role: 'assistant',
        content,
        citations: citations.length > 0 ? citations : null,
      }),
    );

    return { userMessage, assistantMessage };
  }

  private async answer(
    notebookId: string,
    question: string,
  ): Promise<{ content: string; citations: Citation[] }> {
    try {
      const questionEmbedding = await this.embeddings.embed(question);
      const chunks = await this.vectorSearch.search(
        notebookId,
        questionEmbedding,
        RETRIEVAL_LIMIT,
      );

      if (chunks.length === 0) {
        return { content: NO_SOURCES_ANSWER, citations: [] };
      }

      const answerText = await this.generateAnswer(question, chunks);
      const citations = this.extractCitations(answerText, chunks);
      return { content: answerText, citations };
    } catch (err) {
      this.logger.error(
        `Antwort für Notebook ${notebookId} fehlgeschlagen.`,
        err instanceof Error ? err.stack : err,
      );
      return { content: CHAT_UNAVAILABLE_ANSWER, citations: [] };
    }
  }

  private async generateAnswer(
    question: string,
    chunks: RetrievedChunk[],
  ): Promise<string> {
    const excerptsBlock = chunks
      .map((c, i) => `[${i + 1}] Aus "${c.sourceTitle}":\n${c.content}`)
      .join('\n\n');

    const systemPrompt = [
      'Du beantwortest Fragen ausschließlich auf Basis der folgenden nummerierten Ausschnitte aus den Quellen dieses Notizbuchs.',
      'Zitiere jede Aussage mit der passenden Nummer in eckigen Klammern, z. B. [1] oder [2][3].',
      'Wenn die Ausschnitte die Frage nicht beantworten, sage das offen. Erfinde nichts und nutze kein Wissen außerhalb der Ausschnitte.',
      'Antworte auf Deutsch, prägnant und ohne unnötige Einleitung.',
      '',
      excerptsBlock,
    ].join('\n');

    const response = await this.getAnthropicClient().messages.create({
      model: CHAT_MODEL,
      max_tokens: MAX_ANSWER_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }],
    });

    if (response.stop_reason === 'refusal') {
      return 'Diese Anfrage konnte aus Sicherheitsgründen nicht beantwortet werden.';
    }

    const textBlock = response.content.find(
      (block) => block.type === 'text',
    ) as { type: 'text'; text: string } | undefined;

    return textBlock?.text.trim() ?? '';
  }

  private extractCitations(text: string, chunks: RetrievedChunk[]): Citation[] {
    const indices = new Set<number>();
    const pattern = /\[(\d+)\]/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const n = Number.parseInt(match[1], 10);
      if (n >= 1 && n <= chunks.length) {
        indices.add(n);
      }
    }

    return Array.from(indices)
      .sort((a, b) => a - b)
      .map((n) => {
        const chunk = chunks[n - 1];
        return {
          index: n,
          sourceId: chunk.sourceId,
          sourceTitle: chunk.sourceTitle,
          chunkId: chunk.id,
          excerpt: chunk.content,
          charStart: chunk.charStart,
          charEnd: chunk.charEnd,
        };
      });
  }

  private async ensureNotebookExists(notebookId: string): Promise<void> {
    const exists = await this.notebooks.exists({ where: { id: notebookId } });
    if (!exists) {
      throw new NotFoundException(
        `Notizbuch ${notebookId} wurde nicht gefunden.`,
      );
    }
  }
}
