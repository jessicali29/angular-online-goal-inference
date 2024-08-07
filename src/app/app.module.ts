import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ExperimentComponent } from './experiment/experiment.component';
import { InstructionComponent } from './experiment/instruction/instruction.component';
import { DataCollectionComponent } from './experiment/data-collection/data-collection.component';
import { TrialComponent } from './experiment/data-collection/trial/trial.component';
import { FixationComponent } from './experiment/data-collection/trial/fixation/fixation.component';
import { ReachingComponent } from './experiment/data-collection/trial/reaching/reaching.component';
import { FeedbackComponent } from './experiment/data-collection/trial/feedback/feedback.component';
import { QuestionaryComponent } from './experiment/questionary/questionary.component';

@NgModule({
  declarations: [
    AppComponent,
    ExperimentComponent,
    InstructionComponent,
    DataCollectionComponent,
    TrialComponent,
    FixationComponent,
    ReachingComponent,
    FeedbackComponent,
    QuestionaryComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
