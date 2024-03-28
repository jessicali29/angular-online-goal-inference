// Inside feedback.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-feedback',
  template: `<p>Feedback: Trial completed in {{ duration }} milliseconds.</p>`,
})
export class FeedbackComponent {
  @Input() duration!: number;
}
