import { Routes } from '@angular/router';
import { TrialComponent } from './trial/trial.component';

export const routes: Routes = [
  { path: 'trial/:id', component: TrialComponent },
  { path: '', redirectTo: '/trial/1', pathMatch: 'full' },
  { path: '**', redirectTo: '/trial/1' }
];
