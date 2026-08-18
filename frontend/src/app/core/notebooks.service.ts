import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notebook } from './notebook.model';

@Injectable({ providedIn: 'root' })
export class NotebooksService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/notebooks`;

  private readonly _notebooks = signal<Notebook[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly notebooks = computed(() => this._notebooks());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  async loadAll(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const notebooks = await firstValueFrom(
        this.http.get<Notebook[]>(this.baseUrl),
      );
      this._notebooks.set(notebooks);
    } catch {
      this._error.set(
        'Notebooks konnten nicht geladen werden. Läuft das Backend?',
      );
    } finally {
      this._loading.set(false);
    }
  }

  async create(title: string): Promise<Notebook> {
    const notebook = await firstValueFrom(
      this.http.post<Notebook>(this.baseUrl, { title }),
    );
    this._notebooks.update((all) => [notebook, ...all]);
    return notebook;
  }

  async rename(id: string, title: string): Promise<void> {
    const updated = await firstValueFrom(
      this.http.patch<Notebook>(`${this.baseUrl}/${id}`, { title }),
    );
    this._notebooks.update((all) =>
      all.map((n) => (n.id === id ? updated : n)),
    );
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
    this._notebooks.update((all) => all.filter((n) => n.id !== id));
  }

  async getOne(id: string): Promise<Notebook> {
    return firstValueFrom(this.http.get<Notebook>(`${this.baseUrl}/${id}`));
  }
}
