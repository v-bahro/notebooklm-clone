import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Source } from './source.model';

@Injectable({ providedIn: 'root' })
export class SourcesService {
  private readonly http = inject(HttpClient);

  private readonly _sources = signal<Source[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedId = signal<string | null>(null);
  private readonly _highlightRange = signal<{ start: number; end: number } | null>(null);

  readonly sources = computed(() => this._sources());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly selected = computed(
    () => this._sources().find((s) => s.id === this._selectedId()) ?? null,
  );
  readonly highlightRange = computed(() => this._highlightRange());

  private baseUrl(notebookId: string): string {
    return `${environment.apiBaseUrl}/notebooks/${notebookId}/sources`;
  }

  async loadAll(notebookId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._selectedId.set(null);
    this._highlightRange.set(null);
    try {
      const sources = await firstValueFrom(
        this.http.get<Source[]>(this.baseUrl(notebookId)),
      );
      this._sources.set(sources);
    } catch {
      this._error.set('Quellen konnten nicht geladen werden.');
    } finally {
      this._loading.set(false);
    }
  }

  async uploadFile(notebookId: string, file: File): Promise<void> {
    const form = new FormData();
    form.append('file', file);
    try {
      const source = await firstValueFrom(
        this.http.post<Source>(`${this.baseUrl(notebookId)}/upload`, form),
      );
      this._sources.update((all) => [source, ...all]);
    } catch (err) {
      throw new Error(this.extractMessage(err, 'Datei konnte nicht hochgeladen werden.'));
    }
  }

  async addText(notebookId: string, title: string, content: string): Promise<void> {
    try {
      const source = await firstValueFrom(
        this.http.post<Source>(`${this.baseUrl(notebookId)}/text`, { title, content }),
      );
      this._sources.update((all) => [source, ...all]);
    } catch (err) {
      throw new Error(this.extractMessage(err, 'Text konnte nicht gespeichert werden.'));
    }
  }

  async remove(notebookId: string, id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl(notebookId)}/${id}`));
    this._sources.update((all) => all.filter((s) => s.id !== id));
    if (this._selectedId() === id) {
      this._selectedId.set(null);
    }
  }

  select(id: string): void {
    this._highlightRange.set(null);
    this._selectedId.update((current) => (current === id ? null : id));
  }

  selectWithHighlight(sourceId: string, start: number, end: number): void {
    this._selectedId.set(sourceId);
    this._highlightRange.set({ start, end });
  }

  clearSelection(): void {
    this._selectedId.set(null);
    this._highlightRange.set(null);
  }

  private extractMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const message = err.error?.message;
      if (typeof message === 'string') return message;
      if (Array.isArray(message) && message.length > 0) return message[0];
    }
    return fallback;
  }
}
