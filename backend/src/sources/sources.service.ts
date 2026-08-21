import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PDFParse } from 'pdf-parse';
import { Repository } from 'typeorm';
import { IndexingService } from '../embeddings/indexing.service';
import { Notebook } from '../notebooks/notebook.entity';
import { CreateTextSourceDto } from './dto/create-text-source.dto';
import { Source } from './source.entity';

const SUPPORTED_PDF_MIME_TYPES = new Set(['application/pdf']);
const SUPPORTED_TEXT_MIME_TYPES = new Set(['text/plain']);

@Injectable()
export class SourcesService {
  private readonly logger = new Logger(SourcesService.name);

  constructor(
    @InjectRepository(Source)
    private readonly sources: Repository<Source>,
    @InjectRepository(Notebook)
    private readonly notebooks: Repository<Notebook>,
    private readonly indexingService: IndexingService,
  ) {}

  private async ensureNotebookExists(notebookId: string): Promise<void> {
    const exists = await this.notebooks.exists({ where: { id: notebookId } });
    if (!exists) {
      throw new NotFoundException(
        `Notizbuch ${notebookId} wurde nicht gefunden.`,
      );
    }
  }

  async findAllByNotebook(notebookId: string): Promise<Source[]> {
    await this.ensureNotebookExists(notebookId);
    return this.sources.find({
      where: { notebookId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(notebookId: string, id: string): Promise<Source> {
    const source = await this.sources.findOne({ where: { id, notebookId } });
    if (!source) {
      throw new NotFoundException(`Quelle ${id} wurde nicht gefunden.`);
    }
    return source;
  }

  async createFromUpload(
    notebookId: string,
    file: Express.Multer.File,
  ): Promise<Source> {
    await this.ensureNotebookExists(notebookId);
    if (!file) {
      throw new BadRequestException('Keine Datei übermittelt.');
    }

    let content: string;
    let type: 'pdf' | 'text';

    if (SUPPORTED_PDF_MIME_TYPES.has(file.mimetype)) {
      content = await this.extractPdfText(file.buffer);
      type = 'pdf';
    } else if (
      SUPPORTED_TEXT_MIME_TYPES.has(file.mimetype) ||
      file.originalname.toLowerCase().endsWith('.txt')
    ) {
      content = file.buffer.toString('utf-8');
      type = 'text';
    } else {
      throw new BadRequestException(
        'Nicht unterstütztes Dateiformat. Erlaubt sind PDF und .txt.',
      );
    }

    const title = file.originalname || 'Unbenannte Quelle';
    return this.save(notebookId, title, type, content);
  }

  async createFromText(
    notebookId: string,
    dto: CreateTextSourceDto,
  ): Promise<Source> {
    await this.ensureNotebookExists(notebookId);
    return this.save(notebookId, dto.title.trim(), 'text', dto.content);
  }

  async remove(notebookId: string, id: string): Promise<void> {
    const result = await this.sources.delete({ id, notebookId });
    if (result.affected === 0) {
      throw new NotFoundException(`Quelle ${id} wurde nicht gefunden.`);
    }
  }

  private async save(
    notebookId: string,
    title: string,
    type: 'pdf' | 'text',
    content: string,
  ): Promise<Source> {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new BadRequestException(
        'Aus dieser Quelle konnte kein Text extrahiert werden.',
      );
    }
    const source = this.sources.create({
      notebookId,
      title,
      type,
      content: trimmedContent,
      charCount: trimmedContent.length,
    });
    const saved = await this.sources.save(source);

    try {
      await this.indexingService.indexSource(saved);
    } catch (err) {
      this.logger.warn(
        `Indexierung für Quelle ${saved.id} fehlgeschlagen – Chat-Suche wird sie vorerst nicht finden.`,
        err instanceof Error ? err.stack : err,
      );
    }

    return saved;
  }

  private async extractPdfText(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } catch {
      throw new BadRequestException('PDF konnte nicht gelesen werden.');
    } finally {
      await parser.destroy();
    }
  }
}
