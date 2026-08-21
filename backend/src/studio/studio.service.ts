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
  'Noch keine Quellen in diesem Notizbuch. Lade zuerst etwas hoch, um eine Zusammenfassung zu erhalten.';

const SUMMARY_UNAVAILABLE =
  'Die Zusammenfassung ist gerade nicht verfügbar. Bitte versuche es in Kürze erneut.';

export interface SummaryResult {
  summary: string;
  generatedAt: Date | null;
}

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

  async getSummary(notebookId: string): Promise<SummaryResult> {
    const notebook = await this.notebooks.findOneBy({ id: notebookId });
    if (!notebook) {
      throw new NotFoundException(
        `Notizbuch ${notebookId} wurde nicht gefunden.`,
      );
    }
    return {
      summary: notebook.summary ?? '',
      generatedAt: notebook.summaryGeneratedAt,
    };
  }

  async summarize(notebookId: string): Promise<SummaryResult> {
    const notebook = await this.notebooks.findOneBy({ id: notebookId });
    if (!notebook) {
      throw new NotFoundException(
        `Notizbuch ${notebookId} wurde nicht gefunden.`,
      );
    }

    const sources = await this.sources.find({
      where: { notebookId },
      order: { createdAt: 'ASC' },
    });
    if (sources.length === 0) {
      return { summary: NO_SOURCES_SUMMARY, generatedAt: null };
    }

    try {
      const summary = await this.generateSummary(sources);
      notebook.summary = summary;
      notebook.summaryGeneratedAt = new Date();
      await this.notebooks.save(notebook);
      return { summary, generatedAt: notebook.summaryGeneratedAt };
    } catch (err) {
      this.logger.error(
        `Zusammenfassung für Notebook ${notebookId} fehlgeschlagen.`,
        err instanceof Error ? err.stack : err,
      );
      return { summary: SUMMARY_UNAVAILABLE, generatedAt: null };
    }
  }

  private async generateSummary(sources: Source[]): Promise<string> {
    const sourcesBlock = sources
      .map((s) => `### ${s.title}\n${s.content.slice(0, MAX_CHARS_PER_SOURCE)}`)
      .join('\n\n');

    const systemPrompt = [
      'Du fasst die folgenden Quellen eines Notizbuchs für jemanden zusammen, der sie noch nicht kennt.',
      'Antworte als 3-5 kurze Stichpunkte, jeder auf einer eigenen Zeile, beginnend mit "- ".',
      'Jeder Stichpunkt nennt einen zentralen Punkt einer oder mehrerer Quellen – kurz und konkret, kein Fließtext.',
      'Nutze ausschließlich die gegebenen Quellen, erfinde nichts hinzu. Antworte auf Deutsch, ohne Einleitung oder Überschrift.',
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
