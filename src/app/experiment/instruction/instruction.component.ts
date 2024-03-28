import { Component } from '@angular/core';
import { Router, ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-instruction',
  templateUrl: './instruction.component.html',
  styleUrls: ['./instruction.component.css']
})
export class InstructionComponent {
  currentPage = 0; // To track the current instruction page
  instructions = [
    'Instruction for page 1: Lorem ipsum dolor sit amet...',
    'Instruction for page 2: Consectetur adipiscing elit...',
    'Instruction for page 3: Sed do eiusmod tempor incididunt...'
  ];

  constructor(private router: Router, private route: ActivatedRoute) { }

  nextPage(): void {
    if (this.currentPage < this.instructions.length - 1) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  nextSection(): void {
    this.router.navigate(['../data-collection'], {relativeTo: this.route}); // Adjust the route as needed
  }
}
