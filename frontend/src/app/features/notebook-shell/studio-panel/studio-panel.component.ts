import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { StudioService } from '../../../core/studio.service';

@Component({
  selector: 'app-studio-panel',
  templateUrl: './studio-panel.component.html',
  styleUrl: './studio-panel.component.scss',
})
export class StudioPanelComponent implements OnInit, OnChanges {
  @Input({ required: true }) notebookId!: string;

  private readonly studioService = inject(StudioService);

  readonly summary = this.studioService.summary;
  readonly loading = this.studioService.loading;
  readonly error = this.studioService.error;
  readonly copied = signal(false);

  readonly summaryPoints = computed(() => {
    const text = this.summary();
    if (!text) return null;
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const bullets = lines
      .filter((line) => line.startsWith('- '))
      .map((line) => line.slice(2).trim());
    return bullets.length > 0 ? bullets : null;
  });

  ngOnInit(): void {
    void this.studioService.loadSummary(this.notebookId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notebookId'] && !changes['notebookId'].firstChange) {
      this.studioService.reset();
      void this.studioService.loadSummary(this.notebookId);
    }
  }

  generateSummary(): void {
    void this.studioService.generateSummary(this.notebookId);
  }

  async copySummary(): Promise<void> {
    const text = this.summary();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    } catch {
      // Clipboard-API kann in unsicheren Kontexten fehlen – kein Absturz.
    }
  }
}
