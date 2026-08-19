import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { Repository } from 'typeorm';
import { Notebook } from '../notebooks/notebook.entity';
import { Source } from '../sources/source.entity';

const SUMMARY_MODEL = 'claude-opus-5';
const MAX_SUMMARY_TOKENS = 800;
const MAX_CHARS_PER_SOURCE = 6000;

const NO_SOURCES_SUMMARY =
  'Noch keine Quellen in diesem Notebook. Lade zuerst etwas hoch, um eine Zusammenfassung zu erhalten.';

const SUMMARY_UNAVAILABLE =
  'Die Zusammenfassung ist gerade nicht verfügbar. Bitte versuche es in Kürze erneut.';

@Injectable()
export class StudioService {
  private readonly logger = new Logger(StudioService.name);
  private anthropicClient: Anthropic | null = null;

  constructor(
    @InjectRepository(Source)
    private readonly sources: Repository<Source>,
    @InjectRepository(Notebook)
    private readonly notebooks: Repository<Notebook>,
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

  async summarize(notebookId: string): Promise<{ summary: string }> {
    const exists = await this.notebooks.exists({ where: { id: notebookId } });
    if (!exists) {
      throw new NotFoundException(
        `Notebook ${notebookId} wurde nicht gefunden.`,
      );
    }

    const sources = await this.sources.find({
      where: { notebookId },
      order: { createdAt: 'ASC' },
    });
    if (sources.length === 0) {
      return { summary: NO_SOURCES_SUMMARY };
    }

    try {
      const summary = await this.generateSummary(sources);
      return { summary };
    } catch (err) {
      this.logger.error(
        `Zusammenfassung für Notebook ${notebookId} fehlgeschlagen.`,
        err instanceof Error ? err.stack : err,
      );
      return { summary: SUMMARY_UNAVAILABLE };
    }
  }

  private async generateSummary(sources: Source[]): Promise<string> {
    const sourcesBlock = sources
      .map((s) => `### ${s.title}\n${s.content.slice(0, MAX_CHARS_PER_SOURCE)}`)
      .join('\n\n');

    const systemPrompt = [
      'Du fasst die folgenden Quellen eines Notebooks für jemanden zusammen, der sie noch nicht kennt.',
      'Nenne die wichtigsten Themen und Kernaussagen in 4-6 prägnanten Sätzen.',
      'Nutze ausschließlich die gegebenen Quellen, erfinde nichts hinzu. Antworte auf Deutsch, ohne Einleitung.',
      '',
      sourcesBlock,
    ].join('\n');

    const response = await this.getAnthropicClient().messages.create({
      model: SUMMARY_MODEL,
      max_tokens: MAX_SUMMARY_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Fasse die Quellen zusammen.' }],
    });

    if (response.stop_reason === 'refusal') {
      return SUMMARY_UNAVAILABLE;
    }

    const textBlock = response.content.find(
      (block) => block.type === 'text',
    ) as { type: 'text'; text: string } | undefined;

    return textBlock?.text.trim() || SUMMARY_UNAVAILABLE;
  }
}
