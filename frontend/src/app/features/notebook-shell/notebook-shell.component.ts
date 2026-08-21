import { Component, DestroyRef, OnInit, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private readonly destroyRef = inject(DestroyRef);

  readonly notebook = signal<Notebook | null>(null);
  readonly notFound = signal(false);
  readonly editingTitle = signal(false);
  readonly titleDraft = signal('');
  readonly selectedSource = this.sourcesService.selected;
  readonly highlightRange = this.sourcesService.highlightRange;

  constructor() {
    // Springt beim Öffnen eines Zitats zur markierten Stelle im Quelltext,
    // statt dass man selbst danach suchen muss.
    effect(() => {
      if (this.highlightRange() && this.selectedSource()) {
        setTimeout(() => {
          document
            .querySelector('.source-view__content mark')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 0);
      }
    });
  }

  ngOnInit(): void {
    // route.paramMap statt route.snapshot: Angulars Router nutzt dieselbe
    // Komponenten-Instanz weiter, wenn man von einem Notizbuch direkt zu
    // einem anderen navigiert (gleiche Route, nur die :id ändert sich) –
    // ngOnInit feuert dann nicht erneut. Ohne das reaktive paramMap-
    // Abonnement blieben Titel, Quellen und Chat-Verlauf des vorherigen
    // Notizbuchs stehen.
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.notFound.set(true);
        return;
      }
      this.loadNotebook(id);
    });
  }

  private async loadNotebook(id: string): Promise<void> {
    this.notFound.set(false);
    this.sourcesService.clearSelection();
    try {
      const notebook = await this.notebooksService.getOne(id);
      this.notebook.set(notebook);
    } catch {
      this.notebook.set(null);
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
