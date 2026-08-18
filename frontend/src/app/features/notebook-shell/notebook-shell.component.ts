import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NotebooksService } from '../../core/notebooks.service';
import { Notebook } from '../../core/notebook.model';
import { SourcesPanelComponent } from './sources-panel/sources-panel.component';
import { StudioPanelComponent } from './studio-panel/studio-panel.component';

@Component({
  selector: 'app-notebook-shell',
  imports: [RouterLink, FormsModule, SourcesPanelComponent, StudioPanelComponent],
  templateUrl: './notebook-shell.component.html',
  styleUrl: './notebook-shell.component.scss',
})
export class NotebookShellComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly notebooksService = inject(NotebooksService);

  readonly notebook = signal<Notebook | null>(null);
  readonly notFound = signal(false);
  readonly editingTitle = signal(false);
  readonly titleDraft = signal('');

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
}
