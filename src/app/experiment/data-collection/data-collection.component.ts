import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-data-collection',
  templateUrl: './data-collection.component.html',
}
)
export class DataCollectionComponent {
  currentTrial = 0;
  totalTrials = 3;
  trialCompletionTimes: number[] = []; // Stores completion times for each trial
  constructor(private router: Router, private route: ActivatedRoute) {}

  handleTrialCompletion(completionTime: number): void {
    this.trialCompletionTimes[this.currentTrial] = completionTime;
    console.log(completionTime);
    if (this.currentTrial < this.totalTrials - 1) {
      this.currentTrial++;
      // Optionally reset or reconfigure the TrialComponent for the next trial
    } else {
      // All trials completed, navigate or take further action
      this.router.navigate(['../questionary'], { relativeTo: this.route});
    }
  }
}
