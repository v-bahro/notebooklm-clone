import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChatMessage } from './message.model';

interface AskResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);

  private readonly _messages = signal<ChatMessage[]>([]);
  private readonly _loadingHistory = signal(false);
  private readonly _sending = signal(false);
  private readonly _error = signal<string | null>(null);

  // Verhindert, dass die Antwort auf eine Frage aus Notizbuch A im Chat von
  // Notizbuch B landet, falls der Request noch läuft, während man wechselt.
  private activeNotebookId: string | null = null;

  readonly messages = computed(() => this._messages());
  readonly loadingHistory = computed(() => this._loadingHistory());
  readonly sending = computed(() => this._sending());
  readonly error = computed(() => this._error());

  private baseUrl(notebookId: string): string {
    return `${environment.apiBaseUrl}/notebooks/${notebookId}/messages`;
  }

  async loadHistory(notebookId: string): Promise<void> {
    this.activeNotebookId = notebookId;
    this._loadingHistory.set(true);
    this._error.set(null);
    try {
      const messages = await firstValueFrom(
        this.http.get<ChatMessage[]>(this.baseUrl(notebookId)),
      );
      if (this.activeNotebookId === notebookId) {
        this._messages.set(messages);
      }
    } catch {
      if (this.activeNotebookId === notebookId) {
        this._error.set('Chatverlauf konnte nicht geladen werden.');
      }
    } finally {
      if (this.activeNotebookId === notebookId) {
        this._loadingHistory.set(false);
      }
    }
  }

  async ask(notebookId: string, question: string): Promise<void> {
    this._sending.set(true);
    this._error.set(null);
    try {
      const { userMessage, assistantMessage } = await firstValueFrom(
        this.http.post<AskResponse>(this.baseUrl(notebookId), { question }),
      );
      if (this.activeNotebookId === notebookId) {
        this._messages.update((all) => [...all, userMessage, assistantMessage]);
      }
    } catch {
      if (this.activeNotebookId === notebookId) {
        this._error.set('Nachricht konnte nicht gesendet werden.');
      }
    } finally {
      if (this.activeNotebookId === notebookId) {
        this._sending.set(false);
      }
    }
  }

  reset(): void {
    this._messages.set([]);
    this._error.set(null);
  }
}
