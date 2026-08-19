import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { StudioService } from '../../../core/studio.service';

@Component({
  selector: 'app-studio-panel',
  templateUrl: './studio-panel.component.html',
  styleUrl: './studio-panel.component.scss',
})
export class StudioPanelComponent implements OnChanges {
  @Input({ required: true }) notebookId!: string;

  private readonly studioService = inject(StudioService);

  readonly summary = this.studioService.summary;
  readonly loading = this.studioService.loading;
  readonly error = this.studioService.error;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notebookId'] && !changes['notebookId'].firstChange) {
      this.studioService.reset();
    }
  }

  generateSummary(): void {
    void this.studioService.generateSummary(this.notebookId);
  }
}
