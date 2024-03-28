import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-experiment',
  templateUrl: './experiment.component.html',
  styleUrls: ['./experiment.component.css']
})
export class ExperimentComponent {
  experimentStarted = false;

  constructor(private router: Router) { }

  startExperiment(): void {
    this.experimentStarted = true;
    this.router.navigate(['/experiment/instruction']);
  }
}
