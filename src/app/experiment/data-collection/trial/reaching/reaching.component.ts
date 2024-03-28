import { Component, Input, Output, EventEmitter,
   ElementRef, ViewChild, SimpleChanges, AfterViewInit, OnDestroy} from '@angular/core';


type Shape = 'circle' | 'square'; // Extend with more shapes as needed
type Color = 'red' | 'blue' | 'green' | 'purple'; // Define allowable colors

class Item {
  x: number;
  y: number;
  size: number;
  shape: Shape;
  color: Color;

  constructor(x: number, y: number, size: number, shape: Shape, color: Color) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.shape = shape;
    this.color = color;
  }

  isHovered(mouseX: number, mouseY: number): boolean {
    const distance = Math.sqrt((mouseX - this.x) ** 2 + (mouseY - this.y) ** 2);
    return distance < this.size / 2; // Assuming size as diameter for circles
  }

  render(ctx: CanvasRenderingContext2D, isHovered: boolean, isClicked: boolean): void {
    ctx.fillStyle = this.color;
    const finalSize = isHovered ? this.size * 1.3 : this.size;

    switch (this.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(this.x, this.y, finalSize / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'square':
        ctx.fillRect(this.x - finalSize / 2, this.y - finalSize / 2, finalSize, finalSize);
        break;
      // No need for default case if all shapes are covered
    }

    if (isClicked) {
      ctx.fillStyle = 'black'; // This could also be a type if you extend Color type
      ctx.beginPath();
      ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

@Component({
  selector: 'app-reaching',
  templateUrl: './reaching.component.html',
  styleUrl: './reaching.component.css'
})

export class ReachingComponent implements AfterViewInit, OnDestroy {
  @Input() trialNumber!: number;
  @Output() reachingFinished = new EventEmitter<number>();
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private items!: Item[];
  startTime: number = Date.now();

  constructor() {}

  ngAfterViewInit(): void {
    this.ctx = this.canvas.nativeElement.getContext('2d')!;
    this.setupNewItems(); // Initial setup if needed
    this.renderItems();
  }

  ngOnDestroy(): void {
    console.log("destroying");
  }

  setupNewItems(): void {
    this.items = [
      new Item(100, 100, 30, 'circle', this.getRandomColor()),
      new Item(200, 100, 40, 'square', this.getRandomColor()),
      new Item(300, 150, 50, 'circle', this.getRandomColor()),
      new Item(400, 200, 60, 'square', this.getRandomColor()),
    ];
  }

  renderItems(): void {
    this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height); // Clear canvas
    this.items.forEach(item => item.render(this.ctx, false, false));
  }

  getRandomColor(): Color {
    const colors: Color[] = ['red', 'blue', 'green', 'purple'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  finishReaching(): void {
    const endTime = Date.now();
    const duration = endTime - this.startTime; // Calculate duration
    this.reachingFinished.emit(duration); // Emit the duration
  }
}