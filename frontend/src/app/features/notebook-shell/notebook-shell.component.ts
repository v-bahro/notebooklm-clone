import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NotebooksService } from '../../core/notebooks.service';
import { SourcesService } from '../../core/sources.service';
import { Notebook } from '../../core/notebook.model';
import { Source } from '../../core/source.model';
import { ChatPanelComponent } from './chat-panel/chat-panel.component';
import { SourcesPanelComponent } from './sources-panel/sources-panel.component';
import { StudioPanelComponent } from './studio-panel/studio-panel.component';

interface SourceContentSegment {
  text: string;
  highlighted: boolean;
}

@Component({
  selector: 'app-notebook-shell',
  imports: [
    RouterLink,
    FormsModule,
    SourcesPanelComponent,
    StudioPanelComponent,
    ChatPanelComponent,
  ],
  templateUrl: './notebook-shell.component.html',
  styleUrl: './notebook-shell.component.scss',
})
export class NotebookShellComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly notebooksService = inject(NotebooksService);
  private readonly sourcesService = inject(SourcesService);

  readonly notebook = signal<Notebook | null>(null);
  readonly notFound = signal(false);
  readonly editingTitle = signal(false);
  readonly titleDraft = signal('');
  readonly selectedSource = this.sourcesService.selected;
  readonly highlightRange = this.sourcesService.highlightRange;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound.set(true);
      return;
    }
    try {
      const notebook = await this.notebooksService.getOne(id);
      this.notebook.set(notebook);
    } catch {
      this.notFound.set(true);
    }
  }

  startEditTitle(): void {
    const current = this.notebook();
    if (!current) return;
    this.titleDraft.set(current.title);
    this.editingTitle.set(true);
  }

  async submitTitle(): Promise<void> {
    const current = this.notebook();
    const title = this.titleDraft().trim();
    if (!current || !title) {
      this.editingTitle.set(false);
      return;
    }
    await this.notebooksService.rename(current.id, title);
    this.notebook.set({ ...current, title });
    this.editingTitle.set(false);
  }

  closeSource(): void {
    this.sourcesService.clearSelection();
  }

  sourceContentSegments(source: Source): SourceContentSegment[] {
    const range = this.highlightRange();
    if (
      !range ||
      range.start < 0 ||
      range.end > source.content.length ||
      range.start >= range.end
    ) {
      return [{ text: source.content, highlighted: false }];
    }
    return [
      { text: source.content.slice(0, range.start), highlighted: false },
      { text: source.content.slice(range.start, range.end), highlighted: true },
      { text: source.content.slice(range.end), highlighted: false },
    ];
  }
}
