import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Import components
import { ExperimentComponent } from './experiment/experiment.component';
import { InstructionComponent } from './experiment/instruction/instruction.component';
import { DataCollectionComponent } from './experiment/data-collection/data-collection.component';
import { QuestionaryComponent } from './experiment/questionary/questionary.component';

const routes: Routes = [
  { 
    path: 'experiment', 
    component: ExperimentComponent,
    children: [
      { path: 'instruction', component: InstructionComponent },
      { path: 'data-collection', component: DataCollectionComponent },
      { path: 'questionary', component: QuestionaryComponent },
      { path: '', redirectTo: 'instruction', pathMatch: 'full' }
    ] 
  },
  { path: '', redirectTo: '/experiment', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
