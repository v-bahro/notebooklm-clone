import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NotebooksService } from '../../core/notebooks.service';
import { Notebook } from '../../core/notebook.model';
import { formatDate } from '../../core/format-date';

@Component({
  selector: 'app-notebook-list',
  imports: [FormsModule, RouterLink],
  templateUrl: './notebook-list.component.html',
  styleUrl: './notebook-list.component.scss',
})
export class NotebookListComponent implements OnInit {
  private readonly notebooksService = inject(NotebooksService);

  readonly notebooks = this.notebooksService.notebooks;
  readonly loading = this.notebooksService.loading;
  readonly error = this.notebooksService.error;
  readonly formatDate = formatDate;

  readonly isCreating = signal(false);
  readonly newTitle = signal('');
  readonly creating = signal(false);

  readonly editingId = signal<string | null>(null);
  readonly editTitle = signal('');

  readonly pendingDeleteId = signal<string | null>(null);

  ngOnInit(): void {
    this.notebooksService.loadAll();
  }

  startCreate(): void {
    this.isCreating.set(true);
    this.newTitle.set('');
  }

  cancelCreate(): void {
    this.isCreating.set(false);
    this.newTitle.set('');
  }

  async submitCreate(): Promise<void> {
    const title = this.newTitle().trim();
    if (!title || this.creating()) {
      return;
    }
    this.creating.set(true);
    try {
      await this.notebooksService.create(title);
      this.isCreating.set(false);
      this.newTitle.set('');
    } finally {
      this.creating.set(false);
    }
  }

  startEdit(notebook: Notebook, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.editingId.set(notebook.id);
    this.editTitle.set(notebook.title);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  async submitEdit(id: string): Promise<void> {
    const title = this.editTitle().trim();
    if (!title) {
      this.cancelEdit();
      return;
    }
    await this.notebooksService.rename(id, title);
    this.editingId.set(null);
  }

  askDelete(id: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.pendingDeleteId.set(id);
  }

  cancelDelete(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.pendingDeleteId.set(null);
  }

  async confirmDelete(id: string, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    await this.notebooksService.remove(id);
    this.pendingDeleteId.set(null);
  }
}
