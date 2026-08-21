import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ChatService } from '../../../core/chat.service';
import { SourcesService } from '../../../core/sources.service';
import { ChatMessage, Citation } from '../../../core/message.model';

@Component({
  selector: 'app-chat-panel',
  imports: [FormsModule],
  templateUrl: './chat-panel.component.html',
  styleUrl: './chat-panel.component.scss',
})
export class ChatPanelComponent implements OnInit, OnChanges {
  @Input({ required: true }) notebookId!: string;

  private readonly chatService = inject(ChatService);
  private readonly sourcesService = inject(SourcesService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly messages = this.chatService.messages;
  readonly loadingHistory = this.chatService.loadingHistory;
  readonly sending = this.chatService.sending;
  readonly error = this.chatService.error;
  readonly sources = this.sourcesService.sources;

  readonly question = signal('');

  private readonly historyRef = viewChild<ElementRef<HTMLDivElement>>('history');

  constructor() {
    // Scrollt den Verlauf ans Ende, sobald eine neue Nachricht dazukommt –
    // sowohl die eigene (optimistisch) als auch die Antwort.
    effect(() => {
      this.messages();
      const el = this.historyRef()?.nativeElement;
      if (el) {
        setTimeout(() => {
          el.scrollTop = el.scrollHeight;
        }, 0);
      }
    });
  }

  ngOnInit(): void {
    this.chatService.loadHistory(this.notebookId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notebookId'] && !changes['notebookId'].firstChange) {
      this.chatService.reset();
      this.chatService.loadHistory(this.notebookId);
    }
  }

  async submit(): Promise<void> {
    const question = this.question().trim();
    if (!question || this.sending()) return;
    this.question.set('');
    await this.chatService.ask(this.notebookId, question);
  }

  renderMessage(message: ChatMessage): SafeHtml {
    const withCitationMarkup = this.markupCitations(message.content, message.citations);
    const rawHtml = marked.parse(withCitationMarkup, { async: false }) as string;
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['button'],
      ADD_ATTR: ['data-citation-index'],
    });
    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }

  private markupCitations(content: string, citations: ChatMessage['citations']): string {
    if (!citations || citations.length === 0) return content;
    const byIndex = new Map(citations.map((c) => [c.index, c]));
    return content.replace(/\[(\d+)\]/g, (match, num) => {
      if (!byIndex.has(Number(num))) return match;
      return `<button type="button" class="citation" data-citation-index="${num}">${match}</button>`;
    });
  }

  onContentClick(event: Event, message: ChatMessage): void {
    const button = (event.target as HTMLElement).closest('.citation') as HTMLElement | null;
    if (!button || !message.citations) return;
    const index = Number(button.dataset['citationIndex']);
    const citation = message.citations.find((c) => c.index === index);
    if (citation) this.viewCitation(citation);
  }

  private viewCitation(citation: Citation): void {
    this.sourcesService.selectWithHighlight(
      citation.sourceId,
      citation.charStart,
      citation.charEnd,
    );
  }
}
