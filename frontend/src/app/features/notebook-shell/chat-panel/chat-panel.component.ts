import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../core/chat.service';
import { SourcesService } from '../../../core/sources.service';
import { ChatMessage, Citation } from '../../../core/message.model';

interface ContentSegment {
  text: string;
  citation?: Citation;
}

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

  readonly messages = this.chatService.messages;
  readonly loadingHistory = this.chatService.loadingHistory;
  readonly sending = this.chatService.sending;
  readonly error = this.chatService.error;
  readonly sources = this.sourcesService.sources;

  readonly question = signal('');

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

  segments(message: ChatMessage): ContentSegment[] {
    if (!message.citations || message.citations.length === 0) {
      return [{ text: message.content }];
    }
    const byIndex = new Map(message.citations.map((c) => [c.index, c]));
    return message.content.split(/(\[\d+\])/g).map((part) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const citation = byIndex.get(Number(match[1]));
        if (citation) return { text: part, citation };
      }
      return { text: part };
    });
  }

  viewCitation(citation: Citation): void {
    this.sourcesService.selectWithHighlight(
      citation.sourceId,
      citation.charStart,
      citation.charEnd,
    );
  }
}
