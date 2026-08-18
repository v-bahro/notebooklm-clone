import { Component } from '@angular/core';

interface PlannedOutput {
  label: string;
  note: string;
}

@Component({
  selector: 'app-studio-panel',
  templateUrl: './studio-panel.component.html',
  styleUrl: './studio-panel.component.scss',
})
export class StudioPanelComponent {
  readonly plannedOutputs: PlannedOutput[] = [
    { label: 'Zusammenfassung', note: 'folgt, sobald Quellen vorhanden sind' },
    { label: 'Audio Overview', note: 'geplant für eine spätere Phase' },
  ];
}
