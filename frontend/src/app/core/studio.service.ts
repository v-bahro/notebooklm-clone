import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

interface SummaryResponse {
  summary: string;
  generatedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class StudioService {
  private readonly http = inject(HttpClient);

  private readonly _summary = signal<string | null>(null);
  private readonly _generatedAt = signal<Date | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly summary = computed(() => this._summary());
  readonly generatedAt = computed(() => this._generatedAt());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  private url(notebookId: string): string {
    return `${environment.apiBaseUrl}/notebooks/${notebookId}/summary`;
  }

  async loadSummary(notebookId: string): Promise<void> {
    try {
      const { summary, generatedAt } = await firstValueFrom(
        this.http.get<SummaryResponse>(this.url(notebookId)),
      );
      this._summary.set(summary || null);
      this._generatedAt.set(generatedAt ? new Date(generatedAt) : null);
    } catch {
      // Stiller Fehlschlag: die Zusammenfassung ist optional, das Panel
      // zeigt in diesem Fall einfach den "Erstellen"-Button.
    }
  }

  async generateSummary(notebookId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const { summary, generatedAt } = await firstValueFrom(
        this.http.post<SummaryResponse>(this.url(notebookId), {}),
      );
      this._summary.set(summary);
      this._generatedAt.set(generatedAt ? new Date(generatedAt) : null);
    } catch {
      this._error.set('Zusammenfassung konnte nicht erstellt werden.');
    } finally {
      this._loading.set(false);
    }
  }

  reset(): void {
    this._summary.set(null);
    this._generatedAt.set(null);
    this._error.set(null);
  }
}
