import { Routes } from '@angular/router';
import { NotebookListComponent } from './features/notebook-list/notebook-list.component';
import { NotebookShellComponent } from './features/notebook-shell/notebook-shell.component';

export const routes: Routes = [
  { path: '', component: NotebookListComponent, title: 'Quellwerk' },
  {
    path: 'notebooks/:id',
    component: NotebookShellComponent,
    title: 'Notebook – Quellwerk',
  },
  { path: '**', redirectTo: '' },
];
