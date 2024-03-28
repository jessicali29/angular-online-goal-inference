import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { timer } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-trial',
  templateUrl: './trial.component.html',
  styleUrls: ['./trial.component.css']
})
export class TrialComponent implements OnChanges {
  @Input() trialNumber!: number;
  @Output() trialCompleted = new EventEmitter<number>();

  constructor(private router: Router, private route: ActivatedRoute) {}
  // Represents the current phase of the trial
  phase: 'Fixation' | 'Reaching' | 'Feedback' = 'Fixation';
  startTime!: number ;
  endTime!: number;
  duration!: number;

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['trialNumber']){
      this.resetTrial();
    }
  }

  resetTrial():void{
    this.phase = "Fixation";
    this.showFixation();
  }

  showFixation(): void {
      timer(2000).subscribe(() => {
        this.phase = 'Reaching'; // Automatically transition from fixation to reaching
        this.startTime = Date.now();
      });
  }

  showFeedback(reachingTime:number): void {
    this.duration = reachingTime;
    this.phase = 'Feedback';
    console.log(this.duration);
    // Feedback phase lasts 1 second before completing the trial
    timer(1000).subscribe(() => this.completeTrial());
  }

  completeTrial(): void {
    console.log("completing a trial")
    this.phase = 'Fixation'; // Reset for the next trial or handle differently if needed
    this.trialCompleted.emit(this.duration); // Emit the duration of the reaching phase
  }
}
