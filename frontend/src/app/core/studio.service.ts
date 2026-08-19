import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

interface SummaryResponse {
  summary: string;
}

@Injectable({ providedIn: 'root' })
export class StudioService {
  private readonly http = inject(HttpClient);

  private readonly _summary = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly summary = computed(() => this._summary());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  async generateSummary(notebookId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const { summary } = await firstValueFrom(
        this.http.post<SummaryResponse>(
          `${environment.apiBaseUrl}/notebooks/${notebookId}/summary`,
          {},
        ),
      );
      this._summary.set(summary);
    } catch {
      this._error.set('Zusammenfassung konnte nicht erstellt werden.');
    } finally {
      this._loading.set(false);
    }
  }

  reset(): void {
    this._summary.set(null);
    this._error.set(null);
  }
}
