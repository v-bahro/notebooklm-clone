import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SourcesService } from '../../../core/sources.service';
import { Source } from '../../../core/source.model';

@Component({
  selector: 'app-sources-panel',
  imports: [FormsModule],
  templateUrl: './sources-panel.component.html',
  styleUrl: './sources-panel.component.scss',
})
export class SourcesPanelComponent implements OnInit {
  @Input({ required: true }) notebookId!: string;

  private readonly sourcesService = inject(SourcesService);

  readonly sources = this.sourcesService.sources;
  readonly loading = this.sourcesService.loading;
  readonly error = this.sourcesService.error;
  readonly selectedId = computed(() => this.sourcesService.selected()?.id ?? null);

  readonly addingText = signal(false);
  readonly uploading = signal(false);
  readonly uploadProgress = signal<{ done: number; total: number } | null>(null);
  readonly formError = signal<string | null>(null);

  readonly textTitle = signal('');
  readonly textContent = signal('');
  readonly savingText = signal(false);

  readonly pendingDeleteId = signal<string | null>(null);

  ngOnInit(): void {
    this.sourcesService.loadAll(this.notebookId);
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) return;

    this.uploading.set(true);
    this.formError.set(null);
    const failed: string[] = [];

    for (let i = 0; i < files.length; i++) {
      this.uploadProgress.set({ done: i, total: files.length });
      try {
        await this.sourcesService.uploadFile(this.notebookId, files[i]);
      } catch (err) {
        failed.push(files[i].name);
      }
    }

    this.uploadProgress.set(null);
    this.uploading.set(false);
    if (failed.length > 0) {
      this.formError.set(`Fehlgeschlagen: ${failed.join(', ')}`);
    }
  }

  startAddText(): void {
    this.addingText.set(true);
    this.textTitle.set('');
    this.textContent.set('');
    this.formError.set(null);
  }

  cancelAddText(): void {
    this.addingText.set(false);
  }

  async submitText(): Promise<void> {
    const title = this.textTitle().trim();
    const content = this.textContent().trim();
    if (!title || !content || this.savingText()) return;

    this.savingText.set(true);
    this.formError.set(null);
    try {
      await this.sourcesService.addText(this.notebookId, title, content);
      this.addingText.set(false);
    } catch (err) {
      this.formError.set(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      this.savingText.set(false);
    }
  }

  select(source: Source): void {
    this.sourcesService.select(source.id);
  }

  askDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.pendingDeleteId.set(id);
  }

  cancelDelete(event: Event): void {
    event.stopPropagation();
    this.pendingDeleteId.set(null);
  }

  async confirmDelete(id: string, event: Event): Promise<void> {
    event.stopPropagation();
    await this.sourcesService.remove(this.notebookId, id);
    this.pendingDeleteId.set(null);
  }

  async toggleIncluded(source: Source, event: Event): Promise<void> {
    event.stopPropagation();
    const checked = (event.target as HTMLInputElement).checked;
    try {
      await this.sourcesService.setIncludedInChat(this.notebookId, source.id, checked);
    } catch (err) {
      this.formError.set(
        err instanceof Error ? err.message : 'Änderung konnte nicht gespeichert werden.',
      );
    }
  }
}
