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
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.uploading.set(true);
    this.formError.set(null);
    try {
      await this.sourcesService.uploadFile(this.notebookId, file);
    } catch (err) {
      this.formError.set(err instanceof Error ? err.message : 'Upload fehlgeschlagen.');
    } finally {
      this.uploading.set(false);
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
}
